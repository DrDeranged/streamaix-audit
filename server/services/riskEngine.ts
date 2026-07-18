import { db } from "../db";
import {
  aiPositions,
  aiTrades,
  agentMemory,
  agentSuspensions,
  riskEvents,
  marketPriceHistory,
  users,
} from "@shared/schema";
import { eq, and, gte, sql, inArray, desc } from "drizzle-orm";

/**
 * Risk Engine — pre-trade guard for the autonomous agent economy.
 *
 * Invoked as a SINGLE guard call by autonomousTradingEngine before any agent
 * trade executes. Every rejection is logged as a structured risk_events row.
 *
 * Checks (in order, cheapest first):
 *  1. Global hourly spend breaker (GLOBAL_HOURLY_SPEND_LIMIT, default 20000)
 *  2. Active suspension ("cooling off")
 *  3. Per-trade stake cap (AGENT_MAX_STAKE, default 500)
 *  4. Total open exposure cap (AGENT_MAX_EXPOSURE, default 2000)
 *  5. 7-day drawdown breaker (AGENT_DRAWDOWN_LIMIT, default 1500 → 48h suspension)
 *  6. Market side concentration (max 20% of one side's liquidity)
 *
 * Post-trade anomaly scan (non-blocking): oversized trade vs the agent's
 * average stake; rapid market price moves (> 30 bps on a 10000 basis in 10min).
 */

const SUSPENSION_HOURS = 48;
const CONCENTRATION_LIMIT = 0.2;
const OVERSIZED_TRADE_MULTIPLE = 3;
const PRICE_MOVE_THRESHOLD_BPS = 30;
const PRICE_MOVE_WINDOW_MS = 10 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface RiskCheckInput {
  agent: { id: string; name?: string };
  market: { id: string; question?: string; yesLiquidity: number; noLiquidity: number };
  side: "YES" | "NO";
  amount: number;
}

export type RiskCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; type: string };

export class RiskEngine {
  /** When set and in the future, the trading engine is globally paused. */
  private globalPausedUntil: Date | null = null;
  /** Prevents duplicate admin alerts for the same pause window. */
  private lastGlobalAlertAt: Date | null = null;

  /** Injectable clock for tests. */
  now(): Date {
    return new Date();
  }

  getBreakerState() {
    const now = this.now();
    return {
      globalPaused: !!(this.globalPausedUntil && this.globalPausedUntil > now),
      globalPausedUntil: this.globalPausedUntil,
      limits: {
        maxStake: envInt("AGENT_MAX_STAKE", 500),
        maxExposure: envInt("AGENT_MAX_EXPOSURE", 2000),
        drawdownLimit: envInt("AGENT_DRAWDOWN_LIMIT", 1500),
        globalHourlySpendLimit: envInt("GLOBAL_HOURLY_SPEND_LIMIT", 20000),
        concentrationLimit: CONCENTRATION_LIMIT,
      },
    };
  }

