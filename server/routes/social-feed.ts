// ============================================================================
// SocialFeed routes — extracted from server/routes.ts by
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

export async function registerSocialFeedRoutes(app: Express): Promise<void> {
  // =============================================================================
  // SOCIAL FEED ROUTES
  // =============================================================================

  // Get crypto news from external APIs
  app.get('/api/crypto-news', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    try {
      // Fetch from CoinDesk RSS
      const coinDeskResponse = await axios.get('https://www.coindesk.com/arc/outboundfeeds/rss/');
      const cointelegraphResponse = await axios.get('https://cointelegraph.com/rss');
      
      // Parse RSS feeds (simplified - in production use a proper RSS parser)
      const articles: any[] = [];
      
      // For now, return empty array - RSS parsing would require additional library
      // In production, integrate with RSS parser or use crypto news APIs
      res.json({ articles: articles.slice(0, limit) });
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      res.json({ articles: [] }); // Return empty array on error
    }
  }));

  // Get content topics with real counts
  app.get('/api/content-topics', asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get all content to calculate topic counts
      const bounties = await storage.getBounties(1000, 0);
      const summaries = await storage.getSummaries();
      const markets = await storage.getPredictionMarkets(1000, 0);

      // Count by category and tags
      const topicCounts = new Map<string, number>();

      // Count bounty categories and tags
      bounties.forEach(b => {
        if (b.category) {
          topicCounts.set(b.category, (topicCounts.get(b.category) || 0) + 1);
        }
        b.tags?.forEach(tag => {
          topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
        });
      });

      // Count summary tags and categories
      summaries.forEach(s => {
        if (s.category) {
          topicCounts.set(s.category, (topicCounts.get(s.category) || 0) + 1);
        }
        s.tags?.forEach(tag => {
          topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
        });
      });

      // Count market categories and tags
      markets.forEach(m => {
        if (m.category) {
          topicCounts.set(m.category, (topicCounts.get(m.category) || 0) + 1);
        }
        m.tags?.forEach(tag => {
          topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
        });
      });

      // Convert to array and sort by count
      const topics = Array.from(topicCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 topics

      res.json({ topics });
    } catch (error) {
      console.error('Error fetching content topics:', error);
      res.json({ topics: [] });
    }
  }));

}
