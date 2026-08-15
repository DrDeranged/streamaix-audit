import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock -----------------------------------------------------------------
// select: FIFO results. execute: simulates the atomic cap-enforcing upsert —
// keeps a per-(wallet,day) total and only returns a row when the increment
// stays within the cap embedded in the SQL parameters.
const dbState: {
  selectResults: any[][];
  totals: Map<string, number>; // wallet|day -> persisted volume_usd
  executeCalls: number;
  failReads: boolean;
  failExecute: boolean;
} = { selectResults: [], totals: new Map(), executeCalls: 0, failReads: false, failExecute: false };

function makeSelectChain() {
  const chain: any = {};
  const self = () => chain;
  for (const m of ["from", "where", "orderBy", "limit", "leftJoin", "groupBy"]) chain[m] = self;
  chain.then = (resolve: any, reject: any) => {
    if (dbState.failReads) return Promise.reject(new Error("db down")).then(resolve, reject);
    const next = dbState.selectResults.length ? dbState.selectResults.shift() : [];
    return Promise.resolve(next).then(resolve, reject);
  };
  return chain;
}

vi.mock("../../db", () => ({
  db: {
    select: () => makeSelectChain(),
    // The riskEngine reserve statement: params are [wallet, day, delta, cap].
    execute: async (query: any) => {
      if (dbState.failExecute) throw new Error("db down");
      dbState.executeCalls++;
      // drizzle sql`` interleaves StringChunk objects with raw param values.
      const params: any[] = query?.queryChunks
        ? query.queryChunks.filter((c: any) => typeof c === "string" || typeof c === "number")
        : (query?.params ?? []);
      const [wallet, day, delta, cap] = params;
      const key = `${wallet}|${day}`;
      const current = dbState.totals.get(key) ?? 0;
      if (current + delta > cap) return { rows: [] };
      const newTotal = current + delta;
      dbState.totals.set(key, newTotal);
      return { rows: [{ volume_usd: newTotal }] };
    },
    insert: () => {
      throw new Error("unexpected insert — reserve must go through db.execute");
    },
  },
}));

vi.mock("../pushNotificationService", () => ({
  pushNotificationService: { sendToUser: vi.fn(async () => undefined) },
}));

import { RiskEngine } from "../riskEngine";

const WALLET = "0xAbCd000000000000000000000000000000000001";
const LOWER = WALLET.toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => {
  dbState.selectResults.length = 0;
  dbState.totals.clear();
  dbState.executeCalls = 0;
  dbState.failReads = false;
  dbState.failExecute = false;
  delete process.env.SWAP_DAILY_QUOTE_CAP_USD;
});

describe("swap daily volume persistence (swap_daily_volume table)", () => {
  it("reserves each allowed quote atomically and persists the cumulative total", async () => {
    const engine = new RiskEngine();
    dbState.selectResults.push([]); // no persisted row yet
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
    expect(dbState.executeCalls).toBe(1);
    expect(dbState.totals.get(`${LOWER}|${today()}`)).toBe(1000);
  });

  it("survives a restart: a fresh engine hydrates used volume from the db and enforces the cap", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "25000";
    const engine = new RiskEngine();
    dbState.selectResults.push([{ wallet: LOWER, day: today(), volumeUsd: 24_900 }]);
    dbState.totals.set(`${LOWER}|${today()}`, 24_900);
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 500, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(false);
    expect(r.type).toBe("swap_daily_cap");
    // A rejection must NOT bump the persisted total.
    expect(dbState.totals.get(`${LOWER}|${today()}`)).toBe(24_900);
  });

  it("enforces the cap inside the reserve statement (stale cache cannot bypass it)", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "25000";
    const engine = new RiskEngine();
    // Cache/pre-check sees an empty table (stale view), but the persisted
    // total — as another instance would have written it — is already 24,900.
    dbState.selectResults.push([]); // pre-check load: nothing
    dbState.totals.set(`${LOWER}|${today()}`, 24_900);
    dbState.selectResults.push([{ wallet: LOWER, day: today(), volumeUsd: 24_900 }]); // fresh read after rejection
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 500, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(false);
    expect(r.type).toBe("swap_daily_cap");
    expect(dbState.totals.get(`${LOWER}|${today()}`)).toBe(24_900); // unchanged
  });

  it("concurrent same-wallet quotes cannot jointly exceed the cap", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "25000";
    const engine = new RiskEngine();
    dbState.selectResults.push([], [], []); // all pre-checks see nothing (worst case)
    const results = await Promise.all([
      engine.checkSwap({ wallet: WALLET, notionalUsd: 15_000, priceImpactPct: 0.5 }),
      engine.checkSwap({ wallet: WALLET, notionalUsd: 15_000, priceImpactPct: 0.5 }),
      engine.checkSwap({ wallet: WALLET, notionalUsd: 15_000, priceImpactPct: 0.5 }),
    ]);
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(1); // only one 15k reservation fits under 25k
    expect(dbState.totals.get(`${LOWER}|${today()}`)).toBe(15_000);
  });

  it("uses the cached value (no re-read) for subsequent quotes the same day", async () => {
    const engine = new RiskEngine();
    dbState.selectResults.push([]); // first quote: no row
    await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    // Second quote: no select result queued — cache must serve the pre-check.
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 2000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
    expect(dbState.totals.get(`${LOWER}|${today()}`)).toBe(3000); // cumulative
  });

  it("fails open on db errors (soft cap: availability over strictness)", async () => {
    const engine = new RiskEngine();
    dbState.failReads = true;
    dbState.failExecute = true;
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
  });
});
