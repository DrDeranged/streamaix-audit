/**
 * One-off backfill (2026-08-16 drift verdict #7): the legacy knowledge_avatars
 * performance columns (sharpe_ratio, alpha_generated, total_investments,
 * successful_exits, active_projects) were silently dropped by drizzle inserts
 * for existing rows and are 100% NULL. Populate them from avatarSeedData,
 * matching by handle, only where the column is still NULL.
 *
 * Run: npx tsx scripts/backfill-avatar-legacy-stats.ts
 */
import { db } from "../server/db";
import { knowledgeAvatars } from "@shared/schema";
import { avatarSeedData } from "../server/auto-seed";
import { and, eq, isNull } from "drizzle-orm";

async function main() {
  let updated = 0;
  for (const seed of avatarSeedData as Array<Record<string, unknown>>) {
    const handle = seed.handle as string | undefined;
    if (!handle) continue;
    const patch: Record<string, unknown> = {};
    for (const key of ["sharpeRatio", "alphaGenerated", "totalInvestments", "successfulExits", "activeProjects"] as const) {
      if (typeof seed[key] === "number") patch[key] = seed[key];
    }
    if (Object.keys(patch).length === 0) continue;
    const res = await db
      .update(knowledgeAvatars)
      .set(patch)
      .where(and(eq(knowledgeAvatars.handle, handle), isNull(knowledgeAvatars.sharpeRatio)))
      .returning({ id: knowledgeAvatars.id });
    updated += res.length;
  }
  console.log(`Backfilled legacy stats for ${updated} avatars.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
