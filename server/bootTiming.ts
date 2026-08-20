/**
 * Lightweight process-local boot telemetry.
 *
 * This module intentionally has no application imports so the minimal
 * bootstrap can use it before loading the Express dependency graph.
 */

export const BOOT_PHASES = [
  "appImport",
  "validateEnv",
  "routes",
  "schedulerRegistration",
  "engineStarts",
] as const;

export type BootPhase = (typeof BOOT_PHASES)[number];

interface MutablePhaseTiming {
  durationMs: number;
  runs: number;
  active: number;
}

export interface BootTimingSnapshot {
  startedAt: string;
  ready: boolean;
  readyMs: number | null;
  totalMs: number;
  phases: Record<
    BootPhase,
    {
      durationMs: number;
      runs: number;
      status: "pending" | "running" | "complete";
    }
  >;
}

let bootStartedAt = Date.now();
let readyMs: number | null = null;
const phaseTimings = Object.fromEntries(
  BOOT_PHASES.map((phase) => [
    phase,
    { durationMs: 0, runs: 0, active: 0 } satisfies MutablePhaseTiming,
  ]),
) as Record<BootPhase, MutablePhaseTiming>;

export function initializeBootTiming(startedAt: number): void {
  bootStartedAt = startedAt;
  readyMs = null;
  for (const phase of BOOT_PHASES) {
    phaseTimings[phase] = { durationMs: 0, runs: 0, active: 0 };
  }
}

/**
 * Start a phase span. Repeated spans accumulate, which lets scheduler
 * registration and engine starts report one total even when split into
 * several post-ready batches.
 */
export function startBootPhase(phase: BootPhase): () => void {
  const startedAt = Date.now();
  phaseTimings[phase].active += 1;
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    const timing = phaseTimings[phase];
    timing.active = Math.max(0, timing.active - 1);
    timing.runs += 1;
    timing.durationMs += Math.max(0, Date.now() - startedAt);
  };
}

export function markBootReady(): BootTimingSnapshot {
  readyMs = Math.max(0, Date.now() - bootStartedAt);
  return getBootTimingSnapshot();
}

export function getBootTimingSnapshot(): BootTimingSnapshot {
  const totalMs = Math.max(0, Date.now() - bootStartedAt);
  return {
    startedAt: new Date(bootStartedAt).toISOString(),
    ready: readyMs !== null,
    readyMs,
    totalMs,
    phases: Object.fromEntries(
      BOOT_PHASES.map((phase) => {
        const timing = phaseTimings[phase];
        const status =
          timing.active > 0
            ? "running"
            : timing.runs > 0
              ? "complete"
              : "pending";
        return [
          phase,
          {
            durationMs: timing.durationMs,
            runs: timing.runs,
            status,
          },
        ];
      }),
    ) as BootTimingSnapshot["phases"],
  };
}

export function formatBootTimingLine(
  snapshot: BootTimingSnapshot = getBootTimingSnapshot(),
): string {
  const duration = (phase: BootPhase): string => {
    const timing = snapshot.phases[phase];
    return timing.status === "pending" ? "pending" : `${timing.durationMs}ms`;
  };
  return (
    `[boot] phases: appImport=${duration("appImport")} ` +
    `validateEnv=${duration("validateEnv")} ` +
    `routes=${duration("routes")} ` +
    `schedulerRegistration=${duration("schedulerRegistration")} ` +
    `engineStarts=${duration("engineStarts")} ` +
    `ready=${snapshot.readyMs ?? snapshot.totalMs}ms`
  );
}

/**
 * Queue non-routing startup work on a later event-loop turn. The bootstrap
 * calls this only after its real handler is installed and ready is marked.
 */
export function schedulePostReadyWork(
  work: () => void | Promise<void>,
  delayMs = 0,
): NodeJS.Timeout {
  return setTimeout(() => {
    Promise.resolve()
      .then(work)
      .catch((err) => {
        console.error("[boot] post-ready work failed (non-fatal):", err);
      });
  }, delayMs);
}