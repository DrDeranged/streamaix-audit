import type { Express, Request, Response } from "express";
import { db } from "../db";
import { agentSignals, knowledgeAvatars } from "@shared/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { agentSignalService, signalsEnabled, registerAgentSignalJobs } from "../services/agentSignalService";
import { asyncHandler } from "./_shared";

/**
 * Agent Signals routes. Dormant by default: SIGNALS_ENABLED=false makes every
 * route below return 403 (fail-closed, like the bridge and swap rail).
 * Signals are theses, never advice; nothing here executes trades.
 */

function gate(res: Response): boolean {
  if (!signalsEnabled()) {
    res.status(403).json({ error: "agent signals not yet enabled" });
    return false;
  }
  return true;
}

async function attachAgents(rows: (typeof agentSignals.$inferSelect)[]) {
  const agentIds = Array.from(new Set(rows.map((r) => r.agentId)));
  const agents = agentIds.length
    ? await db
        .select({
          id: knowledgeAvatars.id,
          name: knowledgeAvatars.name,
          handle: knowledgeAvatars.handle,
          imageUrl: knowledgeAvatars.imageUrl,
          winRate: knowledgeAvatars.winRate,
          totalTrades: knowledgeAvatars.totalTrades,
        })
        .from(knowledgeAvatars)
        .where(inArray(knowledgeAvatars.id, agentIds))
    : [];
  const byId = new Map(agents.map((a) => [a.id, a]));
  const accuracy = new Map<string, Awaited<ReturnType<typeof agentSignalService.getRealMarketAccuracy>>>();
  for (const id of agentIds) {
    accuracy.set(id, await agentSignalService.getRealMarketAccuracy(id));
  }
  return rows.map((r) => ({
    ...r,
    agent: byId.get(r.agentId) ?? null,
    realMarketAccuracy: accuracy.get(r.agentId) ?? null,
  }));
}

export function registerSignalRoutes(app: Express): void {
  registerAgentSignalJobs();

  app.get("/api/signals", asyncHandler(async (_req: Request, res: Response) => {
    if (!gate(res)) return;
    const rows = await db
      .select()
      .from(agentSignals)
      .where(eq(agentSignals.status, "open"))
      .orderBy(desc(agentSignals.createdAt))
      .limit(30);
    res.json({ signals: await attachAgents(rows) });
  }));

  app.get("/api/signals/history", asyncHandler(async (_req: Request, res: Response) => {
    if (!gate(res)) return;
    const rows = await db
      .select()
      .from(agentSignals)
      .where(eq(agentSignals.status, "resolved"))
      .orderBy(desc(agentSignals.resolvedAt))
      .limit(50);
    res.json({ signals: await attachAgents(rows) });
  }));
}
