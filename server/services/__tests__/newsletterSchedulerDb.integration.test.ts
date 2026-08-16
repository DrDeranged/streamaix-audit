import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Live-database integration tests for the newsletter claim-then-send guard.
 * Requires a provisioned database: verifies the REAL unique index
 * (newsletters_edition_date_edition_idx) enforces exactly-once claims —
 * the property the mocked unit tests can only simulate.
 *
 * Skipped (visibly) when DATABASE_URL is not set so `npm test` is portable.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
if (!hasDb) {
  console.warn(
    "⏭️  Skipping newsletterSchedulerDb.integration.test.ts: DATABASE_URL not set (live-DB tests need a provisioned database)",
  );
}

// Per-run namespace: edition_date is text, so a unique non-date marker can
// never collide with a real edition (always YYYY-MM-DD) or a concurrent run.
const EDITION_DATE = `test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const insertedIds: string[] = [];

describe.skipIf(!hasDb)("newsletters unique-slot constraint (live DB)", () => {
  let db: typeof import("../../db").db;
  let sql: typeof import("drizzle-orm").sql;

  beforeAll(async () => {
    // Guarded dynamic import: server/db.ts throws at module load without DATABASE_URL.
    ({ db } = await import("../../db"));
    ({ sql } = await import("drizzle-orm"));
  });

  afterAll(async () => {
    if (!hasDb) return;
    // Delete only the rows this run inserted, by captured id.
    for (const id of insertedIds) {
      await db.execute(sql`DELETE FROM newsletters WHERE id = ${id} AND subject = '[test-claim]'`);
    }
  });

  it("second claim for the same (edition_date, edition) hits ON CONFLICT and returns no row", async () => {
    const claim = () =>
      db.execute(sql`
        INSERT INTO newsletters (subject, content, status, edition_date, edition, sent_by, sent_at, recipient_count)
        VALUES ('[test-claim]', '', 'sending', ${EDITION_DATE}, 'morning', 'manual', now(), 0)
        ON CONFLICT (edition_date, edition) DO NOTHING
        RETURNING id
      `);
    const first = await claim();
    const second = await claim();
    for (const r of [first, second]) for (const row of (r as any).rows) insertedIds.push(row.id);
    expect((first as any).rows).toHaveLength(1);
    expect((second as any).rows).toHaveLength(0);
  });

  it("concurrent claims yield exactly one winner", async () => {
    const claim = () =>
      db.execute(sql`
        INSERT INTO newsletters (subject, content, status, edition_date, edition, sent_by, sent_at, recipient_count)
        VALUES ('[test-claim]', '', 'sending', ${EDITION_DATE}, 'market_close', 'manual', now(), 0)
        ON CONFLICT (edition_date, edition) DO NOTHING
        RETURNING id
      `);
    const results = await Promise.all([claim(), claim(), claim()]);
    for (const r of results) for (const row of (r as any).rows) insertedIds.push(row.id);
    const winners = results.filter((r) => (r as any).rows.length === 1);
    expect(winners).toHaveLength(1);
  });
});
