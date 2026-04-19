// ============================================================================
// PredictionLeagues routes — extracted from server/routes.ts by
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

export async function registerPredictionLeaguesRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PREDICTION LEAGUES - COMPETITIVE TRADING COMPETITIONS
  // =============================================================================

  // Get all leagues (with filters)
  app.get("/api/prediction-leagues", asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    let query = db.select().from(predictionLeagues);
    
    if (status && ['upcoming', 'active', 'completed'].includes(status)) {
      query = query.where(eq(predictionLeagues.status, status)) as any;
    }
    
    const leagues = await query.orderBy(desc(predictionLeagues.createdAt)).limit(limit);
    
    res.json({
      success: true,
      leagues,
      count: leagues.length
    });
  }));

  // Get active + upcoming leagues for the main leagues page
  app.get("/api/prediction-leagues/active", asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    
    const activeLeagues = await db.select()
      .from(predictionLeagues)
      .where(eq(predictionLeagues.status, 'active'))
      .orderBy(asc(predictionLeagues.endDate));
    
    const upcomingLeagues = await db.select()
      .from(predictionLeagues)
      .where(eq(predictionLeagues.status, 'upcoming'))
      .orderBy(asc(predictionLeagues.startDate));
    
    const recentCompleted = await db.select()
      .from(predictionLeagues)
      .where(eq(predictionLeagues.status, 'completed'))
      .orderBy(desc(predictionLeagues.endDate))
      .limit(5);
    
    res.json({
      success: true,
      active: activeLeagues,
      upcoming: upcomingLeagues,
      recentCompleted
    });
  }));

  // Get AI participation stats for leagues (for displaying in UI)
  // NOTE: This must be BEFORE the :leagueId route to avoid being caught by it
  app.get("/api/prediction-leagues/ai-stats", asyncHandler(async (req: Request, res: Response) => {
    const { aiLeagueManager } = await import('../services/aiLeagueManager');
    const stats = await aiLeagueManager.getLeagueAIStats();
    
    res.json({
      success: true,
      ...stats
    });
  }));

  // Trigger AI agents to auto-join leagues (admin action)
  app.post("/api/prediction-leagues/ai-join", authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { aiLeagueManager } = await import('../services/aiLeagueManager');
    const result = await aiLeagueManager.runAutoJoinCycle();
    
    res.json({
      success: true,
      ...result,
      message: `${result.joined} AI agents joined leagues`
    });
  }));

  // Get single league with standings
  app.get("/api/prediction-leagues/:leagueId", asyncHandler(async (req: Request, res: Response) => {
    const { leagueId } = req.params;
    
    const [league] = await db.select()
      .from(predictionLeagues)
      .where(eq(predictionLeagues.id, leagueId));
    
    if (!league) {
      return res.status(404).json({ error: "League not found" });
    }
    
    // Get participants with standings
    const participants = await db.select({
      participant: leagueParticipants,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    })
      .from(leagueParticipants)
      .leftJoin(users, eq(leagueParticipants.userId, users.id))
      .where(eq(leagueParticipants.leagueId, leagueId))
      .orderBy(desc(leagueParticipants.netProfit));
    
    // Calculate rankings
    const standings = participants.map((p, index) => ({
      ...p.participant,
      user: p.user,
      rank: index + 1
    }));
    
    res.json({
      success: true,
      league,
      standings,
      participantCount: standings.length
    });
  }));

  // Join a league
  app.post("/api/prediction-leagues/:leagueId/join", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { leagueId } = req.params;
    const userId = req.user!.id;
    
    // Get league
    const [league] = await db.select()
      .from(predictionLeagues)
      .where(eq(predictionLeagues.id, leagueId));
    
    if (!league) {
      return res.status(404).json({ error: "League not found" });
    }
    
    // Check if league is joinable
    if (league.status !== 'upcoming' && league.status !== 'active') {
      return res.status(400).json({ error: "This league is no longer accepting participants" });
    }
    
    // Check if already joined
    const [existing] = await db.select()
      .from(leagueParticipants)
      .where(and(
        eq(leagueParticipants.leagueId, leagueId),
        eq(leagueParticipants.userId, userId)
      ));
    
    if (existing) {
      return res.status(400).json({ error: "You have already joined this league" });
    }
    
    // Check max participants
    if (league.maxParticipants && (league.totalParticipants || 0) >= league.maxParticipants) {
      return res.status(400).json({ error: "This league is full" });
    }
    
    // Check and deduct entry fee
    if (league.entryFee && league.entryFee > 0) {
      // Deduct entry fee using pointsService
      const spendResult = await pointsService.spendPoints({
        userId,
        amount: league.entryFee,
        source: 'league_entry',
        description: `Entry fee for league: ${league.name}`,
        referenceId: leagueId,
        referenceType: 'prediction_league',
        metadata: { leagueName: league.name }
      });
      
      if (!spendResult.success) {
        return res.status(400).json({ error: "Insufficient STREAM points for entry fee" });
      }
      
      // Add to prize pool
      await db.update(predictionLeagues)
        .set({ 
          prizePool: (league.prizePool || 0) + league.entryFee,
          totalParticipants: (league.totalParticipants || 0) + 1
        })
        .where(eq(predictionLeagues.id, leagueId));
    } else {
      // Just increment participant count
      await db.update(predictionLeagues)
        .set({ totalParticipants: (league.totalParticipants || 0) + 1 })
        .where(eq(predictionLeagues.id, leagueId));
    }
    
    // Create participant record
    const [participant] = await db.insert(leagueParticipants)
      .values({
        leagueId,
        userId,
        entryFeePaid: league.entryFee || 0
      })
      .returning();
    
    res.json({
      success: true,
      message: "Successfully joined the league!",
      participant
    });
  }));

  // Get user's leagues
  app.get("/api/prediction-leagues/my/participation", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    
    const participations = await db.select({
      participant: leagueParticipants,
      league: predictionLeagues
    })
      .from(leagueParticipants)
      .leftJoin(predictionLeagues, eq(leagueParticipants.leagueId, predictionLeagues.id))
      .where(eq(leagueParticipants.userId, userId))
      .orderBy(desc(predictionLeagues.startDate));
    
    res.json({
      success: true,
      participations: participations.map(p => ({
        ...p.participant,
        league: p.league
      }))
    });
  }));

  // Create a new league (admin only or with STREAM cost)
  app.post("/api/prediction-leagues", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      entryFee, 
      maxParticipants, 
      minTrades,
      prizePool,
      prizeDistribution,
      leagueType 
    } = req.body;
    
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "Name, start date, and end date are required" });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ error: "End date must be after start date" });
    }
    
    // Determine initial status
    const now = new Date();
    let status = 'upcoming';
    if (start <= now && end > now) {
      status = 'active';
    } else if (end <= now) {
      status = 'completed';
    }
    
    const [league] = await db.insert(predictionLeagues)
      .values({
        name,
        description: description || null,
        startDate: start,
        endDate: end,
        entryFee: entryFee || 0,
        maxParticipants: maxParticipants || null,
        minTrades: minTrades || 1,
        prizePool: prizePool || 0,
        prizeDistribution: prizeDistribution || [
          { rank: 1, percentage: 50 },
          { rank: 2, percentage: 30 },
          { rank: 3, percentage: 20 }
        ],
        leagueType: leagueType || 'weekly',
        status,
        creatorId: req.user!.id
      })
      .returning();
    
    res.json({
      success: true,
      league
    });
  }));

  // Record a trade for league tracking (called internally after market trade)
  app.post("/api/prediction-leagues/record-trade", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { marketTradeId, streamAmount, outcome, price } = req.body;
    const userId = req.user!.id;
    
    // Find all active leagues the user is participating in
    const activeLeagues = await db.select({
      league: predictionLeagues,
      participant: leagueParticipants
    })
      .from(predictionLeagues)
      .innerJoin(leagueParticipants, eq(leagueParticipants.leagueId, predictionLeagues.id))
      .where(and(
        eq(predictionLeagues.status, 'active'),
        eq(leagueParticipants.userId, userId)
      ));
    
    const recordedTrades = [];
    
    for (const { league, participant } of activeLeagues) {
      // Record the trade for this league
      const [trade] = await db.insert(leagueTrades)
        .values({
          leagueId: league.id,
          participantId: participant.id,
          marketTradeId,
          streamAmount,
          outcome,
          price
        })
        .returning();
      
      // Update participant stats
      await db.update(leagueParticipants)
        .set({
          totalTrades: (participant.totalTrades || 0) + 1,
          totalVolume: (participant.totalVolume || 0) + streamAmount,
          updatedAt: new Date()
        })
        .where(eq(leagueParticipants.id, participant.id));
      
      // Update league total volume
      await db.update(predictionLeagues)
        .set({
          totalVolume: (league.totalVolume || 0) + streamAmount,
          updatedAt: new Date()
        })
        .where(eq(predictionLeagues.id, league.id));
      
      recordedTrades.push(trade);
    }
    
    res.json({
      success: true,
      recordedTrades,
      leaguesAffected: recordedTrades.length
    });
  }));

  // Get league leaderboard
  app.get("/api/prediction-leagues/:leagueId/leaderboard", asyncHandler(async (req: Request, res: Response) => {
    const { leagueId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const standings = await db.select({
      participant: leagueParticipants,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        isAiAgent: users.isAiAgent
      }
    })
      .from(leagueParticipants)
      .leftJoin(users, eq(leagueParticipants.userId, users.id))
      .where(eq(leagueParticipants.leagueId, leagueId))
      .orderBy(desc(leagueParticipants.netProfit))
      .limit(limit);
    
    const leaderboard = standings.map((s, index) => ({
      rank: index + 1,
      ...s.participant,
      user: s.user
    }));
    
    res.json({
      success: true,
      leaderboard
    });
  }));

}
