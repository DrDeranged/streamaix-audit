import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import type { Server } from "http";

/**
 * Focused tests for the Phase 1 repair framework guardrails.
 *
 * The db is fully mocked so the route module loads offline. Each test drives
 * the preflight/priorSuccess reads via a small programmable state object and
 * asserts the framework's refusal / execution decisions.
 */

// ---- programmable db state -------------------------------------------------
// Hoisted so the vi.mock factory (also hoisted) can safely reference it.
type Rows = Array<Record<string, unknown>>;
const state = vi.hoisted(() => ({
  // repair_runs: whether a prior successful run exists
  priorSuccessRows: [] as Rows,
  // tradeable_tokens select().limit() result (repair-002 emptiness)
  tradeableTokens: [] as Rows,
  // db.execute results keyed by a substring match of the SQL text
  execResults: [] as Array<{ match: RegExp; rows: Rows; rowCount?: number }>,
  inserted: [] as Array<{ table: unknown; values: unknown }>,
  executedSql: [] as string[],
  failSuccessAudit: false,
}));

function resetState() {
  state.priorSuccessRows = [];
  state.tradeableTokens = [];
  state.execResults = [];
  state.inserted = [];
  state.executedSql = [];
  state.failSuccessAudit = false;
}

vi.mock("../../db", () => {
  // Turn a drizzle sql`` template object into a plain string for matching.
  const sqlToString = (q: unknown): string => {
    const anyq = q as { queryChunks?: unknown[] } | undefined;
    try {
      return JSON.stringify(anyq?.queryChunks ?? q);
    } catch {
      return String(q);
    }
  };
  const fakeDb: any = {
    select: (_cols?: unknown) => ({
      from: (_table: unknown) => ({
        where: (_w: unknown) => ({
          limit: async () => state.priorSuccessRows,
        }),
        limit: async () => state.tradeableTokens,
      }),
    }),
    insert: (table: unknown) => ({
      values: async (values: unknown) => {
        const audit = values as { phase?: string; status?: string };
        if (
          state.failSuccessAudit &&
          audit.phase === "run" &&
          audit.status === "ok"
        ) {
          throw new Error("audit insert failed");
        }
        state.inserted.push({ table, values });
        return undefined;
      },
    }),
    execute: async (q: unknown) => {
      const text = sqlToString(q);
      state.executedSql.push(text);
      for (const r of state.execResults) {
        if (r.match.test(text)) return { rows: r.rows, rowCount: r.rowCount ?? r.rows.length };
      }
      return { rows: [], rowCount: 0 };
    },
    transaction: async (fn: (tx: any) => Promise<unknown>) => fn(fakeDb),
  };
  return { db: fakeDb };
});
vi.mock("../../auth", () => ({
  authenticateToken: (_req: any, _res: any, next: any) => {
    _req.user = { id: "u1", username: "admin" };
    next();
  },
}));
// requireAdmin lives in _shared and reads req.user; keep it real but ensure the
// mocked authenticateToken populates an admin username.
vi.mock("../../middleware/security", async () => {
  const actual = await vi.importActual<any>("../../middleware/security");
  return { ...actual, strictLimit: (_req: any, _res: any, next: any) => next() };
});

import { registerRepairsRoutes } from "../repairs";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.ADMIN_USERNAMES = "admin";
  const app = express();
  app.use(express.json());
  await registerRepairsRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server?.close());
beforeEach(() => resetState());

async function post(path: string, body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return { status: res.status, body: await res.json() };
}

