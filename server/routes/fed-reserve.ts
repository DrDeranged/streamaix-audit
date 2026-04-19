// ============================================================================
// FedReserve routes — extracted from server/routes.ts by
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

export async function registerFedReserveRoutes(app: Express): Promise<void> {
  // =============================================================================
  // FEDERAL RESERVE COMMUNICATION MONITORING ROUTES
  // =============================================================================

  // Get recent Federal Reserve communications
  app.get('/api/fed/communications', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string; // speech, statement, minutes, press_release, etc.
    
    try {
      console.log(`🏛️ Fetching Fed communications (limit: ${limit}, type: ${type || 'all'})`);
      let communications = await federalReserveService.getRecentCommunications(limit * 2); // Get more for filtering
      
      // Filter by type if specified
      if (type && type !== 'all') {
        communications = communications.filter(comm => comm.type === type);
      }
      
      // Limit results
      communications = communications.slice(0, limit);
      
      res.json({
        success: true,
        communications,
        count: communications.length,
        filters: { limit, type: type || 'all' },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed communications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed communications',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get Federal Reserve officials
  app.get('/api/fed/officials', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🏛️ Fetching Fed officials');
      const officials = federalReserveService.getFedOfficials();
      
      res.json({
        success: true,
        officials,
        count: officials.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed officials error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed officials',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get Federal Reserve policy alerts
  app.get('/api/fed/policy-alerts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const severity = req.query.severity as string; // low, medium, high, critical
    const active = req.query.active !== 'false'; // Default to active alerts only
    
    try {
      console.log(`🏛️ Fetching Fed policy alerts (severity: ${severity || 'all'}, active: ${active})`);
      let alerts = await federalReserveService.getPolicyAlerts();
      
      // Filter by severity if specified
      if (severity && severity !== 'all') {
        alerts = alerts.filter(alert => alert.severity === severity);
      }
      
      // Filter by active status
      if (active) {
        alerts = alerts.filter(alert => alert.isActive);
      }
      
      res.json({
        success: true,
        alerts,
        count: alerts.length,
        filters: { severity: severity || 'all', active },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed policy alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed policy alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get upcoming Federal Reserve calendar events
  app.get('/api/fed/calendar', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const eventType = req.query.eventType as string; // fomc_meeting, fed_speech, testimony, etc.
    
    try {
      console.log(`🏛️ Fetching Fed calendar events (limit: ${limit}, type: ${eventType || 'all'})`);
      let events = await federalReserveService.getUpcomingEvents(limit * 2);
      
      // Filter by event type if specified
      if (eventType && eventType !== 'all') {
        events = events.filter(event => event.eventType === eventType);
      }
      
      // Limit results
      events = events.slice(0, limit);
      
      res.json({
        success: true,
        events,
        count: events.length,
        filters: { limit, eventType: eventType || 'all' },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed calendar events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed calendar events',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get Federal Reserve sentiment trend analysis
  app.get('/api/fed/sentiment-trend', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    
    try {
      console.log(`🏛️ Fetching Fed sentiment trend (${days} days)`);
      const sentimentTrend = await federalReserveService.getSentimentTrend(days);
      
      res.json({
        success: true,
        sentimentTrend,
        count: sentimentTrend.length,
        timeframe: `${days} days`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed sentiment trend error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed sentiment trend',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get comprehensive Federal Reserve analytics summary
  app.get('/api/fed/analytics', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const timeframe = req.query.timeframe as '1d' | '7d' | '30d' | '90d' || '30d';
    
    try {
      console.log(`🏛️ Fetching Fed analytics summary (${timeframe})`);
      const summary = await federalReserveService.getAnalyticsSummary(timeframe);
      
      res.json({
        success: true,
        summary,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed analytics summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed analytics summary',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get Federal Reserve communication by ID
  app.get('/api/fed/communications/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      console.log(`🏛️ Fetching Fed communication: ${id}`);
      // Get recent communications and find the specific one
      const communications = await federalReserveService.getRecentCommunications(50);
      const communication = communications.find(comm => comm.id === id);
      
      if (!communication) {
        return res.status(404).json({
          success: false,
          error: 'Communication not found',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        communication,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed communication by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Fed communication',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Search Federal Reserve communications
  app.get('/api/fed/search', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      console.log(`🏛️ Searching Fed communications: "${query}"`);
      // Get recent communications and filter by search query
      const communications = await federalReserveService.getRecentCommunications(100);
      const lowerQuery = query.toLowerCase();
      
      const results = communications.filter(comm => 
        comm.title.toLowerCase().includes(lowerQuery) ||
        comm.description?.toLowerCase().includes(lowerQuery) ||
        comm.content.toLowerCase().includes(lowerQuery) ||
        comm.officialName.toLowerCase().includes(lowerQuery) ||
        comm.keyTopics.some(topic => topic.toLowerCase().includes(lowerQuery)) ||
        comm.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ).slice(0, limit);
      
      res.json({
        success: true,
        results,
        count: results.length,
        query,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Fed search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search Fed communications',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // PATTERN RECOGNITION AND TREND ANALYSIS ROUTES - Phase 3 Feature
  // =============================================================================

  // Get detected chart patterns for a specific symbol
  app.get('/api/patterns/detect/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '4h';
    
    console.log(`🎯 API Call: GET /api/patterns/detect/${symbol} - Timeframe: ${timeframe}`);
    
    try {
      const patterns = await patternRecognitionService.detectChartPatterns(symbol, timeframe);
      
      res.json({
        success: true,
        patterns,
        symbol,
        timeframe,
        count: patterns.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Pattern detection error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Pattern detection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get comprehensive pattern analysis for a symbol
  app.get('/api/patterns/analyze/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '4h';
    
    console.log(`📊 API Call: GET /api/patterns/analyze/${symbol} - Comprehensive analysis`);
    
    try {
      const analysis = await patternRecognitionService.analyzePatterns(symbol, timeframe);
      
      res.json({
        success: true,
        data: analysis,
        symbol,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Pattern analysis error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Pattern analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get trend analysis for a symbol
  app.get('/api/patterns/trend/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1d';
    
    console.log(`📈 API Call: GET /api/patterns/trend/${symbol} - Trend analysis`);
    
    try {
      const trendAnalysis = await patternRecognitionService.analyzeTrend(symbol, timeframe);
      
      res.json({
        success: true,
        data: trendAnalysis,
        symbol,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Trend analysis error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Trend analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get market cycle analysis for a symbol
  app.get('/api/patterns/cycles/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol?.toUpperCase();
    
    console.log(`🔄 API Call: GET /api/patterns/cycles/${symbol} - Market cycle analysis`);
    
    try {
      const cycleAnalysis = await patternRecognitionService.analyzeMarketCycles(symbol);
      
      res.json({
        success: true,
        data: cycleAnalysis,
        symbol,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Market cycle analysis error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Market cycle analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Generate AI trading setups for a symbol
  app.get('/api/patterns/setups/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol?.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '4h';
    const setupType = req.query.setupType as string;
    
    console.log(`🤖 API Call: GET /api/patterns/setups/${symbol} - AI trading setups`);
    
    try {
      const setups = await patternRecognitionService.generateTradingSetups(symbol, timeframe, setupType);
      
      res.json({
        success: true,
        setups,
        symbol,
        timeframe,
        setupType: setupType || 'all',
        count: setups.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Trading setup generation error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Trading setup generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Screen patterns across multiple assets
  app.post('/api/patterns/screen', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter = req.body || {};
    
    console.log('🔍 API Call: POST /api/patterns/screen - Pattern screening with filter:', filter);
    
    try {
      const screeningResults = await patternRecognitionService.screenPatterns(filter);
      
      res.json({
        success: true,
        data: screeningResults,
        filter,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern screening error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern screening failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get pattern alerts
  app.get('/api/patterns/alerts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.query.symbol as string;
    const severity = req.query.severity as string;
    const active = req.query.active !== 'false';
    
    console.log(`🔔 API Call: GET /api/patterns/alerts - Pattern alerts (active: ${active})`);
    
    try {
      const alerts = patternRecognitionService.getActiveAlerts();
      
      let filteredAlerts = alerts;
      
      if (symbol) {
        filteredAlerts = filteredAlerts.filter(alert => alert.symbol === symbol.toUpperCase());
      }
      
      if (severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
      }
      
      if (!active) {
        // Include resolved alerts from storage if not active-only
        const allStoredAlerts = await storage.getPatternAlerts({ 
          symbol: symbol?.toUpperCase(),
          severity,
          limit: 50 
        });
        filteredAlerts = allStoredAlerts;
      }
      
      res.json({
        success: true,
        alerts: filteredAlerts,
        count: filteredAlerts.length,
        filters: { symbol, severity, active },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern alerts retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Acknowledge a pattern alert
  app.post('/api/patterns/alerts/:alertId/acknowledge', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const alertId = req.params.alertId;
    
    console.log(`✅ API Call: POST /api/patterns/alerts/${alertId}/acknowledge`);
    
    try {
      const acknowledged = patternRecognitionService.acknowledgeAlert(alertId);
      
      if (acknowledged) {
        // Also update in storage
        await storage.acknowledgePatternAlert(alertId);
        
        res.json({
          success: true,
          message: 'Alert acknowledged successfully',
          alertId,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Alert not found',
          alertId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error(`Alert acknowledgment error for ${alertId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Alert acknowledgment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get pattern recognition dashboard data
  app.get('/api/patterns/dashboard', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    console.log('📊 API Call: GET /api/patterns/dashboard - Comprehensive dashboard');
    
    try {
      const dashboardData = await patternRecognitionService.getDashboard();
      
      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern dashboard generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get pattern recognition service configuration
  app.get('/api/patterns/config', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    console.log('⚙️ API Call: GET /api/patterns/config - Service configuration');
    
    try {
      const config = patternRecognitionService.getConfig();
      
      res.json({
        success: true,
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern config error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern configuration retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Update pattern recognition service configuration
  app.post('/api/patterns/config', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const configUpdates = req.body;
    
    console.log('⚙️ API Call: POST /api/patterns/config - Update configuration:', configUpdates);
    
    try {
      patternRecognitionService.updateConfig(configUpdates);
      const updatedConfig = patternRecognitionService.getConfig();
      
      res.json({
        success: true,
        config: updatedConfig,
        message: 'Configuration updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern config update error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern configuration update failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get historical pattern performance and backtesting data
  app.get('/api/patterns/backtest/:patternType', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const patternType = req.params.patternType;
    const symbol = req.query.symbol as string;
    const timeframe = (req.query.timeframe as string) || '1d';
    
    console.log(`📈 API Call: GET /api/patterns/backtest/${patternType} - Backtesting data`);
    
    try {
      // Mock backtest results - in production would use actual historical data
      const backtestResults = {
        patternType,
        symbol: symbol?.toUpperCase() || 'BTC',
        timeframe,
        totalPatterns: Math.floor(Math.random() * 100) + 50,
        successfulPatterns: Math.floor(Math.random() * 60) + 30,
        successRate: 0.65 + Math.random() * 0.2,
        averageReturn: (Math.random() - 0.5) * 15,
        averageHoldTime: Math.floor(Math.random() * 10) + 2,
        maxDrawdown: -(Math.random() * 25 + 5),
        sharpeRatio: Math.random() * 2 + 0.5,
        profitFactor: Math.random() * 2 + 1,
        winRate: 0.55 + Math.random() * 0.25,
        averageWin: Math.random() * 12 + 3,
        averageLoss: -(Math.random() * 8 + 2),
        largestWin: Math.random() * 25 + 10,
        largestLoss: -(Math.random() * 20 + 5),
        consecutiveWins: Math.floor(Math.random() * 8) + 2,
        consecutiveLosses: Math.floor(Math.random() * 5) + 1,
        monthlyReturns: Array.from({length: 12}, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
          returns: (Math.random() - 0.5) * 20,
          patterns: Math.floor(Math.random() * 15) + 5
        })),
        performanceByMarketRegime: {
          bull: { successRate: 0.75, avgReturn: 8.5, count: 25 },
          bear: { successRate: 0.45, avgReturn: -2.3, count: 15 },
          sideways: { successRate: 0.55, avgReturn: 1.2, count: 35 }
        }
      };
      
      res.json({
        success: true,
        data: backtestResults,
        patternType,
        symbol,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Pattern backtest error for ${patternType}:`, error);
      res.status(500).json({
        success: false,
        error: 'Pattern backtesting failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get pattern recognition summary for specific assets
  app.get('/api/patterns/summary', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string;
    const timeframe = (req.query.timeframe as string) || '4h';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const symbolList = symbols ? symbols.split(',').map(s => s.toUpperCase()) : ['BTC', 'ETH', 'SOL'];
    
    console.log(`📋 API Call: GET /api/patterns/summary - Symbols: ${symbolList.join(', ')}`);
    
    try {
      const summaryPromises = symbolList.slice(0, limit).map(async (symbol) => {
        try {
          const [patterns, trendAnalysis] = await Promise.all([
            patternRecognitionService.detectChartPatterns(symbol, timeframe),
            patternRecognitionService.analyzeTrend(symbol, timeframe)
          ]);
          
          return {
            symbol,
            patternCount: patterns.length,
            highConfidencePatterns: patterns.filter(p => (p.confidence || 0) > 0.8).length,
            averageConfidence: patterns.length > 0 ? 
              patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patterns.length : 0,
            dominantPatternType: patterns.length > 0 ? 
              patterns.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0].patternType : null,
            trendDirection: trendAnalysis.primaryTrend.direction,
            trendStrength: trendAnalysis.primaryTrend.strength,
            riskLevel: trendAnalysis.primaryTrend.strength > 80 ? 'low' : 
                      trendAnalysis.primaryTrend.strength > 50 ? 'medium' : 'high'
          };
        } catch (error) {
          console.warn(`Summary failed for ${symbol}:`, error);
          return {
            symbol,
            patternCount: 0,
            highConfidencePatterns: 0,
            averageConfidence: 0,
            dominantPatternType: null,
            trendDirection: 'sideways' as const,
            trendStrength: 50,
            riskLevel: 'medium' as const,
            error: 'Analysis failed'
          };
        }
      });
      
      const summaryResults = await Promise.all(summaryPromises);
      
      res.json({
        success: true,
        data: {
          summaries: summaryResults,
          overview: {
            totalSymbols: symbolList.length,
            avgPatternCount: Math.round(summaryResults.reduce((sum, s) => sum + s.patternCount, 0) / summaryResults.length),
            avgConfidence: Math.round(summaryResults.reduce((sum, s) => sum + s.averageConfidence, 0) / summaryResults.length * 100) / 100,
            bullishCount: summaryResults.filter(s => s.trendDirection === 'bullish').length,
            bearishCount: summaryResults.filter(s => s.trendDirection === 'bearish').length,
            neutralCount: summaryResults.filter(s => s.trendDirection === 'sideways').length
          }
        },
        symbols: symbolList,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Pattern summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Pattern summary generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // SOCIAL ACTION ROUTES (Protected)
  // =============================================================================

  // Follow user (Demo - works without authentication)
  app.post('/api/social/follow', authenticateToken, mediumLimit, validateBody(followBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fid, username } = req.body;
    try {
      // For now, simulate successful follow - in real implementation would use Farcaster API
      console.log(`Demo user following ${username} (FID: ${fid})`);
      
      // Simulate follow action
      res.json({
        success: true,
        message: `Successfully followed @${username}`,
        action: 'follow',
        targetUser: { fid, username },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Follow error:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }));

  // Like cast (Demo - works without authentication)
  app.post('/api/social/like', authenticateToken, mediumLimit, validateBody(castActionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash } = req.body;
    try {
      // For now, simulate successful like - in real implementation would use Farcaster API
      console.log(`Demo user liking cast ${castHash}`);
      
      res.json({
        success: true,
        message: 'Successfully liked cast',
        action: 'like',
        castHash,
        newLikeCount: Math.floor(Math.random() * 100) + 50, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({ error: 'Failed to like cast' });
    }
  }));

  // Recast (Demo - works without authentication)
  app.post('/api/social/recast', authenticateToken, mediumLimit, validateBody(castActionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash } = req.body;
    try {
      console.log(`Demo user recasting ${castHash}`);
      
      res.json({
        success: true,
        message: 'Successfully recasted',
        action: 'recast',
        castHash,
        newRecastCount: Math.floor(Math.random() * 50) + 20, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Recast error:', error);
      res.status(500).json({ error: 'Failed to recast' });
    }
  }));

  // Reply to cast (Demo - works without authentication)
  app.post('/api/social/reply', authenticateToken, mediumLimit, validateBody(replyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash, replyText } = req.body;
    try {
      console.log(`Demo user replying to cast ${castHash}: ${replyText.substring(0, 50)}...`);
      
      res.json({
        success: true,
        message: 'Reply posted successfully',
        action: 'reply',
        castHash,
        replyText,
        newReplyCount: Math.floor(Math.random() * 30) + 10, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Reply error:', error);
      res.status(500).json({ error: 'Failed to post reply' });
    }
  }));

  // =============================================================================
  // CONVERSATIONS ROUTES (Social Platform)
  // =============================================================================

  // Get conversations feed with trending/for-you/following tabs
  app.get('/api/conversations', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tab = 'trending', topic, limit = '20', offset = '0' } = req.query;
    
    try {
      const conversations = await storage.getConversationsFeed({
        tab: tab as 'trending' | 'for-you' | 'following',
        topic: topic as string | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        userId: req.user?.id
      });
      
      res.json({
        success: true,
        conversations,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: conversations.length === parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Get conversations feed error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }));

  // Get comments for an entity (embedded comments)
  app.get('/api/conversations/comments', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { linkedSummaryId, linkedMarketId, linkedBountyId, limit = '50', offset = '0' } = req.query;
    
    try {
      const conversations = await storage.getConversationsForEntity({
        linkedSummaryId: linkedSummaryId as string | undefined,
        linkedMarketId: linkedMarketId as string | undefined,
        linkedBountyId: linkedBountyId as string | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        userId: req.user?.id
      });
      
      res.json(conversations);
    } catch (error) {
      console.error('Get entity comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }));

  // Create new conversation (or comment)
  app.post('/api/conversations', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { content, imageUrl, tags, linkedSummaryId, linkedMarketId, linkedBountyId, parentId, isPublic } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content must be less than 5000 characters' });
    }
    
    try {
      const conversation = await storage.createConversation({
        authorId: req.user.id,
        content: content.trim(),
        imageUrl,
        tags: tags || [],
        linkedSummaryId,
        linkedMarketId,
        linkedBountyId,
        parentId,
        isPublic: isPublic !== false
      });
      
      res.status(201).json({
        success: true,
        conversation
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  }));

  // Get single conversation with comments
  app.get('/api/conversations/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      const conversation = await storage.getConversationById(id, req.user?.id);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json({
        success: true,
        conversation
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }));

  // Update conversation
  app.put('/api/conversations/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { content, tags, isPublic, isPinned } = req.body;
    
    try {
      const conversation = await storage.updateConversation(id, req.user.id, {
        content,
        tags,
        isPublic,
        isPinned
      });
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }
      
      res.json({
        success: true,
        conversation
      });
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  }));

  // Delete conversation
  app.delete('/api/conversations/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    try {
      const success = await storage.deleteConversation(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Conversation not found or unauthorized' });
      }
      
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }));

  // Like/unlike conversation
  app.post('/api/conversations/:id/like', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    try {
      const result = await storage.toggleConversationLike(id, req.user.id);
      
      res.json({
        success: true,
        liked: result.liked,
        likesCount: result.likesCount
      });
    } catch (error) {
      console.error('Like conversation error:', error);
      res.status(500).json({ error: 'Failed to like conversation' });
    }
  }));

  // Comment on conversation
  app.post('/api/conversations/:id/comment', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }
    
    try {
      const comment = await storage.createConversationComment({
        conversationId: id,
        userId: req.user.id,
        content: content.trim(),
        parentCommentId
      });
      
      res.status(201).json({
        success: true,
        comment
      });
    } catch (error) {
      console.error('Comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }));

  // Share conversation
  app.post('/api/conversations/:id/share', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { platform = 'internal' } = req.body;
    
    try {
      await storage.createConversationShare({
        conversationId: id,
        userId: req.user.id,
        platform
      });
      
      res.json({
        success: true,
        message: 'Conversation shared successfully'
      });
    } catch (error) {
      console.error('Share conversation error:', error);
      res.status(500).json({ error: 'Failed to share conversation' });
    }
  }));

  // =============================================================================
  // ADMIN ROUTES (Protected)
  // =============================================================================

  // NOTE: Comprehensive /api/admin/stats endpoint is defined below in ADMIN DASHBOARD ENDPOINTS section
  // Admin middleware (`requireAdmin`) is defined at module scope above and shared across all admin routes.

  // Error handling middleware
  app.use((error: any, req: Request, res: Response, next: Function) => {
    // Log full error details on server
    console.error('=== API Error ===');
    console.error('URL:', req.method, req.path);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('================');
    
    // Determine user-friendly error message
    let userMessage = 'Something went wrong. Please try again.';
    
    // Provide specific messages for common errors
    if (error.message?.includes('OpenAI')) {
      userMessage = 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      userMessage = 'Service is experiencing high demand. Please try again in a few moments.';
    } else if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      userMessage = 'Network connection issue. Please check your connection and try again.';
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    } else if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      userMessage = 'Authentication required. Please log in and try again.';
    } else if (process.env.NODE_ENV === 'development') {
      userMessage = error.message;
    }
    
    res.status(error.status || 500).json({
      error: 'Internal server error',
      message: userMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

}