  /**
   * The single pre-trade guard. Returns { allowed: false } with a reason when
   * the trade must not execute; logs a risk_events row for every rejection.
   */
  async checkTrade(input: RiskCheckInput): Promise<RiskCheckResult> {
    const { agent, market, side, amount } = input;
    const now = this.now();

    // 1. Global breaker — already tripped?
    if (this.globalPausedUntil && this.globalPausedUntil > now) {
      return this.reject("global_breaker", agent.id, market.id, {
        amount,
        pausedUntil: this.globalPausedUntil.toISOString(),
        message: "Trading engine paused by global hourly spend breaker",
      });
    }

    // 1b. Global breaker — trip check on current hour's spend
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const [{ hourlySpend }] = await db
      .select({ hourlySpend: sql<number>`COALESCE(SUM(${aiTrades.streamAmount}), 0)` })
      .from(aiTrades)
      .where(gte(aiTrades.createdAt, hourAgo));
    const globalLimit = envInt("GLOBAL_HOURLY_SPEND_LIMIT", 20000);
    if (Number(hourlySpend) > globalLimit) {
      const endOfHour = new Date(now);
      endOfHour.setMinutes(59, 59, 999);
      this.globalPausedUntil = endOfHour;
      await this.alertAdminsOnce(
        "Agent trading paused: global spend breaker",
        `Agents spent ${hourlySpend} points in the last hour (limit ${globalLimit}). Trading paused until ${endOfHour.toISOString()}.`
      );
      return this.reject("global_breaker", agent.id, market.id, {
        amount,
        hourlySpend: Number(hourlySpend),
        limit: globalLimit,
        pausedUntil: endOfHour.toISOString(),
      });
    }

    // 2. Active suspension
    const [activeSuspension] = await db
      .select()
      .from(agentSuspensions)
      .where(and(eq(agentSuspensions.agentId, agent.id), gte(agentSuspensions.suspendedUntil, now)))
      .orderBy(desc(agentSuspensions.suspendedUntil))
      .limit(1);
    if (activeSuspension) {
      return this.reject("suspended", agent.id, market.id, {
        amount,
        suspensionId: activeSuspension.id,
        reason: activeSuspension.reason,
        suspendedUntil: activeSuspension.suspendedUntil?.toISOString?.() ?? activeSuspension.suspendedUntil,
      });
    }

    // 3. Per-trade stake cap
    const maxStake = envInt("AGENT_MAX_STAKE", 500);
    if (amount > maxStake) {
      return this.reject("stake_cap", agent.id, market.id, { amount, limit: maxStake });
    }

    // 4. Total open exposure cap
    const maxExposure = envInt("AGENT_MAX_EXPOSURE", 2000);
    const [{ openExposure }] = await db
      .select({ openExposure: sql<number>`COALESCE(SUM(${aiPositions.totalInvested}), 0)` })
      .from(aiPositions)
      .where(and(eq(aiPositions.agentId, agent.id), eq(aiPositions.status, "open")));
    if (Number(openExposure) + amount > maxExposure) {
      return this.reject("exposure_cap", agent.id, market.id, {
        amount,
        openExposure: Number(openExposure),
        limit: maxExposure,
      });
    }

    // 5. Drawdown breaker — rolling 7-day realized pnl from agent_memory
    const drawdownLimit = envInt("AGENT_DRAWDOWN_LIMIT", 1500);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [{ weeklyPnl }] = await db
      .select({ weeklyPnl: sql<number>`COALESCE(SUM(${agentMemory.pnl}), 0)` })
      .from(agentMemory)
      .where(and(eq(agentMemory.agentId, agent.id), gte(agentMemory.resolvedAt, sevenDaysAgo)));
    if (Number(weeklyPnl) < -drawdownLimit) {
      const suspendedUntil = new Date(now.getTime() + SUSPENSION_HOURS * 60 * 60 * 1000);
      await db.insert(agentSuspensions).values({
        agentId: agent.id,
        reason: "drawdown",
        detail: { weeklyPnl: Number(weeklyPnl), limit: drawdownLimit },
        suspendedUntil,
      });
      await this.alertAdmins(
        "Agent suspended: drawdown breaker",
        `${agent.name || agent.id} lost ${Math.abs(Number(weeklyPnl))} points over 7 days (limit ${drawdownLimit}). Cooling off for ${SUSPENSION_HOURS}h.`
      );
      return this.reject("drawdown_suspension", agent.id, market.id, {
        amount,
        weeklyPnl: Number(weeklyPnl),
        limit: drawdownLimit,
        suspendedUntil: suspendedUntil.toISOString(),
      });
    }

    // 6. Market side concentration — max 20% of one side's liquidity
    const sideLiquidity = side === "YES" ? market.yesLiquidity : market.noLiquidity;
    const [{ sideInvested }] = await db
      .select({ sideInvested: sql<number>`COALESCE(SUM(${aiPositions.totalInvested}), 0)` })
      .from(aiPositions)
      .where(
        and(
          eq(aiPositions.agentId, agent.id),
          eq(aiPositions.marketId, market.id),
          eq(aiPositions.outcome, side)
        )
      );
    const holdingAfter = Number(sideInvested) + amount;
    const sideBase = Number(sideLiquidity || 0);
    // Compare against the side's existing liquidity (the requirement's basis).
    // A market side with no liquidity cannot absorb any agent stake.
    if (sideBase <= 0 || holdingAfter / sideBase > CONCENTRATION_LIMIT) {
      return this.reject("concentration", agent.id, market.id, {
        amount,
        side,
        holdingAfter,
        sideLiquidity: sideBase,
        share: sideBase > 0 ? holdingAfter / sideBase : null,
        limit: CONCENTRATION_LIMIT,
      });
    }

    return { allowed: true };
  }

