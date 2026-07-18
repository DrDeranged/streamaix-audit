import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock -------------------------------------------------------------
const dbState: { trackRecordRows: any[]; inserted: any[]; updates: any[] } = {
  trackRecordRows: [],
  inserted: [],
  updates: [],
};

vi.mock("../../db", () => {
  const select = () => ({
    from: () => ({
      where: (..._a: any[]) => {
        const rows = Promise.resolve(dbState.trackRecordRows);
        return {
          orderBy: () => ({ limit: async () => dbState.trackRecordRows }),
          then: rows.then.bind(rows),
        };
      },
    }),
  });
  const insert = () => ({
    values: async (v: any) => {
      dbState.inserted.push(v);
    },
  });
  const update = () => ({
    set: (v: any) => {
      dbState.updates.push(v);
      return { where: async () => undefined };
    },
  });
  return { db: { select, insert, update } };
});

// ---- source service mocks -------------------------------------------------
const sourceState = {
  quotesCalls: 0,
  newsCalls: 0,
  newsShouldReject: false,
  quotesShouldReject: false,
};

vi.mock("../marketDataService", () => ({
  marketDataService: {
    getCryptoQuotes: vi.fn(async (symbols: string[]) => {
      sourceState.quotesCalls++;
      if (sourceState.quotesShouldReject) throw new Error("prices down");
      return symbols.map((s) => ({
        symbol: s,
        price: 100000,
        percentChange24h: 2.5,
        percentChange7d: -1.2,
      }));
    }),
  },
}));

vi.mock("../newsService", () => ({
  newsService: {
    getCryptoNews: vi.fn(async () => {
      sourceState.newsCalls++;
      if (sourceState.newsShouldReject) throw new Error("rss down");
      return [
        { title: "Bitcoin surges past resistance", source: "CoinDesk", published: "now", summary: "btc" },
        { title: "Unrelated altcoin story", source: "CT", published: "now", summary: "" },
      ];
    }),
    getMacroNews: vi.fn(async () => []),
  },
}));

vi.mock("../stockMarketService", () => ({
  stockMarketService: { getTechAiMovers: vi.fn(async () => ({ gainers: [], losers: [], trending: [] })) },
}));
vi.mock("../macroDataService", () => ({
  macroDataService: { getFearGreedIndex: vi.fn(async () => ({ value: 55, classification: "Greed" })) },
}));

import { AgentResearchService } from "../agentResearchService";
import { cacheService } from "../cacheService";

const makeMarket = (id: string): any => ({
  id,
  question: "Will BTC close above $120k this week?",
  description: null,
  category: "crypto",
  ticker: "BTC",
  tags: ["bitcoin"],
  deadline: new Date(Date.now() + 86400000),
  yesPrice: 6000,
  noPrice: 4000,
  yesLiquidity: 500,
  noLiquidity: 500,
  totalVolume: 1234,
  totalTrades: 10,
  status: "active",
});

