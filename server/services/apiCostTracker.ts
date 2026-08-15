/**
 * API Cost Tracker Service
 * Tracks API usage and costs across all external services
 */

interface ApiCall {
  service: string;
  endpoint: string;
  timestamp: Date;
  cost: number;
  tokens?: number;
  model?: string;
}

interface ServiceCosts {
  coingecko: { calls: number; cost: number };
  finnhub: { calls: number; cost: number };
  resend: { emails: number; cost: number };
  dune: { calls: number; cost: number };
  coinmarketcap: { calls: number; cost: number };
}

interface CostSummary {
  currentMonth: {
    total: number;
    breakdown: Record<string, number>;
  };
  projectedMonth: number;
  lastUpdated: Date;
  services: ServiceCosts;
}

class ApiCostTracker {
  private costs: ServiceCosts;
  private monthStart: Date;
  private recentCalls: ApiCall[] = [];

  // Pricing (as of 2024)
  private pricing = {
    coingecko: 0, // Pro plan is $129/month fixed
    finnhub: 0, // Free tier
    resend: 0.001, // ~$1 per 1000 emails
    dune: 0, // Depends on plan
    coinmarketcap: 0 // Free tier
  };

  constructor() {
    this.monthStart = new Date();
    this.monthStart.setDate(1);
    this.monthStart.setHours(0, 0, 0, 0);
    
    this.costs = this.getEmptyCosts();
    this.loadFromStorage();
  }

  private getEmptyCosts(): ServiceCosts {
    return {
      coingecko: { calls: 0, cost: 0 },
      finnhub: { calls: 0, cost: 0 },
      resend: { emails: 0, cost: 0 },
      dune: { calls: 0, cost: 0 },
      coinmarketcap: { calls: 0, cost: 0 }
    };
  }

  private loadFromStorage(): void {
    // In production, this would load from database
    // For now, we track in-memory with estimates based on replit.md
  }

  private checkMonthReset(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const storedMonth = this.monthStart.getMonth();
    
    if (currentMonth !== storedMonth) {
      this.costs = this.getEmptyCosts();
      this.monthStart = new Date();
      this.monthStart.setDate(1);
      this.monthStart.setHours(0, 0, 0, 0);
      this.recentCalls = [];
    }
  }

  /**
   * Track CoinGecko API call
   */
  trackCoinGecko(): void {
    this.checkMonthReset();
    this.costs.coingecko.calls++;
    this.recordCall('coingecko', 'api', 0);
  }

  /**
   * Track Finnhub API call
   */
  trackFinnhub(): void {
    this.checkMonthReset();
    this.costs.finnhub.calls++;
    this.recordCall('finnhub', 'api', 0);
  }

  /**
   * Track Resend email
   */
  trackResend(emailCount: number = 1): void {
    this.checkMonthReset();
    const cost = emailCount * this.pricing.resend;
    
    this.costs.resend.emails += emailCount;
    this.costs.resend.cost += cost;
    
    this.recordCall('resend', 'email', cost);
  }

  /**
   * Track Dune Analytics call
   */
  trackDune(): void {
    this.checkMonthReset();
    this.costs.dune.calls++;
    this.recordCall('dune', 'api', 0);
  }

  /**
   * Track CoinMarketCap call
   */
  trackCoinMarketCap(): void {
    this.checkMonthReset();
    this.costs.coinmarketcap.calls++;
    this.recordCall('coinmarketcap', 'api', 0);
  }

  private recordCall(service: string, endpoint: string, cost: number, tokens?: number): void {
    this.recentCalls.push({
      service,
      endpoint,
      timestamp: new Date(),
      cost,
      tokens
    });
    
    // Keep only last 1000 calls
    if (this.recentCalls.length > 1000) {
      this.recentCalls = this.recentCalls.slice(-1000);
    }
  }

  /**
   * Get cost summary with estimated costs based on typical usage patterns
   */
  getSummary(): CostSummary {
    this.checkMonthReset();
    
    // Calculate days elapsed in month
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    
    // Estimate costs based on typical usage.
    // Newsletter: 2x daily; AI agents: background Anthropic activity via the
    // persistent daily ledger (authoritative). This legacy tracker only
    // estimates non-AI services now.
    const estimatedNewsletterCost = daysElapsed * 2 * 0.001; // ~$0.001 per newsletter generation
    const estimatedAgentCost = daysElapsed * 0.10; // ~$0.10/day for agent activity
    const estimatedResendCost = this.costs.resend.emails * 0.001 || daysElapsed * 0.01;

    const aiCost = estimatedNewsletterCost + estimatedAgentCost;
    const resendCost = this.costs.resend.cost || estimatedResendCost;

    const variableTotal = aiCost + resendCost;
    
    // Project to full month
    const dailyVariableRate = daysElapsed > 0 ? variableTotal / daysElapsed : 0;
    const projectedVariableMonth = dailyVariableRate * daysInMonth;
    
    return {
      currentMonth: {
        total: variableTotal + 129, // Add CoinGecko fixed cost
        breakdown: {
          'Anthropic (estimated)': aiCost,
          'Resend': resendCost,
          'CoinGecko Pro': 129, // Fixed monthly cost
        }
      },
      projectedMonth: projectedVariableMonth + 129, // Add CoinGecko fixed cost
      lastUpdated: new Date(),
      services: this.costs
    };
  }

