import { db } from "../db";
import { knowledgeAvatars, botSimTrades } from "@shared/schema";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { cacheService } from "./cacheService";

const STARTING_CAPITAL = 10_000;
const LEADERBOARD_CACHE_KEY = "avatar:live-leaderboard";
const LEADERBOARD_CACHE_TTL_MS = 10_000;

/**
 * Look up the latest cached price for an open position so we can mark it to
 * market. Returns null when the cache has no entry — callers fall back to
 * entry price (i.e. zero unrealized PnL).
 *
 * Cache keys are populated by the portfolio sync job in
 * server/routes/live-streaming-portfolio.ts using:
 *   crypto_price_<lowercase symbol>   (e.g. crypto_price_btc)
 *   stock_price_<UPPERCASE symbol>    (e.g. stock_price_AAPL)
 */
function getCachedMarkPrice(asset: string, assetType: string): number | null {
  if (!asset) return null;
  const key = assetType === "crypto"
    ? `crypto_price_${asset.toLowerCase()}`
    : `stock_price_${asset.toUpperCase()}`;
  const v = cacheService.get<number>(key);
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

let leaderboardTickTimer: NodeJS.Timeout | null = null;

/**
 * Start a 30s tick that re-computes and broadcasts the leaderboard so price
 * moves on open positions are reflected live, even between trade events.
 * Idempotent — safe to call once at startup.
 */
export function startLeaderboardTicker(intervalMs = 30_000) {
  if (leaderboardTickTimer) return;
  leaderboardTickTimer = setInterval(async () => {
    try {
      const rows = await computeLeaderboard({ force: true });
      broadcaster({ type: "leaderboard_update", payload: rows, timestamp: Date.now() });
    } catch (err) {
      console.error("[leaderboard] tick broadcast failed", err);
    }
  }, intervalMs);
  if (typeof leaderboardTickTimer.unref === "function") leaderboardTickTimer.unref();
}

export function stopLeaderboardTicker() {
  if (leaderboardTickTimer) {
    clearInterval(leaderboardTickTimer);
    leaderboardTickTimer = null;
  }
}

export interface LeaderboardRow {
  rank: number;
  avatarId: string;
  name: string;
  handle: string;
  imageUrl: string | null;
  category: string | null;
  startingCapital: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  openPositions: number;
  totalTrades: number;
  winRate: number;
  lastTradeAt: string | null;
}

export interface RecentTradeRow {
  id: string;
  asset: string;
  assetType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  pnlPercent: number | null;
  status: string;
  reasoning: string | null;
  createdAt: string | null;
  closedAt: string | null;
}

export type LeaderboardWsEvent =
  | { type: "leaderboard_update"; payload: LeaderboardRow[]; timestamp: number }
  | { type: "trade_event"; payload: { avatarId: string; action: "opened" | "closed"; asset: string; direction: string; pnl?: number | null }; timestamp: number };

type Broadcaster = (event: LeaderboardWsEvent) => void;
let broadcaster: Broadcaster = () => {};
let pending: NodeJS.Timeout | null = null;

export function setLeaderboardBroadcaster(fn: Broadcaster) {
  broadcaster = fn;
}

export async function computeLeaderboard(opts: { force?: boolean } = {}): Promise<LeaderboardRow[]> {
  if (!opts.force) {
    const cached = cacheService.get<LeaderboardRow[]>(LEADERBOARD_CACHE_KEY);
    if (cached) return cached;
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Aggregate per-avatar from bot_sim_trades.
  const closedAgg = await db
    .select({
      avatarId: botSimTrades.avatarId,
      totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)::float`,
      totalTrades: sql<number>`COUNT(*)::int`,
      wins: sql<number>`COUNT(*) FILTER (WHERE ${botSimTrades.pnl} > 0)::int`,
      lastTradeAt: sql<Date | null>`MAX(${botSimTrades.closedAt})`,
    })
    .from(botSimTrades)
    .where(and(eq(botSimTrades.status, "closed"), isNotNull(botSimTrades.avatarId)))
    .groupBy(botSimTrades.avatarId);

  const dayAgg = await db
    .select({
      avatarId: botSimTrades.avatarId,
      dayPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)::float`,
    })
    .from(botSimTrades)
    .where(and(
      eq(botSimTrades.status, "closed"),
      isNotNull(botSimTrades.avatarId),
      gte(botSimTrades.closedAt, dayAgo),
    ))
    .groupBy(botSimTrades.avatarId);

  const openAgg = await db
    .select({
      avatarId: botSimTrades.avatarId,
      openCount: sql<number>`COUNT(*)::int`,
      lastOpenAt: sql<Date | null>`MAX(${botSimTrades.createdAt})`,
    })
    .from(botSimTrades)
    .where(and(eq(botSimTrades.status, "open"), isNotNull(botSimTrades.avatarId)))
    .groupBy(botSimTrades.avatarId);

  // Mark-to-market: pull every open position with the fields needed to value
  // it at the latest cached price, so the leaderboard moves in real time even
  // before trades close.
  const openPositions = await db
    .select({
      avatarId: botSimTrades.avatarId,
      asset: botSimTrades.asset,
      assetType: botSimTrades.assetType,
      direction: botSimTrades.direction,
      entryPrice: botSimTrades.entryPrice,
      quantity: botSimTrades.quantity,
    })
    .from(botSimTrades)
    .where(and(eq(botSimTrades.status, "open"), isNotNull(botSimTrades.avatarId)));

  const unrealizedByAvatar = new Map<string, number>();
  for (const p of openPositions) {
    if (!p.avatarId) continue;
    const mark = getCachedMarkPrice(p.asset, p.assetType);
    const ref = mark ?? p.entryPrice; // fall back to entry => unrealized = 0
    const delta = p.direction === "short"
      ? (p.entryPrice - ref) * p.quantity
      : (ref - p.entryPrice) * p.quantity;
    unrealizedByAvatar.set(p.avatarId, (unrealizedByAvatar.get(p.avatarId) ?? 0) + delta);
  }

  const closedMap = new Map(closedAgg.map((r) => [r.avatarId!, r]));
  const dayMap = new Map(dayAgg.map((r) => [r.avatarId!, r]));
  const openMap = new Map(openAgg.map((r) => [r.avatarId!, r]));

  const avatars = await db
    .select({
      id: knowledgeAvatars.id,
      name: knowledgeAvatars.name,
      handle: knowledgeAvatars.handle,
      imageUrl: knowledgeAvatars.imageUrl,
      category: knowledgeAvatars.category,
    })
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.isActive, true));

  const rows: LeaderboardRow[] = avatars.map((a) => {
    const c = closedMap.get(a.id);
    const d = dayMap.get(a.id);
    const o = openMap.get(a.id);
    const totalPnl = Number(c?.totalPnl ?? 0);
    const totalTrades = Number(c?.totalTrades ?? 0);
    const wins = Number(c?.wins ?? 0);
    const dayPnl = Number(d?.dayPnl ?? 0);
    const openPositions = Number(o?.openCount ?? 0);
    const lastTradeDate = c?.lastTradeAt || o?.lastOpenAt || null;
    const unrealizedPnl = unrealizedByAvatar.get(a.id) ?? 0;
    const currentValue = STARTING_CAPITAL + totalPnl + unrealizedPnl;
    const yesterdayValue = currentValue - dayPnl;
    return {
      rank: 0,
      avatarId: a.id,
      name: a.name,
      handle: a.handle,
      imageUrl: a.imageUrl,
      category: a.category,
      startingCapital: STARTING_CAPITAL,
      currentValue,
      totalPnl,
      totalPnlPercent: (totalPnl / STARTING_CAPITAL) * 100,
      dayPnl,
      dayPnlPercent: yesterdayValue > 0 ? (dayPnl / yesterdayValue) * 100 : 0,
      openPositions,
      totalTrades,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      lastTradeAt: lastTradeDate ? new Date(lastTradeDate).toISOString() : null,
    };
  });

  rows.sort((a, b) => b.currentValue - a.currentValue);
  rows.forEach((r, i) => (r.rank = i + 1));

  cacheService.set(LEADERBOARD_CACHE_KEY, rows, LEADERBOARD_CACHE_TTL_MS);
  return rows;
}

