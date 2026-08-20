import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- db mock: simulates the UNIQUE (edition_date, edition) constraint -------
const dbState: {
  claims: Map<string, { id: string; status: string; sentBy: string; claimedAtMs: number }>;
  nextId: number;
  nowMs: number;
  failExecute: boolean;
} = { claims: new Map(), nextId: 1, nowMs: Date.parse("2026-08-15T20:00:00Z"), failExecute: false };

vi.mock("../../db", () => ({
  db: {
    execute: async (query: any) => {
      if (dbState.failExecute) throw new Error("db down");
      const text: string = (query?.queryChunks ?? [])
        .map((c: any) => (typeof c === "object" && c?.value ? c.value.join("") : `¶${JSON.stringify(c)}¶`))
        .join("");
      const params: any[] = (query?.queryChunks ?? []).filter((c: any) => typeof c === "string" || typeof c === "number");
      if (text.includes("INSERT INTO newsletters")) {
        // params: [subject, editionDate, edition, sentBy]
        const [, editionDate, edition, sentBy] = params;
        const key = `${editionDate}|${edition}`;
        if (dbState.claims.has(key)) return { rows: [] }; // ON CONFLICT DO NOTHING
        const id = `claim-${dbState.nextId++}`;
        dbState.claims.set(key, { id, status: "sending", sentBy, claimedAtMs: dbState.nowMs });
        return { rows: [{ id }] };
      }
      if (text.includes("UPDATE newsletters SET sent_at = now()")) {
        // crash reclaim: params [sentBy, editionDate, edition]
        const [sentBy, editionDate, edition] = params;
        const row = dbState.claims.get(`${editionDate}|${edition}`);
        if (row && row.status === "sending" && dbState.nowMs - row.claimedAtMs > 3_600_000) {
          row.claimedAtMs = dbState.nowMs;
          row.sentBy = sentBy;
          return { rows: [{ id: row.id }] };
        }
        return { rows: [] };
      }
      if (text.includes("SET status = 'failed'")) {
        for (const row of dbState.claims.values()) if (row.id === params[0] && row.status === "sending") row.status = "failed";
        return { rows: [] };
      }
      return { rows: [] };
    },
  },
}));

const sendToWaitlist = vi.fn(async (_storage: any, opts: any) => {
  // Mark the claim 'sent' like finalizeClaim would.
  for (const row of dbState.claims.values()) if (row.id === opts.claimId) row.status = "sent";
  return { success: true, sentCount: 3, failedCount: 0, newsletterId: opts.claimId };
});
vi.mock("../newsletterService", () => ({ newsletterService: { sendToWaitlist: (...a: any[]) => sendToWaitlist(...a) } }));
vi.mock("../../storage", () => ({ storage: {} }));

import { newsletterScheduler } from "../newsletterScheduler";

