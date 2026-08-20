import { describe, it, expect } from "vitest";
import { PatternRecognitionService } from "../patternRecognitionService";

/**
 * Regression tests for two runtime bugs fixed during the tsc burn-down:
 *  1) trough negation used `.map(x => -x)` on `{value,index}` OBJECTS, producing
 *     NaN and undefined `.value` reads. Fixed to `.map(x => ({...x, value: -x.value}))`.
 *  2) `findSupportResistanceLevels` called `findPeaks(data)` without `minDistance`,
 *     so the loop bounds were NaN and it always returned []. Fixed to pass 5.
 *
 * The methods are private, so we access them via an index cast (common vitest pattern).
 */
describe("PatternRecognitionService support/resistance & trough detection", () => {
  const service = PatternRecognitionService.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any;

  it("findPeaks(data, 5) returns finite peak values (no NaN)", () => {
    // Clear peaks at index 6 and 14 (both at least `minDistance` from the ends).
    const data = [1, 2, 3, 4, 5, 6, 20, 6, 5, 4, 3, 2, 3, 4, 21, 4, 3, 2, 1, 2, 3];
    const peaks = svc.findPeaks(data, 5) as Array<{ value: number; index: number }>;
    expect(peaks.length).toBeGreaterThan(0);
    for (const p of peaks) {
      expect(Number.isFinite(p.value)).toBe(true);
      expect(Number.isFinite(p.index)).toBe(true);
    }
  });

  it("negated troughs keep their index and produce a numeric (non-NaN) value", () => {
    // Simulate the trough computation used in detectHeadAndShouldersPatterns:
    // lows -> negate -> findPeaks -> negate back to real trough values.
    // Deepest low (value 1) at index 7, comfortably `minDistance` from both ends.
    const lows = [10, 9, 8, 7, 6, 5, 4, 1, 4, 5, 6, 7, 8, 9, 10];
    const troughs = (svc.findPeaks(lows.map((x: number) => -x), 5) as Array<{ value: number; index: number }>)
      .map((x) => ({ ...x, value: -x.value }));
    expect(troughs.length).toBeGreaterThan(0);
    for (const t of troughs) {
      expect(Number.isFinite(t.value)).toBe(true);
      expect(typeof t.index).toBe("number");
    }
    // The deepest low (value 1 at index 7) should surface as a trough.
    expect(troughs.some((t) => t.value === 1)).toBe(true);
  });

  it("findSupportResistanceLevels returns levels instead of always []", () => {
    // Peaks at indexes 6, 14 and 22 — each at least `minDistance` (5) from ends.
    const highs = [
      1, 2, 3, 4, 5, 6, 20, 6, 5, 4, 3, 2, 3, 4, 21, 4, 3, 2, 3, 4, 5, 6, 22, 6, 5, 4, 3, 2, 1,
    ];
    const resistance = svc.findSupportResistanceLevels(highs, "resistance") as number[];
    expect(Array.isArray(resistance)).toBe(true);
    expect(resistance.length).toBeGreaterThan(0);
    for (const level of resistance) {
      expect(Number.isFinite(level)).toBe(true);
    }
  });
});