  /**
   * Post-trade anomaly scan (non-blocking, alert-only — never rejects).
   * Call after a successful trade.
   */
  async scanTradeAnomalies(input: RiskCheckInput): Promise<void> {
    const { agent, market, amount } = input;
    try {
      // Oversized trade: > 3x the agent's average stake
      const [{ avgStake, tradeCount }] = await db
        .select({
          avgStake: sql<number>`COALESCE(AVG(${agentMemory.stake}), 0)`,
          tradeCount: sql<number>`COUNT(*)`,
        })
        .from(agentMemory)
        .where(eq(agentMemory.agentId, agent.id));
      if (Number(tradeCount) >= 3 && Number(avgStake) > 0 && amount > OVERSIZED_TRADE_MULTIPLE * Number(avgStake)) {
        await this.logEvent("anomaly_oversized_trade", agent.id, market.id, {
          amount,
          avgStake: Number(avgStake),
          multiple: amount / Number(avgStake),
        });
        await this.alertAdmins(
          "Anomaly: oversized agent trade",
          `${agent.name || agent.id} staked ${amount} points (${(amount / Number(avgStake)).toFixed(1)}x its average of ${Math.round(Number(avgStake))}).`
        );
      }

      // Rapid price move: > 30 bps (basis 10000) within 10 minutes
      const windowStart = new Date(this.now().getTime() - PRICE_MOVE_WINDOW_MS);
      const history = await db
        .select({ yesPrice: marketPriceHistory.yesPrice, createdAt: marketPriceHistory.createdAt })
        .from(marketPriceHistory)
        .where(and(eq(marketPriceHistory.marketId, market.id), gte(marketPriceHistory.createdAt, windowStart)))
        .orderBy(desc(marketPriceHistory.createdAt))
        .limit(50);
      if (history.length >= 2) {
        const prices = history.map((h) => h.yesPrice);
        const move = Math.max(...prices) - Math.min(...prices);
        if (move > PRICE_MOVE_THRESHOLD_BPS) {
          await this.logEvent("anomaly_price_move", null, market.id, {
            moveBps: move,
            windowMinutes: PRICE_MOVE_WINDOW_MS / 60000,
            samples: history.length,
          });
          await this.alertAdmins(
            "Anomaly: rapid market price move",
            `"${(market.question || market.id).slice(0, 80)}" moved ${move} bps within 10 minutes.`
          );
        }
      }
    } catch (err: any) {
      console.warn("[RiskEngine] anomaly scan failed:", err?.message || err);
    }
  }

  /** Agent ids currently suspended ("cooling off"), for API/UI surfacing. */
  async getActiveSuspensions() {
    return db
      .select()
      .from(agentSuspensions)
      .where(gte(agentSuspensions.suspendedUntil, this.now()))
      .orderBy(desc(agentSuspensions.suspendedUntil));
  }

  async getRecentEvents(limit = 100) {
    return db
      .select()
      .from(riskEvents)
      .orderBy(desc(riskEvents.createdAt))
      .limit(Math.min(limit, 500));
  }

  private async reject(
    type: string,
    agentId: string,
    marketId: string,
    detail: Record<string, unknown>
  ): Promise<RiskCheckResult> {
    await this.logEvent(type, agentId, marketId, detail);
    return { allowed: false, type, reason: `${type}: ${JSON.stringify(detail)}` };
  }

  private async logEvent(
    type: string,
    agentId: string | null,
    marketId: string | null,
    detail: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.insert(riskEvents).values({ type, agentId, marketId, detail });
    } catch (err: any) {
      console.error("[RiskEngine] failed to log risk event:", err?.message || err);
    }
  }

  private async alertAdminsOnce(title: string, body: string): Promise<void> {
    // One alert per pause window
    if (
      this.lastGlobalAlertAt &&
      this.globalPausedUntil &&
      this.lastGlobalAlertAt.getTime() >= this.globalPausedUntil.getTime() - 60 * 60 * 1000
    ) {
      return;
    }
    this.lastGlobalAlertAt = this.now();
    await this.alertAdmins(title, body);
  }

  private async alertAdmins(title: string, body: string): Promise<void> {
    try {
      const adminUsernames = (process.env.ADMIN_USERNAMES || "admin")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      if (adminUsernames.length === 0) return;

      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.username, adminUsernames));

      const { pushNotificationService } = await import("./pushNotificationService");
      for (const admin of admins) {
        await pushNotificationService
          .sendToUser(admin.id, {
            title,
            body,
            url: "/admin",
            tag: `risk-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            data: { type: "risk_alert" },
          })
          .catch((err: any) => console.warn("[RiskEngine] push failed:", err?.message));
      }
    } catch (err: any) {
      console.warn("[RiskEngine] admin alert failed:", err?.message || err);
    }
  }
}

export const riskEngine = new RiskEngine();