beforeEach(() => {
  dbState.claims.clear();
  dbState.nextId = 1;
  dbState.nowMs = Date.parse("2026-08-15T20:00:00Z");
  dbState.failExecute = false;
  sendToWaitlist.mockClear();
  // Pin Date to the mock-db clock: the scheduler keys slots off new Date(),
  // so without this the tests silently depend on the real calendar date.
  vi.useFakeTimers({ now: dbState.nowMs, toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("newsletter claim-then-send (UNIQUE edition_date+edition)", () => {
  it("same-slot second attempt aborts at the constraint and dispatches nothing", async () => {
    const r1 = await newsletterScheduler.sendNewsletter("Market Close", "cron");
    const r2 = await newsletterScheduler.sendNewsletter("Market Close", "catch-up");
    expect(r1.sent).toBe(true);
    expect(r2).toEqual({ sent: false, reason: "already-claimed" });
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
    expect(dbState.claims.size).toBe(1);
  });

  it("boot catch-up with today's edition already sent does nothing", async () => {
    // Cron sent this morning; the claim row is in the log as 'sent'.
    dbState.claims.set(`${today()}|morning`, { id: "prior", status: "sent", sentBy: "cron", claimedAtMs: dbState.nowMs - 8 * 3_600_000 });
    const r = await newsletterScheduler.sendNewsletter("Morning", "catch-up");
    expect(r.sent).toBe(false);
    expect(sendToWaitlist).not.toHaveBeenCalled();
  });

  it("a genuinely missed slot sends exactly once, even under concurrent catch-up attempts", { timeout: 20000 }, async () => {
    const results = await Promise.all([
      newsletterScheduler.sendNewsletter("Morning", "catch-up"),
      newsletterScheduler.sendNewsletter("Morning", "catch-up"),
      newsletterScheduler.sendNewsletter("Morning", "catch-up"),
    ]);
    expect(results.filter((r) => r.sent).length).toBe(1);
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
  });

  it("timezone edge: boot at 20:00 UTC (16:00 ET) keys the morning slot to the SAME ET date, so a sent 8:00 ET edition blocks re-send", async () => {
    const bootUtc = new Date("2026-08-15T20:00:00Z"); // 16:00 ET same day
    const slot = newsletterScheduler.slotFor("Morning", bootUtc);
    expect(slot).toEqual({ editionDate: "2026-08-15", edition: "morning" });
    // Morning already sent at 8:00 ET → catch-up at 16:00 ET must abort.
    dbState.claims.set("2026-08-15|morning", { id: "sent-8am", status: "sent", sentBy: "cron", claimedAtMs: Date.parse("2026-08-15T12:00:08Z") });
    const r = await newsletterScheduler.sendNewsletter("Morning", "catch-up");
    expect(r.sent).toBe(false);
    expect(sendToWaitlist).not.toHaveBeenCalled();
    // And near-midnight UTC does not roll the ET date forward.
    expect(newsletterScheduler.slotFor("Market Close", new Date("2026-08-16T02:00:00Z")).editionDate).toBe("2026-08-15");
  });

  it("a crashed 'sending' claim older than 1h is reclaimed and re-sent", async () => {
    dbState.claims.set(`${today()}|market_close`, { id: "crashed", status: "sending", sentBy: "cron", claimedAtMs: dbState.nowMs - 2 * 3_600_000 });
    const r = await newsletterScheduler.sendNewsletter("Market Close", "catch-up");
    expect(r.sent).toBe(true);
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
  });

  it("a fresh 'sending' claim (< 1h) is NOT reclaimed", async () => {
    dbState.claims.set(`${today()}|market_close`, { id: "inflight", status: "sending", sentBy: "cron", claimedAtMs: dbState.nowMs - 10 * 60_000 });
    const r = await newsletterScheduler.sendNewsletter("Market Close", "catch-up");
    expect(r.sent).toBe(false);
    expect(sendToWaitlist).not.toHaveBeenCalled();
  });

  it("delivery errors finalize the claim as 'failed' — never reclaimable, never re-sent", async () => {
    sendToWaitlist.mockImplementationOnce(async (_s: any, opts: any) => {
      // Simulate finalizeClaim marking a partial failure 'failed'.
      for (const row of dbState.claims.values()) if (row.id === opts.claimId) row.status = "failed";
      return { success: false, sentCount: 1, failedCount: 2, errors: ["Batch 1: boom"] };
    });
    const r = await newsletterScheduler.sendNewsletter("Market Close", "cron");
    expect(r.sent).toBe(false);
    expect(r.reason).toBe("send-errors");
    expect(r.failedCount).toBe(2);
    // Even >1h later, a 'failed' claim is not reclaimed.
    dbState.nowMs += 2 * 3_600_000;
    vi.setSystemTime(dbState.nowMs);
    const r2 = await newsletterScheduler.sendNewsletter("Market Close", "catch-up");
    expect(r2).toEqual({ sent: false, reason: "already-claimed" });
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
  });

  it("a thrown send error marks the 'sending' claim 'failed' and reports error", async () => {
    sendToWaitlist.mockImplementationOnce(async () => { throw new Error("resend down"); });
    const r = await newsletterScheduler.sendNewsletter("Morning", "cron");
    expect(r).toEqual({ sent: false, reason: "error" });
    const row = dbState.claims.get(`${today()}|morning`);
    expect(row?.status).toBe("failed");
  });

  it("fails CLOSED when the claim cannot be recorded (db down → no send)", async () => {
    dbState.failExecute = true;
    const r = await newsletterScheduler.sendNewsletter("Morning", "cron");
    expect(r.sent).toBe(false);
    expect(sendToWaitlist).not.toHaveBeenCalled();
  });
});

describe("NEWSLETTER_ENABLED kill switch", () => {
  afterEach(() => {
    delete process.env.NEWSLETTER_ENABLED;
  });

  it("default (unset) is ENABLED — sends normally", async () => {
    const r = await newsletterScheduler.sendNewsletter("Morning", "cron");
    expect(r.sent).toBe(true);
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
  });

  it("NEWSLETTER_ENABLED=false returns before claim/send and dispatches nothing", async () => {
    process.env.NEWSLETTER_ENABLED = "false";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const r = await newsletterScheduler.sendNewsletter("Morning", "cron");
    expect(r).toEqual({ sent: false, reason: "disabled" });
    // Never claimed a slot, never dispatched.
    expect(dbState.claims.size).toBe(0);
    expect(sendToWaitlist).not.toHaveBeenCalled();
    // Exactly one concise skip log for this path.
    const skips = logSpy.mock.calls.filter((c) => String(c[0]).includes("NEWSLETTER_ENABLED=false"));
    expect(skips.length).toBe(1);
    logSpy.mockRestore();
  });

  it("NEWSLETTER_ENABLED=false blocks the catch-up path too", async () => {
    process.env.NEWSLETTER_ENABLED = "false";
    const r = await newsletterScheduler.sendNewsletter("Market Close", "catch-up");
    expect(r.sent).toBe(false);
    expect(r.reason).toBe("disabled");
    expect(dbState.claims.size).toBe(0);
    expect(sendToWaitlist).not.toHaveBeenCalled();
  });

  it("any non-'false' value (e.g. 'true') keeps sending enabled", async () => {
    process.env.NEWSLETTER_ENABLED = "true";
    const r = await newsletterScheduler.sendNewsletter("Morning", "cron");
    expect(r.sent).toBe(true);
    expect(sendToWaitlist).toHaveBeenCalledTimes(1);
  });
});

describe("slot-date keying math (pure, no DB)", () => {
  it("maps UTC boot times to the correct ET edition_date", () => {
    // EDT (UTC-4): 12:00 UTC = 8:00 ET, morning slot, same date
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-08-15T12:00:00Z")))
      .toEqual({ editionDate: "2026-08-15", edition: "morning" });
    // The 20:00-UTC edge: 16:00 ET, still the SAME ET date
    expect(newsletterScheduler.slotFor("Market Close", new Date("2026-08-15T20:00:00Z")))
      .toEqual({ editionDate: "2026-08-15", edition: "market_close" });
    // Late-evening UTC past midnight UTC: 02:00Z on the 16th = 22:00 ET on the 15th
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-08-16T02:00:00Z")).editionDate)
      .toBe("2026-08-15");
    // Just before the ET midnight boundary: 03:59Z = 23:59 ET previous day
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-08-16T03:59:00Z")).editionDate)
      .toBe("2026-08-15");
    // At/after ET midnight it rolls: 04:00Z = 00:00 ET on the 16th
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-08-16T04:00:00Z")).editionDate)
      .toBe("2026-08-16");
    // Winter (EST, UTC-5): 04:59Z = 23:59 ET previous day; 05:00Z rolls
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-01-16T04:59:00Z")).editionDate)
      .toBe("2026-01-15");
    expect(newsletterScheduler.slotFor("Morning", new Date("2026-01-16T05:00:00Z")).editionDate)
      .toBe("2026-01-16");
  });

  it("keys edition purely off the day label", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    expect(newsletterScheduler.slotFor("Morning", now).edition).toBe("morning");
    expect(newsletterScheduler.slotFor("Market Close", now).edition).toBe("market_close");
  });
});

describe("reclaim-age threshold decision (mocked ON CONFLICT)", () => {
  it("exactly at the 1h boundary is NOT reclaimed; just past it is", async () => {
    // 60min old: not strictly older than 1h → no reclaim
    dbState.claims.set(`${today()}|morning`, { id: "b", status: "sending", sentBy: "cron", claimedAtMs: dbState.nowMs - 3_600_000 });
    expect((await newsletterScheduler.sendNewsletter("Morning", "catch-up")).sent).toBe(false);
    // 61min old: reclaimed and re-sent
    dbState.claims.set(`${today()}|morning`, { id: "b", status: "sending", sentBy: "cron", claimedAtMs: dbState.nowMs - 3_660_000 });
    expect((await newsletterScheduler.sendNewsletter("Morning", "catch-up")).sent).toBe(true);
  });
});

function today(): string {
  return new Date(dbState.nowMs).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
