// ============================================================================
// BountyTemplates routes — extracted from server/routes.ts by
// scripts/split-routes.ts. No behavior changes; this is a pure file
// reorganization to break the 20k-line monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  signupLimit,
  authLimit,
  requireAdminFlexible,
  disableInProd,
  validateBody,
} from "../middleware/security";
import * as schemas from "../middleware/validationSchemas";
import {
  followBodySchema,
  castActionSchema,
  replyBodySchema,
  analyzeContentSchema,
  enhanceTrendsSchema,
  volForecastSchema,
  stressTestSchema,
  ackAlertSchema,
  generateMarketsFromNewsSchema,
  avatarGenerateMarketsSchema,
  priceSnapshotSchema,
  debateNextSchema,
  avatarPredictSchema,
  testTtsSchema,
  testTtsAudioSchema,
  generateReplayAudioSchema,
  emptyBodySchema,
  streamWatchSchema,
  voiceConversationSchema,
  bountyClaimSchema,
  summaryProcessSchema,
  forceRefreshSchema,
  botStakeSchema,
  botWithdrawSchema,
  predictionMarketTradeSchema,
  aiAgentTradeSchema,
  streamPredictionSchema,
  convertToMarketSchema,
  transcribeSchema,
  channelPointsRedeemSchema,
} from "../middleware/validationSchemas";
import { cacheService } from "../services/cacheService";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { youtubeService } from "../services/youtubeService";
import { trendingService } from "../services/trendingService";
import { pointsService } from "../services/pointsService";
import { bountyHunterService } from "../services/bountyHunterService";
import { qualityScorerService } from "../services/qualityScorerService";
import { db } from "../db";
import * as schema from "../../shared/schema";
import {
  predictionMarkets, aiAgents, aiPredictions, aiPositions, aiTrades, users, userInteractions,
  predictionLeagues, leagueParticipants, leagueTrades, marketTrades, pushSubscriptions,
  liveStreams, streamParticipants, streamMessages, streamTips, streamPredictions,
  streamPolls, streamPollVotes, streamReactions, streamScheduleReminders, streamClips,
  streamRecordings, streamAchievements, userStreamAchievements, streamChatCommands,
  streamChatCommandLogs, streamViewerLeaderboard, knowledgeAvatars, bounties, summaries,
  avatarTrades as avatarTradesTable, avatarPositions, streamConversationMessages, pointsTransactions, dailyLoginStreak,
  scheduledDebates, botStakes, botSimTrades, botPerformanceSnapshots
} from "../../shared/schema";
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";
import * as validators from "../validators";
import {
  loginSchema,
  registerSchema,
  walletLoginSchema,
  twitterAuthSchema,
  updateUserSchema,
  createSummarySchema,
  updateSummarySchema,
  createBountySchema,
  updateBountySchema,
  createInteractionSchema,
  createKnowledgeStackSchema,
  updateKnowledgeStackSchema,
  createUserNoteSchema,
  updateUserNoteSchema,
  paginationSchema,
  searchSchema,
  recentActivitySchema,
  processContentSchema,
  type LoginRequest,
  type RegisterRequest,
  type WalletLoginRequest,
  type TwitterAuthRequest,
  type RecentActivityRequest,
} from "../validators";
import passport from "passport";
import axios from "axios";
import { ADMIN_USERNAMES, isAdmin, requireAdmin, validateRequest, asyncHandler } from "./_shared";

export async function registerBountyTemplatesRoutes(app: Express): Promise<void> {
  // =============================================================================
  // BOUNTY TEMPLATE ROUTES
  // =============================================================================

  // Get all bounty templates
  app.get('/api/bounty-templates', asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const limit = parseInt(req.query.limit as string) || 20;

    const templates = await storage.getBountyTemplates({ category, difficulty, limit });
    res.json({ templates });
  }));

  // Get a specific bounty template
  app.get('/api/bounty-templates/:id', asyncHandler(async (req: Request, res: Response) => {
    const template = await storage.getBountyTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  }));

  // Create a new bounty template
  app.post('/api/bounty-templates', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const templateData = {
      ...req.body,
      createdBy: req.user!.id
    };

    const template = await storage.createBountyTemplate(templateData);
    res.status(201).json({ template });
  }));

  // Update a bounty template
  app.patch('/api/bounty-templates/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await storage.getBountyTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Only the creator can update the template
    if (template.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Only template creator can update it' });
    }

    const updated = await storage.updateBountyTemplate(req.params.id, req.body);
    res.json({ template: updated });
  }));

  // Delete a bounty template
  app.delete('/api/bounty-templates/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await storage.getBountyTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Only the creator can delete the template
    if (template.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Only template creator can delete it' });
    }

    await storage.deleteBountyTemplate(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  }));

  // Use a template to create a bounty (increments usage count)
  app.post('/api/bounty-templates/:id/use', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await storage.getBountyTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Increment usage count
    await storage.incrementTemplateUsage(req.params.id);

    // Return template data for bounty creation
    res.json({ template });
  }));

}
