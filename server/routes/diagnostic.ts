// ============================================================================
// Diagnostic routes — extracted from server/routes.ts by
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
  emptyBodySchema,
  addToWatchlistSchema,
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

export async function registerDiagnosticRoutes(app: Express): Promise<void> {
  // =============================================================================
  // DIAGNOSTIC ENDPOINTS
  // =============================================================================
  
  // Enhanced health check with avatar count for production debugging
  // AI Trading Signals endpoint
  app.get('/api/ai-trading-signals', asyncHandler(async (req: Request, res: Response) => {
    try {
      const signals = await aiTradingSignalsService.getAllSignals();
      res.json({ success: true, signals });
    } catch (error: any) {
      console.error('AI Trading Signals error:', error);
      res.json({ success: false, signals: [], error: error.message });
    }
  }));

  app.get('/api/ai-trading-signals/:symbol', asyncHandler(async (req: Request, res: Response) => {
    try {
      const signal = await aiTradingSignalsService.getSignalForAsset(req.params.symbol);
      if (!signal) {
        return res.status(404).json({ success: false, error: 'Asset not found' });
      }
      res.json({ success: true, signal });
    } catch (error: any) {
      console.error('AI Trading Signal error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Crypto Search endpoint
  app.get('/api/crypto-search', asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ success: true, results: [] });
      }
      const results = await aiTradingSignalsService.searchCryptoAssets(query);
      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Crypto search error:', error);
      res.json({ success: false, results: [], error: error.message });
    }
  }));

  // Combined Asset Search (crypto + stocks)
  app.get('/api/asset-search', asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ success: true, crypto: [], stocks: [] });
      }
      
      const [cryptoResults, stockResults] = await Promise.all([
        aiTradingSignalsService.searchCryptoAssets(query),
        aiTradingSignalsService.searchStocks(query),
      ]);
      
      res.json({ 
        success: true, 
        crypto: cryptoResults,
        stocks: stockResults,
      });
    } catch (error: any) {
      console.error('Asset search error:', error);
      res.json({ success: false, crypto: [], stocks: [], error: error.message });
    }
  }));

  // Custom Watchlist endpoints
  app.get('/api/trading-watchlist', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const items = await storage.getUserWatchlist(userId);
      res.json({ success: true, items });
    } catch (error: any) {
      console.error('Get watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  app.post('/api/trading-watchlist', authenticateToken, validateBody(addToWatchlistSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const { symbol, assetName, assetType, coingeckoId, notes } = req.body;
      if (!symbol || !assetName || !assetType) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      
      const count = await storage.getWatchlistCount(userId);
      if (count >= 5) {
        return res.status(400).json({ success: false, error: 'Maximum 5 assets allowed in watchlist' });
      }
      
      const exists = await storage.isInWatchlist(userId, symbol);
      if (exists) {
        return res.status(400).json({ success: false, error: 'Asset already in watchlist' });
      }
      
      const item = await storage.addToWatchlist({
        userId,
        symbol,
        assetName,
        assetType,
        coingeckoId,
        notes,
      });
      res.json({ success: true, item });
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  app.delete('/api/trading-watchlist/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      await storage.removeFromWatchlist(userId, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Platform default starter set — shown when a user has no personal watchlist items.
  // Never written to the database; always computed on demand.
  const PLATFORM_DEFAULT_ASSETS: Array<{
    symbol: string;
    assetName: string;
    assetType: 'crypto' | 'stock';
    coingeckoId: string | null;
  }> = [
    { symbol: 'BTC',  assetName: 'Bitcoin',  assetType: 'crypto', coingeckoId: 'bitcoin'  },
    { symbol: 'ETH',  assetName: 'Ethereum', assetType: 'crypto', coingeckoId: 'ethereum' },
    { symbol: 'SOL',  assetName: 'Solana',   assetType: 'crypto', coingeckoId: 'solana'   },
    { symbol: 'NVDA', assetName: 'NVIDIA',   assetType: 'stock',  coingeckoId: null        },
    { symbol: 'AMD',  assetName: 'AMD',      assetType: 'stock',  coingeckoId: null        },
    { symbol: 'MSFT', assetName: 'Microsoft',assetType: 'stock',  coingeckoId: null        },
  ];

  app.get('/api/trading-watchlist/signals', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const items = await storage.getUserWatchlist(userId);

      // When the personal watchlist is empty, fall back to the computed platform
      // defaults. These are never written to the database — isDefault: true tells
      // the client to show the "Starter watchlist — customize" affordance.
      const sourceItems = items.length > 0
        ? items.map(i => ({ ...i, isDefault: false }))
        : PLATFORM_DEFAULT_ASSETS.map(a => ({ ...a, id: '', isDefault: true, createdAt: new Date() }));
      const isDefaultSet = items.length === 0;

      const signals = [];
      
      for (const item of sourceItems) {
        if (item.assetType === 'stock') {
          const signal = await aiTradingSignalsService.getSignalForCustomStock(
            item.symbol,
            item.assetName
          );
          if (signal) {
            signals.push({ ...signal, watchlistId: item.id, isDefault: item.isDefault });
          }
        } else if (item.coingeckoId) {
          const signal = await aiTradingSignalsService.getSignalForCustomAsset(
            item.coingeckoId,
            item.symbol,
            item.assetName
          );
          if (signal) {
            signals.push({ ...signal, watchlistId: item.id, isDefault: item.isDefault });
          }
        }
      }
      
      res.json({ success: true, signals, isDefault: isDefaultSet });
    } catch (error: any) {
      console.error('Get watchlist signals error:', error);
      res.status(500).json({ success: false, signals: [], error: error.message });
    }
  }));

  console.log('📍 Registering health check endpoint: GET /api/health');
  app.get('/api/health', asyncHandler(async (req: Request, res: Response) => {
    console.log('✅ Health check endpoint hit!');
    
    // Get avatar count from database
    let avatarCount = 0;
    let avatarNames: string[] = [];
    try {
      const avatars = await db.select({ id: knowledgeAvatars.id, name: knowledgeAvatars.name }).from(knowledgeAvatars);
      avatarCount = avatars.length;
      avatarNames = avatars.map(a => a.name).slice(0, 10); // First 10 for preview
    } catch (err: any) {
      console.error('Health check DB error:', err.message);
    }
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      database: {
        avatarCount,
        avatarPreview: avatarNames,
        hasAvatars: avatarCount > 0
      },
      flags: {
        quietMode: process.env.QUIET_MODE === 'true',
        anthropicPaused: process.env.PAUSE_ANTHROPIC_API === 'true',
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
      }
    });
  }));
  console.log('✅ Health check endpoint registered');
  
  // CRITICAL: Diagnostic probe endpoint - NO asyncHandler wrapper
  // This endpoint's unique name proves which code version is running
  console.log('📍 Registering diagnostic-probe-v2 endpoint: GET /api/diagnostic-probe-v2');
  app.get('/api/diagnostic-probe-v2', (req: Request, res: Response) => {
    console.log('🔍 DIAGNOSTIC PROBE V2 HIT!');
    const buildInfo = {
      success: true,
      probeVersion: 'v2.0.0',
      serverVersion: res.getHeader('X-Server-Version'),
      buildTime: res.getHeader('X-Server-Build-Time'),
      nodeEnv: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      uptime: process.uptime(),
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      routesThatExist: [
        '/api/health',
        '/api/diagnostic-probe-v2',
        '/api/test-post-simple',
        '/api/test-post-echo',
        '/api/analyze-content'
      ]
    };
    res.status(200).json(buildInfo);
  });
  console.log('✅ Diagnostic probe V2 registered');
  
  // CRITICAL: Simple POST test - NO asyncHandler, NO dependencies
  console.log('📍 Registering test-post-simple endpoint: POST /api/test-post-simple');
  app.post('/api/test-post-simple', disableInProd, (req: Request, res: Response) => {
    console.log('✅ SIMPLE POST TEST HIT!');
    res.status(200).json({
      success: true,
      message: 'Simple POST endpoint working',
      timestamp: new Date().toISOString(),
      receivedBody: !!req.body,
      bodyKeys: Object.keys(req.body || {})
    });
  });
  console.log('✅ Simple POST test registered');
  
  // CRITICAL: Echo POST test - Returns exactly what it receives
  console.log('📍 Registering test-post-echo endpoint: POST /api/test-post-echo');
  app.post('/api/test-post-echo', disableInProd, (req: Request, res: Response) => {
    console.log('✅ ECHO POST TEST HIT with body:', req.body);
    res.status(200).json({
      success: true,
      message: 'Echo endpoint working',
      timestamp: new Date().toISOString(),
      youSent: req.body,
      contentType: req.get('content-type'),
      method: req.method
    });
  });
  console.log('✅ Echo POST test registered');
  
  // =============================================================================
  // ADMIN ENDPOINTS - Reseed avatars in production
  // =============================================================================
  
  // Admin reseed endpoint - requires admin auth or secret key
  console.log('📍 Registering admin reseed endpoint: POST /api/admin/reseed');
  app.post('/api/admin/reseed', authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('🔄 Admin reseed endpoint hit!');
    // Import and run auto-seed
    try {
      const { autoSeedDatabase } = await import('../auto-seed');
      
      console.log('🌱 Starting manual reseed...');
      const startTime = Date.now();
      await autoSeedDatabase();
      const duration = Date.now() - startTime;
      
      // Get new avatar count
      const avatars = await db.select({ id: knowledgeAvatars.id, name: knowledgeAvatars.name }).from(knowledgeAvatars);
      
      console.log(`✅ Reseed completed in ${duration}ms. ${avatars.length} avatars now in database.`);
      
      res.status(200).json({
        success: true,
        message: 'Database reseeded successfully',
        duration: `${duration}ms`,
        avatarCount: avatars.length,
        avatarNames: avatars.map(a => a.name)
      });
    } catch (error: any) {
      console.error('❌ Reseed failed:', error.message);
      res.status(500).json({
        success: false,
        error: 'Reseed failed',
        message: error.message
      });
    }
  }));
  console.log('✅ Admin reseed endpoint registered');

  
}
