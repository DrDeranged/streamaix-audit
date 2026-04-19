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

export async function registerLiveStreamingRoutes(app: Express): Promise<void> {
  // =============================================================================
  // LIVE STREAMING API
  // =============================================================================

  // Get scheduled market streams and replays
  app.get("/api/scheduled-streams", asyncHandler(async (req: Request, res: Response) => {
    const { getScheduledMarketStreamService } = await import('../services/scheduledMarketStreamService');
    const service = getScheduledMarketStreamService();
    
    if (!service) {
      return res.json({ success: true, schedule: [], replays: [] });
    }

    const [schedule, replays] = await Promise.all([
      service.getUpcomingSchedule(),
      service.getRecentReplays(20)
    ]);

    res.json({ success: true, schedule, replays });
  }));

  // Get stream replays (VODs) - only those with TTS audio
  app.get("/api/stream-replays", asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    // Only return replays that have TTS audio stored
    const replays = await db.select({
      id: streamRecordings.id,
      streamId: streamRecordings.streamId,
      recordingUrl: streamRecordings.recordingUrl,
      thumbnailUrl: streamRecordings.thumbnailUrl,
      durationSeconds: streamRecordings.durationSeconds,
      status: streamRecordings.status,
      createdAt: streamRecordings.createdAt,
      streamTitle: liveStreams.title,
      streamDescription: liveStreams.description,
      streamCategory: liveStreams.category,
      hostAvatarId: liveStreams.hostAvatarId,
    })
    .from(streamRecordings)
    .innerJoin(liveStreams, eq(streamRecordings.streamId, liveStreams.id))
    .where(and(
      eq(streamRecordings.status, 'ready'),
      isNotNull(streamRecordings.audioData)
    ))
    .orderBy(desc(streamRecordings.createdAt))
    .limit(limit);

    // Enrich with avatar info
    const enrichedReplays = await Promise.all(replays.map(async (replay) => {
      if (replay.hostAvatarId) {
        const [avatar] = await db.select({
          name: knowledgeAvatars.name,
          imageUrl: knowledgeAvatars.imageUrl,
          expertise: knowledgeAvatars.expertise,
        })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, replay.hostAvatarId))
        .limit(1);
        
        return { ...replay, hostAvatar: avatar || null };
      }
      return { ...replay, hostAvatar: null };
    }));

    res.json({ success: true, replays: enrichedReplays });
  }));

  // Get single stream replay with messages (for playback)
  app.get("/api/streams/:streamId/replay", asyncHandler(async (req: Request, res: Response) => {
    const { streamId } = req.params;

    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId))
      .limit(1);

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }

    const [recording] = await db.select()
      .from(streamRecordings)
      .where(eq(streamRecordings.streamId, streamId))
      .limit(1);

    let hostAvatar = null;
    if (stream.hostAvatarId) {
      const [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, stream.hostAvatarId))
        .limit(1);
      hostAvatar = avatar;
    }

    // Get transcript messages ordered by time
    const messages = await db.select()
      .from(streamMessages)
      .where(eq(streamMessages.streamId, streamId))
      .orderBy(streamMessages.createdAt)
      .limit(100);

    // Check if TTS audio is available (in memory or database)
    const { hasScheduledStreamAudio } = await import('../services/scheduledMarketStreamService');
    const hasAudioInMemory = hasScheduledStreamAudio(streamId);
    const hasAudioInDb = !!recording?.audioData;
    const hasAudio = hasAudioInMemory || hasAudioInDb;

    res.json({
      success: true,
      stream,
      recording,
      hostAvatar,
      messages,
      transcript: messages.map(m => m.content),
      hasAudio,
      audioUrl: hasAudio ? `/api/streams/${streamId}/audio` : null,
    });
  }));

  // Serve TTS audio for stream replay
  app.get("/api/streams/:streamId/audio", asyncHandler(async (req: Request, res: Response) => {
    const { streamId } = req.params;
    
    // First check in-memory cache (for recently ended streams)
    const { getScheduledStreamAudio } = await import('../services/scheduledMarketStreamService');
    let audioBase64 = getScheduledStreamAudio(streamId);
    
    // If not in memory, check database for persisted audio
    if (!audioBase64) {
      const [recording] = await db.select({ audioData: streamRecordings.audioData })
        .from(streamRecordings)
        .where(eq(streamRecordings.streamId, streamId))
        .limit(1);
      
      if (recording?.audioData) {
        audioBase64 = recording.audioData;
      }
    }
    
    if (!audioBase64) {
      return res.status(404).json({ success: false, error: 'Audio not available for this stream' });
    }
    
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(audioBuffer);
  }));

  // Get platform stats (real aggregates from database)
  app.get("/api/platform-stats", asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get total stream count (all streams ever created)
      const [streamCountResult] = await db.select({
        count: sql<number>`count(*)`.as('count')
      }).from(liveStreams);
      const totalStreams = Number(streamCountResult?.count || 0);
      
      // Get total tips earned across all streams
      const [tipsResult] = await db.select({
        total: sql<number>`COALESCE(sum(amount), 0)`.as('total')
      }).from(streamTips);
      const totalTipsEarned = Number(tipsResult?.total || 0);
      
      // Get total hours watched (sum of duration * peak viewers / 60)
      const [watchTimeResult] = await db.select({
        hours: sql<number>`COALESCE(sum(COALESCE(duration_seconds, 0) * COALESCE(peak_viewers, 1) / 3600), 0)`.as('hours')
      }).from(liveStreams);
      const totalHoursWatched = Math.floor(Number(watchTimeResult?.hours || 0));
      
      // Get unique creators (distinct host IDs who have created streams)
      const [creatorsResult] = await db.select({
        count: sql<number>`count(distinct host_id)`.as('count')
      }).from(liveStreams);
      const totalCreators = Number(creatorsResult?.count || 0);
      
      // Calculate weekly growth (comparing streams in last 7 days vs previous 7 days)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const [thisWeekResult] = await db.select({
        count: sql<number>`count(*)`.as('count')
      }).from(liveStreams)
        .where(sql`created_at >= ${oneWeekAgo}`);
      
      const [lastWeekResult] = await db.select({
        count: sql<number>`count(*)`.as('count')
      }).from(liveStreams)
        .where(sql`created_at >= ${twoWeeksAgo} AND created_at < ${oneWeekAgo}`);
      
      const thisWeekCount = Number(thisWeekResult?.count || 0);
      const lastWeekCount = Number(lastWeekResult?.count || 0);
      
      let weeklyGrowth = 0;
      if (lastWeekCount > 0) {
        weeklyGrowth = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 * 10) / 10;
      } else if (thisWeekCount > 0) {
        weeklyGrowth = 100; // If no streams last week but some this week
      }
      
      // Get recent platform activity (last 10 actions)
      const recentTips = await db.select({
        type: sql`'tip'`.as('type'),
        username: users.username,
        amount: streamTips.amount,
        streamTitle: liveStreams.title,
        createdAt: streamTips.createdAt,
      })
      .from(streamTips)
      .innerJoin(users, eq(users.id, streamTips.tipperId))
      .innerJoin(liveStreams, eq(liveStreams.id, streamTips.streamId))
      .orderBy(desc(streamTips.createdAt))
      .limit(5);
      
      const recentStreamsStarted = await db.select({
        type: sql`'live'`.as('type'),
        hostId: liveStreams.hostId,
        streamTitle: liveStreams.title,
        createdAt: liveStreams.createdAt,
      })
      .from(liveStreams)
      .orderBy(desc(liveStreams.createdAt))
      .limit(5);
      
      // Get top earners (creators with most tips received)
      const topEarners = await db.select({
        recipientId: streamTips.recipientId,
        username: users.username,
        totalEarnings: sql<number>`sum(${streamTips.amount})`.as('total_earnings'),
      })
      .from(streamTips)
      .innerJoin(users, eq(users.id, streamTips.recipientId))
      .groupBy(streamTips.recipientId, users.username)
      .orderBy(desc(sql`sum(${streamTips.amount})`))
      .limit(5);
      
      // Format activity feed with proper time calculation
      const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'recently';
        const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
      };
      
      const recentActivity = [
        ...recentTips.map(t => ({
          type: 'tip',
          user: t.username,
          amount: t.amount,
          stream: t.streamTitle,
          time: formatTimeAgo(t.createdAt),
        })),
        ...recentStreamsStarted.map(s => ({
          type: 'live',
          user: s.hostId,
          stream: s.streamTitle,
          time: formatTimeAgo(s.createdAt),
        })),
      ].sort((a, b) => {
        // Sort by time (most recent first)
        const aMs = a.time?.includes('just') ? 0 : 
                    a.time?.includes('m ago') ? parseInt(a.time) : 
                    a.time?.includes('h ago') ? parseInt(a.time) * 60 :
                    parseInt(a.time) * 60 * 24 || 999;
        const bMs = b.time?.includes('just') ? 0 : 
                    b.time?.includes('m ago') ? parseInt(b.time) : 
                    b.time?.includes('h ago') ? parseInt(b.time) * 60 :
                    parseInt(b.time) * 60 * 24 || 999;
        return aMs - bMs;
      }).slice(0, 5);
      
      res.json({
        success: true,
        stats: {
          totalStreams,
          totalHoursWatched,
          totalTipsEarned,
          totalCreators,
          platformFeeRate: 0.5,
          weeklyGrowth,
        },
        recentActivity,
        topEarners: topEarners.map(e => ({
          username: e.username,
          earnings: Number(e.totalEarnings),
        })),
      });
    } catch (error: any) {
      console.error('Platform stats error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Get live streams (currently active)
  app.get("/api/streams/live", asyncHandler(async (req: Request, res: Response) => {
    // Prevent caching to ensure fresh stream data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const streams = await db.select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        streamType: liveStreams.streamType,
        hostId: liveStreams.hostId,
        hostAvatarId: liveStreams.hostAvatarId,
        status: liveStreams.status,
        currentViewers: liveStreams.currentViewers,
        peakViewers: liveStreams.peakViewers,
        totalTipsReceived: liveStreams.totalTipsReceived,
        category: liveStreams.category,
        tags: liveStreams.tags,
        linkedBountyId: liveStreams.linkedBountyId,
        linkedMarketId: liveStreams.linkedMarketId,
        actualStart: liveStreams.actualStart,
        thumbnailUrl: liveStreams.thumbnailUrl,
      })
      .from(liveStreams)
      .where(eq(liveStreams.status, 'live'))
      .orderBy(desc(liveStreams.currentViewers))
      .limit(20);
      
      // Enrich with host info - prioritize Knowledge Avatar if available
      const enrichedStreams = await Promise.all(streams.map(async (stream) => {
        // First check if this is a Knowledge Avatar stream
        if (stream.hostAvatarId) {
          const [avatar] = await db.select({
            name: knowledgeAvatars.name,
            handle: knowledgeAvatars.handle,
            imageUrl: knowledgeAvatars.imageUrl,
            expertise: knowledgeAvatars.expertise,
            verificationStatus: knowledgeAvatars.verificationStatus,
          })
          .from(knowledgeAvatars)
          .where(eq(knowledgeAvatars.id, stream.hostAvatarId))
          .limit(1);
          
          if (avatar) {
            return {
              ...stream,
              hostUsername: avatar.name,
              hostHandle: avatar.handle,
              hostAvatar: avatar.imageUrl,
              hostExpertise: avatar.expertise,
              isKnowledgeAvatar: true,
              isVerified: avatar.verificationStatus === 'verified',
            };
          }
        }
        
        // Fall back to regular user
        const host = await storage.getUser(stream.hostId);
        return {
          ...stream,
          hostUsername: host?.username || 'Anonymous',
          hostAvatar: host?.avatar,
          isKnowledgeAvatar: false,
          isVerified: false,
        };
      }));
      
      res.json({ success: true, streams: enrichedStreams });
    } catch (error: any) {
      console.error('[Streams/Live] Error fetching live streams:', error);
      res.json({ success: true, streams: [], error: error.message });
    }
  }));

  // Get scheduled streams
  app.get("/api/streams/scheduled", asyncHandler(async (req: Request, res: Response) => {
    try {
      const streams = await db.select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        streamType: liveStreams.streamType,
        hostId: liveStreams.hostId,
        hostAvatarId: liveStreams.hostAvatarId,
        status: liveStreams.status,
        category: liveStreams.category,
        tags: liveStreams.tags,
        scheduledStart: liveStreams.scheduledStart,
        thumbnailUrl: liveStreams.thumbnailUrl,
      })
      .from(liveStreams)
      .where(eq(liveStreams.status, 'scheduled'))
      .orderBy(asc(liveStreams.scheduledStart))
      .limit(20);
      
      // Enrich with host info - prioritize Knowledge Avatar if available
      const enrichedStreams = await Promise.all(streams.map(async (stream) => {
        if (stream.hostAvatarId) {
          const [avatar] = await db.select({
            name: knowledgeAvatars.name,
            handle: knowledgeAvatars.handle,
            imageUrl: knowledgeAvatars.imageUrl,
            expertise: knowledgeAvatars.expertise,
            verificationStatus: knowledgeAvatars.verificationStatus,
          })
          .from(knowledgeAvatars)
          .where(eq(knowledgeAvatars.id, stream.hostAvatarId))
          .limit(1);
          
          if (avatar) {
            return {
              ...stream,
              hostUsername: avatar.name,
              hostHandle: avatar.handle,
              hostAvatar: avatar.imageUrl,
              hostExpertise: avatar.expertise,
              isKnowledgeAvatar: true,
              isVerified: avatar.verificationStatus === 'verified',
            };
          }
        }
        
        const host = await storage.getUser(stream.hostId);
        return {
          ...stream,
          hostUsername: host?.username || 'Anonymous',
          hostAvatar: host?.avatar,
          isKnowledgeAvatar: false,
          isVerified: false,
        };
      }));
      
      res.json({ success: true, streams: enrichedStreams });
    } catch (error: any) {
      res.json({ success: true, streams: [] });
    }
  }));

  // Helper function to enrich stream with Knowledge Avatar or user info
  async function enrichStreamWithHostInfo(stream: any) {
    if (stream.hostAvatarId) {
      const [avatar] = await db.select({
        name: knowledgeAvatars.name,
        handle: knowledgeAvatars.handle,
        imageUrl: knowledgeAvatars.imageUrl,
        expertise: knowledgeAvatars.expertise,
        verificationStatus: knowledgeAvatars.verificationStatus,
      })
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.id, stream.hostAvatarId))
      .limit(1);
      
      if (avatar) {
        return {
          ...stream,
          hostUsername: avatar.name,
          hostHandle: avatar.handle,
          hostAvatar: avatar.imageUrl,
          hostExpertise: avatar.expertise,
          isKnowledgeAvatar: true,
          isVerified: avatar.verificationStatus === 'verified',
        };
      }
    }
    
    const host = await storage.getUser(stream.hostId);
    return {
      ...stream,
      hostUsername: host?.username || 'Anonymous',
      hostAvatar: host?.avatar,
      isKnowledgeAvatar: false,
      isVerified: false,
    };
  }

  // Get past/ended streams
  app.get("/api/streams/ended", asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;
    
    try {
      const streams = await db.select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        streamType: liveStreams.streamType,
        hostId: liveStreams.hostId,
        hostAvatarId: liveStreams.hostAvatarId,
        status: liveStreams.status,
        currentViewers: liveStreams.currentViewers,
        peakViewers: liveStreams.peakViewers,
        totalTipsReceived: liveStreams.totalTipsReceived,
        category: liveStreams.category,
        tags: liveStreams.tags,
        actualStart: liveStreams.actualStart,
        actualEnd: liveStreams.actualEnd,
        durationSeconds: liveStreams.durationSeconds,
        thumbnailUrl: liveStreams.thumbnailUrl,
        createdAt: liveStreams.createdAt,
      })
      .from(liveStreams)
      .where(eq(liveStreams.status, 'ended'))
      .orderBy(desc(liveStreams.actualEnd))
      .limit(Number(limit));
      
      const enrichedStreams = await Promise.all(streams.map(enrichStreamWithHostInfo));
      
      res.json({ success: true, streams: enrichedStreams });
    } catch (error: any) {
      res.json({ success: true, streams: [] });
    }
  }));

  // Get all streams (for browse page)
  app.get("/api/streams", asyncHandler(async (req: Request, res: Response) => {
    const { type, status, limit = 50 } = req.query;
    
    try {
      const streams = await db.select()
        .from(liveStreams)
        .orderBy(desc(liveStreams.createdAt))
        .limit(Number(limit));
      
      const enrichedStreams = await Promise.all(streams.map(enrichStreamWithHostInfo));
      
      res.json({ success: true, streams: enrichedStreams });
    } catch (error: any) {
      res.json({ success: true, streams: [] });
    }
  }));

  // Get stream replays (VOD) - includes completed debates
  // IMPORTANT: Must be defined BEFORE /api/streams/:id to avoid route conflict
  app.get("/api/streams/replays", asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const typeFilter = req.query.type as string;
      const sortBy = req.query.sort as string || 'recent';
      
      // Get completed debates from database
      const completedDebates = await db.select({
        id: scheduledDebates.id,
        topic: scheduledDebates.topic,
        avatar1Id: scheduledDebates.avatar1Id,
        avatar2Id: scheduledDebates.avatar2Id,
        actualStartTime: scheduledDebates.actualStartTime,
        endTime: scheduledDebates.endTime,
        totalViewers: scheduledDebates.totalViewers,
        exchanges: scheduledDebates.exchanges,
      })
        .from(scheduledDebates)
        .where(eq(scheduledDebates.status, 'completed'))
        .orderBy(desc(scheduledDebates.endTime))
        .limit(limit);

      // Get avatar details for debates
      const debateRecordings = await Promise.all(completedDebates.map(async (debate) => {
        const [avatar1, avatar2] = await Promise.all([
          db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, debate.avatar1Id)).limit(1),
          db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, debate.avatar2Id)).limit(1),
        ]);

        const exchangeCount = Array.isArray(debate.exchanges) ? debate.exchanges.length : 0;
        const estimatedDurationSeconds = exchangeCount * 30;

        return {
          id: debate.id,
          streamId: debate.id,
          title: debate.topic,
          description: `AI Debate between ${avatar1[0]?.name || 'Unknown'} and ${avatar2[0]?.name || 'Unknown'}`,
          streamType: 'debate',
          hostUsername: avatar1[0]?.name || 'AI Avatar',
          hostAvatar: avatar1[0]?.avatarUrl,
          duration: estimatedDurationSeconds > 0 ? estimatedDurationSeconds : 60,
          viewCount: debate.totalViewers || 0,
          thumbnailUrl: null,
          recordedAt: debate.endTime || debate.actualStartTime || new Date().toISOString(),
          category: 'AI Debates',
          tags: ['ai', 'debate', 'avatar'],
          exchanges: debate.exchanges,
          avatar1: avatar1[0],
          avatar2: avatar2[0],
        };
      }));

      // Also get regular stream replays
      const regularReplays = await enhancedStreamingService.getStreamReplays(limit);
      
      // Combine and format regular replays
      const formattedReplays = regularReplays.map((replay: any) => ({
        id: replay.id,
        streamId: replay.id,
        title: replay.title,
        description: replay.description,
        streamType: replay.streamType || 'creator_broadcast',
        hostUsername: replay.hostUsername || 'Unknown',
        hostAvatar: replay.hostAvatar,
        duration: replay.duration || 0,
        viewCount: replay.viewCount || 0,
        thumbnailUrl: replay.thumbnailUrl,
        recordedAt: replay.recordedAt || replay.endedAt,
        category: replay.category,
        tags: replay.tags,
      }));

      // Combine all recordings
      let allRecordings = [...debateRecordings, ...formattedReplays];

      // Filter by type if specified
      if (typeFilter && typeFilter !== 'all') {
        allRecordings = allRecordings.filter(r => r.streamType === typeFilter);
      }

      // Sort recordings
      if (sortBy === 'views') {
        allRecordings.sort((a, b) => b.viewCount - a.viewCount);
      } else if (sortBy === 'duration') {
        allRecordings.sort((a, b) => b.duration - a.duration);
      } else {
        // Default: sort by recordedAt date descending
        allRecordings.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      }

      res.json({ success: true, recordings: allRecordings });
    } catch (error: any) {
      console.error('[Replays] Error fetching replays:', error);
      res.json({ success: true, recordings: [] });
    }
  }));

  // Get single stream details
  app.get("/api/streams/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }
      
      // Get participant count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(streamParticipants)
        .where(and(
          eq(streamParticipants.streamId, stream.id),
          eq(streamParticipants.isActive, true)
        ));
      
      // Enrich with Knowledge Avatar or user info
      const enrichedStream = await enrichStreamWithHostInfo(stream);
      
      res.json({ 
        success: true, 
        stream: {
          ...enrichedStream,
          participantCount: Number(count),
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Create a new stream
  app.post("/api/streams", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { title, description, streamType, category, tags, scheduledStart, linkedBountyId, linkedMarketId, isPrivate, ticketPrice } = req.body;
    
    if (!title || !streamType) {
      return res.status(400).json({ success: false, error: 'Title and stream type are required' });
    }
    
    const roomId = `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [newStream] = await db.insert(liveStreams).values({
      title,
      description,
      streamType,
      hostId: req.user.id,
      status: scheduledStart ? 'scheduled' : 'live',
      category,
      tags,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      actualStart: scheduledStart ? null : new Date(),
      linkedBountyId,
      linkedMarketId,
      isPrivate: isPrivate || false,
      ticketPrice: ticketPrice || 0,
      roomId,
    }).returning();
    
    // Add host as participant
    await db.insert(streamParticipants).values({
      streamId: newStream.id,
      userId: req.user.id,
      role: 'host',
      isActive: true,
    });

    // If stream is going live immediately, notify followers AND all subscribed users
    if (!scheduledStart) {
      try {
        const { pushNotificationService } = await import('../services/pushNotificationService');
        const streamerName = req.user.username || 'Creator';
        
        // Notify followers specifically
        pushNotificationService.notifyFollowersStreamLive(
          req.user.id,
          streamerName,
          title,
          streamType as 'broadcast' | 'trading_room' | 'crypto_space' | 'live_bounty',
          newStream.id,
          req.user.avatar
        ).catch(err => console.error('🔔 Error notifying followers of stream:', err));
        
        // Also broadcast to ALL users with stream_live notifications enabled
        pushNotificationService.sendToAll({
          title: `📺 @${streamerName} went live!`,
          body: title.length > 60 ? title.substring(0, 57) + '...' : title,
          url: `/stream/${newStream.id}`,
          tag: `stream-live-${newStream.id}`,
          requireInteraction: true,
        }, 'stream_live').catch(err => console.error('🔔 Error broadcasting stream live:', err));
      } catch (error) {
        console.error('🔔 Error importing push service:', error);
      }
    }
    
    res.json({ success: true, stream: newStream });
  }));

  // Generate LiveKit token for stream
  app.post("/api/streams/:id/token", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const streamId = req.params.id;
    const { AccessToken } = await import('livekit-server-sdk');
    
    // Check if stream exists
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId))
      .limit(1);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }
    
    const isHost = stream.hostId === req.user.id;
    const roomName = stream.roomId || `stream_${streamId}`;
    
    // Create LiveKit access token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    
    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ success: false, error: 'LiveKit not configured' });
    }
    
    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.user.id,
      name: req.user.username || 'Anonymous',
      ttl: '4h',
    });
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isHost,
      canSubscribe: true,
      canPublishData: true,
    });
    
    const token = await at.toJwt();
    
    res.json({ 
      success: true, 
      token,
      wsUrl,
      roomName,
      isHost,
    });
  }));

  // Start a scheduled stream
  app.post("/api/streams/:id/start", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, req.params.id))
      .limit(1);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }
    
    if (stream.hostId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the host can start the stream' });
    }
    
    const [updatedStream] = await db.update(liveStreams)
      .set({
        status: 'live',
        actualStart: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, req.params.id))
      .returning();

    // Notify followers that the scheduled stream is now live AND broadcast to all users
    try {
      const { pushNotificationService } = await import('../services/pushNotificationService');
      const streamerName = req.user.username || 'Creator';
      
      // Notify followers specifically
      pushNotificationService.notifyFollowersStreamLive(
        req.user.id,
        streamerName,
        stream.title,
        stream.streamType as 'broadcast' | 'trading_room' | 'crypto_space' | 'live_bounty',
        stream.id,
        req.user.avatar
      ).catch(err => console.error('🔔 Error notifying followers of stream start:', err));
      
      // Also broadcast to ALL users with stream_live notifications enabled
      pushNotificationService.sendToAll({
        title: `📺 @${streamerName} went live!`,
        body: stream.title.length > 60 ? stream.title.substring(0, 57) + '...' : stream.title,
        url: `/stream/${stream.id}`,
        tag: `stream-live-${stream.id}`,
        requireInteraction: true,
      }, 'stream_live').catch(err => console.error('🔔 Error broadcasting stream live:', err));
    } catch (error) {
      console.error('🔔 Error importing push service:', error);
    }
    
    res.json({ success: true, stream: updatedStream });
  }));

  // End a stream
  app.post("/api/streams/:id/end", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, req.params.id))
      .limit(1);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }
    
    if (stream.hostId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the host can end the stream' });
    }
    
    // Use streamingService.endStream() to properly end the stream and create recording
    try {
      const { getStreamingService } = await import('../services/streamingService');
      const streamingService = getStreamingService();
      const endedViaService = await streamingService.endStream(req.params.id, req.user.id);
      
      if (endedViaService) {
        // Streaming service handled everything including recording creation
        const [updatedStream] = await db.select()
          .from(liveStreams)
          .where(eq(liveStreams.id, req.params.id))
          .limit(1);
        
        // Mark all participants as inactive
        await db.update(streamParticipants)
          .set({ isActive: false, leftAt: new Date() })
          .where(eq(streamParticipants.streamId, req.params.id));
        
        return res.json({ success: true, stream: updatedStream });
      }
    } catch (error) {
      console.error('[Routes] Error ending stream via service:', error);
    }
    
    // Fallback: update database directly if streaming service fails
    const actualEnd = new Date();
    const durationSeconds = stream.actualStart 
      ? Math.floor((actualEnd.getTime() - new Date(stream.actualStart).getTime()) / 1000)
      : 0;
    
    const [updatedStream] = await db.update(liveStreams)
      .set({
        status: 'ended',
        actualEnd,
        durationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, req.params.id))
      .returning();
    
    // Mark all participants as inactive
    await db.update(streamParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(eq(streamParticipants.streamId, req.params.id));
    
    // Create recording for replays in the fallback path too
    try {
      await db.insert(streamRecordings).values({
        streamId: req.params.id,
        recordingUrl: `/api/streams/${req.params.id}/replay`,
        thumbnailUrl: stream.thumbnailUrl || null,
        durationSeconds,
        status: 'ready',
      });
      console.log(`[Routes] 📹 Created replay recording for stream ${req.params.id.slice(0, 8)}...`);
    } catch (recordingError) {
      console.error('[Routes] Error creating stream recording:', recordingError);
    }
    
    res.json({ success: true, stream: updatedStream });
  }));

  // Join a stream
  app.post("/api/streams/:id/join", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, req.params.id))
      .limit(1);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({ success: false, error: 'Stream is not live' });
    }
    
    // Check if already a participant
    const [existing] = await db.select()
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.streamId, req.params.id),
        eq(streamParticipants.userId, req.user.id)
      ))
      .limit(1);
    
    if (existing) {
      // Reactivate if exists
      await db.update(streamParticipants)
        .set({ isActive: true, leftAt: null })
        .where(eq(streamParticipants.id, existing.id));
    } else {
      // Create new participant
      await db.insert(streamParticipants).values({
        streamId: req.params.id,
        userId: req.user.id,
        role: 'viewer',
        isActive: true,
      });
    }
    
    // Update viewer count
    await db.update(liveStreams)
      .set({
        currentViewers: sql`${liveStreams.currentViewers} + 1`,
        totalViews: sql`${liveStreams.totalViews} + 1`,
        peakViewers: sql`GREATEST(${liveStreams.peakViewers}, ${liveStreams.currentViewers} + 1)`,
      })
      .where(eq(liveStreams.id, req.params.id));
    
    res.json({ success: true, roomId: stream.roomId });
  }));

  // Leave a stream
  app.post("/api/streams/:id/leave", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    await db.update(streamParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(and(
        eq(streamParticipants.streamId, req.params.id),
        eq(streamParticipants.userId, req.user.id)
      ));
    
    // Update viewer count
    await db.update(liveStreams)
      .set({
        currentViewers: sql`GREATEST(${liveStreams.currentViewers} - 1, 0)`,
      })
      .where(eq(liveStreams.id, req.params.id));
    
    res.json({ success: true });
  }));

  // Send a tip to streamer
  app.post("/api/streams/:id/tip", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { amount, message, isHighlighted } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid tip amount' });
    }
    
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, req.params.id))
      .limit(1);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }
    
    // Deduct from tipper using pointsService
    const spendResult = await pointsService.spendPoints({
      userId: req.user.id,
      amount,
      source: 'tip_sent',
      description: `Tipped ${amount} STREAM to stream host`,
      referenceId: req.params.id,
      referenceType: 'stream_tip',
      metadata: { recipientId: stream.hostId, message }
    });
    
    if (!spendResult.success) {
      return res.status(400).json({ success: false, error: spendResult.error || 'Insufficient STREAM points' });
    }
    
    // Award to streamer using pointsService
    await pointsService.awardPoints({
      userId: stream.hostId,
      amount,
      source: 'tip_received',
      description: `Received ${amount} STREAM tip from viewer`,
      referenceId: req.params.id,
      referenceType: 'stream_tip',
      metadata: { tipperId: req.user.id, message }
    });
    
    // Record the tip
    const [tip] = await db.insert(streamTips).values({
      streamId: req.params.id,
      tipperId: req.user.id,
      recipientId: stream.hostId,
      amount,
      message,
      isHighlighted: isHighlighted || false,
    }).returning();
    
    // Update stream tip total
    await db.update(liveStreams)
      .set({ totalTipsReceived: sql`${liveStreams.totalTipsReceived} + ${amount}` })
      .where(eq(liveStreams.id, req.params.id));
    
    res.json({ success: true, tip });
  }));

  // Get stream messages/chat
  app.get("/api/streams/:id/messages", asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50, before } = req.query;
    
    try {
      let query = db.select({
        id: streamMessages.id,
        userId: streamMessages.userId,
        content: streamMessages.content,
        messageType: streamMessages.messageType,
        metadata: streamMessages.metadata,
        isPinned: streamMessages.isPinned,
        reactions: streamMessages.reactions,
        createdAt: streamMessages.createdAt,
      })
      .from(streamMessages)
      .where(and(
        eq(streamMessages.streamId, req.params.id),
        eq(streamMessages.isDeleted, false)
      ))
      .orderBy(desc(streamMessages.createdAt))
      .limit(Number(limit));
      
      const messages = await query;
      
      // Enrich with user info
      const enrichedMessages = await Promise.all(messages.map(async (msg) => {
        const user = await storage.getUser(msg.userId);
        return {
          ...msg,
          username: user?.username,
          userAvatar: user?.avatar,
        };
      }));
      
      res.json({ success: true, messages: enrichedMessages.reverse() });
    } catch (error: any) {
      res.json({ success: true, messages: [] });
    }
  }));

  // Send a message to stream
  app.post("/api/streams/:id/messages", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { content, messageType = 'chat', metadata } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }
    
    const [message] = await db.insert(streamMessages).values({
      streamId: req.params.id,
      userId: req.user.id,
      content: content.trim(),
      messageType,
      metadata,
    }).returning();
    
    // Update stream message count
    await db.update(liveStreams)
      .set({ totalMessages: sql`${liveStreams.totalMessages} + 1` })
      .where(eq(liveStreams.id, req.params.id));
    
    const user = await storage.getUser(req.user.id);
    
    res.json({ 
      success: true, 
      message: {
        ...message,
        username: user?.username,
        userAvatar: user?.avatar,
      }
    });
  }));

  // Submit a prediction during stream
  app.post("/api/streams/:id/predictions", authenticateToken, mediumLimit, validateBody(streamPredictionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { predictionText, confidence, timestamp } = req.body;
    
    if (!predictionText) {
      return res.status(400).json({ success: false, error: 'Prediction text is required' });
    }
    
    const [prediction] = await db.insert(streamPredictions).values({
      streamId: req.params.id,
      predictorId: req.user.id,
      predictionText,
      confidence: confidence || null,
      timestamp: timestamp || null,
    }).returning();
    
    res.json({ success: true, prediction });
  }));

  // Vote on a stream prediction (for market creation)
  app.post("/api/streams/predictions/:id/vote", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { vote } = req.body; // 'up' or 'down'
    
    if (vote === 'up') {
      await db.update(streamPredictions)
        .set({ upvotes: sql`${streamPredictions.upvotes} + 1` })
        .where(eq(streamPredictions.id, req.params.id));
    } else if (vote === 'down') {
      await db.update(streamPredictions)
        .set({ downvotes: sql`${streamPredictions.downvotes} + 1` })
        .where(eq(streamPredictions.id, req.params.id));
    }
    
    res.json({ success: true });
  }));

  // =============================================================================
}
