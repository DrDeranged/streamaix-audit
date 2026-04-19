// ============================================================================
// MarketDataApi routes — extracted from server/routes.ts by
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

export async function registerMarketDataApiRoutes(app: Express): Promise<void> {
  // =============================================================================
  // MARKET DATA API ROUTES
  // =============================================================================

  // Get live cryptocurrency quotes
  app.get('/api/market/crypto/quotes', asyncHandler(async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbolArray = symbols.split(',').map(s => s.trim());
    const quotes = await marketDataService.getCryptoQuotes(symbolArray);
    res.json({ quotes });
  }));

  // Get cryptocurrency information
  app.get('/api/market/crypto/info/:symbol', asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol;
    const info = await marketDataService.getCryptoInfo(symbol);
    res.json({ info });
  }));

  // Get top cryptocurrencies
  app.get('/api/market/crypto/top', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cryptos = await marketDataService.getTopCryptos(limit);
    res.json({ cryptos });
  }));

  // Get crypto market stats for dashboard
  app.get('/api/crypto-stats', asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await marketDataService.getCryptoStats();
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch crypto stats:', error);
      res.status(502).json({ 
        success: false, 
        error: 'Market data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Enhance financial trends with live market data
  app.post('/api/market/enhance-trends', authenticateToken, strictLimit, validateBody(enhanceTrendsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { trends } = req.body;
    if (!trends || !Array.isArray(trends)) {
      return res.status(400).json({ error: 'Trends array is required' });
    }

    const enhancedTrends = await marketDataService.enhanceFinancialTrends(trends);
    res.json({ enhancedTrends });
  }));

  // =============================================================================
  // DISCOVER PAGE API ROUTES (Phase 1)
  // =============================================================================

  // Get market overview for discover page
  app.get('/api/market/overview', asyncHandler(async (req: Request, res: Response) => {
    const timeFilter = req.query.timeFilter as string || '24h';
    const marketData = MarketDataService.getInstance();
    
    try {
      // Get top crypto movers
      const [cryptoQuotes, stocks] = await Promise.all([
        marketData.getTopCryptos(20),
        marketData.getCryptoStocks()
      ]);
      
      // Calculate market movers based on percentage change
      const movers = [
        ...cryptoQuotes.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          change24h: crypto.percentChange24h,
          changePercent: crypto.percentChange24h,
          volume: crypto.volume24h,
          marketCap: crypto.marketCap,
          category: 'crypto' as const,
          momentum: crypto.percentChange24h > 2 ? 'bullish' as const : 
                   crypto.percentChange24h < -2 ? 'bearish' as const : 'neutral' as const
        })),
        ...stocks.slice(0, 10).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change24h: stock.percentChange24h || 0,
          changePercent: stock.percentChange24h || 0,
          volume: stock.volume || 0,
          marketCap: stock.marketCap,
          category: 'stock' as const,
          momentum: (stock.percentChange24h || 0) > 2 ? 'bullish' as const : 
                   (stock.percentChange24h || 0) < -2 ? 'bearish' as const : 'neutral' as const
        }))
      ]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 12);

      res.json({
        movers,
        timestamp: new Date().toISOString(),
        timeFilter
      });
    } catch (error: any) {
      console.error('Failed to fetch market overview:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market overview',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // COINGECKO PRO API ENDPOINTS (Premium market data)
  // =============================================================================

  // Get trending coins from CoinGecko Pro
  app.get('/api/market/coingecko/trending', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const trending = await marketData.getTrendingCoins();
      res.json({
        ...trending,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch trending coins:', error);
      res.status(500).json({ error: 'Failed to fetch trending coins' });
    }
  }));

  // Get global market statistics from CoinGecko Pro
  app.get('/api/market/coingecko/global', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const globalData = await marketData.getGlobalMarketData();
      res.json({
        data: globalData,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch global market data:', error);
      res.status(500).json({ error: 'Failed to fetch global market data' });
    }
  }));

  // Get top gainers and losers from CoinGecko Pro
  app.get('/api/market/coingecko/movers', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const marketData = MarketDataService.getInstance();
    
    try {
      const movers = await marketData.getTopMovers(limit);
      res.json({
        ...movers,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch top movers:', error);
      res.status(500).json({ error: 'Failed to fetch top movers' });
    }
  }));

  // Get detailed coin data from CoinGecko Pro
  app.get('/api/market/coingecko/coin/:coinId', asyncHandler(async (req: Request, res: Response) => {
    const { coinId } = req.params;
    const marketData = MarketDataService.getInstance();
    
    try {
      const coinDetails = await marketData.getCoinDetails(coinId);
      if (!coinDetails) {
        return res.status(404).json({ error: 'Coin not found' });
      }
      res.json({
        data: coinDetails,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch coin details:', error);
      res.status(500).json({ error: 'Failed to fetch coin details' });
    }
  }));

  // Get OHLC candlestick data for charting
  app.get('/api/market/coingecko/ohlc/:coinId', asyncHandler(async (req: Request, res: Response) => {
    const { coinId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const marketData = MarketDataService.getInstance();
    
    try {
      const ohlcData = await marketData.getOHLCData(coinId, days);
      res.json({
        data: ohlcData,
        coinId,
        days,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch OHLC data:', error);
      res.status(500).json({ error: 'Failed to fetch OHLC data' });
    }
  }));

  // Search coins on CoinGecko Pro
  app.get('/api/market/coingecko/search', asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const marketData = MarketDataService.getInstance();
    
    try {
      const results = await marketData.searchCoins(query);
      res.json({
        ...results,
        query,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to search coins:', error);
      res.status(500).json({ error: 'Failed to search coins' });
    }
  }));

  // Get DeFi market data from CoinGecko Pro
  app.get('/api/market/coingecko/defi', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const defiData = await marketData.getDefiMarketData();
      res.json({
        data: defiData,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch DeFi data:', error);
      res.status(500).json({ error: 'Failed to fetch DeFi data' });
    }
  }));

  // Get NFT market data from CoinGecko Pro
  app.get('/api/market/coingecko/nft', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const nftData = await marketData.getNftMarketData();
      res.json({
        ...nftData,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch NFT data:', error);
      res.status(500).json({ error: 'Failed to fetch NFT data' });
    }
  }));

  // Get exchange data from CoinGecko Pro
  app.get('/api/market/coingecko/exchanges', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const marketData = MarketDataService.getInstance();
    
    try {
      const exchanges = await marketData.getExchangeData(limit);
      res.json({
        data: exchanges,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch exchanges:', error);
      res.status(500).json({ error: 'Failed to fetch exchanges' });
    }
  }));

  // Get API usage statistics
  app.get('/api/market/coingecko/usage', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    const stats = marketData.getApiUsageStats();
    res.json({
      stats,
      timestamp: new Date().toISOString()
    });
  }));

  // Get derivatives data (open interest, funding rates, perpetual premium)
  app.get('/api/market/derivatives', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const data = await marketData.getDerivativesData();
      res.json({
        data,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch derivatives data:', error);
      res.status(500).json({ error: 'Failed to fetch derivatives data' });
    }
  }));

  // Get on-chain metrics (active addresses, NVT, MVRV, etc.)
  app.get('/api/market/onchain', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const data = await marketData.getOnChainMetrics();
      res.json({
        data,
        timestamp: new Date().toISOString(),
        source: 'Derived from CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch on-chain metrics:', error);
      res.status(500).json({ error: 'Failed to fetch on-chain metrics' });
    }
  }));

  // Get volatility metrics
  app.get('/api/market/volatility', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const data = await marketData.getVolatilityMetrics();
      res.json({
        data,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro OHLC'
      });
    } catch (error: any) {
      console.error('Failed to fetch volatility metrics:', error);
      res.status(500).json({ error: 'Failed to fetch volatility metrics' });
    }
  }));

  // Get category/sector performance
  app.get('/api/market/categories', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const data = await marketData.getCategoryPerformance();
      res.json({
        data,
        timestamp: new Date().toISOString(),
        source: 'CoinGecko Pro'
      });
    } catch (error: any) {
      console.error('Failed to fetch category performance:', error);
      res.status(500).json({ error: 'Failed to fetch category performance' });
    }
  }));

  // Get AI price predictions
  app.get('/api/market/ai-predictions', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const data = await marketData.getAIPricePredictions();
      res.json({
        data,
        timestamp: new Date().toISOString(),
        source: 'AI Analysis'
      });
    } catch (error: any) {
      console.error('Failed to fetch AI predictions:', error);
      res.status(500).json({ error: 'Failed to fetch AI predictions' });
    }
  }));

}
