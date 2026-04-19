// ============================================================================
// Points routes — extracted from server/routes.ts by
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

export async function registerPointsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // STREAM POINTS ROUTES
  // =============================================================================

  // Get user's points balance and stats
  app.get('/api/points/balance', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const stats = await pointsService.getStats(userId);
    res.json({ success: true, ...stats });
  }));

  // Get points transaction history
  app.get('/api/points/history', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const transactions = await pointsService.getHistory(userId, limit, offset);
    const stats = await pointsService.getStats(userId);
    
    res.json({ 
      success: true, 
      transactions,
      balance: stats.balance,
      totalEarned: stats.totalEarned,
      totalSpent: stats.totalSpent
    });
  }));

  // Get recent activity (last 24 hours)
  app.get('/api/points/recent', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const transactions = await pointsService.getRecentActivity(userId, hours);
    res.json({ success: true, transactions });
  }));

  // Process daily login (called when user logs in)
  app.post('/api/points/daily-login', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await pointsService.processDailyLogin(userId);
    
    res.json({ 
      success: true, 
      pointsAwarded: result.pointsAwarded,
      streak: result.streak,
      isNewLogin: result.pointsAwarded > 0
    });
  }));

  // Award points for stream watching (called periodically by frontend)
  app.post('/api/points/stream-watch', authenticateToken, mediumLimit, validateBody(streamWatchSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { streamId, minutesWatched } = req.body;
    
    if (!streamId || !minutesWatched) {
      return res.status(400).json({ error: 'streamId and minutesWatched required' });
    }
    
    const transaction = await pointsService.awardStreamWatch(userId, streamId, minutesWatched);
    res.json({ 
      success: true, 
      pointsAwarded: transaction?.amount || 0,
      transaction 
    });
  }));

  // Award points for voice conversation
  app.post('/api/points/voice-conversation', authenticateToken, mediumLimit, validateBody(voiceConversationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { streamId } = req.body;
    
    if (!streamId) {
      return res.status(400).json({ error: 'streamId required' });
    }
    
    const transaction = await pointsService.awardVoiceConversation(userId, streamId);
    res.json({ 
      success: true, 
      pointsAwarded: transaction?.amount || 0,
      transaction 
    });
  }));

  // Unified Points Leaderboard - combines users and AI agents
  app.get('/api/points/leaderboard', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const filterType = (req.query.type as string) || 'all'; // 'all', 'users', 'bots'
    
    try {
      // Get top users by points (only select actual database columns)
      const topUsersRaw = await db.select({
        id: users.id,
        name: users.username,
        avatar: users.avatar,
        points: users.streamPoints
      })
      .from(users)
      .where(sql`${users.streamPoints} > 0`)
      .orderBy(desc(users.streamPoints))
      .limit(limit);
      
      // Add type field after query
      const topUsers = topUsersRaw.map(u => ({ ...u, type: 'user' as const }));
      
      // Get top AI agents by trading volume as points proxy
      const topAgentsRaw = await db.select({
        id: aiAgents.id,
        name: aiAgents.name,
        avatar: aiAgents.avatar,
        points: aiAgents.totalVolume
      })
      .from(aiAgents)
      .where(sql`${aiAgents.totalVolume} > 0`)
      .orderBy(desc(aiAgents.totalVolume))
      .limit(limit);
      
      // Add type field after query
      const topAgents = topAgentsRaw.map(a => ({ ...a, type: 'bot' as const }));
      
      let leaderboard: any[] = [];
      
      if (filterType === 'users') {
        leaderboard = topUsers.map((u, i) => ({ ...u, rank: i + 1, isBot: false }));
      } else if (filterType === 'bots') {
        leaderboard = topAgents.map((a, i) => ({ ...a, rank: i + 1, isBot: true }));
      } else {
        // Combine and sort
        const combined = [
          ...topUsers.map(u => ({ ...u, isBot: false })),
          ...topAgents.map(a => ({ ...a, isBot: true }))
        ].sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, limit)
        .map((item, i) => ({ ...item, rank: i + 1 }));
        
        leaderboard = combined;
      }
      
      // Get stats
      const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
      const totalAgentsResult = await db.select({ count: sql<number>`count(*)` }).from(aiAgents);
      const totalPointsResult = await db.select({ sum: sql<number>`COALESCE(sum(${users.streamPoints}), 0)` }).from(users);
      const agentPointsResult = await db.select({ sum: sql<number>`COALESCE(sum(${aiAgents.totalVolume}), 0)` }).from(aiAgents);
      
      res.json({
        success: true,
        leaderboard,
        stats: {
          totalParticipants: (totalUsersResult[0]?.count || 0) + (totalAgentsResult[0]?.count || 0),
          totalUsers: totalUsersResult[0]?.count || 0,
          totalBots: totalAgentsResult[0]?.count || 0,
          totalPointsDistributed: (totalPointsResult[0]?.sum || 0) + (agentPointsResult[0]?.sum || 0)
        }
      });
    } catch (error) {
      console.error('Error fetching points leaderboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
  }));

}
