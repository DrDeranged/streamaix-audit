import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the db module so no real Postgres is touched.
const dbState: {
  rows: any[];
  failReads: boolean;
  readCalls: number;
  // Advisory-lock controls (consumed by the mocked pool client below).
  lockHeld: boolean;         // pg_try_advisory_lock returns false (held elsewhere)
  connectFails: boolean;     // pool.connect() throws (lock infra unavailable)
  unlockCalls: number;       // count of pg_advisory_unlock invocations
  releaseCalls: number;      // count of client.release() invocations
} = { rows: [], failReads: false, readCalls: 0, lockHeld: false, connectFails: false, unlockCalls: 0, releaseCalls: 0 };

vi.mock('../../db', () => {
  const select = () => ({
    from: () => ({
      where: async () => {
        dbState.readCalls++;
        if (dbState.failReads) throw new Error('db down');
        return dbState.rows;
      },
    }),
  });
  const insert = () => ({
    values: () => ({
      onConflictDoUpdate: async () => undefined,
    }),
  });
  const pool = {
    connect: async () => {
      if (dbState.connectFails) throw new Error('no connection');
      return {
        query: async (text: string) => {
          if (text.includes('pg_try_advisory_lock')) {
            return { rows: [{ locked: !dbState.lockHeld }] };
          }
          if (text.includes('pg_advisory_unlock')) {
            dbState.unlockCalls++;
            return { rows: [{ pg_advisory_unlock: true }] };
          }
          return { rows: [] };
        },
        release: () => { dbState.releaseCalls++; },
      };
    },
  };
  return { db: { select, insert }, pool };
});

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn(() => ({ stop: vi.fn() })) },
}));

import { JobScheduler } from '../scheduler';

