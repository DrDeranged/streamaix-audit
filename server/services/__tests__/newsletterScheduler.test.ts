import { describe, it, expect, vi, beforeEach } from "vitest";

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

function today(): string {
  return new Date(dbState.nowMs).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
