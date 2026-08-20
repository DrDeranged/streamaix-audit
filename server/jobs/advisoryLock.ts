/**
 * PostgreSQL session-level advisory locks keyed by job name.
 *
 * Used by the JobScheduler to guarantee that at most ONE process/instance
 * executes a given job body (cron tick or catch-up run) at a time — the
 * in-process overlap guard cannot protect against a second app instance
 * (rolling deploy, horizontal scale) firing the same cron slot.
 *
 * Semantics:
 *  - Acquire with pg_try_advisory_lock (non-blocking). If the lock is already
 *    held by another session, withJobLock silently skips the work.
 *  - The lock is session-level and must be released on the SAME connection,
 *    so a single dedicated client is checked out for the lock's lifetime and
 *    the lock is ALWAYS released (pg_advisory_unlock) in a finally block.
 *  - If the lock infrastructure itself errors (e.g. DB unreachable), fail
 *    closed and do NOT run the job. Running unlocked can duplicate sends and
 *    other side effects during a multi-instance rollout.
 */
import { pool } from '../db';

const LOCK_NAMESPACE = 0x5343; // 'SC' — arbitrary constant to namespace job locks

/** Deterministic 32-bit signed key from a job name (matches Postgres hashtext-style folding). */
export function lockKeyForJob(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return h;
}

export type JobLockOutcome<T> =
  | { ran: true; result: T }
  | { ran: false; reason: 'held' | 'unavailable'; error?: string };

/**
 * Run `fn` while holding the advisory lock for `name`.
 *  - Returns { ran: true, result } when the lock was acquired and fn ran.
 *  - Returns { ran: false } when the lock is held elsewhere (silent skip).
 * The lock is guaranteed released before returning.
 */
export async function withJobLock<T>(
  name: string,
  fn: () => Promise<T> | T,
): Promise<JobLockOutcome<T>> {
  const key = lockKeyForJob(name);

  let client: any;
  try {
    client = await pool.connect();
  } catch (err) {
    console.warn(
      `[Scheduler] Advisory lock unavailable for "${name}" — skipping:`,
      (err as Error).message,
    );
    return {
      ran: false,
      reason: 'unavailable',
      error: (err as Error).message,
    };
  }

  // Acquire the lock. A failure HERE is a lock-infrastructure error, so fail
  // closed. Errors thrown by fn still propagate to the caller.
  let acquired = false;
  try {
    const res: any = await client.query('SELECT pg_try_advisory_lock($1, $2) AS locked', [LOCK_NAMESPACE, key]);
    acquired = res?.rows?.[0]?.locked === true;
  } catch (err) {
    console.warn(
      `[Scheduler] Advisory lock error for "${name}" — skipping:`,
      (err as Error).message,
    );
    try { client.release(); } catch { /* best effort */ }
    return {
      ran: false,
      reason: 'unavailable',
      error: (err as Error).message,
    };
  }

  if (!acquired) {
    try { client.release(); } catch { /* best effort */ }
    return { ran: false, reason: 'held' };
  }

  // Lock held — run the body. fn errors propagate; the lock is always released.
  try {
    return { ran: true, result: await fn() };
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_NAMESPACE, key]);
    } catch (err) {
      console.warn(`[Scheduler] Failed to release advisory lock for "${name}":`, (err as Error).message);
    }
    try { client.release(); } catch { /* best effort */ }
  }
}
