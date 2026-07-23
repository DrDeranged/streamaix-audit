// ============================================================================
// LiveStreaming routes — extracted from server/routes.ts by
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
import { avatarStreamEnhancements } from "../services/avatarStreamEnhancementsService";
import { streamRaids } from "@shared/schema";
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

export async function registerLiveStreamingMonetizationRoutes(app: Express): Promise<void> {
  // STREAM RAIDS - Send viewers to other streams
  // =============================================================================

  app.post("/api/streams/:id/raid", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { toStreamId, viewersTransferred } = req.body;
    if (!toStreamId) {
      return res.status(400).json({ success: false, error: 'Target stream ID required' });
    }
    
    // Check if user is host of the source stream
    const sourceStream = await db.select().from(liveStreams).where(eq(liveStreams.id, req.params.id)).limit(1);
    if (!sourceStream.length || sourceStream[0].hostId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the host can initiate raids' });
    }
    
    // Check target stream exists and is live
    const targetStream = await db.select().from(liveStreams).where(and(
      eq(liveStreams.id, toStreamId),
      eq(liveStreams.status, 'live')
    )).limit(1);
    
    if (!targetStream.length) {
      return res.status(404).json({ success: false, error: 'Target stream not found or not live' });
    }
    
    // Create raid record
    const [raid] = await db.insert(streamRaids).values({
      fromStreamId: req.params.id,
      toStreamId,
      raiderId: req.user.id,
      viewersTransferred: viewersTransferred || sourceStream[0].currentViewers,
      status: 'completed',
      completedAt: new Date(),
    }).returning();
    
    // Update viewer counts
    await db.update(liveStreams)
      .set({ currentViewers: targetStream[0].currentViewers + (viewersTransferred || 0) })
      .where(eq(liveStreams.id, toStreamId));
    
    res.json({ success: true, raid });
  }));

  // =============================================================================
  // STREAM ANALYTICS - Host-only analytics dashboard
  // =============================================================================

  app.get("/api/streams/:id/analytics", asyncHandler(async (req: Request, res: Response) => {
    const streamId = req.params.id;
    
    try {
      // Get stream data
      const stream = await db.select().from(liveStreams).where(eq(liveStreams.id, streamId)).limit(1);
      if (!stream.length) {
        return res.json({ success: false, error: 'Stream not found' });
      }
      
      // Get message count
      const messages = await db.select({ count: sql`count(*)` })
        .from(streamMessages)
        .where(eq(streamMessages.streamId, streamId));
      
      // Get tips data
      const tips = await db.select({ 
        total: sql`COALESCE(sum(amount), 0)`,
        count: sql`count(*)`
      }).from(streamTips).where(eq(streamTips.streamId, streamId));
      
      // Get clips count
      const clips = await db.select({ count: sql`count(*)` })
        .from(streamClips)
        .where(eq(streamClips.streamId, streamId));
      
      res.json({
        success: true,
        peakViewers: stream[0].peakViewers || stream[0].currentViewers,
        totalViews: stream[0].currentViewers + (stream[0].peakViewers || 0),
        averageWatchTime: 1200, // ~20 mins placeholder
        chatMessages: Number(messages[0]?.count) || 0,
        tipsReceived: Number(tips[0]?.total) || 0,
        newFollowers: Math.floor(Math.random() * 50) + 10, // Placeholder
        clipsMade: Number(clips[0]?.count) || 0,
      });
    } catch (error) {
      res.json({
        success: true,
        peakViewers: 0,
        totalViews: 0,
        averageWatchTime: 0,
        chatMessages: 0,
        tipsReceived: 0,
        newFollowers: 0,
        clipsMade: 0,
      });
    }
  }));

  // =============================================================================
  // CHANNEL POINTS - Earn and redeem viewer rewards
  // =============================================================================

  app.post("/api/streams/:id/channel-points/redeem", authenticateToken, mediumLimit, validateBody(channelPointsRedeemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { rewardId } = req.body;
    if (!rewardId) {
      return res.status(400).json({ success: false, error: 'Reward ID required' });
    }
    
    // Define reward costs (in a real app, these would be in the database)
    const rewardCosts: Record<string, number> = {
      '1': 100, // Highlight Message
      '2': 500, // Request Song
      '3': 1000, // VIP Badge
      '4': 2500, // Choose Topic
      '5': 750, // Spin Wheel
    };
    
    const cost = rewardCosts[rewardId];
    if (!cost) {
      return res.status(400).json({ success: false, error: 'Invalid reward' });
    }
    
    // Check user has enough points
    const user = await storage.getUser(req.user.id);
    if (!user || (user.streamPoints || 0) < cost) {
      return res.status(400).json({ success: false, error: 'Not enough channel points' });
    }
    
    // Deduct points
    await storage.updateUserPoints(req.user.id, -cost);
    
    res.json({ success: true, pointsRemaining: (user.streamPoints || 0) - cost });
  }));

  // =============================================================================
  // GIFT SUBSCRIPTIONS - Gift subs to community
  // =============================================================================

  app.post("/api/streams/:id/gift-subs", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { count, targetUserId } = req.body;
    const giftCount = Math.min(Math.max(1, count || 1), 100);
    
    // Cost per gift sub (in STREAM points)
    const costPerSub = 100;
    const totalCost = giftCount * costPerSub;
    
    // Check user has enough points
    const user = await storage.getUser(req.user.id);
    if (!user || (user.streamPoints || 0) < totalCost) {
      return res.status(400).json({ success: false, error: 'Not enough STREAM points' });
    }
    
    // Deduct points
    await storage.updateUserPoints(req.user.id, -totalCost);
    
    // In production, would select random viewers and create subscriptions
    // For now, just log the gift
    res.json({ 
      success: true, 
      gifted: giftCount,
      pointsSpent: totalCost,
      pointsRemaining: (user.streamPoints || 0) - totalCost,
    });
  }));

  // =============================================================================
  // CHAT MODERATION - Host controls for chat
  // =============================================================================

  app.post("/api/streams/:id/moderation", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    // Check if user is host
    const stream = await db.select().from(liveStreams).where(eq(liveStreams.id, req.params.id)).limit(1);
    if (!stream.length || stream[0].hostId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the host can change moderation settings' });
    }
    
    const { slowModeSeconds, subscriberOnly, followerOnly, emoteOnly } = req.body;
    
    // In production, would store these in the stream record
    // For now, acknowledge the change
    res.json({ 
      success: true, 
      settings: {
        slowModeSeconds: slowModeSeconds ?? 0,
        subscriberOnly: subscriberOnly ?? false,
        followerOnly: followerOnly ?? false,
        emoteOnly: emoteOnly ?? false,
      }
    });
  }));

  // Like a clip
  app.post("/api/clips/:clipId/like", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    try {
      await db.update(streamClips)
        .set({ likes: sql`COALESCE(likes, 0) + 1` })
        .where(eq(streamClips.id, req.params.clipId));
      
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false, error: 'Could not like clip' });
    }
  }));

  // Generate market prediction from avatar
  app.post("/api/avatars/:id/predict", authenticateToken, strictLimit, validateBody(avatarPredictSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { asset, marketContext } = req.body;
    const prediction = await avatarStreamEnhancements.generateMarketPrediction(
      req.params.id,
      asset,
      marketContext || ''
    );
    
    res.json({ success: !!prediction, prediction });
  }));

  // =============================================================================
  // SCHEDULED AVATAR DEBATES - Automatic Turn-Taking with Voice Synthesis
  // =============================================================================

  const { DebateManagerService } = await import('../services/debateManagerService');
  
  // Initialize the debate manager
  DebateManagerService.initialize();

  // Schedule a new debate between two avatars
  app.post("/api/debates/schedule", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { 
      avatar1Id, 
      avatar2Id, 
      topic, 
      description,
      category,
      scheduledStartTime,
      maxRounds,
      turnDurationSeconds,
      enableVoice 
    } = req.body;

    if (!avatar1Id || !avatar2Id || !topic || !scheduledStartTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'avatar1Id, avatar2Id, topic, and scheduledStartTime are required' 
      });
    }

    try {
      const debate = await DebateManagerService.scheduleDebate({
        avatar1Id,
        avatar2Id,
        topic,
        description,
        category,
        scheduledStartTime: new Date(scheduledStartTime),
        maxRounds,
        turnDurationSeconds,
        enableVoice,
        createdBy: req.user.id,
      });

      res.json({ success: true, debate });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }));

  // Get upcoming and live debates
  app.get("/api/debates/upcoming", asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const debates = await DebateManagerService.getUpcomingDebates(limit);
    
    // Enrich with avatar names
    const enrichedDebates = await Promise.all(debates.map(async (debate) => {
      const [avatar1] = await db.select({ name: knowledgeAvatars.name, imageUrl: knowledgeAvatars.imageUrl })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, debate.avatar1Id))
        .limit(1);
      const [avatar2] = await db.select({ name: knowledgeAvatars.name, imageUrl: knowledgeAvatars.imageUrl })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, debate.avatar2Id))
        .limit(1);
      
      return {
        ...debate,
        avatar1Name: avatar1?.name,
        avatar1Image: avatar1?.imageUrl,
        avatar2Name: avatar2?.name,
        avatar2Image: avatar2?.imageUrl,
      };
    }));

    res.json({ success: true, debates: enrichedDebates });
  }));

  // Get live debates
  app.get("/api/debates/live", asyncHandler(async (req: Request, res: Response) => {
    const debates = await DebateManagerService.getLiveDebates();
    res.json({ success: true, debates });
  }));

  // Get recent completed debates
  app.get("/api/debates/recent", asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const debates = await DebateManagerService.getRecentDebates(limit);
    res.json({ success: true, debates });
  }));

  // Get a specific debate by ID
  app.get("/api/debates/:id", asyncHandler(async (req: Request, res: Response) => {
    const debate = await DebateManagerService.getDebateById(req.params.id);
    if (!debate) {
      return res.status(404).json({ success: false, error: 'Debate not found' });
    }

    // Enrich with avatar info
    const [avatar1] = await db.select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.id, debate.avatar1Id))
      .limit(1);
    const [avatar2] = await db.select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.id, debate.avatar2Id))
      .limit(1);

    res.json({ 
      success: true, 
      debate: {
        ...debate,
        avatar1: avatar1 ? { id: avatar1.id, name: avatar1.name, imageUrl: avatar1.imageUrl } : null,
        avatar2: avatar2 ? { id: avatar2.id, name: avatar2.name, imageUrl: avatar2.imageUrl } : null,
      }
    });
  }));

  // Manually start a scheduled debate (admin/creator only)
  app.post("/api/debates/:id/start", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const activeDebate = await DebateManagerService.startDebate(req.params.id);
    if (!activeDebate) {
      return res.status(400).json({ success: false, error: 'Could not start debate' });
    }

    res.json({ success: true, debate: { ...activeDebate, turnTimer: undefined } });
  }));

  // End a debate early
  app.post("/api/debates/:id/end", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await DebateManagerService.endDebate(req.params.id, 'cancelled');
    res.json({ success: true });
  }));

  // Vote for which avatar is winning
  app.post("/api/debates/:id/vote", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { avatarNumber } = req.body;
    if (avatarNumber !== 1 && avatarNumber !== 2) {
      return res.status(400).json({ success: false, error: 'avatarNumber must be 1 or 2' });
    }

    const votes = await DebateManagerService.voteForAvatar(req.params.id, avatarNumber, req.user.id);
    res.json({ success: true, votes });
  }));

  // Get active debate state (for real-time updates)
  app.get("/api/debates/:id/state", asyncHandler(async (req: Request, res: Response) => {
    const activeDebate = DebateManagerService.getActiveDebate(req.params.id);
    if (!activeDebate) {
      const storedDebate = await DebateManagerService.getDebateById(req.params.id);
      if (storedDebate) {
        // Fetch avatar details for completed debates
        const [avatar1Data, avatar2Data] = await Promise.all([
          db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, storedDebate.avatar1Id)).limit(1),
          db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, storedDebate.avatar2Id)).limit(1),
        ]);
        
        return res.json({ 
          success: true, 
          isLive: false, 
          debate: {
            ...storedDebate,
            avatar1: avatar1Data[0] ? { 
              id: avatar1Data[0].id, 
              name: avatar1Data[0].name, 
              imageUrl: avatar1Data[0].imageUrl 
            } : null,
            avatar2: avatar2Data[0] ? { 
              id: avatar2Data[0].id, 
              name: avatar2Data[0].name, 
              imageUrl: avatar2Data[0].imageUrl 
            } : null,
          }
        });
      }
      return res.status(404).json({ success: false, error: 'Debate not found' });
    }

    res.json({ 
      success: true, 
      isLive: true,
      debate: {
        debateId: activeDebate.debateId,
        topic: activeDebate.topic,
        avatar1: {
          id: activeDebate.avatar1.id,
          name: activeDebate.avatar1.name,
          imageUrl: activeDebate.avatar1.imageUrl,
        },
        avatar2: {
          id: activeDebate.avatar2.id,
          name: activeDebate.avatar2.name,
          imageUrl: activeDebate.avatar2.imageUrl,
        },
        currentRound: activeDebate.currentRound,
        maxRounds: activeDebate.maxRounds,
        currentSpeaker: activeDebate.currentSpeaker,
        exchanges: activeDebate.exchanges.map(e => ({
          speakerName: e.speakerName,
          content: e.content,
          timestamp: e.timestamp,
          hasAudio: !!e.audioBase64,
          audioBase64: e.audioBase64,
        })),
      }
    });
  }));

  // Send a chat message in a debate
  app.post("/api/debates/:id/chat", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({ success: false, error: 'Invalid message' });
    }

    const chatMessage = await DebateManagerService.addChatMessage(req.params.id, {
      userId: req.user.id,
      username: req.user.username || `User${req.user.id}`,
      message: message.trim(),
      timestamp: Date.now(),
    });

    res.json({ success: true, message: chatMessage });
  }));

  // Get chat messages for a debate
  app.get("/api/debates/:id/chat", asyncHandler(async (req: Request, res: Response) => {
    const messages = await DebateManagerService.getChatMessages(req.params.id);
    res.json({ success: true, messages });
  }));

  // Tip an avatar during a debate
  app.post("/api/debates/:id/tip", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { avatarNumber, amount } = req.body;
    if (avatarNumber !== 1 && avatarNumber !== 2) {
      return res.status(400).json({ success: false, error: 'avatarNumber must be 1 or 2' });
    }
    if (!amount || typeof amount !== 'number' || amount < 1 || amount > 10000) {
      return res.status(400).json({ success: false, error: 'Invalid tip amount (1-10000)' });
    }

    const tip = await DebateManagerService.tipAvatar(req.params.id, {
      userId: req.user.id,
      username: req.user.username || `User${req.user.id}`,
      avatarNumber,
      amount,
      timestamp: Date.now(),
    });

    if (!tip) {
      return res.status(400).json({ success: false, error: 'Could not process tip' });
    }

    res.json({ success: true, tip });
  }));

  // Get tips for a debate
  app.get("/api/debates/:id/tips", asyncHandler(async (req: Request, res: Response) => {
    const tips = await DebateManagerService.getTips(req.params.id);
    res.json({ success: true, tips });
  }));

  // Submit a question for avatars
  app.post("/api/debates/:id/question", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.length > 300) {
      return res.status(400).json({ success: false, error: 'Invalid question (max 300 chars)' });
    }

    const viewerQuestion = await DebateManagerService.addViewerQuestion(req.params.id, {
      userId: req.user.id,
      username: req.user.username || `User${req.user.id}`,
      question: question.trim(),
      timestamp: Date.now(),
      upvotes: 0,
    });

    res.json({ success: true, question: viewerQuestion });
  }));

  // Get viewer questions for a debate
  app.get("/api/debates/:id/questions", asyncHandler(async (req: Request, res: Response) => {
    const questions = await DebateManagerService.getViewerQuestions(req.params.id);
    res.json({ success: true, questions });
  }));

  // Upvote a viewer question
  app.post("/api/debates/:id/questions/:questionId/upvote", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = await DebateManagerService.upvoteQuestion(req.params.id, req.params.questionId, req.user.id);
    res.json({ success: true, ...result });
  }));

  // Add a reaction to the debate
  app.post("/api/debates/:id/react", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { reaction } = req.body;
    const validReactions = ['fire', 'idea', 'clap', 'think', 'love', 'wow'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ success: false, error: 'Invalid reaction type' });
    }

    const reactions = await DebateManagerService.addReaction(req.params.id, reaction, req.user.id);
    res.json({ success: true, reactions });
  }));

  // Get engagement stats for a debate
  app.get("/api/debates/:id/engagement", asyncHandler(async (req: Request, res: Response) => {
    const stats = await DebateManagerService.getEngagementStats(req.params.id);
    res.json({ success: true, stats });
  }));

  // =============================================================================
}
