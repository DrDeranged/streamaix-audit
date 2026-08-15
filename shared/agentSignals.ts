/**
 * Agent Signals — shared pure logic (server, client, tests).
 *
 * Signals are observational theses published by agents; they are NEVER
 * advice and NEVER auto-executed. Every trade is user-initiated and
 * user-signed via the swap rail.
 */

export const SIGNAL_DIRECTIONS = ["accumulate", "reduce", "neutral"] as const;
export type SignalDirection = (typeof SIGNAL_DIRECTIONS)[number];

export const MAX_THESIS_WORDS = 80;
export const MAX_SIGNALS_PER_CYCLE = 3;
/** |price move| below this % counts a "neutral" thesis as correct. */
export const NEUTRAL_BAND_PCT = 2;
/** Suggested trade size is capped at this % of the user's relevant balance. */
export const SUGGESTED_SIZE_CAP_PCT = 5;

export const TIME_HORIZONS = ["24h", "3d", "7d"] as const;
export type TimeHorizon = (typeof TIME_HORIZONS)[number];
export const HORIZON_HOURS: Record<TimeHorizon, number> = { "24h": 24, "3d": 72, "7d": 168 };

/**
 * Imperative advice verbs banned from published theses. Matched as whole
 * words, case-insensitive. Observational framing ("momentum has slowed",
 * "accumulation continued") passes; instructions ("buy now") do not.
 */
export const BANNED_ADVICE_PATTERNS: RegExp[] = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\byou should\b/i,
  /\byou must\b/i,
  /\byou need to\b/i,
  /\bget in\b/i,
  /\bget out\b/i,
  /\bape\b/i,
  /\ball[- ]in\b/i,
  /\bdon'?t miss\b/i,
  /\bact now\b/i,
  /\btake profits?\b/i,
  /\bload up\b/i,
  /\bdump\b/i,
  /\bguaranteed\b/i,
  /\bcan'?t lose\b/i,
];

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Returns the first banned pattern found in the text, or null. */
export function findBannedAdvice(text: string): string | null {
  for (const re of BANNED_ADVICE_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

export interface SignalPayload {
  token: string;
  direction: string;
  thesis: string;
  confidence: number;
  keyEvidence: string[];
  invalidation: string;
  timeHorizon: string;
}

/** Validate a model-produced signal payload. Returns [] when valid. */
export function validateSignalPayload(p: Partial<SignalPayload>): string[] {
  const errors: string[] = [];
  if (!p.token || typeof p.token !== "string") errors.push("token missing");
  if (!SIGNAL_DIRECTIONS.includes(p.direction as SignalDirection)) {
    errors.push(`direction must be one of ${SIGNAL_DIRECTIONS.join("|")}`);
  }
  if (!p.thesis || typeof p.thesis !== "string") {
    errors.push("thesis missing");
  } else {
    if (countWords(p.thesis) > MAX_THESIS_WORDS) errors.push(`thesis exceeds ${MAX_THESIS_WORDS} words`);
    const banned = findBannedAdvice(p.thesis);
    if (banned) errors.push(`thesis contains banned advice phrasing: "${banned}"`);
  }
  if (typeof p.confidence !== "number" || !Number.isFinite(p.confidence) || p.confidence < 0 || p.confidence > 1) {
    errors.push("confidence must be a number in [0,1]");
  }
  if (!Array.isArray(p.keyEvidence) || p.keyEvidence.length === 0 || !p.keyEvidence.every((e) => typeof e === "string")) {
    errors.push("keyEvidence must be a non-empty string array");
  }
  if (!p.invalidation || typeof p.invalidation !== "string") {
    errors.push("invalidation missing");
  } else {
    const banned = findBannedAdvice(p.invalidation);
    if (banned) errors.push(`invalidation contains banned advice phrasing: "${banned}"`);
  }
  if (!TIME_HORIZONS.includes(p.timeHorizon as TimeHorizon)) {
    errors.push(`timeHorizon must be one of ${TIME_HORIZONS.join("|")}`);
  }
  return errors;
}

export interface SignalResolution {
  /** Hypothetical % return of acting on the thesis direction. */
  hypotheticalReturnPct: number;
  /** Whether the thesis was directionally correct. */
  correct: boolean;
}

/**
 * Resolve a signal against real prices. accumulate profits when price rises,
 * reduce "profits" (avoids loss) when price falls, neutral is correct when
 * the move stayed within NEUTRAL_BAND_PCT either way (return 0 by definition).
 */
export function resolveSignalOutcome(
  direction: SignalDirection,
  entryPrice: number,
  resolvePrice: number
): SignalResolution {
  if (!(entryPrice > 0) || !(resolvePrice > 0)) {
    throw new Error("resolveSignalOutcome requires positive prices");
  }
  const movePct = ((resolvePrice - entryPrice) / entryPrice) * 100;
  if (direction === "accumulate") {
    return { hypotheticalReturnPct: round2(movePct), correct: movePct > 0 };
  }
  if (direction === "reduce") {
    return { hypotheticalReturnPct: round2(-movePct), correct: movePct < 0 };
  }
  return { hypotheticalReturnPct: 0, correct: Math.abs(movePct) <= NEUTRAL_BAND_PCT };
}

/**
 * Suggested trade size: capPct% of the relevant balance, never more.
 * Returns null when the balance is unknown or non-positive.
 */
export function computeSuggestedSize(balance: number | null | undefined, capPct: number = SUGGESTED_SIZE_CAP_PCT): number | null {
  if (balance === null || balance === undefined || !Number.isFinite(balance) || balance <= 0) return null;
  const pct = Math.min(Math.max(capPct, 0), SUGGESTED_SIZE_CAP_PCT);
  return balance * (pct / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
