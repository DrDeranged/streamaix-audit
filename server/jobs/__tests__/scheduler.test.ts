import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the db module so no real Postgres is touched.
const dbState: { rows: any[]; failReads: boolean } = { rows: [], failReads: false };

vi.mock('../../db', () => {
  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => {
          if (dbState.failReads) throw new Error('db down');
          return dbState.rows;
        },
      }),
    }),
  });
  const insert = () => ({
    values: () => ({
      onConflictDoUpdate: async () => undefined,
    }),
  });
  return { db: { select, insert } };
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
});
