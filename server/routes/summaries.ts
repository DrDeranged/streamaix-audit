// ============================================================================
// Summaries routes — extracted from server/routes.ts by
// scripts/split-routes.ts. No behavior changes; this is a pure file
// reorganization to break the 20k-line monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
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
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { youtubeService } from "../services/youtubeService";
import { trendingService } from "../services/trendingService";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";
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

export async function registerSummariesRoutes(app: Express): Promise<void> {
  // =============================================================================
  // SUMMARY ROUTES
  // =============================================================================

  // Get all summaries (public) - for landing page
  app.get('/api/summaries', asyncHandler(async (req: Request, res: Response) => {
    try {
      const summaries = await storage.getAllSummaries();
      
      // Filter to public summaries with content
      const publicSummaries = summaries
        .filter((s: any) => s.isPublic && s.processingStatus === 'completed')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10); // Limit to most recent 10
      
      // Parse JSON fields for each summary to include prediction markets and market analysis
      // Note: Drizzle already parses jsonb fields, so we only parse text fields like marketAnalysis
      const enrichedSummaries = publicSummaries.map(summary => {
        let marketData = {};
        
        try {
          if (summary.marketAnalysis) {
            marketData = JSON.parse(summary.marketAnalysis);
          }
        } catch (e) {
          console.log('Could not parse market analysis data for summary:', summary.id);
        }
        
        return {
          ...summary,
          ...marketData,
          // suggestedMarkets is already parsed by Drizzle (jsonb field), just pass it through
          executiveSummary: summary.blogPost || summary.summary
        };
      });
      
      res.json(enrichedSummaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      res.status(500).json({ error: 'Failed to fetch summaries' });
    }
  }));

  // Get trending summaries
  app.get('/api/summaries/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const summaries = await storage.getTrendingSummaries(limit);

    res.json({ summaries });
  }));

  // Search summaries
  app.get('/api/summaries/search', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(searchSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { q, limit } = validation.data as { q: string; limit: number };
    const summaries = await storage.searchSummaries(q, limit);

    res.json({ summaries, query: q });
  }));

  // Get summary by ID
  app.get('/api/summaries/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`API: Fetching summary ${req.params.id}`);
    
    // Use the exact same method as processing-result endpoint for consistency
    const processor = RebuiltContentProcessor.getInstance();
    const transformedSummary = await processor.getProcessingResult(req.params.id);
    
    if (!transformedSummary) {
      console.log(`API: Summary ${req.params.id} not found`);
      return res.status(404).json({ error: 'Summary not found' });
    }

    console.log(`API: Summary ${req.params.id} found - status: ${transformedSummary.processingStatus}`);

    // Track view if user is authenticated
    if (req.user) {
      await storage.createUserInteraction({
        userId: req.user.id,
        summaryId: req.params.id,
        interactionType: 'view',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    res.json({ summary: transformedSummary });
  }));

  // Create new summary
  app.post('/api/summaries', authenticateToken, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createSummarySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const summaryData = { ...validation.data as any, creatorId: req.user!.id };
    const summary = await storage.createSummary(summaryData);

    res.status(201).json({
      message: 'Summary created successfully',
      summary
    });
  }));

  // Update summary
  app.patch('/api/summaries/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingSummary = await storage.getSummary(req.params.id);
    if (!existingSummary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (existingSummary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own summaries' });
    }

    const validation = validateRequest(updateSummarySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const summary = await storage.updateSummary(req.params.id, validation.data as any);
    res.json({
      message: 'Summary updated successfully',
      summary
    });
  }));

  // Delete summary
  app.delete('/api/summaries/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingSummary = await storage.getSummary(req.params.id);
    if (!existingSummary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (existingSummary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own summaries' });
    }

    const deleted = await storage.deleteSummary(req.params.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete summary' });
    }

    res.json({ message: 'Summary deleted successfully' });
  }));

  // Get user's summaries
  app.get('/api/users/:id/summaries', asyncHandler(async (req: Request, res: Response) => {
    const summaries = await storage.getSummariesByUser(req.params.id);
    
    // Parse marketAnalysis JSON for each summary to include comprehensive data
    const enrichedSummaries = summaries.map(summary => {
      let marketData = {};
      try {
        if (summary.marketAnalysis) {
          marketData = JSON.parse(summary.marketAnalysis);
        }
      } catch (e) {
        console.log('Could not parse market analysis data for summary:', summary.id);
      }
      
      return {
        ...summary,
        ...marketData, // Spread the parsed fields (bulletPoints, trends, financialTrends, etc.)
        executiveSummary: summary.blogPost || summary.summary
      };
    });
    
    res.json({ summaries: enrichedSummaries });
  }));

}