describe("repairs framework — routing + guardrails", () => {
  it("unknown repair id → 404", async () => {
    const r = await post("/api/admin/repairs/repair-999/preflight");
    expect(r.status).toBe(404);
  });

  it("repair-001 preflight: only NULL/NULL dupes present → not needed", async () => {
    state.execResults = [
      { match: /HAVING COUNT/, rows: [] }, // no fully-keyed dup groups
      { match: /edition_date IS NULL OR edition IS NULL/, rows: [{ cnt: 3 }] },
    ];
    const r = await post("/api/admin/repairs/repair-001/preflight");
    expect(r.status).toBe(200);
    expect(r.body.preflight.needed).toBe(false);
    expect(r.body.preflight.details.preservedNullKeyRows).toBe(3);
  });

  it("repair-001 run refused when preflight says not needed", async () => {
    state.execResults = [
      { match: /HAVING COUNT/, rows: [] },
      { match: /edition_date IS NULL OR edition IS NULL/, rows: [{ cnt: 3 }] },
    ];
    const r = await post("/api/admin/repairs/repair-001/run");
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/not needed/i);
  });

  it("repair-001 run backs up doomed rows then deletes when needed", async () => {
    state.execResults = [
      // preflight
      { match: /HAVING COUNT/, rows: [{ edition_date: "2024-01-01", edition: "morning", cnt: 2 }] },
      { match: /edition_date IS NULL OR edition IS NULL/, rows: [{ cnt: 0 }] },
      // run: doomed ids
      { match: /ROW_NUMBER\(\) OVER/, rows: [{ id: "n2" }] },
      // backup insert + delete
      { match: /INSERT INTO newsletters_dedup_backup/, rows: [], rowCount: 1 },
      { match: /DELETE FROM newsletters/, rows: [], rowCount: 1 },
    ];
    const r = await post("/api/admin/repairs/repair-001/run");
    expect(r.status).toBe(200);
    expect(r.body.result.deleted).toBe(1);
    expect(r.body.result.backedUp).toBe(1);
  });

  it("re-running a completed repair is refused unless force=true", async () => {
    state.priorSuccessRows = [{ id: "prev" }]; // a prior successful run exists
    const refused = await post("/api/admin/repairs/repair-002/run");
    expect(refused.status).toBe(409);
    expect(refused.body.error).toMatch(/already completed/i);

    // force=true bypasses the idempotency guard; allowlist empty → seeds.
    state.tradeableTokens = [];
    const forced = await post("/api/admin/repairs/repair-002/run", { force: true });
    expect(forced.status).toBe(200);
    expect(forced.body.result.seeded).toBeGreaterThan(0);
  });

  it("repair-002 preflight reports not needed when allowlist populated", async () => {
    state.tradeableTokens = [{ id: "t1" }];
    const r = await post("/api/admin/repairs/repair-002/preflight");
    expect(r.status).toBe(200);
    expect(r.body.preflight.needed).toBe(false);
  });

  it("serializes repair-002 inside its transaction before seeding", async () => {
    state.tradeableTokens = [];
    const r = await post("/api/admin/repairs/repair-002/run");
    expect(r.status).toBe(200);
    expect(
      state.executedSql.some((text) =>
        text.includes("pg_advisory_xact_lock"),
      ),
    ).toBe(true);
  });

  it("fails the run when its success audit cannot be written", async () => {
    state.execResults = [
      {
        match: /HAVING COUNT/,
        rows: [{ edition_date: "2024-01-01", edition: "morning", cnt: 2 }],
      },
      {
        match: /edition_date IS NULL OR edition IS NULL/,
        rows: [{ cnt: 0 }],
      },
      { match: /ROW_NUMBER\(\) OVER/, rows: [{ id: "n2" }] },
      {
        match: /INSERT INTO newsletters_dedup_backup/,
        rows: [],
        rowCount: 1,
      },
      { match: /DELETE FROM newsletters/, rows: [], rowCount: 1 },
    ];
    state.failSuccessAudit = true;

    const r = await post("/api/admin/repairs/repair-001/run");

    expect(r.status).toBe(500);
    expect(r.body.error).toBe("repair failed");
    expect(
      state.inserted.some(
        ({ values }) =>
          (values as { phase?: string; status?: string }).phase === "run" &&
          (values as { phase?: string; status?: string }).status === "ok",
      ),
    ).toBe(false);
  });

  it("repair-003 preflight flags unsafe mixed values and run refuses", async () => {
    state.execResults = [
      { match: /FROM avatar_insights/, rows: [{ fractional: 4, unsafe: 2, total: 10 }] },
    ];
    const pf = await post("/api/admin/repairs/repair-003/preflight");
    expect(pf.status).toBe(200);
    expect(pf.body.preflight.safe).toBe(false);
    expect(pf.body.preflight.details.unsafe).toBe(2);

    const run = await post("/api/admin/repairs/repair-003/run");
    expect(run.status).toBe(409);
    expect(run.body.error).toMatch(/unsafe/i);
  });

  it("repair-003 run multiplies only 0..1 rows when safe", async () => {
    state.execResults = [
      // preflight: fractional present, no unsafe
      { match: /COUNT\(\*\) FILTER \(WHERE confidence >= 0 AND confidence <= 1\)/, rows: [{ fractional: 3, unsafe: 0, total: 5 }] },
      // run guard: no unsafe
      { match: /SELECT COUNT\(\*\) FILTER \(WHERE confidence < 0 OR confidence > 100\)/, rows: [{ unsafe: 0 }] },
      // update
      { match: /UPDATE avatar_insights/, rows: [], rowCount: 3 },
    ];
    const r = await post("/api/admin/repairs/repair-003/run");
    expect(r.status).toBe(200);
    expect(r.body.result.updated).toBe(3);
  });
});
