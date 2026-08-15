import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock db: controllable "persisted total" + captured upserts.
// ---------------------------------------------------------------------------
const dbState: {
  persistedTotal: number;
  upserts: Array<{ values: any; setDelta?: number }>;
  failFlush: boolean;
  failOnUpsertIndex: number | null;
  upsertAttempts: number;
} = { persistedTotal: 0, upserts: [], failFlush: false, failOnUpsertIndex: null, upsertAttempts: 0 };

vi.mock("../../db", () => ({
  db: {
    select: () => ({
      from: () => {
        const chain: any = {
          where: () => chain,
          groupBy: () => chain,
          orderBy: async () => [],
          then: (resolve: any) => resolve([{ total: dbState.persistedTotal }]),
        };
        return chain;
      },
    }),
    insert: () => ({
      values: (values: any) => ({
        onConflictDoUpdate: async () => {
          const idx = dbState.upsertAttempts++;
          if (dbState.failFlush) throw new Error("db down");
          if (dbState.failOnUpsertIndex !== null && idx === dbState.failOnUpsertIndex) {
            throw new Error("db down mid-batch");
          }
          dbState.upserts.push({ values });
        },
      }),
    }),
  },
}));

const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
  }
  return { default: MockAnthropic };
});

import {
  dailyBudgetLedger,
  checkBudget,
  tokenPricingPer1M,
  dailyBudgetUsd,
} from "../apiCostTracker";
import {
  ModelGateway,
  enforceBudget,
  BudgetExceededError,
  COSMETIC_TAGS,
  __resetAnthropicClientForTests,
} from "../../lib/modelGateway";

function seed(persistedTotal: number, budget = 100) {
  dailyBudgetLedger.__resetForTests();
  dbState.persistedTotal = persistedTotal;
  dbState.upserts = [];
  dbState.failFlush = false;
  dbState.failOnUpsertIndex = null;
  dbState.upsertAttempts = 0;
  process.env.DAILY_AI_BUDGET_USD = String(budget);
}

beforeEach(() => {
  seed(0);
});

afterEach(() => {
  delete process.env.DAILY_AI_BUDGET_USD;
  dailyBudgetLedger.__resetForTests();
});

describe("budget threshold state machine (budget=$100)", () => {
  it("79%: everything allowed, not degraded", async () => {
    seed(79);
    const b = await checkBudget();
    expect(b.degraded).toBe(false);
    expect(b.allowed).toBe(true);
    await expect(enforceBudget("background", "avatar-commentary")).resolves.toBeUndefined();
    await expect(enforceBudget("background", "newsletter")).resolves.toBeUndefined();
    await expect(enforceBudget("user", "chat")).resolves.toBeUndefined();
  });

  it("81%: cosmetic background calls shed; other background + user allowed", async () => {
    seed(81);
    const b = await checkBudget();
    expect(b.degraded).toBe(true);
    for (const tag of COSMETIC_TAGS) {
      await expect(enforceBudget("background", tag)).rejects.toBeInstanceOf(BudgetExceededError);
    }
    await expect(enforceBudget("background", "evidence-resolution")).resolves.toBeUndefined();
    await expect(enforceBudget("user", "chat")).resolves.toBeUndefined();
  });

  it("101%: ALL background blocked; user still allowed", async () => {
    seed(101);
    await expect(enforceBudget("background", "evidence-resolution")).rejects.toBeInstanceOf(BudgetExceededError);
    await expect(enforceBudget("background", "avatar-commentary")).rejects.toBeInstanceOf(BudgetExceededError);
    await expect(enforceBudget("user", "chat")).resolves.toBeUndefined();
  });

  it("151%: user calls blocked with a clear 503 message", async () => {
    seed(151);
    const err = await enforceBudget("user", "chat").catch((e) => e);
    expect(err).toBeInstanceOf(BudgetExceededError);
    expect(err.statusCode).toBe(503);
    expect(err.message).toMatch(/budget exceeded/i);
    const b = await checkBudget();
    expect(b.allowed).toBe(false);
  });

  it("defaults budget to $25 when env unset", () => {
    delete process.env.DAILY_AI_BUDGET_USD;
    expect(dailyBudgetUsd()).toBe(25);
  });
});

