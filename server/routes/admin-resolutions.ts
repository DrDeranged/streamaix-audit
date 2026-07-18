import type { Express, Response } from "express";
import { db } from "../db";
import { predictionMarkets, marketResolutionsAudit } from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "../auth";
import { requireAdmin, asyncHandler } from "./_shared";
import { strictLimit, validateBody } from "../middleware/security";
import { resolutionDecideSchema, resolutionDecideParamsSchema } from "../middleware/validationSchemas";

/**
 * Admin review queue for markets the AI resolution pipeline escalated
 * ('pending_review'). Lists gathered evidence + the AI's uncertain assessment,
 * and lets an admin decide through the existing settlement flow with a full
 * audit trail.
 */
export async function registerAdminResolutionsRoutes(app: Express): Promise<void> {
  app.get(
    "/api/admin/resolutions/pending",
    authenticateToken,
    requireAdmin,
    strictLimit,
    asyncHandler(async (_req: AuthRequest, res: Response) => {
      const pendingMarkets = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.status, "pending_review"))
        .orderBy(desc(predictionMarkets.deadline));

      const marketIds = pendingMarkets.map((m) => m.id);
      const auditRows = marketIds.length
        ? await db
            .select()
            .from(marketResolutionsAudit)
            .where(inArray(marketResolutionsAudit.marketId, marketIds))
            .orderBy(desc(marketResolutionsAudit.createdAt))
        : [];

      // Latest AI assessment per market
      const latestByMarket = new Map<string, typeof auditRows[number]>();
      for (const row of auditRows) {
        if (row.resolvedBy === "ai" && !latestByMarket.has(row.marketId)) {
          latestByMarket.set(row.marketId, row);
        }
      }

      res.json({
        success: true,
        pending: pendingMarkets.map((m) => {
          const assessment = latestByMarket.get(m.id) || null;
          return {
            market: m,
            aiAssessment: assessment
              ? {
                  resolution: assessment.resolution,
                  confidence: assessment.confidence,
                  reasoning: assessment.reasoning,
                  createdAt: assessment.createdAt,
                }
              : null,
            evidence: (assessment?.evidence as any)?.items ?? [],
            citedEvidence: (assessment?.evidence as any)?.citedEvidence ?? [],
            escalationReason: (assessment?.evidence as any)?.escalationReason ?? null,
          };
        }),
      });
    })
  );

  app.post(
    "/api/admin/resolutions/:marketId/decide",
    authenticateToken,
    requireAdmin,
    strictLimit,
    validateBody(resolutionDecideSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const params = resolutionDecideParamsSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({ error: "Invalid marketId" });
      }
      const { marketId } = params.data;
      const resolution = String(req.body.resolution).toLowerCase() as "yes" | "no" | "invalid";
      const note: string | undefined = req.body.note;
      const adminUsername = req.user!.username as string;

      const [market] = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.id, marketId))
        .limit(1);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      if (market.status !== "pending_review" && market.status !== "active") {
        return res.status(409).json({ error: `Market is not awaiting resolution (status: ${market.status})` });
      }

      const { resolutionService } = await import("../services/resolutionService");
      await resolutionService.resolveMarket(
        marketId,
        resolution,
        req.user!.id as string,
        "admin_review",
        { note: note || null, decidedBy: adminUsername },
        undefined,
        {
          resolvedBy: `admin:${adminUsername}`,
          autoResolved: false,
          reasoning: note || null,
        }
      );

      res.json({ success: true, marketId, resolution, resolvedBy: `admin:${adminUsername}` });
    })
  );
}
