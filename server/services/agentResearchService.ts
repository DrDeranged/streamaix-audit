import { db } from "../db";
import { agentMemory, type AgentMemory, type PredictionMarket } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { cacheService } from "./cacheService";

/**
 * Agent Research Service
 *
 * Assembles grounded research context for AI agent trading decisions and
 * maintains per-agent memory (track record) across resolved markets.
 *
 * Design constraints:
 * - buildResearchContext has a hard 10s total budget; every source is wrapped
 *   in Promise.allSettled so missing/slow sources degrade gracefully.
 * - Assembled context is cached per market for 15 minutes.
 */

const CONTEXT_TTL_SECONDS = 15 * 60;
const TOTAL_BUDGET_MS = 10_000;

export interface ResearchAssetPrice {
  symbol: string;
  price: number;
  percentChange24h: number;
  percentChange7d: number | null;
}

export interface ResearchHeadline {
  title: string;
  source: string;
  published: string;
}

export interface ResearchContext {
  marketId: string;
  assetPrices: ResearchAssetPrice[];
  headlines: ResearchHeadline[];
  stockMacroContext: string | null;
  amm: {
    yesPrice: number;
    noPrice: number;
    totalLiquidity: number;
    volume24h: number;
  };
  sourcesUsed: string[];
  sourcesFailed: string[];
  assembledAt: string;
}

export interface AgentTrackRecord {
  decisions: AgentMemory[];
  wins: number;
  losses: number;
  open: number;
  winRate: number | null; // null when no resolved decisions
  netPnl: number;
  worstRecentCall: AgentMemory | null;
}

/** Known crypto symbols we can match from market tags/tickers. */
const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK", "MATIC",
  "UNI", "LTC", "ATOM", "NEAR", "APT", "ARB", "OP", "SUI", "PEPE", "SHIB", "BNB", "TON",
]);

const NAME_TO_SYMBOL: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", cardano: "ADA",
  dogecoin: "DOGE", avalanche: "AVAX", polkadot: "DOT", chainlink: "LINK",
  polygon: "MATIC", uniswap: "UNI", litecoin: "LTC", cosmos: "ATOM",
};

