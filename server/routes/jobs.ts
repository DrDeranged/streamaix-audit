import type { Express } from "express";
import { requireAdminFlexible } from "../middleware/security";
import { jobScheduler } from "../jobs/scheduler";

/**
 * Admin visibility into the job scheduler (Phase 1).
 * GET /api/admin/jobs — status of every registered background job.
 */
export async function registerJobsRoutes(app: Express): Promise<void> {
  app.get("/api/admin/jobs", requireAdminFlexible, (_req, res) => {
    res.json({ jobs: jobScheduler.getStatus() });
  });
}
