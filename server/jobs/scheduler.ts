/**
 * JobScheduler — single consolidation point for all background work (Phase 1).
 *
 * Every business-logic background engine registers here instead of running its
 * own setInterval / while-loop / cron. The scheduler provides:
 *
 *  - Restart-herd fix: a job with runOnStart only fires immediately on boot if
 *    its persisted last_started_at is older than its interval. Otherwise it
 *    waits for its next slot.
 *  - Per-job overlap guard: a tick is skipped while the previous run of the
 *    same job is still executing.
 *  - Stagger: per-job boot offsets so jobs don't all fire on the same tick.
 *  - Jitter: optional random extra delay added to every tick.
 *  - Failure backoff: after 5 consecutive failures a job backs off to 4x its
 *    interval (loudly logged); a success resets it.
 *  - Persistence: last-run bookkeeping in the job_runs Postgres table so the
 *    boot-time decision survives restarts. All DB writes are best-effort —
 *    a broken DB never breaks the jobs themselves.
 */
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { db } from '../db';
import { jobRuns } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const MAX_CONSECUTIVE_FAILURES = 5;
const BACKOFF_MULTIPLIER = 4;

export interface RegisterOptions {
  /** Random extra delay (0..jitterMs) added to every scheduled tick. */
  jitterMs?: number;
  /**
   * Run once shortly after registration — but only if the persisted
   * last_started_at is older than the job's interval (the restart-herd fix).
   */
  runOnStart?: boolean;
  /** Fixed boot offset before the job's first action. */
  staggerMs?: number;
}

export interface RegisterCronOptions {
  timezone?: string;
  /**
   * For cron jobs that historically also ran once at boot: run on boot only
   * if last_started_at is older than freshForMs (required with runOnStart).
   */
  runOnStart?: boolean;
  freshForMs?: number;
}

interface JobState {
  name: string;
  kind: 'interval' | 'cron';
  intervalMs?: number;
  cronExpression?: string;
  fn: () => unknown | Promise<unknown>;
  opts: RegisterOptions & RegisterCronOptions;
  running: boolean;
  runCount: number;
  consecutiveFailures: number;
  lastStartedAt: Date | null;
  lastFinishedAt: Date | null;
  lastStatus: string | null;
  lastError: string | null;
  nextRunAt: Date | null;
  timer: NodeJS.Timeout | null;
  cronTask: ScheduledTask | null;
  cancelled: boolean;
}

// ---------------------------------------------------------------------------
// Cron slot math (5-field expressions: min hour dom month dow).
// No cron-parser dependency: we scan back minute-by-minute (max 8 days) for
// the most recent matching slot. Exported for tests.
// ---------------------------------------------------------------------------

function parseCronField(field: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  for (const part of field.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart ? parseInt(stepPart, 10) : 1;
    let lo = min;
    let hi = max;
    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [a, b] = rangePart.split('-').map((n) => parseInt(n, 10));
        lo = a;
        hi = b;
      } else {
        lo = hi = parseInt(rangePart, 10);
        if (stepPart) hi = max; // "N/step" means start at N
      }
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

/** Date parts of `date` in `timezone` (defaults to server local). */
function datePartsInZone(date: Date, timezone?: string): { minute: number; hour: number; dom: number; month: number; dow: number } {
  if (!timezone) {
    return { minute: date.getMinutes(), hour: date.getHours(), dom: date.getDate(), month: date.getMonth() + 1, dow: date.getDay() };
  }
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, minute: 'numeric', hour: 'numeric', hourCycle: 'h23',
    day: 'numeric', month: 'numeric', weekday: 'short',
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    minute: parseInt(parts.minute, 10),
    hour: parseInt(parts.hour, 10) % 24,
    dom: parseInt(parts.day, 10),
    month: parseInt(parts.month, 10),
    dow: dowMap[parts.weekday] ?? 0,
  };
}

/** Does `date` (interpreted in `timezone`) match the 5-field cron expression? */
export function cronMatches(expression: string, date: Date, timezone?: string): boolean {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const [minF, hourF, domF, monF, dowF] = fields;
  const p = datePartsInZone(date, timezone);
  const minutes = parseCronField(minF, 0, 59);
  const hours = parseCronField(hourF, 0, 23);
  const doms = parseCronField(domF, 1, 31);
  const months = parseCronField(monF, 1, 12);
  const dows = new Set(Array.from(parseCronField(dowF, 0, 7)).map((d) => d % 7));
  return minutes.has(p.minute) && hours.has(p.hour) && doms.has(p.dom) && months.has(p.month) && dows.has(p.dow);
}

