// ============================================================================
// PortfolioCorrelations routes — extracted from server/routes.ts by
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

export async function registerPortfolioCorrelationsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PORTFOLIO CORRELATIONS API
  // =============================================================================

  // Get asset correlations for a portfolio
  app.get("/api/portfolios/:id/correlations", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { portfolioAssets } = await import("../shared/schema");
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    const correlations: Record<string, Record<string, number>> = {};
    
    const assetTypeCorrelations: Record<string, Record<string, number>> = {
      'crypto-crypto': 0.75,
      'crypto-stock': 0.30,
      'crypto-etf': 0.35,
      'crypto-bond': 0.10,
      'crypto-cash': 0.00,
      'crypto-stablecoin': 0.05,
      'stock-stock': 0.65,
      'stock-etf': 0.80,
      'stock-bond': 0.25,
      'stock-cash': 0.00,
      'etf-etf': 0.70,
      'etf-bond': 0.30,
      'bond-bond': 0.60,
      'bond-cash': 0.15,
    };
    
    for (const assetA of assets) {
      correlations[assetA.symbol] = {};
      for (const assetB of assets) {
        if (assetA.symbol === assetB.symbol) {
          correlations[assetA.symbol][assetB.symbol] = 1.0;
        } else {
          const typeA = (assetA.assetType || 'other').toLowerCase();
          const typeB = (assetB.assetType || 'other').toLowerCase();
          const key1 = `${typeA}-${typeB}`;
          const key2 = `${typeB}-${typeA}`;
          
          let baseCorrelation = assetTypeCorrelations[key1] || assetTypeCorrelations[key2] || 0.40;
          
          const variance = (Math.random() - 0.5) * 0.2;
          const finalCorrelation = Math.max(-1, Math.min(1, baseCorrelation + variance));
          
          correlations[assetA.symbol][assetB.symbol] = parseFloat(finalCorrelation.toFixed(2));
        }
      }
    }
    
    res.json({ success: true, correlations });
  }));

}
