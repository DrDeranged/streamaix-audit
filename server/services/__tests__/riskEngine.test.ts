import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock: FIFO queue of select results; chainable + thenable ------------
const dbState: {
  selectResults: any[][];
  inserted: Array<{ table: any; values: any }>;
} = { selectResults: [], inserted: [] };

function makeChain() {
  const chain: any = {};
  const self = () => chain;
  for (const m of ["from", "where", "orderBy", "limit", "leftJoin", "groupBy"]) {
    chain[m] = self;
  }
  chain.then = (resolve: any, reject: any) => {
    const next = dbState.selectResults.length ? dbState.selectResults.shift() : [];
    return Promise.resolve(next).then(resolve, reject);
  };
  return chain;
}

vi.mock("../../db", () => ({
  db: {
    select: () => makeChain(),
    insert: (table: any) => ({
      values: async (v: any) => {
        dbState.inserted.push({ table, values: v });
      },
    }),
  },
}));

const sendToUserMock = vi.fn(async () => undefined);
vi.mock("../pushNotificationService", () => ({
  pushNotificationService: { sendToUser: (...args: any[]) => sendToUserMock(...args) },
}));

import { RiskEngine } from "../riskEngine";
import { agentSuspensions, riskEvents } from "@shared/schema";

const agent = { id: "agent-1", name: "TestBot" };
const market = { id: "mkt-1", question: "Will X happen?", yesLiquidity: 10000, noLiquidity: 10000 };

const NOW = new Date("2026-07-18T12:30:00Z");

function makeEngine(now: Date = NOW) {
  const engine = new RiskEngine();
  engine.now = () => now;
  return engine;
}

function riskEventRows() {
  return dbState.inserted.filter((i) => i.table === riskEvents).map((i) => i.values);
}
function suspensionRows() {
  return dbState.inserted.filter((i) => i.table === agentSuspensions).map((i) => i.values);
}

// Queue helpers matching checkTrade's select order:
// 1 hourly spend, 2 active suspension, (3 exposure), (4 weekly pnl), (5 side invested)
function queueHappyPath(overrides: Partial<{
  hourlySpend: number; suspension: any[]; openExposure: number; weeklyPnl: number; sideInvested: number;
}> = {}) {
  dbState.selectResults.push([{ hourlySpend: overrides.hourlySpend ?? 0 }]);
  dbState.selectResults.push(overrides.suspension ?? []);
  dbState.selectResults.push([{ openExposure: overrides.openExposure ?? 0 }]);
  dbState.selectResults.push([{ weeklyPnl: overrides.weeklyPnl ?? 0 }]);
  dbState.selectResults.push([{ sideInvested: overrides.sideInvested ?? 0 }]);
}