describe("persistence across simulated restart", () => {
  it("flushes pending spend as upserts and re-reads it after reset", async () => {
    seed(0);
    dailyBudgetLedger.recordSpend("anthropic", "claude-sonnet-4-6", 3.5);
    dailyBudgetLedger.recordSpend("anthropic", "claude-sonnet-4-6", 1.5);
    dailyBudgetLedger.recordSpend("openai", "tts-1", 0.25);
    await dailyBudgetLedger.flush();
    expect(dbState.upserts.length).toBe(2); // batched per (day,service,model)
    const total = dbState.upserts.reduce((s, u) => s + u.values.costUsd, 0);
    expect(total).toBeCloseTo(5.25);

    // "restart": in-memory state wiped, db retains the flushed total
    dailyBudgetLedger.__resetForTests();
    dbState.persistedTotal = 5.25;
    const b = await checkBudget();
    expect(b.spentToday).toBeCloseTo(5.25);
  });

  it("re-queues pending spend if the flush fails (never silently dropped)", async () => {
    seed(0);
    dailyBudgetLedger.recordSpend("anthropic", "claude-sonnet-4-6", 2);
    dbState.failFlush = true;
    await expect(dailyBudgetLedger.flush()).rejects.toThrow("db down");
    dbState.failFlush = false;
    await dailyBudgetLedger.flush();
    expect(dbState.upserts.length).toBe(1);
    expect(dbState.upserts[0].values.costUsd).toBeCloseTo(2);
  });

  it("partial flush failure re-queues ONLY unapplied rows (no double-count)", async () => {
    seed(0);
    dailyBudgetLedger.recordSpend("anthropic", "claude-sonnet-4-6", 3); // row 0 succeeds
    dailyBudgetLedger.recordSpend("openai", "tts-1", 1); // row 1 fails
    dailyBudgetLedger.recordSpend("openai", "whisper-1", 0.5); // row 2 never attempted
    dbState.failOnUpsertIndex = 1;
    await expect(dailyBudgetLedger.flush()).rejects.toThrow("mid-batch");
    expect(dbState.upserts.length).toBe(1); // only the sonnet row landed
    dbState.failOnUpsertIndex = null;
    await dailyBudgetLedger.flush();
    // sonnet row must NOT be re-upserted; the two failed rows land exactly once
    const totals: Record<string, number> = {};
    for (const u of dbState.upserts) totals[u.values.model] = (totals[u.values.model] ?? 0) + u.values.costUsd;
    expect(totals["claude-sonnet-4-6"]).toBeCloseTo(3);
    expect(totals["tts-1"]).toBeCloseTo(1);
    expect(totals["whisper-1"]).toBeCloseTo(0.5);
    expect(dbState.upserts.length).toBe(3);
  });

  it("counts unflushed in-memory spend toward today's total", async () => {
    seed(10);
    await checkBudget(); // load persisted 10
    dailyBudgetLedger.recordSpend("anthropic", "claude-sonnet-4-6", 5);
    const b = await checkBudget();
    expect(b.spentToday).toBeCloseTo(15);
  });
});

describe("gateway integration (mocked spend)", () => {
  let gateway: ModelGateway;

  beforeEach(() => {
    createMock.mockReset();
    __resetAnthropicClientForTests();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.PAUSE_ANTHROPIC_API;
    gateway = new ModelGateway();
  });

  it("blocks background completions past 100% without calling the model", async () => {
    seed(120);
    await expect(
      gateway.complete({ tier: "fast", priority: "background", tag: "newsletter", system: "s", user: "u" }),
    ).rejects.toBeInstanceOf(BudgetExceededError);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("allows user completions between 100% and 150% and records token spend", async () => {
    seed(120);
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "hi" }],
      usage: { input_tokens: 1_000_000, output_tokens: 0 },
    });
    const result = await gateway.complete({
      tier: "fast", priority: "user", tag: "chat", system: "s", user: "u",
    });
    expect(result.content).toBe("hi");
    await dailyBudgetLedger.flush();
    // haiku input rate default $1/1M
    expect(dbState.upserts[0].values.costUsd).toBeCloseTo(1);
    expect(dbState.upserts[0].values.service).toBe("anthropic");
  });

  it("sheds cosmetic-tagged background completions at 80%+", async () => {
    seed(85);
    await expect(
      gateway.complete({ tier: "fast", priority: "background", tag: "stream-conversation", system: "s", user: "u" }),
    ).rejects.toThrow(/cosmetic call .* skipped/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("fails open if the ledger errors (broken meter must not kill AI)", async () => {
    seed(0);
    const spy = vi.spyOn(dailyBudgetLedger, "checkBudget").mockRejectedValue(new Error("db exploded"));
    createMock.mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    const result = await gateway.complete({
      tier: "fast", priority: "background", tag: "newsletter", system: "s", user: "u",
    });
    expect(result.content).toBe("ok");
    spy.mockRestore();
  });
});

describe("cosmetic tag skip list", () => {
  it("matches the spec exactly", () => {
    expect(Array.from(COSMETIC_TAGS).sort()).toEqual([
      "avatar-commentary",
      "community-manager",
      "social-chatter",
      "stream-conversation",
    ]);
  });
});

describe("token pricing", () => {
  it("uses per-1M defaults with env overrides", () => {
    expect(tokenPricingPer1M("anthropic", "claude-sonnet-4-6")).toEqual({ input: 3, output: 15 });
    expect(tokenPricingPer1M("anthropic", "claude-haiku-4-5-20251001")).toEqual({ input: 1, output: 5 });
    process.env.PRICE_ANTHROPIC_SONNET_IN_PER_M = "6";
    expect(tokenPricingPer1M("anthropic", "claude-sonnet-4-6").input).toBe(6);
    delete process.env.PRICE_ANTHROPIC_SONNET_IN_PER_M;
  });
});
