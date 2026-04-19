import type { Express } from "express";
import { z } from "zod";
import { authenticateToken } from "../auth";
import {
  mediumLimit,
  looseLimit,
  validateBody,
} from "../middleware/security";
import { asyncHandler } from "./_shared";
import {
  listFeed,
  listReplies,
  toggleLike,
  postUserReply,
} from "../services/avatarCommentaryService";

const replySchema = z.object({
  message: z.string().trim().min(1).max(600),
});

export function registerAvatarFeedRoutes(app: Express) {
  app.get(
    "/api/avatar-feed",
    looseLimit,
    asyncHandler(async (req, res) => {
      const limit = Number.parseInt(String(req.query.limit ?? "30"), 10);
      const before = req.query.before ? String(req.query.before) : undefined;
      const avatarId = req.query.avatarId ? String(req.query.avatarId) : undefined;
      const posts = await listFeed({
        limit: Number.isFinite(limit) ? limit : 30,
        before,
        avatarId,
      });
      res.json({ success: true, posts });
    }),
  );

  app.get(
    "/api/avatar-feed/:postId/replies",
    looseLimit,
    asyncHandler(async (req, res) => {
      const replies = await listReplies(req.params.postId);
      res.json({ success: true, replies });
    }),
  );

  app.post(
    "/api/avatar-feed/:postId/like",
    authenticateToken,
    mediumLimit,
    asyncHandler(async (req: any, res) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const result = await toggleLike(req.params.postId, userId);
      res.json({ success: true, ...result });
    }),
  );

  app.post(
    "/api/avatar-feed/:postId/reply",
    authenticateToken,
    mediumLimit,
    validateBody(replySchema),
    asyncHandler(async (req: any, res) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const result = await postUserReply(
        req.params.postId,
        userId,
        req.body.message,
      );
      res.json({ success: true, ...result });
    }),
  );
}
