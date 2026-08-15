import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock: FIFO select results; inserts + updates recorded --------------
const dbState: {
  selectResults: any[][];
  inserted: Array<{ table: any; values: any }>;
  updated: Array<{ table: any; set: any }>;
} = { selectResults: [], inserted: [], updated: [] };

function makeSelectChain() {
  const chain: any = {};
  const self = () => chain;
  for (const m of ["from", "where", "orderBy", "limit"]) chain[m] = self;
  chain.then = (resolve: any, reject: any) => {
    const next = dbState.selectResults.length ? dbState.selectResults.shift() : [];
    return Promise.resolve(next).then(resolve, reject);
  };
  return chain;
}

vi.mock("../../db", () => ({
  db: {
    select: () => makeSelectChain(),
    insert: (table: any) => ({
      values: (v: any) => {
        dbState.inserted.push({ table, values: v });
        return {
          returning: async () => [{ id: `sig-${dbState.inserted.length}`, createdAt: new Date(), ...v }],
          then: (resolve: any) => Promise.resolve(undefined).then(resolve),
        };
      },
    }),
    update: (table: any) => ({
      set: (s: any) => {
        dbState.updated.push({ table, set: s });
        return {
          where: () => ({ returning: async () => [{ id: "updated-row", ...s }] }),
        };
      },
    }),
  },
}));

vi.mock("../../jobs/scheduler", () => ({
  jobScheduler: { register: vi.fn(), registerCron: vi.fn() },
}));

import { AgentSignalService, signalsEnabled, registerAgentSignalJobs } from "../agentSignalService";
import { jobScheduler } from "../../jobs/scheduler";
import { agentSignals } from "@shared/schema";
import {
  validateSignalPayload,
  resolveSignalOutcome,
  computeSuggestedSize,
  findBannedAdvice,
  MAX_SIGNALS_PER_CYCLE,
  SUGGESTED_SIZE_CAP_PCT,
} from "@shared/agentSignals";

const AGENTS = [
  { id: "a1", name: "Ada", handle: "ada", isActive: true, winRate: 71, totalTrades: 40, expertise: "DeFi", tradingStyle: "momentum", decisionBias: "technical" },
  { id: "a2", name: "Bo", handle: "bo", isActive: true, winRate: 65, totalTrades: 33, expertise: "L2s", tradingStyle: "value", decisionBias: "fundamental" },
];
const TOKENS = [
  { id: "t1", symbol: "ETH", name: "Ether", decimals: 18, enabled: true },
  { id: "t2", symbol: "USDC", name: "USD Coin", decimals: 6, enabled: true },
  { id: "t3", symbol: "AERO", name: "Aerodrome", decimals: 18, enabled: true },
];
const QUOTES = [
  { symbol: "ETH", name: "Ether", price: 4000, percentChange24h: 2, percentChange7d: 5, percentChange30d: 12, marketCap: 0, volume24h: 0, rank: 2, lastUpdated: "" },
  { symbol: "AERO", name: "Aerodrome", price: 1.5, percentChange24h: -1, percentChange7d: 3, percentChange30d: 8, marketCap: 0, volume24h: 0, rank: 90, lastUpdated: "" },
];

function goodSignal(overrides: Record<string, any> = {}) {
  return {
    token: "ETH",
    direction: "accumulate",
    thesis: "Momentum has firmed while exchange balances declined over the week, a pattern that historically preceded continuation.",
    confidence: 0.62,
    keyEvidence: ["7d +5%", "exchange outflows"],
    invalidation: "This thesis is wrong if price closes below the weekly range low.",
    timeHorizon: "3d",
    ...overrides,
  };
}

let svc: AgentSignalService;

beforeEach(() => {
  dbState.selectResults = [];
  dbState.inserted = [];
  dbState.updated = [];
  delete process.env.SIGNALS_ENABLED;
  svc = new AgentSignalService();
  svc.getQuotes = async () => QUOTES as any;
});

describe("dark behavior (SIGNALS_ENABLED unset/false)", () => {
  it("signalsEnabled() is false by default", () => {
    expect(signalsEnabled()).toBe(false);
  });

  it("generateSignals is a no-op when dark", async () => {
    svc.completeJson = async () => {
      throw new Error("model should not be called while dark");
    };
    const out = await svc.generateSignals();
    expect(out).toEqual([]);
    expect(dbState.inserted.length).toBe(0);
  });
});

describe("generation", () => {
  beforeEach(() => {
    process.env.SIGNALS_ENABLED = "true";
  });

  it("publishes validated signals with real entry prices", async () => {
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({ abstain: false, signals: [goodSignal()] });
    const out = await svc.generateSignals();
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(dbState.inserted[0].table).toBe(agentSignals);
    expect(dbState.inserted[0].values.entryPrice).toBe(4000);
    expect(dbState.inserted[0].values.status).toBe("open");
  });

  it("abstain path publishes nothing", async () => {
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({ abstain: true, signals: [] });
    const out = await svc.generateSignals();
    expect(out).toEqual([]);
    expect(dbState.inserted.length).toBe(0);
  });

  it("rejects signals with banned advice verbs", async () => {
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({
      signals: [goodSignal({ thesis: "You should buy ETH now before it rips." })],
    });
    const out = await svc.generateSignals();
    expect(out).toEqual([]);
    expect(dbState.inserted.length).toBe(0);
  });

  it("rejects off-allowlist tokens and invalid schema", async () => {
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({
      signals: [
        goodSignal({ token: "SHIB" }),
        goodSignal({ direction: "moon" }),
        goodSignal({ confidence: 1.7 }),
      ],
    });
    const out = await svc.generateSignals();
    expect(out).toEqual([]);
  });

  it("caps publication at MAX_SIGNALS_PER_CYCLE platform-wide", async () => {
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({
      signals: [goodSignal(), goodSignal({ token: "AERO" }), goodSignal({ timeHorizon: "24h" }), goodSignal({ timeHorizon: "7d" })],
    });
    const out = await svc.generateSignals();
    expect(out.length).toBe(MAX_SIGNALS_PER_CYCLE);
  });
});

