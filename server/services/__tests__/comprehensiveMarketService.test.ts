import { describe, expect, it, vi } from "vitest";

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));
vi.mock("axios", () => ({ default: { get: axiosGet } }));
vi.mock("../duneAnalyticsService", () => ({ duneAnalyticsService: {} }));
vi.mock("../duneService", () => ({ duneService: { isAvailable: () => false } }));
vi.mock("../macroDataService", () => ({
  macroDataService: { getFearGreedIndex: vi.fn(async () => ({ value: 55, timestamp: "2024-01-01T00:00:00Z" })) },
}));

import {
  ComprehensiveMarketService,
  isUnusualVolume,
  percentileRank,
  selectMarketMovers,
  previousDominanceShift,
} from "../comprehensiveMarketService";

describe("market pulse calculations", () => {
  it("calculates a bounded percentile rank", () => {
    expect(percentileRank(30, [10, 20, 30, 40])).toBe(75);
    expect(percentileRank(10, [])).toBe(0);
  });

  it("marks volume at least 1.5x the 30 day average as unusual", () => {
    expect(isUnusualVolume(150, 100)).toBe(true);
    expect(isUnusualVolume(149, 100)).toBe(false);
    expect(isUnusualVolume(1, 0)).toBe(false);
  });

  it("ranks the documented CoinGecko 24h field and excludes stablecoins", () => {
    const movers = selectMarketMovers([
      { id: "stable", symbol: "USDT", price_change_percentage_24h: 99 },
      { id: "up", symbol: "AAA", price_change_percentage_24h: 8 },
      { id: "down", symbol: "BBB", price_change_percentage_24h: -7 },
      { id: "missing", symbol: "CCC" },
    ], 1);
    expect(movers.map(item => item.id)).toEqual(["up", "down"]);
  });

  it("calculates BTC dominance movement as percentage points", () => {
    // BTC rose 10%, total cap rose 20%: dominance falls from 50% to ~45.45%.
    expect(previousDominanceShift(50, 20, 10)).toBeCloseTo(-4.545, 2);
    expect(previousDominanceShift(50, 20, Number.NaN)).toBeUndefined();
  });

  it("returns a stamped delayed section from the last good provider response", async () => {
    const service = new ComprehensiveMarketService() as any;
    service.finnhubKey = "";
    service.marketDataService = { getCryptoStocks: vi.fn(async () => []) };
    const timestamp = Date.now() - 11 * 60 * 1000;
    service.pulseCache.set("global", { timestamp, data: {
      btc: { value: 50 }, cap: { value: 1000 },
    }});
    axiosGet.mockRejectedValue(new Error("provider down"));
    const pulse = await service.getMarketPulse();
    expect(pulse.btcDominance.delayed).toBe(true);
    expect(pulse.btcDominance.asOf).toBe(new Date(timestamp).toISOString());
    expect(pulse.totalMarketCap.data.value).toBe(1000);
  });

  it("cooldowns a failed provider and serves stale data without retrying", async () => {
    const service = new ComprehensiveMarketService() as any;
    let attempts = 0;
    const timestamp = Date.now() - 11 * 60 * 1000;
    service.pulseCache.set("cooldown", { timestamp, data: { value: 7 } });
    const fetcher = async () => {
      attempts++;
      throw new Error("down");
    };
    const first = await service.pulseProvider("cooldown", "TestProvider", fetcher);
    const second = await service.pulseProvider("cooldown", "TestProvider", fetcher);
    expect(attempts).toBe(1);
    expect(first.delayed).toBe(true);
    expect(second.asOf).toBe(new Date(timestamp).toISOString());
  });

  it("splits covered stock movers by Finnhub industry, not crypto categories", async () => {
    const service = new ComprehensiveMarketService() as any;
    service.finnhubKey = "configured";
    service.marketDataService = {
      getCoveredStockSymbols: vi.fn(() => ["AAA", "BBB"]),
      getStockQuote: vi.fn(async (symbol: string) => ({
        symbol, percentChange24h: symbol === "AAA" ? 2 : -1,
      })),
    };
    axiosGet.mockImplementation(async (url: string) => {
      if (url.includes("profile2")) return { data: { finnhubIndustry: "Technology" } };
      throw new Error("not expected");
    });
    await expect(service.fetchStockSectorSplit()).resolves.toEqual([
      { sector: "Technology", gainers: 1, losers: 1 },
    ]);
  });
});