  /**
   * Get recent API calls
   */
  getRecentCalls(limit: number = 50): ApiCall[] {
    return this.recentCalls.slice(-limit).reverse();
  }

  /**
   * Get estimated monthly budget based on replit.md
   */
  getEstimatedBudget(): { anthropic: number; coingecko: number; total: number } {
    return {
      anthropic: 25, // daily AI budget target; see dailyBudgetUsd()
      coingecko: 129,
      total: 154
    };
  }
}

export const apiCostTracker = new ApiCostTracker();

// ---------------------------------------------------------------------------
// Persistent daily AI budget (api_spend_daily) — survives restarts.
//
// Spend is accumulated in memory and batch-flushed every 60s. checkBudget()
// is the single source of truth for the enforcement tiers wired into
// modelGateway. The ledger is Anthropic-only: OpenAI (audio) was removed.
// ---------------------------------------------------------------------------

import { db } from "../db";
import { apiSpendDaily } from "@shared/schema";
import { and, eq, gte, sql as dsql } from "drizzle-orm";

/** Per-1M-token USD rates, overridable via env. */
function envRate(name: string, fallback: number): number {
  const v = parseFloat(process.env[name] || "");
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export function tokenPricingPer1M(service: "anthropic", model: string): { input: number; output: number } {
  const m = model.toLowerCase();
  if (m.includes("haiku")) {
    return { input: envRate("PRICE_ANTHROPIC_HAIKU_IN_PER_M", 1), output: envRate("PRICE_ANTHROPIC_HAIKU_OUT_PER_M", 5) };
  }
  // sonnet default (also the fallback for unknown Anthropic models)
  return { input: envRate("PRICE_ANTHROPIC_SONNET_IN_PER_M", 3), output: envRate("PRICE_ANTHROPIC_SONNET_OUT_PER_M", 15) };
}

export interface BudgetStatus {
  allowed: boolean;
  spentToday: number;
  budgetUsd: number;
  ratio: number;
  degraded: boolean;
}

export function dailyBudgetUsd(): number {
  return envRate("DAILY_AI_BUDGET_USD", 25);
}

const FLUSH_INTERVAL_MS = 60_000;

class DailyBudgetLedger {
  /** pending un-flushed deltas keyed by `${day}|${service}|${model}` */
  private pending = new Map<string, number>();
  /** in-memory running total for today's UTC day (seeded from db) */
  private spentToday = 0;
  private loadedDay: string | null = null;
  private loadPromise: Promise<void> | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  /** Test hooks */
  __resetForTests(): void {
    this.pending.clear();
    this.spentToday = 0;
    this.loadedDay = null;
    this.loadPromise = null;
    if (this.flushTimer) { clearInterval(this.flushTimer); this.flushTimer = null; }
  }

  utcDay(now: Date = new Date()): string {
    return now.toISOString().slice(0, 10);
  }

  private async ensureLoaded(): Promise<void> {
    const day = this.utcDay();
    if (this.loadedDay === day) return;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const loadTotal = () =>
          db
            .select({ total: dsql<number>`coalesce(sum(${apiSpendDaily.costUsd}), 0)` })
            .from(apiSpendDaily)
            .where(eq(apiSpendDaily.day, day));
        let rows;
        try {
          rows = await loadTotal();
        } catch {
          // Fresh database (db:push is blocked by unrelated drift): bootstrap
          // the ledger table idempotently, then retry once.
          await db.execute(dsql`CREATE TABLE IF NOT EXISTS api_spend_daily (
            id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
            day text NOT NULL,
            service text NOT NULL,
            model text NOT NULL,
            cost_usd double precision NOT NULL DEFAULT 0,
            updated_at timestamp NOT NULL DEFAULT now()
          )`);
          await db.execute(dsql`CREATE UNIQUE INDEX IF NOT EXISTS api_spend_daily_day_service_model_idx
            ON api_spend_daily (day, service, model)`);
          rows = await loadTotal();
        }
        // keep any pending deltas for today that accrued while loading
        let pendingToday = 0;
        for (const [key, delta] of Array.from(this.pending.entries())) {
          if (key.startsWith(`${day}|`)) pendingToday += delta;
        }
        this.spentToday = Number(rows[0]?.total ?? 0) + pendingToday;
        this.loadedDay = day;
        this.loadPromise = null;
      })().catch((err) => {
        this.loadPromise = null;
        throw err;
      });
    }
    await this.loadPromise;
  }

  private startFlushTimer(): void {
    if (this.flushTimer || process.env.NODE_ENV === "test") return;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => console.error("[budget] flush failed:", err));
    }, FLUSH_INTERVAL_MS);
    if (typeof this.flushTimer.unref === "function") this.flushTimer.unref();
  }

  /** Record spend (USD). Synchronous; persisted by the 60s batch flush. */
  recordSpend(service: "anthropic", model: string, costUsd: number): void {
    if (!(costUsd > 0)) return;
    const day = this.utcDay();
    if (this.loadedDay === day) this.spentToday += costUsd;
    const key = `${day}|${service}|${model}`;
    this.pending.set(key, (this.pending.get(key) ?? 0) + costUsd);
    this.startFlushTimer();
  }

  /** Convenience: record token-based model spend. */
  recordModelTokens(service: "anthropic", model: string, inputTokens: number, outputTokens: number): number {
    const rates = tokenPricingPer1M(service, model);
    const cost = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
    this.recordSpend(service, model, cost);
    return cost;
  }

  /**
   * Upsert-increment pending deltas into api_spend_daily.
   * Rows are removed from the batch as each upsert succeeds, so a partial
   * failure re-queues ONLY the unapplied rows — never double-counts.
   */
  async flush(): Promise<void> {
    if (this.pending.size === 0) return;
    const batch = Array.from(this.pending.entries());
    this.pending.clear();
    for (let i = 0; i < batch.length; i++) {
      const [key, delta] = batch[i];
      const [day, service, model] = key.split("|");
      try {
        await db
          .insert(apiSpendDaily)
          .values({ day, service, model, costUsd: delta })
          .onConflictDoUpdate({
            target: [apiSpendDaily.day, apiSpendDaily.service, apiSpendDaily.model],
            set: {
              costUsd: dsql`${apiSpendDaily.costUsd} + ${delta}`,
              updatedAt: dsql`now()`,
            },
          });
      } catch (err) {
        // Re-queue only the failed row and the not-yet-attempted remainder.
        for (const [k, d] of batch.slice(i)) {
          this.pending.set(k, (this.pending.get(k) ?? 0) + d);
        }
        throw err;
      }
    }
  }

  async checkBudget(): Promise<BudgetStatus> {
    await this.ensureLoaded();
    const budgetUsd = dailyBudgetUsd();
    const spentToday = this.spentToday;
    const ratio = budgetUsd > 0 ? spentToday / budgetUsd : Infinity;
    return {
      allowed: ratio < 1.5,
      spentToday,
      budgetUsd,
      ratio,
      degraded: ratio >= 0.8,
    };
  }

  /** Admin view: today's spend by service+model plus 7-day history. */
  async adminSummary(): Promise<{
    today: { day: string; byServiceModel: Array<{ service: string; model: string; costUsd: number }>; total: number };
    budget: BudgetStatus;
    history: Array<{ day: string; total: number }>;
  }> {
    await this.flush();
    const today = this.utcDay();
    const sevenDaysAgo = this.utcDay(new Date(Date.now() - 7 * 86_400_000));
    const todayRows = await db
      .select({ service: apiSpendDaily.service, model: apiSpendDaily.model, costUsd: apiSpendDaily.costUsd })
      .from(apiSpendDaily)
      .where(eq(apiSpendDaily.day, today));
    const historyRows = await db
      .select({ day: apiSpendDaily.day, total: dsql<number>`sum(${apiSpendDaily.costUsd})` })
      .from(apiSpendDaily)
      .where(gte(apiSpendDaily.day, sevenDaysAgo))
      .groupBy(apiSpendDaily.day)
      .orderBy(apiSpendDaily.day);
    const budget = await this.checkBudget();
    return {
      today: {
        day: today,
        byServiceModel: todayRows.map((r) => ({ ...r, costUsd: Number(r.costUsd) })),
        total: todayRows.reduce((s, r) => s + Number(r.costUsd), 0),
      },
      budget,
      history: historyRows.map((r) => ({ day: r.day, total: Number(r.total) })),
    };
  }
}

export const dailyBudgetLedger = new DailyBudgetLedger();

/** The spec'd entry point: current budget state for enforcement decisions. */
export function checkBudget(): Promise<BudgetStatus> {
  return dailyBudgetLedger.checkBudget();
}
