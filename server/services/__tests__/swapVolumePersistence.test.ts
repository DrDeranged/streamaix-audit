import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock: FIFO select results; upserts recorded -------------------------
const dbState: {
  selectResults: any[][];
  upserts: Array<{ values: any; set: any }>;
  inserted: Array<{ table: any; values: any }>;
  failReads: boolean;
} = { selectResults: [], upserts: [], inserted: [], failReads: false };

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
    insert: (table: any) => ({
      values: (v: any) => {
        dbState.inserted.push({ table, values: v });
        return {
          onConflictDoUpdate: async (opts: any) => {
            dbState.upserts.push({ values: v, set: opts.set });
          },
          returning: async () => [{ id: "row-1", ...v }],
          then: (resolve: any) => Promise.resolve(undefined).then(resolve),
        };
      },
    }),
  },
}));

vi.mock("../pushNotificationService", () => ({
  pushNotificationService: { sendToUser: vi.fn(async () => undefined) },
}));

import { RiskEngine } from "../riskEngine";

const WALLET = "0xAbCd000000000000000000000000000000000001";

beforeEach(() => {
  dbState.selectResults.length = 0;
  dbState.upserts.length = 0;
  dbState.inserted.length = 0;
  dbState.failReads = false;
  delete process.env.SWAP_DAILY_QUOTE_CAP_USD;
});

describe("swap daily volume persistence (swap_daily_volume table)", () => {
  it("persists each allowed quote's new daily total as an upsert", async () => {
    const engine = new RiskEngine();
    dbState.selectResults.push([]); // no persisted row yet
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
    expect(dbState.upserts.length).toBe(1);
    expect(dbState.upserts[0].values.volumeUsd).toBe(1000);
    expect(dbState.upserts[0].values.wallet).toBe(WALLET.toLowerCase());
  });

  it("survives a restart: a fresh engine hydrates used volume from the db and enforces the cap", async () => {
    process.env.SWAP_DAILY_QUOTE_CAP_USD = "25000";
    // Simulated restart: brand-new engine instance, empty in-memory map, but
    // the db has 24,900 USD already recorded for today.
    const engine = new RiskEngine();
    const day = new Date().toISOString().slice(0, 10);
    dbState.selectResults.push([{ wallet: WALLET.toLowerCase(), day, volumeUsd: 24_900 }]);
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 500, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(false);
    expect(r.type).toBe("swap_daily_cap");
    // A rejection must NOT bump the persisted total.
    expect(dbState.upserts.length).toBe(0);
  });

  it("uses the cached value (no re-read) for subsequent quotes the same day", async () => {
    const engine = new RiskEngine();
    dbState.selectResults.push([]); // first quote: no row
    await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    // Second quote: no select result queued — cache must serve it.
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 2000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
    expect(dbState.upserts.length).toBe(2);
    expect(dbState.upserts[1].values.volumeUsd).toBe(3000); // cumulative
  });

  it("fails open on db read errors (soft cap: availability over strictness)", async () => {
    const engine = new RiskEngine();
    dbState.failReads = true;
    const r = await engine.checkSwap({ wallet: WALLET, notionalUsd: 1000, priceImpactPct: 0.5 });
    expect(r.allowed).toBe(true);
  });
});
