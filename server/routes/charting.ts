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
        timeframe: timeframe as '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w',
        indicators: indicatorList,
        overlays: [] as string[]
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
