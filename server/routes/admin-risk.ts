import type { Express, Response } from "express";
import { authenticateToken, type AuthRequest } from "../auth";
import { requireAdmin, asyncHandler } from "./_shared";
import { strictLimit } from "../middleware/security";
import { riskEngine } from "../services/riskEngine";

/**
 * Admin visibility into the agent risk layer: recent risk events,
 * active agent suspensions, and breaker states/limits.
 */
export async function registerAdminRiskRoutes(app: Express): Promise<void> {
  app.get(
    "/api/admin/risk",
    authenticateToken,
    requireAdmin,
    strictLimit,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const limit = Math.min(parseInt(String(req.query.limit || "100"), 10) || 100, 500);
      const [events, suspensions] = await Promise.all([
        riskEngine.getRecentEvents(limit),
        riskEngine.getActiveSuspensions(),
      ]);
      res.json({
        success: true,
        events,
        activeSuspensions: suspensions,
        breakers: riskEngine.getBreakerState(),
      });
    })
  );
}
