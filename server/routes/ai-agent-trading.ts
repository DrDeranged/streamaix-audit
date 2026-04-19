// ============================================================================
// AiAgentTrading routes — extracted from server/routes.ts by
// scripts/split-routes-phase2.ts. No behavior changes; pure file
// reorganization to break the monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  looseLimit,
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
import { StreamProcessor } from "../services/streamProcessor";
import { StreamProcessorV2 } from "../services/streamProcessorV2";
import RebuiltContentProcessor from "../services/rebuiltContentProcessor";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { MarketDataService } from "../services/marketDataService";
import { youtubeService } from "../services/youtubeService";
import { PredictiveAnalyticsService } from "../services/predictiveAnalyticsService";
import { onChainAnalyticsService } from "../services/onChainAnalyticsService";
import { duneAnalyticsService } from "../services/duneAnalyticsService";
import { federalReserveService } from "../services/federalReserveService";
import { CorrelationAnalysisService } from "../services/correlationAnalysisService";
import { chartingService } from "../services/chartingService";
import { derivativesAnalyticsService } from "../services/derivativesAnalyticsService";
import { institutionalFlowService } from "../services/institutionalFlowService";
import { RiskAssessmentService } from "../services/riskAssessmentService";
import { CrossMarketSignalService } from "../services/crossMarketSignalService";
import { VolatilityForecastingService } from "../services/volatilityForecastingService";
import { marketEventModelingService } from "../services/marketEventModelingService";
import { patternRecognitionService } from "../services/patternRecognitionService";
import { RecommendationEngine } from "../recommendation-engine";
import { cryptoIntelligenceService } from "../services/cryptoIntelligenceService";
import { macroDataService } from "../services/macroDataService";
import { advancedMarketIntelService } from "../services/advancedMarketIntelService";
import { aiTradingSignalsService } from "../services/aiTradingSignalsService";
import { trendingService } from "../services/trendingService";
import { autonomousTradingEngine } from "../services/autonomousTradingEngine";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray, count } from "drizzle-orm";
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