describe("AgentResearchService", () => {
  const svc = new AgentResearchService();

  beforeEach(() => {
    dbState.trackRecordRows = [];
    dbState.inserted = [];
    dbState.updates = [];
    sourceState.quotesCalls = 0;
    sourceState.newsCalls = 0;
    sourceState.newsShouldReject = false;
    sourceState.quotesShouldReject = false;
  });

  it("assembles context with prices, headlines and AMM state", async () => {
    const ctx = await svc.buildResearchContext(makeMarket("m-full"));
    expect(ctx.assetPrices).toEqual([
      { symbol: "BTC", price: 100000, percentChange24h: 2.5, percentChange7d: -1.2 },
    ]);
    expect(ctx.headlines.length).toBeGreaterThan(0);
    expect(ctx.headlines[0].title).toContain("Bitcoin");
    expect(ctx.amm).toEqual({ yesPrice: 6000, noPrice: 4000, totalLiquidity: 1000, volume24h: 1234 });
    expect(ctx.sourcesFailed).toEqual([]);
  });

  it("degrades gracefully when a source rejects (never throws)", async () => {
    sourceState.newsShouldReject = true;
    const ctx = await svc.buildResearchContext(makeMarket("m-degraded"));
    expect(ctx.headlines).toEqual([]);
    expect(ctx.sourcesFailed).toContain("headlines");
    // other sources still present
    expect(ctx.assetPrices.length).toBe(1);
    expect(ctx.sourcesUsed).toContain("assetPrices");
    // prompt warns about missing sources and suggests abstaining
    const prompt = svc.formatContextForPrompt(ctx);
    expect(prompt).toContain("unavailable sources: headlines");
    expect(prompt).toContain("ABSTAIN");
  });

  it("degrades gracefully when ALL sources reject", async () => {
    sourceState.newsShouldReject = true;
    sourceState.quotesShouldReject = true;
    const ctx = await svc.buildResearchContext(makeMarket("m-all-down"));
    expect(ctx.assetPrices).toEqual([]);
    expect(ctx.headlines).toEqual([]);
    expect(ctx.sourcesFailed).toEqual(expect.arrayContaining(["assetPrices", "headlines"]));
    // AMM state is always available from the market row itself
    expect(ctx.amm.yesPrice).toBe(6000);
  });

  it("caches the assembled context per market for 15 minutes", async () => {
    const market = makeMarket("m-cache");
    await svc.buildResearchContext(market);
    const callsAfterFirst = sourceState.quotesCalls;
    const ctx2 = await svc.buildResearchContext(market);
    expect(sourceState.quotesCalls).toBe(callsAfterFirst); // no re-fetch
    expect(ctx2.marketId).toBe("m-cache");
    expect(cacheService.get("agent-research:m-cache")).toBeTruthy();
  });

  it("track record string includes real outcomes and pnl", async () => {
    dbState.trackRecordRows = [
      { outcome: "won", pnl: 300, decision: "YES", confidence: 0.8, reasoningSummary: "strong momentum", createdAt: new Date() },
      { outcome: "lost", pnl: -142, decision: "NO", confidence: 0.9, reasoningSummary: "expected rejection at resistance", createdAt: new Date() },
      { outcome: "open", pnl: 0, decision: "YES", confidence: 0.6, reasoningSummary: "pending", createdAt: new Date() },
    ];
    const record = await svc.getAgentTrackRecord("agent-1");
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
    expect(record.open).toBe(1);
    expect(record.netPnl).toBe(158);
    expect(record.winRate).toBe(0.5);

    const text = svc.formatTrackRecordForPrompt(record);
    expect(text).toContain("1 won, 1 lost");
    expect(text).toContain("net +158 points");
    expect(text).toContain("worst recent call: NO");
    expect(text).toContain("expected rejection at resistance");
  });

  it("handles empty track record", async () => {
    const record = await svc.getAgentTrackRecord("agent-new");
    expect(record.winRate).toBeNull();
    expect(svc.formatTrackRecordForPrompt(record)).toContain("no trading history");
  });

  it("settles INVALID resolutions as neutral 'invalid' (not a loss), zero pnl", async () => {
    dbState.trackRecordRows = [
      { id: "mem-1", decision: "YES", stake: 500, outcome: "open" },
      { id: "mem-2", decision: "NO", stake: 200, outcome: "open" },
    ];
    await svc.settleMemoriesForMarket("m-invalid", "INVALID");
    expect(dbState.updates).toHaveLength(2);
    for (const u of dbState.updates) {
      expect(u.outcome).toBe("invalid");
      expect(u.pnl).toBe(0);
    }
  });

  it("settles YES resolution as won/lost with stake-based pnl", async () => {
    dbState.trackRecordRows = [
      { id: "mem-1", decision: "YES", stake: 500, outcome: "open" },
      { id: "mem-2", decision: "NO", stake: 200, outcome: "open" },
    ];
    await svc.settleMemoriesForMarket("m-yes", "YES");
    expect(dbState.updates).toEqual([
      expect.objectContaining({ outcome: "won", pnl: 500 }),
      expect.objectContaining({ outcome: "lost", pnl: -200 }),
    ]);
  });

  it("is idempotent: re-settling when nothing is 'open' updates nothing", async () => {
    dbState.trackRecordRows = []; // query filters outcome='open'; already settled rows excluded
    await svc.settleMemoriesForMarket("m-again", "YES");
    expect(dbState.updates).toHaveLength(0);
  });

  it("invalid outcomes are excluded from win rate and worst-call stats", async () => {
    dbState.trackRecordRows = [
      { outcome: "won", pnl: 100, decision: "YES", confidence: 0.8, reasoningSummary: "a", createdAt: new Date() },
      { outcome: "invalid", pnl: 0, decision: "NO", confidence: 0.9, reasoningSummary: "b", createdAt: new Date() },
    ];
    const record = await svc.getAgentTrackRecord("agent-x");
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(0);
    expect(record.winRate).toBe(1);
    expect(record.worstRecentCall).toBeNull();
  });

  it("records decisions with reasoning truncated to 500 chars", async () => {
    await svc.recordDecision({
      agentId: "a1",
      marketId: "m1",
      decision: "YES",
      confidence: 0.7,
      stake: 500,
      reasoningSummary: "x".repeat(900),
    });
    expect(dbState.inserted).toHaveLength(1);
    expect(dbState.inserted[0].reasoningSummary).toHaveLength(500);
    expect(dbState.inserted[0].outcome).toBe("open");
  });
});