/**
 * Most recent scheduled slot strictly at-or-before `from` (exclusive of the
 * current minute so an in-window boot doesn't self-trigger). Scans back up
 * to 8 days; returns null if no slot found (e.g. rare monthly schedules).
 */
export function previousCronSlot(expression: string, from: Date, timezone?: string): Date | null {
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  for (let i = 1; i <= 8 * 24 * 60; i++) {
    const candidate = new Date(cursor.getTime() - i * 60_000);
    if (cronMatches(expression, candidate, timezone)) return candidate;
  }
  return null;
}

export class JobScheduler {
  private jobs = new Map<string, JobState>();

  /**
   * Register an interval job. Replaces an engine's internal
   * setInterval / while-loop self-scheduling.
   */
  register(
    name: string,
    intervalMs: number,
    fn: () => unknown | Promise<unknown>,
    opts: RegisterOptions = {},
  ): void {
    if (this.jobs.has(name)) {
      console.warn(`[Scheduler] Job "${name}" already registered — ignoring duplicate`);
      return;
    }
    const job: JobState = {
      name,
      kind: 'interval',
      intervalMs,
      fn,
      opts,
      running: false,
      runCount: 0,
      consecutiveFailures: 0,
      lastStartedAt: null,
      lastFinishedAt: null,
      lastStatus: null,
      lastError: null,
      nextRunAt: null,
      timer: null,
      cronTask: null,
      cancelled: false,
    };
    this.jobs.set(name, job);

    void this.bootstrapIntervalJob(job);
  }

  /**
   * Register a cron-expression job (for engines whose schedule is a
   * time-of-day, e.g. "8am EST daily"). Semantics of the schedule are
   * preserved exactly; the scheduler adds overlap guard, persistence,
   * failure tracking, and status reporting.
   */
  registerCron(
    name: string,
    cronExpression: string,
    fn: () => unknown | Promise<unknown>,
    opts: RegisterCronOptions = {},
  ): void {
    if (this.jobs.has(name)) {
      console.warn(`[Scheduler] Job "${name}" already registered — ignoring duplicate`);
      return;
    }
    const job: JobState = {
      name,
      kind: 'cron',
      cronExpression,
      fn,
      opts,
      running: false,
      runCount: 0,
      consecutiveFailures: 0,
      lastStartedAt: null,
      lastFinishedAt: null,
      lastStatus: null,
      lastError: null,
      nextRunAt: null,
      timer: null,
      cronTask: null,
      cancelled: false,
    };
    this.jobs.set(name, job);

    job.cronTask = cron.schedule(
      cronExpression,
      () => void this.executeJob(job),
      opts.timezone ? { timezone: opts.timezone } : undefined,
    );

    this.startCatchUpTimers();

    if (opts.runOnStart && opts.freshForMs) {
      void this.maybeRunOnBoot(job, opts.freshForMs, 0);
    }
  }

  // ---------------------------------------------------------- cron catch-up

  private catchUpTimersStarted = false;

  /**
   * Boot + hourly catch-up for cron jobs: if a job's last successful run is
   * older than its most recent scheduled slot, run it once now. Guards
   * against slots missed while the process was down. Job functions with
   * side effects that must not repeat (e.g. newsletter sends) must be
   * idempotent per-slot themselves.
   */
  private startCatchUpTimers(): void {
    if (this.catchUpTimersStarted || process.env.NODE_ENV === 'test') return;
    this.catchUpTimersStarted = true;
    const boot = setTimeout(() => void this.runCatchUpCheck(), 90_000);
    boot.unref?.();
    const hourly = setInterval(() => void this.runCatchUpCheck(), 60 * 60 * 1000);
    hourly.unref?.();
  }

