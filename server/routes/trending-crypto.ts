// ============================================================================
// TrendingCrypto routes — extracted from server/routes.ts by
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

export async function registerTrendingCryptoRoutes(app: Express): Promise<void> {
  // =============================================================================
  // TRENDING CRYPTO CONTENT ROUTES
  // =============================================================================

  // Get trending tweets from crypto influencers and topics
  app.get('/api/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const username = req.query.username as string;
    
    try {
      const { twitterService } = await import('../services/twitterService');
      
      let trendingTweets;
      if (username) {
        // Get tweets from specific user
        trendingTweets = await twitterService.getUserTweets(username, limit);
      } else {
        // Get trending from crypto influencers
        trendingTweets = await twitterService.getCryptoInfluencerTweets();
        trendingTweets = trendingTweets.slice(0, limit);
      }
      
      // Format for compatibility with existing frontend
      const formattedTweets = twitterService.formatForDiscoverPage(trendingTweets);
      
      res.json({
        success: true,
        items: formattedTweets,
        count: formattedTweets.length,
        username: username || null
      });
    } catch (error) {
      console.error('Failed to fetch trending content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get top crypto influencers with their recent tweets
  app.get('/api/top-accounts', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;
    
    try {
      const { twitterService } = await import('../services/twitterService');
      const influencers = twitterService.getCryptoInfluencers().slice(0, limit);
      
      // Get recent tweets for each influencer
      const accountsWithTweets = await Promise.all(
        influencers.map(async (influencer) => {
          const tweets = await twitterService.getUserTweets(influencer.username, 3);
          const profile = await twitterService.getUserProfile(influencer.username);
          
          return {
            username: influencer.username,
            displayName: influencer.name,
            category: influencer.category,
            profile: profile,
            recentTweets: tweets
          };
        })
      );
      
      res.json({
        success: true,
        accounts: accountsWithTweets,
        count: accountsWithTweets.length
      });
    } catch (error) {
      console.error('Failed to fetch top accounts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch top accounts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get conversation thread for a tweet
  app.get('/api/threads/:tweetId', asyncHandler(async (req: Request, res: Response) => {
    const { tweetId } = req.params;
    
    if (!tweetId) {
      return res.status(400).json({ error: 'Tweet ID required' });
    }
    
    try {
      // Note: Twitter API v2 doesn't provide easy conversation threading
      // For now, we'll return the original tweet with a note about limitations
      res.json({
        success: true,
        root: { id: tweetId, note: 'Twitter conversation threading requires additional API access' },
        replies: [],
        count: 0,
        message: 'Twitter conversation threading is limited in the current API access level'
      });
    } catch (error) {
      console.error(`Failed to fetch thread for tweet ${tweetId}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch thread',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

}
