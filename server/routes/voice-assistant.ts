import type { Express, Response } from "express";
import { authenticateToken, type AuthRequest } from "../auth";
import { mediumLimit, validateBody } from "../middleware/security";
import { voiceAssistantSchema } from "../middleware/validationSchemas";
import { voiceAssistantService } from "../services/voiceAssistantService";
import { storage } from "../storage";
import { asyncHandler } from "./_shared";

export async function registerVoiceAssistantRoutes(app: Express): Promise<void> {
  app.post("/api/assistant/voice", mediumLimit, authenticateToken, validateBody(voiceAssistantSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { audioBase64, mimeType, currentPath } = req.body as {
      audioBase64: string;
      mimeType: string;
      currentPath?: string;
    };

    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid audio payload' });
    }
    if (audioBuffer.length < 200) {
      return res.status(400).json({ success: false, error: 'Audio too short' });
    }
    if (audioBuffer.length > 2_000_000) {
      return res.status(413).json({ success: false, error: 'Audio too large (max ~2MB)' });
    }

    // Enrich the prompt context with the user's real platform activity so the
    // assistant can answer questions like "what's my balance?" or "what was my
    // last bounty about?" with actual data instead of placeholders.
    const userId = req.user?.id;
    let summariesCount = 0;
    let bountiesCount = 0;
    let walletBalance = 0;
    let recentBountyTitles: string[] = [];
    if (userId) {
      const [user, summaries, userBounties] = await Promise.all([
        storage.getUser(userId).catch(() => undefined),
        storage.getSummariesByUser(userId).catch(() => []),
        storage.getBountiesByUser(userId).catch(() => []),
      ]);
      summariesCount = summaries.length;
      bountiesCount = userBounties.length;
      walletBalance = user?.streamPoints ?? 0;
      recentBountyTitles = userBounties
        .slice(0, 3)
        .map((b: { title?: string | null }) => b.title ?? '')
        .filter((t: string) => t.length > 0);
    }

    const result = await voiceAssistantService.run(audioBuffer, mimeType, {
      currentPath,
      username: req.user?.username ?? null,
      summariesCount,
      bountiesCount,
      walletBalance,
      recentBountyTitles,
    });

    res.json({ success: true, ...result });
  }));
}