  /** Public for tests and manual triggering. */
  async runCatchUpCheck(now: Date = new Date()): Promise<void> {
    for (const job of Array.from(this.jobs.values())) {
      if (job.kind !== 'cron' || job.cancelled || job.running) continue;
      try {
        const slot = previousCronSlot(job.cronExpression!, now, job.opts.timezone);
        if (!slot) continue;
        // Hydrate persisted state so a fresh boot sees the last run. If the
        // persisted state cannot be read (isStale returns false on DB errors
        // without hydrating), fail SAFE: skip catch-up rather than re-running
        // every cron job's side effects during a DB outage.
        const hydrated = await this.isStale(job, Number.MAX_SAFE_INTEGER).catch(() => undefined);
        if (hydrated === false && !job.lastStartedAt && !job.lastFinishedAt) {
          console.warn(`[Scheduler] [catch-up] "${job.name}" — persisted state unavailable, skipping catch-up (fail-safe)`);
          continue;
        }
        const lastSuccess =
          job.lastStatus === 'success' && job.lastFinishedAt
            ? new Date(job.lastFinishedAt).getTime()
            : job.lastStartedAt
              ? new Date(job.lastStartedAt).getTime()
              : 0;
        if (lastSuccess < slot.getTime()) {
          console.log(
            `[Scheduler] [catch-up] "${job.name}" missed its slot at ${slot.toISOString()} ` +
              `(last run: ${lastSuccess ? new Date(lastSuccess).toISOString() : 'never'}) — running once now`,
          );
          await this.executeJob(job);
        }
      } catch (err) {
        console.warn(`[Scheduler] catch-up check failed for "${job.name}":`, (err as Error).message);
      }
    }
  }

  /** Cancel a job: clears timers / stops the cron task. */
  cancel(name: string): void {
    const job = this.jobs.get(name);
    if (!job) return;
    job.cancelled = true;
    if (job.timer) {
      clearTimeout(job.timer);
      job.timer = null;
    }
    if (job.cronTask) {
      job.cronTask.stop();
      job.cronTask = null;
    }
    job.nextRunAt = null;
  }

  /** True if the job is registered and not cancelled. */
  has(name: string): boolean {
    const job = this.jobs.get(name);
    return !!job && !job.cancelled;
  }

  getStatus(): Array<{
    name: string;
    kind: 'interval' | 'cron';
    intervalMs?: number;
    cronExpression?: string;
    running: boolean;
    cancelled: boolean;
    runCount: number;
    consecutiveFailures: number;
    backoffActive: boolean;
    lastStartedAt: Date | null;
    lastFinishedAt: Date | null;
    lastStatus: string | null;
    lastError: string | null;
    nextRunAt: Date | null;
  }> {
    return Array.from(this.jobs.values()).map((j) => ({
      name: j.name,
      kind: j.kind,
      intervalMs: j.intervalMs,
      cronExpression: j.cronExpression,
      running: j.running,
      cancelled: j.cancelled,
      runCount: j.runCount,
      consecutiveFailures: j.consecutiveFailures,
      backoffActive: j.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES,
      lastStartedAt: j.lastStartedAt,
      lastFinishedAt: j.lastFinishedAt,
      lastStatus: j.lastStatus,
      lastError: j.lastError,
      nextRunAt: j.nextRunAt,
    }));
  }

  // ---------------------------------------------------------------- internal

  private async bootstrapIntervalJob(job: JobState): Promise<void> {
    const stagger = job.opts.staggerMs ?? 0;

    if (job.opts.runOnStart) {
      const shouldRunNow = await this.isStale(job, job.intervalMs!);
      if (shouldRunNow) {
        this.scheduleIn(job, stagger);
        return;
      }
      console.log(
        `[Scheduler] "${job.name}" ran recently — skipping boot run, waiting for next slot`,
      );
    }
    this.scheduleIn(job, stagger + this.nextDelay(job));
  }

  /**
   * A job is "stale" if it has no persisted run or its last start is older
   * than maxAgeMs. On DB failure we treat the job as NOT stale — failing safe
   * against the restart herd this scheduler exists to prevent.
   */
  private async maybeRunOnBoot(job: JobState, freshForMs: number, stagger: number): Promise<void> {
    const stale = await this.isStale(job, freshForMs);
    if (stale && !job.cancelled) {
      job.timer = setTimeout(() => void this.executeJob(job), stagger);
      job.timer.unref?.();
    } else if (!stale) {
      console.log(
        `[Scheduler] "${job.name}" ran recently — skipping boot run, waiting for next cron slot`,
      );
    }
  }

