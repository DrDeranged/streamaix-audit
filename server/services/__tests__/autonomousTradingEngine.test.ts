import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiAgents, predictionMarkets, aiPositions, aiTrades, aiPredictions } from "@shared/schema";

// ---- db mock -------------------------------------------------------------
const dbState: {
  agents: any[];
  markets: any[];
  positions: any[];
  insertedTrades: any[];
  insertedPredictions: any[];
} = { agents: [], markets: [], positions: [], insertedTrades: [], insertedPredictions: [] };

vi.mock("../../db", () => {
  const rowsFor = (table: any) => {
    if (table === aiAgents) return dbState.agents;
    if (table === predictionMarkets) return dbState.markets;
    if (table === aiPositions) return dbState.positions;
    return [];
  };
  const select = () => ({
    from: (table: any) => ({
      where: () => {
        const p = Promise.resolve(rowsFor(table));
        return {
          limit: async () => rowsFor(table),
          then: p.then.bind(p),
          catch: p.catch.bind(p),
        };
      },
    }),
  });
  const insert = (table: any) => ({
    values: (v: any) => {
      if (table === aiTrades) dbState.insertedTrades.push(v);
      if (table === aiPredictions) dbState.insertedPredictions.push(v);
      const p = Promise.resolve(undefined);
      return {
        returning: async () => [{ id: "pos-1", ...v }],
        then: p.then.bind(p),
        catch: p.catch.bind(p),
      };
    },
  });
  const update = () => ({ set: () => ({ where: async () => undefined }) });
  return { db: { select, insert, update } };
});

// ---- collaborator mocks ----------------------------------------------------
const analyzeMarketMock = vi.fn();
vi.mock("../aiAgentService", () => ({
  aiAgentService: { analyzeMarket: (...a: any[]) => analyzeMarketMock(...a) },
}));

const buildContextMock = vi.fn(async (market: any) => ({
  marketId: market.id,
  assetPrices: [],
  headlines: [],
  stockMacroContext: null,
  amm: { yesPrice: 5000, noPrice: 5000, totalLiquidity: 0, volume24h: 0 },
  sourcesUsed: [],
  sourcesFailed: [],
  assembledAt: new Date().toISOString(),
}));
const recordDecisionMock = vi.fn(async () => undefined);
vi.mock("../agentResearchService", () => ({
  agentResearchService: {
    buildResearchContext: (...a: any[]) => buildContextMock(...(a as [any])),
    recordDecision: (...a: any[]) => recordDecisionMock(...(a as [])),
  },
}));

vi.mock("../../jobs/scheduler", () => ({
  jobScheduler: { register: vi.fn(), cancel: vi.fn(), has: vi.fn(() => false) },
}));

import { autonomousTradingEngine } from "../autonomousTradingEngine";

const makeAgent = (i: number) => ({
  id: `agent-${i}`,
  name: `Agent${i}`,
  riskTolerance: "medium",
  confidenceThreshold: 0.6,
  totalVolume: 0,
  totalPredictions: 0,
});
const makeMarket = (i: number) => ({
  id: `market-${i}`,
  question: `Question ${i}?`,
  status: "active",
  yesPrice: 5000,
  noPrice: 5000,
  yesLiquidity: 100,
  noLiquidity: 100,
  totalVolume: 0,
  totalTrades: 0,
});

const runCycle = () => (autonomousTradingEngine as any).executeTradingCycle();

