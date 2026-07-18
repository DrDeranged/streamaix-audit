import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- db mock ---------------------------------------------------------------
const dbState: {
  market: any;
  inserted: Array<{ table: any; values: any }>;
  updates: any[];
} = {
  market: null,
  inserted: [],
  updates: [],
};

vi.mock("../../db", () => {
  const select = () => ({
    from: () => ({
      where: () => {
        const rows = Promise.resolve(dbState.market ? [dbState.market] : []);
        return {
          limit: async () => (dbState.market ? [dbState.market] : []),
          orderBy: () => ({ limit: async () => [] }),
          then: rows.then.bind(rows),
        };
      },
      orderBy: async () => [],
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

vi.mock("../agentResearchService", () => ({
  agentResearchService: { settleMemoriesForMarket: vi.fn(async () => undefined) },
}));
vi.mock("../pushNotificationService", () => ({
  pushNotificationService: { notifyMarketResolution: vi.fn(async () => undefined) },
}));

import { ResolutionService } from "../resolutionService";
import { marketResolutionsAudit, marketResolutions } from "@shared/schema";

function auditRows() {
  return dbState.inserted.filter((i) => i.table === marketResolutionsAudit).map((i) => i.values);
}

describe("ResolutionService audit trail", () => {
  const svc = new ResolutionService();

  beforeEach(() => {
    dbState.inserted.length = 0;
    dbState.updates.length = 0;
    dbState.market = {
      id: "m-1",
      question: "Will BTC close above $100k?",
      status: "pending_review",
      deadline: new Date(Date.now() - 86400000),
    };
  });

  it("writes an audit row on the admin resolution path", async () => {
    await svc.resolveMarket(
      "m-1",
      "no",
      "user-42",
      "admin_review",
      { note: "checked price history" },
      undefined,
      { resolvedBy: "admin:alice", autoResolved: false, reasoning: "checked price history" }
    );

    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0].resolvedBy).toBe("admin:alice");
    expect(rows[0].autoResolved).toBe(false);
    expect(rows[0].resolution).toBe("no");
    // legacy market_resolutions row still written
    expect(dbState.inserted.some((i) => i.table === marketResolutions)).toBe(true);
  });

  it("writes an audit row with AI metadata on the AI path", async () => {
    dbState.market.status = "active";
    await svc.resolveMarket(
      "m-1",
      "yes",
      undefined,
      "ai_evidence_pipeline",
      {},
      undefined,
      {
        resolvedBy: "ai",
        autoResolved: true,
        confidence: 0.93,
        evidence: { items: [{ source: "s", fetchedAt: "t", claim: "c", rawValue: 1 }], citedEvidence: [0] },
        reasoning: "evidence-backed",
      }
    );

    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0].resolvedBy).toBe("ai");
    expect(rows[0].autoResolved).toBe(true);
    expect(rows[0].confidence).toBe(0.93);
    expect((rows[0].evidence as any).citedEvidence).toEqual([0]);
  });

  it("still defaults to an admin-attributed audit row when no audit param is given", async () => {
    await svc.resolveMarket("m-1", "invalid", "user-7", "manual");

    const rows = auditRows();
    expect(rows.length).toBe(1);
    expect(rows[0].resolvedBy).toBe("admin:user-7");
    expect(rows[0].autoResolved).toBe(false);
  });

  it("rejects resolution when the market is already resolved", async () => {
    dbState.market.status = "resolved";
    await expect(svc.resolveMarket("m-1", "yes", "u", "manual")).rejects.toThrow(/already resolved/i);
    expect(auditRows().length).toBe(0);
  });
});
