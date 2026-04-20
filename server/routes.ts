import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, DatabaseStorage } from "./storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import {
  strictLimit,
  mediumLimit,
  signupLimit,
  authLimit,
  requireAdminFlexible,
  disableInProd,
  validateBody,
} from "./middleware/security";
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
} from "./middleware/validationSchemas";
import { cacheService } from "./services/cacheService";
import { StreamProcessor } from "./services/streamProcessor";
import { StreamProcessorV2 } from "./services/streamProcessorV2";
import RebuiltContentProcessor from "./services/rebuiltContentProcessor";
console.log('🔍 DIAGNOSTIC: routes.ts file is being loaded and executed');
import { AIService } from "./services/aiService";
import { Web3Service } from "./services/web3Service";
import { MarketDataService } from "./services/marketDataService";
import { youtubeService } from "./services/youtubeService";
import { PredictiveAnalyticsService } from "./services/predictiveAnalyticsService";
import { onChainAnalyticsService } from "./services/onChainAnalyticsService";
import { duneAnalyticsService } from "./services/duneAnalyticsService";
import { federalReserveService } from "./services/federalReserveService";
import { CorrelationAnalysisService } from "./services/correlationAnalysisService";
import { chartingService } from "./services/chartingService";
import { derivativesAnalyticsService } from "./services/derivativesAnalyticsService";
import { institutionalFlowService } from "./services/institutionalFlowService";
import { RiskAssessmentService } from "./services/riskAssessmentService";
import { CrossMarketSignalService } from "./services/crossMarketSignalService";
import { VolatilityForecastingService } from "./services/volatilityForecastingService";
import { marketEventModelingService } from "./services/marketEventModelingService";
import { patternRecognitionService } from "./services/patternRecognitionService";
import { RecommendationEngine } from "./recommendation-engine";
import { cryptoIntelligenceService } from "./services/cryptoIntelligenceService";
import { macroDataService } from "./services/macroDataService";
import { advancedMarketIntelService } from "./services/advancedMarketIntelService";
import { aiTradingSignalsService } from "./services/aiTradingSignalsService";
import { registerWeb3Routes } from "./web3Routes";
import socialTradingRoutes from "./socialTradingRoutes";
import { bountyHunterService } from "./services/bountyHunterService";
import { qualityScorerService } from "./services/qualityScorerService";
import { trendingService } from "./services/trendingService";
import { autonomousTradingEngine } from "./services/autonomousTradingEngine";
import { pointsService } from "./services/pointsService";
import * as avatarChatService from "./services/avatarChatService";
import { getAvatarPersona } from "./services/avatarTradingPersonas";
import passport from "passport";
import axios from "axios";

// Initialize services
const marketDataService = MarketDataService.getInstance();
const correlationAnalysisService = CorrelationAnalysisService.getInstance();
const riskAssessmentService = RiskAssessmentService.getInstance();
const predictiveAnalyticsService = new PredictiveAnalyticsService(storage as DatabaseStorage);
const recommendationEngine = new RecommendationEngine(storage as DatabaseStorage);
import session from "express-session";
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
  type RecentActivityRequest
} from "./validators";

// SPLIT-ROUTES BEGIN — domain registrars (see scripts/split-routes.ts)
import { ADMIN_USERNAMES, isAdmin, requireAdmin, validateRequest, asyncHandler } from "./routes/_shared";
import { registerAuthRoutes } from "./routes/auth";
import { registerPointsRoutes } from "./routes/points";
import { registerUsersRoutes } from "./routes/users";
import { registerSummariesRoutes } from "./routes/summaries";
import { registerReferralsRoutes } from "./routes/referrals";
import { registerSocialFeedRoutes } from "./routes/social-feed";
import { registerFollowRoutes } from "./routes/follow";
import { registerBountiesRoutes } from "./routes/bounties";
import { registerCollaborationRoutes } from "./routes/collaboration";
import { registerBountyTemplatesRoutes } from "./routes/bounty-templates";
import { registerKnowledgeStackRoutes } from "./routes/knowledge-stack";
import { registerUserNotesRoutes } from "./routes/user-notes";
import { registerChatRoutes } from "./routes/chat";
import { registerTwitterXRoutes } from "./routes/twitter-x";
import { registerTrendingCryptoRoutes } from "./routes/trending-crypto";
import { registerYoutubeRoutes } from "./routes/youtube";
import { registerWaitlistRoutes } from "./routes/waitlist";
import { registerPushNotificationsRoutes } from "./routes/push-notifications";
import { registerPortfolioGoalsRoutes } from "./routes/portfolio-goals";
import { registerPortfolioNewsRoutes } from "./routes/portfolio-news";
import { registerPortfolioCorrelationsRoutes } from "./routes/portfolio-correlations";
import { registerPriceAlertsRoutes } from "./routes/price-alerts";
// SPLIT-ROUTES END

