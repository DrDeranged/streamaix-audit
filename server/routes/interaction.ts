// ============================================================================
// Interaction routes — extracted from server/routes.ts by
// scripts/split-routes-phase2.ts. No behavior changes; pure file
// reorganization to break the monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  looseLimit,
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
import { StreamProcessor } from "../services/streamProcessor";
import { StreamProcessorV2 } from "../services/streamProcessorV2";
import RebuiltContentProcessor from "../services/rebuiltContentProcessor";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { MarketDataService } from "../services/marketDataService";
import { youtubeService } from "../services/youtubeService";
import { PredictiveAnalyticsService } from "../services/predictiveAnalyticsService";
import { onChainAnalyticsService } from "../services/onChainAnalyticsService";
import { duneAnalyticsService } from "../services/duneAnalyticsService";
import { federalReserveService } from "../services/federalReserveService";
import { CorrelationAnalysisService } from "../services/correlationAnalysisService";
import { chartingService } from "../services/chartingService";
import { derivativesAnalyticsService } from "../services/derivativesAnalyticsService";
import { institutionalFlowService } from "../services/institutionalFlowService";
import { RiskAssessmentService } from "../services/riskAssessmentService";
import { CrossMarketSignalService } from "../services/crossMarketSignalService";
import { VolatilityForecastingService } from "../services/volatilityForecastingService";
import { marketEventModelingService } from "../services/marketEventModelingService";
import { patternRecognitionService } from "../services/patternRecognitionService";
import { RecommendationEngine } from "../recommendation-engine";
import { cryptoIntelligenceService } from "../services/cryptoIntelligenceService";
import { macroDataService } from "../services/macroDataService";
import { advancedMarketIntelService } from "../services/advancedMarketIntelService";
import { aiTradingSignalsService } from "../services/aiTradingSignalsService";
import { trendingService } from "../services/trendingService";
import { autonomousTradingEngine } from "../services/autonomousTradingEngine";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray, count } from "drizzle-orm";
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

export async function registerInteractionRoutes(app: Express): Promise<void> {
  // =============================================================================
  // INTERACTION ROUTES
  // =============================================================================

  // Create user interaction (like, bookmark, share)
  app.post('/api/interactions', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createInteractionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const interactionData = { ...validation.data as any, userId: req.user!.id };
    const interaction = await storage.createUserInteraction(interactionData);

    res.status(201).json({
      message: 'Interaction recorded successfully',
      interaction
    });
  }));

  // Remove user interaction
  app.delete('/api/interactions/:summaryId/:type', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { summaryId, type } = req.params;
    const deleted = await storage.deleteUserInteraction(req.user!.id, summaryId, type);

    if (!deleted) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.json({ message: 'Interaction removed successfully' });
  }));

  // Get user's interactions
  app.get('/api/users/me/interactions', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.query.summaryId as string;
    const interactions = await storage.getUserInteractions(req.user!.id, summaryId);

    res.json({ interactions });
  }));

  // =============================================================================
  // SOCIAL ENGAGEMENT ROUTES (Bounties, Markets, Summaries)
  // =============================================================================

  // Bounty social engagement
  app.post('/api/bounties/:id/like', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleBountyLike(req.user.id, req.params.id);
      res.json({ liked: result.liked, likesCount: result.likesCount });
    } catch (error) {
      console.error('Like bounty error:', error);
      res.status(500).json({ error: 'Failed to like bounty' });
    }
  }));

  app.post('/api/bounties/:id/comment', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    try {
      const comment = await storage.createBountyComment({
        bountyId: req.params.id,
        userId: req.user.id,
        content: content.trim()
      });
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Comment bounty error:', error);
      res.status(500).json({ error: 'Failed to comment on bounty' });
    }
  }));

  app.get('/api/bounties/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    try {
      const comments = await storage.getBountyComments(req.params.id);
      res.json({ comments });
    } catch (error) {
      console.error('Get bounty comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }));

  app.post('/api/bounties/:id/save', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleBountySave(req.user.id, req.params.id);
      res.json({ saved: result.saved });
    } catch (error) {
      console.error('Save bounty error:', error);
      res.status(500).json({ error: 'Failed to save bounty' });
    }
  }));

  app.get('/api/bounties/:id/likes', asyncHandler(async (req: Request, res: Response) => {
    try {
      const likes = await db
        .select({
          id: users.id,
          username: users.username,
          createdAt: bountyEngagements.createdAt
        })
        .from(bountyEngagements)
        .innerJoin(users, eq(bountyEngagements.userId, users.id))
        .where(and(
          eq(bountyEngagements.bountyId, req.params.id),
          eq(bountyEngagements.engagementType, 'like')
        ))
        .orderBy(desc(bountyEngagements.createdAt));
      
      res.json({ likes });
    } catch (error) {
      console.error('Get bounty likes error:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  }));

  // Prediction market social engagement
  app.post('/api/prediction-markets/:id/like', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleMarketLike(req.user.id, req.params.id);
      res.json({ liked: result.liked, likesCount: result.likesCount });
    } catch (error) {
      console.error('Like market error:', error);
      res.status(500).json({ error: 'Failed to like market' });
    }
  }));

  app.post('/api/prediction-markets/:id/comment', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    try {
      const comment = await storage.createMarketComment({
        marketId: req.params.id,
        userId: req.user.id,
        content: content.trim()
      });
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Comment market error:', error);
      res.status(500).json({ error: 'Failed to comment on market' });
    }
  }));

  app.get('/api/prediction-markets/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    try {
      const comments = await storage.getMarketComments(req.params.id);
      res.json({ comments });
    } catch (error) {
      console.error('Get market comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }));

  app.post('/api/prediction-markets/:id/save', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleMarketSave(req.user.id, req.params.id);
      res.json({ saved: result.saved });
    } catch (error) {
      console.error('Save market error:', error);
      res.status(500).json({ error: 'Failed to save market' });
    }
  }));

  app.get('/api/prediction-markets/:id/likes', asyncHandler(async (req: Request, res: Response) => {
    try {
      const likes = await db
        .select({
          id: users.id,
          username: users.username,
          createdAt: userInteractions.createdAt
        })
        .from(userInteractions)
        .innerJoin(users, eq(userInteractions.userId, users.id))
        .where(and(
          eq(userInteractions.targetId, req.params.id),
          eq(userInteractions.targetType, 'market'),
          eq(userInteractions.interactionType, 'like')
        ))
        .orderBy(desc(userInteractions.createdAt));
      
      res.json({ likes });
    } catch (error) {
      console.error('Get market likes error:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  }));

}
