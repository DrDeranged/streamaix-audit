import type { Express, Request, Response } from "express";
import { smartInsightsEngine } from "../services/smartInsightsEngine";
import { requireAdminFlexible, mediumLimit, validateBody } from "../middleware/security";
import { emptyBodySchema } from "../middleware/validationSchemas";
import { authenticateToken } from "../auth";
import { asyncHandler } from "./_shared";

export async function registerSmartInsightsRoutes(app: Express): Promise<void> {
  app.get("/api/smart-insights/reasoning", asyncHandler(async (_req: Request, res: Response) => {
    const payload = await smartInsightsEngine.generate();
    res.json({ success: true, ...payload });
  }));

  // Admin-only force refresh (bypasses cache)
  app.post("/api/smart-insights/reasoning/refresh", mediumLimit, authenticateToken, requireAdminFlexible, validateBody(emptyBodySchema), asyncHandler(async (_req: Request, res: Response) => {
    const payload = await smartInsightsEngine.generate({ force: true });
    res.json({ success: true, ...payload });
  }));
}
