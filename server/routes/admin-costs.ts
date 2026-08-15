import type { Express } from "express";
import { requireAdminFlexible } from "../middleware/security";
import { dailyBudgetLedger } from "../services/apiCostTracker";

/**
 * Admin visibility into the daily AI budget.
 * GET /api/admin/costs — today's spend by service+model, budget ratio,
 * degraded/blocked state, and 7-day history.
 */
export async function registerAdminCostsRoutes(app: Express): Promise<void> {
  app.get("/api/admin/costs", requireAdminFlexible, async (_req, res) => {
    try {
      const summary = await dailyBudgetLedger.adminSummary();
      const { budget } = summary;
      res.json({
        ...summary,
        state: {
          degraded: budget.ratio >= 0.8,
          backgroundBlocked: budget.ratio >= 1,
          userBlocked: budget.ratio >= 1.5,
        },
      });
    } catch (err) {
      console.error("[admin/costs] failed:", err);
      res.status(500).json({ error: "failed to load cost summary" });
    }
  });
}
