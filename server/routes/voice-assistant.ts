import type { Express, Response } from "express";
import express from "express";
import { authenticateToken, type AuthRequest } from "../auth";
import { mediumLimit, validateBody } from "../middleware/security";
import { voiceAssistantSchema } from "../middleware/validationSchemas";
import { voiceAssistantService } from "../services/voiceAssistantService";
import { asyncHandler } from "./_shared";

export async function registerVoiceAssistantRoutes(app: Express): Promise<void> {
  const largeJson = express.json({ limit: '4mb' });

  app.post("/api/assistant/voice", largeJson, mediumLimit, authenticateToken, validateBody(voiceAssistantSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
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

    const result = await voiceAssistantService.run(audioBuffer, mimeType, {
      currentPath,
      username: req.user?.username ?? null,
    });

    res.json({ success: true, ...result });
  }));
}
