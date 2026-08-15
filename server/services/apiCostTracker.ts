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
  openai: {
    gpt4o: { calls: number; inputTokens: number; outputTokens: number; cost: number };
    gpt4oMini: { calls: number; inputTokens: number; outputTokens: number; cost: number };
    whisper: { calls: number; minutes: number; cost: number };
    tts: { calls: number; characters: number; cost: number };
  };
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
    openai: {
      'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
      'whisper': 0.006, // per minute
      'tts-1': 0.015, // per 1K characters
      'tts-1-hd': 0.030 // per 1K characters
    },
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
      openai: {
        gpt4o: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        gpt4oMini: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        whisper: { calls: 0, minutes: 0, cost: 0 },
        tts: { calls: 0, characters: 0, cost: 0 }
      },
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
   * Track OpenAI GPT-4o call
   */
  trackGpt4o(inputTokens: number, outputTokens: number): void {
    this.checkMonthReset();
    const cost = (inputTokens / 1000) * this.pricing.openai['gpt-4o'].input +
                 (outputTokens / 1000) * this.pricing.openai['gpt-4o'].output;
    
    this.costs.openai.gpt4o.calls++;
    this.costs.openai.gpt4o.inputTokens += inputTokens;
    this.costs.openai.gpt4o.outputTokens += outputTokens;
    this.costs.openai.gpt4o.cost += cost;
    
    this.recordCall('openai', 'gpt-4o', cost, inputTokens + outputTokens);
  }

  /**
   * Track OpenAI GPT-4o-mini call
   */
  trackGpt4oMini(inputTokens: number, outputTokens: number): void {
    this.checkMonthReset();
    const cost = (inputTokens / 1000) * this.pricing.openai['gpt-4o-mini'].input +
                 (outputTokens / 1000) * this.pricing.openai['gpt-4o-mini'].output;
    
    this.costs.openai.gpt4oMini.calls++;
    this.costs.openai.gpt4oMini.inputTokens += inputTokens;
    this.costs.openai.gpt4oMini.outputTokens += outputTokens;
    this.costs.openai.gpt4oMini.cost += cost;
    
    this.recordCall('openai', 'gpt-4o-mini', cost, inputTokens + outputTokens);
  }

  /**
   * Track OpenAI Whisper call
   */
  trackWhisper(minutes: number): void {
    this.checkMonthReset();
    const cost = minutes * this.pricing.openai.whisper;
    
    this.costs.openai.whisper.calls++;
    this.costs.openai.whisper.minutes += minutes;
    this.costs.openai.whisper.cost += cost;
    
    this.recordCall('openai', 'whisper', cost);
  }

  /**
   * Track OpenAI TTS call
   */
  trackTts(characters: number, hd: boolean = false): void {
    this.checkMonthReset();
    const rate = hd ? this.pricing.openai['tts-1-hd'] : this.pricing.openai['tts-1'];
    const cost = (characters / 1000) * rate;
    
    this.costs.openai.tts.calls++;
    this.costs.openai.tts.characters += characters;
    this.costs.openai.tts.cost += cost;
    
    this.recordCall('openai', 'tts', cost);
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
    
    // Estimate costs based on typical usage (from replit.md: $15-25/month for OpenAI)
    // Newsletter: 2x daily = ~60 sends/month, each uses GPT-4o-mini (~1000 tokens input, 500 output)
    // AI agents: Background activity uses GPT-4o-mini sparingly (QUIET_MODE often enabled)
    // Scheduled streams: 2x daily market briefings use TTS (~2000 chars each)
    
    const estimatedNewsletterCost = daysElapsed * 2 * 0.001; // ~$0.001 per newsletter generation
    const estimatedAgentCost = daysElapsed * 0.10; // ~$0.10/day for agent activity
    const estimatedTtsCost = daysElapsed * 2 * 0.03; // ~$0.03 per stream TTS (2000 chars)
    const estimatedResendCost = this.costs.resend.emails * 0.001 || daysElapsed * 0.01;
    
    // Use tracked costs if available, otherwise use estimates
    const gpt4oCost = this.costs.openai.gpt4o.cost || 0;
    const gpt4oMiniCost = this.costs.openai.gpt4oMini.cost || estimatedNewsletterCost + estimatedAgentCost;
    const whisperCost = this.costs.openai.whisper.cost || 0;
    const ttsCost = this.costs.openai.tts.cost || estimatedTtsCost;
    const resendCost = this.costs.resend.cost || estimatedResendCost;
    
    const openaiTotal = gpt4oCost + gpt4oMiniCost + whisperCost + ttsCost;
    const variableTotal = openaiTotal + resendCost;
    
    // Project to full month
    const dailyVariableRate = daysElapsed > 0 ? variableTotal / daysElapsed : 0;
    const projectedVariableMonth = dailyVariableRate * daysInMonth;
    
    return {
      currentMonth: {
        total: variableTotal + 129, // Add CoinGecko fixed cost
        breakdown: {
          'OpenAI GPT-4o': gpt4oCost,
          'OpenAI GPT-4o-mini': gpt4oMiniCost,
          'OpenAI Whisper': whisperCost,
          'OpenAI TTS': ttsCost,
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
  getEstimatedBudget(): { openai: number; coingecko: number; total: number } {
    return {
      openai: 25, // $15-25 as per replit.md
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
// modelGateway and the audio (whisper/tts) call sites.
// ---------------------------------------------------------------------------

import { db } from "../db";
import { apiSpendDaily } from "@shared/schema";
import { and, eq, gte, sql as dsql } from "drizzle-orm";

/** Per-1M-token USD rates, overridable via env. */
function envRate(name: string, fallback: number): number {
  const v = parseFloat(process.env[name] || "");
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export function tokenPricingPer1M(service: "anthropic" | "openai", model: string): { input: number; output: number } {
  const m = model.toLowerCase();
  if (service === "anthropic") {
    if (m.includes("haiku")) {
      return { input: envRate("PRICE_ANTHROPIC_HAIKU_IN_PER_M", 1), output: envRate("PRICE_ANTHROPIC_HAIKU_OUT_PER_M", 5) };
    }
    // sonnet default (also the fallback for unknown Anthropic models)
    return { input: envRate("PRICE_ANTHROPIC_SONNET_IN_PER_M", 3), output: envRate("PRICE_ANTHROPIC_SONNET_OUT_PER_M", 15) };
  }
  if (m.includes("mini")) {
    return { input: envRate("PRICE_OPENAI_MINI_IN_PER_M", 0.15), output: envRate("PRICE_OPENAI_MINI_OUT_PER_M", 0.6) };
  }
  return { input: envRate("PRICE_OPENAI_IN_PER_M", 2.5), output: envRate("PRICE_OPENAI_OUT_PER_M", 10) };
}

/** Non-token audio rates (whisper per minute, tts per 1K chars). */
export const AUDIO_PRICING = {
  whisperPerMinute: () => envRate("PRICE_OPENAI_WHISPER_PER_MIN", 0.006),
  ttsPer1kChars: (hd: boolean) => envRate(hd ? "PRICE_OPENAI_TTS_HD_PER_1K" : "PRICE_OPENAI_TTS_PER_1K", hd ? 0.03 : 0.015),
};

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
        const rows = await db
          .select({ total: dsql<number>`coalesce(sum(${apiSpendDaily.costUsd}), 0)` })
          .from(apiSpendDaily)
          .where(eq(apiSpendDaily.day, day));
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
  recordSpend(service: "anthropic" | "openai", model: string, costUsd: number): void {
    if (!(costUsd > 0)) return;
    const day = this.utcDay();
    if (this.loadedDay === day) this.spentToday += costUsd;
    const key = `${day}|${service}|${model}`;
    this.pending.set(key, (this.pending.get(key) ?? 0) + costUsd);
    this.startFlushTimer();
  }

  /** Convenience: record token-based model spend. */
  recordModelTokens(service: "anthropic" | "openai", model: string, inputTokens: number, outputTokens: number): number {
    const rates = tokenPricingPer1M(service, model);
    const cost = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
    this.recordSpend(service, model, cost);
    return cost;
  }

  /** Upsert-increment pending deltas into api_spend_daily. */
  async flush(): Promise<void> {
    if (this.pending.size === 0) return;
    const batch = Array.from(this.pending.entries());
    this.pending.clear();
    try {
      for (const [key, delta] of batch) {
        const [day, service, model] = key.split("|");
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
      }
    } catch (err) {
      // Re-queue on failure so spend is never silently dropped.
      for (const [key, delta] of batch) {
        this.pending.set(key, (this.pending.get(key) ?? 0) + delta);
      }
      throw err;
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

/** Record OpenAI TTS spend into the daily ledger (also feeds legacy tracker). */
export function recordTtsSpend(characters: number, hd = false): void {
  apiCostTracker.trackTts(characters, hd);
  dailyBudgetLedger.recordSpend("openai", hd ? "tts-1-hd" : "tts-1", (characters / 1000) * AUDIO_PRICING.ttsPer1kChars(hd));
}

/** Record OpenAI Whisper spend. When only bytes are known, estimate ~240KB/min compressed audio. */
export function recordWhisperSpend(opts: { minutes?: number; bytes?: number }): void {
  const minutes = opts.minutes ?? Math.max(0.25, (opts.bytes ?? 0) / 240_000);
  apiCostTracker.trackWhisper(minutes);
  dailyBudgetLedger.recordSpend("openai", "whisper-1", minutes * AUDIO_PRICING.whisperPerMinute());
}
