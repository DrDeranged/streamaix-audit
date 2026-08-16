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

// Synthetic slot far in the past so we can never collide with a real edition.
const EDITION_DATE = "1999-01-01";

describe.skipIf(!hasDb)("newsletters unique-slot constraint (live DB)", () => {
  let db: typeof import("../../db").db;
  let sql: typeof import("drizzle-orm").sql;

  beforeAll(async () => {
    // Guarded dynamic import: server/db.ts throws at module load without DATABASE_URL.
    ({ db } = await import("../../db"));
    ({ sql } = await import("drizzle-orm"));
    await db.execute(sql`DELETE FROM newsletters WHERE edition_date = ${EDITION_DATE}`);
  });

  afterAll(async () => {
    if (!hasDb) return;
    await db.execute(sql`DELETE FROM newsletters WHERE edition_date = ${EDITION_DATE}`);
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
    const winners = results.filter((r) => (r as any).rows.length === 1);
    expect(winners).toHaveLength(1);
  });
});