describe("schema validation (shared)", () => {
  it("rejects >80-word theses", () => {
    const errors = validateSignalPayload(goodSignal({ thesis: Array(81).fill("word").join(" ") }));
    expect(errors.some((e) => /80 words/.test(e))).toBe(true);
  });

  it("accepts a valid payload", () => {
    expect(validateSignalPayload(goodSignal())).toEqual([]);
  });

  it("rejects banned advice phrasing in keyEvidence (adversarial)", () => {
    const errors = validateSignalPayload(goodSignal({ keyEvidence: ["7d +5%", "Buy ETH now"] }));
    expect(errors.some((e) => /keyEvidence contains banned advice/.test(e))).toBe(true);
  });

  it("rejects oversized or empty keyEvidence items", () => {
    expect(validateSignalPayload(goodSignal({ keyEvidence: ["x".repeat(200)] })).length).toBeGreaterThan(0);
    expect(validateSignalPayload(goodSignal({ keyEvidence: ["  "] })).length).toBeGreaterThan(0);
    expect(validateSignalPayload(goodSignal({ keyEvidence: Array(7).fill("ok") })).length).toBeGreaterThan(0);
  });

  it("generation drops signals whose evidence contains advice (never inserted)", async () => {
    process.env.SIGNALS_ENABLED = "true";
    dbState.selectResults.push(AGENTS, TOKENS);
    svc.completeJson = async () => ({
      signals: [goodSignal({ keyEvidence: ["take profit here"] })],
    });
    const out = await svc.generateSignals();
    expect(out).toEqual([]);
    expect(dbState.inserted.length).toBe(0);
  });

  it("flags advice verbs on fixtures", () => {
    expect(findBannedAdvice("Accumulation continued while funding cooled.")).toBeNull();
    expect(findBannedAdvice("Buy this dip")).toBeTruthy();
    expect(findBannedAdvice("you should get in now")).toBeTruthy();
    expect(findBannedAdvice("take profit here, guaranteed")).toBeTruthy();
  });
});

describe("outcome resolution math (fixture prices)", () => {
  it("accumulate: +10% move → +10% return, correct", () => {
    const r = resolveSignalOutcome("accumulate", 100, 110);
    expect(r.hypotheticalReturnPct).toBe(10);
    expect(r.correct).toBe(true);
  });

  it("reduce: -8% move → +8% return, correct; up move incorrect", () => {
    expect(resolveSignalOutcome("reduce", 200, 184)).toEqual({ hypotheticalReturnPct: 8, correct: true });
    expect(resolveSignalOutcome("reduce", 200, 220).correct).toBe(false);
  });

  it("neutral: correct within ±2% band, else incorrect; return 0", () => {
    expect(resolveSignalOutcome("neutral", 100, 101.5)).toEqual({ hypotheticalReturnPct: 0, correct: true });
    expect(resolveSignalOutcome("neutral", 100, 104).correct).toBe(false);
  });

  it("resolveDueSignals settles past-horizon signals against live prices", async () => {
    process.env.SIGNALS_ENABLED = "true";
    const past = new Date(Date.now() - 100 * 3_600_000);
    dbState.selectResults.push([
      { id: "s1", token: "ETH", direction: "accumulate", entryPrice: 3800, timeHorizon: "3d", status: "open", createdAt: past },
      { id: "s2", token: "ETH", direction: "reduce", entryPrice: 3800, timeHorizon: "7d", status: "open", createdAt: new Date() },
    ]);
    const resolved = await svc.resolveDueSignals();
    expect(resolved.length).toBe(1); // s2 not yet due
    expect(dbState.updated[0].set.status).toBe("resolved");
    expect(dbState.updated[0].set.resolvePrice).toBe(4000);
    expect(dbState.updated[0].set.correct).toBe(true);
  });
});

describe("suggested size cap", () => {
  it("caps at 5% of the relevant balance", () => {
    expect(computeSuggestedSize(1000)).toBe(50);
    expect(computeSuggestedSize(1000, 10)).toBe(1000 * (SUGGESTED_SIZE_CAP_PCT / 100)); // requests above cap clamp
    expect(computeSuggestedSize(1000, 2)).toBe(20);
  });

  it("returns null for unknown/zero balances", () => {
    expect(computeSuggestedSize(null)).toBeNull();
    expect(computeSuggestedSize(0)).toBeNull();
    expect(computeSuggestedSize(NaN as any)).toBeNull();
  });
});

describe("scheduler registration", () => {
  it("registers both jobs through jobScheduler", () => {
    registerAgentSignalJobs();
    const names = (jobScheduler.register as any).mock.calls.map((c: any) => c[0]);
    expect(names).toContain("agent-signals-generate");
    expect(names).toContain("agent-signals-resolve");
  });
});