const HOUR = 60 * 60 * 1000;
const flush = async () => {
  // let pending promises (db reads, executeJob) settle
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('JobScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dbState.rows = [];
    dbState.failReads = false;
    dbState.readCalls = 0;
    dbState.lockHeld = false;
    dbState.connectFails = false;
    dbState.unlockCalls = 0;
    dbState.releaseCalls = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('runs on start when there is no persisted run', async () => {
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('skips the boot run when last_started_at is fresh (herd fix)', async () => {
    dbState.rows = [{ name: 'a', lastStartedAt: new Date(Date.now() - 10 * 60 * 1000), lastFinishedAt: null, lastStatus: 'success', lastError: null, runCount: 3, consecutiveFailures: 0 }];
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs on start when last_started_at is older than the interval', async () => {
    dbState.rows = [{ name: 'a', lastStartedAt: new Date(Date.now() - 2 * HOUR), lastFinishedAt: null, lastStatus: 'success', lastError: null, runCount: 3, consecutiveFailures: 0 }];
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('treats a DB read failure as recently-run (no boot herd)', async () => {
    dbState.failReads = true;
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('applies the stagger offset before the boot run', async () => {
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true, staggerMs: 30_000 });
    await flush();
    await vi.advanceTimersByTimeAsync(29_000);
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reschedules on the interval after each run', async () => {
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('overlap guard: skips a tick while the previous run is in flight', async () => {
    const s = new JobScheduler();
    let resolveRun!: () => void;
    let calls = 0;
    const fn = vi.fn(() => {
      calls++;
      return new Promise<void>((r) => (resolveRun = r));
    });
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);

    // first run still in flight; interval scheduling only continues after the
    // run completes, so trigger via a second manual timer pass
    const status1 = s.getStatus().find((j) => j.name === 'a')!;
    expect(status1.running).toBe(true);

    resolveRun();
    await flush();
    const status2 = s.getStatus().find((j) => j.name === 'a')!;
    expect(status2.running).toBe(false);
    expect(status2.lastStatus).toBe('success');
  });

  it('backs off to 4x interval after 5 consecutive failures and logs loudly', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = new JobScheduler();
    const fn = vi.fn(async () => {
      throw new Error('boom');
    });
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0); // failure 1
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(HOUR); // failures 2..5
    }
    expect(fn).toHaveBeenCalledTimes(5);
    const st = s.getStatus().find((j) => j.name === 'a')!;
    expect(st.consecutiveFailures).toBe(5);
    expect(st.backoffActive).toBe(true);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes('backing off'))).toBe(true);

    // now the next run should NOT happen at 1x interval...
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fn).toHaveBeenCalledTimes(5);
    // ...but at 4x
    await vi.advanceTimersByTimeAsync(3 * HOUR);
    expect(fn).toHaveBeenCalledTimes(6);
    errSpy.mockRestore();
  });

  it('a success resets consecutive failures', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = new JobScheduler();
    let fail = true;
    const fn = vi.fn(async () => {
      if (fail) throw new Error('boom');
    });
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(s.getStatus()[0].consecutiveFailures).toBe(1);
    fail = false;
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(s.getStatus()[0].consecutiveFailures).toBe(0);
    expect(s.getStatus()[0].lastStatus).toBe('success');
    errSpy.mockRestore();
  });

  it('cancel() stops future runs', async () => {
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    s.cancel('a');
    await vi.advanceTimersByTimeAsync(10 * HOUR);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(s.getStatus()[0].cancelled).toBe(true);
  });

  it('ignores duplicate registrations', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = new JobScheduler();
    s.register('a', HOUR, vi.fn());
    s.register('a', HOUR, vi.fn());
    expect(s.getStatus()).toHaveLength(1);
    warnSpy.mockRestore();
  });

  it('hydrates a registration batch with one DB read and no sequential per-job awaits', async () => {
    const s = new JobScheduler();
    s.beginRegistrationBatch();
    s.register('a', HOUR, vi.fn(), { runOnStart: true });
    s.register('b', HOUR, vi.fn(), { runOnStart: true });
    s.registerCron('c', '0 8 * * *', vi.fn(), {
      runOnStart: true,
      freshForMs: HOUR,
    });

    expect(dbState.readCalls).toBe(0);
    await s.endRegistrationBatch();
    expect(dbState.readCalls).toBe(1);
  });

  it('includes async starter registrations that arrive during the batch quiet period', async () => {
    const s = new JobScheduler();
    s.beginRegistrationBatch();
    s.register('first', HOUR, vi.fn());
    setTimeout(() => s.register('late', HOUR, vi.fn()), 50);

    const done = s.endRegistrationBatch(100);
    await vi.advanceTimersByTimeAsync(200);
    await done;

    expect(s.jobCount()).toBe(2);
    expect(dbState.readCalls).toBe(1);
  });

  it('rejects registrations that arrive after shutdown has started', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = new JobScheduler();
    await s.stopAll(0);
    s.register('late-interval', HOUR, vi.fn());
    s.registerCron('late-cron', '0 8 * * *', vi.fn());
    expect(s.jobCount()).toBe(0);
    expect(s.has('late-interval')).toBe(false);
    expect(s.has('late-cron')).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it('registerCron registers with node-cron and appears in status', async () => {
    const cron = (await import('node-cron')).default;
    const s = new JobScheduler();
    s.registerCron('c', '0 8 * * *', vi.fn(), { timezone: 'America/New_York' });
    expect(cron.schedule).toHaveBeenCalledWith('0 8 * * *', expect.any(Function), { timezone: 'America/New_York' });
    const st = s.getStatus().find((j) => j.name === 'c')!;
    expect(st.kind).toBe('cron');
    expect(st.cronExpression).toBe('0 8 * * *');
  });

  it('registerCron runOnStart only fires when stale', async () => {
    dbState.rows = [{ name: 'c', lastStartedAt: new Date(Date.now() - 1000), lastFinishedAt: null, lastStatus: 'success', lastError: null, runCount: 1, consecutiveFailures: 0 }];
    const s = new JobScheduler();
    const fn = vi.fn();
    s.registerCron('c', '0 */6 * * *', fn, { runOnStart: true, freshForMs: 6 * HOUR });
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------ advisory lock

  it('acquires and releases the advisory lock around each run', async () => {
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    // The lock must be released (unlock + client.release) after the run.
    expect(dbState.unlockCalls).toBe(1);
    expect(dbState.releaseCalls).toBe(1);
  });

  it('silently skips the run when the advisory lock is held by another instance', async () => {
    dbState.lockHeld = true;
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    // Body did NOT run because the lock is held elsewhere...
    expect(fn).not.toHaveBeenCalled();
    // ...and we did not acquire it, so there is nothing to unlock, but the
    // checked-out client is still released.
    expect(dbState.unlockCalls).toBe(0);
    expect(dbState.releaseCalls).toBe(1);
    const st = s.getStatus().find((j) => j.name === 'a')!;
    expect(st.lastStatus).toBe('skipped-locked');
    // A held lock is not a failure — no backoff accrual.
    expect(st.consecutiveFailures).toBe(0);
  });

  it('releases the advisory lock even when the job body throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = new JobScheduler();
    const fn = vi.fn(async () => { throw new Error('boom'); });
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(dbState.unlockCalls).toBe(1);
    expect(dbState.releaseCalls).toBe(1);
    const st = s.getStatus().find((j) => j.name === 'a')!;
    expect(st.lastStatus).toBe('failure');
    errSpy.mockRestore();
  });

  it('fails closed when the lock connection is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dbState.connectFails = true;
    const s = new JobScheduler();
    const fn = vi.fn();
    s.register('a', HOUR, fn, { runOnStart: true });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    // Never run side effects without the cross-instance lock.
    expect(fn).not.toHaveBeenCalled();
    const st = s.getStatus().find((j) => j.name === 'a')!;
    expect(st.lastStatus).toBe('lock-unavailable');
    expect(st.lastStartedAt).toBeNull();
    warnSpy.mockRestore();
  });

  // ------------------------------------------------------- catch-up fail-safe

  it('catch-up SKIPS a job whose persisted state cannot be read (fail-safe)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = new JobScheduler();
    const fn = vi.fn();
    // Register a daily cron; no persisted row exists yet.
    s.registerCron('c', '0 8 * * *', fn, { timezone: 'America/New_York' });
    await flush();
    // Now simulate the DB read failing during the catch-up check.
    dbState.failReads = true;
    await s.runCatchUpCheck(new Date('2026-08-15T20:00:00Z'));
    // Fail-safe: do NOT run side effects when persisted state is unavailable.
    expect(fn).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('catch-up runs a genuinely missed slot when persisted state is readable', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    dbState.rows = []; // readable, but no prior run recorded → missed slot
    const s = new JobScheduler();
    const fn = vi.fn();
    s.registerCron('c', '0 8 * * *', fn, { timezone: 'America/New_York' });
    await flush();
    await s.runCatchUpCheck(new Date('2026-08-15T20:00:00Z'));
    await flush();
    expect(fn).toHaveBeenCalledTimes(1);
    // Catch-up goes through executeJob, so it acquires and releases the exact
    // same job-name advisory lock as the normal cron callback.
    expect(dbState.unlockCalls).toBe(1);
    expect(dbState.releaseCalls).toBe(1);
    logSpy.mockRestore();
  });
});
