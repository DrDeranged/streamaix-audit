// ============================================================================
// PortfolioGoals routes — extracted from server/routes.ts by
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

export async function registerPortfolioGoalsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PORTFOLIO GOALS API
  // =============================================================================

  // Get portfolio goals
  app.get("/api/portfolio-goals", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { portfolioGoals } = await import("../../shared/schema");
    const goals = await db.select().from(portfolioGoals).where(eq(portfolioGoals.userId, userId)).orderBy(desc(portfolioGoals.createdAt));
    
    res.json({ success: true, goals });
  }));

  // Create portfolio goal
  app.post("/api/portfolio-goals", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { name, targetAmount, deadline, goalType, portfolioId, priority, notes, targetSymbol, targetQuantity, monthlyContribution } = req.body;
    
    if (!name || !targetAmount || !goalType) {
      return res.status(400).json({ error: 'Name, target amount, and goal type are required' });
    }
    
    const { portfolioGoals } = await import("../../shared/schema");
    const [newGoal] = await db.insert(portfolioGoals).values({
      userId,
      portfolioId: portfolioId || null,
      name,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      goalType,
      priority: priority || 'medium',
      notes: notes || null,
      targetSymbol: targetSymbol || null,
      targetQuantity: targetQuantity ? parseFloat(targetQuantity) : null,
      monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : 0,
    }).returning();
    
    res.json({ success: true, goal: newGoal });
  }));

  // Delete portfolio goal
  app.delete("/api/portfolio-goals/:id", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { portfolioGoals } = await import("../../shared/schema");
    await db.delete(portfolioGoals).where(and(eq(portfolioGoals.id, id), eq(portfolioGoals.userId, userId)));
    
    res.json({ success: true });
  }));

  // =============================================================================
  // PORTFOLIO WATCHLIST API (watchlistItems table)
  // =============================================================================

  // Get user's portfolio watchlist
  app.get("/api/watchlist", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const items = await storage.getPortfolioWatchlist(userId);
    res.json({ success: true, items });
  }));

  // Add item to portfolio watchlist
  app.post("/api/watchlist", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { symbol, name, assetType, addedPrice, logoUrl, notes } = req.body;
    
    if (!symbol || !name || !assetType || addedPrice === undefined) {
      return res.status(400).json({ error: 'Symbol, name, asset type, and price are required' });
    }
    
    const newItem = await storage.addToPortfolioWatchlist({
      userId,
      symbol: symbol.toUpperCase(),
      name,
      assetType,
      addedPrice: parseFloat(addedPrice),
      currentPrice: parseFloat(addedPrice),
      priceChange24h: 0,
      priceChangeSinceAdded: 0,
      logoUrl: logoUrl || null,
      notes: notes || null,
    });
    
    res.json({ success: true, item: newItem });
  }));

  // Remove item from portfolio watchlist
  app.delete("/api/watchlist/:id", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await storage.removeFromPortfolioWatchlist(id, userId);
    res.json({ success: true });
  }));

}
