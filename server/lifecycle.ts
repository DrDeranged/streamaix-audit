/**
 * lifecycle — Phase 1 lifecycle hardening.
 *
 * Installs, from inside the real app (NOT the bootstrap), two things:
 *
 *   1. Process error integration: augments the bootstrap's existing
 *      uncaughtException / unhandledRejection handlers (in server/index.ts)
 *      with a DURABLE recorder write. We DO NOT replace those handlers — the
 *      bootstrap owns the fatal-vs-warn policy. We add a listener that
 *      best-effort records the error to `server_errors` and never throws.
 *
 *   2. Graceful SIGTERM/SIGINT shutdown: stop accepting new connections, ask
 *      the scheduler to stop and wait up to 10s for in-flight jobs, flush the
 *      budget ledger via its real API, then close the DB pool and exit.
 *
 * A nightly prune of server_errors older than 14 days is registered on the
 * shared job scheduler (DML only — no runtime DDL).
 */
import type { Server as HttpServer } from "http";
import { recordServerErrorSafe, pruneOldServerErrors } from "./services/serverErrorRecorder";

let installed = false;
let shuttingDown = false;

export function installLifecycleHooks(httpServer: HttpServer): void {
  if (installed) return;
  installed = true;

  // --- 1. Durable recording of process-level errors ----------------------
  // These are ADDITIONAL listeners; the bootstrap's handlers still decide
  // whether to exit. Recording is best-effort and never throws.
  process.on("uncaughtException", (err) => {
    recordServerErrorSafe(err, { tag: "uncaughtException", source: "process" });
  });
  process.on("unhandledRejection", (reason) => {
    recordServerErrorSafe(reason, {
      tag: "unhandledRejection",
      source: "process",
    });
  });

  // --- 2. Graceful shutdown ---------------------------------------------
  const onSignal = (signal: NodeJS.Signals) => {
    void gracefulShutdown(httpServer, signal);
  };
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  // --- 3. Nightly prune of old server_errors (DML only) ------------------
  // Registered lazily so tests that never start the scheduler are unaffected.
  void (async () => {
    try {
      const { jobScheduler } = await import("./jobs/scheduler");
      // Run once ~03:15 UTC daily.
      jobScheduler.registerCron(
        "server-errors-prune",
        "15 3 * * *",
        async () => {
          const deleted = await pruneOldServerErrors();
          if (deleted > 0) {
            console.log(`[lifecycle] pruned ${deleted} server_errors rows (>14d)`);
          }
        },
        { timezone: "UTC" },
      );
    } catch (err) {
      console.warn(
        "[lifecycle] could not register server_errors prune job:",
        (err as Error)?.message,
      );
    }
  })();
}

/**
 * Graceful shutdown sequence. Exported for tests. Idempotent.
 */
export async function gracefulShutdown(
  httpServer: HttpServer,
  signal: string,
): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stderr.write(`[lifecycle] ${signal} received — graceful shutdown\n`);

  // Force-exit backstop: if anything below hangs, still exit.
  const forceTimer = setTimeout(() => {
    process.stderr.write("[lifecycle] shutdown timed out — forcing exit\n");
    process.exit(0);
  }, 20_000);
  forceTimer.unref?.();

  // 1. Stop accepting new requests/connections.
  try {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
      // Don't block forever if keep-alive sockets linger.
      setTimeout(resolve, 5_000).unref?.();
    });
    process.stderr.write("[lifecycle] http server closed to new requests\n");
  } catch (err) {
    process.stderr.write(
      `[lifecycle] error closing http server: ${(err as Error)?.message}\n`,
    );
  }

  // 2. Ask scheduler/jobs to stop; wait up to 10s for in-flight jobs.
  try {
    const { jobScheduler } = await import("./jobs/scheduler");
    const stillRunning = await jobScheduler.stopAll(10_000);
    process.stderr.write(
      `[lifecycle] scheduler stopped (${stillRunning} job(s) still in-flight after 10s)\n`,
    );
  } catch (err) {
    process.stderr.write(
      `[lifecycle] error stopping scheduler: ${(err as Error)?.message}\n`,
    );
  }

  // 3. Flush the budget ledger via its real existing API, if available.
  try {
    const { dailyBudgetLedger } = await import("./services/apiCostTracker");
    if (dailyBudgetLedger && typeof dailyBudgetLedger.flush === "function") {
      await dailyBudgetLedger.flush();
      process.stderr.write("[lifecycle] budget ledger flushed\n");
    }
  } catch (err) {
    process.stderr.write(
      `[lifecycle] error flushing budget ledger: ${(err as Error)?.message}\n`,
    );
  }

  // 4. Close the DB pool.
  try {
    const { pool } = await import("./db");
    await pool.end();
    process.stderr.write("[lifecycle] db pool closed\n");
  } catch (err) {
    process.stderr.write(
      `[lifecycle] error closing db pool: ${(err as Error)?.message}\n`,
    );
  }

  clearTimeout(forceTimer);
  process.stderr.write("[lifecycle] shutdown complete — exiting\n");
  process.exit(0);
}
