import { describe, it, expect } from "vitest";
import { ammService } from "../ammService";

// Constants mirrored from ammService.ts
const FEE_RATE = 50; // 0.5% in basis points
const BASIS_POINTS = 10000;

/** Reference implementation of the constant-product output, with fee. */
function expectedSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  withFee = true,
): number {
  let effectiveIn = amountIn;
  if (withFee) {
    const fee = Math.floor((amountIn * FEE_RATE) / BASIS_POINTS);
    effectiveIn = amountIn - fee;
  }
  return Math.floor((effectiveIn * reserveOut) / (reserveIn + effectiveIn));
}

describe("calculateSwapOutput", () => {
  it("computes constant-product output with fee for known case", () => {
    // amountIn=1000, fee=floor(1000*50/10000)=5, effective=995
    // out = floor(995 * 10000 / (10000 + 995)) = floor(9950000/10995) = 904
    expect(ammService.calculateSwapOutput(1000, 10000, 10000)).toBe(904);
    expect(ammService.calculateSwapOutput(1000, 10000, 10000)).toBe(
      expectedSwapOutput(1000, 10000, 10000),
    );
  });

  it("computes output without fee when withFee=false", () => {
    // out = floor(1000 * 10000 / 11000) = 909
    expect(ammService.calculateSwapOutput(1000, 10000, 10000, false)).toBe(909);
  });

  it("applies exactly a 0.5% (50bp) fee to the input", () => {
    const withFee = ammService.calculateSwapOutput(10000, 100000, 100000, true);
    // fee = floor(10000*50/10000) = 50 → effective 9950
    const manualNoFee = ammService.calculateSwapOutput(9950, 100000, 100000, false);
    expect(withFee).toBe(manualNoFee);
  });

  it("output is always less than reserveOut (cannot drain the pool)", () => {
    const out = ammService.calculateSwapOutput(1_000_000, 1000, 1000);
    expect(out).toBeLessThan(1000);
  });

  it("throws on zero amount", () => {
    expect(() => ammService.calculateSwapOutput(0, 1000, 1000)).toThrow(
      "Amount must be positive",
    );
  });

  it("throws on negative amount", () => {
    expect(() => ammService.calculateSwapOutput(-5, 1000, 1000)).toThrow(
      "Amount must be positive",
    );
  });

  it("throws on zero input reserve", () => {
    expect(() => ammService.calculateSwapOutput(100, 0, 1000)).toThrow(
      "Insufficient liquidity",
    );
  });

  it("throws on zero output reserve", () => {
    expect(() => ammService.calculateSwapOutput(100, 1000, 0)).toThrow(
      "Insufficient liquidity",
    );
  });
});

describe("calculateMarketPrice", () => {
  it("returns 5000 (50/50) when both reserves are zero", () => {
    expect(ammService.calculateMarketPrice(0, 0, true)).toBe(5000);
    expect(ammService.calculateMarketPrice(0, 0, false)).toBe(5000);
  });

  it("YES price is noReserve/total (inverse relationship)", () => {
    // yes=3000, no=7000 → YES = floor(7000*10000/10000) = 7000
    expect(ammService.calculateMarketPrice(3000, 7000, true)).toBe(7000);
    // NO = floor(3000*10000/10000) = 3000
    expect(ammService.calculateMarketPrice(3000, 7000, false)).toBe(3000);
  });

  it("balanced reserves price at 5000", () => {
    expect(ammService.calculateMarketPrice(5000, 5000, true)).toBe(5000);
  });

  it("YES and NO prices sum to 10000 when total divides evenly", () => {
    const { yesPrice, noPrice } = ammService.calculateBothPrices(2500, 7500);
    expect(yesPrice + noPrice).toBe(10000);
  });

  it("YES and NO prices sum to within flooring error of 10000 otherwise", () => {
    const { yesPrice, noPrice } = ammService.calculateBothPrices(3333, 6666);
    const sum = yesPrice + noPrice;
    expect(sum).toBeGreaterThanOrEqual(10000 - 2); // two floors
    expect(sum).toBeLessThanOrEqual(10000);
  });
});

describe("calculatePriceImpact", () => {
  it("is capped at 100 (never exceeds it, approaches it for huge trades)", () => {
    const impact = ammService.calculatePriceImpact(100_000_000, 1000, 1000);
    expect(impact).toBeLessThanOrEqual(100);
    expect(impact).toBeGreaterThan(99.99);
  });

  it("larger trades produce larger impact", () => {
    const small = ammService.calculatePriceImpact(100, 100000, 100000);
    const medium = ammService.calculatePriceImpact(5000, 100000, 100000);
    const large = ammService.calculatePriceImpact(50000, 100000, 100000);
    expect(small).toBeLessThan(medium);
    expect(medium).toBeLessThan(large);
  });

  it("small trade against deep liquidity has near-zero impact", () => {
    const impact = ammService.calculatePriceImpact(1, 10_000_000, 10_000_000);
    expect(impact).toBeGreaterThanOrEqual(0);
    expect(impact).toBeLessThan(0.01);
  });

  it("matches value derived from the constant-product formula", () => {
    const amountIn = 1000;
    const reserveIn = 10000;
    const reserveOut = 10000;
    const amountOut = expectedSwapOutput(amountIn, reserveIn, reserveOut);
    const priceBefore = reserveOut / reserveIn;
    const priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn);
    const expected = Math.min(
      Math.abs((priceAfter - priceBefore) / priceBefore) * 100,
      100,
    );
    expect(ammService.calculatePriceImpact(amountIn, reserveIn, reserveOut)).toBeCloseTo(
      expected,
      10,
    );
  });
});
