// ============================================================================
// BotTradingSimulator routes — extracted from server/routes.ts by
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

export async function registerBotTradingSimulatorRoutes(app: Express): Promise<void> {
  // =============================================================================
  // BOT TRADING SIMULATOR ROUTES
  // =============================================================================

  // GET /api/bot-trading/bots - List all active Knowledge Avatars as trading bots
  app.get('/api/bot-trading/bots', asyncHandler(async (req: Request, res: Response) => {
    const { getAllAvatarHandles } = await import('../services/avatarTradingPersonas');
    const avatarHandles = getAllAvatarHandles();
    const category = req.query.category as string | undefined;
    const sort = (req.query.sort as string) || 'roi';
    const limitParam = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let conditions: any[] = [eq(knowledgeAvatars.isActive, true)];

    const bots = await db.select({
      id: knowledgeAvatars.id,
      name: knowledgeAvatars.name,
      handle: knowledgeAvatars.handle,
      description: knowledgeAvatars.bio,
      imageUrl: knowledgeAvatars.imageUrl,
      tradingStyle: knowledgeAvatars.tradingStyle,
      riskTolerance: knowledgeAvatars.riskTolerance,
      streamBalance: knowledgeAvatars.streamBalance,
      totalTrades: knowledgeAvatars.totalTrades,
      winRate: knowledgeAvatars.winRate,
      avgTradeRoi: knowledgeAvatars.avgTradeRoi,
      category: knowledgeAvatars.category,
      influenceScore: knowledgeAvatars.influenceScore,
    })
    .from(knowledgeAvatars)
    .where(and(...conditions))
    .orderBy(
      sort === 'winRate' ? desc(knowledgeAvatars.winRate) :
      sort === 'volume' ? desc(knowledgeAvatars.totalTrades) :
      desc(knowledgeAvatars.avgTradeRoi)
    )
    .limit(100);

    const tradeCountsByAvatar = await db
      .select({
        avatarId: botSimTrades.avatarId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(botSimTrades)
      .where(isNotNull(botSimTrades.avatarId))
      .groupBy(botSimTrades.avatarId);
    const tradeCountMap = new Map(tradeCountsByAvatar.map(r => [r.avatarId, r.count]));

    const stakesByAvatar = await db
      .select({
        avatarId: botStakes.avatarId,
        totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)::int`,
        backerCount: sql<number>`COUNT(*)::int`,
      })
      .from(botStakes)
      .where(and(eq(botStakes.status, 'active'), isNotNull(botStakes.avatarId)))
      .groupBy(botStakes.avatarId);
    const stakeMap = new Map(stakesByAvatar.map(r => [r.avatarId, r]));

    const avatarHandleSet = new Set(avatarHandles);
    let botsWithPersona = bots
      .filter(bot => avatarHandleSet.has(bot.handle || ''))
      .map(bot => {
        const persona = getAvatarPersona(bot.handle || '');
        const stakes = stakeMap.get(bot.id);
        return {
          ...bot,
          totalStaked: stakes?.totalStaked || 0,
          backerCount: stakes?.backerCount || 0,
          recentTradeCount: tradeCountMap.get(bot.id) || 0,
          emoji: persona?.emoji || '🤖',
          personaCategory: persona?.category || bot.category,
          personaDescription: persona?.description || bot.description,
          tradingStyle: persona?.tradingStyle || bot.tradingStyle,
          riskTolerance: persona?.riskTolerance || bot.riskTolerance,
        };
      });

    if (category) {
      botsWithPersona = botsWithPersona.filter(b => b.personaCategory === category);
    }

    if (sort === 'backers') {
      botsWithPersona.sort((a, b) => (b.backerCount || 0) - (a.backerCount || 0));
    } else if (sort === 'totalStaked') {
      botsWithPersona.sort((a, b) => (b.totalStaked || 0) - (a.totalStaked || 0));
    } else if (sort === 'winRate') {
      botsWithPersona.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
    } else {
      botsWithPersona.sort((a, b) => (b.avgTradeRoi ?? 0) - (a.avgTradeRoi ?? 0));
    }

    const total = botsWithPersona.length;
    const paged = botsWithPersona.slice(offset, offset + limitParam);
    res.json({ bots: paged, total });
  }));

  // GET /api/bot-trading/bots/:id - Get bot detail with trade history
  app.get('/api/bot-trading/bots/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).session?.userId;

    const [bot] = await db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, id)).limit(1);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const trades = await db.select()
      .from(botSimTrades)
      .where(eq(botSimTrades.avatarId, id))
      .orderBy(desc(botSimTrades.createdAt))
      .limit(50);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const snapshots = await db.select()
      .from(botPerformanceSnapshots)
      .where(and(
        eq(botPerformanceSnapshots.avatarId, id),
        gte(botPerformanceSnapshots.snapshotDate, thirtyDaysAgo)
      ))
      .orderBy(asc(botPerformanceSnapshots.snapshotDate));

    const [stakeStats] = await db.select({
      totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)`,
      backerCount: sql<number>`COUNT(*)`,
    })
    .from(botStakes)
    .where(and(eq(botStakes.avatarId, id), eq(botStakes.status, 'active')));

    let userStake = null;
    if (userId) {
      const stakes = await db.select()
        .from(botStakes)
        .where(and(
          eq(botStakes.avatarId, id),
          eq(botStakes.userId, userId),
          eq(botStakes.status, 'active')
        ));
      userStake = stakes.length > 0 ? stakes[0] : null;
    }

    const persona = getAvatarPersona(bot.handle || '');

    const openPositions = await db.select()
      .from(botSimTrades)
      .where(and(eq(botSimTrades.avatarId, id), eq(botSimTrades.status, 'open')))
      .orderBy(desc(botSimTrades.createdAt));

    const portfolioMap = new Map<string, { asset: string; direction: string; quantity: number; entryPrice: number; currentValue: number; count: number }>();
    for (const pos of openPositions) {
      const key = `${pos.asset}-${pos.direction}`;
      const existing = portfolioMap.get(key);
      const qty = Number(pos.quantity ?? 0);
      const ep = Number(pos.entryPrice ?? 0);
      const cv = Number(pos.exitPrice ?? pos.entryPrice ?? 0) * qty;
      if (existing) {
        existing.quantity += qty;
        existing.entryPrice = (existing.entryPrice * existing.count + ep) / (existing.count + 1);
        existing.currentValue += cv;
        existing.count += 1;
      } else {
        portfolioMap.set(key, { asset: pos.asset || '', direction: pos.direction || 'long', quantity: qty, entryPrice: ep, currentValue: cv, count: 1 });
      }
    }
    const portfolio = Array.from(portfolioMap.values());

    const recentReasoningsResult = await db.select({
      reasoning: botSimTrades.reasoning,
      asset: botSimTrades.asset,
      direction: botSimTrades.direction,
      createdAt: botSimTrades.createdAt,
    })
    .from(botSimTrades)
    .where(and(eq(botSimTrades.avatarId, id), isNotNull(botSimTrades.reasoning)))
    .orderBy(desc(botSimTrades.createdAt))
    .limit(5);

    const botWithPersona = {
      ...bot,
      emoji: persona?.emoji || '🤖',
      personaCategory: persona?.category || bot.category,
      personaDescription: persona?.description || bot.bio,
      tradingStyle: persona?.tradingStyle || bot.tradingStyle,
      riskTolerance: persona?.riskTolerance || bot.riskTolerance,
      preferredAssets: persona?.preferredAssets || [],
      personaPhilosophy: persona?.description || '',
    };

    res.json({
      bot: botWithPersona,
      trades,
      snapshots,
      stakeStats: stakeStats || { totalStaked: 0, backerCount: 0 },
      userStake,
      openPositions,
      portfolio,
      recentReasonings: recentReasoningsResult,
    });
  }));

  // POST /api/bot-trading/stake - Stake STREAM points on a bot
  app.post('/api/bot-trading/stake', authenticateToken, mediumLimit, validateBody(botStakeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { avatarId, amount } = req.body;
    if (!avatarId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid avatarId and positive amount required' });
    }

    const [avatar] = await db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, avatarId)).limit(1);
    if (!avatar) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if ((user.streamPoints || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient STREAM points' });
    }

    await db.update(users)
      .set({ streamPoints: sql`${users.streamPoints} - ${amount}` })
      .where(eq(users.id, userId));

    const [stake] = await db.insert(botStakes)
      .values({
        userId,
        avatarId,
        amount,
        currentValue: amount,
        status: 'active',
      })
      .returning();

    res.json(stake);
  }));

  // POST /api/bot-trading/withdraw - Withdraw stake from a bot
  app.post('/api/bot-trading/withdraw', authenticateToken, mediumLimit, validateBody(botWithdrawSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { stakeId } = req.body;
    if (!stakeId) {
      return res.status(400).json({ error: 'stakeId is required' });
    }

    const [stake] = await db.select()
      .from(botStakes)
      .where(and(eq(botStakes.id, stakeId), eq(botStakes.userId, userId)))
      .limit(1);

    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }

    if (stake.status !== 'active') {
      return res.status(400).json({ error: 'Stake is not active' });
    }

    const returnAmount = stake.currentValue;

    await db.update(users)
      .set({ streamPoints: sql`${users.streamPoints} + ${returnAmount}` })
      .where(eq(users.id, userId));

    await db.update(botStakes)
      .set({ status: 'withdrawn', updatedAt: new Date() })
      .where(eq(botStakes.id, stakeId));

    const [updatedUser] = await db.select({ streamPoints: users.streamPoints })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.json({
      success: true,
      returnedAmount: returnAmount,
      newBalance: updatedUser?.streamPoints || 0,
    });
  }));

  // GET /api/bot-trading/my-stakes - Get user's active bot stakes
  app.get('/api/bot-trading/my-stakes', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stakes = await db.select({
      id: botStakes.id,
      avatarId: botStakes.avatarId,
      amount: botStakes.amount,
      currentValue: botStakes.currentValue,
      totalPnl: botStakes.totalPnl,
      totalPnlPercent: botStakes.totalPnlPercent,
      status: botStakes.status,
      createdAt: botStakes.createdAt,
      botName: knowledgeAvatars.name,
      botHandle: knowledgeAvatars.handle,
      botImageUrl: knowledgeAvatars.imageUrl,
      botCategory: knowledgeAvatars.category,
      botTradingStyle: knowledgeAvatars.tradingStyle,
      botRiskTolerance: knowledgeAvatars.riskTolerance,
    })
    .from(botStakes)
    .innerJoin(knowledgeAvatars, eq(botStakes.avatarId, knowledgeAvatars.id))
    .where(and(eq(botStakes.userId, userId), eq(botStakes.status, 'active')));

    res.json(stakes);
  }));

  // GET /api/bot-trading/stats - Platform-wide stats
  app.get('/api/bot-trading/stats', asyncHandler(async (req: Request, res: Response) => {
    const [stakeStats] = await db.select({
      totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)`,
      activeTraders: sql<number>`COUNT(DISTINCT ${botStakes.userId})`,
    })
    .from(botStakes)
    .where(eq(botStakes.status, 'active'));

    const [topBot] = await db.select({
      id: knowledgeAvatars.id,
      name: knowledgeAvatars.name,
      handle: knowledgeAvatars.handle,
      imageUrl: knowledgeAvatars.imageUrl,
      avgTradeRoi: knowledgeAvatars.avgTradeRoi,
    })
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.isActive, true))
    .orderBy(desc(knowledgeAvatars.avgTradeRoi))
    .limit(1);

    const [tradeCount] = await db.select({
      total: sql<number>`COUNT(*)`,
    })
    .from(botSimTrades);

    res.json({
      totalStaked: stakeStats?.totalStaked || 0,
      activeTraders: stakeStats?.activeTraders || 0,
      topBot: topBot || null,
      totalTrades: tradeCount?.total || 0,
    });
  }));

  // GET /api/bot-trading/recent-trades - Recent trades across all avatars
  app.get('/api/bot-trading/recent-trades', asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const recentTrades = await db.select({
      id: botSimTrades.id,
      asset: botSimTrades.asset,
      direction: botSimTrades.direction,
      entryPrice: botSimTrades.entryPrice,
      exitPrice: botSimTrades.exitPrice,
      pnl: botSimTrades.pnl,
      pnlPercent: botSimTrades.pnlPercent,
      status: botSimTrades.status,
      reasoning: botSimTrades.reasoning,
      createdAt: botSimTrades.createdAt,
      closedAt: botSimTrades.closedAt,
      avatarId: botSimTrades.avatarId,
      avatarName: knowledgeAvatars.name,
      avatarHandle: knowledgeAvatars.handle,
      avatarImageUrl: knowledgeAvatars.imageUrl,
    })
    .from(botSimTrades)
    .innerJoin(knowledgeAvatars, eq(botSimTrades.avatarId, knowledgeAvatars.id))
    .orderBy(desc(botSimTrades.createdAt))
    .limit(limit);

    res.json(recentTrades);
  }));

  // GET /api/bot-trading/leaderboard - Avatar leaderboard by performance
  app.get('/api/bot-trading/leaderboard', asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || 'all';

    const conditions: any[] = [eq(botSimTrades.status, 'closed'), isNotNull(botSimTrades.avatarId)];

    if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      conditions.push(gte(botSimTrades.closedAt, sevenDaysAgo));
    } else if (period === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      conditions.push(gte(botSimTrades.closedAt, thirtyDaysAgo));
    }

    const leaderboardData = await db.select({
      avatarId: botSimTrades.avatarId,
      totalTrades: sql<number>`COUNT(*)::int`,
      wins: sql<number>`COUNT(*) FILTER (WHERE ${botSimTrades.pnl} > 0)::int`,
      avgRoi: sql<number>`COALESCE(AVG(${botSimTrades.pnlPercent}), 0)`,
      totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)`,
      avatarName: knowledgeAvatars.name,
      avatarHandle: knowledgeAvatars.handle,
      avatarImageUrl: knowledgeAvatars.imageUrl,
      avatarCategory: knowledgeAvatars.category,
    })
    .from(botSimTrades)
    .innerJoin(knowledgeAvatars, eq(botSimTrades.avatarId, knowledgeAvatars.id))
    .where(and(...conditions))
    .groupBy(botSimTrades.avatarId, knowledgeAvatars.name, knowledgeAvatars.handle, knowledgeAvatars.imageUrl, knowledgeAvatars.category)
    .orderBy(sql`COALESCE(SUM(${botSimTrades.pnl}), 0) DESC`)
    .limit(50);

    const leaderboard = leaderboardData.map((row, index) => {
      const totalTrades = Number(row.totalTrades);
      const wins = Number(row.wins);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const persona = getAvatarPersona(row.avatarHandle || '');
      return {
        rank: index + 1,
        avatarId: row.avatarId,
        name: row.avatarName,
        handle: row.avatarHandle,
        imageUrl: row.avatarImageUrl,
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        avgRoi: Math.round(Number(row.avgRoi) * 100) / 100,
        totalPnl: Math.round(Number(row.totalPnl) * 100) / 100,
        category: persona?.category || row.avatarCategory || 'Trading',
        emoji: persona?.emoji || '🤖',
      };
    });

    res.json(leaderboard);
  }));

  app.post('/api/bot-trading/seed-historical', authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const [existingCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(botSimTrades);
    if (Number(existingCount?.count || 0) > 0) {
      return res.json({ success: true, message: 'Trades already exist, skipping seed', count: existingCount.count });
    }

    await seedBotHistoricalTrades();
    const [finalCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(botSimTrades);
    res.json({ success: true, message: 'Historical trades seeded successfully', count: finalCount?.count || 0 });
  }));

  // NOTE: `const httpServer = createServer(app);` was originally here; it has
  // been hoisted back into server/routes.ts so the websocket server section
  // (which references httpServer) still resolves it.
}