describe("AutonomousTradingEngine batching", () => {
  beforeEach(() => {
    dbState.agents = [];
    dbState.markets = [];
    dbState.positions = [];
    dbState.insertedTrades = [];
    dbState.insertedPredictions = [];
    analyzeMarketMock.mockReset();
    buildContextMock.mockClear();
    recordDecisionMock.mockClear();
    delete process.env.AGENTS_PER_MARKET_PER_CYCLE;
  });

  it("ABSTAIN produces no trade (but the analysis is still recorded)", async () => {
    dbState.agents = [makeAgent(1)];
    dbState.markets = [makeMarket(1)];
    analyzeMarketMock.mockResolvedValue({
      prediction: "ABSTAIN",
      confidence: 0,
      reasoning: "insufficient evidence",
      analysisData: {},
    });

    await runCycle();

    expect(dbState.insertedTrades).toHaveLength(0);
    expect(recordDecisionMock).not.toHaveBeenCalled();
    expect(dbState.insertedPredictions).toHaveLength(1);
    expect(dbState.insertedPredictions[0].prediction).toBe("ABSTAIN");
  });

  it("confident YES produces a trade and an agent memory row", async () => {
    dbState.agents = [makeAgent(1)];
    dbState.markets = [makeMarket(1)];
    analyzeMarketMock.mockResolvedValue({
      prediction: "YES",
      confidence: 90,
      reasoning: "strong evidence",
      analysisData: { keyEvidence: ["BTC +5% in 24h"] },
    });

    await runCycle();

    expect(dbState.insertedTrades).toHaveLength(1);
    expect(recordDecisionMock).toHaveBeenCalledTimes(1);
    expect(recordDecisionMock.mock.calls[0][0]).toMatchObject({
      agentId: "agent-1",
      marketId: "market-1",
      decision: "YES",
    });
  });

  it("enforces per-cycle caps: max 3 markets, max 8 agents per market", async () => {
    dbState.agents = Array.from({ length: 20 }, (_, i) => makeAgent(i));
    dbState.markets = Array.from({ length: 10 }, (_, i) => makeMarket(i));
    analyzeMarketMock.mockResolvedValue({
      prediction: "ABSTAIN",
      confidence: 0,
      reasoning: "n/a",
      analysisData: {},
    });

    await runCycle();

    // 3 markets * 8 agents = 24 analyses max
    expect(buildContextMock).toHaveBeenCalledTimes(3);
    expect(analyzeMarketMock).toHaveBeenCalledTimes(24);
  });

  it("respects AGENTS_PER_MARKET_PER_CYCLE env override", async () => {
    process.env.AGENTS_PER_MARKET_PER_CYCLE = "2";
    dbState.agents = Array.from({ length: 20 }, (_, i) => makeAgent(i));
    dbState.markets = [makeMarket(1)];
    analyzeMarketMock.mockResolvedValue({
      prediction: "ABSTAIN",
      confidence: 0,
      reasoning: "n/a",
      analysisData: {},
    });

    await runCycle();

    expect(analyzeMarketMock).toHaveBeenCalledTimes(2);
  });

  it("builds research context once per market and reuses it across agents", async () => {
    dbState.agents = Array.from({ length: 4 }, (_, i) => makeAgent(i));
    dbState.markets = [makeMarket(1)];
    analyzeMarketMock.mockResolvedValue({
      prediction: "ABSTAIN",
      confidence: 0,
      reasoning: "n/a",
      analysisData: {},
    });

    await runCycle();

    expect(buildContextMock).toHaveBeenCalledTimes(1);
    // every analyzeMarket call received the same precomputed context
    for (const call of analyzeMarketMock.mock.calls) {
      expect(call[2]).toBeDefined();
      expect(call[2].marketId).toBe("market-1");
    }
  });

  it("rotates agents across cycles so remaining agents get their turn", async () => {
    dbState.agents = Array.from({ length: 16 }, (_, i) => makeAgent(i));
    dbState.markets = [makeMarket(1)];
    analyzeMarketMock.mockResolvedValue({
      prediction: "ABSTAIN",
      confidence: 0,
      reasoning: "n/a",
      analysisData: {},
    });

    await runCycle();
    const firstCycleAgents = analyzeMarketMock.mock.calls.map((c) => c[1]);
    analyzeMarketMock.mockClear();
    await runCycle();
    const secondCycleAgents = analyzeMarketMock.mock.calls.map((c) => c[1]);

    expect(firstCycleAgents).toHaveLength(8);
    expect(secondCycleAgents).toHaveLength(8);
    // No overlap: 16 agents, 8 per cycle → second cycle covers the other half
    for (const id of secondCycleAgents) {
      expect(firstCycleAgents).not.toContain(id);
    }
  });
});
