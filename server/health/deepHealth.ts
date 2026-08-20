/**
 * deepHealth — Phase 1 deep health check.
 *
 * GET /health/deep — unauthenticated, with a 30s in-process cache so probes /
 * dashboards can't hammer the DB. Reports:
 *   - db: a SELECT 1 roundtrip
 *   - scheduler: running flag + job count
 *   - budget: budget ledger readable status
 *   - repairRuns: latest repair_runs status
 *   - uptime, gitSha
 *
 * Returns HTTP 503 if a CRITICAL check fails (DB unreachable). Non-critical
 * checks (scheduler/budget/repairs) degrade the payload but stay 200 so a
 * transient sub-system blip doesn't flap the whole container.
 *
 * The fast /health (in server/app.ts) is intentionally left untouched.
 */
import type { Express } from "express";
import { execSync } from "node:child_process";
import { db } from "../db";
import { sql, desc } from "drizzle-orm";
import { repairRuns } from "@shared/schema";

const CACHE_TTL_MS = 30_000;

// Resolve the git SHA once at load. Env var (if a platform sets one) wins,
// otherwise a best-effort `git rev-parse`. Never throws.
const GIT_SHA: string = (() => {
  const fromEnv =
    process.env.GIT_SHA ||
    process.env.GIT_COMMIT ||
    process.env.SOURCE_VERSION ||
    process.env.COMMIT_SHA;
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1500,
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
})();

interface DeepHealthResult {
  status: "ok" | "degraded" | "unhealthy";
  httpStatus: number;
  uptime: number;
  gitSha: string;
  timestamp: string;
  checks: {
    db: { ok: boolean; latencyMs?: number; error?: string };
    scheduler: { ok: boolean; running: number; jobs: number; error?: string };
    budget: {
      ok: boolean;
      spentToday?: number;
      budgetUsd?: number;
      degraded?: boolean;
      error?: string;
    };
    repairRuns: {
      ok: boolean;
      latest?: { repairId: string; phase: string; status: string; at: string | null };
      error?: string;
    };
  };
}

let cache: { result: DeepHealthResult; at: number } | null = null;

async function computeDeepHealth(): Promise<DeepHealthResult> {
  const checks: DeepHealthResult["checks"] = {
    db: { ok: false },
    scheduler: { ok: false, running: 0, jobs: 0 },
    budget: { ok: false },
    repairRuns: { ok: false },
  };

  // --- DB roundtrip (CRITICAL) ------------------------------------------
  {
    const t = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      checks.db = { ok: true, latencyMs: Date.now() - t };
    } catch (err) {
      checks.db = { ok: false, error: (err as Error)?.message };
    }
  }

  // --- Scheduler --------------------------------------------------------
  try {
    const { jobScheduler } = await import("../jobs/scheduler");
    checks.scheduler = {
      ok: true,
      running: jobScheduler.runningCount(),
      jobs: jobScheduler.jobCount(),
    };
  } catch (err) {
    checks.scheduler = {
      ok: false,
      running: 0,
      jobs: 0,
      error: (err as Error)?.message,
    };
  }

  // --- Budget ledger readable status ------------------------------------
  try {
    const { checkBudget } = await import("../services/apiCostTracker");
    const b = await checkBudget();
    checks.budget = {
      ok: true,
      spentToday: b.spentToday,
      budgetUsd: b.budgetUsd,
      degraded: b.degraded,
    };
  } catch (err) {
    checks.budget = { ok: false, error: (err as Error)?.message };
  }

  // --- Latest repair_runs status ----------------------------------------
  try {
    const rows = await db
      .select({
        repairId: repairRuns.repairId,
        phase: repairRuns.phase,
        status: repairRuns.status,
        createdAt: repairRuns.createdAt,
      })
      .from(repairRuns)
      .orderBy(desc(repairRuns.createdAt))
      .limit(1);
    const latest = rows[0];
    checks.repairRuns = {
      ok: true,
      latest: latest
        ? {
            repairId: latest.repairId,
            phase: latest.phase,
            status: latest.status,
            at: latest.createdAt ? new Date(latest.createdAt).toISOString() : null,
          }
        : undefined,
    };
  } catch (err) {
    checks.repairRuns = { ok: false, error: (err as Error)?.message };
  }

  // DB is the only CRITICAL check → 503 when it fails.
  const critical = checks.db.ok;
  const allOk =
    checks.db.ok &&
    checks.scheduler.ok &&
    checks.budget.ok &&
    checks.repairRuns.ok;

  return {
    status: !critical ? "unhealthy" : allOk ? "ok" : "degraded",
    httpStatus: critical ? 200 : 503,
    uptime: process.uptime(),
    gitSha: GIT_SHA,
    timestamp: new Date().toISOString(),
    checks,
  };
}

/** Cached compute — used by the route and exported for tests. */
export async function getDeepHealth(
  force = false,
): Promise<DeepHealthResult> {
  const now = Date.now();
  if (!force && cache && now - cache.at < CACHE_TTL_MS) {
    return cache.result;
  }
  const result = await computeDeepHealth();
  cache = { result, at: now };
  return result;
}

/** Clear the cache (tests). */
export function __clearDeepHealthCache(): void {
  cache = null;
}

export function registerDeepHealth(app: Express): void {
  app.get("/health/deep", async (_req, res) => {
    try {
      const result = await getDeepHealth();
      const { httpStatus, ...body } = result;
      res.status(httpStatus).json(body);
    } catch (err) {
      // A failure computing health is itself unhealthy, but must never throw.
      res.status(503).json({
        status: "unhealthy",
        error: (err as Error)?.message ?? "deep health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