// PHASE2-SPLIT BEGIN — additional domain registrars (see scripts/split-routes-phase2.ts)
import { registerAvatarRoutes } from "./routes/avatar";
import { registerInteractionRoutes } from "./routes/interaction";
import { registerAutonomousTradingEngineRoutes } from "./routes/autonomous-trading-engine";
import { registerStreamProcessingRoutes } from "./routes/stream-processing";
import { registerWeb3AndSocialRoutes } from "./routes/web3-and-social";
import { registerWalletAndRewardsRoutes } from "./routes/wallet-and-rewards";
import { registerPredictiveAnalyticsRoutes } from "./routes/predictive-analytics";
import { registerMarketDataRoutes } from "./routes/market-data";
import { registerChartingRoutes } from "./routes/charting";
import { registerCorrelationAnalysisRoutes } from "./routes/correlation-analysis";
import { registerRiskAssessmentRoutes } from "./routes/risk-assessment";
import { registerOnChainAnalyticsRoutes } from "./routes/on-chain-analytics";
import { registerEconomicCalendarRoutes } from "./routes/economic-calendar";
import { registerFedReserveRoutes } from "./routes/fed-reserve";
import { registerDiagnosticRoutes } from "./routes/diagnostic";
import { registerRealProcessingRoutes } from "./routes/real-processing";
import { registerMarketDataApiRoutes } from "./routes/market-data-api";
import { registerTechAiStocksRoutes } from "./routes/tech-ai-stocks";
import { registerAlphaIntelligenceRoutes } from "./routes/alpha-intelligence";
import { registerBotTradingSimulatorRoutes } from "./routes/bot-trading-simulator";
import { registerWeb3BlockchainRoutes } from "./routes/web3-blockchain";
import { registerSocialTradingPlatformRoutes } from "./routes/social-trading-platform";
import { registerPredictionMarketsRoutes } from "./routes/prediction-markets";
import { registerPredictionLeaguesRoutes } from "./routes/prediction-leagues";
import { registerAiAgentTradingRoutes } from "./routes/ai-agent-trading";
import { registerLiveStreamingRoutes } from "./routes/live-streaming";
import { registerLiveStreamingEnhancedRoutes } from "./routes/live-streaming-enhanced";
import { registerLiveStreamingMonetizationRoutes } from "./routes/live-streaming-monetization";
import { registerLiveStreamingGamificationRoutes } from "./routes/live-streaming-gamification";
import { registerLiveStreamingPortfolioRoutes } from "./routes/live-streaming-portfolio";
import { registerRecommendationsRoutes } from "./routes/recommendations";
import { registerSmartInsightsRoutes } from "./routes/smart-insights";
import { registerVoiceAssistantRoutes } from "./routes/voice-assistant";
import { registerAvatarFeedRoutes } from "./routes/avatar-feed";
import { registerAvatarLeaderboardRoutes } from "./routes/avatar-leaderboard";
// PHASE2-SPLIT END
import { Request, Response } from "express";
import cors from "cors";
import { db } from "./db";
import { 
  predictionMarkets, aiAgents, aiPredictions, aiPositions, aiTrades, users, userInteractions, 
  predictionLeagues, leagueParticipants, leagueTrades, marketTrades, pushSubscriptions, 
  liveStreams, streamParticipants, streamMessages, streamTips, streamPredictions,
  streamPolls, streamPollVotes, streamReactions, streamScheduleReminders, streamClips,
  streamRecordings, streamAchievements, userStreamAchievements, streamChatCommands,
  streamChatCommandLogs, streamViewerLeaderboard, knowledgeAvatars, bounties, summaries,
  avatarTrades as avatarTradesTable, avatarPositions, streamConversationMessages, pointsTransactions, dailyLoginStreak,
  scheduledDebates, botStakes, botSimTrades, botPerformanceSnapshots
} from "../shared/schema";
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";

// Local helpers (validateRequest, asyncHandler, requireAdmin, isAdmin,
// ADMIN_USERNAMES) hoisted to ./routes/_shared.ts during the domain split.





