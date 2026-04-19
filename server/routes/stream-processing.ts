// ============================================================================
// StreamProcessing routes — extracted from server/routes.ts by
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

export async function registerStreamProcessingRoutes(app: Express): Promise<void> {
  // =============================================================================
  // STREAM PROCESSING ROUTES
  // =============================================================================

  // Start processing a summary
  app.post('/api/summaries/:id/process', authenticateToken, strictLimit, validateBody(summaryProcessSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const summary = await storage.getSummary(summaryId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    if (summary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized - not your summary' });
    }
    
    if (summary.processingStatus === 'processing') {
      return res.status(400).json({ error: 'Summary is already being processed' });
    }
    
    if (summary.processingStatus === 'completed') {
      return res.status(400).json({ error: 'Summary has already been processed' });
    }
    
    // Start processing in background
    const jobId = await StreamProcessor.queueProcessing(summaryId, summary.originalUrl, {
      contentType: summary.contentType as any,
      platform: summary.platform,
      title: summary.title,
    });
    
    res.json({
      message: 'Processing started',
      summaryId,
      jobId,
      status: 'processing'
    });
  }));

  // Get processing status
  app.get('/api/summaries/:id/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const summary = await storage.getSummary(summaryId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    if (summary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized - not your summary' });
    }
    
    const jobs = StreamProcessor.getJobsForSummary(summaryId);
    const latestJob = jobs.length > 0 ? jobs[jobs.length - 1] : null;
    
    res.json({
      summaryId,
      status: summary.processingStatus,
      job: latestJob ? {
        id: latestJob.id,
        status: latestJob.status,
        progress: latestJob.progress,
        error: latestJob.error,
        startedAt: latestJob.startedAt,
        completedAt: latestJob.completedAt
      } : null
    });
  }));

  // Process content from URL directly
  app.post('/api/process-content', authenticateToken, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(processContentSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { url, contentType, platform, title, isPublic, tags } = validation.data as any;

    try {
      console.log(`\n🎬 ========== NEW PROCESSING REQUEST ==========`);
      console.log(`📍 URL: ${url}`);
      console.log(`👤 User: ${req.user!.username} (ID: ${req.user!.id})`);
      console.log(`🔧 Options:`, { contentType, platform, title, isPublic });
      
      // Use RebuiltContentProcessor for faster processing
      console.log('🚀 Initializing RebuiltContentProcessor...');
      const processor = RebuiltContentProcessor.getInstance();
      
      console.log('▶️  Starting content processing...');
      const result = await processor.processContent(url, req.user!.id);
      const summaryId = result.summaryId;
      
      console.log(`✅ Processing started successfully! Summary ID: ${summaryId}`);
      console.log(`========================================\n`);

      res.status(201).json({
        message: 'Content processing started successfully',
        summary: { 
          id: summaryId,
          title: title || 'Processing...',
          originalUrl: url,
          contentType,
          platform,
          processingStatus: 'processing'
        },
        jobId: `job-${Date.now()}`, // Compatibility with frontend
        statusUrl: `/api/processing-result/${summaryId}`
      });
    } catch (error) {
      console.error(`\n❌ ========== ROUTE ERROR: /api/process-content ==========`);
      console.error(`📍 URL: ${url}`);
      console.error(`👤 User: ${req.user!.username}`);
      console.error(`⚠️  Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`💬 Error Message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`📚 Full Error:`, error);
      if (error instanceof Error && error.stack) {
        console.error(`🔍 Stack Trace:`);
        console.error(error.stack);
      }
      console.error(`========================================\n`);
      
      // Provide detailed error to frontend
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isConfigError = errorMessage.includes('API key') || errorMessage.includes('not configured');
      
      res.status(500).json({ 
        error: 'Failed to start content processing',
        details: errorMessage,
        type: isConfigError ? 'configuration_error' : 'processing_error',
        suggestion: isConfigError ? 
          'Server configuration issue. Please contact the administrator.' : 
          'Please try again or contact support if the problem persists.'
      });
    }
  }));

}
