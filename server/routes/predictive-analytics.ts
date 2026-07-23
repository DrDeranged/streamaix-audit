// ============================================================================
// PredictiveAnalytics routes — extracted from server/routes.ts by
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
import { marketDataService } from "../services/marketDataService";
import { PredictiveAnalyticsService } from "../services/predictiveAnalyticsService";

const predictiveAnalyticsService = new PredictiveAnalyticsService(storage as DatabaseStorage);
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

export async function registerPredictiveAnalyticsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PREDICTIVE ANALYTICS ROUTES 
  // =============================================================================

  // Get sector trend predictions
  app.get('/api/analytics/sector-trends/:sector', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sector } = req.params;
    const timeframe = req.query.timeframe as string || '24h';
    
    try {
      const predictions = await predictiveAnalyticsService.predictSectorTrends(sector, timeframe as any);
      res.json({
        success: true,
        sector,
        timeframe,
        predictions,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Sector trend prediction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate sector trend predictions',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get personalized content recommendations
  app.get('/api/analytics/recommendations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    try {
      const recommendations = await predictiveAnalyticsService.generateContentRecommendations(userId, limit);
      res.json({
        success: true,
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Content recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate content recommendations',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get market alerts
  app.get('/api/analytics/market-alerts', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    try {
      const alerts = await predictiveAnalyticsService.generateMarketAlerts(userId);
      res.json({
        success: true,
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Market alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate market alerts',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get live stock data (Finnhub API)
  app.get('/api/analytics/live/stocks', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const stocks = await marketDataService.getCryptoStocks();
      res.json({ 
        success: true,
        stocks, 
        count: stocks.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Stock data error:', error);
      res.status(500).json({ 
        success: false,
        stocks: [], 
        error: 'Stock data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get live crypto data with graceful fallback for rate limits
  app.get('/api/analytics/live/crypto', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const symbols = [
        'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
        'UNI', 'AAVE', 'ATOM', 'ALGO', 'VET', 'FIL', 'ICP', 'HBAR', 'APT', 'ARB'
      ];
      const prices = await marketDataService.getCryptoQuotes(symbols);
      
      if (prices.length === 0) {
        // All APIs rate limited
        return res.status(429).json({
          success: false,
          prices: [],
          error: 'All crypto data APIs have reached their rate limits. Please try again later.',
          rateLimitInfo: {
            coinGecko: 'Rate limit exceeded (10,000 calls/month)',
            coinMarketCap: 'Monthly credit limit reached',
            duneAnalytics: 'Rate limit exceeded'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ 
        success: true,
        prices, 
        count: prices.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Crypto data error:', error);
      res.status(500).json({ 
        success: false,
        prices: [], 
        error: 'Crypto data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get crypto news from CoinTelegraph and CoinDesk
  app.get('/api/news/crypto', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { newsService } = await import('../services/newsService');
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await newsService.getCryptoNews(limit);
      
      res.json({ 
        success: true,
        articles, 
        count: articles.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Crypto news error:', error);
      res.status(500).json({ 
        success: false,
        articles: [], 
        error: 'News feed temporarily unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get macro/financial news from CoinDesk
  app.get('/api/news/macro', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { newsService } = await import('../services/newsService');
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await newsService.getMacroNews(limit);
      
      res.json({ 
        success: true,
        articles, 
        count: articles.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Macro news error:', error);
      res.status(500).json({ 
        success: false,
        articles: [], 
        error: 'News feed temporarily unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get prediction markets generated from CoinDesk news
  app.get('/api/news/predictions', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { NewsService } = await import('../services/newsService');
      const { SocialMarketGenerator } = await import('../services/socialMarketGenerator');
      
      const newsService = NewsService.getInstance();
      const socialMarketGenerator = new SocialMarketGenerator();
      
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log('📰 Fetching CoinDesk news for prediction generation...');
      
      // Fetch latest CoinDesk news
      const articles = await newsService.fetchCoinDeskNews();
      
      console.log(`📰 Fetched ${articles.length} articles, generating up to ${limit} markets...`);
      
      // Generate or retrieve markets from these articles
      const result = await socialMarketGenerator.createMarketsFromNewsFeed(
        articles.slice(0, limit),
        limit
      );
      
      console.log(`✅ Generated ${result.created} new markets, ${result.markets.length} total`);
      
      res.json({ 
        success: true,
        markets: result.markets,
        count: result.markets.length,
        created: result.created,
        cached: result.markets.length - result.created,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('News predictions error:', error);
      res.status(500).json({ 
        success: false,
        markets: [],
        error: 'Failed to generate prediction markets from news', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Generate prediction markets from news articles
  app.post('/api/news/generate-markets', authenticateToken, requireAdmin, strictLimit, validateBody(generateMarketsFromNewsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { socialMarketGenerator } = await import('../services/socialMarketGenerator');
      const { articles, maxMarkets = 3 } = req.body;
      
      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Articles array is required' 
        });
      }

      const result = await socialMarketGenerator.createMarketsFromNewsFeed(articles, maxMarkets);
      
      res.json({ 
        success: true,
        ...result,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Market generation error:', error);
      res.status(500).json({ 
        success: false,
        created: 0,
        failed: 0,
        markets: [],
        error: 'Failed to generate markets', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get markets generated from social content
  app.get('/api/news/markets', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { socialMarketGenerator } = await import('../services/socialMarketGenerator');
      const limit = parseInt(req.query.limit as string) || 10;
      const markets = await socialMarketGenerator.getSocialMarkets(limit);
      
      res.json({ 
        success: true,
        markets,
        count: markets.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Social markets error:', error);
      res.status(500).json({ 
        success: false,
        markets: [],
        error: 'Failed to fetch social markets', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Generate prediction markets for an avatar
  app.post('/api/avatars/:avatarId/generate-markets', authenticateToken, requireAdmin, strictLimit, validateBody(avatarGenerateMarketsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { avatarMarketGenerator } = await import('../services/avatarMarketGenerator');
      const result = await avatarMarketGenerator.createMarketsForAvatar(req.params.avatarId);
      
      res.json({ 
        success: true,
        ...result,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Avatar market generation error:', error);
      res.status(500).json({ 
        success: false,
        created: 0,
        markets: [],
        error: 'Failed to generate avatar markets', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get markets for a specific avatar
  app.get('/api/avatars/:avatarId/markets', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { avatarMarketGenerator } = await import('../services/avatarMarketGenerator');
      const limit = parseInt(req.query.limit as string) || 3;
      const markets = await avatarMarketGenerator.getMarketsForAvatar(req.params.avatarId, limit);
      
      res.json({ 
        success: true,
        markets,
        count: markets.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Avatar markets fetch error:', error);
      res.status(500).json({ 
        success: false,
        markets: [],
        error: 'Failed to fetch avatar markets', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get avatar trading stats (prediction market positions)
  app.get('/api/avatars/:avatarId/trading-stats', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { avatarMarketParticipationService } = await import('../services/avatarMarketParticipationService');
      const stats = await avatarMarketParticipationService.getAvatarTradingStats(req.params.avatarId);
      
      res.json({ 
        success: true,
        ...stats,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Avatar trading stats error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch trading stats', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get avatar positions for a specific market
  app.get('/api/markets/:marketId/avatar-positions', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { avatarMarketParticipationService } = await import('../services/avatarMarketParticipationService');
      const positions = await avatarMarketParticipationService.getMarketAvatarPositions(req.params.marketId);
      
      res.json({ 
        success: true,
        positions,
        count: positions.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Market avatar positions error:', error);
      res.status(500).json({ 
        success: false,
        positions: [],
        error: 'Failed to fetch avatar positions', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Trigger avatar trading cycle (admin only)
  app.post('/api/admin/avatar-trading-cycle', authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { avatarMarketParticipationService } = await import('../services/avatarMarketParticipationService');
      const result = await avatarMarketParticipationService.runTradingCycle();
      
      res.json({ 
        success: true,
        ...result,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Avatar trading cycle error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to run trading cycle', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get avatar positions for a specific market
  app.get('/api/markets/:marketId/avatar-positions', asyncHandler(async (req: Request, res: Response) => {
    const { marketId } = req.params;
    try {
      const { avatarMarketParticipationService } = await import('../services/avatarMarketParticipationService');
      const positions = await avatarMarketParticipationService.getMarketAvatarPositions(marketId);
      res.json({ success: true, positions });
    } catch (error: any) {
      console.error('Error fetching avatar positions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch avatar positions' });
    }
  }));

  // Get avatar trading statistics
  app.get('/api/avatars/:avatarId/trading-stats', asyncHandler(async (req: Request, res: Response) => {
    const { avatarId } = req.params;
    try {
      const { avatarMarketParticipationService } = await import('../services/avatarMarketParticipationService');
      const stats = await avatarMarketParticipationService.getAvatarTradingStats(avatarId);
      res.json({ success: true, ...stats });
    } catch (error: any) {
      console.error('Error fetching avatar trading stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch trading stats' });
    }
  }));

  // Get user engagement predictions
  app.post('/api/analytics/engagement-forecast', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { contentTypes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!contentTypes || !Array.isArray(contentTypes)) {
      return res.status(400).json({ success: false, error: 'contentTypes array is required' });
    }
    
    try {
      const forecasts = await predictiveAnalyticsService.predictUserEngagement(userId, contentTypes);
      res.json({
        success: true,
        forecasts,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Engagement forecast error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate engagement forecasts',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
