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

export async function registerLiveStreamingEnhancedRoutes(app: Express): Promise<void> {
  // ENHANCED STREAMING FEATURES (AI Commentary, Highlights, Co-hosting, etc.)
  // =============================================================================

  const { initEnhancedStreamingService } = await import('../services/enhancedStreamingService');
  const enhancedStreamingService = initEnhancedStreamingService();

  // Get live market data overlay for streams
  app.get("/api/streams/:id/market-overlay", asyncHandler(async (req: Request, res: Response) => {
    try {
      const marketData = await enhancedStreamingService.getMarketData(['BTC', 'ETH', 'SOL']);
      res.json({ success: true, marketData });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Start AI market commentary for a stream
  app.post("/api/streams/:id/ai-commentary/start", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, req.params.id))
      .limit(1);
    
    if (!stream || stream.hostId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the host can enable AI commentary' });
    }
    
    const { intervalMinutes = 5 } = req.body;
    const success = await enhancedStreamingService.startAICommentary(req.params.id, intervalMinutes);
    
    res.json({ success, message: success ? 'AI commentary started' : 'Failed to start AI commentary' });
  }));

  // Stop AI market commentary
  app.post("/api/streams/:id/ai-commentary/stop", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    enhancedStreamingService.stopAICommentary(req.params.id);
    res.json({ success: true, message: 'AI commentary stopped' });
  }));

  // Get stream highlights
  app.get("/api/streams/:id/highlights", asyncHandler(async (req: Request, res: Response) => {
    try {
      const highlights = await enhancedStreamingService.extractStreamHighlights(req.params.id);
      res.json({ success: true, highlights });
    } catch (error: any) {
      res.json({ success: true, highlights: [] });
    }
  }));

  // Generate stream summary (VOD)
  app.post("/api/streams/:id/generate-summary", authenticateToken, strictLimit, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const summary = await enhancedStreamingService.generateStreamSummary(req.params.id);
    res.json({ success: !!summary, summary });
  }));

  // Add co-host to stream
  app.post("/api/streams/:id/co-hosts", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { userId: coHostUserId } = req.body;
    if (!coHostUserId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    
    const success = await enhancedStreamingService.addCoHost(req.params.id, req.user.id, coHostUserId);
    res.json({ success, message: success ? 'Co-host added' : 'Failed to add co-host' });
  }));

  // Remove co-host from stream
  app.delete("/api/streams/:id/co-hosts/:userId", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const success = await enhancedStreamingService.removeCoHost(req.params.id, req.user.id, req.params.userId);
    res.json({ success, message: success ? 'Co-host removed' : 'Failed to remove co-host' });
  }));

  // Get co-hosts for a stream
  app.get("/api/streams/:id/co-hosts", asyncHandler(async (req: Request, res: Response) => {
    try {
      const coHosts = await enhancedStreamingService.getCoHosts(req.params.id);
      res.json({ success: true, coHosts });
    } catch (error: any) {
      res.json({ success: true, coHosts: [] });
    }
  }));

  // Toggle screen sharing
  app.post("/api/streams/:id/screen-share", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { isSharing } = req.body;
    const success = await enhancedStreamingService.toggleScreenShare(req.params.id, req.user.id, isSharing);
    res.json({ success });
  }));

  // Test TTS with minimal cost (short phrases only)
  app.post("/api/streams/test-tts", authenticateToken, requireAdmin, strictLimit, validateBody(testTtsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { AvatarVoiceService } = await import('../services/avatarVoiceService');
    const { avatarName = 'Vitalik Buterin', maxSegments = 3 } = req.body;
    
    console.log('[API] 🧪 Running TTS test mode...');
    const result = await AvatarVoiceService.runTestMode(avatarName, Math.min(maxSegments, 5));
    
    res.json({ 
      success: result.success, 
      segments: result.segments,
      totalCost: result.totalCost,
      message: result.success 
        ? `Test complete! Generated ${result.segments.length} audio segments.`
        : 'Test failed - check server logs'
    });
  }));

  // Test single TTS phrase with audio response
  app.post("/api/streams/test-tts-audio", authenticateToken, requireAdmin, strictLimit, validateBody(testTtsAudioSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { AvatarVoiceService } = await import('../services/avatarVoiceService');
    const { avatarName = 'Vitalik Buterin', streamId = 'test' } = req.body;
    
    console.log('[API] 🎤 Running single TTS audio test...');
    const result = await AvatarVoiceService.testStreamBroadcast(streamId, avatarName);
    
    res.json({ 
      success: result.success, 
      text: result.text,
      audioBase64: result.audioBase64,
      audioSize: result.audioBase64.length,
      message: result.success 
        ? 'Audio generated successfully! Base64 audio included in response.'
        : 'Audio generation failed - check server logs'
    });
  }));

  // Start a controlled live test stream for mobile testing (5 minutes, 3-4 segments)
  app.post("/api/streams/start-test-stream", authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { AvatarVoiceService } = await import('../services/avatarVoiceService');
    const { getStreamingService } = await import('../services/streamingService');
    const { avatarName = 'Vitalik Buterin', durationMinutes = 5, maxSegments = 4 } = req.body;

    console.log(`[TEST STREAM] 🎙️ Starting controlled test stream with ${avatarName} for ${durationMinutes} minutes`);

    try {
      // Find the avatar or create it if missing (for production deployments without seeded data)
      let [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.name, avatarName))
        .limit(1);

      if (!avatar) {
        console.log(`[TEST STREAM] Avatar "${avatarName}" not found, creating it now...`);
        
        // Default avatar configs for common test avatars
        const avatarConfigs: Record<string, { expertise: string; voice: string; speakingRate: number; personality: string; twitterHandle: string }> = {
          'Vitalik Buterin': {
            expertise: 'Ethereum, Smart Contracts, Decentralization, Blockchain Scalability',
            voice: 'echo',
            speakingRate: 1.0,
            personality: 'Technical visionary focused on decentralization and blockchain innovation',
            twitterHandle: 'VitalikButerin'
          },
          'Elon Musk': {
            expertise: 'Tesla, SpaceX, AI, Cryptocurrency, Dogecoin',
            voice: 'onyx',
            speakingRate: 1.1,
            personality: 'Bold entrepreneur with unconventional views on technology and markets',
            twitterHandle: 'elonmusk'
          },
          'CZ Binance': {
            expertise: 'Cryptocurrency Exchange, BNB, DeFi, Web3 Adoption',
            voice: 'alloy',
            speakingRate: 1.0,
            personality: 'Pragmatic exchange operator focused on crypto adoption',
            twitterHandle: 'caborange'
          }
        };

        const config = avatarConfigs[avatarName] || avatarConfigs['Vitalik Buterin'];
        const handle = avatarName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        const [newAvatar] = await db.insert(knowledgeAvatars).values({
          name: avatarName,
          handle: handle,
          expertise: config.expertise,
          bio: config.personality,
          twitterHandle: config.twitterHandle,
          isActive: true,
          followerCount: 0,
          followingCount: 0,
        }).returning();
        
        avatar = newAvatar;
        console.log(`[TEST STREAM] ✅ Created avatar: ${avatar.name} (${avatar.id})`);
      }

      // Create a live stream
      const [stream] = await db.insert(liveStreams).values({
        title: `🧪 Test Stream: ${avatarName} Live`,
        description: `Controlled test stream with ${avatarName}. Testing voice streaming functionality.`,
        streamType: 'broadcast',
        hostId: avatar.id,
        hostAvatarId: avatar.id,
        status: 'live',
        category: 'crypto',
        tags: ['test', 'voice', 'live', avatarName.toLowerCase().replace(/\s+/g, '-')],
        actualStart: new Date(),
        currentViewers: Math.floor(Math.random() * 50) + 10,
        thumbnailUrl: avatar.imageUrl,
      }).returning();

      console.log(`[TEST STREAM] ✅ Stream created: ${stream.id}`);

      // Initialize WebSocket session
      const streamingService = getStreamingService();
      if (streamingService) {
        await streamingService.createAvatarStreamSession(stream.id);
      }

      // Generate and broadcast test segments in background
      const testPhrases = AvatarVoiceService.TEST_PHRASES;
      let segmentCount = 0;
      const segmentInterval = (durationMinutes * 60 * 1000) / maxSegments;

      const broadcastSegment = async () => {
        if (segmentCount >= maxSegments) {
          // End the stream
          await db.update(liveStreams)
            .set({ status: 'ended', actualEnd: new Date() })
            .where(eq(liveStreams.id, stream.id));
          console.log(`[TEST STREAM] 🏁 Test stream ended after ${segmentCount} segments`);
          return;
        }

        try {
          const phrase = testPhrases[segmentCount % testPhrases.length];
          console.log(`[TEST STREAM] 🎤 Generating segment ${segmentCount + 1}/${maxSegments}: "${phrase}"`);

          const result = await AvatarVoiceService.testStreamBroadcast(stream.id, avatarName);
          
          if (result.success && streamingService) {
            // Broadcast audio to connected clients
            streamingService.broadcastToStream(stream.id, {
              type: 'avatar_audio',
              avatarName,
              text: result.text,
              audioBase64: result.audioBase64,
              timestamp: new Date().toISOString(),
              segmentNumber: segmentCount + 1,
            });
            console.log(`[TEST STREAM] 📡 Broadcast segment ${segmentCount + 1}`);
          }

          segmentCount++;
          setTimeout(broadcastSegment, segmentInterval);
        } catch (error) {
          console.error(`[TEST STREAM] ❌ Error broadcasting segment:`, error);
        }
      };

      // Start broadcasting after a short delay
      setTimeout(broadcastSegment, 3000);

      // Schedule stream end
      setTimeout(async () => {
        await db.update(liveStreams)
          .set({ status: 'ended', actualEnd: new Date() })
          .where(eq(liveStreams.id, stream.id));
        console.log(`[TEST STREAM] ⏰ Test stream auto-ended after ${durationMinutes} minutes`);
      }, durationMinutes * 60 * 1000);

      res.json({
        success: true,
        streamId: stream.id,
        avatarName,
        durationMinutes,
        maxSegments,
        message: `Test stream started! Stream ID: ${stream.id}. Will run for ${durationMinutes} minutes with ${maxSegments} audio segments.`,
        estimatedCost: `~$${(maxSegments * 0.001).toFixed(3)}`,
      });
    } catch (error: any) {
      console.error('[TEST STREAM] ❌ Failed to start test stream:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Stop a test stream early
  app.post("/api/streams/stop-test-stream/:id", authenticateToken, requireAdmin, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    await db.update(liveStreams)
      .set({ status: 'ended', actualEnd: new Date() })
      .where(eq(liveStreams.id, id));
    
    console.log(`[TEST STREAM] 🛑 Test stream ${id} manually stopped`);
    res.json({ success: true, message: 'Test stream stopped' });
  }));

  // Create prediction from stream
  app.post("/api/streams/:id/predictions/create", authenticateToken, mediumLimit, validateBody(streamPredictionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { predictionText, confidence } = req.body;
    if (!predictionText) {
      return res.status(400).json({ success: false, error: 'Prediction text required' });
    }
    
    const predictionId = await enhancedStreamingService.createPredictionFromStream(
      req.params.id,
      req.user.id,
      predictionText,
      confidence
    );
    
    res.json({ success: !!predictionId, predictionId });
  }));

  // Convert stream prediction to market
  app.post("/api/streams/predictions/:predictionId/convert-to-market", authenticateToken, strictLimit, validateBody(convertToMarketSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { deadline } = req.body;
    if (!deadline) {
      return res.status(400).json({ success: false, error: 'Deadline required' });
    }
    
    const marketId = await enhancedStreamingService.convertPredictionToMarket(
      req.params.predictionId,
      req.user.id,
      new Date(deadline)
    );
    
    res.json({ success: !!marketId, marketId });
  }));

  // Get stream stats
  app.get("/api/streams/stats/overview", asyncHandler(async (req: Request, res: Response) => {
    try {
      const [liveCount] = await db.select({ count: sql<number>`count(*)` })
        .from(liveStreams)
        .where(eq(liveStreams.status, 'live'));
      
      const [totalViewers] = await db.select({ sum: sql<number>`COALESCE(SUM(current_viewers), 0)` })
        .from(liveStreams)
        .where(eq(liveStreams.status, 'live'));
      
      const [totalStreams] = await db.select({ count: sql<number>`count(*)` })
        .from(liveStreams);
      
      const [totalTips] = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(streamTips);
      
      res.json({
        success: true,
        stats: {
          liveStreams: Number(liveCount?.count || 0),
          totalViewers: Number(totalViewers?.sum || 0),
          totalStreamsAllTime: Number(totalStreams?.count || 0),
          totalTipsAllTime: Number(totalTips?.sum || 0),
        }
      });
    } catch (error: any) {
      res.json({
        success: true,
        stats: {
          liveStreams: 0,
          totalViewers: 0,
          totalStreamsAllTime: 0,
          totalTipsAllTime: 0,
        }
      });
    }
  }));

  // =============================================================================
  // STREAM CONVERSATION API - Real-time voice conversations between users/avatars
  // =============================================================================

  // Get conversation room info
  app.get("/api/streams/:id/conversation", asyncHandler(async (req: Request, res: Response) => {
    try {
      const { getStreamConversationService } = await import('../services/streamConversationService');
      const conversationService = getStreamConversationService();
      const roomInfo = conversationService.getRoomInfo(req.params.id);
      
      res.json({ 
        success: true, 
        room: roomInfo,
        wsEndpoint: `/ws/conversation?streamId=${req.params.id}`
      });
    } catch (error: any) {
      console.error('[Conversation API] Error getting room info:', error);
      res.json({ success: false, error: error.message });
    }
  }));

  // Transcribe audio (for human speech-to-text)
  app.post("/api/streams/:id/conversation/transcribe", authenticateToken, strictLimit, validateBody(transcribeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
      const { audioBase64 } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: 'Audio data required' });
      }

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      const { getStreamConversationService } = await import('../services/streamConversationService');
      const conversationService = getStreamConversationService();
      const transcription = await conversationService.transcribeAudio(audioBuffer);
      
      res.json({ success: true, text: transcription });
    } catch (error: any) {
      console.error('[Conversation API] Transcription error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // Get conversation history for a stream
  app.get("/api/streams/:id/conversation/history", asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await db.select()
        .from(streamConversationMessages)
        .where(eq(streamConversationMessages.streamId, req.params.id))
        .orderBy(desc(streamConversationMessages.createdAt))
        .limit(limit);
      
      res.json({ 
        success: true, 
        messages: messages.reverse()
      });
    } catch (error: any) {
      console.error('[Conversation API] Error getting history:', error);
      res.json({ success: true, messages: [] });
    }
  }));

  // =============================================================================
  // ENHANCED STREAMING v2 - Polls, Leaderboard, Reminders, Clips, Achievements
  // =============================================================================

  // Get viewer leaderboard for a stream
  app.get("/api/streams/:id/leaderboard", asyncHandler(async (req: Request, res: Response) => {
    try {
      const leaderboard = await db.select({
        rank: streamViewerLeaderboard.rank,
        userId: streamViewerLeaderboard.userId,
        activityScore: streamViewerLeaderboard.activityScore,
        messagesCount: streamViewerLeaderboard.messagesCount,
        reactionsCount: streamViewerLeaderboard.reactionsCount,
        tipsAmount: streamViewerLeaderboard.tipsAmount,
      })
      .from(streamViewerLeaderboard)
      .where(eq(streamViewerLeaderboard.streamId, req.params.id))
      .orderBy(desc(streamViewerLeaderboard.activityScore))
      .limit(10);
      
      const enriched = await Promise.all(leaderboard.map(async (entry, idx) => {
        const user = await storage.getUser(entry.userId);
        return {
          ...entry,
          rank: idx + 1,
          username: user?.username || 'Anonymous',
          avatar: user?.avatar,
        };
      }));
      
      res.json({ success: true, leaderboard: enriched });
    } catch (error: any) {
      res.json({ success: true, leaderboard: [] });
    }
  }));

  // Create a poll for a stream
  app.post("/api/streams/:id/polls", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { question, options, duration = 60 } = req.body;
    
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, error: 'Question and at least 2 options required' });
    }
    
    const pollOptions = options.map((text: string, idx: number) => ({
      id: `opt_${idx}`,
      text,
      votes: 0,
    }));
    
    const endsAt = new Date(Date.now() + duration * 1000);
    
    const [poll] = await db.insert(streamPolls).values({
      streamId: req.params.id,
      creatorId: req.user.id,
      question,
      options: pollOptions,
      duration,
      endsAt,
    }).returning();
    
    res.json({ success: true, poll });
  }));

  // Vote on a poll
  app.post("/api/streams/polls/:pollId/vote", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { optionId } = req.body;
    
    const [poll] = await db.select().from(streamPolls).where(eq(streamPolls.id, req.params.pollId)).limit(1);
    if (!poll || poll.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Poll not found or closed' });
    }
    
    const [existingVote] = await db.select().from(streamPollVotes)
      .where(and(
        eq(streamPollVotes.pollId, req.params.pollId),
        eq(streamPollVotes.voterId, req.user.id)
      )).limit(1);
    
    if (existingVote && !poll.allowMultipleVotes) {
      return res.status(400).json({ success: false, error: 'Already voted' });
    }
    
    await db.insert(streamPollVotes).values({
      pollId: req.params.pollId,
      voterId: req.user.id,
      optionId,
    });
    
    const options = poll.options as any[];
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );
    
    await db.update(streamPolls)
      .set({ 
        options: updatedOptions,
        totalVotes: sql`${streamPolls.totalVotes} + 1`,
      })
      .where(eq(streamPolls.id, req.params.pollId));
    
    res.json({ success: true });
  }));

  // End a poll
  app.post("/api/streams/polls/:pollId/end", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [poll] = await db.select().from(streamPolls).where(eq(streamPolls.id, req.params.pollId)).limit(1);
    if (!poll) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }
    
    const options = poll.options as any[];
    const winner = options.reduce((max, opt) => 
      (opt.votes || 0) > (max.votes || 0) ? opt : max, options[0]
    );
    
    await db.update(streamPolls)
      .set({ 
        status: 'closed',
        endsAt: new Date(),
        winningOptionId: winner.id,
      })
      .where(eq(streamPolls.id, req.params.pollId));
    
    res.json({ success: true });
  }));

  // Get active poll for a stream
  app.get("/api/streams/:id/polls/active", asyncHandler(async (req: Request, res: Response) => {
    try {
      const [poll] = await db.select().from(streamPolls)
        .where(and(
          eq(streamPolls.streamId, req.params.id),
          eq(streamPolls.status, 'active')
        ))
        .orderBy(desc(streamPolls.createdAt))
        .limit(1);
      
      res.json({ success: true, poll: poll || null });
    } catch (error) {
      res.json({ success: true, poll: null });
    }
  }));

  // Set stream reminder
  app.post("/api/streams/:id/remind", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { notifyBefore = 15 } = req.body;
    
    const [existing] = await db.select().from(streamScheduleReminders)
      .where(and(
        eq(streamScheduleReminders.streamId, req.params.id),
        eq(streamScheduleReminders.userId, req.user.id)
      )).limit(1);
    
    if (existing) {
      await db.delete(streamScheduleReminders).where(eq(streamScheduleReminders.id, existing.id));
      return res.json({ success: true, hasReminder: false });
    }
    
    await db.insert(streamScheduleReminders).values({
      streamId: req.params.id,
      userId: req.user.id,
      notifyBefore,
    });
    
    res.json({ success: true, hasReminder: true });
  }));

  // Get scheduled streams
  app.get("/api/streams/scheduled", asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      
      const streams = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.status, 'scheduled'))
        .orderBy(liveStreams.scheduledStart)
        .limit(20);
      
      const enriched = await Promise.all(streams.map(async (stream) => {
        const host = await storage.getUser(stream.hostId);
        let hasReminder = false;
        
        if (userId) {
          const [reminder] = await db.select().from(streamScheduleReminders)
            .where(and(
              eq(streamScheduleReminders.streamId, stream.id),
              eq(streamScheduleReminders.userId, userId)
            )).limit(1);
          hasReminder = !!reminder;
        }
        
        return {
          id: stream.id,
          title: stream.title,
          hostUsername: host?.username || 'Anonymous',
          hostAvatar: host?.avatar,
          scheduledStart: stream.scheduledStart,
          category: stream.category,
          tags: stream.tags,
          hasReminder,
          isAvatarHost: !!stream.hostAvatarId,
        };
      }));
      
      res.json({ success: true, streams: enriched });
    } catch (error) {
      res.json({ success: true, streams: [] });
    }
  }));

  // Create a clip
  app.post("/api/streams/:id/clips", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { title, startTime, duration } = req.body;
    
    const [clip] = await db.insert(streamClips).values({
      streamId: req.params.id,
      creatorId: req.user.id,
      title: title || `Clip from ${new Date().toLocaleTimeString()}`,
      startTime: startTime || 0,
      durationSeconds: duration || 30,
    }).returning();
    
    res.json({ success: true, clip });
  }));

  // Get clips for a stream
  app.get("/api/streams/:id/clips", asyncHandler(async (req: Request, res: Response) => {
    try {
      const clips = await db.select()
        .from(streamClips)
        .where(and(
          eq(streamClips.streamId, req.params.id),
          eq(streamClips.isDeleted, false)
        ))
        .orderBy(desc(streamClips.createdAt))
        .limit(20);
      
      const enriched = await Promise.all(clips.map(async (clip) => {
        const creator = await storage.getUser(clip.creatorId);
        return {
          ...clip,
          creatorUsername: creator?.username || 'Anonymous',
        };
      }));
      
      res.json({ success: true, clips: enriched });
    } catch (error) {
      res.json({ success: true, clips: [] });
    }
  }));

  // Get stream recordings for specific stream (VOD)
  app.get("/api/streams/:id/recordings", asyncHandler(async (req: Request, res: Response) => {
    try {
      const recordings = await db.select()
        .from(streamRecordings)
        .where(and(
          eq(streamRecordings.streamId, req.params.id),
          eq(streamRecordings.status, 'ready')
        ))
        .orderBy(desc(streamRecordings.createdAt))
        .limit(10);
      
      res.json({ success: true, recordings });
    } catch (error) {
      res.json({ success: true, recordings: [] });
    }
  }));

  // Get stream achievements
  app.get("/api/stream-achievements", asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      
      const achievements = await db.select().from(streamAchievements)
        .where(eq(streamAchievements.isActive, true));
      
      if (!userId) {
        return res.json({ success: true, achievements: achievements.map(a => ({
          ...a,
          progress: 0,
          isCompleted: false,
        })) });
      }
      
      const userAchievements = await db.select().from(userStreamAchievements)
        .where(eq(userStreamAchievements.userId, userId));
      
      const merged = achievements.map(achievement => {
        const userProgress = userAchievements.find(ua => ua.achievementId === achievement.id);
        return {
          ...achievement,
          progress: userProgress?.currentProgress || 0,
          target: achievement.targetValue,
          isCompleted: userProgress?.isCompleted || false,
        };
      });
      
      res.json({ success: true, achievements: merged });
    } catch (error) {
      res.json({ success: true, achievements: [] });
    }
  }));

  // Send a reaction
  app.post("/api/streams/:id/reactions", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { emoji, animationType = 'float' } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji required' });
    }
    
    await db.insert(streamReactions).values({
      streamId: req.params.id,
      userId: req.user.id,
      emoji,
      animationType,
      startX: Math.floor(Math.random() * 80) + 10,
    });
    
    res.json({ success: true });
  }));

  // Pin/unpin a message
  app.post("/api/streams/messages/:messageId/pin", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const [message] = await db.select().from(streamMessages)
      .where(eq(streamMessages.id, req.params.messageId)).limit(1);
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    await db.update(streamMessages)
      .set({ isPinned: !message.isPinned })
      .where(eq(streamMessages.id, req.params.messageId));
    
    res.json({ success: true, isPinned: !message.isPinned });
  }));

  // Get pinned messages for a stream
  app.get("/api/streams/:id/messages/pinned", asyncHandler(async (req: Request, res: Response) => {
    try {
      const messages = await db.select()
        .from(streamMessages)
        .where(and(
          eq(streamMessages.streamId, req.params.id),
          eq(streamMessages.isPinned, true),
          eq(streamMessages.isDeleted, false)
        ))
        .orderBy(desc(streamMessages.createdAt))
        .limit(5);
      
      const enriched = await Promise.all(messages.map(async (msg) => {
        const user = await storage.getUser(msg.userId);
        return {
          id: msg.id,
          username: user?.username || 'Anonymous',
          content: msg.content,
          pinnedAt: msg.createdAt,
          isAlpha: msg.messageType === 'alpha' || (msg.content || '').includes('🎯'),
        };
      }));
      
      res.json({ success: true, messages: enriched });
    } catch (error) {
      res.json({ success: true, messages: [] });
    }
  }));

  // Process chat command
  app.post("/api/streams/:id/commands", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { command, input } = req.body;
    
    const [cmd] = await db.select().from(streamChatCommands)
      .where(eq(streamChatCommands.command, command)).limit(1);
    
    if (!cmd || !cmd.isEnabled) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }
    
    let response = '';
    
    switch (cmd.commandType) {
      case 'price_check':
        const symbol = input?.toUpperCase() || 'BTC';
        const marketData = await enhancedStreamingService.getMarketData([symbol]);
        if (marketData.length > 0) {
          const data = marketData[0];
          response = `${symbol}: $${data.price.toLocaleString()} (${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`;
        } else {
          response = `Could not fetch price for ${symbol}`;
        }
        break;
      
      case 'ai_query':
        try {
          const { modelGateway } = await import("../lib/modelGateway");
          const completion = await modelGateway.complete({
            tier: "fast",
            system: "You are a helpful assistant.",
            user: cmd.promptTemplate || 'Provide a brief crypto market insight.',
            maxTokens: 150,
          });
          response = completion.content || 'No insight available';
        } catch (error) {
          response = 'AI is currently unavailable';
        }
        break;
      
      case 'user_stats':
        const user = await storage.getUser(req.user.id);
        response = `Balance: ${(user?.streamPoints || 0).toLocaleString()} STREAM`;
        break;
      
      case 'leaderboard':
        response = 'Check the leaderboard panel to see top chatters!';
        break;
      
      default:
        response = 'Command processed';
    }
    
    await db.insert(streamChatCommandLogs).values({
      commandId: cmd.id,
      streamId: req.params.id,
      userId: req.user.id,
      input,
      response,
    });
    
    res.json({ success: true, response });
  }));

  // Get chat commands
  app.get("/api/stream-commands", asyncHandler(async (req: Request, res: Response) => {
    try {
      const commands = await db.select().from(streamChatCommands)
        .where(eq(streamChatCommands.isEnabled, true));
      res.json({ success: true, commands });
    } catch (error) {
      res.json({ success: true, commands: [] });
    }
  }));

  // =============================================================================
  // AVATAR STREAM ENHANCEMENTS - Polls, Trivia, Watch Parties, Sentiment, etc.
  // =============================================================================
  
  const { avatarStreamEnhancements } = await import('../services/avatarStreamEnhancementsService');

  // Get viewer sentiment for a stream
  app.get("/api/streams/:id/sentiment", asyncHandler(async (req: Request, res: Response) => {
    try {
      const sentiment = await avatarStreamEnhancements.analyzeViewerSentiment(req.params.id);
      res.json({ success: true, sentiment });
    } catch (error: any) {
      res.json({ success: false, error: error.message });
    }
  }));

  // Create a live poll
  app.post("/api/streams/:id/polls", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { question, options, duration } = req.body;
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, error: 'Question and at least 2 options required' });
    }
    
    const poll = avatarStreamEnhancements.createPoll(
      req.params.id,
      question,
      options,
      req.user.id,
      duration || 60
    );
    
    res.json({ success: true, poll: { ...poll, voters: undefined } });
  }));

  // Vote on a poll
  app.post("/api/streams/polls/:pollId/vote", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { optionId } = req.body;
    const success = avatarStreamEnhancements.votePoll(req.params.pollId, optionId, req.user.id);
    
    if (success) {
      const poll = avatarStreamEnhancements.getPollResults(req.params.pollId);
      res.json({ success: true, poll: poll ? { ...poll, voters: undefined } : null });
    } else {
      res.json({ success: false, error: 'Could not vote (already voted or poll closed)' });
    }
  }));

  // Get active polls for a stream
  app.get("/api/streams/:id/polls", asyncHandler(async (req: Request, res: Response) => {
    const polls = avatarStreamEnhancements.getActivePolls(req.params.id);
    res.json({ success: true, polls: polls.map(p => ({ ...p, voters: undefined })) });
  }));

  // Get poll results
  app.get("/api/streams/polls/:pollId/results", asyncHandler(async (req: Request, res: Response) => {
    const poll = avatarStreamEnhancements.getPollResults(req.params.pollId);
    res.json({ success: true, poll: poll ? { ...poll, voters: undefined } : null });
  }));

  // Start a trivia question
  app.post("/api/streams/:id/trivia", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { category } = req.body;
    const trivia = await avatarStreamEnhancements.generateTriviaQuestion(
      req.params.id,
      category || 'general'
    );
    
    if (trivia) {
      res.json({ 
        success: true, 
        trivia: { 
          id: trivia.id, 
          question: trivia.question, 
          options: trivia.options, 
          pointsReward: trivia.pointsReward,
          timeLimit: trivia.timeLimit,
          isActive: trivia.isActive,
        } 
      });
    } else {
      res.json({ success: false, error: 'Could not generate trivia' });
    }
  }));

  // Answer a trivia question
  app.post("/api/streams/trivia/:triviaId/answer", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { answerIndex } = req.body;
    const result = avatarStreamEnhancements.answerTrivia(req.params.triviaId, req.user.id, answerIndex);
    
    if (result) {
      // Award points if correct
      if (result.correct && result.points > 0) {
        await storage.updateUserPoints(req.user.id, result.points);
      }
      res.json({ success: true, ...result });
    } else {
      res.json({ success: false, error: 'Could not submit answer (already answered or trivia closed)' });
    }
  }));

  // Get trivia results
  app.get("/api/streams/trivia/:triviaId/results", asyncHandler(async (req: Request, res: Response) => {
    const trivia = avatarStreamEnhancements.getTriviaResults(req.params.triviaId);
    if (trivia) {
      res.json({ 
        success: true, 
        trivia: {
          id: trivia.id,
          question: trivia.question,
          options: trivia.options,
          correctIndex: trivia.correctIndex,
          pointsReward: trivia.pointsReward,
          isActive: trivia.isActive,
          totalAnswers: trivia.answers.size,
        }
      });
    } else {
      res.json({ success: false, error: 'Trivia not found' });
    }
  }));

  // Create a watch party
  app.post("/api/streams/:id/watch-party", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const user = await storage.getUser(req.user.id);
    const party = avatarStreamEnhancements.createWatchParty(
      req.params.id,
      req.user.id,
      user?.username || 'Anonymous'
    );
    
    res.json({ 
      success: true, 
      partyCode: party.partyCode,
      partyId: party.id,
    });
  }));

  // Join a watch party
  app.post("/api/watch-party/:code/join", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const user = await storage.getUser(req.user.id);
    const party = avatarStreamEnhancements.joinWatchParty(
      req.params.code,
      req.user.id,
      user?.username || 'Anonymous'
    );
    
    if (party) {
      res.json({ 
        success: true, 
        streamId: party.hostStreamId,
        partyCode: party.partyCode,
        memberCount: party.members.size,
      });
    } else {
      res.json({ success: false, error: 'Watch party not found or inactive' });
    }
  }));

  // Leave a watch party
  app.post("/api/watch-party/:code/leave", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    avatarStreamEnhancements.leaveWatchParty(req.params.code, req.user.id);
    res.json({ success: true });
  }));

  // Get watch party info
  app.get("/api/watch-party/:code", asyncHandler(async (req: Request, res: Response) => {
    const party = avatarStreamEnhancements.getWatchParty(req.params.code);
    if (party) {
      res.json({ 
        success: true, 
        party: {
          id: party.id,
          streamId: party.hostStreamId,
          partyCode: party.partyCode,
          memberCount: party.members.size,
          members: Array.from(party.members.entries()).map(([id, m]) => ({ id, username: m.username })),
          syncState: party.syncState,
          isActive: party.isActive,
        }
      });
    } else {
      res.json({ success: false, error: 'Watch party not found' });
    }
  }));

  // Sync watch party playback
  app.post("/api/watch-party/:code/sync", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { position, isPlaying } = req.body;
    avatarStreamEnhancements.syncWatchParty(req.params.code, position || 0, isPlaying ?? true);
    res.json({ success: true });
  }));

  // Start debate mode between two avatars
  app.post("/api/streams/:id/debate/start", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const { avatar1Id, avatar2Id, topic } = req.body;
    if (!avatar1Id || !avatar2Id || !topic) {
      return res.status(400).json({ success: false, error: 'Two avatars and a topic required' });
    }
    
    const session = await avatarStreamEnhancements.startDebateMode(
      req.params.id,
      avatar1Id,
      avatar2Id,
      topic
    );
    
    res.json({ success: true, session: session ? { ...session, exchanges: [] } : null });
  }));

  // Get next debate response
  app.post("/api/streams/:id/debate/next", authenticateToken, strictLimit, validateBody(debateNextSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { previousStatement } = req.body;
    const response = await avatarStreamEnhancements.generateDebateResponse(req.params.id, previousStatement);
    res.json({ success: !!response, response });
  }));

  // End debate mode
  app.post("/api/streams/:id/debate/end", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    avatarStreamEnhancements.endDebateMode(req.params.id);
    res.json({ success: true });
  }));

  // =============================================================================
}
