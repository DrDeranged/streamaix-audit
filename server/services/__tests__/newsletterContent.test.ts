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

  it("contains both color-scheme meta tags", () => {
    const html = generateNewsletterHTML(content, "tok123");
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(html).toContain("color-scheme: light dark");
  });

  it("is light-first: page background is the light page color, cards are white", () => {
    const html = generateNewsletterHTML(content, "tok123");
    // Page stays a light off-white (NOT pure white).
    expect(html).toContain('bgcolor="#F6F7FB"');
    expect(html).toContain("background-color:#F6F7FB");
    // Cards are now pure white by design (the old "no #ffffff" rule is retired).
    expect(html).toContain('bgcolor="#FFFFFF"');
    expect(html).toContain("background-color:#FFFFFF");
  });

  // A fully-populated variant so every colored element (gain/loss/markets)
  // renders and its inline color can be asserted.
  const fullContent: NewsletterContent = {
    ...content,
    topGainers: [{ symbol: "BTC", name: "Bitcoin", price: 64334, changePercent: 2.5 } as any],
    topLosers: [{ symbol: "XRP", name: "XRP", price: 0.5, changePercent: -3.1 } as any],
    stockGainers: [{ symbol: "NVDA", price: 900, changePercent: 1.2 } as any],
    stockLosers: [{ symbol: "TSLA", price: 200, changePercent: -1.8 } as any],
    hotMarkets: [
      { question: "Will BTC top $80k?", yesPercent: 62, volume: 100000, traders: 100, resolves: "Sep 30" } as any,
    ],
    upcomingStreams: [{ title: "Morning brief", time: "8:00 AM ET" } as any],
    newsStories: [
      { title: "Headline", url: "https://x.com", source: "Src", published: "2026-07-31T12:00:00Z" } as any,
    ],
  };

  it("emits the light palette hexes as inline defaults", () => {
    const html = generateNewsletterHTML(fullContent, "tok123");
    const lightInline = [
      "#F6F7FB", // page
      "#FFFFFF", // card
      "#E3E7F2", // border
      "#ECEFF6", // divider
      "#10162A", // primary text
      "#2A3350", // body text
      "#5B6378", // secondary text
      "#6A7185", // muted (AA-adjusted)
      "#6D5BE0", // accent (also used as button bg)
      "#188250", // gain (AA-adjusted)
      "#C84157", // loss (AA-adjusted)
      "#9F6519", // warn (AA-adjusted)
    ];
    for (const hex of lightInline) {
      expect(html).toContain(hex);
    }
  });

  it("puts the dark ink palette only inside a prefers-color-scheme:dark block with !important", () => {
    const html = generateNewsletterHTML(content, "tok123");
    expect(html).toContain("@media (prefers-color-scheme: dark)");

    const darkBlock = html.slice(html.indexOf("@media (prefers-color-scheme: dark)"));
    const darkInk = ["#080B14", "#10162A", "#232B45", "#1A2138", "#F2F4FA", "#3DD68C", "#FF7B7B", "#FFB454"];
    for (const hex of darkInk) {
      expect(darkBlock).toContain(hex);
      // each dark ink color must be an !important override
      const re = new RegExp(hex + "[^;{}]*!important");
      expect(darkBlock).toMatch(re);
    }
  });

  it("never uses a dark page/card hex as an INLINE default background", () => {
    const html = generateNewsletterHTML(fullContent, "tok123");
    // Strip ALL <style>...</style> blocks: dark hexes are only allowed there.
    const inlineHtml = html.replace(/<style>[\s\S]*?<\/style>/g, "");

    // #080B14 is a pure dark-only color: it must not appear inline at all.
    expect(inlineHtml).not.toContain("#080B14");
    // #10162A doubles as the LIGHT primary text; assert it is never used as a
    // background inline (bgcolor attr or background-color declaration).
    expect(inlineHtml).not.toContain('bgcolor="#10162A"');
    expect(inlineHtml).not.toContain("background-color:#10162A");
  });

  it("meets WCAG AA (>= 4.5:1) for the key light text/background pairs", () => {
    const relLum = (hex: string): number => {
      const c = hex.replace("#", "");
      const chan = [0, 2, 4]
        .map((i) => parseInt(c.substr(i, 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
    };
    const contrast = (a: string, b: string): number => {
      const l1 = relLum(a);
      const l2 = relLum(b);
      const hi = Math.max(l1, l2);
      const lo = Math.min(l1, l2);
      return (hi + 0.05) / (lo + 0.05);
    };

    const page = "#F6F7FB";
    const card = "#FFFFFF";
    const accent = "#6D5BE0";
    const pairs: Array<[string, string, string]> = [
      ["primary/page", "#10162A", page],
      ["body/page", "#2A3350", page],
      ["secondary/page", "#5B6378", page],
      ["muted/page", "#6A7185", page],
      ["accent/page", accent, page],
      ["accentDeep/card", "#5B49D6", card],
      ["gain/card", "#188250", card],
      ["loss/card", "#C84157", card],
      ["warn/card", "#9F6519", card],
      ["gain/page", "#188250", page],
      ["loss/page", "#C84157", page],
      ["warn/page", "#9F6519", page],
      ["buttonText/accent", "#FFFFFF", accent],
    ];
    for (const [name, fg, bg] of pairs) {
      const ratio = contrast(fg, bg);
      expect(ratio, `${name} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("skips empty sections cleanly", () => {
    const html = generateNewsletterHTML(content, "tok123");
    expect(html).not.toContain("Live on the Markets");
    expect(html).not.toContain("Next AI Streams");
    expect(html).not.toContain("While You Slept");
    expect(html).not.toContain("Crypto &mdash; 24h");
  });
});