/**
 * Called by the bot simulator after a trade opens or closes.
 * Debounced — at most one broadcast every 3s — so a flurry of trades
 * doesn't hammer connected clients.
 */
export function notifyTradeEvent(ev: {
  avatarId: string;
  action: "opened" | "closed";
  asset: string;
  direction: string;
  pnl?: number | null;
}) {
  broadcaster({ type: "trade_event", payload: ev, timestamp: Date.now() });
  if (pending) return;
  pending = setTimeout(async () => {
    pending = null;
    try {
      const rows = await computeLeaderboard({ force: true });
      broadcaster({ type: "leaderboard_update", payload: rows, timestamp: Date.now() });
    } catch (err) {
      console.error("[leaderboard] broadcast failed", err);
    }
  }, 3_000);
}

export async function getRecentTrades(avatarId: string, limit = 20): Promise<RecentTradeRow[]> {
  const rows = await db
    .select()
    .from(botSimTrades)
    .where(eq(botSimTrades.avatarId, avatarId))
    .orderBy(desc(botSimTrades.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
  return rows.map((r) => ({
    id: r.id,
    asset: r.asset,
    assetType: r.assetType,
    direction: r.direction,
    entryPrice: r.entryPrice,
    exitPrice: r.exitPrice,
    quantity: r.quantity,
    pnl: r.pnl,
    pnlPercent: r.pnlPercent,
    status: r.status,
    reasoning: r.reasoning,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    closedAt: r.closedAt ? r.closedAt.toISOString() : null,
  }));
}
