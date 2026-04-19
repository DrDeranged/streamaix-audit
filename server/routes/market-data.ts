// ============================================================================
// MarketData routes — extracted from server/routes.ts by
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

export async function registerMarketDataRoutes(app: Express): Promise<void> {
  // =============================================================================
  // MARKET DATA ROUTES 
  // =============================================================================

  // Get live crypto prices (CoinGecko + CoinMarketCap)
  app.get('/api/market/crypto/:symbols', asyncHandler(async (req: Request, res: Response) => {
    const symbols = req.params.symbols.split(',');
    const marketData = MarketDataService.getInstance();
    
    try {
      const quotes = await marketData.getCryptoQuotes(symbols);
      res.json({ quotes, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Market data error:', error);
      res.json({ quotes: [], error: 'Market data unavailable', timestamp: new Date().toISOString() });
    }
  }));

  // Get crypto-related stocks
  app.get('/api/market/stocks/crypto', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const stocks = await marketData.getCryptoStocks();
      res.json({ 
        stocks, 
        count: stocks.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Crypto stocks error:', error);
      res.json({ 
        stocks: [], 
        error: 'Stock data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get financial news from CoinDesk
  app.get('/api/market/news', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const marketData = MarketDataService.getInstance();
    
    try {
      const articles = await marketData.getFinancialNews(limit);
      res.json({ 
        articles, 
        count: articles.length,
        source: 'CoinDesk',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('News data error:', error);
      res.json({ 
        articles: [], 
        error: 'News data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // =============================================================================
  // MARKET EVENT MODELING ROUTES - Phase 3 Feature
  // =============================================================================

  // Get comprehensive event modeling dashboard
  app.get('/api/events/dashboard', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d' | '90d') || '7d';
    
    console.log(`📊 API Call: GET /api/events/dashboard - Timeframe: ${timeframe}`);
    
    try {
      const dashboard = await marketEventModelingService.getEventModelingDashboard(timeframe);
      
      res.json({
        success: true,
        data: dashboard,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Event modeling dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load event modeling dashboard',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get upcoming market events with impact analysis
  app.get('/api/events/upcoming', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d' | '90d') || '7d';
    const impact = req.query.impact as 'low' | 'medium' | 'high' | 'critical';
    const category = req.query.category as string;
    
    console.log(`📅 API Call: GET /api/events/upcoming - Timeframe: ${timeframe}, Impact: ${impact || 'all'}, Category: ${category || 'all'}`);
    
    try {
      let events = await marketEventModelingService.getUpcomingEvents(timeframe);
      
      // Apply filters
      if (impact) {
        events = events.filter(event => event.impact === impact);
      }
      
      if (category) {
        events = events.filter(event => event.category === category);
      }
      
      res.json({
        success: true,
        events,
        count: events.length,
        filters: { timeframe, impact: impact || 'all', category: category || 'all' },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Upcoming events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming events',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Generate ML-powered event impact predictions
  app.post('/api/events/:eventId/predictions', authenticateToken, mediumLimit, validateBody(forceRefreshSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.params;
    const { forceRefresh = false } = req.body;
    
    console.log(`🤖 API Call: POST /api/events/${eventId}/predictions - Force Refresh: ${forceRefresh}`);
    
    try {
      const predictions = await marketEventModelingService.generateEventPredictions(eventId);
      
      if (predictions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No predictions generated for this event',
          eventId,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        predictions,
        eventId,
        count: predictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Event prediction error for ${eventId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate event predictions',
        eventId,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get historical impact analysis for event types
  app.get('/api/events/historical/:eventType', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const { eventType } = req.params;
    const timeWindow = (req.query.timeWindow as '1y' | '2y' | '5y') || '2y';
    
    console.log(`📈 API Call: GET /api/events/historical/${eventType} - Time Window: ${timeWindow}`);
    
    try {
      const analysis = await marketEventModelingService.analyzeHistoricalImpacts(eventType, timeWindow);
      
      res.json({
        success: true,
        analysis,
        eventType,
        timeWindow,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Historical analysis error for ${eventType}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze historical event impacts',
        eventType,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Generate trading signals based on event predictions
  app.post('/api/events/:eventId/signals', authenticateToken, mediumLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.params;
    const { predictionId, minConfidence = 60, maxSignals = 10 } = req.body;
    
    console.log(`📊 API Call: POST /api/events/${eventId}/signals - Prediction: ${predictionId || 'all'}, Min Confidence: ${minConfidence}%`);
    
    try {
      let signals = await marketEventModelingService.generateTradingSignals(eventId, predictionId);
      
      // Apply filters
      signals = signals
        .filter(signal => signal.confidence >= minConfidence)
        .slice(0, maxSignals);
      
      if (signals.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No high-quality trading signals generated',
          eventId,
          filters: { minConfidence, maxSignals },
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        signals,
        eventId,
        count: signals.length,
        filters: { minConfidence, maxSignals },
        averageConfidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Trading signals error for ${eventId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate trading signals',
        eventId,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get market event alerts and monitoring
  app.get('/api/events/alerts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const severity = req.query.severity as 'info' | 'low' | 'medium' | 'high' | 'critical';
    const alertType = req.query.alertType as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    console.log(`🚨 API Call: GET /api/events/alerts - Severity: ${severity || 'all'}, Type: ${alertType || 'all'}, Limit: ${limit}`);
    
    try {
      // This would typically query active alerts from the service
      const alerts = []; // Placeholder - would get from marketEventModelingService.getActiveAlerts()
      
      res.json({
        success: true,
        alerts,
        count: alerts.length,
        filters: { severity: severity || 'all', alertType: alertType || 'all', limit },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Event alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event alerts',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get event impact summary for specific assets
  app.get('/api/events/impact/:symbol', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d' | '90d') || '7d';
    const assetType = (req.query.assetType as 'crypto' | 'stock' | 'commodity' | 'currency') || 'crypto';
    
    console.log(`🎯 API Call: GET /api/events/impact/${symbol} - Timeframe: ${timeframe}, Asset Type: ${assetType}`);
    
    try {
      // Get upcoming events that affect this asset
      const allEvents = await marketEventModelingService.getUpcomingEvents(timeframe);
      const relevantEvents = allEvents.filter(event => 
        event.affectedAssets.includes(symbol.toUpperCase()) ||
        event.primaryAsset === symbol.toUpperCase() ||
        event.assetTypes.includes(assetType)
      );
      
      // Get predictions for relevant events
      const eventImpacts = [];
      for (const event of relevantEvents.slice(0, 5)) {
        try {
          const predictions = await marketEventModelingService.generateEventPredictions(event.id);
          const assetPredictions = predictions.flatMap(p => 
            p.assetPredictions.filter(ap => ap.symbol === symbol.toUpperCase())
          );
          
          if (assetPredictions.length > 0) {
            eventImpacts.push({
              event,
              predictions: assetPredictions,
              averageImpact: assetPredictions.reduce((sum, p) => sum + p.predictedMove, 0) / assetPredictions.length,
              confidence: assetPredictions.reduce((sum, p) => sum + p.confidence, 0) / assetPredictions.length
            });
          }
        } catch (error) {
          console.warn(`Failed to get predictions for event ${event.id}:`, error);
        }
      }
      
      res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        assetType,
        timeframe,
        relevantEvents: relevantEvents.length,
        eventImpacts,
        riskLevel: eventImpacts.length > 0 ? 
          eventImpacts.reduce((sum, ei) => sum + Math.abs(ei.averageImpact), 0) / eventImpacts.length : 0,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Event impact analysis error for ${symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze event impacts for asset',
        symbol,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get model performance and status
  app.get('/api/events/models/status', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
    console.log('🔧 API Call: GET /api/events/models/status');
    
    try {
      // Mock model status - in production this would come from the service
      const modelStatus = {
        totalModels: 5,
        activeModels: 5,
        averageAccuracy: 73.2,
        lastRetrained: new Date().toISOString(),
        recentPredictions: 156,
        predictionAccuracy: 71.8,
        modelsHealth: [
          { id: 'fomc_impact_v2', name: 'FOMC Impact Predictor', accuracy: 72.3, status: 'active', lastTrained: new Date().toISOString() },
          { id: 'earnings_impact_v1', name: 'Earnings Reaction Predictor', accuracy: 76.4, status: 'active', lastTrained: new Date().toISOString() },
          { id: 'crypto_event_v3', name: 'Crypto Event Impact Model', accuracy: 79.6, status: 'active', lastTrained: new Date().toISOString() },
          { id: 'volatility_predictor_v1', name: 'Event Volatility Predictor', accuracy: 68.2, status: 'active', lastTrained: new Date().toISOString() },
          { id: 'correlation_shift_v1', name: 'Correlation Shift Predictor', accuracy: 71.8, status: 'active', lastTrained: new Date().toISOString() }
        ]
      };
      
      res.json({
        success: true,
        modelStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Model status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get model status',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
