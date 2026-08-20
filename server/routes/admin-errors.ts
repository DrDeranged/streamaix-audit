/**
 * Admin visibility into durable server errors (Phase 1).
 * GET /api/admin/errors — errors grouped by stack over the last 24h.
 */
import type { Express } from "express";
import { authenticateToken } from "../auth";
import { requireAdmin } from "./_shared";
import { getRecentErrorsGrouped } from "../services/serverErrorRecorder";

export async function registerAdminErrorsRoutes(app: Express): Promise<void> {
  app.get("/api/admin/errors", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const errors = await getRecentErrorsGrouped();
      res.json({ windowHours: 24, count: errors.length, errors });
    } catch (err) {
      res.status(500).json({
        error: "Failed to read server errors",
        message: (err as Error)?.message,
      });
    }
  });
}
