import { describe, it, expect, vi, beforeEach } from "vitest";

const state: { dbFail: boolean } = { dbFail: false };

vi.mock("../db", () => ({
  db: {
    execute: async () => {
      if (state.dbFail) throw new Error("db unreachable");
      return [{ "?column?": 1 }];
    },
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: async () => [],
        }),
      }),
    }),
  },
}));

vi.mock("../jobs/scheduler", () => ({
  jobScheduler: {
    runningCount: () => 1,
    jobCount: () => 5,
  },
}));

vi.mock("../services/apiCostTracker", () => ({
  checkBudget: async () => ({
    allowed: true,
    spentToday: 3,
    budgetUsd: 25,
    ratio: 0.12,
    degraded: false,
  }),
}));

import { getDeepHealth, __clearDeepHealthCache } from "./deepHealth";

describe("deepHealth", () => {
  beforeEach(() => {
    state.dbFail = false;
    __clearDeepHealthCache();
  });

  it("returns ok/200 when all checks pass", async () => {
    const r = await getDeepHealth(true);
    expect(r.httpStatus).toBe(200);
    expect(r.status).toBe("ok");
    expect(r.checks.db.ok).toBe(true);
    expect(r.checks.scheduler).toMatchObject({ ok: true, running: 1, jobs: 5 });
    expect(r.checks.budget).toMatchObject({ ok: true, spentToday: 3, budgetUsd: 25 });
    expect(typeof r.gitSha).toBe("string");
    expect(typeof r.uptime).toBe("number");
  });

  it("returns 503/unhealthy when the DB roundtrip fails (critical)", async () => {
    state.dbFail = true;
    const r = await getDeepHealth(true);
    expect(r.httpStatus).toBe(503);
    expect(r.status).toBe("unhealthy");
    expect(r.checks.db.ok).toBe(false);
  });

  it("caches results within the TTL", async () => {
    const first = await getDeepHealth(); // populates cache
    state.dbFail = true; // would flip to 503 if recomputed
    const second = await getDeepHealth(); // served from cache
    expect(second).toBe(first);
    expect(second.httpStatus).toBe(200);
  });
});
