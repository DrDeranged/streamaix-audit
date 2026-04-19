// ============================================================================
// Charting routes — extracted from server/routes.ts by
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

export async function registerChartingRoutes(app: Express): Promise<void> {
  // =============================================================================
  // CHARTING ROUTES
  // =============================================================================

  // Get chart data with technical indicators for a single asset
  app.get('/api/charts/data/:symbol', asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { 
      timeframe = '1d', 
      assetType = 'crypto', 
      indicators = 'rsi,macd,movingAverages' 
    } = req.query;

    try {
      const indicatorList = (indicators as string).split(',').filter(Boolean);
      
      const chartConfig = {
        symbol: symbol.toUpperCase(),
        assetType: assetType as 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency',
        timeframe: timeframe as string,
        indicators: indicatorList,
        overlays: []
      };

      const chartData = await chartingService.getChartData(chartConfig);
      
      if (!chartData) {
        return res.status(404).json({
          success: false,
          error: `No chart data available for ${symbol}`,
          symbol,
          timeframe,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: chartData,
        symbol: symbol.toUpperCase(),
        timeframe,
        indicators: indicatorList,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Chart data error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart data',
        symbol,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get multi-asset comparison chart data
  app.post('/api/charts/compare', asyncHandler(async (req: Request, res: Response) => {
    const { primarySymbol, comparisonSymbols = [], timeframe = '1d', assetTypes = {} } = req.body;

    if (!primarySymbol) {
      return res.status(400).json({
        success: false,
        error: 'Primary symbol is required'
      });
    }

    try {
      const chartData = await chartingService.getMultiAssetChartData(
        primarySymbol.toUpperCase(),
        comparisonSymbols.map((s: string) => s.toUpperCase()),
        timeframe,
        assetTypes
      );

      if (!chartData) {
        return res.status(404).json({
          success: false,
          error: `No chart data available for comparison`,
          primarySymbol,
          comparisonSymbols,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: chartData,
        primarySymbol: primarySymbol.toUpperCase(),
        comparisonSymbols: comparisonSymbols.map((s: string) => s.toUpperCase()),
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Multi-asset chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch multi-asset chart data',
        primarySymbol,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get available timeframes and indicators
  app.get('/api/charts/metadata', asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          timeframes: chartingService.getAvailableTimeframes(),
          indicators: chartingService.getAvailableIndicators(),
          assetTypes: chartingService.getSupportedAssetTypes()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Chart metadata error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart metadata',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Chart configurations management (requires authentication)
  app.get('/api/charts/configurations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const configurations = await storage.getChartConfigurations?.(req.user!.id) || [];
      res.json({
        success: true,
        data: configurations,
        count: configurations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Chart configurations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart configurations',
        timestamp: new Date().toISOString()
      });
    }
  }));

  app.post('/api/charts/configurations', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, symbols, assetTypes, timeframe, indicators, overlays, layout, tags } = req.body;

    if (!name || !symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name and symbols array are required'
      });
    }

    try {
      const configuration = await storage.createChartConfiguration?.({
        userId: req.user!.id,
        name,
        symbols: symbols.map((s: string) => s.toUpperCase()),
        assetTypes: assetTypes || {},
        timeframe: timeframe || '1d',
        indicators: indicators || [],
        overlays: overlays || [],
        layout: layout || null,
        isDefault: false,
        isPublic: false,
        tags: tags || []
      });

      res.status(201).json({
        success: true,
        data: configuration,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Create chart configuration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chart configuration',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Chart watchlists management
  app.get('/api/charts/watchlists', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const watchlists = await storage.getChartWatchlists?.(req.user!.id) || [];
      res.json({
        success: true,
        data: watchlists,
        count: watchlists.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Chart watchlists error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart watchlists',
        timestamp: new Date().toISOString()
      });
    }
  }));

  app.post('/api/charts/watchlists', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, symbols, assetTypes, color, alertsEnabled, alertConditions } = req.body;

    if (!name || !symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name and symbols array are required'
      });
    }

    try {
      const watchlist = await storage.createChartWatchlist?.({
        userId: req.user!.id,
        name,
        symbols: symbols.map((s: string) => s.toUpperCase()),
        assetTypes: assetTypes || {},
        color: color || null,
        isDefault: false,
        sortOrder: 0,
        alertsEnabled: alertsEnabled || false,
        alertConditions: alertConditions || null
      });

      res.status(201).json({
        success: true,
        data: watchlist,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Create chart watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chart watchlist',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Chart user preferences
  app.get('/api/charts/preferences', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const preferences = await storage.getChartUserPreferences?.(req.user!.id);
      res.json({
        success: true,
        data: preferences || {
          defaultTimeframe: '1d',
          defaultIndicators: ['rsi', 'macd', 'movingAverages'],
          theme: 'dark',
          candlestickStyle: 'candles',
          volumeVisible: true,
          gridVisible: true,
          crosshairEnabled: true,
          autoSync: true,
          realTimeUpdates: true,
          alertsEnabled: true,
          favoriteSymbols: [],
          recentSymbols: []
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Chart preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart preferences',
        timestamp: new Date().toISOString()
      });
    }
  }));

  app.put('/api/charts/preferences', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const preferences = await storage.updateChartUserPreferences?.(req.user!.id, req.body);
      res.json({
        success: true,
        data: preferences,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Update chart preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update chart preferences',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get popular trading pairs for quick access
  app.get('/api/charts/popular-pairs', asyncHandler(async (req: Request, res: Response) => {
    try {
      const popularPairs = {
        crypto: [
          { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
          { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
          { symbol: 'SOL', name: 'Solana', type: 'crypto' },
          { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
          { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
          { symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
          { symbol: 'LINK', name: 'Chainlink', type: 'crypto' },
          { symbol: 'UNI', name: 'Uniswap', type: 'crypto' }
        ],
        stocks: [
          { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
          { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
          { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
          { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
          { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock' }
        ],
        cryptoStocks: [
          { symbol: 'MSTR', name: 'MicroStrategy', type: 'stock' },
          { symbol: 'COIN', name: 'Coinbase', type: 'stock' },
          { symbol: 'RIOT', name: 'Riot Platforms', type: 'stock' },
          { symbol: 'MARA', name: 'Marathon Digital', type: 'stock' }
        ]
      };

      res.json({
        success: true,
        data: popularPairs,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Popular pairs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular pairs',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
