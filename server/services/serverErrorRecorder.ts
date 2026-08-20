/**
 * serverErrorRecorder — Phase 1 durable server error visibility.
 *
 * Records unexpected server errors into the `server_errors` table, deduplicated
 * by (SHA-256 stack hash + UTC hour bucket) with an increment count. Sources:
 *   - the global Express error handler (source="route", tag=route path)
 *   - background jobs (source="job", tag=job name)
 *   - process-level hooks (source="process", tag="uncaughtException" |
 *     "unhandledRejection")
 *
 * Hard requirements:
 *   - MUST NEVER recurse or crash the process if the DB is unavailable. Every
 *     write is best-effort and fully swallowed. A re-entrancy guard prevents an
 *     error thrown *inside* the recorder from being recorded again.
 *   - NO runtime DDL. Writes are INSERT ... ON CONFLICT DO UPDATE only. If the
 *     table does not exist the write simply fails and is swallowed.
 */
import { createHash } from "node:crypto";
import { db } from "../db";
import { serverErrors } from "@shared/schema";
import { sql, gte, desc } from "drizzle-orm";

export type ServerErrorSource = "route" | "job" | "process";

/** Normalize a stack so cosmetically-different stacks of the same bug dedup. */
function normalizeStack(stack: string): string {
  return stack
    .replace(/:\d+:\d+/g, ":L:C") // strip line:col numbers
    .replace(/0x[0-9a-fA-F]+/g, "0xADDR")
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, "TS")
    .trim();
}

function hourBucket(now: Date = new Date()): string {
  return now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
}

/**
 * Best-effort durable record of a server error. Always resolves; never throws.
 */
export async function recordServerError(
  err: unknown,
  opts: { tag: string; source: ServerErrorSource },
): Promise<void> {
  try {
    const e = err as { message?: string; stack?: string } | undefined;
    const rawStack = e?.stack ?? String(err ?? "unknown error");
    const message = (e?.message ?? String(err ?? "unknown error")).slice(0, 2000);
    const stack = rawStack.slice(0, 8000);
    const stackHash = createHash("sha256")
      .update(normalizeStack(rawStack))
      .digest("hex");
    const bucket = hourBucket();

    await db
      .insert(serverErrors)
      .values({
        tag: opts.tag.slice(0, 500),
        source: opts.source,
        message,
        stackHash,
        stack,
        hourBucket: bucket,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [serverErrors.stackHash, serverErrors.hourBucket],
        set: {
          count: sql`${serverErrors.count} + 1`,
          lastSeenAt: sql`now()`,
          message,
          tag: opts.tag.slice(0, 500),
          source: opts.source,
        },
      });
  } catch {
    // Swallow: visibility must never take the process down. Do NOT re-record.
  }
}

/**
 * Fire-and-forget variant safe to call from sync contexts (process hooks,
 * Express error handler). Never throws, never returns a rejected promise.
 */
export function recordServerErrorSafe(
  err: unknown,
  opts: { tag: string; source: ServerErrorSource },
): void {
  void recordServerError(err, opts).catch(() => {});
}

/** Admin view: errors grouped by stack over the last 24h, most-recent first. */
export async function getRecentErrorsGrouped(): Promise<
  Array<{
    stackHash: string;
    tag: string;
    source: string;
    message: string;
    totalCount: number;
    firstSeenAt: Date | null;
    lastSeenAt: Date | null;
  }>
> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      stackHash: serverErrors.stackHash,
      tag: sql<string>`max(${serverErrors.tag})`,
      source: sql<string>`max(${serverErrors.source})`,
      message: sql<string>`max(${serverErrors.message})`,
      totalCount: sql<number>`sum(${serverErrors.count})`,
      firstSeenAt: sql<Date>`min(${serverErrors.firstSeenAt})`,
      lastSeenAt: sql<Date>`max(${serverErrors.lastSeenAt})`,
    })
    .from(serverErrors)
    .where(gte(serverErrors.lastSeenAt, since))
    .groupBy(serverErrors.stackHash)
    .orderBy(desc(sql`max(${serverErrors.lastSeenAt})`))
    .limit(200);
  return rows.map((r) => ({
    ...r,
    totalCount: Number(r.totalCount ?? 0),
  }));
}

/** Nightly prune: delete grouped error rows older than 14 days (DML only). */
export async function pruneOldServerErrors(): Promise<number> {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const res = await db
    .delete(serverErrors)
    .where(sql`${serverErrors.lastSeenAt} < ${cutoff}`);
  // drizzle/neon returns rowCount on the underlying result
  return (res as unknown as { rowCount?: number }).rowCount ?? 0;
}
