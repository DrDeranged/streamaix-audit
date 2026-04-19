// ============================================================================
// Web3AndSocial routes — extracted from server/routes.ts by
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

export async function registerWeb3AndSocialRoutes(app: Express): Promise<void> {
  // =============================================================================
  // WEB3 & SOCIAL ROUTES
  // =============================================================================

  // Get wallet authentication nonce
  app.post('/api/web3/nonce', asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    
    if (!walletAddress || !Web3Service.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    const nonce = Web3Service.generateNonce();
    const message = Web3Service.generateAuthMessage(walletAddress, nonce);

    res.json({ 
      nonce, 
      message,
      walletAddress 
    });
  }));

  // Share summary to social platforms
  app.post('/api/summaries/:id/share', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const { platform, message } = req.body;

    const summary = await storage.getSummary(summaryId);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    const shareContent = {
      title: summary.title,
      summary: summary.summary || 'AI-generated summary available on StreamAiX',
      url: `https://streamaix.com/summaries/${summaryId}`,
      tags: summary.tags || []
    };

    let result;
    switch (platform) {
      case 'lens':
        result = await Web3Service.shareToLens(shareContent);
        break;
      case 'farcaster':
        try {
          // Use real Farcaster service instead of mock
          const { farcasterService } = await import('../services/farcaster');
          const castResponse = await farcasterService.createCast({
            title: shareContent.title,
            summary: shareContent.summary,
            originalUrl: summary.originalUrl,
            summaryUrl: shareContent.url,
            tags: shareContent.tags
          });
          result = {
            success: true,
            castHash: castResponse.cast.hash,
            castUrl: `https://warpcast.com/${castResponse.cast.author.username}/${castResponse.cast.hash.substring(0, 10)}`
          };
        } catch (error) {
          console.error('Farcaster sharing error:', error);
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share to Farcaster'
          };
        }
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    // Record share interaction
    await storage.createUserInteraction({
      userId: req.user!.id,
      summaryId,
      interactionType: 'share',
      metadata: { platform, result }
    });

    res.json({
      message: 'Content shared successfully',
      platform,
      result
    });
  }));

  // Get user recommendations
  app.get('/api/recommendations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const recentSummaries = await storage.getSummariesByUser(req.user!.id);
    const interactions = await storage.getUserInteractions(req.user!.id);
    
    // Extract user interests from interactions and summaries
    const userTags = new Set<string>();
    recentSummaries.forEach(s => s.tags?.forEach(tag => userTags.add(tag)));
    
    const recommendations = await AIService.generateRecommendations(
      req.user!.id,
      Array.from(userTags),
      recentSummaries.slice(0, 5)
    );

    res.json(recommendations);
  }));


}
