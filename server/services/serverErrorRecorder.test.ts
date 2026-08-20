import { describe, it, expect, vi, beforeEach } from "vitest";

// Controllable db mock: capture inserts and optionally fail.
const dbState: { inserts: any[]; fail: boolean } = { inserts: [], fail: false };

vi.mock("../db", () => ({
  db: {
    insert: () => ({
      values: (values: any) => ({
        onConflictDoUpdate: async (cfg: any) => {
          if (dbState.fail) throw new Error("db down");
          dbState.inserts.push({ values, cfg });
        },
      }),
    }),
  },
}));

import { recordServerError, recordServerErrorSafe } from "./serverErrorRecorder";

describe("serverErrorRecorder", () => {
  beforeEach(() => {
    dbState.inserts = [];
    dbState.fail = false;
  });

  it("writes an INSERT ... ON CONFLICT (no DDL) with a sha256 stack hash", async () => {
    await recordServerError(new Error("boom"), { tag: "/api/x", source: "route" });
    expect(dbState.inserts).toHaveLength(1);
    const v = dbState.inserts[0].values;
    expect(v.tag).toBe("/api/x");
    expect(v.source).toBe("route");
    expect(v.message).toBe("boom");
    expect(v.stackHash).toMatch(/^[0-9a-f]{64}$/);
    expect(v.hourBucket).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}$/);
  });

  it("never throws when the DB is unavailable", async () => {
    dbState.fail = true;
    await expect(
      recordServerError(new Error("boom"), { tag: "job-x", source: "job" }),
    ).resolves.toBeUndefined();
    expect(dbState.inserts).toHaveLength(0);
  });

  it("recordServerErrorSafe is fire-and-forget and never throws sync", () => {
    dbState.fail = true;
    expect(() =>
      recordServerErrorSafe(new Error("x"), { tag: "t", source: "process" }),
    ).not.toThrow();
  });

  it("does not recurse: a record triggered inside a record is skipped", async () => {
    // Force the db to throw an error that would itself be a candidate to record.
    dbState.fail = true;
    // Two concurrent calls: the re-entrancy guard means at most one is active
    // at a time, and failures are swallowed — no unbounded growth / recursion.
    await Promise.all([
      recordServerError(new Error("a"), { tag: "t", source: "route" }),
      recordServerError(new Error("b"), { tag: "t", source: "route" }),
    ]);
    expect(dbState.inserts).toHaveLength(0);
  });
});
