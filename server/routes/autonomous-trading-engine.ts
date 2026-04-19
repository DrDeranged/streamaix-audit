// ============================================================================
// AutonomousTradingEngine routes — extracted from server/routes.ts by
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

export async function registerAutonomousTradingEngineRoutes(app: Express): Promise<void> {
  // =====================================================
  // AUTONOMOUS TRADING ENGINE ROUTES
  // =====================================================

  // Get trading engine status
  app.get('/api/trading-engine/status', asyncHandler(async (req: Request, res: Response) => {
    const status = autonomousTradingEngine.getStatus();
    res.json(status);
  }));

  // Start trading engine
  app.post('/api/trading-engine/start', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    // Only admins can control the trading engine (in production, add role check here)
    const intervalMinutes = req.body.intervalMinutes || 30;
    
    try {
      autonomousTradingEngine.start(intervalMinutes);
      res.json({ message: 'Trading engine started', intervalMinutes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  // Stop trading engine
  app.post('/api/trading-engine/stop', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      autonomousTradingEngine.stop();
      res.json({ message: 'Trading engine stopped' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  // Get recent AI agent trades (includes both AI agents and Knowledge Avatars)
  app.get('/api/ai-agents/trades', asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const includeAvatars = req.query.includeAvatars !== 'false';
      
      // Get AI Agent trades
      const agentTrades = await db
        .select({
          id: aiTrades.id,
          agentId: aiTrades.agentId,
          agentName: aiAgents.name,
          agentPersonality: aiAgents.personality,
          marketId: aiTrades.marketId,
          marketQuestion: predictionMarkets.question,
          marketCategory: predictionMarkets.category,
          outcome: aiTrades.outcome,
          tradeType: aiTrades.tradeType,
          streamAmount: aiTrades.streamAmount,
          shares: aiTrades.shares,
          price: aiTrades.price,
          fee: aiTrades.fee,
          reasoning: aiTrades.reasoning,
          probability: aiTrades.probability,
          createdAt: aiTrades.createdAt
        })
        .from(aiTrades)
        .leftJoin(aiAgents, eq(aiTrades.agentId, aiAgents.id))
        .leftJoin(predictionMarkets, eq(aiTrades.marketId, predictionMarkets.id))
        .orderBy(desc(aiTrades.createdAt))
        .limit(limit);

      // Format agent trades with type indicator
      const formattedAgentTrades = agentTrades.map(t => ({
        ...t,
        traderType: 'agent' as const
      }));

      // Get Avatar trades if requested
      let formattedAvatarTrades: any[] = [];
      if (includeAvatars) {
        const avatarTrades = await db
          .select({
            id: avatarTradesTable.id,
            avatarId: avatarTradesTable.avatarId,
            avatarName: knowledgeAvatars.name,
            avatarImageUrl: knowledgeAvatars.imageUrl,
            tradingPersona: avatarTradesTable.tradingPersona,
            marketId: avatarTradesTable.marketId,
            marketQuestion: predictionMarkets.question,
            marketCategory: predictionMarkets.category,
            outcome: avatarTradesTable.outcome,
            tradeType: avatarTradesTable.tradeType,
            streamAmount: avatarTradesTable.streamAmount,
            shares: avatarTradesTable.shares,
            price: avatarTradesTable.price,
            fee: avatarTradesTable.fee,
            reasoning: avatarTradesTable.reasoning,
            confidence: avatarTradesTable.confidence,
            createdAt: avatarTradesTable.createdAt
          })
          .from(avatarTradesTable)
          .leftJoin(knowledgeAvatars, eq(avatarTradesTable.avatarId, knowledgeAvatars.id))
          .leftJoin(predictionMarkets, eq(avatarTradesTable.marketId, predictionMarkets.id))
          .orderBy(desc(avatarTradesTable.createdAt))
          .limit(limit);

        formattedAvatarTrades = avatarTrades.map(t => ({
          id: t.id,
          agentId: t.avatarId,
          agentName: t.avatarName || 'Unknown Avatar',
          agentPersonality: t.tradingPersona || 'balanced',
          marketId: t.marketId,
          marketQuestion: t.marketQuestion,
          marketCategory: t.marketCategory,
          outcome: t.outcome,
          tradeType: t.tradeType,
          streamAmount: t.streamAmount,
          shares: t.shares,
          price: t.price,
          fee: t.fee,
          reasoning: t.reasoning,
          probability: t.confidence,
          createdAt: t.createdAt,
          traderType: 'avatar' as const,
          avatarImageUrl: t.avatarImageUrl
        }));
      }

      // Merge and sort by createdAt
      const allTrades = [...formattedAgentTrades, ...formattedAvatarTrades]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      
      res.json({ trades: allTrades });
    } catch (error) {
      console.error('Error fetching AI trades:', error);
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  }));

  // Get AI agent portfolio/positions
  app.get('/api/ai-agents/positions', asyncHandler(async (req: Request, res: Response) => {
    try {
      const positions = await db
        .select({
          id: aiPositions.id,
          agentId: aiPositions.agentId,
          agentName: aiAgents.name,
          agentPersonality: aiAgents.personality,
          marketId: aiPositions.marketId,
          marketQuestion: predictionMarkets.question,
          outcome: aiPositions.outcome,
          shares: aiPositions.shares,
          averagePrice: aiPositions.averagePrice,
          totalInvested: aiPositions.totalInvested,
          currentValue: aiPositions.currentValue,
          unrealizedPnl: aiPositions.unrealizedPnl,
          status: aiPositions.status,
          createdAt: aiPositions.createdAt,
          updatedAt: aiPositions.updatedAt
        })
        .from(aiPositions)
        .leftJoin(aiAgents, eq(aiPositions.agentId, aiAgents.id))
        .leftJoin(predictionMarkets, eq(aiPositions.marketId, predictionMarkets.id))
        .orderBy(desc(aiPositions.updatedAt));
      
      res.json({ positions });
    } catch (error) {
      console.error('Error fetching AI positions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  }));

  // Get AI predictions for a specific market (derived from trades)
  app.get('/api/ai-agents/predictions/:marketId', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { marketId } = req.params;
      
      // Get the most recent trade from each agent for this market
      const trades = await db
        .select({
          id: aiTrades.id,
          agentId: aiTrades.agentId,
          agentName: aiAgents.name,
          agentPersonality: aiAgents.personality,
          prediction: aiTrades.outcome,
          confidence: aiTrades.probability,
          reasoning: aiTrades.reasoning,
          createdAt: aiTrades.createdAt
        })
        .from(aiTrades)
        .leftJoin(aiAgents, eq(aiTrades.agentId, aiAgents.id))
        .where(eq(aiTrades.marketId, marketId))
        .orderBy(desc(aiTrades.createdAt));
      
      // Get only the most recent prediction per agent
      const latestByAgent = new Map();
      trades.forEach(trade => {
        if (!latestByAgent.has(trade.agentId)) {
          latestByAgent.set(trade.agentId, trade);
        }
      });
      
      const predictions = Array.from(latestByAgent.values());
      
      res.json({ predictions });
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
      res.status(500).json({ error: 'Failed to fetch predictions' });
    }
  }));

  // Get AI agent stats
  app.get('/api/ai-agents/stats', asyncHandler(async (req: Request, res: Response) => {
    try {
      const agents = await db
        .select()
        .from(aiAgents)
        .orderBy(desc(aiAgents.totalProfit));
      
      res.json({ agents });
    } catch (error) {
      console.error('Error fetching AI agent stats:', error);
      res.status(500).json({ error: 'Failed to fetch agent stats' });
    }
  }));

  // Summary social engagement
  app.post('/api/summaries/:id/like', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleSummaryLike(req.user.id, req.params.id);
      res.json({ liked: result.liked, likesCount: result.likesCount });
    } catch (error) {
      console.error('Like summary error:', error);
      res.status(500).json({ error: 'Failed to like summary' });
    }
  }));

  app.post('/api/summaries/:id/comment', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    try {
      const comment = await storage.createSummaryComment({
        summaryId: req.params.id,
        userId: req.user.id,
        content: content.trim(),
        rating: null
      });
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Comment summary error:', error);
      res.status(500).json({ error: 'Failed to comment on summary' });
    }
  }));

  app.get('/api/summaries/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    try {
      const comments = await storage.getSummaryComments(req.params.id);
      res.json({ comments });
    } catch (error) {
      console.error('Get summary comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }));

  app.post('/api/summaries/:id/save', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const result = await storage.toggleSummarySave(req.user.id, req.params.id);
      res.json({ saved: result.saved });
    } catch (error) {
      console.error('Save summary error:', error);
      res.status(500).json({ error: 'Failed to save summary' });
    }
  }));

  app.get('/api/summaries/:id/likes', asyncHandler(async (req: Request, res: Response) => {
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
          eq(userInteractions.summaryId, req.params.id),
          eq(userInteractions.interactionType, 'like')
        ))
        .orderBy(desc(userInteractions.createdAt));
      
      res.json({ likes });
    } catch (error) {
      console.error('Get summary likes error:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  }));

  // News article engagement (macro/crypto news)
  app.post('/api/news/:id/like', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const newsId = req.params.id;
      
      // Check if already liked
      const existing = await db
        .select()
        .from(userInteractions)
        .where(and(
          eq(userInteractions.userId, req.user.id),
          eq(userInteractions.targetId, newsId),
          eq(userInteractions.targetType, 'news'),
          eq(userInteractions.interactionType, 'like')
        ))
        .limit(1);
      
      if (existing.length > 0) {
        // Unlike
        await db
          .delete(userInteractions)
          .where(eq(userInteractions.id, existing[0].id));
        
        const likesCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userInteractions)
          .where(and(
            eq(userInteractions.targetId, newsId),
            eq(userInteractions.targetType, 'news'),
            eq(userInteractions.interactionType, 'like')
          ));
        
        res.json({ liked: false, likesCount: likesCount[0]?.count || 0 });
      } else {
        // Like
        await db.insert(userInteractions).values({
          userId: req.user.id,
          targetId: newsId,
          targetType: 'news',
          interactionType: 'like',
          metadata: {}
        });
        
        const likesCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userInteractions)
          .where(and(
            eq(userInteractions.targetId, newsId),
            eq(userInteractions.targetType, 'news'),
            eq(userInteractions.interactionType, 'like')
          ));
        
        res.json({ liked: true, likesCount: likesCount[0]?.count || 0 });
      }
    } catch (error) {
      console.error('Like news error:', error);
      res.status(500).json({ error: 'Failed to like news article' });
    }
  }));

  app.post('/api/news/:id/comment', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    try {
      const [comment] = await db.insert(userInteractions).values({
        userId: req.user.id,
        targetId: req.params.id,
        targetType: 'news',
        interactionType: 'comment',
        metadata: { comment: content.trim() }
      }).returning();
      
      // Fetch user info
      const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
      
      res.status(201).json({ 
        comment: {
          id: comment.id,
          content: content.trim(),
          user: { id: user.id, username: user.username },
          createdAt: comment.createdAt
        }
      });
    } catch (error) {
      console.error('Comment news error:', error);
      res.status(500).json({ error: 'Failed to comment on news article' });
    }
  }));

  app.get('/api/news/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    try {
      const commentsData = await db
        .select({
          id: userInteractions.id,
          content: userInteractions.metadata,
          userId: users.id,
          username: users.username,
          createdAt: userInteractions.createdAt
        })
        .from(userInteractions)
        .innerJoin(users, eq(userInteractions.userId, users.id))
        .where(and(
          eq(userInteractions.targetId, req.params.id),
          eq(userInteractions.targetType, 'news'),
          eq(userInteractions.interactionType, 'comment')
        ))
        .orderBy(desc(userInteractions.createdAt));
      
      const comments = commentsData.map(c => ({
        id: c.id,
        content: (c.content as any)?.comment || '',
        user: { id: c.userId, username: c.username },
        createdAt: c.createdAt
      }));
      
      res.json({ comments });
    } catch (error) {
      console.error('Get news comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }));

  app.get('/api/news/:id/likes', asyncHandler(async (req: Request, res: Response) => {
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
          eq(userInteractions.targetType, 'news'),
          eq(userInteractions.interactionType, 'like')
        ))
        .orderBy(desc(userInteractions.createdAt));
      
      res.json({ likes });
    } catch (error) {
      console.error('Get news likes error:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  }));

  app.post('/api/news/:id/save', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    
    try {
      const newsId = req.params.id;
      
      const existing = await db
        .select()
        .from(userInteractions)
        .where(and(
          eq(userInteractions.userId, req.user.id),
          eq(userInteractions.targetId, newsId),
          eq(userInteractions.targetType, 'news'),
          eq(userInteractions.interactionType, 'bookmark')
        ))
        .limit(1);
      
      if (existing.length > 0) {
        await db.delete(userInteractions).where(eq(userInteractions.id, existing[0].id));
        res.json({ saved: false });
      } else {
        await db.insert(userInteractions).values({
          userId: req.user.id,
          targetId: newsId,
          targetType: 'news',
          interactionType: 'bookmark',
          metadata: {}
        });
        res.json({ saved: true });
      }
    } catch (error) {
      console.error('Save news error:', error);
      res.status(500).json({ error: 'Failed to save news article' });
    }
  }));

}
