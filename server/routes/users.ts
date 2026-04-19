// ============================================================================
// Users routes — extracted from server/routes.ts by
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

export async function registerUsersRoutes(app: Express): Promise<void> {
  // =============================================================================
  // USER ROUTES
  // =============================================================================

  // Update user profile
  app.patch('/api/users/me', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(updateUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const updates: any = validation.data!;
    if (updates.password) {
      updates.password = await AuthService.hashPassword(updates.password);
    }

    // Get current user to check profile completion status
    const currentUser = await storage.getUser(req.user!.id);
    
    const user = await storage.updateUser(req.user!.id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if profile is now complete (has bio and avatar)
    const wasProfileComplete = currentUser?.bio && currentUser?.avatar;
    const isProfileNowComplete = user.bio && user.avatar;
    
    let profileBonusAwarded = false;
    if (!wasProfileComplete && isProfileNowComplete) {
      const bonus = await pointsService.awardProfileComplete(req.user!.id);
      profileBonusAwarded = !!bonus;
    }

    res.json({
      message: 'Profile updated successfully',
      profileBonusAwarded,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio,
        streamPoints: user.streamPoints || 0
      }
    });
  }));

  // Get user by ID (public)
  app.get('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get public user stats
    const summaries = await storage.getSummariesByUser(req.params.id);
    const bounties = await storage.getBountiesByUser(req.params.id);
    const stacks = await storage.getKnowledgeStacksByUser(req.params.id);
    
    const stats = {
      summariesCount: summaries.filter(s => s.isPublic).length,
      bountiesCount: bounties.length,
      stacksCount: stacks.filter(s => s.isPublic).length
    };

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        ensName: user.ensName,
        createdAt: user.createdAt
      },
      stats
    });
  }));

}
