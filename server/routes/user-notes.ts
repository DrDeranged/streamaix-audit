// ============================================================================
// UserNotes routes — extracted from server/routes.ts by
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

export async function registerUserNotesRoutes(app: Express): Promise<void> {
  // =============================================================================
  // USER NOTES ROUTES
  // =============================================================================

  // Get user's notes (optionally filtered by summary)
  app.get('/api/notes', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { summaryId } = req.query;
    const notes = await storage.getUserNotes(req.user!.id, summaryId as string);
    res.json({ notes });
  }));

  // Get notes for a specific summary (public notes only)
  app.get('/api/summaries/:summaryId/notes', asyncHandler(async (req: Request, res: Response) => {
    const notes = await storage.getUserNotesBySummary(req.params.summaryId);
    // Filter to only public notes
    const publicNotes = notes.filter(note => !note.isPrivate);
    res.json({ notes: publicNotes });
  }));

  // Get specific note by ID
  app.get('/api/notes/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const note = await storage.getUserNote(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns the note or if it's public
    if (note.userId !== req.user!.id && note.isPrivate) {
      return res.status(403).json({ error: 'Access denied - private note' });
    }

    res.json({ note });
  }));

  // Create new user note
  app.post('/api/notes', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createUserNoteSchema, {
      ...req.body,
      userId: req.user!.id
    });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    // Verify the summary exists (skip for journal entries)
    const validatedData = validation.data as any;
    const isJournalEntry = validatedData.summaryId.startsWith('journal-');
    
    if (!isJournalEntry) {
      const summary = await storage.getSummary(validatedData.summaryId);
      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }
    }

    const note = await storage.createUserNote(validation.data as any);
    res.status(201).json({
      message: 'Note created successfully',
      note
    });
  }));

  // Update user note
  app.patch('/api/notes/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingNote = await storage.getUserNote(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own notes' });
    }

    const validation = validateRequest(updateUserNoteSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const note = await storage.updateUserNote(req.params.id, validation.data as any);
    res.json({
      message: 'Note updated successfully',
      note
    });
  }));

  // Delete user note
  app.delete('/api/notes/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingNote = await storage.getUserNote(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    const deleted = await storage.deleteUserNote(req.params.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    res.json({ message: 'Note deleted successfully' });
  }));

}
