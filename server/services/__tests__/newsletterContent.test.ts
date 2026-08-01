import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.TZ = "UTC";

// ---- db mock ---------------------------------------------------------------
const dbState: { markets: any[] } = { markets: [] };

vi.mock("../../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => dbState.markets,
          }),
        }),
      }),
    }),
  },
}));

// ---- model gateway mock ----------------------------------------------------
const gatewayState: { impl: (() => Promise<any>) | null } = { impl: null };

vi.mock("../../lib/modelGateway", () => ({
  modelGateway: {
    complete: (req: any) => {
      if (gatewayState.impl) return gatewayState.impl();
      return Promise.resolve({ content: "mocked brief", model: "test" });
    },
  },
}));

vi.mock("../stockMarketService", () => ({
  stockMarketService: {
    getTechAiMovers: async () => ({ gainers: [], losers: [] }),
    getStockQuote: async () => ({ c: 0, dp: 0 }),
  },
}));

import {
  fetchHotMarkets,
  fetchUpcomingStreams,
  generateAgentsBrief,
} from "../newsletterContentGenerator";
import { generateNewsletterHTML } from "../newsletterTemplate";
import type { NewsletterContent } from "../newsletterContentGenerator";

const NOW = new Date("2026-08-01T12:00:00Z");
const FUTURE = new Date("2026-10-01T00:00:00Z");
const PAST = new Date("2026-01-01T00:00:00Z");

function market(overrides: Partial<any> = {}): any {
  return {
    question: "Will BTC trade above $80k?",
    status: "active",
    deadline: FUTURE,
    totalVolume: 100000,
    totalTrades: 100,
    yesPrice: 3400,
    ...overrides,
  };
}

beforeEach(() => {
  dbState.markets = [];
  gatewayState.impl = null;
});

describe("fetchHotMarkets", () => {
  it("excludes expired markets", async () => {
    dbState.markets = [
      market({ question: "expired", deadline: PAST }),
      market({ question: "future A" }),
      market({ question: "future B" }),
    ];
    const result = await fetchHotMarkets(NOW);
    const questions = result.map((m) => m.question);
    expect(questions).not.toContain("expired");
    expect(questions).toContain("future A");
    expect(questions).toContain("future B");
  });

  it("excludes markets with fewer than 25 traders", async () => {
    dbState.markets = [
      market({ question: "thin", totalTrades: 5 }),
      market({ question: "liquid A", totalTrades: 50 }),
      market({ question: "liquid B", totalTrades: 30 }),
    ];
    const result = await fetchHotMarkets(NOW);
    const questions = result.map((m) => m.question);
    expect(questions).not.toContain("thin");
    expect(questions).toEqual(expect.arrayContaining(["liquid A", "liquid B"]));
  });

  it("falls back to the largest future-dated market when fewer than 2 qualify", async () => {
    dbState.markets = [
      market({ question: "qualified", totalTrades: 40, totalVolume: 5000 }),
      market({ question: "big but thin", totalTrades: 3, totalVolume: 900000 }),
      market({ question: "small and thin", totalTrades: 2, totalVolume: 100 }),
      market({ question: "expired big", totalTrades: 500, totalVolume: 999999999, deadline: PAST }),
    ];
    const result = await fetchHotMarkets(NOW);
    const questions = result.map((m) => m.question);
    expect(questions).toContain("qualified");
    expect(questions).toContain("big but thin");
    expect(questions).not.toContain("expired big");
    expect(questions).not.toContain("small and thin");
    expect(result.length).toBe(2);
  });

  it("includes a resolves label from the real deadline", async () => {
    dbState.markets = [market(), market({ question: "second" })];
    const result = await fetchHotMarkets(NOW);
    expect(result[0].resolves).toMatch(/Sep 30|Oct 1/);
  });
});

describe("fetchUpcomingStreams", () => {
  it("labels stream times in ET regardless of server timezone", async () => {
    expect(process.env.TZ).toBe("UTC");
    const streams = await fetchUpcomingStreams(NOW);
    expect(streams).toHaveLength(2);
    expect(streams[0].time).toContain("8:00 AM ET");
    expect(streams[1].time).toContain("4:00 PM ET");
    for (const s of streams) {
      expect(s.time).not.toContain("EST");
    }
  });

  it("rolls a slot to the next day once its ET hour has passed", async () => {
    // 2026-08-01T13:00:00Z = 9:00 AM ET (EDT) — morning slot passed, afternoon not.
    const at = new Date("2026-08-01T13:00:00Z");
    const streams = await fetchUpcomingStreams(at);
    expect(streams[0].time).toContain("Aug 2"); // morning rolls to next day
    expect(streams[1].time).toContain("Aug 1"); // 4 PM ET still ahead
  });

  it("keeps a slot on today at its exact start time", async () => {
    // 2026-08-01T12:00:00Z = exactly 8:00:00 AM ET (EDT)
    const atMorningStart = new Date("2026-08-01T12:00:00Z");
    const streams = await fetchUpcomingStreams(atMorningStart);
    expect(streams[0].time).toContain("Aug 1");

    // One second later, the morning slot has passed.
    const justAfter = new Date("2026-08-01T12:00:01Z");
    const later = await fetchUpcomingStreams(justAfter);
    expect(later[0].time).toContain("Aug 2");
  });
});

describe("generateAgentsBrief", () => {
  const inputs = {
    btcPrice: 64334,
    btcChange: 0.29,
    ethPrice: 1873,
    ethChange: 0.66,
    spyChange: 0.1,
    fearGreedIndex: 27,
    stockGainers: [],
    stockLosers: [],
  };

  it("returns the gateway completion when it succeeds", async () => {
    gatewayState.impl = () => Promise.resolve({ content: "A calm tape today.", model: "test" });
    const brief = await generateAgentsBrief(inputs);
    expect(brief).toBe("A calm tape today.");
  });

  it("produces a non-empty factual fallback when the gateway rejects", async () => {
    gatewayState.impl = () => Promise.reject(new Error("gateway down"));
    const brief = await generateAgentsBrief(inputs);
    expect(brief.length).toBeGreaterThan(0);
    expect(brief).toContain("64,334");
    expect(brief).toContain("27/100");
  });
});

describe("generateNewsletterHTML", () => {
  const content: NewsletterContent = {
    subject: "Test",
    marketHighlights: [],
    topGainers: [],
    topLosers: [],
    stockGainers: [],
    stockLosers: [],
    agentsBrief: "Brief text.",
    totalMarketCap: "~$2.8T",
    btcDominance: "~50%",
    btcPrice: 64334,
    btcChange: 0.29,
    ethPrice: 1873,
    ethChange: 0.66,
    spyPrice: 738.93,
    spyChange: 0.1,
    fearGreedIndex: 27,
    hotMarkets: [],
    upcomingStreams: [],
    newsStories: [],
  };

  it("contains both color-scheme meta tags and no #ffffff page background", () => {
    const html = generateNewsletterHTML(content, "tok123");
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(html.toLowerCase()).not.toContain("#ffffff");
    expect(html).toContain("color-scheme: light dark");
  });

  it("skips empty sections cleanly", () => {
    const html = generateNewsletterHTML(content, "tok123");
    expect(html).not.toContain("Live on the Markets");
    expect(html).not.toContain("Next AI Streams");
    expect(html).not.toContain("While You Slept");
    expect(html).not.toContain("Crypto &mdash; 24h");
  });
});