  private async isStale(job: JobState, maxAgeMs: number): Promise<boolean> {
    try {
      const rows = await db
        .select()
        .from(jobRuns)
        .where(eq(jobRuns.name, job.name))
        .limit(1);
      const row = rows[0];
      if (!row) return true;
      // Hydrate in-memory state from persistence
      job.lastStartedAt = row.lastStartedAt;
      job.lastFinishedAt = row.lastFinishedAt;
      job.lastStatus = row.lastStatus;
      job.lastError = row.lastError;
      job.runCount = row.runCount ?? 0;
      job.consecutiveFailures = row.consecutiveFailures ?? 0;
      if (!row.lastStartedAt) return true;
      return Date.now() - new Date(row.lastStartedAt).getTime() > maxAgeMs;
    } catch (err) {
      console.warn(
        `[Scheduler] Could not read job_runs for "${job.name}" (treating as recently-run to avoid boot herd):`,
        (err as Error).message,
      );
      return false;
    }
  }

  /** Delay until the next tick: interval (backed off if failing) + jitter. */
  private nextDelay(job: JobState): number {
    const base =
      job.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
        ? job.intervalMs! * BACKOFF_MULTIPLIER
        : job.intervalMs!;
    const jitter = job.opts.jitterMs ? Math.floor(Math.random() * job.opts.jitterMs) : 0;
    return base + jitter;
  }

  private scheduleIn(job: JobState, delayMs: number): void {
    if (job.cancelled) return;
    job.nextRunAt = new Date(Date.now() + delayMs);
    job.timer = setTimeout(() => void this.runIntervalTick(job), delayMs);
    job.timer.unref?.();
  }

  private async runIntervalTick(job: JobState): Promise<void> {
    await this.executeJob(job);
    if (!job.cancelled) this.scheduleIn(job, this.nextDelay(job));
  }

  private async executeJob(job: JobState): Promise<void> {
    if (job.cancelled) return;
    if (job.running) {
      console.warn(`[Scheduler] "${job.name}" still running — skipping this tick (overlap guard)`);
      return;
    }
    job.running = true;
    job.lastStartedAt = new Date();
    await this.persistStart(job);

    try {
      await job.fn();
      job.runCount += 1;
      job.consecutiveFailures = 0;
      job.lastStatus = 'success';
      job.lastError = null;
    } catch (err) {
      job.runCount += 1;
      job.consecutiveFailures += 1;
      job.lastStatus = 'failure';
      job.lastError = (err as Error)?.message ?? String(err);
      if (job.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error(
          `🚨 [Scheduler] Job "${job.name}" has failed ${job.consecutiveFailures} times in a row — ` +
            `backing off to ${BACKOFF_MULTIPLIER}x its interval. Last error: ${job.lastError}`,
        );
      } else {
        console.error(`[Scheduler] Job "${job.name}" failed:`, job.lastError);
      }
    } finally {
      job.running = false;
      job.lastFinishedAt = new Date();
      await this.persistFinish(job);
    }
  }

  private async persistStart(job: JobState): Promise<void> {
    try {
      await db
        .insert(jobRuns)
        .values({
          name: job.name,
          lastStartedAt: job.lastStartedAt,
          lastStatus: 'running',
          runCount: job.runCount,
          consecutiveFailures: job.consecutiveFailures,
        })
        .onConflictDoUpdate({
          target: jobRuns.name,
          set: {
            lastStartedAt: job.lastStartedAt,
            lastStatus: 'running',
          },
        });
    } catch (err) {
      console.warn(`[Scheduler] Could not persist start of "${job.name}":`, (err as Error).message);
    }
  }

  private async persistFinish(job: JobState): Promise<void> {
    try {
      await db
        .insert(jobRuns)
        .values({
          name: job.name,
          lastStartedAt: job.lastStartedAt,
          lastFinishedAt: job.lastFinishedAt,
          lastStatus: job.lastStatus,
          lastError: job.lastError,
          runCount: job.runCount,
          consecutiveFailures: job.consecutiveFailures,
        })
        .onConflictDoUpdate({
          target: jobRuns.name,
          set: {
            lastFinishedAt: job.lastFinishedAt,
            lastStatus: job.lastStatus,
            lastError: job.lastError,
            runCount: job.runCount,
            consecutiveFailures: job.consecutiveFailures,
          },
        });
    } catch (err) {
      console.warn(`[Scheduler] Could not persist finish of "${job.name}":`, (err as Error).message);
    }
  }
}

export const jobScheduler = new JobScheduler();
