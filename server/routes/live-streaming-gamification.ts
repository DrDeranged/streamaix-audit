// ============================================================================
// LiveStreaming routes — extracted from server/routes.ts by
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

export async function registerLiveStreamingGamificationRoutes(app: Express): Promise<void> {
  // GAMIFICATION SYSTEM - Daily Quests, Weekly Missions, XP, Season Pass
  // =============================================================================

  const { gamificationService } = await import('../services/gamificationService');

  // Get full gamification dashboard
  app.get("/api/gamification/dashboard", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await gamificationService.getGamificationDashboard(userId);
    res.json({ success: true, dashboard });
  }));

  // Get user level info
  app.get("/api/gamification/level", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const level = await gamificationService.getUserLevel(userId);
    res.json({ success: true, level });
  }));

  // Get daily quests
  app.get("/api/gamification/quests/daily", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quests = await gamificationService.getDailyQuests(userId);
    res.json({ success: true, quests });
  }));

  // Get weekly missions
  app.get("/api/gamification/missions/weekly", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const missions = await gamificationService.getWeeklyMissions(userId);
    res.json({ success: true, missions });
  }));

  // Get user streaks
  app.get("/api/gamification/streaks", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const streaks = await gamificationService.getAllStreaks(userId);
    res.json({ success: true, streaks });
  }));

  // Update streak (called when user performs activity)
  app.post("/api/gamification/streaks/:type", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { type } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const streak = await gamificationService.updateStreak(userId, type);
    res.json({ success: true, streak });
  }));

  // Get season pass progress
  app.get("/api/gamification/season-pass", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const seasonPass = await gamificationService.getSeasonPassProgress(userId);
    res.json({ success: true, seasonPass });
  }));

  // Get gamification notifications
  app.get("/api/gamification/notifications", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await gamificationService.getUnreadNotifications(userId);
    res.json({ success: true, notifications });
  }));

  // Mark notification as read
  app.post("/api/gamification/notifications/:id/read", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await gamificationService.markNotificationRead(id);
    res.json({ success: true });
  }));

  // Track action for quest progress (used internally and can be called manually)
  app.post("/api/gamification/track-action", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { actionType, count = 1 } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await gamificationService.updateQuestProgress(userId, actionType, count);
    res.json({ success: true, ...result });
  }));

  // =============================================================================
  // GAMIFIED LEARNING MODULES - Web3 and AI Financial Education
  // =============================================================================

  const { learningModules: learningModulesTable, learningLessons, learningQuizzes, userLearningProgress, userLessonCompletions, userQuizAttempts } = await import("../../shared/schema");

  // Get all learning modules
  app.get("/api/learning/modules", asyncHandler(async (req: Request, res: Response) => {
    const modules = await db.select().from(learningModulesTable).where(eq(learningModulesTable.isActive, true)).orderBy(asc(learningModulesTable.sortOrder));
    res.json({ success: true, modules });
  }));

  // Get learning module by ID with lessons
  app.get("/api/learning/modules/:id", asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const [module] = await db.select().from(learningModulesTable).where(eq(learningModulesTable.id, id));
    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }
    const lessons = await db.select().from(learningLessons).where(eq(learningLessons.moduleId, id)).orderBy(asc(learningLessons.sortOrder));
    res.json({ success: true, module, lessons });
  }));

  // Get lesson by ID with quizzes
  app.get("/api/learning/lessons/:id", asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const [lesson] = await db.select().from(learningLessons).where(eq(learningLessons.id, id));
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }
    const quizzes = await db.select().from(learningQuizzes).where(eq(learningQuizzes.lessonId, id)).orderBy(asc(learningQuizzes.sortOrder));
    res.json({ success: true, lesson, quizzes });
  }));

  // Get user's learning progress
  app.get("/api/learning/progress", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const progress = await db.select().from(userLearningProgress).where(eq(userLearningProgress.userId, userId));
    const totalXp = progress.reduce((sum, p) => sum + (p.xpEarned || 0), 0);
    const completedModules = progress.filter(p => p.isCompleted).length;
    res.json({ success: true, progress, totalXp, completedModules });
  }));

  // Start a module (create progress record)
  app.post("/api/learning/modules/:id/start", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [existing] = await db.select().from(userLearningProgress).where(and(eq(userLearningProgress.userId, userId), eq(userLearningProgress.moduleId, id)));
    if (existing) {
      return res.json({ success: true, progress: existing, message: 'Already started' });
    }

    const [firstLesson] = await db.select().from(learningLessons).where(eq(learningLessons.moduleId, id)).orderBy(asc(learningLessons.sortOrder)).limit(1);
    
    const [newProgress] = await db.insert(userLearningProgress).values({
      userId,
      moduleId: id,
      currentLessonId: firstLesson?.id,
      lessonsCompleted: 0,
      progressPercent: 0,
    }).returning();
    
    res.json({ success: true, progress: newProgress });
  }));

  // Complete a lesson
  app.post("/api/learning/lessons/:id/complete", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { timeSpentSeconds = 0 } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [lesson] = await db.select().from(learningLessons).where(eq(learningLessons.id, id));
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const [existing] = await db.select().from(userLessonCompletions).where(and(eq(userLessonCompletions.userId, userId), eq(userLessonCompletions.lessonId, id)));
    if (existing) {
      return res.json({ success: true, completion: existing, xpEarned: 0, message: 'Already completed' });
    }

    const xpEarned = lesson.xpReward;
    await db.insert(userLessonCompletions).values({
      userId,
      lessonId: id,
      moduleId: lesson.moduleId,
      xpEarned,
      timeSpentSeconds,
    });

    const allLessons = await db.select().from(learningLessons).where(eq(learningLessons.moduleId, lesson.moduleId));
    const completedLessons = await db.select().from(userLessonCompletions).where(and(eq(userLessonCompletions.userId, userId), eq(userLessonCompletions.moduleId, lesson.moduleId)));
    const progressPercent = Math.round((completedLessons.length / allLessons.length) * 100);
    const isCompleted = progressPercent >= 100;

    await db.update(userLearningProgress).set({
      lessonsCompleted: completedLessons.length,
      progressPercent,
      xpEarned: sql`${userLearningProgress.xpEarned} + ${xpEarned}`,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
      lastAccessedAt: new Date(),
    }).where(and(eq(userLearningProgress.userId, userId), eq(userLearningProgress.moduleId, lesson.moduleId)));

    await db.update(users).set({
      streamPoints: sql`${users.streamPoints} + ${xpEarned}`,
    }).where(eq(users.id, userId));

    res.json({ success: true, xpEarned, progressPercent, isCompleted });
  }));

  // Submit quiz answer
  app.post("/api/learning/quizzes/:id/submit", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { selectedAnswer } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [quiz] = await db.select().from(learningQuizzes).where(eq(learningQuizzes.id, id));
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const options = quiz.options as Array<{ id: string; text: string; isCorrect: boolean }>;
    const correctOption = options.find(o => o.isCorrect);
    const isCorrect = correctOption?.id === selectedAnswer;

    const existingAttempts = await db.select().from(userQuizAttempts).where(and(eq(userQuizAttempts.userId, userId), eq(userQuizAttempts.quizId, id)));
    const attemptNumber = existingAttempts.length + 1;

    const xpEarned = isCorrect && attemptNumber === 1 ? quiz.xpReward : (isCorrect ? Math.floor(quiz.xpReward / 2) : 0);

    await db.insert(userQuizAttempts).values({
      userId,
      quizId: id,
      lessonId: quiz.lessonId,
      selectedAnswer,
      isCorrect,
      xpEarned,
      attemptNumber,
    });

    if (xpEarned > 0) {
      await db.update(users).set({
        streamPoints: sql`${users.streamPoints} + ${xpEarned}`,
      }).where(eq(users.id, userId));
    }

    res.json({ 
      success: true, 
      isCorrect, 
      xpEarned, 
      correctAnswer: correctOption?.id,
      explanation: quiz.explanation,
      attemptNumber 
    });
  }));

  // Get learning leaderboard
  app.get("/api/learning/leaderboard", asyncHandler(async (req: Request, res: Response) => {
    const topLearners = await db.select({
      id: userLearningProgress.userId,
      totalXp: sql<number>`SUM(${userLearningProgress.xpEarned})`.as('total_xp'),
      completedModules: sql<number>`COUNT(CASE WHEN ${userLearningProgress.isCompleted} = true THEN 1 END)`.as('completed_modules'),
    }).from(userLearningProgress).groupBy(userLearningProgress.userId).orderBy(sql`total_xp DESC`).limit(20);
    
    const leaderboard = await Promise.all(topLearners.map(async (l, index) => {
      const [user] = await db.select({ username: users.username, avatar: users.avatar }).from(users).where(eq(users.id, l.id));
      return { rank: index + 1, ...l, username: user?.username || 'Anonymous', avatar: user?.avatar };
    }));

    res.json({ success: true, leaderboard });
  }));

  // =============================================================================
}