async function seedBotHistoricalTrades() {
  const { seedBotHistoricalTrades: seedAvatarTrades } = await import('./services/botTradingSimulator');
  await seedAvatarTrades();
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('\n🚀 ========== STARTING ROUTE REGISTRATION ==========');
  console.log('📂 Current working directory:', process.cwd());
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('==================================================\n');
  
  // Enable CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true
  }));

  // Configure session for passport
  app.use(session({
    secret: process.env.SESSION_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: SESSION_SECRET environment variable must be set in production.');
      }
      return 'dev-only-session-secret-do-not-use-in-prod';
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // ▶ Auth routes extracted to server/routes/auth.ts
  await registerAuthRoutes(app);
  // ▶ Points routes extracted to server/routes/points.ts
  await registerPointsRoutes(app);
  // ▶ Users routes extracted to server/routes/users.ts
  await registerUsersRoutes(app);
  // ▶ Summaries routes extracted to server/routes/summaries.ts
  await registerSummariesRoutes(app);
  // ▶ Referrals routes extracted to server/routes/referrals.ts
  await registerReferralsRoutes(app);
  // ▶ SocialFeed routes extracted to server/routes/social-feed.ts
  await registerSocialFeedRoutes(app);
  // ▶ Follow routes extracted to server/routes/follow.ts
  await registerFollowRoutes(app);
  // ▶ Bounties routes extracted to server/routes/bounties.ts
  await registerBountiesRoutes(app);
  // ▶ Collaboration routes extracted to server/routes/collaboration.ts
  await registerCollaborationRoutes(app);
  // ▶ BountyTemplates routes extracted to server/routes/bounty-templates.ts
  await registerBountyTemplatesRoutes(app);
  // Alias: spec-defined path /api/avatars/live-leaderboard. Must be registered
  // BEFORE registerAvatarRoutes so the /api/avatars/:handle wildcard there
  // doesn't capture "live-leaderboard" as a handle. Delegates to the same
  // handler used by /api/avatar-leaderboard/live.
  app.get('/api/avatars/live-leaderboard', async (_req, res, next) => {
    try {
      const { computeLeaderboard } = await import('./services/avatarLeaderboardService');
      const rows = await computeLeaderboard();
      res.json({ success: true, leaderboard: rows, generatedAt: new Date().toISOString() });
    } catch (err) { next(err); }
  });
  // ▶ Avatar routes extracted to server/routes/avatar.ts
  await registerAvatarRoutes(app);
  // ▶ Interaction routes extracted to server/routes/interaction.ts
  await registerInteractionRoutes(app);
  // ▶ AutonomousTradingEngine routes extracted to server/routes/autonomous-trading-engine.ts
  await registerAutonomousTradingEngineRoutes(app);
  // ▶ KnowledgeStack routes extracted to server/routes/knowledge-stack.ts
  await registerKnowledgeStackRoutes(app);
  // ▶ UserNotes routes extracted to server/routes/user-notes.ts
  await registerUserNotesRoutes(app);
  // ▶ Chat routes extracted to server/routes/chat.ts
  await registerChatRoutes(app);
  // ▶ StreamProcessing routes extracted to server/routes/stream-processing.ts
  await registerStreamProcessingRoutes(app);
  // ▶ Web3AndSocial routes extracted to server/routes/web3-and-social.ts
  await registerWeb3AndSocialRoutes(app);
  // ▶ TwitterX routes extracted to server/routes/twitter-x.ts
  await registerTwitterXRoutes(app);
  // ▶ TrendingCrypto routes extracted to server/routes/trending-crypto.ts
  await registerTrendingCryptoRoutes(app);
  // ▶ Youtube routes extracted to server/routes/youtube.ts
  await registerYoutubeRoutes(app);
  // ▶ WalletAndRewards routes extracted to server/routes/wallet-and-rewards.ts
  await registerWalletAndRewardsRoutes(app);
  // ▶ PredictiveAnalytics routes extracted to server/routes/predictive-analytics.ts
  await registerPredictiveAnalyticsRoutes(app);
  // ▶ MarketData routes extracted to server/routes/market-data.ts
  await registerMarketDataRoutes(app);
  // ▶ Charting routes extracted to server/routes/charting.ts
  await registerChartingRoutes(app);
  // ▶ CorrelationAnalysis routes extracted to server/routes/correlation-analysis.ts
  await registerCorrelationAnalysisRoutes(app);
  // ▶ RiskAssessment routes extracted to server/routes/risk-assessment.ts
  await registerRiskAssessmentRoutes(app);
  // ▶ OnChainAnalytics routes extracted to server/routes/on-chain-analytics.ts
  await registerOnChainAnalyticsRoutes(app);
  // ▶ EconomicCalendar routes extracted to server/routes/economic-calendar.ts
  await registerEconomicCalendarRoutes(app);
  // ▶ FedReserve routes extracted to server/routes/fed-reserve.ts
  await registerFedReserveRoutes(app);
  // ▶ Diagnostic routes extracted to server/routes/diagnostic.ts
  await registerDiagnosticRoutes(app);
  // ▶ RealProcessing routes extracted to server/routes/real-processing.ts
  await registerRealProcessingRoutes(app);
  // ▶ MarketDataApi routes extracted to server/routes/market-data-api.ts
  await registerMarketDataApiRoutes(app);
  // ▶ TechAiStocks routes extracted to server/routes/tech-ai-stocks.ts
  await registerTechAiStocksRoutes(app);
  // ▶ AlphaIntelligence routes extracted to server/routes/alpha-intelligence.ts
  await registerAlphaIntelligenceRoutes(app);
  // ▶ BotTradingSimulator routes extracted to server/routes/bot-trading-simulator.ts
  await registerBotTradingSimulatorRoutes(app);
  // ▶ Web3Blockchain routes extracted to server/routes/web3-blockchain.ts
  await registerWeb3BlockchainRoutes(app);
  // ▶ SocialTradingPlatform routes extracted to server/routes/social-trading-platform.ts
  await registerSocialTradingPlatformRoutes(app);
  // ▶ PredictionMarkets routes extracted to server/routes/prediction-markets.ts
  await registerPredictionMarketsRoutes(app);
  // ▶ PredictionLeagues routes extracted to server/routes/prediction-leagues.ts
  await registerPredictionLeaguesRoutes(app);
  // ▶ AiAgentTrading routes extracted to server/routes/ai-agent-trading.ts
  await registerAiAgentTradingRoutes(app);

  // Create the HTTP server now that all REST routes are registered.
  // Was previously defined at the end of the bot-trading-simulator section;
  // hoisted here so the websocket setup below can still reference it.
  const httpServer = createServer(app);

  // =============================================================================
  // WEBSOCKET SERVER FOR REAL-TIME UPDATES
  // =============================================================================
  
  // Use noServer: true to handle upgrades manually (before Vite intercepts them)
  const wss = new WebSocketServer({ noServer: true });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('📡 WebSocket client connected to /ws');
    clients.add(ws);
    
    // Send initial stock data
    ws.send(JSON.stringify({
      type: 'initial',
      message: 'Connected to real-time stock updates'
    }));
    
    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('📡 WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Enhanced real-time broadcasting with comprehensive market data
  let lastBroadcastData = {
    stocks: '',
    cryptos: '',
    patterns: '',
    signals: '',
    correlations: '',
    regime: ''
  };

  const broadcastMarketUpdates = async () => {
    if (clients.size === 0) return;
    
    try {
      const marketService = MarketDataService.getInstance();
      
      // Only fetch lightweight market data for broadcasts - skip expensive signal generation
      const [stocks, cryptos] = await Promise.allSettled([
        marketService.getCryptoStocks(),
        marketService.getTopCryptos(12)
      ]);
      
      // Create data hashes to detect changes
      const currentData = {
        stocks: JSON.stringify(stocks.status === 'fulfilled' ? stocks.value : []),
        cryptos: JSON.stringify(cryptos.status === 'fulfilled' ? cryptos.value : []),
        patterns: '[]',
        signals: '[]',
        correlations: '{}',
        regime: '{}'
      };
      
      // Broadcast updates for changed data only
      const updates: any[] = [];
      
      if (currentData.stocks !== lastBroadcastData.stocks && stocks.status === 'fulfilled') {
        updates.push({
          type: 'stockUpdate',
          data: { stocks: stocks.value },
          timestamp: new Date().toISOString()
        });
      }
      
      if (currentData.cryptos !== lastBroadcastData.cryptos && cryptos.status === 'fulfilled') {
        updates.push({
          type: 'cryptoUpdate',
          data: { cryptos: cryptos.value },
          timestamp: new Date().toISOString()
        });
      }
      
      // Note: Pattern, signal, correlation, and regime broadcasts disabled to prevent memory issues
      // These are available on-demand via dedicated API endpoints
      
      // Send updates to all connected clients
      if (updates.length > 0) {
        const broadcastMessage = {
          type: 'marketDataBundle',
          data: { updates },
          timestamp: new Date().toISOString(),
          clientCount: clients.size
        };
        
        const message = JSON.stringify(broadcastMessage);
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
        
        console.log(`📡 Broadcast ${updates.length} market updates to ${clients.size} clients:`, 
          updates.map(u => u.type).join(', '));
        
        // Update last broadcast data
        lastBroadcastData = currentData;
      }
      
    } catch (error) {
      console.error('📡 Error broadcasting market updates:', error);
    }
  };

  // Enhanced volatility alerts broadcasting
  const broadcastVolatilityAlerts = async () => {
    if (clients.size === 0) return;
    
    try {
      const volatilityService = new VolatilityForecastingService();
      const alerts = await volatilityService.getVolatilityAlerts();
      
      if (alerts && alerts.length > 0) {
        const message = JSON.stringify({
          type: 'volatilityAlert',
          data: { alerts },
          timestamp: new Date().toISOString()
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
        
        console.log(`⚡ Broadcast ${alerts.length} volatility alerts to ${clients.size} clients`);
      }
    } catch (error) {
      console.error('⚡ Error broadcasting volatility alerts:', error);
    }
  };
  
  // ▶ Recommendations routes extracted to server/routes/recommendations.ts
  await registerRecommendationsRoutes(app);
  // ▶ Smart Insights (reasoning-chain dashboard backend)
  await registerSmartInsightsRoutes(app);
  // ▶ Voice Assistant (whisper -> gpt-4o-mini -> tts pipeline)
  await registerVoiceAssistantRoutes(app);
  // ▶ Avatar Commentary Feed (Twitter-style live feed of avatar trades)
  registerAvatarFeedRoutes(app);
  registerAvatarLeaderboardRoutes(app);
  
  // ▶ Waitlist routes extracted to server/routes/waitlist.ts
  await registerWaitlistRoutes(app);
  // ▶ PushNotifications routes extracted to server/routes/push-notifications.ts
  await registerPushNotificationsRoutes(app);
  // ▶ LiveStreaming routes extracted to server/routes/live-streaming*.ts
  await registerLiveStreamingRoutes(app);
  await registerLiveStreamingEnhancedRoutes(app);
  await registerLiveStreamingMonetizationRoutes(app);
  await registerLiveStreamingGamificationRoutes(app);
  await registerLiveStreamingPortfolioRoutes(app);

  // ▶ PortfolioGoals routes extracted to server/routes/portfolio-goals.ts
  await registerPortfolioGoalsRoutes(app);
  // ▶ PortfolioNews routes extracted to server/routes/portfolio-news.ts
  await registerPortfolioNewsRoutes(app);
  // ▶ PortfolioCorrelations routes extracted to server/routes/portfolio-correlations.ts
  await registerPortfolioCorrelationsRoutes(app);
  // ▶ PriceAlerts routes extracted to server/routes/price-alerts.ts
  await registerPriceAlertsRoutes(app);
  // =============================================================================
  // COLLABORATION WEBSOCKET SERVER
  // =============================================================================
  
  // Use noServer: true to handle upgrades manually (before Vite intercepts them)
  const collaborationWss = new WebSocketServer({ noServer: true });
  const { CollaborationService } = await import('./services/collaborationService');
  const collaborationService = new CollaborationService(storage as DatabaseStorage);
  
  collaborationWss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const bountyId = url.searchParams.get('bountyId');
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    const avatar = url.searchParams.get('avatar');
    
    if (!bountyId || !userId || !username) {
      ws.close(1008, 'Missing required parameters');
      return;
    }
    
    console.log(`🤝 Collaboration connection for bounty ${bountyId} by user ${username}`);
    
    collaborationService.handleConnection(
      ws,
      userId,
      bountyId,
      username,
      avatar || undefined
    );
  });

  // =============================================================================
  // STREAMING WEBSOCKET SERVER
  // =============================================================================
  
  // Use noServer: true to handle upgrades manually (before Vite intercepts them)
  const streamingWss = new WebSocketServer({ noServer: true });
  const { initStreamingService } = await import('./services/streamingService');
  const streamingService = initStreamingService();
  
  streamingWss.on('connection', (ws: WebSocket, req) => {
    console.log(`🔌 [WS] Stream WebSocket connection attempt received`);
    console.log(`🔌 [WS] Request URL: ${req.url}`);
    console.log(`🔌 [WS] Headers:`, JSON.stringify(req.headers, null, 2));
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const streamId = url.searchParams.get('streamId');
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    const avatar = url.searchParams.get('avatar');
    const isAiAgent = url.searchParams.get('isAiAgent') === 'true';
    
    console.log(`🔌 [WS] Parsed params - streamId: ${streamId}, userId: ${userId}, username: ${username}, isAiAgent: ${isAiAgent}`);
    
    if (!streamId || !userId || !username) {
      console.log(`❌ [WS] Rejecting connection - Missing params: streamId=${!!streamId}, userId=${!!userId}, username=${!!username}`);
      ws.close(1008, 'Missing required parameters');
      return;
    }
    
    console.log(`📺 Stream connection for stream ${streamId} by ${isAiAgent ? 'AI Agent' : 'user'} ${username}`);
    
    streamingService.handleConnection(
      ws,
      streamId,
      userId,
      username,
      avatar || undefined,
      isAiAgent
    );
  });

  // =============================================================================
  // STREAM CONVERSATION WEBSOCKET SERVER (Real-time voice conversations)
  // =============================================================================
  
  const conversationWss = new WebSocketServer({ noServer: true });
  const { getStreamConversationService } = await import('./services/streamConversationService');
  const conversationService = getStreamConversationService();
  
  conversationWss.on('connection', (ws: WebSocket, req) => {
    console.log(`🎙️ [WS] Conversation WebSocket connection attempt received`);
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const streamId = url.searchParams.get('streamId');
    const userId = url.searchParams.get('userId');
    const avatarId = url.searchParams.get('avatarId');
    const role = url.searchParams.get('role') as 'host' | 'co_host' | 'speaker' | 'viewer' || 'viewer';
    const audioPreference = url.searchParams.get('audioPreference') as 'microphone' | 'tts' | 'text_only' || 'text_only';
    
    if (!streamId) {
      console.log(`❌ [WS Conversation] Rejecting connection - Missing streamId`);
      ws.close(1008, 'Missing streamId');
      return;
    }
    
    console.log(`🎙️ Conversation connection for stream ${streamId} by ${avatarId ? 'avatar ' + avatarId : 'user ' + userId}`);
    
    conversationService.handleConnection(
      ws,
      streamId,
      userId || undefined,
      avatarId || undefined,
      role,
      audioPreference
    );
  });

  // =============================================================================
  // ADMIN WEBSOCKET SERVER (Real-time dashboard updates)
  // =============================================================================
  
  const adminWss = new WebSocketServer({ noServer: true });
  const { adminWebSocketService } = await import('./services/adminWebSocketService');
  
  adminWss.on('connection', (ws: WebSocket, req) => {
    console.log(`🔐 [WS] Admin WebSocket connection attempt received`);
    
    // Register the admin connection
    adminWebSocketService.registerConnection(ws);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to admin dashboard real-time updates',
      timestamp: new Date().toISOString()
    }));
  });

  // =============================================================================
  // POINTS WEBSOCKET SERVER (Real-time balance updates)
  // =============================================================================
  
  const pointsWss = new WebSocketServer({ noServer: true });
  const { pointsWebSocketService } = await import('./services/pointsWebSocketService');
  
  pointsWss.on('connection', (ws: WebSocket, req) => {
    console.log(`💰 [WS] Points WebSocket connection attempt received`);
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const token = url.searchParams.get('token');
    
    if (!userId) {
      console.log(`❌ [WS Points] Rejecting connection - Missing userId`);
      ws.close(1008, 'Missing userId');
      return;
    }
    
    // Register the connection for this user
    pointsWebSocketService.registerConnection(userId, ws);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to real-time points updates',
      userId: userId,
      timestamp: new Date().toISOString()
    }));
  });

  // =============================================================================
  // AVATAR FEED WEBSOCKET SERVER (Twitter-style live commentary)
  // =============================================================================

  const avatarFeedWss = new WebSocketServer({ noServer: true });
  const avatarFeedClients = new Set<WebSocket>();
  avatarFeedWss.on('connection', (ws: WebSocket) => {
    avatarFeedClients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    ws.on('close', () => avatarFeedClients.delete(ws));
    ws.on('error', () => avatarFeedClients.delete(ws));
  });
  const { setAvatarFeedBroadcaster, backfillFromRecentTrades } =
    await import('./services/avatarCommentaryService');
  setAvatarFeedBroadcaster((event) => {
    const msg = JSON.stringify(event);
    avatarFeedClients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) {
        try { c.send(msg); } catch {}
      }
    });
  });
  // Seed the feed once at startup if it's empty so investors landing on the
  // page see history immediately (deterministic, no LLM cost).
  backfillFromRecentTrades().catch(() => {});

  // =============================================================================
  // AVATAR LEADERBOARD WEBSOCKET SERVER (live $10K simulator races)
  // =============================================================================
  const leaderboardWss = new WebSocketServer({ noServer: true });
  const leaderboardClients = new Set<WebSocket>();
  const { setLeaderboardBroadcaster, computeLeaderboard, startLeaderboardTicker } =
    await import('./services/avatarLeaderboardService');
  leaderboardWss.on('connection', async (ws: WebSocket) => {
    leaderboardClients.add(ws);
    try {
      const rows = await computeLeaderboard();
      ws.send(JSON.stringify({ type: 'leaderboard_update', payload: rows, timestamp: Date.now() }));
    } catch {}
    ws.on('close', () => leaderboardClients.delete(ws));
    ws.on('error', () => leaderboardClients.delete(ws));
  });
  setLeaderboardBroadcaster((event) => {
    const msg = JSON.stringify(event);
    leaderboardClients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) {
        try { c.send(msg); } catch {}
      }
    });
  });
  // Re-broadcast on a 30s timer so mark-to-market price moves on open
  // positions surface in the leaderboard between trade events.
  startLeaderboardTicker(30_000);

  // =============================================================================
  // PORTFOLIO PRICES WEBSOCKET SERVER (Real-time price updates)
  // =============================================================================
  
  const pricesWss = new WebSocketServer({ noServer: true });
  const priceSubscribers: Map<WebSocket, Set<string>> = new Map();
  
  // Create a price update message with EXACT prices (no random variation)
  const createPriceUpdate = (symbol: string, price: number, priceChange24h: number = 0) => {
    return {
      type: 'price_update',
      symbol,
      price: Number(price.toFixed(2)),
      priceChange24h: Number(priceChange24h.toFixed(2)),
      timestamp: Date.now(),
    };
  };
  
  const broadcastPriceUpdates = async () => {
    if (priceSubscribers.size === 0) return;
    
    const allSymbols = new Set<string>();
    priceSubscribers.forEach((symbols) => {
      symbols.forEach((symbol) => allSymbols.add(symbol));
    });
    
    if (allSymbols.size === 0) return;
    
    // Store real prices with their 24h change
    const priceData: Map<string, { price: number; change24h: number }> = new Map();
    
    // Known crypto symbols that we can look up (expanded list including altcoins)
    const knownCryptoSymbols = [
      'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 
      'ATOM', 'UNI', 'LTC', 'NEAR', 'APT', 'USDC', 'USDT', 'DAI', 'BUSD',
      'HYPE', 'SUI', 'SEI', 'TIA', 'INJ', 'ARB', 'OP', 'PEPE', 'SHIB', 'WIF',
      'BONK', 'JUP', 'ONDO', 'RENDER', 'FET', 'TAO', 'PYTH', 'JTO', 'W', 'ENA',
      'TON', 'NOT', 'AAVE', 'MKR', 'CRV', 'LDO', 'RPL', 'FXS', 'COMP', 'SNX'
    ];
    // Known stock/ETF symbols including crypto-related mining stocks
    const knownStockSymbols = [
      'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 
      'JNJ', 'WMT', 'PG', 'DIS', 'NFLX', 'INTC', 'AMD', 'CRM', 'ORCL', 'IBM', 'UBER',
      'VOO', 'SPY', 'QQQ', 'VTI', 'IWM', 'ARKK', 'ARKB', 'IBIT', 'FBTC', 'GBTC',
      'HUT', 'MARA', 'RIOT', 'COIN', 'CORZ', 'WULF', 'GLXY', 'CLSK', 'BITF', 'IREN',
      'MSTR', 'SQ', 'PYPL', 'HOOD', 'SOFI', 'UPST', 'AFRM'
    ];
    
    try {
      const symbolsArray = Array.from(allSymbols);
      
      // Only process symbols we actually know about
      const cryptoSymbols = symbolsArray.filter(s => knownCryptoSymbols.includes(s.toUpperCase()));
      const stockSymbols = symbolsArray.filter(s => knownStockSymbols.includes(s.toUpperCase()));
      
      // Get crypto prices from cache (populated by the main price sync)
      for (const symbol of cryptoSymbols) {
        try {
          const cached = cacheService.get(`crypto_price_${symbol.toLowerCase()}`);
          if (cached && typeof cached === 'number' && cached > 0) {
            // Get 24h change if available
            const changeKey = `crypto_change24h_${symbol.toLowerCase()}`;
            const change24h = cacheService.get(changeKey) as number || 0;
            priceData.set(symbol.toUpperCase(), { price: cached, change24h });
          }
          // If not in cache, skip this symbol - don't use fallback prices
        } catch {}
      }
      
      // Get stock prices from cache (populated by Finnhub sync)
      for (const symbol of stockSymbols) {
        try {
          const cached = cacheService.get(`stock_price_${symbol.toUpperCase()}`);
          if (cached && typeof cached === 'number' && cached > 0) {
            const changeKey = `stock_change24h_${symbol.toUpperCase()}`;
            const change24h = cacheService.get(changeKey) as number || 0;
            priceData.set(symbol.toUpperCase(), { price: cached, change24h });
          }
          // If not in cache, skip this symbol - don't use fallback prices
        } catch {}
      }
    } catch (error) {
      console.error('💹 [PriceWS] Error fetching prices:', error);
    }
    
    // Only broadcast if we have real data
    if (priceData.size === 0) {
      return;
    }
    
    priceSubscribers.forEach((symbols, ws) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      
      const updates: any[] = [];
      symbols.forEach((symbol) => {
        const data = priceData.get(symbol.toUpperCase());
        // Only send update if we have real cached price data
        if (data) {
          updates.push(createPriceUpdate(symbol.toUpperCase(), data.price, data.change24h));
        }
        // Skip symbols without real price data - don't use $100 fallback
      });
      
      if (updates.length > 0) {
        ws.send(JSON.stringify({
          type: 'batch_update',
          updates,
          timestamp: Date.now(),
        }));
      }
    });
  };
  
  pricesWss.on('connection', (ws: WebSocket, req) => {
    console.log(`💹 [WS] Prices WebSocket connection received`);
    
    priceSubscribers.set(ws, new Set());
    
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to real-time price updates',
      timestamp: new Date().toISOString()
    }));
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe' && Array.isArray(message.symbols)) {
          const symbols = priceSubscribers.get(ws) || new Set();
          message.symbols.forEach((s: string) => symbols.add(s.toUpperCase()));
          priceSubscribers.set(ws, symbols);
          console.log(`💹 [PriceWS] Subscribed to ${message.symbols.length} symbols`);
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            symbols: Array.from(symbols),
            timestamp: Date.now(),
          }));
        } else if (message.type === 'unsubscribe' && Array.isArray(message.symbols)) {
          const symbols = priceSubscribers.get(ws);
          if (symbols) {
            message.symbols.forEach((s: string) => symbols.delete(s.toUpperCase()));
          }
        }
      } catch (error) {
        console.error('💹 [PriceWS] Error parsing message:', error);
      }
    });
    
    ws.on('close', () => {
      priceSubscribers.delete(ws);
      console.log(`💹 [PriceWS] Client disconnected (${priceSubscribers.size} remaining)`);
    });
    
    ws.on('error', () => {
      priceSubscribers.delete(ws);
    });
  });
  
  const priceUpdateInterval = setInterval(broadcastPriceUpdates, 60000); // 60 seconds - reduced for performance
  
  httpServer.on('close', () => {
    clearInterval(priceUpdateInterval);
    priceSubscribers.clear();
  });

  // =============================================================================
  // EXPLICIT WEBSOCKET UPGRADE HANDLING
  // This ensures WebSocket upgrades are handled BEFORE Vite's HMR can intercept them
  // =============================================================================
  
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    console.log(`🔌 [WS Upgrade] Received upgrade request for path: ${pathname}`);
    
    if (pathname === '/ws') {
      console.log(`🔌 [WS Upgrade] Routing to main WebSocket server (/ws)`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/collaborate') {
      console.log(`🔌 [WS Upgrade] Routing to collaboration WebSocket server (/ws/collaborate)`);
      collaborationWss.handleUpgrade(request, socket, head, (ws) => {
        collaborationWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/stream') {
      console.log(`🔌 [WS Upgrade] Routing to streaming WebSocket server (/ws/stream)`);
      streamingWss.handleUpgrade(request, socket, head, (ws) => {
        streamingWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/conversation') {
      console.log(`🔌 [WS Upgrade] Routing to conversation WebSocket server (/ws/conversation)`);
      conversationWss.handleUpgrade(request, socket, head, (ws) => {
        conversationWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/points') {
      console.log(`🔌 [WS Upgrade] Routing to points WebSocket server (/ws/points)`);
      pointsWss.handleUpgrade(request, socket, head, (ws) => {
        pointsWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/prices') {
      console.log(`🔌 [WS Upgrade] Routing to prices WebSocket server (/ws/prices)`);
      pricesWss.handleUpgrade(request, socket, head, (ws) => {
        pricesWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/avatar-feed') {
      console.log(`🔌 [WS Upgrade] Routing to avatar feed WebSocket server (/ws/avatar-feed)`);
      avatarFeedWss.handleUpgrade(request, socket, head, (ws) => {
        avatarFeedWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/avatar-leaderboard') {
      console.log(`🔌 [WS Upgrade] Routing to avatar leaderboard WebSocket server (/ws/avatar-leaderboard)`);
      leaderboardWss.handleUpgrade(request, socket, head, (ws) => {
        leaderboardWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/admin') {
      console.log(`🔌 [WS Upgrade] Routing to admin WebSocket server (/ws/admin)`);
      adminWss.handleUpgrade(request, socket, head, (ws) => {
        adminWss.emit('connection', ws, request);
      });
    } else {
      // Let other upgrade requests pass through (e.g., Vite HMR)
      console.log(`🔌 [WS Upgrade] Unknown path ${pathname}, not handling (may be Vite HMR)`);
    }
  });

  // Start AI Agent Streaming Service
  const { initAIAgentStreamingService } = await import('./services/aiAgentStreamingService');
  const aiStreamingService = initAIAgentStreamingService();
  aiStreamingService.scheduleAIStreams();

  // Start Knowledge Avatar Alpha Streaming Service (text-based chat)
  const { initAvatarAlphaStreamService } = await import('./services/avatarAlphaStreamService');
  const avatarAlphaService = initAvatarAlphaStreamService();
  avatarAlphaService.scheduleAvatarStreams();
  console.log('🎙️ Knowledge Avatar Alpha Streaming Service initialized');

  // Start Autonomous Avatar Voice Streaming Service (with TTS audio)
  const { initAutonomousAvatarStreamService } = await import('./services/autonomousAvatarStreamService');
  const autonomousVoiceService = initAutonomousAvatarStreamService();
  autonomousVoiceService.start();
  console.log('🎤 Autonomous Avatar Voice Streaming Service initialized');

  // Start enhanced real-time updates with multiple intervals
  const marketUpdateInterval = setInterval(broadcastMarketUpdates, 60000); // Every 60 seconds for market data
  const volatilityAlertInterval = setInterval(broadcastVolatilityAlerts, 120000); // Every 2 minutes for volatility alerts
  
  // Cleanup on server close
  httpServer.on('close', () => {
    clearInterval(marketUpdateInterval);
    clearInterval(volatilityAlertInterval);
    clients.clear();
  });
  
  console.log('\n✅ ========== ROUTE REGISTRATION COMPLETE ==========');
  console.log('🎯 All routes and services have been registered successfully');
  console.log('📡 WebSocket servers initialized');
  console.log('🌐 Server ready to accept requests');
  console.log('==================================================\n');

  setTimeout(async () => {
    try {
      const [tradeCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(botSimTrades);
      if (Number(tradeCount?.count || 0) === 0) {
        console.log('[Auto-Seed] No bot trades found, seeding historical data...');
        await seedBotHistoricalTrades();
        console.log('[Auto-Seed] Historical bot trade seeding complete');
      } else {
        console.log(`[Auto-Seed] Bot trades already exist (${tradeCount.count}), skipping seed`);
      }
    } catch (err) {
      console.error('[Auto-Seed] Error during auto-seed:', err);
    }
  }, 5000);

  return httpServer;
}
