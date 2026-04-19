// ============================================================================
// Referrals routes — extracted from server/routes.ts by
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

export async function registerReferralsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // REFERRAL SYSTEM ROUTES
  // =============================================================================

  // Generate new referral code for authenticated user
  app.post('/api/referrals/generate', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    try {
      // Generate unique referral code
      const code = await storage.generateUniqueReferralCode();

      // Create referral code record
      const referralCode = await storage.createReferralCode({
        userId,
        code
      });

      res.status(201).json({
        message: 'Referral code generated successfully',
        referralCode: {
          id: referralCode.id,
          code: referralCode.code,
          totalSignups: referralCode.totalSignups,
          totalRewardsEarned: referralCode.totalRewardsEarned,
          isActive: referralCode.isActive,
          createdAt: referralCode.createdAt
        }
      });
    } catch (error) {
      console.error('Error generating referral code:', error);
      return res.status(500).json({ error: 'Failed to generate referral code' });
    }
  }));

  // Get user's referral codes with stats
  app.get('/api/referrals/my-codes', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    try {
      const referralCodes = await storage.getReferralCodesByUser(userId);
      
      res.json({
        referralCodes: referralCodes.map(code => ({
          id: code.id,
          code: code.code,
          totalSignups: code.totalSignups || 0,
          totalRewardsEarned: code.totalRewardsEarned || 0,
          isActive: code.isActive,
          createdAt: code.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      return res.status(500).json({ error: 'Failed to fetch referral codes' });
    }
  }));

  // Get referral stats (earnings, signups, unclaimed rewards)
  app.get('/api/referrals/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    try {
      const referralCodes = await storage.getReferralCodesByUser(userId);
      const referralSignups = await storage.getReferralSignups(userId);

      const totalEarnings = referralCodes.reduce((sum, code) => sum + (code.totalRewardsEarned || 0), 0);
      const totalSignups = referralCodes.reduce((sum, code) => sum + (code.totalSignups || 0), 0);
      const unclaimedRewards = referralSignups
        .filter(signup => !signup.rewardClaimed)
        .reduce((sum, signup) => sum + (signup.rewardAmount || 0), 0);
      const claimedRewards = referralSignups
        .filter(signup => signup.rewardClaimed)
        .reduce((sum, signup) => sum + (signup.rewardAmount || 0), 0);

      res.json({
        stats: {
          totalEarnings,
          totalSignups,
          unclaimedRewards,
          claimedRewards,
          activeReferrals: referralSignups.filter(s => !s.rewardClaimed).length
        }
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
  }));

  // Claim STREAM reward for referral
  app.post('/api/referrals/claim/:signupId', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { signupId } = req.params;

    try {
      // Get the referral signup to verify ownership
      const referralSignups = await storage.getReferralSignups(userId);
      const signup = referralSignups.find(s => s.id === signupId);

      if (!signup) {
        return res.status(404).json({ error: 'Referral signup not found' });
      }

      if (signup.rewardClaimed) {
        return res.status(400).json({ error: 'Reward already claimed' });
      }

      // Claim the reward
      const claimedSignup = await storage.claimReferralReward(signupId);

      if (!claimedSignup) {
        return res.status(400).json({ error: 'Failed to claim reward' });
      }

      res.json({
        message: 'Reward claimed successfully',
        reward: {
          amount: claimedSignup.rewardAmount,
          signupId: claimedSignup.id,
          claimedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error claiming referral reward:', error);
      return res.status(500).json({ error: 'Failed to claim reward' });
    }
  }));

  // Get referral leaderboard - top referrers by total rewards earned
  app.get('/api/referrals/leaderboard', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const leaderboard = await storage.getReferralLeaderboard(limit);

      res.json({
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          username: entry.username,
          totalRewardsEarned: entry.totalRewardsEarned,
          totalSignups: entry.totalSignups
        }))
      });
    } catch (error) {
      console.error('Error fetching referral leaderboard:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }));

}
