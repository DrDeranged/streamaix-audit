import type { Express, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import {
  avatarInsights,
  newsletters,
  newslettersDedupBackup,
  repairRuns,
  tradeableTokens,
} from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../auth";
import { requireAdmin, asyncHandler } from "./_shared";
import { strictLimit } from "../middleware/security";
import { DEFAULT_BASE_TOKENS } from "./swap";

/**
 * Phase 1 data-repair framework.
 *
 * Admin-only, strictly rate-limited endpoints that run one-shot, reversible
 * data repairs. Two verbs per repair:
 *
 *   POST /api/admin/repairs/:id/preflight  — read-only inspection; reports
 *     whether the repair is needed and whether it is safe to run.
 *   POST /api/admin/repairs/:id/run        — performs the repair inside a
 *     single DML-only transaction (never CREATE/ALTER at runtime).
 *
 * Guardrails, enforced for every repair:
 *   - refuse a re-run if a prior `run` recorded status 'ok', unless force=true
 *   - always run its own preflight first and refuse if it reports not needed
 *     (or unsafe); the preflight report is recorded alongside the result
 *   - every preflight and run is persisted to `repair_runs` (status/run_by/
 *     preflight/result) for audit + idempotency.
 */

const REPAIR_IDS = ["repair-001", "repair-002", "repair-003"] as const;
type RepairId = (typeof REPAIR_IDS)[number];

function isRepairId(x: string): x is RepairId {
  return (REPAIR_IDS as readonly string[]).includes(x);
}

// A preflight report: `needed` gates the run; `safe` (default true) can block
// a run even when needed (e.g. repair-003 mixed unsafe values).
interface Preflight {
  repairId: RepairId;
  needed: boolean;
  safe: boolean;
  reason: string;
  details: Record<string, unknown>;
}

type RepairExecutor = typeof db;

async function recordRun(
  repairId: RepairId,
  phase: "preflight" | "run",
  status: "not_needed" | "ok" | "refused" | "error",
  runBy: string | null,
  preflight: Preflight | null,
  result: Record<string, unknown> | null,
): Promise<void> {
  try {
    await db.insert(repairRuns).values({
      repairId,
      phase,
      status,
      runBy: runBy ?? undefined,
      preflight: preflight ?? undefined,
      result: result ?? undefined,
    });
  } catch (err) {
    // Auditing must never mask the operation itself.
    console.error(`[repairs] failed to record ${repairId}/${phase}:`, err);
  }
}

/** True if a prior `run` of this repair succeeded. */
async function priorSuccess(
  repairId: RepairId,
  executor: RepairExecutor = db,
): Promise<boolean> {
  const rows = await executor
    .select({ id: repairRuns.id })
    .from(repairRuns)
    .where(sql`${repairRuns.repairId} = ${repairId} AND ${repairRuns.phase} = 'run' AND ${repairRuns.status} = 'ok'`)
    .limit(1);
  return rows.length > 0;
}

async function recordRunInTransaction(
  tx: RepairExecutor,
  repairId: RepairId,
  status: "ok" | "refused",
  runBy: string,
  preflight: Preflight | null,
  result: Record<string, unknown>,
): Promise<void> {
  // Unlike informational preflight/error logging, this insert is intentionally
  // NOT best-effort: if the success/refusal audit cannot be written, the
  // surrounding transaction must roll back the repair DML too.
  await tx.insert(repairRuns).values({
    repairId,
    phase: "run",
    status,
    runBy,
    preflight: preflight ?? undefined,
    result,
  });
}

// ---------------------------------------------------------------------------
// repair-001 — newsletter dedup
//
// Deletes duplicate `newsletters` rows within a fully-keyed slot, keeping the
// deterministic earliest row (oldest sentAt, tie-broken by id). Only groups
// where BOTH edition_date AND edition are non-null are eligible; NULL-key rows
// are preserved and reported untouched (production currently has only NULL/NULL
// duplicates, so preflight reports "not needed"). Doomed rows are backed up to
// `newsletters_dedup_backup` before deletion. The unique index on
// (edition_date, edition) is left intact.
// ---------------------------------------------------------------------------
async function preflight001(executor: RepairExecutor = db): Promise<Preflight> {
  // Fully-keyed duplicate groups (both keys non-null, count > 1).
  const dupGroups = await executor.execute<{
    edition_date: string;
    edition: string;
    cnt: number;
  }>(sql`
    SELECT edition_date, edition, COUNT(*)::int AS cnt
    FROM newsletters
    WHERE edition_date IS NOT NULL AND edition IS NOT NULL
    GROUP BY edition_date, edition
    HAVING COUNT(*) > 1
    ORDER BY edition_date, edition
  `);

  // NULL-key rows are preserved & reported (never deduped).
  const nullKeyRows = await executor.execute<{ cnt: number }>(sql`
    SELECT COUNT(*)::int AS cnt
    FROM newsletters
    WHERE edition_date IS NULL OR edition IS NULL
  `);

  const groups = dupGroups.rows ?? [];
  const doomedCount = groups.reduce((n, g) => n + (Number(g.cnt) - 1), 0);
  const nullKeyCount = Number(nullKeyRows.rows?.[0]?.cnt ?? 0);

  return {
    repairId: "repair-001",
    needed: groups.length > 0,
    safe: true,
    reason:
      groups.length > 0
        ? `${groups.length} fully-keyed duplicate slot(s) with ${doomedCount} row(s) to remove`
        : "no fully-keyed duplicate slots; nothing to dedup",
    details: {
      duplicateGroups: groups.length,
      doomedRows: doomedCount,
      preservedNullKeyRows: nullKeyCount,
      groups,
    },
  };
}

async function run001(
  tx: RepairExecutor,
  runBy: string,
): Promise<Record<string, unknown>> {
  // Deterministic keep = earliest sent_at (NULLs last), tie-broken by id.
  // Everything else in a fully-keyed group is doomed.
  const doomed = await tx.execute<{ id: string }>(sql`
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY edition_date, edition
                 ORDER BY sent_at ASC NULLS LAST, id ASC
               ) AS rn
        FROM newsletters
        WHERE edition_date IS NOT NULL AND edition IS NOT NULL
      ) ranked
      WHERE rn > 1
    `);
  const doomedIds = (doomed.rows ?? []).map((r) => r.id);

  if (doomedIds.length === 0) {
    return { deleted: 0, backedUp: 0, doomedIds: [] };
  }

  // Back up doomed rows (full shape + metadata) BEFORE deleting them.
  await tx.execute(sql`
      INSERT INTO newsletters_dedup_backup (
        id, subject, content, market_data, sent_at, recipient_count,
        scheduled_for, status, edition_date, edition, sent_by,
        source, backed_up_by
      )
      SELECT id, subject, content, market_data, sent_at, recipient_count,
             scheduled_for, status, edition_date, edition, sent_by,
             'repair-001', ${runBy}
      FROM newsletters
      WHERE id IN ${sql`(${sql.join(doomedIds.map((v) => sql`${v}`), sql`, `)})`}
    `);

  const del = await tx.execute(sql`
      DELETE FROM newsletters
      WHERE id IN ${sql`(${sql.join(doomedIds.map((v) => sql`${v}`), sql`, `)})`}
    `);

  return {
    deleted: (del as unknown as { rowCount?: number }).rowCount ?? doomedIds.length,
    backedUp: doomedIds.length,
    doomedIds,
  };
}

// ---------------------------------------------------------------------------
// repair-002 — seed Base token allowlist
//
// Idempotently seeds the exact Base allowlist (reused from server/routes/swap
// so there is a single source of truth) ONLY when `tradeable_tokens` is empty.
// ---------------------------------------------------------------------------
async function preflight002(executor: RepairExecutor = db): Promise<Preflight> {
  const existing = await executor
    .select({ id: tradeableTokens.id })
    .from(tradeableTokens)
    .limit(1);
  const isEmpty = existing.length === 0;
  return {
    repairId: "repair-002",
    needed: isEmpty,
    safe: true,
    reason: isEmpty
      ? `allowlist is empty; will seed ${DEFAULT_BASE_TOKENS.length} default token(s)`
      : "allowlist is already populated; nothing to seed",
    details: { empty: isEmpty, seedCount: DEFAULT_BASE_TOKENS.length },
  };
}

async function run002(tx: RepairExecutor): Promise<Record<string, unknown>> {
  // The route holds a transaction-scoped repair lock. Re-check emptiness after
  // acquiring it so two administrators cannot both seed an empty table.
  const existing = await tx
      .select({ id: tradeableTokens.id })
      .from(tradeableTokens)
      .limit(1);
  if (existing.length > 0) {
    return { seeded: 0, skipped: true };
  }
  let seeded = 0;
  for (const t of DEFAULT_BASE_TOKENS) {
    await tx.insert(tradeableTokens).values({ ...t, enabled: true });
    seeded += 1;
  }
  return { seeded, skipped: false };
}

// ---------------------------------------------------------------------------
// repair-003 — normalize avatar_insights.confidence to a 0-100 scale
//
// `avatar_insights.confidence` should be on a 0-100 scale but some rows were
// written on a 0-1 scale. This multiplies ONLY the 0..1 rows by 100. Preflight
// detects "unsafe mixed" data — any value < 0 or > 100 is ambiguous and cannot
// be safely normalized — and the run refuses when such values exist.
// ---------------------------------------------------------------------------
async function preflight003(executor: RepairExecutor = db): Promise<Preflight> {
  const counts = await executor.execute<{
    fractional: number;
    unsafe: number;
    total: number;
  }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE confidence >= 0 AND confidence <= 1)::int AS fractional,
      COUNT(*) FILTER (WHERE confidence < 0 OR confidence > 100)::int AS unsafe,
      COUNT(*)::int AS total
    FROM avatar_insights
  `);
  const row = counts.rows?.[0] ?? { fractional: 0, unsafe: 0, total: 0 };
  const fractional = Number(row.fractional ?? 0);
  const unsafe = Number(row.unsafe ?? 0);
  const total = Number(row.total ?? 0);

  const safe = unsafe === 0;
  return {
    repairId: "repair-003",
    needed: fractional > 0,
    safe,
    reason: !safe
      ? `${unsafe} row(s) have confidence outside [0,100] — unsafe mixed values; run refused`
      : fractional > 0
        ? `${fractional} row(s) on the 0-1 scale; will multiply by 100`
        : "no fractional (0-1) confidence rows; nothing to normalize",
    details: { fractional, unsafe, total },
  };
}

async function run003(tx: RepairExecutor): Promise<Record<string, unknown>> {
  // Defense in depth: bail if any unsafe value slipped in since preflight.
  const guard = await tx.execute<{ unsafe: number }>(sql`
      SELECT COUNT(*) FILTER (WHERE confidence < 0 OR confidence > 100)::int AS unsafe
      FROM avatar_insights
    `);
  if (Number(guard.rows?.[0]?.unsafe ?? 0) > 0) {
    throw new Error("unsafe confidence values detected inside transaction");
  }
  const upd = await tx.execute(sql`
      UPDATE avatar_insights
      SET confidence = confidence * 100
      WHERE confidence >= 0 AND confidence <= 1
    `);
  return {
    updated: (upd as unknown as { rowCount?: number }).rowCount ?? 0,
  };
}

const PREFLIGHTS: Record<
  RepairId,
  (executor?: RepairExecutor) => Promise<Preflight>
> = {
  "repair-001": preflight001,
  "repair-002": preflight002,
  "repair-003": preflight003,
};

const RUNNERS: Record<
  RepairId,
  (tx: RepairExecutor, runBy: string) => Promise<Record<string, unknown>>
> = {
  "repair-001": (tx, runBy) => run001(tx, runBy),
  "repair-002": (tx) => run002(tx),
  "repair-003": (tx) => run003(tx),
};

export async function registerRepairsRoutes(app: Express): Promise<void> {
  // Preflight — read-only inspection.
  app.post(
    "/api/admin/repairs/:id/preflight",
    strictLimit,
    authenticateToken,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const id = req.params.id;
      if (!isRepairId(id)) {
        res.status(404).json({ error: "unknown repair id" });
        return;
      }
      const runBy = (req.user?.username as string) ?? null;
      try {
        const pf = await PREFLIGHTS[id]();
        await recordRun(id, "preflight", pf.needed ? "ok" : "not_needed", runBy, pf, null);
        res.json({ repairId: id, preflight: pf });
      } catch (err) {
        console.error(`[repairs] ${id}/preflight failed:`, err);
        await recordRun(id, "preflight", "error", runBy, null, {
          error: (err as Error)?.message,
        });
        res.status(500).json({ error: "preflight failed" });
      }
    }),
  );

  // Run — DML-only transactional repair.
  app.post(
    "/api/admin/repairs/:id/run",
    strictLimit,
    authenticateToken,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const id = req.params.id;
      if (!isRepairId(id)) {
        res.status(404).json({ error: "unknown repair id" });
        return;
      }
      const runBy = (req.user?.username as string) ?? "unknown";
      const force = req.body?.force === true;

      try {
        const outcome = await db.transaction(async (tx) => {
          const executor = tx as unknown as RepairExecutor;
          const lockId = REPAIR_IDS.indexOf(id) + 1;
          // Serialize every run of the same repair. This protects the
          // prior-success check, preflight, DML, and success audit as one unit.
          await executor.execute(
            sql`SELECT pg_advisory_xact_lock(21011, ${lockId})`,
          );

          if (!force && (await priorSuccess(id, executor))) {
            const result = {
              error: "repair already completed; pass force=true to re-run",
            };
            await recordRunInTransaction(
              executor,
              id,
              "refused",
              runBy,
              null,
              result,
            );
            return { kind: "refused" as const, status: 409, body: result };
          }

          const pf = await PREFLIGHTS[id](executor);
          if (!pf.needed) {
            const result = { refused: "not_needed" };
            await recordRunInTransaction(
              executor,
              id,
              "refused",
              runBy,
              pf,
              result,
            );
            return {
              kind: "refused" as const,
              status: 409,
              body: { error: "repair not needed", preflight: pf },
            };
          }
          if (!pf.safe) {
            const result = { refused: "unsafe" };
            await recordRunInTransaction(
              executor,
              id,
              "refused",
              runBy,
              pf,
              result,
            );
            return {
              kind: "refused" as const,
              status: 409,
              body: { error: "repair unsafe to run", preflight: pf },
            };
          }

          const result = await RUNNERS[id](executor, runBy);
          await recordRunInTransaction(
            executor,
            id,
            "ok",
            runBy,
            pf,
            result,
          );
          return { kind: "ok" as const, pf, result };
        });

        if (outcome.kind === "refused") {
          res.status(outcome.status).json(outcome.body);
          return;
        }
        res.json({
          repairId: id,
          status: "ok",
          preflight: outcome.pf,
          result: outcome.result,
        });
      } catch (err) {
        console.error(`[repairs] ${id}/run failed:`, err);
        // The transaction has rolled back, so no repair DML committed. This
        // separate best-effort error row is diagnostic only.
        await recordRun(id, "run", "error", runBy, null, {
          error: (err as Error)?.message,
        });
        res.status(500).json({ error: "repair failed" });
      }
    }),
  );
}