function withBudget<T>(promise: Promise<T>, deadlineAt: number, label: string): Promise<T> {
  const remaining = Math.max(0, deadlineAt - Date.now());
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`research source "${label}" timed out`)),
      remaining,
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export class AgentResearchService {
  /** Extract candidate asset symbols from a market's ticker/tags/question. */
  extractSymbols(market: PredictionMarket): string[] {
    const found = new Set<string>();
    const consider = (raw: string | null | undefined) => {
      if (!raw) return;
      const upper = raw.toUpperCase().trim();
      if (CRYPTO_SYMBOLS.has(upper)) found.add(upper);
      const mapped = NAME_TO_SYMBOL[raw.toLowerCase().trim()];
      if (mapped) found.add(mapped);
    };
    consider(market.ticker);
    for (const tag of market.tags ?? []) consider(tag);
    for (const word of (market.question ?? "").split(/[^A-Za-z]+/)) consider(word);
    return Array.from(found).slice(0, 5);
  }

  /**
   * Build (or return cached) research context for a market.
   * Never throws for missing sources — they are reported in sourcesFailed.
   */
  async buildResearchContext(market: PredictionMarket): Promise<ResearchContext> {
    const cacheKey = `agent-research:${market.id}`;
    const cached = cacheService.get<ResearchContext>(cacheKey);
    if (cached) return cached;

    const deadlineAt = Date.now() + TOTAL_BUDGET_MS;
    const category = (market.category ?? "").toLowerCase();
    const isStockOrMacro =
      category.includes("stock") || category.includes("macro") ||
      category.includes("econom") || category.includes("tech");

    const symbols = this.extractSymbols(market);

    // Lazy imports keep module load light and make mocking easy in tests.
    const pricesTask = (async (): Promise<ResearchAssetPrice[]> => {
      if (symbols.length === 0) return [];
      const { marketDataService } = await import("./marketDataService");
      const quotes = await marketDataService.getCryptoQuotes(symbols);
      return (quotes ?? []).map((q: any) => ({
        symbol: q.symbol,
        price: q.price,
        percentChange24h: q.percentChange24h,
        percentChange7d: q.percentChange7d ?? null,
      }));
    })();

    const newsTask = (async (): Promise<ResearchHeadline[]> => {
      const { newsService } = await import("./newsService");
      const [crypto, macro] = await Promise.all([
        newsService.getCryptoNews(15),
        isStockOrMacro ? newsService.getMacroNews(15) : Promise.resolve([]),
      ]);
      const all = [...(crypto ?? []), ...(macro ?? [])];
      const keywords = new Set(
        [
          ...(market.tags ?? []),
          ...symbols,
          ...(market.question ?? "").split(/\W+/).filter((w) => w.length > 3),
        ].map((k) => k.toLowerCase()),
      );
      const scored = all.map((a: any) => {
        const text = `${a.title} ${a.summary ?? ""}`.toLowerCase();
        let score = 0;
        for (const kw of keywords) if (text.includes(kw)) score++;
        return { article: a, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored
        .filter((s) => s.score > 0)
        .concat(scored.filter((s) => s.score === 0)) // pad with general news if few matches
        .slice(0, 5)
        .map((s) => ({
          title: s.article.title,
          source: s.article.source,
          published: s.article.published,
        }));
    })();

    const stockMacroTask = (async (): Promise<string | null> => {
      if (!isStockOrMacro) return null;
      const parts: string[] = [];
      const { stockMarketService } = await import("./stockMarketService");
      const { macroDataService } = await import("./macroDataService");
      const [movers, fearGreed] = await Promise.allSettled([
        stockMarketService.getTechAiMovers(),
        macroDataService.getFearGreedIndex(),
      ]);
      if (movers.status === "fulfilled" && movers.value) {
        const g = (movers.value.gainers ?? []).slice(0, 3)
          .map((m: any) => `${m.symbol} +${m.percentChange?.toFixed?.(1) ?? m.percentChange}%`).join(", ");
        const l = (movers.value.losers ?? []).slice(0, 3)
          .map((m: any) => `${m.symbol} ${m.percentChange?.toFixed?.(1) ?? m.percentChange}%`).join(", ");
        if (g || l) parts.push(`Tech movers — gainers: ${g || "n/a"}; losers: ${l || "n/a"}`);
      }
      if (fearGreed.status === "fulfilled" && fearGreed.value) {
        const fg: any = fearGreed.value;
        parts.push(`Fear & Greed: ${fg.value ?? fg.score ?? "n/a"} (${fg.classification ?? fg.label ?? ""})`);
      }
      return parts.length ? parts.join(" | ") : null;
    })();

    const labeled: Array<[string, Promise<any>]> = [
      ["assetPrices", pricesTask],
      ["headlines", newsTask],
      ["stockMacro", stockMacroTask],
    ];

    const settled = await Promise.allSettled(
      labeled.map(([label, p]) => withBudget(p, deadlineAt, label)),
    );

    const sourcesUsed: string[] = [];
    const sourcesFailed: string[] = [];
    const valueOf = <T,>(idx: number, fallback: T): T => {
      const r = settled[idx];
      const label = labeled[idx][0];
      if (r.status === "fulfilled") {
        sourcesUsed.push(label);
        return r.value as T;
      }
      sourcesFailed.push(label);
      console.warn(`[AgentResearch] source "${label}" unavailable for market ${market.id}: ${r.reason?.message ?? r.reason}`);
      return fallback;
    };

    const context: ResearchContext = {
      marketId: market.id,
      assetPrices: valueOf<ResearchAssetPrice[]>(0, []),
      headlines: valueOf<ResearchHeadline[]>(1, []),
      stockMacroContext: valueOf<string | null>(2, null),
      amm: {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        totalLiquidity: (market.yesLiquidity ?? 0) + (market.noLiquidity ?? 0),
        volume24h: market.totalVolume ?? 0,
      },
      sourcesUsed,
      sourcesFailed,
      assembledAt: new Date().toISOString(),
    };

    cacheService.set(cacheKey, context, CONTEXT_TTL_SECONDS);
    return context;
  }

  /** Render research context as a compact prompt block. */
  formatContextForPrompt(ctx: ResearchContext): string {
    const lines: string[] = ["=== RESEARCH CONTEXT ==="];
    if (ctx.assetPrices.length) {
      lines.push("Asset prices:");
      for (const p of ctx.assetPrices) {
        lines.push(
          `- ${p.symbol}: $${p.price} (24h ${p.percentChange24h >= 0 ? "+" : ""}${p.percentChange24h?.toFixed?.(2)}%` +
          (p.percentChange7d != null ? `, 7d ${p.percentChange7d >= 0 ? "+" : ""}${p.percentChange7d.toFixed(2)}%` : "") + ")",
        );
      }
    } else {
      lines.push("Asset prices: unavailable");
    }
    if (ctx.headlines.length) {
      lines.push("Recent headlines:");
      for (const h of ctx.headlines) lines.push(`- [${h.source}] ${h.title} (${h.published})`);
    } else {
      lines.push("Recent headlines: unavailable");
    }
    if (ctx.stockMacroContext) lines.push(`Stock/macro context: ${ctx.stockMacroContext}`);
    lines.push(
      `AMM state: YES ${(ctx.amm.yesPrice / 100).toFixed(2)}% / NO ${(ctx.amm.noPrice / 100).toFixed(2)}%, ` +
      `liquidity ${ctx.amm.totalLiquidity}, volume ${ctx.amm.volume24h}`,
    );
    if (ctx.sourcesFailed.length) {
      lines.push(`NOTE: unavailable sources: ${ctx.sourcesFailed.join(", ")}. If the remaining evidence is insufficient, ABSTAIN.`);
    }
    return lines.join("\n");
  }

  /** Record a decision at trade time. */
  async recordDecision(entry: {
    agentId: string;
    marketId: string;
    decision: "YES" | "NO";
    confidence: number; // 0-1
    stake: number;
    reasoningSummary: string;
  }): Promise<void> {
    await db.insert(agentMemory).values({
      agentId: entry.agentId,
      marketId: entry.marketId,
      decision: entry.decision,
      confidence: entry.confidence,
      stake: Math.round(entry.stake),
      outcome: "open",
      reasoningSummary: entry.reasoningSummary.slice(0, 500),
    });
  }

  /** Settle open memories when a market resolves. Best-effort; never throws. */
  async settleMemoriesForMarket(marketId: string, resolution: string): Promise<void> {
    try {
      const res = resolution.toUpperCase(); // YES | NO | INVALID
      const open = await db
        .select()
        .from(agentMemory)
        .where(and(eq(agentMemory.marketId, marketId), eq(agentMemory.outcome, "open")));

      for (const mem of open) {
        if (res !== "YES" && res !== "NO") {
          // Invalid market: neutral outcome — excluded from win/loss stats, zero pnl.
          await db.update(agentMemory)
            .set({ outcome: "invalid", pnl: 0, resolvedAt: new Date() })
            .where(eq(agentMemory.id, mem.id));
          continue;
        }
        const won = mem.decision === res;
        const pnl = won ? mem.stake : -mem.stake;
        await db.update(agentMemory)
          .set({ outcome: won ? "won" : "lost", pnl, resolvedAt: new Date() })
          .where(eq(agentMemory.id, mem.id));
      }
      if (open.length) {
        console.log(`[AgentMemory] settled ${open.length} agent memories for market ${marketId} (${res})`);
      }
    } catch (error) {
      console.error(`[AgentMemory] failed to settle memories for market ${marketId}:`, error);
    }
  }

  /** Last 10 decisions + aggregate win rate + pnl. */
  async getAgentTrackRecord(agentId: string): Promise<AgentTrackRecord> {
    const decisions = await db
      .select()
      .from(agentMemory)
      .where(eq(agentMemory.agentId, agentId))
      .orderBy(desc(agentMemory.createdAt))
      .limit(10);

    const wins = decisions.filter((d) => d.outcome === "won").length;
    const losses = decisions.filter((d) => d.outcome === "lost").length;
    const open = decisions.filter((d) => d.outcome === "open").length;
    const resolvedCount = wins + losses;
    const netPnl = decisions.reduce((sum, d) => sum + (d.pnl ?? 0), 0);
    const worstRecentCall = decisions
      .filter((d) => d.outcome === "lost")
      .sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0))[0] ?? null;

    return {
      decisions,
      wins,
      losses,
      open,
      winRate: resolvedCount > 0 ? wins / resolvedCount : null,
      netPnl,
      worstRecentCall,
    };
  }

  /** Render a track record as prompt text for the agent's system message. */
  formatTrackRecordForPrompt(record: AgentTrackRecord): string {
    if (record.decisions.length === 0) {
      return "You have no trading history yet. Be appropriately humble about your edge.";
    }
    const parts = [
      `Your last ${record.decisions.length} trades: ${record.wins} won, ${record.losses} lost` +
      (record.open ? ` (${record.open} still open)` : "") +
      `, net ${record.netPnl >= 0 ? "+" : ""}${record.netPnl} points.`,
    ];
    if (record.winRate != null) {
      parts.push(`Resolved win rate: ${(record.winRate * 100).toFixed(0)}%.`);
    }
    if (record.worstRecentCall) {
      const w = record.worstRecentCall;
      parts.push(
        `Your worst recent call: ${w.decision} at ${(w.confidence * 100).toFixed(0)}% confidence ` +
        `(${w.pnl} points). Reasoning then: "${(w.reasoningSummary ?? "").slice(0, 200)}"`,
      );
    }
    parts.push("Adapt: if you have been overconfident or losing, tighten your standards and abstain more.");
    return parts.join(" ");
  }
}

export const agentResearchService = new AgentResearchService();
