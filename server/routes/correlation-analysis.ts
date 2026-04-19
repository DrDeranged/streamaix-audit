// ============================================================================
// CorrelationAnalysis routes — extracted from server/routes.ts by
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

export async function registerCorrelationAnalysisRoutes(app: Express): Promise<void> {
  // =============================================================================
  // CORRELATION ANALYSIS ROUTES
  // =============================================================================

  // Get correlation matrix between crypto and traditional assets
  app.get('/api/correlation/matrix', asyncHandler(async (req: Request, res: Response) => {
    console.log('🔥 CORRELATION ENDPOINT HIT - SIMPLE TEST');
    
    // Simple test response to verify endpoint is working
    const response = {
      success: true,
      data: {
        matrix: [
          { asset1: 'BTC', asset2: 'ETH', correlation: 0.75, strength: 'strong' },
          { asset1: 'BTC', asset2: 'TSLA', correlation: 0.45, strength: 'moderate' },
          { asset1: 'ETH', asset2: 'TSLA', correlation: 0.35, strength: 'weak' }
        ],
        assets: [
          { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 67420, change24h: 2.5 },
          { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3780, change24h: -1.2 },
          { symbol: 'TSLA', name: 'Tesla', type: 'stock', price: 426, change24h: 9.1 }
        ],
        timeframe: '30d',
        lastUpdated: new Date().toISOString()
      },
      timeframe: '30d',
      timestamp: new Date().toISOString()
    };
    
    console.log('🔥 SENDING TEST CORRELATION RESPONSE');
    res.json(response);
    console.log('🔥 CORRELATION RESPONSE SENT');
  }));

  // Get current market regime analysis
  app.get('/api/correlation/market-regime', asyncHandler(async (req: Request, res: Response) => {
    console.log('🎯 API Call: GET /api/correlation/market-regime');
    
    try {
      const marketRegime = await correlationAnalysisService.getMarketRegime();
      
      res.json({
        success: true,
        data: marketRegime,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Market regime analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze market regime',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get risk sentiment indicator
  app.get('/api/correlation/risk-sentiment', asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d') || '7d';
    
    console.log(`📡 API Call: GET /api/correlation/risk-sentiment - Timeframe: ${timeframe}`);
    
    try {
      const riskSentiment = await correlationAnalysisService.getRiskSentimentIndicator(timeframe);
      
      res.json({
        success: true,
        data: riskSentiment,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Risk sentiment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate risk sentiment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get specific asset pair correlations with detailed analysis
  app.get('/api/correlation/pairs/:asset1/:asset2', asyncHandler(async (req: Request, res: Response) => {
    const { asset1, asset2 } = req.params;
    const timeframes = req.query.timeframes 
      ? (req.query.timeframes as string).split(',') as Array<'7d' | '30d' | '90d'>
      : ['7d', '30d', '90d'];
    
    console.log(`📊 API Call: GET /api/correlation/pairs/${asset1}/${asset2} - Timeframes: ${timeframes.join(', ')}`);
    
    if (!asset1 || !asset2) {
      return res.status(400).json({
        success: false,
        error: 'Both asset1 and asset2 parameters are required',
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const correlations = await correlationAnalysisService.getAssetPairCorrelations(
        asset1.toUpperCase(), 
        asset2.toUpperCase(), 
        timeframes
      );
      
      res.json({
        success: true,
        data: {
          asset1: asset1.toUpperCase(),
          asset2: asset2.toUpperCase(),
          correlations,
          timeframes
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Asset pair correlation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate asset pair correlations',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get correlation strength summary across all asset classes
  app.get('/api/correlation/summary', asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '7d' | '30d' | '90d') || '30d';
    
    console.log(`📈 API Call: GET /api/correlation/summary - Timeframe: ${timeframe}`);
    
    try {
      const [correlationMatrix, marketRegime, riskSentiment] = await Promise.all([
        correlationAnalysisService.getCorrelationMatrix(timeframe),
        correlationAnalysisService.getMarketRegime(),
        correlationAnalysisService.getRiskSentimentIndicator(timeframe === '7d' ? '7d' : '7d')
      ]);

      // Calculate summary statistics
      const correlations = correlationMatrix.matrix.map(pair => Math.abs(pair.correlation));
      const avgCorrelation = correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length;
      const maxCorrelation = Math.max(...correlations);
      const strongCorrelations = correlations.filter(corr => corr > 0.6).length;

      res.json({
        success: true,
        data: {
          overview: {
            averageCorrelation: Number(avgCorrelation.toFixed(3)),
            maxCorrelation: Number(maxCorrelation.toFixed(3)),
            strongCorrelationsCount: strongCorrelations,
            totalPairs: correlations.length,
            timeframe
          },
          marketRegime: marketRegime,
          riskSentiment: riskSentiment,
          lastUpdated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Correlation summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate correlation summary',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
