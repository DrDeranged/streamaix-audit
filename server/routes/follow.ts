// ============================================================================
// Follow routes — extracted from server/routes.ts by
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

export async function registerFollowRoutes(app: Express): Promise<void> {
  // =============================================================================
  // FOLLOW SYSTEM ROUTES
  // =============================================================================

  // Follow a user (bounty creator)
  app.post('/api/users/:userId/follow', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const followerId = (req.user as any).id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const follow = await storage.followUser(followerId, followingId);
    res.json({ success: true, follow });
  }));

  // Unfollow a user
  app.delete('/api/users/:userId/follow', authenticateToken, mediumLimit, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const followerId = (req.user as any).id;
    const followingId = req.params.userId;

    const result = await storage.unfollowUser(followerId, followingId);
    res.json({ success: result });
  }));

  // Check if following a user
  app.get('/api/users/:userId/follow/status', asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({ isFollowing: false });
    }

    const followerId = (req.user as any).id;
    const followingId = req.params.userId;

    const isFollowing = await storage.isFollowingUser(followerId, followingId);
    res.json({ isFollowing });
  }));

  // Get user's follow stats (followers and following counts)
  app.get('/api/users/:userId/follow/stats', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const stats = await storage.getUserFollowStats(userId);
    res.json(stats);
  }));

  // Get users that a user follows
  app.get('/api/users/:userId/following', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const users = await storage.getFollowedUsers(userId);
    res.json({ users });
  }));

  // Get a user's followers
  app.get('/api/users/:userId/followers', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const users = await storage.getFollowers(userId);
    res.json({ users });
  }));

  // Follow a category
  app.post('/api/categories/:category/follow', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    const category = decodeURIComponent(req.params.category);

    const follow = await storage.followCategory(userId, category);
    res.json({ success: true, follow });
  }));

  // Unfollow a category
  app.delete('/api/categories/:category/follow', authenticateToken, mediumLimit, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    const category = decodeURIComponent(req.params.category);

    const result = await storage.unfollowCategory(userId, category);
    res.json({ success: result });
  }));

  // Check if following a category
  app.get('/api/categories/:category/follow/status', asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({ isFollowing: false });
    }

    const userId = (req.user as any).id;
    const category = decodeURIComponent(req.params.category);

    const isFollowing = await storage.isFollowingCategory(userId, category);
    res.json({ isFollowing });
  }));

  // Get category followers count
  app.get('/api/categories/:category/followers', asyncHandler(async (req: Request, res: Response) => {
    const category = decodeURIComponent(req.params.category);
    const count = await storage.getCategoryFollowersCount(category);
    res.json({ count });
  }));

  // Get current user's followed categories
  app.get('/api/me/followed-categories', asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({ categories: [] });
    }

    const userId = (req.user as any).id;
    const categories = await storage.getFollowedCategories(userId);
    res.json({ categories });
  }));

  // Get current user's followed users
  app.get('/api/me/followed-users', asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({ users: [] });
    }

    const userId = (req.user as any).id;
    const users = await storage.getFollowedUsers(userId);
    res.json({ users });
  }));

  // Get personalized bounty feed based on follows
  app.get('/api/bounties/following', asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const bounties = await storage.getPersonalizedBounties(userId, limit, offset);
    
    // Get followed info to show which follow caused each bounty to appear
    const followedUsers = await storage.getFollowedUsers(userId);
    const followedCategories = await storage.getFollowedCategories(userId);
    const followedUserIds = new Set(followedUsers.map(u => u.id));

    // Enrich bounties with follow context
    const enrichedBounties = await Promise.all(bounties.map(async (bounty) => {
      const creator = bounty.creatorId ? await storage.getUser(bounty.creatorId) : null;
      
      const followReason = {
        isFromFollowedUser: bounty.creatorId ? followedUserIds.has(bounty.creatorId) : false,
        isFromFollowedCategory: bounty.category ? followedCategories.includes(bounty.category) : false,
        creatorUsername: creator?.username,
        creatorAvatar: creator?.avatar,
        isAiAgent: creator?.isAiAgent || false,
      };

      return {
        ...bounty,
        followReason,
      };
    }));

    res.json({
      bounties: enrichedBounties,
      followedUsersCount: followedUsers.length,
      followedCategoriesCount: followedCategories.length,
      pagination: { limit, offset, count: bounties.length }
    });
  }));

  // Get all available bounty categories with follow status
  app.get('/api/bounty-categories', asyncHandler(async (req: Request, res: Response) => {
    const bounties = await storage.getBounties(10000, 0);
    
    // Count bounties per category
    const categoryMap = new Map<string, number>();
    bounties.forEach(b => {
      if (b.category) {
        categoryMap.set(b.category, (categoryMap.get(b.category) || 0) + 1);
      }
    });

    // Get follow status if authenticated
    let followedCategories: string[] = [];
    if (req.isAuthenticated()) {
      const userId = (req.user as any).id;
      followedCategories = await storage.getFollowedCategories(userId);
    }

    const categories = await Promise.all(
      Array.from(categoryMap.entries()).map(async ([name, bountyCount]) => {
        const followersCount = await storage.getCategoryFollowersCount(name);
        return {
          name,
          bountyCount,
          followersCount,
          isFollowing: followedCategories.includes(name),
        };
      })
    );

    // Sort by bounty count
    categories.sort((a, b) => b.bountyCount - a.bountyCount);

    res.json({ categories });
  }));

}
