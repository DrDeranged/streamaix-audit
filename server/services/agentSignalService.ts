/**
 * Agent Signals — agents publish structured trade THESES on real assets.
 *
 * Dormant by default: SIGNALS_ENABLED=false makes publication a no-op and
 * every public route 403 (same fail-closed discipline as the bridge and the
 * swap rail). NO auto-execution anywhere: signals are observations with
 * evidence and an invalidation condition; only users trade, wallet-signed,
 * through the swap rail with explicit confirmation.
 */

import { db } from "../db";
import { agentSignals, knowledgeAvatars, tradeableTokens, type AgentSignal } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import {
  MAX_SIGNALS_PER_CYCLE,
  HORIZON_HOURS,
  type TimeHorizon,
  type SignalDirection,
  validateSignalPayload,
  resolveSignalOutcome,
} from "@shared/agentSignals";
import { modelGateway } from "../lib/modelGateway";
import { marketDataService, type CryptoQuote } from "./marketDataService";
import { jobScheduler } from "../jobs/scheduler";

export function signalsEnabled(): boolean {
  return process.env.SIGNALS_ENABLED === "true";
}

export class SignalsDisabledError extends Error {
  constructor() {
    super("Agent signals are not yet enabled");
    this.name = "SignalsDisabledError";
  }
}

function assertSignalsEnabled(): void {
  if (!signalsEnabled()) throw new SignalsDisabledError();
}

/** Allowlist symbols whose market data lives under a different ticker. */
const QUOTE_SYMBOL_MAP: Record<string, string> = { WETH: "ETH", cbBTC: "BTC" };
/** Symbols that make no sense to publish theses on. */
const EXCLUDED_SIGNAL_TOKENS = new Set(["USDC", "WETH"]);

const SYSTEM_PROMPT = `You are a market analyst persona publishing OBSERVATIONAL trade theses.
STRICT COMPLIANCE RULES:
- You are NOT an advisor. NEVER instruct the reader. Banned: "buy", "sell",
  imperatives ("get in", "take profit", "load up", "act now"), "you should/must/need to",
  certainty claims ("guaranteed", "can't lose").
- Use observational framing only: describe what the data shows and what would
  invalidate your read ("Momentum has cooled while exchange inflows rose...").
- ABSTAINING IS EXPECTED. If the evidence is not clearly interesting, abstain.
- thesis: at most 80 words. invalidation: one sentence starting from the idea
  "this thesis is wrong if...". confidence: honest 0-1, not inflated.`;

interface ModelSignalOutput {
  abstain?: boolean;
  signals?: Array<{
    token: string;
    direction: string;
    thesis: string;
    confidence: number;
    keyEvidence: string[];
    invalidation: string;
    timeHorizon: string;
  }>;
}

export class AgentSignalService {
  /** Injectable for tests. */
  completeJson: (req: any) => Promise<ModelSignalOutput> = (req) => modelGateway.completeJson(req);
  getQuotes: (symbols: string[]) => Promise<CryptoQuote[]> = (symbols) =>
    marketDataService.getCryptoQuotes(symbols);
  now: () => Date = () => new Date();

