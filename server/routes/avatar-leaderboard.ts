import type { Express } from "express";
import { computeLeaderboard, getRecentTrades } from "../services/avatarLeaderboardService";
import { looseLimit } from "../middleware/security";

const asyncHandler =
  (fn: (req: Parameters<Parameters<Express["get"]>[1]>[0], res: Parameters<Parameters<Express["get"]>[1]>[1]) => Promise<unknown>) =>
  (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

export function registerAvatarLeaderboardRoutes(app: Express) {
  app.get(
    "/api/avatar-leaderboard/live",
    looseLimit,
    asyncHandler(async (_req, res) => {
      const rows = await computeLeaderboard();
      res.json({ success: true, leaderboard: rows, generatedAt: new Date().toISOString() });
    }),
  );

  app.get(
    "/api/avatar-leaderboard/:id/recent-trades",
    looseLimit,
    asyncHandler(async (req: any, res: any) => {
      const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
      const trades = await getRecentTrades(req.params.id, Number.isFinite(limit) ? limit : 20);
      res.json({ success: true, trades });
    }),
  );
}