export async function registerAiAgentTradingRoutes(app: Express): Promise<void> {
  // =============================================================================
  // AI AGENT TRADING SYSTEM
  // =============================================================================
  
  // Initialize AI agents
  app.post("/api/ai-agents/initialize", authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const agents = await aiAgentService.initializeAgents();
    
    res.json({
      success: true,
      agents,
      message: `Initialized ${agents.length} AI trading agents`
    });
  }));

  // Get all AI agents
  app.get("/api/ai-agents", asyncHandler(async (req: Request, res: Response) => {
    const agents = await db.select().from(aiAgents).where(eq(aiAgents.isActive, true));
    
    res.json({
      success: true,
      agents
    });
  }));

  // Get AI agent leaderboard
  app.get("/api/ai-agents/leaderboard", asyncHandler(async (req: Request, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const leaderboard = await aiAgentService.getAgentLeaderboard();
    
    res.json({
      success: true,
      leaderboard
    });
  }));

  // Get AI agent stats
  app.get("/api/ai-agents/:agentId/stats", asyncHandler(async (req: Request, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const stats = await aiAgentService.getAgentStats(req.params.agentId);
    
    res.json({
      success: true,
      stats
    });
  }));

  // Generate AI predictions for a market
  app.post("/api/ai-agents/predict/:marketId", authenticateToken, requireAdmin, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const predictions = await aiAgentService.generatePredictionsForMarket(req.params.marketId);
    
    res.json({
      success: true,
      predictions,
      message: `Generated ${predictions.length} AI predictions`
    });
  }));

  // Get AI predictions for a market
  app.get("/api/ai-agents/predictions/:marketId", asyncHandler(async (req: Request, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const predictions = await aiAgentService.getMarketPredictions(req.params.marketId);
    
    res.json({
      success: true,
      predictions
    });
  }));

  // Execute AI agent trade
  app.post("/api/ai-agents/:agentId/trade", authenticateToken, requireAdmin, strictLimit, validateBody(aiAgentTradeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { aiAgentService } = await import('../services/aiAgentService');
    const { marketId, predictionId, shares } = req.body;
    
    const result = await aiAgentService.executeTrade(
      req.params.agentId,
      marketId,
      predictionId,
      shares
    );
    
    res.json({
      success: true,
      position: result.position,
      trade: result.trade,
      message: "AI trade executed successfully"
    });
  }));

  // Get AI positions for a market
  app.get("/api/ai-agents/positions/:marketId", asyncHandler(async (req: Request, res: Response) => {
    const positions = await db
      .select()
      .from(aiPositions)
      .leftJoin(aiAgents, eq(aiPositions.agentId, aiAgents.id))
      .where(
        and(
          eq(aiPositions.marketId, req.params.marketId),
          eq(aiPositions.status, "open")
        )
      )
      .orderBy(desc(aiPositions.totalInvested));
    
    res.json({
      success: true,
      positions: positions.map(p => ({
        ...p.ai_positions,
        agent: p.ai_agents
      }))
    });
  }));

  // Get AI trades for a market
  app.get("/api/ai-agents/trades/:marketId", asyncHandler(async (req: Request, res: Response) => {
    const trades = await db
      .select()
      .from(aiTrades)
      .leftJoin(aiAgents, eq(aiTrades.agentId, aiAgents.id))
      .where(eq(aiTrades.marketId, req.params.marketId))
      .orderBy(desc(aiTrades.createdAt))
      .limit(50);
    
    res.json({
      success: true,
      trades: trades.map(t => ({
        ...t.ai_trades,
        agent: t.ai_agents
      }))
    });
  }));

  // =============================================================================
  // AI AGENT BOUNTY ACTIVITY - Real-time dashboard for AI solving bounties
  // =============================================================================
  
  // Get AI agents' bounty-solving activity and stats
  app.get("/api/ai-agents/bounty-activity", asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    // Get recent bounty completions by AI agents
    const recentCompletions = await db
      .select({
        bountyId: bounties.id,
        bountyTitle: bounties.title,
        bountyCategory: bounties.category,
        bountyReward: bounties.reward,
        completedAt: bounties.completedAt,
        agentId: users.id,
        agentUsername: users.username,
        agentAvatar: users.avatar,
        summaryId: bounties.summaryId,
        summaryTitle: summaries.title,
      })
      .from(bounties)
      .innerJoin(users, and(eq(bounties.assigneeId, users.id), eq(users.isAiAgent, true)))
      .leftJoin(summaries, eq(bounties.summaryId, summaries.id))
      .where(eq(bounties.status, 'completed'))
      .orderBy(desc(bounties.completedAt))
      .limit(limit);
    
    // Get bounties currently being worked on by AI agents
    const inProgressBounties = await db
      .select({
        bountyId: bounties.id,
        bountyTitle: bounties.title,
        bountyCategory: bounties.category,
        claimedAt: bounties.claimedAt,
        agentId: users.id,
        agentUsername: users.username,
        agentAvatar: users.avatar,
      })
      .from(bounties)
      .innerJoin(users, and(eq(bounties.assigneeId, users.id), eq(users.isAiAgent, true)))
      .where(eq(bounties.status, 'in_progress'))
      .orderBy(desc(bounties.claimedAt))
      .limit(10);
    
    // Get top AI agents by bounties solved
    const topAgents = await db
      .select({
        agentId: users.id,
        username: users.username,
        avatar: users.avatar,
        streamPoints: users.streamPoints,
        bountiesCompleted: sql<number>`count(${bounties.id})`.as('bountiesCompleted'),
      })
      .from(users)
      .leftJoin(bounties, and(eq(bounties.assigneeId, users.id), eq(bounties.status, 'completed')))
      .where(eq(users.isAiAgent, true))
      .groupBy(users.id, users.username, users.avatar, users.streamPoints)
      .orderBy(sql`count(${bounties.id}) DESC`)
      .limit(10);
    
    // Get overall stats
    const [statsResult] = await db
      .select({
        totalAgents: sql<number>`count(distinct ${users.id})`.as('totalAgents'),
        totalBountiesCompleted: sql<number>`count(${bounties.id})`.as('totalBountiesCompleted'),
        totalRewardsEarned: sql<number>`coalesce(sum(${bounties.reward}), 0)`.as('totalRewardsEarned'),
      })
      .from(users)
      .leftJoin(bounties, and(eq(bounties.assigneeId, users.id), eq(bounties.status, 'completed')))
      .where(eq(users.isAiAgent, true));
    
    // Get today's completions count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayStats] = await db
      .select({
        todayCount: sql<number>`count(${bounties.id})`.as('todayCount'),
      })
      .from(bounties)
      .innerJoin(users, and(eq(bounties.assigneeId, users.id), eq(users.isAiAgent, true)))
      .where(and(
        eq(bounties.status, 'completed'),
        sql`${bounties.completedAt} >= ${today.toISOString()}`
      ));
    
    res.json({
      success: true,
      recentCompletions,
      inProgressBounties,
      topAgents,
      stats: {
        totalAgents: statsResult?.totalAgents || 0,
        totalBountiesCompleted: statsResult?.totalBountiesCompleted || 0,
        totalRewardsEarned: statsResult?.totalRewardsEarned || 0,
        todayCompletions: todayStats?.todayCount || 0,
      }
    });
  }));
  
  // Get AI agent bounty leaderboard with extended stats
  app.get("/api/ai-agents/bounty-leaderboard", asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    
    const leaderboard = await db
      .select({
        agentId: users.id,
        username: users.username,
        avatar: users.avatar,
        streamPoints: users.streamPoints,
        agentPersonality: users.agentPersonality,
        bountiesCompleted: sql<number>`count(${bounties.id})`.as('bountiesCompleted'),
        totalEarned: sql<number>`coalesce(sum(${bounties.reward}), 0)`.as('totalEarned'),
        lastActive: sql<string>`max(${bounties.completedAt})`.as('lastActive'),
      })
      .from(users)
      .leftJoin(bounties, and(eq(bounties.assigneeId, users.id), eq(bounties.status, 'completed')))
      .where(eq(users.isAiAgent, true))
      .groupBy(users.id, users.username, users.avatar, users.streamPoints, users.agentPersonality)
      .orderBy(sql`count(${bounties.id}) DESC`)
      .limit(limit);
    
    res.json({
      success: true,
      leaderboard: leaderboard.map((agent, index) => ({
        ...agent,
        rank: index + 1,
        expertise: (agent.agentPersonality as any)?.expertise || [],
        tradingStyle: (agent.agentPersonality as any)?.tradingStyle || 'balanced',
        activityLevel: (agent.agentPersonality as any)?.activityLevel || 'regular',
      }))
    });
  }));

  // =============================================================================
  // PREDICTION MARKET ENHANCEMENTS - LEADERBOARDS, ACHIEVEMENTS, PORTFOLIO
  // =============================================================================

  const { 
    marketPriceHistory, 
    achievements, 
    userAchievements, 
    userTradingStats,
    marketPositions,
    marketTrades
  } = await import("../../shared/schema");

  // Get enhanced leaderboards with multiple metrics (includes both users AND avatars)
  app.get("/api/markets/leaderboards/:metric", asyncHandler(async (req: Request, res: Response) => {
    const { metric } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    let orderByColumn;
    switch (metric) {
      case 'profit':
        orderByColumn = desc(userTradingStats.netProfit);
        break;
      case 'volume':
        orderByColumn = desc(userTradingStats.totalVolume);
        break;
      case 'winrate':
        orderByColumn = desc(userTradingStats.winRate);
        break;
      case 'roi':
        orderByColumn = desc(userTradingStats.roi);
        break;
      default:
        orderByColumn = desc(userTradingStats.netProfit);
    }

    // Map metric to correct rank column name
    let rankColumn;
    switch (metric) {
      case 'profit':
        rankColumn = userTradingStats.profitRank;
        break;
      case 'volume':
        rankColumn = userTradingStats.volumeRank;
        break;
      case 'winrate':
        rankColumn = userTradingStats.winRateRank;
        break;
      case 'roi':
        rankColumn = userTradingStats.roiRank;
        break;
      default:
        rankColumn = userTradingStats.profitRank;
    }

    // Get user leaderboard entries
    const userLeaderboard = await db
      .select({
        userId: userTradingStats.userId,
        username: users.username,
        avatar: users.avatar,
        netProfit: userTradingStats.netProfit,
        totalVolume: userTradingStats.totalVolume,
        winRate: userTradingStats.winRate,
        roi: userTradingStats.roi,
        totalTrades: userTradingStats.totalTrades,
        winningTrades: userTradingStats.winningTrades,
        currentWinStreak: userTradingStats.currentWinStreak,
        longestWinStreak: userTradingStats.longestWinStreak,
        rank: rankColumn
      })
      .from(userTradingStats)
      .leftJoin(users, eq(userTradingStats.userId, users.id))
      .orderBy(orderByColumn)
      .limit(limit)
      .offset(offset);

    // Get avatar trading stats from market trades (avatars use wallet like 'avatar:xxx')
    const avatarTrades = await db
      .select({
        userWallet: marketTrades.userWallet,
        totalVolume: sql<number>`SUM(${marketTrades.streamAmount})`,
        totalTrades: sql<number>`COUNT(*)`,
      })
      .from(marketTrades)
      .where(sql`${marketTrades.userWallet} LIKE 'avatar:%'`)
      .groupBy(marketTrades.userWallet);

    // Get avatar details for those with trades
    const avatarIds = avatarTrades.map(t => t.userWallet.replace('avatar:', ''));
    const avatars = avatarIds.length > 0 
      ? await db.query.knowledgeAvatars.findMany({
          where: sql`${knowledgeAvatars.id} IN (${sql.join(avatarIds.map(id => sql`${id}`), sql`, `)})`
        })
      : [];

    const avatarMap = new Map(avatars.map(a => [a.id, a]));

    // Format avatar entries
    const avatarLeaderboardEntries = avatarTrades
      .filter(t => t.totalTrades > 0)
      .map(trade => {
        const avatarId = trade.userWallet.replace('avatar:', '');
        const avatar = avatarMap.get(avatarId);
        return {
          id: avatarId,
          type: 'avatar' as const,
          avatarId,
          username: avatar?.name || 'Unknown Avatar',
          avatar: avatar?.imageUrl || null,
          netProfit: 0,
          totalVolume: Number(trade.totalVolume) || 0,
          winRate: (avatar as any)?.winRate || 0,
          roi: (avatar as any)?.avgTradeRoi || 0,
          totalTrades: Number(trade.totalTrades) || 0,
          winningTrades: Math.floor((Number(trade.totalTrades) || 0) * ((avatar as any)?.winRate || 0.5)),
          currentWinStreak: 0,
          longestWinStreak: 0,
          rank: null
        };
      });

    // Format user entries
    const userLeaderboardEntries = userLeaderboard.map(entry => ({
      id: entry.userId,
      type: 'user' as const,
      userId: entry.userId,
      username: entry.username || 'Anonymous',
      avatar: entry.avatar,
      netProfit: entry.netProfit || 0,
      totalVolume: entry.totalVolume || 0,
      winRate: entry.winRate || 0,
      roi: entry.roi || 0,
      totalTrades: entry.totalTrades || 0,
      winningTrades: entry.winningTrades || 0,
      currentWinStreak: entry.currentWinStreak || 0,
      longestWinStreak: entry.longestWinStreak || 0,
      rank: entry.rank
    }));

    // Merge and sort by the selected metric
    const combined = [...userLeaderboardEntries, ...avatarLeaderboardEntries];
    
    combined.sort((a, b) => {
      switch (metric) {
        case 'profit': return (b.netProfit || 0) - (a.netProfit || 0);
        case 'volume': return (b.totalVolume || 0) - (a.totalVolume || 0);
        case 'winrate': return (b.winRate || 0) - (a.winRate || 0);
        case 'roi': return (b.roi || 0) - (a.roi || 0);
        default: return (b.netProfit || 0) - (a.netProfit || 0);
      }
    });

    // Assign ranks
    const leaderboard = combined.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      success: true,
      leaderboard,
      metric,
      count: leaderboard.length
    });
  }));

  // Get authenticated user's portfolio with positions and P&L
  app.get("/api/markets/portfolio/me", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const positions = await db
      .select({
        position: marketPositions,
        market: predictionMarkets
      })
      .from(marketPositions)
      .leftJoin(predictionMarkets, eq(marketPositions.marketId, predictionMarkets.id))
      .where(eq(marketPositions.userId, userId))
      .orderBy(desc(marketPositions.updatedAt));

    const stats = await db
      .select()
      .from(userTradingStats)
      .where(eq(userTradingStats.userId, userId))
      .limit(1);

    const recentTrades = await db
      .select({
        trade: marketTrades,
        market: predictionMarkets
      })
      .from(marketTrades)
      .leftJoin(predictionMarkets, eq(marketTrades.marketId, predictionMarkets.id))
      .where(eq(marketTrades.userId, userId))
      .orderBy(desc(marketTrades.createdAt))
      .limit(20);

    // Calculate portfolio summary
    let totalProfit = 0;
    let totalVolume = 0;
    let totalTrades = 0;
    let winningTrades = 0;
    
    if (stats[0]) {
      totalProfit = stats[0].netProfit || 0;
      totalVolume = stats[0].totalVolume || 0;
      totalTrades = stats[0].totalTrades || 0;
      winningTrades = stats[0].winningTrades || 0;
    }
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const roi = totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0;

    // Transform positions to match frontend expected format
    const formattedPositions = positions.map(({ position, market }) => {
      const currentPrice = position.outcome === 'YES' 
        ? (market?.yesPrice || 0) 
        : (market?.noPrice || 0);
      const value = position.shares * currentPrice / 100;
      const unrealizedPnL = value - position.totalInvested;
      const percentChange = position.totalInvested > 0 
        ? ((value - position.totalInvested) / position.totalInvested) * 100 
        : 0;

      return {
        marketId: position.marketId,
        marketTitle: market?.question || 'Unknown Market',
        outcome: position.outcome,
        shares: position.shares,
        avgPrice: position.averagePrice / 100,
        currentPrice: currentPrice / 100,
        unrealizedPnL,
        percentChange
      };
    });

    // Transform trades to match frontend expected format
    const formattedTrades = recentTrades.map(({ trade, market }) => ({
      id: trade.id,
      marketTitle: market?.question || 'Unknown Market',
      outcome: trade.outcome,
      shares: trade.shares,
      price: trade.price / 100,
      type: trade.tradeType as 'buy' | 'sell',
      timestamp: trade.createdAt?.toISOString() || new Date().toISOString(),
      pnl: trade.tradeType === 'sell' ? (trade.shares * trade.price / 100 - trade.streamAmount) : undefined
    }));

    res.json({
      success: true,
      portfolio: {
        totalProfit,
        totalVolume,
        winRate,
        roi,
        totalTrades,
        winningTrades,
        currentStreak: stats[0]?.currentWinStreak || 0,
        positions: formattedPositions,
        recentTrades: formattedTrades
      }
    });
  }));

  // Get user portfolio with positions and P&L (by userId - legacy endpoint)
  app.get("/api/markets/portfolio/:userId", asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const positions = await db
      .select({
        position: marketPositions,
        market: predictionMarkets
      })
      .from(marketPositions)
      .leftJoin(predictionMarkets, eq(marketPositions.marketId, predictionMarkets.id))
      .where(eq(marketPositions.userId, userId))
      .orderBy(desc(marketPositions.updatedAt));

    const stats = await db
      .select()
      .from(userTradingStats)
      .where(eq(userTradingStats.userId, userId))
      .limit(1);

    const recentTrades = await db
      .select({
        trade: marketTrades,
        market: predictionMarkets
      })
      .from(marketTrades)
      .leftJoin(predictionMarkets, eq(marketTrades.marketId, predictionMarkets.id))
      .where(eq(marketTrades.userId, userId))
      .orderBy(desc(marketTrades.createdAt))
      .limit(20);

    res.json({
      success: true,
      portfolio: {
        positions,
        stats: stats[0] || null,
        recentTrades
      }
    });
  }));

  // Get market price history for charts
  app.get("/api/markets/:marketId/price-history", asyncHandler(async (req: Request, res: Response) => {
    const { marketId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await db
      .select()
      .from(marketPriceHistory)
      .where(
        and(
          eq(marketPriceHistory.marketId, marketId),
          sql`${marketPriceHistory.createdAt} >= ${cutoffTime}`
        )
      )
      .orderBy(marketPriceHistory.createdAt);

    res.json({
      success: true,
      history,
      count: history.length
    });
  }));

  // Record price snapshot (called by trade execution)
  app.post("/api/markets/:marketId/price-snapshot", authenticateToken, requireAdmin, validateBody(priceSnapshotSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { marketId } = req.params;

    const market = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.id, marketId))
      .limit(1);

    if (!market[0]) {
      return res.status(404).json({ error: "Market not found" });
    }

    const snapshot = await db.insert(marketPriceHistory).values({
      marketId,
      yesPrice: market[0].yesPrice,
      noPrice: market[0].noPrice,
      yesLiquidity: market[0].yesLiquidity,
      noLiquidity: market[0].noLiquidity,
      totalVolume: market[0].totalVolume
    }).returning();

    res.json({
      success: true,
      snapshot: snapshot[0]
    });
  }));

  // Get all achievements
  app.get("/api/achievements", asyncHandler(async (req: Request, res: Response) => {
    const allAchievements = await db
      .select()
      .from(achievements)
      .orderBy(achievements.category, achievements.tier);

    res.json({
      success: true,
      achievements: allAchievements
    });
  }));

  // Get user achievements
  app.get("/api/achievements/user/:userId", asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const userAchievementsList = await db
      .select({
        userAchievement: userAchievements,
        achievement: achievements
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.completedAt));

    const completed = userAchievementsList.filter(ua => ua.userAchievement.isCompleted);
    const inProgress = userAchievementsList.filter(ua => !ua.userAchievement.isCompleted);

    res.json({
      success: true,
      achievements: {
        completed,
        inProgress,
        total: userAchievementsList.length
      }
    });
  }));

  // Initialize base achievements (admin only)
  app.post("/api/achievements/initialize", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const baseAchievements = [
      {
        key: 'first_trade',
        name: 'First Trade',
        description: 'Execute your first prediction market trade',
        category: 'trading',
        tier: 'bronze',
        requirement: { type: 'trade_count', value: 1 },
        reward: 100
      },
      {
        key: 'volume_1k',
        name: 'Market Participant',
        description: 'Trade 1,000 STREAM in volume',
        category: 'trading',
        tier: 'bronze',
        requirement: { type: 'volume', value: 1000 },
        reward: 250
      },
      {
        key: 'volume_10k',
        name: 'Active Trader',
        description: 'Trade 10,000 STREAM in volume',
        category: 'trading',
        tier: 'silver',
        requirement: { type: 'volume', value: 10000 },
        reward: 1000
      },
      {
        key: 'volume_100k',
        name: 'Whale Trader',
        description: 'Trade 100,000 STREAM in volume',
        category: 'trading',
        tier: 'gold',
        requirement: { type: 'volume', value: 100000 },
        reward: 5000
      },
      {
        key: 'profit_1k',
        name: 'Profitable Trader',
        description: 'Earn 1,000 STREAM in profit',
        category: 'prediction',
        tier: 'bronze',
        requirement: { type: 'profit', value: 1000 },
        reward: 500
      },
      {
        key: 'profit_10k',
        name: 'Market Oracle',
        description: 'Earn 10,000 STREAM in profit',
        category: 'prediction',
        tier: 'silver',
        requirement: { type: 'profit', value: 10000 },
        reward: 2000
      },
      {
        key: 'profit_100k',
        name: 'Prophet',
        description: 'Earn 100,000 STREAM in profit',
        category: 'prediction',
        tier: 'gold',
        requirement: { type: 'profit', value: 100000 },
        reward: 10000
      },
      {
        key: 'win_streak_5',
        name: 'Hot Streak',
        description: 'Win 5 trades in a row',
        category: 'prediction',
        tier: 'silver',
        requirement: { type: 'win_streak', value: 5 },
        reward: 1500
      },
      {
        key: 'win_streak_10',
        name: 'Unstoppable',
        description: 'Win 10 trades in a row',
        category: 'prediction',
        tier: 'gold',
        requirement: { type: 'win_streak', value: 10 },
        reward: 5000
      },
      {
        key: 'winrate_70',
        name: 'Consistent Winner',
        description: 'Achieve 70% win rate with 20+ trades',
        category: 'prediction',
        tier: 'platinum',
        requirement: { type: 'winrate', value: 70, min_trades: 20 },
        reward: 15000
      }
    ];

    const inserted = [];
    for (const ach of baseAchievements) {
      try {
        const existing = await db
          .select()
          .from(achievements)
          .where(eq(achievements.key, ach.key))
          .limit(1);

        if (existing.length === 0) {
          const result = await db.insert(achievements).values(ach).returning();
          inserted.push(result[0]);
        }
      } catch (error) {
        console.error(`Error inserting achievement ${ach.key}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Initialized ${inserted.length} achievements`,
      achievements: inserted
    });
  }));
  
}
