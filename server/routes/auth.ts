// ============================================================================
// Auth routes — extracted from server/routes.ts by
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

export async function registerAuthRoutes(app: Express): Promise<void> {
  // Twitter OAuth setup is local to this domain — was previously computed
  // in `registerRoutes` and reached by closure. Setup is idempotent.
  const twitterEnabled = AuthService.setupTwitterAuth();

  // =============================================================================
  // AUTH ROUTES
  // =============================================================================

  // Register new user
  app.post('/api/auth/register', authLimit, asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<RegisterRequest>(registerSchema, req.body);
    if (!validation.success) {
      console.log('Registration validation failed:', validation.error);
      return res.status(400).json({ error: validation.error });
    }

    const { username, password, email, walletAddress, ensName, avatar, bio, referralCode } = validation.data!;

    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Check if wallet address already exists (if provided)
      if (walletAddress) {
        const existingWalletUser = await storage.getUserByWalletAddress?.(walletAddress);
        if (existingWalletUser) {
          return res.status(400).json({ error: 'Wallet address already registered' });
        }
      }

      // Validate referral code if provided
      let referralCodeRecord = null;
      if (referralCode) {
        referralCodeRecord = await storage.getReferralCode(referralCode);
        if (!referralCodeRecord) {
          return res.status(400).json({ error: 'Invalid referral code' });
        }
        if (!referralCodeRecord.isActive) {
          return res.status(400).json({ error: 'Referral code is inactive' });
        }
      }

      // Validate password is provided for non-social logins
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        walletAddress,
        ensName,
        avatar,
        bio
      });

      // Create referral signup record if referral code was used
      if (referralCodeRecord) {
        const rewardAmount = 100; // 100 STREAM tokens per signup
        
        await storage.createReferralSignup({
          referralCodeId: referralCodeRecord.id,
          referrerId: referralCodeRecord.userId,
          referredUserId: user.id,
          rewardAmount
        });

        // Update referral code stats
        await storage.updateReferralCode(referralCodeRecord.id, {
          totalSignups: (referralCodeRecord.totalSignups || 0) + 1,
          totalRewardsEarned: (referralCodeRecord.totalRewardsEarned || 0) + rewardAmount
        });

        // Award referrer bonus points
        await pointsService.awardReferral(referralCodeRecord.userId, user.id);
      }

      // Award signup bonus points (2,500 STREAM points)
      const signupBonus = await pointsService.awardSignupBonus(user.id);
      const signupBonusAmount = signupBonus?.amount || 0;

      // Generate token
      const token = AuthService.generateToken({
        id: user.id,
        username: user.username,
        email: user.email || undefined,
        walletAddress: user.walletAddress || undefined
      });

      // Broadcast new user to admin dashboard via WebSocket
      try {
        const { adminWebSocketService } = await import('../services/adminWebSocketService');
        adminWebSocketService.broadcastNewUser({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          streamBalance: signupBonusAmount.toString()
        });
      } catch (wsError) {
        console.error('Failed to broadcast new user:', wsError);
      }

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          ensName: user.ensName,
          avatar: user.avatar,
          bio: user.bio,
          streamPoints: signupBonusAmount,
          createdAt: user.createdAt
        },
        token,
        signupBonus: signupBonusAmount
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === '23505') {
        if (error.detail?.includes('username')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        if (error.detail?.includes('wallet_address')) {
          return res.status(400).json({ error: 'Wallet address already registered' });
        }
      }
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }));

  // Login with username/password
  app.post('/api/auth/login', authLimit, asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<LoginRequest>(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { username, password } = validation.data!;

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = AuthService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      walletAddress: user.walletAddress || undefined
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio
      },
      token
    });
  }));

  // Wallet login (for Web3 authentication)
  app.post('/api/auth/wallet-login', authLimit, asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<WalletLoginRequest>(walletLoginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { walletAddress, signature, message } = validation.data!;

    // TODO: Implement signature verification for wallet authentication
    // For now, we'll create or find user by wallet address
    let user = await storage.getUserByWalletAddress?.(walletAddress);
    
    if (!user) {
      // Create new user with wallet address - use full address + timestamp for uniqueness
      const timestamp = Date.now().toString().slice(-6);
      const uniqueUsername = `wallet_${walletAddress.slice(-6)}_${timestamp}`;
      
      user = await storage.createUser({
        username: uniqueUsername,
        password: 'wallet_auth_placeholder', // Placeholder for wallet-only accounts
        walletAddress,
      });
    }

    const token = AuthService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      walletAddress: user.walletAddress || undefined
    });

    res.json({
      message: 'Wallet login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio
      },
      token
    });
  }));

  // Twitter OAuth routes (only if enabled)
  if (twitterEnabled) {
    app.get('/api/auth/twitter', (req: Request, res: Response, next: Function) => {
      passport.authenticate('twitter', {
        scope: ['email']
      })(req, res, next);
    });

    app.get('/api/auth/twitter/callback', 
      passport.authenticate('twitter', { 
        failureRedirect: '/auth?error=twitter',
        session: true
      }),
      async (req: Request, res: Response) => {
        try {
          const user = req.user as any;
          if (!user) {
            return res.redirect('/auth?error=twitter-failed');
          }

          // Generate JWT token for the Twitter user
          const token = AuthService.generateToken({
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            authProvider: 'twitter'
          });

          // Redirect to frontend with token in URL parameters
          // Frontend will extract token and store it
          res.redirect(`/auth-success?token=${token}`);
        } catch (error) {
          console.error('Twitter callback error:', error);
          res.redirect('/auth?error=twitter-callback');
        }
      }
    );

    // Handle manual OAuth PIN verification for desktop apps
    app.post('/api/auth/twitter/verify', asyncHandler(async (req: Request, res: Response) => {
      const { oauth_token, oauth_verifier } = req.body;
      
      if (!oauth_token || !oauth_verifier) {
        return res.status(400).json({ error: 'Missing OAuth token or verifier' });
      }

      // This would require additional implementation for desktop app flow
      res.status(501).json({ 
        error: 'Desktop app flow not fully implemented. Please configure your Twitter app as a Web App.' 
      });
    }));
  } else {
    // Fallback routes when Twitter OAuth is not configured
    app.get('/api/auth/twitter', (req: Request, res: Response) => {
      res.status(503).json({ error: 'Twitter OAuth is not configured' });
    });
    
    app.get('/api/auth/twitter/callback', (req: Request, res: Response) => {
      res.redirect('/auth?error=twitter-not-configured');
    });
  }

  // Get current user profile
  app.get('/api/users/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Auto-recovery: Ensure signup bonus is awarded
    await pointsService.ensureSignupBonus(req.user!.id);

    // Get fresh user data after potential points update
    const freshUser = await storage.getUser(req.user!.id);

    // Get user stats
    const summaries = await storage.getSummariesByUser(req.user!.id);
    const bounties = await storage.getBountiesByUser(req.user!.id);
    const interactions = await storage.getUserInteractions(req.user!.id);
    const stacks = await storage.getKnowledgeStacksByUser(req.user!.id);
    
    const stats = {
      summariesCount: summaries.length,
      bountiesCount: bounties.length,
      interactionsCount: interactions.length,
      stacksCount: stacks.length
    };

    res.json({
      user: {
        id: freshUser!.id,
        username: freshUser!.username,
        email: freshUser!.email,
        walletAddress: freshUser!.walletAddress,
        ensName: freshUser!.ensName,
        avatar: freshUser!.avatar,
        bio: freshUser!.bio,
        streamPoints: freshUser!.streamPoints || 0,
        createdAt: freshUser!.createdAt
      },
      stats
    });
  }));

  // Alias for /api/user -> /api/users/me (used by prediction markets)
  app.get('/api/user', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Auto-recovery: Ensure signup bonus is awarded
    await pointsService.ensureSignupBonus(req.user!.id);

    // Get fresh user data after potential points update
    const freshUser = await storage.getUser(req.user!.id);

    res.json({
      user: {
        id: freshUser!.id,
        username: freshUser!.username,
        streamPoints: freshUser!.streamPoints || 0,
      }
    });
  }));

}