describe("RiskEngine.checkTrade", () => {
  beforeEach(() => {
    dbState.selectResults.length = 0;
    dbState.inserted.length = 0;
    sendToUserMock.mockClear();
    delete process.env.AGENT_MAX_STAKE;
    delete process.env.AGENT_MAX_EXPOSURE;
    delete process.env.AGENT_DRAWDOWN_LIMIT;
    delete process.env.GLOBAL_HOURLY_SPEND_LIMIT;
  });

  it("allows a normal trade within all limits", async () => {
    const engine = makeEngine();
    queueHappyPath();
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 300 });
    expect(result.allowed).toBe(true);
    expect(riskEventRows().length).toBe(0);
  });

  it("rejects stakes above AGENT_MAX_STAKE (default 500) and logs a risk event", async () => {
    const engine = makeEngine();
    queueHappyPath();
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 501 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("stake_cap");
    const events = riskEventRows();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("stake_cap");
    expect(events[0].agentId).toBe("agent-1");
    expect(events[0].marketId).toBe("mkt-1");
    expect(events[0].detail.limit).toBe(500);
  });

  it("respects AGENT_MAX_STAKE env override", async () => {
    process.env.AGENT_MAX_STAKE = "1000";
    const engine = makeEngine();
    queueHappyPath();
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 900 });
    expect(result.allowed).toBe(true);
  });

  it("rejects when open exposure + stake exceeds AGENT_MAX_EXPOSURE (default 2000)", async () => {
    const engine = makeEngine();
    queueHappyPath({ openExposure: 1800 });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 300 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("exposure_cap");
    expect(riskEventRows()[0].detail.openExposure).toBe(1800);
  });

  it("suspends the agent for 48h when 7-day pnl breaches the drawdown limit", async () => {
    const engine = makeEngine();
    queueHappyPath({ weeklyPnl: -1600 });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 200 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("drawdown_suspension");

    const suspensions = suspensionRows();
    expect(suspensions.length).toBe(1);
    expect(suspensions[0].agentId).toBe("agent-1");
    expect(suspensions[0].reason).toBe("drawdown");
    expect(suspensions[0].suspendedUntil.getTime()).toBe(NOW.getTime() + 48 * 60 * 60 * 1000);
    expect(riskEventRows().some((e) => e.type === "drawdown_suspension")).toBe(true);
  });

  it("rejects trades while an active suspension exists", async () => {
    const engine = makeEngine();
    queueHappyPath({
      suspension: [{ id: "s-1", reason: "drawdown", suspendedUntil: new Date(NOW.getTime() + 3600000) }],
    });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 100 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("suspended");
  });

  it("allows trading again after a suspension expires (expiry via clock)", async () => {
    // The suspension query filters suspendedUntil >= now, so an expired
    // suspension simply returns no rows at a later clock time.
    const later = new Date(NOW.getTime() + 49 * 60 * 60 * 1000);
    const engine = makeEngine(later);
    queueHappyPath({ suspension: [] });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 100 });
    expect(result.allowed).toBe(true);
  });

  it("rejects trades that would exceed 20% of one side's liquidity", async () => {
    const engine = makeEngine();
    // yesLiquidity 10000: existing 1900 + 400 = 2300 / 10000 = 23% > 20%
    queueHappyPath({ sideInvested: 1900 });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 400 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("concentration");
    expect(riskEventRows()[0].detail.side).toBe("YES");
  });

  it("uses existing side liquidity as the concentration basis (no denominator dilution)", async () => {
    process.env.AGENT_MAX_STAKE = "500";
    const engine = makeEngine();
    // yesLiquidity 1000, no existing holding, stake 220 → 22% of the side.
    // A diluted formula (220 / 1220 ≈ 18%) would wrongly allow this.
    const smallMarket = { ...market, yesLiquidity: 1000, noLiquidity: 1000 };
    queueHappyPath({ sideInvested: 0 });
    const result = await engine.checkTrade({ agent, market: smallMarket, side: "YES", amount: 220 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("concentration");
  });

  it("allows a trade at exactly 20% of side liquidity", async () => {
    const engine = makeEngine();
    const smallMarket = { ...market, yesLiquidity: 1000, noLiquidity: 1000 };
    queueHappyPath({ sideInvested: 0 });
    const result = await engine.checkTrade({ agent, market: smallMarket, side: "YES", amount: 200 });
    expect(result.allowed).toBe(true);
  });

  it("rejects any stake when the target side has zero liquidity", async () => {
    const engine = makeEngine();
    const emptyMarket = { ...market, noLiquidity: 0 };
    queueHappyPath({ sideInvested: 0 });
    const result = await engine.checkTrade({ agent, market: emptyMarket, side: "NO", amount: 100 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("concentration");
  });

  it("trips the global breaker when hourly spend exceeds the limit, pauses until end of hour, and alerts admins", async () => {
    const engine = makeEngine();
    dbState.selectResults.push([{ hourlySpend: 25000 }]); // breaker trip
    dbState.selectResults.push([{ id: "admin-1" }]); // admins lookup for alert
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 100 });
    expect(result.allowed).toBe(false);
    expect((result as any).type).toBe("global_breaker");
    expect(sendToUserMock).toHaveBeenCalled();

    const state = engine.getBreakerState();
    expect(state.globalPaused).toBe(true);
    // paused until the end of the current hour
    expect(state.globalPausedUntil!.getUTCHours()).toBe(NOW.getUTCHours());
    expect(state.globalPausedUntil!.getUTCMinutes()).toBe(59);

    // Subsequent trades rejected without re-querying spend, and no duplicate alert
    sendToUserMock.mockClear();
    const result2 = await engine.checkTrade({ agent, market, side: "NO", amount: 50 });
    expect(result2.allowed).toBe(false);
    expect((result2 as any).type).toBe("global_breaker");
    expect(sendToUserMock).not.toHaveBeenCalled();
  });

  it("resumes trading after the paused hour ends", async () => {
    const engine = makeEngine();
    dbState.selectResults.push([{ hourlySpend: 25000 }]);
    dbState.selectResults.push([]); // no admins found
    await engine.checkTrade({ agent, market, side: "YES", amount: 100 });
    expect(engine.getBreakerState().globalPaused).toBe(true);

    // Advance the clock past the hour; spend has fallen back under the limit
    engine.now = () => new Date("2026-07-18T13:01:00Z");
    queueHappyPath({ hourlySpend: 100 });
    const result = await engine.checkTrade({ agent, market, side: "YES", amount: 100 });
    expect(result.allowed).toBe(true);
  });
});

