// ============================================================================
// KnowledgeStack routes — extracted from server/routes.ts by
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

export async function registerKnowledgeStackRoutes(app: Express): Promise<void> {
  // =============================================================================
  // KNOWLEDGE STACK ROUTES
  // =============================================================================

  // Get all knowledge stacks
  app.get('/api/stacks', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { limit, offset } = validation.data as { limit: number; offset: number };
    const stacks = await storage.getKnowledgeStacks(limit, offset);

    res.json({
      stacks,
      pagination: { limit, offset, count: stacks.length }
    });
  }));

  // Get knowledge stack by ID
  app.get('/api/stacks/:id', asyncHandler(async (req: Request, res: Response) => {
    const stack = await storage.getKnowledgeStack(req.params.id);
    if (!stack) {
      return res.status(404).json({ error: 'Knowledge stack not found' });
    }

    res.json({ stack });
  }));

  // Create new knowledge stack
  app.post('/api/stacks', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createKnowledgeStackSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const stackData = { ...validation.data as any, creatorId: req.user!.id };
    const stack = await storage.createKnowledgeStack(stackData);

    res.status(201).json({
      message: 'Knowledge stack created successfully',
      stack
    });
  }));

  // Update knowledge stack
  app.patch('/api/stacks/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingStack = await storage.getKnowledgeStack(req.params.id);
    if (!existingStack) {
      return res.status(404).json({ error: 'Knowledge stack not found' });
    }

    if (existingStack.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own knowledge stacks' });
    }

    const validation = validateRequest(updateKnowledgeStackSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const stack = await storage.updateKnowledgeStack(req.params.id, validation.data as any);
    res.json({
      message: 'Knowledge stack updated successfully',
      stack
    });
  }));

  // Get user's knowledge stacks
  app.get('/api/users/:id/stacks', asyncHandler(async (req: Request, res: Response) => {
    const stacks = await storage.getKnowledgeStacksByUser(req.params.id);
    res.json({ stacks });
  }));

}
