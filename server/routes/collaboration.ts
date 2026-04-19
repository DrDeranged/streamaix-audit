// ============================================================================
// Collaboration routes — extracted from server/routes.ts by
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

export async function registerCollaborationRoutes(app: Express): Promise<void> {
  // =============================================================================
  // COLLABORATION ROUTES
  // =============================================================================

  // Get collaborators for a bounty
  app.get('/api/bounties/:id/collaborators', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const collaborators = await storage.getCollaborators(req.params.id);
    res.json({ collaborators });
  }));

  // Get collaboration session for a bounty
  app.get('/api/bounties/:id/collaboration-session', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const session = await storage.getCollaborationSession(req.params.id);
    res.json({ session: session || null });
  }));

  // Add a collaborator to a bounty
  app.post('/api/bounties/:id/collaborators', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Only bounty creator can add collaborators
    if (bounty.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Only bounty creator can add collaborators' });
    }

    const { userId, role, rewardShare } = req.body;
    
    if (!userId || !role || rewardShare === undefined) {
      return res.status(400).json({ error: 'User ID, role, and reward share are required' });
    }

    const collaborator = await storage.addCollaborator({
      bountyId: req.params.id,
      userId,
      role,
      rewardShare,
      status: 'active',
      invitedBy: req.user!.id
    });

    res.json({ collaborator });
  }));

  // Update reward share for a collaborator
  app.patch('/api/bounties/:id/collaborators/:userId/share', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Only bounty creator can update shares
    if (bounty.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Only bounty creator can update reward shares' });
    }

    const { rewardShare } = req.body;
    
    if (rewardShare === undefined || rewardShare < 0 || rewardShare > 100) {
      return res.status(400).json({ error: 'Invalid reward share. Must be between 0 and 100' });
    }

    const updated = await storage.updateCollaboratorShare(req.params.id, req.params.userId, rewardShare);

    res.json({ collaborator: updated });
  }));

}
