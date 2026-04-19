// ============================================================================
// TwitterX routes — extracted from server/routes.ts by
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

export async function registerTwitterXRoutes(app: Express): Promise<void> {
  // =============================================================================
  // TWITTER/X SOCIAL ROUTES
  // =============================================================================

  // Get user's recent tweets
  app.get('/api/twitter/tweets/:username', asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 25;
    
    if (!username) {
      return res.status(400).json({ error: 'Valid Twitter username required' });
    }

    try {
      const { twitterService } = await import('../services/twitterService');
      const tweets = await twitterService.getUserTweets(username, limit);
      
      res.json({
        success: true,
        tweets: tweets,
        count: tweets.length
      });
    } catch (error) {
      console.error('Failed to fetch user tweets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user tweets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get user profile information  
  app.get('/api/twitter/profile/:username', asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: 'Valid Twitter username required' });
    }

    try {
      const { twitterService } = await import('../services/twitterService');
      const profile = await twitterService.getUserProfile(username);
      
      res.json({
        success: true,
        profile: profile
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get trending crypto tweets
  app.get('/api/twitter/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const query = req.query.q as string || 'crypto OR bitcoin OR ethereum';
    
    try {
      const { twitterService } = await import('../services/twitterService');
      const trending = await twitterService.searchCryptoTweets(query, limit);
      
      res.json({
        success: true,
        trending: trending,
        count: trending.length,
        query: query
      });
    } catch (error) {
      console.error('Failed to fetch trending tweets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending tweets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get trending crypto topics
  app.get('/api/twitter/topics', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { twitterService } = await import('../services/twitterService');
      const topics = await twitterService.getTrendingCryptoTopics();
      
      res.json({
        success: true,
        topics: topics,
        count: topics.length
      });
    } catch (error) {
      console.error('Failed to fetch trending topics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending topics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get crypto influencer tweets
  app.get('/api/twitter/influencers', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { twitterService } = await import('../services/twitterService');
      const tweets = await twitterService.getCryptoInfluencerTweets();
      
      res.json({
        success: true,
        tweets: tweets,
        count: tweets.length,
        message: 'Crypto influencer tweets fetched successfully'
      });
    } catch (error) {
      console.error('Failed to fetch influencer tweets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch influencer tweets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get crypto influencers list for discovery
  app.get('/api/twitter/prominent-users', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { twitterService } = await import('../services/twitterService');
      const influencers = twitterService.getCryptoInfluencers();
      
      res.json({
        success: true,
        users: influencers,
        count: influencers.length,
        message: 'Prominent crypto users fetched successfully'
      });
    } catch (error) {
      console.error('Failed to fetch prominent crypto users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch prominent crypto users',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

}
