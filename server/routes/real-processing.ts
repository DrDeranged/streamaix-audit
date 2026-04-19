// ============================================================================
// RealProcessing routes — extracted from server/routes.ts by
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

export async function registerRealProcessingRoutes(app: Express): Promise<void> {
  // =============================================================================
  // REAL PROCESSING ENDPOINTS
  // =============================================================================

  // Test real processing endpoint
  console.log('📍 Registering analyze-content endpoint: POST /api/analyze-content');
  app.post('/api/analyze-content', authenticateToken, strictLimit, validateBody(analyzeContentSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`\n🔵 ========== ROUTE: POST /api/analyze-content ==========`);
    const { url } = req.body;
    try {
      console.log(`✅ URL received: ${url}`);
      console.log(`🔐 Environment check: OPENAI_API_KEY = ${process.env.OPENAI_API_KEY ? 'SET ✓' : 'MISSING ✗'}`);
      
      // Get current user ID from authenticated session
      // @ts-ignore - req.user is added by Passport.js authentication middleware
      const authenticatedUser = req.user;
      let userId = authenticatedUser?.id || null;
      
      // CRITICAL FIX: Verify user exists in database before using their ID
      // This prevents foreign key constraint violations from session/DB mismatches
      if (userId) {
        console.log(`👤 Session has authenticated user: ${userId} (${authenticatedUser.username})`);
        console.log(`🔍 Verifying user exists in production database...`);
        
        try {
          const userExists = await storage.getUser(userId);
          
          if (userExists) {
            console.log(`✅ User verified in database: ${userId}`);
          } else {
            console.warn(`⚠️  SESSION/DATABASE MISMATCH DETECTED!`);
            console.warn(`📝 User ${userId} has valid session but NO database record`);
            console.warn(`🔧 Treating as guest user (creator_id = null) to avoid FK constraint error`);
            console.warn(`💡 This usually means: Session from dev, user creation failed, or DB not synced`);
            userId = null; // Treat as guest to avoid foreign key violation
          }
        } catch (dbError: any) {
          console.error(`❌ Database verification failed for user ${userId}`);
          console.error(`💬 Error: ${dbError.message}`);
          console.warn(`🔧 Treating as guest user (creator_id = null) to avoid errors`);
          userId = null; // Treat as guest on DB error
        }
      } else {
        console.log(`👤 Guest user (no authentication) - will save with creator_id = null`);
      }

      console.log(`👤 Final user ID for processing: ${userId}`);
      console.log(`🏗️  Step 1: Getting RebuiltContentProcessor instance...`);
      
      let processor;
      try {
        processor = RebuiltContentProcessor.getInstance();
        console.log(`✅ Step 1 complete: Processor instance obtained`);
      } catch (processorError: any) {
        console.error(`❌ STEP 1 FAILED: Failed to get processor instance`);
        console.error(`⚠️  Error Type: ${processorError.constructor.name}`);
        console.error(`💬 Error Message: ${processorError.message}`);
        console.error(`📚 Stack Trace:`);
        console.error(processorError.stack);
        throw processorError;
      }

      console.log(`🚀 Step 2: Starting content processing...`);
      
      let result;
      try {
        result = await processor.processContent(url, userId);
        console.log(`✅ Step 2 complete: Processing started, summary ID: ${result.summaryId}`);
      } catch (processingError: any) {
        console.error(`❌ STEP 2 FAILED: processContent() threw an error`);
        console.error(`⚠️  Error Type: ${processingError.constructor.name}`);
        console.error(`💬 Error Message: ${processingError.message}`);
        console.error(`📚 Stack Trace:`);
        console.error(processingError.stack);
        throw processingError;
      }
      
      const summaryId = result.summaryId;

      console.log(`✅ SUCCESS: Returning response to client with summaryId=${summaryId}`);
      console.log(`========================================\n`);
      
      res.status(201).json({
        message: 'AI content analysis started successfully',
        summaryId,
        jobId: `job-${Date.now()}`, // Compatibility with frontend
        summary: { id: summaryId }, // Frontend expects this format
        statusUrl: `/api/processing-result/${summaryId}`,
        debugUrl: `/api/summaries/${summaryId}`,
        instructions: 'Check the processing result endpoint for real-time updates'
      });
    } catch (error: any) {
      console.error(`\n❌ ========== ROUTE ERROR: /api/analyze-content ==========`);
      console.error(`📍 URL attempted: ${url}`);
      console.error(`⚠️  Final Error Type: ${error.constructor?.name || typeof error}`);
      console.error(`💬 Final Error Message: ${error.message || String(error)}`);
      console.error(`📚 Final Stack Trace:`);
      console.error(error.stack || 'No stack trace available');
      console.error(`========================================\n`);
      
      // Detect foreign key constraint violations
      const isForeignKeyError = error.message?.includes('foreign key constraint') || 
                                error.message?.includes('violates foreign key') ||
                                error.code === '23503'; // PostgreSQL FK violation code
      
      if (isForeignKeyError) {
        console.error(`🔴 FOREIGN KEY VIOLATION DETECTED`);
        console.error(`📝 This usually means the user ID doesn't exist in the database`);
        console.error(`👤 Attempted user ID: ${userId}`);
        
        res.status(500).json({ 
          error: 'Failed to start real processing',
          details: 'Database constraint violation - user account may not exist in production database',
          hint: 'This is likely a deployment/migration issue. Check that user accounts are synced.',
          technicalDetails: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to start real processing',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  }));
  console.log('✅ Analyze-content endpoint registered successfully');

  // Debug endpoint to check processing status and detect issues
  app.get('/api/debug/summary/:id', asyncHandler(async (req: Request, res: Response) => {
    const summary = await storage.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Get processing job status from V2 processor
    let processingInfo = 'No active processing info available';
    try {
      processingInfo = StreamProcessorV2.getQueueStatus();
    } catch (e) {
      processingInfo = 'Unable to retrieve processing status';
    }
    
    res.json({
      summary: {
        id: summary.id,
        processingStatus: summary.processingStatus,
        title: summary.title,
        hasContent: !!summary.summary,
        hasTags: summary.tags?.length || 0,
        hasTranscript: !!summary.transcript,
        hasKeyInsights: Array.isArray(summary.keyInsights) ? summary.keyInsights.length : 0,
        hasChapters: Array.isArray(summary.chapters) ? summary.chapters.length : 0,
        accuracy: summary.accuracy,
        ipfsHash: summary.ipfsHash,
        arweaveId: summary.arweaveId,
        contentLength: summary.summary?.length || 0,
        transcriptLength: summary.transcript?.length || 0
      },
      processingInfo,
      timestamp: new Date().toISOString(),
      recommendation: summary.processingStatus === 'processing' ? 
        'Check if backend processing completed but status update failed' : 
        'Status appears correct'
    });
  }));

  // Get job status endpoint (V2)
  app.get('/api/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
    const job = StreamProcessorV2.getJobStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  }));

  // Get processing result endpoint (Rebuilt Processor)
  app.get('/api/processing-result/:summaryId', asyncHandler(async (req: Request, res: Response) => {
    // Set headers to prevent caching for real-time updates
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log(`🔍 [API /api/processing-result] Request for summary: ${req.params.summaryId}`);
    
    const processor = RebuiltContentProcessor.getInstance();
    const result = await processor.getProcessingResult(req.params.summaryId);
    
    // 🔍 DEBUG: Log API response data
    console.log(`🔍 [API /api/processing-result] Response suggestedMarkets count: ${result?.suggestedMarkets?.length || 0}`);
    if (result?.suggestedMarkets && result.suggestedMarkets.length > 0) {
      console.log(`🔍 [API /api/processing-result] First market: ${result.suggestedMarkets[0]?.question || 'N/A'}`);
    }
    
    res.json(result);
  }));

}