describe("RiskEngine.scanTradeAnomalies", () => {
  beforeEach(() => {
    dbState.selectResults.length = 0;
    dbState.inserted.length = 0;
    sendToUserMock.mockClear();
  });

  it("logs and alerts on a trade > 3x the agent's average stake", async () => {
    const engine = makeEngine();
    dbState.selectResults.push([{ avgStake: 100, tradeCount: 10 }]); // agent history
    dbState.selectResults.push([{ id: "admin-1" }]); // admin lookup
    dbState.selectResults.push([]); // price history (no anomaly)
    await engine.scanTradeAnomalies({ agent, market, side: "YES", amount: 400 });

    const events = riskEventRows();
    expect(events.some((e) => e.type === "anomaly_oversized_trade")).toBe(true);
    expect(sendToUserMock).toHaveBeenCalled();
  });

  it("logs and alerts on a > 30 bps price move within 10 minutes", async () => {
    const engine = makeEngine();
    dbState.selectResults.push([{ avgStake: 500, tradeCount: 10 }]); // no oversized anomaly
    dbState.selectResults.push([
      { yesPrice: 5040, createdAt: NOW },
      { yesPrice: 5000, createdAt: new Date(NOW.getTime() - 5 * 60000) },
    ]); // price history: 40 bps move
    dbState.selectResults.push([{ id: "admin-1" }]); // admin lookup
    await engine.scanTradeAnomalies({ agent, market, side: "YES", amount: 400 });

    const events = riskEventRows();
    expect(events.some((e) => e.type === "anomaly_price_move")).toBe(true);
    expect(events.find((e) => e.type === "anomaly_price_move")!.detail.moveBps).toBe(40);
    expect(sendToUserMock).toHaveBeenCalled();
  });

  it("does not flag small trades or quiet markets", async () => {
    const engine = makeEngine();
    dbState.selectResults.push([{ avgStake: 200, tradeCount: 10 }]);
    dbState.selectResults.push([
      { yesPrice: 5010, createdAt: NOW },
      { yesPrice: 5000, createdAt: new Date(NOW.getTime() - 5 * 60000) },
    ]);
    await engine.scanTradeAnomalies({ agent, market, side: "YES", amount: 300 });
    expect(riskEventRows().length).toBe(0);
    expect(sendToUserMock).not.toHaveBeenCalled();
  });

  it("never throws even if the db fails", async () => {
    const engine = makeEngine();
    // no queued results → chain resolves []; aggregate destructure would fail — ensure caught
    await expect(engine.scanTradeAnomalies({ agent, market, side: "YES", amount: 300 })).resolves.toBeUndefined();
  });
});