  /**
   * One generation cycle: top-ranked agents analyze allowlisted tokens and
   * may publish at most MAX_SIGNALS_PER_CYCLE signals platform-wide.
   * No-op (returns []) while SIGNALS_ENABLED is off.
   */
  async generateSignals(): Promise<AgentSignal[]> {
    if (!signalsEnabled()) return [];

    const agents = await db
      .select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true))
      .orderBy(desc(knowledgeAvatars.winRate))
      .limit(4);
    if (agents.length === 0) return [];

    const allTokens = await db.select().from(tradeableTokens).where(eq(tradeableTokens.enabled, true));
    const signalTokens = allTokens.filter((t) => !EXCLUDED_SIGNAL_TOKENS.has(t.symbol));
    if (signalTokens.length === 0) return [];

    const quoteSymbols = Array.from(new Set(signalTokens.map((t) => QUOTE_SYMBOL_MAP[t.symbol] ?? t.symbol)));
    const quotes = await this.getQuotes(quoteSymbols);
    const quoteBySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const published: AgentSignal[] = [];
    for (const agent of agents) {
      if (published.length >= MAX_SIGNALS_PER_CYCLE) break;
      const remaining = MAX_SIGNALS_PER_CYCLE - published.length;
      try {
        const out = await this.askAgent(agent, signalTokens, quoteBySymbol, remaining);
        if (!out?.signals?.length || out.abstain) continue;
        for (const raw of out.signals.slice(0, remaining)) {
          const errors = validateSignalPayload(raw);
          const token = signalTokens.find((t) => t.symbol === raw.token);
          if (!token) errors.push(`token ${raw.token} not on allowlist`);
          const quote = token
            ? quoteBySymbol.get((QUOTE_SYMBOL_MAP[token.symbol] ?? token.symbol).toUpperCase())
            : undefined;
          if (!quote || !(quote.price > 0)) errors.push("no live entry price available");
          if (errors.length > 0) {
            console.warn(`[signals] rejected signal from ${agent.name}:`, errors.join("; "));
            continue;
          }
          const [row] = await db
            .insert(agentSignals)
            .values({
              agentId: agent.id,
              token: raw.token,
              direction: raw.direction as SignalDirection,
              thesis: raw.thesis.trim(),
              confidence: raw.confidence,
              keyEvidence: raw.keyEvidence,
              invalidation: raw.invalidation.trim(),
              timeHorizon: raw.timeHorizon,
              entryPrice: quote!.price,
              status: "open",
            })
            .returning();
          published.push(row);
          if (published.length >= MAX_SIGNALS_PER_CYCLE) break;
        }
      } catch (err: any) {
        console.warn(`[signals] agent ${agent.name} cycle failed:`, err?.message || err);
      }
    }
    if (published.length > 0) console.log(`[signals] published ${published.length} signal(s)`);
    return published;
  }

  private async askAgent(
    agent: any,
    tokens: Array<{ symbol: string; name: string }>,
    quoteBySymbol: Map<string, CryptoQuote>,
    maxSignals: number
  ): Promise<ModelSignalOutput | null> {
    const marketLines = tokens
      .map((t) => {
        const q = quoteBySymbol.get((QUOTE_SYMBOL_MAP[t.symbol] ?? t.symbol).toUpperCase());
        if (!q) return `${t.symbol}: no data`;
        return `${t.symbol} (${t.name}): $${q.price} | 24h ${fmtPct(q.percentChange24h)} | 7d ${fmtPct(q.percentChange7d)} | 30d ${fmtPct(q.percentChange30d)}`;
      })
      .join("\n");

    const user = `You are "${agent.name}" (${agent.expertise || agent.category || "markets"}; style: ${agent.tradingStyle || "generalist"}; bias: ${agent.decisionBias || "balanced"}).
Track record: ${agent.totalTrades || 0} simulated trades, win rate ${Math.round((agent.winRate || 0) * 100) / 100}%.

Current market data for the tradeable allowlist:
${marketLines}

Publish at most ${maxSignals} signal(s) — ONLY where the evidence is genuinely interesting. Otherwise abstain.
Respond with JSON only:
{"abstain": boolean, "signals": [{"token": "<one of ${tokens.map((t) => t.symbol).join("|")}>", "direction": "accumulate|reduce|neutral", "thesis": "<=80 words observational", "confidence": 0-1, "keyEvidence": ["..."], "invalidation": "this thesis is wrong if ...", "timeHorizon": "24h|3d|7d"}]}`;

    return this.completeJson({
      tier: "reasoning",
      system: SYSTEM_PROMPT,
      user,
      temperature: 0.6,
      maxTokens: 1200,
      jsonSchema: {
        name: "agent_signals",
        schema: {
          type: "object",
          properties: {
            abstain: { type: "boolean" },
            signals: { type: "array" },
          },
        },
      },
    });
  }

  /**
   * Daily resolution: mark open signals past their horizon as resolved
   * against real market prices, computing the hypothetical return.
   * Runs regardless of the flag so past signals still settle if the flag
   * is later turned off, but is a no-op when nothing is open.
   */
  async resolveDueSignals(): Promise<AgentSignal[]> {
    const open = await db.select().from(agentSignals).where(eq(agentSignals.status, "open"));
    const now = this.now().getTime();
    const due = open.filter((s) => {
      const hours = HORIZON_HOURS[s.timeHorizon as TimeHorizon] ?? 24;
      const created = s.createdAt ? new Date(s.createdAt).getTime() : now;
      return created + hours * 3_600_000 <= now;
    });
    if (due.length === 0) return [];

    const symbols = Array.from(new Set(due.map((s) => QUOTE_SYMBOL_MAP[s.token] ?? s.token)));
    const quotes = await this.getQuotes(symbols);
    const quoteBySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const resolved: AgentSignal[] = [];
    for (const s of due) {
      const q = quoteBySymbol.get((QUOTE_SYMBOL_MAP[s.token] ?? s.token).toUpperCase());
      if (!q || !(q.price > 0)) {
        console.warn(`[signals] no resolve price for ${s.token}; leaving open`);
        continue;
      }
      const outcome = resolveSignalOutcome(s.direction as SignalDirection, s.entryPrice, q.price);
      const [row] = await db
        .update(agentSignals)
        .set({
          status: "resolved",
          resolvePrice: q.price,
          hypotheticalReturnPct: outcome.hypotheticalReturnPct,
          correct: outcome.correct,
          resolvedAt: this.now(),
        })
        .where(eq(agentSignals.id, s.id))
        .returning();
      resolved.push(row);
    }
    if (resolved.length > 0) console.log(`[signals] resolved ${resolved.length} signal(s)`);
    return resolved;
  }

  /** Real-market signal accuracy per agent (from resolved signals only). */
  async getRealMarketAccuracy(agentId: string): Promise<{ resolved: number; correct: number; accuracyPct: number | null; avgReturnPct: number | null }> {
    const rows = await db
      .select()
      .from(agentSignals)
      .where(and(eq(agentSignals.agentId, agentId), eq(agentSignals.status, "resolved")));
    if (rows.length === 0) return { resolved: 0, correct: 0, accuracyPct: null, avgReturnPct: null };
    const correct = rows.filter((r) => r.correct).length;
    const avg = rows.reduce((a, r) => a + (r.hypotheticalReturnPct ?? 0), 0) / rows.length;
    return {
      resolved: rows.length,
      correct,
      accuracyPct: Math.round((correct / rows.length) * 1000) / 10,
      avgReturnPct: Math.round(avg * 100) / 100,
    };
  }
}

function fmtPct(n: number | null | undefined): string {
  return n === null || n === undefined ? "n/a" : `${n >= 0 ? "+" : ""}${Math.round(n * 100) / 100}%`;
}

export const agentSignalService = new AgentSignalService();

/** Register scheduler jobs (all background work goes through jobScheduler). */
export function registerAgentSignalJobs(): void {
  jobScheduler.register(
    "agent-signals-generate",
    30 * 60 * 1000,
    () => agentSignalService.generateSignals(),
    { jitterMs: 5 * 60 * 1000 }
  );
  jobScheduler.register(
    "agent-signals-resolve",
    24 * 60 * 60 * 1000,
    () => agentSignalService.resolveDueSignals(),
    { jitterMs: 30 * 60 * 1000 }
  );
}
