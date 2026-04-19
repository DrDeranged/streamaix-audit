// ============================================================================
// EconomicCalendar routes — extracted from server/routes.ts by
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

export async function registerEconomicCalendarRoutes(app: Express): Promise<void> {
  // =============================================================================
  // ECONOMIC CALENDAR ROUTES
  // =============================================================================

  // Get economic calendar events with optional filtering
  app.get('/api/market/economic-calendar', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    // Parse query parameters for filtering
    const filter: any = {};
    
    if (req.query.timeRange) {
      filter.timeRange = req.query.timeRange as string;
    } else {
      filter.timeRange = '30d'; // Default to 30 days
    }
    
    if (req.query.impact) {
      const impacts = typeof req.query.impact === 'string' 
        ? [req.query.impact] 
        : req.query.impact as string[];
      filter.impact = impacts;
    }
    
    if (req.query.eventTypes) {
      const types = typeof req.query.eventTypes === 'string'
        ? [req.query.eventTypes]
        : req.query.eventTypes as string[];
      filter.eventTypes = types;
    }
    
    if (req.query.countries) {
      const countries = typeof req.query.countries === 'string'
        ? [req.query.countries]
        : req.query.countries as string[];
      filter.countries = countries;
    }
    
    if (req.query.onlyUpcoming === 'true') {
      filter.onlyUpcoming = true;
    }
    
    try {
      const events = await marketData.getEconomicCalendar(filter);
      res.json({ 
        events, 
        count: events.length,
        filter,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Economic calendar error:', error);
      res.json({ 
        events: [], 
        error: 'Economic calendar data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get upcoming FOMC meetings specifically
  app.get('/api/market/fomc-meetings', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const events = await marketData.getFOMCMeetings();
      res.json({ 
        events, 
        count: events.length,
        source: 'Federal Reserve',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('FOMC meetings error:', error);
      res.json({ 
        events: [], 
        error: 'FOMC meeting data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get inflation events (CPI releases)
  app.get('/api/market/inflation-events', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const events = await marketData.getInflationEvents();
      res.json({ 
        events, 
        count: events.length,
        source: 'Bureau of Labor Statistics',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Inflation events error:', error);
      res.json({ 
        events: [], 
        error: 'Inflation data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get employment events
  app.get('/api/market/employment-events', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const events = await marketData.getEmploymentEvents();
      res.json({ 
        events, 
        count: events.length,
        source: 'Bureau of Labor Statistics',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Employment events error:', error);
      res.json({ 
        events: [], 
        error: 'Employment data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get GDP events
  app.get('/api/market/gdp-events', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const events = await marketData.getGDPEvents();
      res.json({ 
        events, 
        count: events.length,
        source: 'Bureau of Economic Analysis',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('GDP events error:', error);
      res.json({ 
        events: [], 
        error: 'GDP data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get high-impact economic events (today/tomorrow)
  app.get('/api/market/high-impact-events', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const events = await marketData.getHighImpactEvents();
      res.json({ 
        events, 
        count: events.length,
        description: 'High-impact events with market relevance >= 80%',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('High-impact events error:', error);
      res.json({ 
        events: [], 
        error: 'High-impact event data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

}
