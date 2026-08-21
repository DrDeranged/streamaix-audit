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

  // NOTE: /api/crypto-search, /api/asset-search, and all /api/trading-watchlist/*
  // routes have been moved to server/routes/trading-watchlist.ts.

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
