import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock ---------------------------------------------------------------
const dbState: { inserted: Array<{ table: any; values: any }>; updates: any[] } = {
  inserted: [],
  updates: [],
};

vi.mock("../../db", () => {
  const select = () => ({
    from: () => ({
      where: (..._a: any[]) => {
        const rows = Promise.resolve([{ id: "admin-1" }]);
        return {
          orderBy: () => ({ limit: async () => [] }),
          limit: async () => [],
          then: rows.then.bind(rows),
        };
      },
    }),
  });
  const insert = (table: any) => ({
    values: async (v: any) => {
      dbState.inserted.push({ table, values: v });
    },
  });
  const update = () => ({
    set: (v: any) => {
      dbState.updates.push(v);
      return { where: async () => undefined };
    },
  });
  return { db: { select, insert, update } };
});

// ---- model gateway mock ------------------------------------------------------
const gatewayState: { response: any; calls: any[] } = { response: null, calls: [] };

vi.mock("../../lib/modelGateway", () => ({
  modelGateway: {
    completeJson: vi.fn(async (req: any) => {
      gatewayState.calls.push(req);
      return gatewayState.response;
    }),
  },
}));

// ---- evidence source mocks ---------------------------------------------------
vi.mock("../marketDataService", () => ({
  marketDataService: {
    getCryptoQuotes: vi.fn(async (symbols: string[]) =>
      symbols.map((s) => ({
        symbol: s,
        price: 105000,
        marketCap: 2e12,
        percentChange24h: 1.1,
        percentChange7d: 4.2,
        percentChange30d: 12.3,
      }))
    ),
  },
}));
vi.mock("../newsService", () => ({
  newsService: {
    getCryptoNews: vi.fn(async () => [
      { title: "Bitcoin closes above 100k", source: "CoinDesk", published: "2026-07-01", url: "u", summary: "btc" },
    ]),
    getMacroNews: vi.fn(async () => []),
  },
}));
vi.mock("../macroDataService", () => ({
  macroDataService: {
    getTreasuryYields: vi.fn(async () => ({ tenYear: 4.1 })),
    getFearGreedIndex: vi.fn(async () => ({ value: 60, classification: "Greed" })),
  },
}));

// ---- settlement + notification mocks -----------------------------------------
const resolveMarketMock = vi.fn(async () => undefined);
vi.mock("../resolutionService", () => ({
  resolutionService: { resolveMarket: (...args: any[]) => resolveMarketMock(...args) },
}));
const sendToUserMock = vi.fn(async () => undefined);
vi.mock("../pushNotificationService", () => ({
  pushNotificationService: { sendToUser: (...args: any[]) => sendToUserMock(...args) },
}));

import { EvidenceResolutionService } from "../evidenceResolutionService";
import { marketResolutionsAudit } from "@shared/schema";

const market = {
  id: "m-1",
  question: "Will Bitcoin close above $100,000 by July 1, 2026?",
  description: "Resolves YES if BTC > $100k",
  category: "crypto",
  ticker: "BTC",
  deadline: new Date("2026-07-01"),
};

function auditRows() {
  return dbState.inserted.filter((i) => i.table === marketResolutionsAudit).map((i) => i.values);
}

describe("EvidenceResolutionService", () => {
  const svc = new EvidenceResolutionService();

  beforeEach(() => {
    dbState.inserted.length = 0;
    dbState.updates.length = 0;
    gatewayState.calls.length = 0;
    resolveMarketMock.mockClear();
    sendToUserMock.mockClear();
    delete process.env.RESOLUTION_CONFIDENCE_THRESHOLD;
  });

  it("auto-resolves when confident, cited, and resolvable — and passes an audit record", async () => {
    gatewayState.response = { resolution: "YES", confidence: 0.95, citedEvidence: [0], reasoning: "Price is above threshold" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("resolved");
    expect(resolveMarketMock).toHaveBeenCalledTimes(1);
    const args = resolveMarketMock.mock.calls[0];
    expect(args[1]).toBe("yes");
    const audit = args[6];
    expect(audit.resolvedBy).toBe("ai");
    expect(audit.autoResolved).toBe(true);
    expect(audit.confidence).toBe(0.95);
    expect(audit.evidence.items.length).toBeGreaterThan(0);
    // no escalation
    expect(dbState.updates.length).toBe(0);
  });

  it("escalates when confidence is below the threshold", async () => {
    gatewayState.response = { resolution: "YES", confidence: 0.6, citedEvidence: [0], reasoning: "unsure" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("escalated");
    expect(resolveMarketMock).not.toHaveBeenCalled();
    expect(dbState.updates[0].status).toBe("pending_review");
    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0].autoResolved).toBe(false);
    expect(rows[0].resolvedBy).toBe("ai");
    expect(sendToUserMock).toHaveBeenCalled();
  });

  it("escalates on UNRESOLVABLE even with high confidence", async () => {
    gatewayState.response = { resolution: "UNRESOLVABLE", confidence: 0.99, citedEvidence: [0], reasoning: "ambiguous" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("escalated");
    expect((result as any).escalationReason).toMatch(/unresolvable/i);
    expect(resolveMarketMock).not.toHaveBeenCalled();
    expect(dbState.updates[0].status).toBe("pending_review");
  });

  it("escalates when the model cites no evidence", async () => {
    gatewayState.response = { resolution: "NO", confidence: 0.95, citedEvidence: [], reasoning: "gut feeling" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("escalated");
    expect((result as any).escalationReason).toMatch(/cited no/i);
    expect(resolveMarketMock).not.toHaveBeenCalled();
  });

  it("treats out-of-range citations as uncited and escalates", async () => {
    gatewayState.response = { resolution: "NO", confidence: 0.95, citedEvidence: [99], reasoning: "cites nothing real" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("escalated");
    expect(resolveMarketMock).not.toHaveBeenCalled();
  });

  it("respects RESOLUTION_CONFIDENCE_THRESHOLD env override", async () => {
    process.env.RESOLUTION_CONFIDENCE_THRESHOLD = "0.5";
    gatewayState.response = { resolution: "YES", confidence: 0.6, citedEvidence: [0], reasoning: "ok" };

    const result = await svc.resolveWithEvidence(market);

    expect(result.action).toBe("resolved");
    expect(resolveMarketMock).toHaveBeenCalledTimes(1);
  });

  it("gathers price, history, and news evidence with provenance", async () => {
    const evidence = await svc.gatherEvidence(market);

    expect(evidence.length).toBeGreaterThanOrEqual(3);
    for (const item of evidence) {
      expect(item.source).toBeTruthy();
      expect(item.fetchedAt).toBeTruthy();
      expect(item.claim).toBeTruthy();
    }
    expect(evidence.some((e) => e.claim.includes("current price"))).toBe(true);
    expect(evidence.some((e) => e.claim.includes("historical change"))).toBe(true);
    expect(evidence.some((e) => e.claim.startsWith("Headline"))).toBe(true);
  });
});
