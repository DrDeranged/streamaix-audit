// ============================================================================
// PredictionMarkets routes — extracted from server/routes.ts by
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

export async function registerPredictionMarketsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PREDICTION MARKETS ROUTES
  // =============================================================================
  
  const { predictionMarketService } = await import('../services/predictionMarketService');
  const { ammService } = await import('../services/ammService');
  const { resolutionService } = await import('../services/resolutionService');
  
  // Get all active markets (cached for 2 minutes)
  app.get("/api/prediction-markets", asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const cacheKey = `markets:${category || 'all'}:${limit}:${offset}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        markets: cached,
        count: (cached as any[]).length
      });
    }
    
    const markets = await predictionMarketService.getActiveMarkets({ category, limit, offset });
    cacheService.set(cacheKey, markets, 120); // Cache for 2 minutes
    
    res.json({
      success: true,
      markets,
      count: markets.length
    });
  }));
  
  // Get trending markets (cached for 3 minutes)
  app.get("/api/prediction-markets/trending", asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const cacheKey = `markets:trending:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        markets: cached,
        count: (cached as any[]).length
      });
    }
    
    const markets = await predictionMarketService.getTrendingMarkets(limit);
    cacheService.set(cacheKey, markets, 180); // Cache for 3 minutes
    
    res.json({
      success: true,
      markets,
      count: markets.length
    });
  }));
  
  // Create new market
  app.post("/api/prediction-markets", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { question, description, category, deadline, initialLiquidity, resolutionSource, imageUrl, tags, aiProbability, aiReasoning } = req.body;
    
    if (!question || !deadline || !initialLiquidity) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Check for duplicate markets with same or very similar question
    const normalizedQuestion = question.trim().toLowerCase();
    const existingMarket = await predictionMarketService.findMarketByQuestion(normalizedQuestion);
    
    if (existingMarket) {
      return res.status(409).json({ 
        error: "A market with this question already exists",
        existingMarketId: existingMarket.id,
        existingQuestion: existingMarket.question
      });
    }
    
    // Use server-side private key for security
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ error: "Server configuration error: Private key not configured" });
    }
    
    const market = await predictionMarketService.createMarket({
      question,
      description,
      category,
      creatorId: req.user!.id,
      creatorWallet: req.user!.walletAddress || "",
      deadline: new Date(deadline),
      initialLiquidity,
      resolutionSource,
      imageUrl,
      tags,
      aiProbability,
      aiReasoning,
      privateKey
    });
    
    res.json({
      success: true,
      market
    });
  }));
  
  // Calculate buy quote
  app.post("/api/prediction-markets/:marketId/quote-buy", asyncHandler(async (req: Request, res: Response) => {
    const { amountIn, isYes } = req.body;
    const market = await predictionMarketService.getMarket(req.params.marketId);
    
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }
    
    const quote = ammService.calculateBuyTokens(
      amountIn,
      isYes,
      market.yesLiquidity,
      market.noLiquidity
    );
    
    res.json({
      success: true,
      quote: {
        ...quote,
        currentYesPrice: market.yesPrice,
        currentNoPrice: market.noPrice
      }
    });
  }));

  // Execute a trade (buy/sell shares) for authenticated users
  app.post("/api/prediction-markets/:marketId/trade", authenticateToken, mediumLimit, validateBody(predictionMarketTradeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, outcome, tradeType } = req.body;
    const marketId = req.params.marketId;
    const userId = req.user!.id;

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid trade amount" });
    }
    if (!outcome || !['yes', 'no'].includes(outcome.toLowerCase())) {
      return res.status(400).json({ error: "Invalid outcome - must be 'yes' or 'no'" });
    }
    if (!tradeType || !['buy', 'sell'].includes(tradeType.toLowerCase())) {
      return res.status(400).json({ error: "Invalid trade type - must be 'buy' or 'sell'" });
    }

    const market = await predictionMarketService.getMarket(marketId);
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }

    if (market.status !== 'active') {
      return res.status(400).json({ error: "Market is not active for trading" });
    }

    // Check if market has expired
    if (new Date(market.deadline) < new Date()) {
      return res.status(400).json({ error: "Market has expired" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isYes = outcome.toLowerCase() === 'yes';
    const isBuy = tradeType.toLowerCase() === 'buy';

    // Calculate the trade using AMM
    let quote;
    if (isBuy) {
      // Check user has enough STREAM points
      if ((user.streamPoints || 0) < amount) {
        return res.status(400).json({ 
          error: "Insufficient STREAM points", 
          required: amount,
          available: user.streamPoints || 0
        });
      }

      quote = ammService.calculateBuyTokens(
        amount,
        isYes,
        market.yesLiquidity,
        market.noLiquidity
      );
    } else {
      // For selling, check user has enough shares
      const existingPosition = await predictionMarketService.getUserPosition(userId, marketId);
      const sharesHeld = isYes 
        ? (existingPosition?.yesShares || 0) 
        : (existingPosition?.noShares || 0);
      
      if (sharesHeld < amount) {
        return res.status(400).json({ 
          error: `Insufficient ${isYes ? 'YES' : 'NO'} shares`,
          required: amount,
          available: sharesHeld
        });
      }

      quote = ammService.calculateSellTokens(
        amount,
        isYes,
        market.yesLiquidity,
        market.noLiquidity
      );
    }

    // Execute the trade
    // For buy: tokensOut is shares received, amount is STREAM spent
    // For sell: amount is shares sold, amountOut is STREAM received
    const sharesTraded = isBuy ? quote.tokensOut : amount;
    const streamAmount = isBuy ? amount : quote.amountOut;
    
    const tradeResult = await predictionMarketService.executeTrade({
      userId,
      marketId,
      outcome: isYes ? 'YES' : 'NO',
      tradeType: isBuy ? 'buy' : 'sell',
      amount: streamAmount,
      shares: sharesTraded,
      price: isYes ? market.yesPrice : market.noPrice,
      fee: quote.fee
    });

    // Update user's STREAM points with transaction logging
    if (isBuy) {
      await pointsService.spendPoints({
        userId,
        amount,
        source: 'market_trade',
        description: `Bought ${sharesTraded.toFixed(2)} ${isYes ? 'YES' : 'NO'} shares`,
        referenceId: marketId,
        referenceType: 'prediction_market',
        metadata: { outcome: isYes ? 'YES' : 'NO', shares: sharesTraded, price: quote.effectivePrice }
      });
    } else {
      await pointsService.awardPoints({
        userId,
        amount: quote.amountOut,
        source: 'market_trade',
        type: 'earn',
        description: `Sold ${sharesTraded.toFixed(2)} ${isYes ? 'YES' : 'NO'} shares`,
        referenceId: marketId,
        referenceType: 'prediction_market',
        metadata: { outcome: isYes ? 'YES' : 'NO', shares: sharesTraded, amountOut: quote.amountOut }
      });
    }

    // Update market liquidity and prices
    const newYesLiquidity = isBuy 
      ? (isYes ? market.yesLiquidity + amount : market.yesLiquidity)
      : (isYes ? market.yesLiquidity - quote.amountOut : market.yesLiquidity);
    const newNoLiquidity = isBuy 
      ? (isYes ? market.noLiquidity : market.noLiquidity + amount)
      : (isYes ? market.noLiquidity : market.noLiquidity - quote.amountOut);

    // Calculate new prices based on liquidity
    const totalLiquidity = newYesLiquidity + newNoLiquidity;
    const newYesPrice = Math.round((newNoLiquidity / totalLiquidity) * 10000);
    const newNoPrice = Math.round((newYesLiquidity / totalLiquidity) * 10000);

    await predictionMarketService.updateMarket(marketId, {
      yesLiquidity: newYesLiquidity,
      noLiquidity: newNoLiquidity,
      yesPrice: newYesPrice,
      noPrice: newNoPrice,
      totalVolume: (market.totalVolume || 0) + amount,
      totalTrades: (market.totalTrades || 0) + 1
    });

    // Get updated position
    const updatedPosition = await predictionMarketService.getUserPosition(userId, marketId);

    res.json({
      success: true,
      trade: tradeResult,
      position: updatedPosition,
      quote: {
        sharesReceived: isBuy ? quote.tokensOut : amount,
        streamReceived: isBuy ? 0 : quote.amountOut,
        priceImpact: quote.priceImpact,
        fee: quote.fee
      },
      newPrices: {
        yes: newYesPrice / 100,
        no: newNoPrice / 100
      },
      remainingBalance: isBuy 
        ? (user.streamPoints || 0) - amount 
        : (user.streamPoints || 0) + quote.amountOut
    });
  }));

  // Get user's position on a specific market
  app.get("/api/prediction-markets/:marketId/position", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const position = await predictionMarketService.getUserPosition(req.user!.id, req.params.marketId);
    const market = await predictionMarketService.getMarket(req.params.marketId);
    
    if (!position) {
      return res.json({
        success: true,
        position: null,
        hasPosition: false
      });
    }

    // Calculate P&L
    const yesValue = (position.yesShares || 0) * (market?.yesPrice || 0) / 100;
    const noValue = (position.noShares || 0) * (market?.noPrice || 0) / 100;
    const totalValue = yesValue + noValue;
    const totalCost = (position.totalCost || 0);
    const unrealizedPnL = totalValue - totalCost;

    res.json({
      success: true,
      position: {
        ...position,
        currentYesValue: yesValue,
        currentNoValue: noValue,
        totalValue,
        unrealizedPnL,
        percentChange: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0
      },
      hasPosition: true,
      market: market ? {
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        status: market.status
      } : null
    });
  }));

  // Get trades for a specific market by the current user
  app.get("/api/prediction-markets/:marketId/trades/me", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const trades = await predictionMarketService.getUserTradesForMarket(req.user!.id, req.params.marketId);
    
    res.json({
      success: true,
      trades,
      count: trades.length
    });
  }));

  // Get volume stats for a specific market (real-time tracking)
  app.get("/api/prediction-markets/:marketId/volume-stats", asyncHandler(async (req: Request, res: Response) => {
    const marketId = req.params.marketId;
    const market = await predictionMarketService.getMarket(marketId);
    
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }

    // Get all trades for this market to calculate volume breakdown
    const allTrades = await predictionMarketService.getMarketTrades(marketId);
    
    // Calculate YES vs NO volume
    let yesVolume = 0;
    let noVolume = 0;
    let volume24h = 0;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    let volumePrevious24h = 0;
    
    for (const trade of allTrades) {
      const amount = trade.streamAmount || 0;
      const tradeDate = new Date(trade.createdAt);
      
      if (trade.outcome === 'YES') {
        yesVolume += amount;
      } else {
        noVolume += amount;
      }
      
      // Calculate 24h volume
      if (tradeDate >= twentyFourHoursAgo) {
        volume24h += amount;
      } else if (tradeDate >= fortyEightHoursAgo) {
        volumePrevious24h += amount;
      }
    }

    // Calculate volume change percentage
    const volumeChange24h = volumePrevious24h > 0 
      ? ((volume24h - volumePrevious24h) / volumePrevious24h) * 100 
      : volume24h > 0 ? 100 : 0;

    // Get recent trades (last 10)
    const recentTrades = allTrades
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        outcome: t.outcome,
        tradeType: t.tradeType,
        streamAmount: t.streamAmount,
        createdAt: t.createdAt,
      }));

    res.json({
      success: true,
      stats: {
        yesVolume,
        noVolume,
        totalVolume: market.totalVolume || 0,
        volume24h,
        volumeChange24h,
        recentTrades
      }
    });
  }));
  
  // Get user positions
  app.get("/api/prediction-markets/positions/me", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const positions = await predictionMarketService.getUserPositionsWithMarkets(req.user!.id);
    
    res.json({
      success: true,
      positions,
      count: positions.length
    });
  }));
  
  // Get user trades
  app.get("/api/prediction-markets/trades/me", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const trades = await predictionMarketService.getUserTrades(req.user!.id);
    
    res.json({
      success: true,
      trades,
      count: trades.length
    });
  }));
  
  // Get market statistics
  app.get("/api/prediction-markets/stats", asyncHandler(async (req: Request, res: Response) => {
    const stats = await predictionMarketService.getMarketStats();
    
    res.json({
      success: true,
      stats
    });
  }));
  
  // Get leaderboard
  app.get("/api/prediction-markets/leaderboard", asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await predictionMarketService.getLeaderboard(limit);
    
    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length
    });
  }));
  
  // Extract predictions from summary content
  app.post("/api/summaries/:summaryId/extract-predictions", authenticateToken, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { extractPredictionsFromSummary } = await import('../services/predictionExtractionService');
    
    const summary = await storage.getSummary(req.params.summaryId);
    if (!summary) {
      return res.status(404).json({ error: "Summary not found" });
    }
    
    if (!summary.summary && !summary.blogPost) {
      return res.status(400).json({ error: "Summary has no content to analyze" });
    }
    
    const content = summary.summary || summary.blogPost || '';
    const result = await extractPredictionsFromSummary(content, summary.title, summary.originalUrl);
    
    res.json({
      success: true,
      ...result
    });
  }));
  
  // Get markets linked to a specific summary
  app.get("/api/summaries/:summaryId/prediction-markets", asyncHandler(async (req: Request, res: Response) => {
    const markets = await predictionMarketService.getMarketsBySourceContent(req.params.summaryId);
    
    res.json({
      success: true,
      markets,
      count: markets.length
    });
  }));

  // Get AI-generated market analytics
  app.get("/api/prediction-markets/ai-analytics", asyncHandler(async (req: Request, res: Response) => {
    try {
      // Count total markets
      const allMarkets = await db.select().from(predictionMarkets);
      const aiGeneratedMarkets = allMarkets.filter(m => m.sourceContentId);
      const totalMarkets = allMarkets.length;
      const aiMarkets = aiGeneratedMarkets.length;
      const communityMarkets = totalMarkets - aiMarkets;

      // Calculate AI market performance metrics
      const aiVolume = aiGeneratedMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
      const aiTrades = aiGeneratedMarkets.reduce((sum, m) => sum + (m.totalTrades || 0), 0);
      const totalVolume = allMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
      const totalTrades = allMarkets.reduce((sum, m) => sum + (m.totalTrades || 0), 0);

      // Get top performing AI markets by volume
      const topAiMarkets = aiGeneratedMarkets
        .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
        .slice(0, 5)
        .map(m => ({
          id: m.id,
          question: m.question,
          totalVolume: m.totalVolume,
          totalTrades: m.totalTrades,
          category: m.category
        }));

      res.json({
        success: true,
        analytics: {
          totalMarkets,
          aiGeneratedCount: aiMarkets,
          communityCreatedCount: communityMarkets,
          aiMarketPercentage: totalMarkets > 0 ? ((aiMarkets / totalMarkets) * 100).toFixed(1) : 0,
          aiVolumeShare: totalVolume > 0 ? ((aiVolume / totalVolume) * 100).toFixed(1) : 0,
          aiTradesShare: totalTrades > 0 ? ((aiTrades / totalTrades) * 100).toFixed(1) : 0,
          avgVolumePerAiMarket: aiMarkets > 0 ? (aiVolume / aiMarkets).toFixed(0) : 0,
          avgTradesPerAiMarket: aiMarkets > 0 ? (aiTrades / aiMarkets).toFixed(1) : 0,
          topPerformingAiMarkets: topAiMarkets
        }
      });
    } catch (error: any) {
      console.error('❌ Error fetching AI market analytics:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch AI market analytics' });
    }
  }));

  // Backfill AI predictions for markets
  app.post("/api/prediction-markets/backfill-ai", authenticateToken, requireAdmin, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { aiPredictionBackfillService } = await import('../services/aiPredictionBackfillService');
      
      console.log('🚀 Starting AI prediction backfill...');
      const result = await aiPredictionBackfillService.backfillAllMarkets();
      
      res.json({
        success: true,
        message: 'AI prediction backfill completed',
        result
      });
    } catch (error: any) {
      console.error('❌ Error in AI prediction backfill:', error);
      res.status(500).json({ success: false, error: 'Failed to backfill AI predictions' });
    }
  }));

  // Recent prediction market trades across all markets (MUST be before /:marketId)
  app.get("/api/prediction-markets/recent-trades", asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    const trades = await db
      .select({
        id: marketTrades.id,
        marketId: marketTrades.marketId,
        userId: marketTrades.userId,
        outcome: marketTrades.outcome,
        tradeType: marketTrades.tradeType,
        shares: marketTrades.shares,
        price: marketTrades.price,
        streamAmount: marketTrades.streamAmount,
        createdAt: marketTrades.createdAt,
        marketQuestion: predictionMarkets.question,
        marketCategory: predictionMarkets.category,
      })
      .from(marketTrades)
      .leftJoin(predictionMarkets, eq(marketTrades.marketId, predictionMarkets.id))
      .orderBy(desc(marketTrades.createdAt))
      .limit(limit);

    const userIds = [...new Set(trades.map(t => t.userId).filter(Boolean))];
    const usernames: Record<string, string> = {};
    for (const userId of userIds) {
      const user = await storage.getUser(userId as string);
      if (user) {
        usernames[userId as string] = user.displayName || user.username || 'Anonymous';
      }
    }

    const enrichedTrades = trades.map(t => ({
      ...t,
      username: t.userId ? usernames[t.userId] || 'Anonymous' : 'Anonymous'
    }));

    res.json({ success: true, trades: enrichedTrades });
  }));

  // Top predictors (whale tracker) with their positions (MUST be before /:marketId)
  app.get("/api/prediction-markets/whales", asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

    const topTraders = await db
      .select({
        userId: marketPositions.userId,
        totalShares: sql<number>`SUM(${marketPositions.shares})::int`,
        totalInvested: sql<number>`SUM(${marketPositions.totalInvested})::int`,
        positionCount: sql<number>`COUNT(*)::int`,
      })
      .from(marketPositions)
      .where(sql`${marketPositions.shares} > 0`)
      .groupBy(marketPositions.userId)
      .orderBy(desc(sql`SUM(${marketPositions.totalInvested})`))
      .limit(limit);

    const enrichedWhales = await Promise.all(topTraders.map(async (whale) => {
      const user = await storage.getUser(whale.userId);
      
      const positions = await db
        .select({
          marketId: marketPositions.marketId,
          outcome: marketPositions.outcome,
          shares: marketPositions.shares,
          totalInvested: marketPositions.totalInvested,
          marketQuestion: predictionMarkets.question,
          marketCategory: predictionMarkets.category,
          yesPrice: predictionMarkets.yesPrice,
        })
        .from(marketPositions)
        .leftJoin(predictionMarkets, eq(marketPositions.marketId, predictionMarkets.id))
        .where(and(
          eq(marketPositions.userId, whale.userId),
          sql`${marketPositions.shares} > 0`
        ))
        .orderBy(desc(marketPositions.totalInvested))
        .limit(3);

      return {
        userId: whale.userId,
        username: user?.displayName || user?.username || 'Anonymous',
        isAiAgent: user?.isAiAgent || false,
        totalInvested: whale.totalInvested,
        totalShares: whale.totalShares,
        positionCount: whale.positionCount,
        topPositions: positions,
      };
    }));

    res.json({ success: true, whales: enrichedWhales });
  }));

  // Recently resolved markets (MUST be before /:marketId)
  app.get("/api/prediction-markets/resolved", asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

      const resolvedMarkets = await db
        .select({
          id: predictionMarkets.id,
          question: predictionMarkets.question,
          category: predictionMarkets.category,
          outcome: predictionMarkets.resolution,
          finalYesPrice: predictionMarkets.yesPrice,
          totalVolume: predictionMarkets.totalVolume,
          totalTrades: predictionMarkets.totalTrades,
          resolvedAt: predictionMarkets.resolvedAt,
          deadline: predictionMarkets.deadline,
        })
        .from(predictionMarkets)
        .where(eq(predictionMarkets.status, 'resolved'))
        .orderBy(desc(predictionMarkets.resolvedAt))
        .limit(limit);

      res.json({ success: true, markets: resolvedMarkets || [] });
    } catch (error: any) {
      console.error('Error fetching resolved markets:', error);
      res.json({ success: true, markets: [] });
    }
  }));

  // Get single market details (MUST be last - dynamic route)
  app.get("/api/prediction-markets/:marketId", asyncHandler(async (req: Request, res: Response) => {
    const market = await predictionMarketService.getMarket(req.params.marketId);
    
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }
    
    res.json({
      success: true,
      market
    });
  }));
  
}
