// ============================================================================
// Recommendations routes — extracted from server/routes.ts.
// Pure file reorganization, no behavior changes.
// ============================================================================
import type { Express, Response } from "express";
import { storage, DatabaseStorage } from "../storage";
import { optionalAuth, type AuthRequest } from "../auth";
import { asyncHandler } from "./_shared";

export async function registerRecommendationsRoutes(app: Express): Promise<void> {
  // AI Recommendations API
  app.get("/api/recommendations/avatars", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required for personalized recommendations" });
    }

    const { RecommendationService } = await import('../services/recommendationService');
    const recommendationService = new RecommendationService(storage as DatabaseStorage);

    const limit = parseInt(req.query.limit as string) || 5;
    const recommendations = await recommendationService.getPersonalizedAvatarRecommendations(userId, limit);

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  }));

  app.get("/api/recommendations/content", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required for personalized recommendations" });
    }

    const { RecommendationService } = await import('../services/recommendationService');
    const recommendationService = new RecommendationService(storage as DatabaseStorage);

    const limit = parseInt(req.query.limit as string) || 10;
    const recommendations = await recommendationService.getPersonalizedContentRecommendations(userId, limit);

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  }));

  app.get("/api/recommendations/mixed", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required for personalized recommendations" });
    }

    const { RecommendationService } = await import('../services/recommendationService');
    const recommendationService = new RecommendationService(storage as DatabaseStorage);

    const recommendations = await recommendationService.getMixedRecommendations(userId);

    res.json({
      success: true,
      ...recommendations
    });
  }));

  app.post("/api/recommendations/track-click", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { recommendationId, recommendationType } = req.body;

    if (!recommendationId || !recommendationType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { RecommendationService } = await import('../services/recommendationService');
    const recommendationService = new RecommendationService(storage as DatabaseStorage);

    await recommendationService.trackRecommendationClick(userId, recommendationId, recommendationType);

    res.json({
      success: true,
      message: "Click tracked successfully"
    });
  }));
}
