import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { axiosGet } = vi.hoisted(() => ({
  axiosGet: vi.fn(),
}));
vi.mock("axios", () => ({
  default: { get: axiosGet },
}));
vi.mock("../duneAnalyticsService", () => ({
  duneAnalyticsService: {},
}));
vi.mock("../duneService", () => ({
  duneService: {
    isAvailable: () => false,
    getTokenPrice: vi.fn(),
  },
}));

import {
  getCoinGeckoErrorCode,
  MarketDataService,
} from "../marketDataService";

describe("CoinGecko provider degradation", () => {
  const original = { ...process.env };

  beforeEach(() => {
    axiosGet.mockReset();
    delete process.env.COINGECKO_PRO_API_KEY;
    delete process.env.COINMARKETCAP_API_KEY;
    process.env.COINGECKO_API_KEY = "configured";
  });

  afterEach(() => {
    process.env = { ...original };
    vi.restoreAllMocks();
  });

  it("classifies error_code 10010", () => {
    expect(
      getCoinGeckoErrorCode({ response: { data: { error_code: "10010" } } }),
    ).toBe(10010);
  });

  it("warns once, disables the bad provider, and keeps using fallbacks", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    axiosGet.mockImplementation(async (url: string, config?: any) => {
      if (url.includes("api.coingecko.com")) {
        throw {
          response: { data: { error_code: 10010 } },
          message: "plan mismatch",
        };
      }
      if (url.includes("cryptocompare.com")) {
        const symbols = String(config?.params?.fsyms || "")
          .split(",")
          .filter(Boolean);
        return {
          data: {
            RAW: Object.fromEntries(
              symbols.map((symbol) => [
                symbol,
                {
                  USD: {
                    PRICE: 100,
                    CHANGEPCT24HOUR: 1,
                    MKTCAP: 1000,
                    TOTALVOLUME24HTO: 100,
                  },
                },
              ]),
            ),
          },
        };
      }
      throw new Error(`unexpected URL ${url}`);
    });

    const service = new MarketDataService();
    expect(await service.getCryptoQuotes(["BTC"])).toHaveLength(1);
    expect(await service.getCryptoQuotes(["ETH"])).toHaveLength(1);

    const coinGeckoCalls = axiosGet.mock.calls.filter(([url]) =>
      String(url).includes("api.coingecko.com"),
    );
    expect(coinGeckoCalls).toHaveLength(1);
    expect(
      warn.mock.calls.filter(([line]) =>
        String(line).includes("error_code=10010"),
      ),
    ).toHaveLength(1);
    expect(
      warn.mock.calls.some(([line]) =>
        String(line).includes("[Tier 2] CoinGecko Demo failed"),
      ),
    ).toBe(false);
  });

  it("disables Pro process-wide when a non-quote endpoint returns 10010", async () => {
    process.env.COINGECKO_PRO_API_KEY = "configured";
    delete process.env.COINGECKO_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    axiosGet.mockRejectedValue({
      response: { data: { error_code: 10010 } },
      message: "plan mismatch",
    });

    const service = new MarketDataService();
    await expect(service.getTrendingCoins()).resolves.toEqual({
      trending: [],
      mostVisited: [],
    });
    await expect(service.getGlobalMarketData()).resolves.toBeNull();

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(
      warn.mock.calls.filter(([line]) =>
        String(line).includes("error_code=10010"),
      ),
    ).toHaveLength(1);
  });
});