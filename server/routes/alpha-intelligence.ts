// ============================================================================
// AlphaIntelligence routes — extracted from server/routes.ts by
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

export async function registerAlphaIntelligenceRoutes(app: Express): Promise<void> {
  // ============================================================
  // ALPHA INTELLIGENCE ENDPOINTS
  // ============================================================

  const { alphaIntelligenceService } = await import('../services/alphaIntelligenceService');

  // Narrative Momentum Tracker
  app.get('/api/alpha/narratives', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getNarrativeMomentum();
      res.json({ success: true, narratives: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch narratives:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch narrative momentum' });
    }
  }));

  // CT Alpha Feed
  app.get('/api/alpha/ct-feed', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getCTAlphaFeed();
      res.json({ success: true, signals: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch CT alpha:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch CT alpha feed' });
    }
  }));

  // Token Unlocks
  app.get('/api/alpha/token-unlocks', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getTokenUnlocks();
      res.json({ success: true, unlocks: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch token unlocks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch token unlocks' });
    }
  }));

  // Airdrop Radar
  app.get('/api/alpha/airdrops', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getAirdropRadar();
      res.json({ success: true, airdrops: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch airdrops:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch airdrop radar' });
    }
  }));

  // Governance Pulse
  app.get('/api/alpha/governance', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getGovernancePulse();
      res.json({ success: true, proposals: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch governance:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch governance pulse' });
    }
  }));

  // VC Wallet Activity
  app.get('/api/alpha/vc-wallets', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getVCWalletActivity();
      res.json({ success: true, activities: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch VC wallets:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch VC wallet activity' });
    }
  }));

  // Exchange Flows
  app.get('/api/alpha/exchange-flows', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getExchangeFlows();
      res.json({ success: true, flows: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch exchange flows:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch exchange flows' });
    }
  }));

  // DEX vs CEX Volume
  app.get('/api/alpha/dex-cex-volume', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getDexCexVolume();
      res.json({ success: true, volumes: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch DEX/CEX volume:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch DEX/CEX volume' });
    }
  }));

  // AI Trade Ideas
  app.get('/api/alpha/trade-ideas', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getAITradeIdeas();
      res.json({ success: true, ideas: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch AI trade ideas:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch AI trade ideas' });
    }
  }));

  // Event Impact Predictions
  app.get('/api/alpha/event-impacts', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getEventImpactPredictions();
      res.json({ success: true, events: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch event impacts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch event impacts' });
    }
  }));

  // Anomaly Detector
  app.get('/api/alpha/anomalies', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getAnomalies();
      res.json({ success: true, anomalies: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch anomalies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch market anomalies' });
    }
  }));

  // Crypto Conferences Calendar
  app.get('/api/alpha/conferences', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await alphaIntelligenceService.getCryptoConferences();
      res.json({ success: true, conferences: data, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to fetch conferences:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch crypto conferences' });
    }
  }));

  // Get trending stories for discover page - now using real crypto content
  app.get('/api/discover/trending', asyncHandler(async (req: Request, res: Response) => {
    const timeFilter = req.query.timeFilter as string || '24h';
    const storyFilter = req.query.storyFilter as string || 'all';
    
    try {
      // Use the same real content from our working Twitter service
      const { twitterService } = await import('../services/twitterService');
      
      // Get real trending content from our working service
      const realTrendingItems = await twitterService.getCombinedContent();
      
      // Transform the real content into the expected story format
      const stories = realTrendingItems
        .filter((item: any) => {
          // Apply story filter
          if (storyFilter === 'twitter') return item.author?.username;
          if (storyFilter === 'news') return item.source && !item.author?.username;
          if (storyFilter === 'youtube') return false; // No YouTube content yet
          return true; // 'all' filter
        })
        .map((item: any, index: number) => ({
          id: `${item.source || 'source'}_${item.id || index}_${Date.now()}_${index}`,
          title: item.text ? item.text.slice(0, 120) + (item.text.length > 120 ? '...' : '') : 
                'Crypto News Update',
          description: item.text || item.description || '',
          source: item.author?.name || item.source || 'Crypto News',
          sourceType: item.author?.username ? 'twitter' as const : 'news' as const,
          engagement: {
            likes: item.public_metrics?.like_count || Math.floor(Math.random() * 200) + 50,
            comments: item.public_metrics?.reply_count || Math.floor(Math.random() * 50) + 10,
            shares: item.public_metrics?.retweet_count || Math.floor(Math.random() * 30) + 5,
            views: Math.floor(Math.random() * 5000) + 1000,
            score: (item.public_metrics?.like_count || 0) * 0.1 + 
                   (item.public_metrics?.retweet_count || 0) * 0.3 + 
                   (item.public_metrics?.reply_count || 0) * 0.2 + 50
          },
          metadata: {
            publishedAt: item.created_at || new Date().toISOString(),
            author: item.author?.name || item.source || 'Crypto Source',
            tags: item.author?.username ? ['twitter', 'crypto', 'social'] : ['news', 'crypto', 'finance'],
            sentiment: 'neutral' as const,
            trendingScore: 85 + index * 2
          },
          url: item.url || '#'
        }))
        .slice(0, 20);

      // Sort by engagement score and trending score
      const sortedStories = stories
        .sort((a, b) => (b.engagement.score + b.metadata.trendingScore) - (a.engagement.score + a.metadata.trendingScore));

      res.json({
        stories: sortedStories,
        count: sortedStories.length,
        timeFilter,
        storyFilter,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch trending stories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending stories',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Enhanced sector data for discover page with comprehensive market coverage
  app.get('/api/market/sectors', asyncHandler(async (req: Request, res: Response) => {
    console.log(`🔍 API Call: GET /api/market/sectors - Query:`, req.query, 'Headers:', req.headers.accept);
    const timeFilter = req.query.timeFilter as string || '24h';
    const marketData = MarketDataService.getInstance();
    
    try {
      // Get comprehensive market data
      const [cryptos, stocks] = await Promise.all([
        marketData.getTopCryptos(100),
        marketData.getCryptoStocks() // Get crypto-related stocks
      ]);
      
      // Enhanced sector mappings with comprehensive coverage
      const cryptoSectorMappings: { [key: string]: string[] } = {
        'DeFi Protocols': ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'YFI', 'CRV', 'SUSHI', 'BAL', 'LDO'],
        'Layer 1 Blockchains': ['BTC', 'ETH', 'ADA', 'SOL', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'ALGO', 'FTM'],
        'Layer 2 & Scaling': ['MATIC', 'OP', 'ARB', 'LRC', 'IMX', 'METIS'],
        'Gaming & Metaverse': ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'ILV', 'ALICE', 'TLM'],
        'AI & Data Oracle': ['FET', 'OCEAN', 'GRT', 'RNDR', 'LPT', 'LINK', 'BAND'],
        'Memecoins': ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI'],
        'Infrastructure': ['BNB', 'CRO', 'FTT', 'LEO', 'OKB', 'KCS'],
        'Privacy Coins': ['XMR', 'ZEC', 'DASH', 'SCRT'],
        'Enterprise Blockchain': ['XRP', 'XLM', 'HBAR', 'VET', 'IOTA']
      };

      const stockSectorMappings: { [key: string]: string[] } = {
        'Crypto Miners': ['MSTR', 'RIOT', 'MARA', 'CLSK', 'HUT', 'BITF', 'BTBT'],
        'Crypto Exchanges': ['COIN', 'HOOD', 'SQ'],
        'Crypto Tech': ['NVDA', 'AMD', 'INTC', 'ORCL'],
        'Fintech & Payments': ['PYPL', 'V', 'MA', 'JPM', 'BAC'],
        'Big Tech': ['GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA']
      };

      const calculateAdvancedSectorMetrics = (assets: any[], sectorName: string) => {
        if (assets.length === 0) {
          return {
            name: sectorName,
            performance: 0,
            volume: 0,
            assets: 0,
            trend: 'stable' as const,
            sentiment: 0.5,
            marketCap: 0,
            momentum: 0,
            volatility: 'low' as const,
            correlation: 0.5
          };
        }

        // Advanced performance calculations
        const performances = assets.map(asset => asset.percentChange24h || 0);
        const avgPerformance = performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
        const totalVolume = assets.reduce((sum, asset) => sum + (asset.volume24h || 0), 0);
        const totalMarketCap = assets.reduce((sum, asset) => sum + (asset.marketCap || 0), 0);
        
        // Calculate momentum (weighted average with volume)
        const momentum = assets.reduce((sum, asset) => {
          const weight = (asset.volume24h || 1) / totalVolume;
          return sum + (asset.percentChange24h || 0) * weight;
        }, 0);
        
        // Calculate volatility score
        const volatilityScore = Math.sqrt(
          performances.reduce((sum, perf) => sum + Math.pow(perf - avgPerformance, 2), 0) / performances.length
        );
        
        const volatility = volatilityScore > 10 ? 'high' : volatilityScore > 5 ? 'medium' : 'low';
        
        // Enhanced trend detection with momentum consideration
        const trendStrength = Math.abs(avgPerformance) + Math.abs(momentum) / 2;
        const trend = avgPerformance > 1.5 && momentum > 0 ? 'up' as const : 
                     avgPerformance < -1.5 && momentum < 0 ? 'down' as const : 'stable' as const;
        
        // Sentiment calculation with multiple factors
        const baseSentiment = Math.max(0, Math.min(1, (avgPerformance + 15) / 30));
        const volumeSentiment = Math.min(1, totalVolume / 1000000000); // Normalize by 1B volume
        const sentiment = (baseSentiment * 0.7 + volumeSentiment * 0.3);
        
        return {
          name: sectorName,
          performance: Number(avgPerformance.toFixed(2)),
          volume: Math.round(totalVolume),
          assets: assets.length,
          trend,
          sentiment: Number(sentiment.toFixed(3)),
          marketCap: Math.round(totalMarketCap),
          momentum: Number(momentum.toFixed(2)),
          volatility,
          correlation: 0.5 + (Math.random() - 0.5) * 0.4 // Placeholder for correlation
        };
      };

      // Calculate crypto sectors
      const cryptoSectors = Object.entries(cryptoSectorMappings).map(([sectorName, symbols]) => {
        const sectorAssets = cryptos.filter(crypto => 
          symbols.includes(crypto.symbol.toUpperCase())
        );
        return calculateAdvancedSectorMetrics(sectorAssets, sectorName);
      });

      // Calculate stock sectors
      const stockSectors = Object.entries(stockSectorMappings).map(([sectorName, symbols]) => {
        const sectorAssets = stocks.filter(stock => 
          symbols.includes(stock.symbol.toUpperCase())
        );
        return calculateAdvancedSectorMetrics(sectorAssets, sectorName);
      });

      // Combine all sectors and sort by performance
      const allSectors = [...cryptoSectors, ...stockSectors]
        .sort((a, b) => Math.abs(b.performance) - Math.abs(a.performance));

      console.log(`📊 Generated sector intelligence for ${allSectors.length} sectors with enhanced metrics`);

      res.json({
        sectors: allSectors,
        timestamp: new Date().toISOString(),
        timeFilter,
        analytics: {
          totalSectors: allSectors.length,
          avgPerformance: allSectors.reduce((sum, s) => sum + s.performance, 0) / allSectors.length,
          bullishSectors: allSectors.filter(s => s.trend === 'up').length,
          bearishSectors: allSectors.filter(s => s.trend === 'down').length,
          topPerformer: allSectors[0]?.name || 'N/A',
          worstPerformer: allSectors[allSectors.length - 1]?.name || 'N/A'
        }
      });
    } catch (error: any) {
      console.error('Failed to fetch enhanced sector data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sector data',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // DERIVATIVES ANALYTICS API ROUTES (Phase 2)
  // =============================================================================

  // Get derivatives market overview
  app.get('/api/derivatives/overview', asyncHandler(async (req: Request, res: Response) => {
    try {
      const overview = await derivativesAnalyticsService.getDerivativesOverview();
      res.json({
        overview,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch derivatives overview:', error);
      res.status(500).json({ 
        error: 'Failed to fetch derivatives overview',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get options data for a specific underlying
  app.get('/api/derivatives/options/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    try {
      const options = await derivativesAnalyticsService.getOptionsData(underlying.toUpperCase());
      res.json({
        options,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch options data for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch options data for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get options flow analysis
  app.get('/api/derivatives/options-flow/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    const timeRange = req.query.timeRange as '1h' | '4h' | '24h' || '24h';
    
    try {
      const optionsFlow = await derivativesAnalyticsService.getOptionsFlow(underlying.toUpperCase(), timeRange);
      res.json({
        flow: optionsFlow,
        underlying: underlying.toUpperCase(),
        timeRange,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch options flow for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch options flow for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get volatility surface
  app.get('/api/derivatives/volatility-surface/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    
    try {
      const volatilitySurface = await derivativesAnalyticsService.getVolatilitySurface(underlying.toUpperCase());
      res.json({
        surface: volatilitySurface,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch volatility surface for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch volatility surface for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get options market sentiment
  app.get('/api/derivatives/options-sentiment/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    
    try {
      const sentiment = await derivativesAnalyticsService.getOptionsMarketSentiment(underlying.toUpperCase());
      res.json({
        sentiment,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch options sentiment for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch options sentiment for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get futures data for a specific underlying
  app.get('/api/derivatives/futures/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    
    try {
      const futures = await derivativesAnalyticsService.getFuturesData(underlying.toUpperCase());
      res.json({
        futures,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch futures data for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch futures data for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get futures positioning data
  app.get('/api/derivatives/futures-positioning/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    
    try {
      const positioning = await derivativesAnalyticsService.getFuturesPositioning(underlying.toUpperCase());
      res.json({
        positioning,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch futures positioning for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch futures positioning for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get liquidation data and heatmap
  app.get('/api/derivatives/liquidations/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    
    try {
      const liquidations = await derivativesAnalyticsService.getLiquidationData(underlying.toUpperCase());
      res.json({
        liquidations,
        underlying: underlying.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Failed to fetch liquidation data for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch liquidation data for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get combined derivatives analytics for discover page
  app.get('/api/derivatives/analytics/:underlying', asyncHandler(async (req: Request, res: Response) => {
    const { underlying } = req.params;
    const symbol = underlying.toUpperCase();
    
    try {
      // Fetch all derivatives data in parallel for better performance
      const [
        optionsData,
        optionsFlow,
        volatilitySurface,
        optionsSentiment,
        futuresData,
        futuresPositioning,
        liquidationData
      ] = await Promise.allSettled([
        derivativesAnalyticsService.getOptionsData(symbol),
        derivativesAnalyticsService.getOptionsFlow(symbol, '24h'),
        derivativesAnalyticsService.getVolatilitySurface(symbol),
        derivativesAnalyticsService.getOptionsMarketSentiment(symbol),
        derivativesAnalyticsService.getFuturesData(symbol),
        derivativesAnalyticsService.getFuturesPositioning(symbol),
        derivativesAnalyticsService.getLiquidationData(symbol)
      ]);

      const analytics = {
        underlying: symbol,
        options: {
          data: optionsData.status === 'fulfilled' ? optionsData.value : [],
          flow: optionsFlow.status === 'fulfilled' ? optionsFlow.value : [],
          volatilitySurface: volatilitySurface.status === 'fulfilled' ? volatilitySurface.value : null,
          sentiment: optionsSentiment.status === 'fulfilled' ? optionsSentiment.value : null
        },
        futures: {
          data: futuresData.status === 'fulfilled' ? futuresData.value : [],
          positioning: futuresPositioning.status === 'fulfilled' ? futuresPositioning.value : null
        },
        liquidations: liquidationData.status === 'fulfilled' ? liquidationData.value : null,
        timestamp: new Date().toISOString()
      };

      res.json(analytics);
    } catch (error: any) {
      console.error(`Failed to fetch derivatives analytics for ${underlying}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch derivatives analytics for ${underlying}`,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // INSTITUTIONAL FLOW TRACKING API ROUTES (Phase 2)
  // =============================================================================

  // Get smart money movements
  app.get('/api/institutional/smart-money', asyncHandler(async (req: Request, res: Response) => {
    const assets = (req.query.assets as string)?.split(',') || ['BTC', 'ETH'];
    const minValue = parseInt(req.query.minValue as string) || 1000000;
    
    console.log(`🧠 API Call: GET /api/institutional/smart-money - Assets: ${assets.join(', ')}, Min Value: $${minValue.toLocaleString()}`);
    
    try {
      const smartMoneyMovements = await institutionalFlowService.getSmartMoneyMovements(assets, minValue);
      
      res.json({
        success: true,
        smartMoneyMovements,
        count: smartMoneyMovements.length,
        assets,
        minValue,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Smart money movements error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch smart money movements',
        smartMoneyMovements: [],
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get institutional fund flows
  app.get('/api/institutional/fund-flows', asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1h' | '24h' | '7d') || '24h';
    
    console.log(`💰 API Call: GET /api/institutional/fund-flows - Timeframe: ${timeframe}`);
    
    try {
      const fundFlows = await institutionalFlowService.getInstitutionalFundFlows(timeframe);
      
      res.json({
        success: true,
        fundFlows,
        count: fundFlows.length,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Institutional fund flows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch institutional fund flows',
        fundFlows: [],
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get institutional sentiment analysis
  app.get('/api/institutional/sentiment', asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d') || '7d';
    
    console.log(`📊 API Call: GET /api/institutional/sentiment - Timeframe: ${timeframe}`);
    
    try {
      const sentiment = await institutionalFlowService.getInstitutionalSentiment(timeframe);
      
      res.json({
        success: true,
        sentiment,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Institutional sentiment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze institutional sentiment',
        sentiment: null,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get institutional positioning for specific assets
  app.get('/api/institutional/positioning', asyncHandler(async (req: Request, res: Response) => {
    const assets = (req.query.assets as string)?.split(',') || ['BTC', 'ETH'];
    
    console.log(`🎯 API Call: GET /api/institutional/positioning - Assets: ${assets.join(', ')}`);
    
    try {
      const positioning = await institutionalFlowService.getInstitutionalPositioning(assets);
      
      res.json({
        success: true,
        positioning,
        assets,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Institutional positioning error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get institutional positioning',
        positioning: [],
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get wallet analysis and categorization
  app.get('/api/institutional/wallet-analysis', asyncHandler(async (req: Request, res: Response) => {
    console.log('🏛️ API Call: GET /api/institutional/wallet-analysis');
    
    try {
      const walletAnalysis = await institutionalFlowService.getWalletAnalysis();
      
      res.json({
        success: true,
        walletAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Wallet analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze institutional wallets',
        walletAnalysis: null,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get comprehensive institutional analytics
  app.get('/api/institutional/overview', asyncHandler(async (req: Request, res: Response) => {
    const timeframe = (req.query.timeframe as '1d' | '7d' | '30d') || '7d';
    const assets = (req.query.assets as string)?.split(',') || ['BTC', 'ETH'];
    
    console.log(`🏛️ API Call: GET /api/institutional/overview - Timeframe: ${timeframe}, Assets: ${assets.join(', ')}`);
    
    try {
      const [smartMoney, fundFlows, sentiment, positioning, walletAnalysis] = await Promise.allSettled([
        institutionalFlowService.getSmartMoneyMovements(assets),
        institutionalFlowService.getInstitutionalFundFlows(timeframe === '1d' ? '24h' : timeframe),
        institutionalFlowService.getInstitutionalSentiment(timeframe),
        institutionalFlowService.getInstitutionalPositioning(assets),
        institutionalFlowService.getWalletAnalysis()
      ]);

      const overview = {
        smartMoneyMovements: smartMoney.status === 'fulfilled' ? smartMoney.value : [],
        fundFlows: fundFlows.status === 'fulfilled' ? fundFlows.value : [],
        sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
        positioning: positioning.status === 'fulfilled' ? positioning.value : [],
        walletAnalysis: walletAnalysis.status === 'fulfilled' ? walletAnalysis.value : null,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        overview,
        timeframe,
        assets,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Institutional overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch institutional overview',
        overview: null,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get social trending data
  app.get('/api/social/trending', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { twitterService } = await import('../services/twitterService');
      
      // Get prominent crypto users and their recent tweets
      const [prominentUsers, trendingTweets] = await Promise.all([
        Promise.resolve(twitterService.getCryptoInfluencers().slice(0, 10)),
        twitterService.getCryptoInfluencerTweets()
      ]);

      // Calculate social metrics
      const socialMetrics = {
        totalEngagement: trendingTweets.reduce((sum: number, tweet: any) => 
          sum + (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.reply_count || 0) + (tweet.public_metrics?.retweet_count || 0), 0),
        activeUsers: prominentUsers.length,
        trending: trendingTweets.slice(0, 5).map((tweet: any) => ({
          text: tweet.text.slice(0, 80) + '...',
          author: tweet.author?.username || 'unknown',
          engagement: (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.reply_count || 0) + (tweet.public_metrics?.retweet_count || 0)
        }))
      };

      res.json({
        metrics: socialMetrics,
        prominentUsers: prominentUsers.slice(0, 5),
        trendingContent: trendingTweets.slice(0, 10),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch social trending data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch social trending data',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // PHASE 3: USER INTEREST CALCULATION UTILITY
  // =============================================================================
  
  interface UserInterests {
    sectors: Record<string, number>;
    contentTypes: Record<string, number>;
    topics: Record<string, number>;
  }

  function calculateUserInterests(interactions: any[]): UserInterests {
    const interests: UserInterests = {
      sectors: {},
      contentTypes: {},
      topics: {}
    };

    // Weight recent interactions more heavily
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    interactions.forEach(interaction => {
      const age = now - new Date(interaction.createdAt).getTime();
      const recencyWeight = Math.max(0.1, 1 - (age / maxAge)); // Decay over 7 days

      // Weight different interaction types
      const interactionWeights = {
        'sector_click': 1.0,
        'story_click': 0.8,
        'time_spent': 0.6,
        'filter_change': 0.4,
        'view': 0.2
      };

      const weight = (interactionWeights[interaction.interactionType] || 0.5) * recencyWeight;

      // Track sector interests
      if (interaction.targetType === 'sector' && interaction.targetId) {
        interests.sectors[interaction.targetId] = (interests.sectors[interaction.targetId] || 0) + weight;
      }

      // Track content type interests  
      if (interaction.targetType === 'story' && interaction.metadata?.contentType) {
        const contentType = interaction.metadata.contentType;
        interests.contentTypes[contentType] = (interests.contentTypes[contentType] || 0) + weight;
      }

      // Extract topics from metadata
      if (interaction.metadata?.topics) {
        interaction.metadata.topics.forEach((topic: string) => {
          interests.topics[topic] = (interests.topics[topic] || 0) + weight * 0.5;
        });
      }
    });

    // Normalize scores to 0-1 range
    const normalizeSores = (scores: Record<string, number>) => {
      const max = Math.max(...Object.values(scores), 1);
      Object.keys(scores).forEach(key => {
        scores[key] = scores[key] / max;
      });
    };

    normalizeSores(interests.sectors);
    normalizeSores(interests.contentTypes);
    normalizeSores(interests.topics);

    return interests;
  }

  // =============================================================================
  // PHASE 3: USER INTERACTION TRACKING & PERSONALIZATION APIs
  // =============================================================================
  
  // Track user interactions for personalization
  app.post('/api/interactions/track', asyncHandler(async (req: Request, res: Response) => {
    const storage = new DatabaseStorage();
    const { interactionType, targetType, targetId, metadata } = req.body;
    
    // Get user ID from session/auth
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const interaction = await storage.createUserInteraction({
        userId,
        summaryId: targetType === 'summary' ? targetId : undefined,
        interactionType,
        targetType,
        targetId,
        metadata: metadata || {}
      });

      console.log(`📊 Tracked interaction: ${userId} ${interactionType} ${targetType}:${targetId}`);
      res.json({ success: true, interactionId: interaction.id });
    } catch (error) {
      console.error('❌ Interaction tracking error:', error);
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  }));

  // Get personalized discover feed
  app.get('/api/discover/personalized', asyncHandler(async (req: Request, res: Response) => {
    const storage = new DatabaseStorage();
    const timeFilter = req.query.timeFilter as string || '24h';
    const userId = req.session?.user?.id;

    try {
      // Get base data (same as regular discover)
      const marketData = MarketDataService.getInstance();
      const [marketOverview, trendingData, sectorsData] = await Promise.all([
        marketData.getTopCryptos(25),
        marketData.getTrendingContent(timeFilter),
        marketData.getSectorPerformance(timeFilter)
      ]);

      let responseData = {
        market: {
          movers: marketOverview.slice(0, 6).map(crypto => ({
            symbol: crypto.symbol,
            name: crypto.name,
            price: crypto.currentPrice,
            change24h: crypto.percentChange24h,
            volume: crypto.volume24h,
            momentum: crypto.percentChange24h > 5 ? 'strong_up' : 
                     crypto.percentChange24h > 0 ? 'up' : 
                     crypto.percentChange24h < -5 ? 'strong_down' : 'down'
          }))
        },
        trending: trendingData,
        sectors: sectorsData,
        personalized: !!userId,
        timestamp: new Date().toISOString()
      };

      // If user is authenticated, apply personalization
      if (userId) {
        const interactions = await storage.getUserInteractions(userId, { limit: 50 });
        const interests = calculateUserInterests(interactions);
        
        // Rerank sectors based on user interactions
        if (interests.sectors && Object.keys(interests.sectors).length > 0) {
          responseData.sectors.sectors = responseData.sectors.sectors.sort((a: any, b: any) => {
            const aScore = interests.sectors[a.name] || 0;
            const bScore = interests.sectors[b.name] || 0;
            return bScore - aScore;
          });
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error('❌ Personalized discover error:', error);
      // Fallback to regular discover endpoint
      const marketData = MarketDataService.getInstance();
      const fallbackData = await marketData.getTopCryptos(6);
      res.json({
        market: { movers: fallbackData },
        trending: { stories: [] },
        sectors: { sectors: [] },
        personalized: false,
        error: 'Personalization unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // =============================================================================
  // VOLATILITY FORECASTING AND STRESS MONITORING ROUTES - Phase 3 Feature
  // =============================================================================

  // Get volatility forecasting dashboard data
  app.get('/api/volatility-forecasting/dashboard', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('📊 Getting volatility forecasting dashboard...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      // Get comprehensive dashboard data
      const [
        stressIndicators,
        riskRegime,
        crisisIndicators,
        activeAlerts
      ] = await Promise.all([
        volatilityForecastingService.getStressIndicators(),
        volatilityForecastingService.analyzeRiskRegime(),
        volatilityForecastingService.detectCrisisIndicators(),
        volatilityForecastingService.getVolatilityAlerts()
      ]);
      
      // Calculate summary metrics
      const overallStressLevel = Math.floor(
        stressIndicators.reduce((sum, indicator) => sum + indicator.normalizedValue, 0) / stressIndicators.length
      );
      
      const highestCrisisProbability = Math.max(
        ...crisisIndicators.map(indicator => indicator.probability),
        0
      );

      const dashboard = {
        summary: {
          overallStressLevel,
          activeRegime: riskRegime.regime,
          regimeConfidence: riskRegime.confidence,
          highestCrisisProbability,
          activeAlerts: activeAlerts.length,
          totalForecasts: 15 // Mock number of assets being forecasted
        },
        stressIndicators,
        riskRegime,
        crisisIndicators,
        activeAlerts,
        marketContext: {
          overallVolatility: 42,
          correlationLevel: 0.65,
          liquidityConditions: 'normal',
          sentimentScore: 0.25
        },
        recommendations: {
          positionSizing: riskRegime.implications.positionSizing >= 1.0 ? 'Normal sizing' : 'Reduced sizing recommended',
          hedgingStrategy: overallStressLevel > 60 ? 'Implement hedging' : 'Monitor conditions',
          monitoringPriorities: [
            'Watch VIX levels',
            'Monitor credit spreads',
            'Track correlation breakdown'
          ],
          riskManagement: [
            'Review stop-loss levels',
            'Consider position diversification',
            'Monitor liquidity conditions'
          ]
        },
        lastUpdated: new Date().toISOString()
      };

      res.json(dashboard);
    } catch (error) {
      console.error('❌ Failed to get volatility forecasting dashboard:', error);
      res.status(500).json({ error: 'Failed to get volatility forecasting dashboard' });
    }
  }));

  // Get volatility forecast for specific asset
  app.get('/api/volatility-forecasting/forecast/:symbol', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { horizons } = req.query;
      
      console.log(`📊 Getting volatility forecast for ${symbol}...`);
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const forecastHorizons = horizons ? (horizons as string).split(',') : ['1d', '7d', '30d', '90d'];
      const forecast = await volatilityForecastingService.generateVolatilityForecast(symbol, forecastHorizons);
      
      res.json(forecast);
    } catch (error) {
      console.error(`❌ Failed to get volatility forecast for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to get volatility forecast' });
    }
  }));

  // Get multiple volatility forecasts
  app.post('/api/volatility-forecasting/forecasts', authenticateToken, strictLimit, validateBody(volForecastSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { symbols, horizons = ['1d', '7d', '30d'] } = req.body;
      console.log(`📊 Getting volatility forecasts for ${symbols.length} assets...`);
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const forecasts = await Promise.all(
        symbols.map(symbol => 
          volatilityForecastingService.generateVolatilityForecast(symbol, horizons)
        )
      );
      
      res.json({ forecasts });
    } catch (error) {
      console.error('❌ Failed to get volatility forecasts:', error);
      res.status(500).json({ error: 'Failed to get volatility forecasts' });
    }
  }));

  // Get stress indicators
  app.get('/api/volatility-forecasting/stress-indicators', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🚨 Getting stress indicators...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const indicators = await volatilityForecastingService.getStressIndicators();
      
      res.json({ indicators });
    } catch (error) {
      console.error('❌ Failed to get stress indicators:', error);
      res.status(500).json({ error: 'Failed to get stress indicators' });
    }
  }));

  // Get risk regime analysis
  app.get('/api/volatility-forecasting/risk-regime', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🔍 Getting risk regime analysis...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const regime = await volatilityForecastingService.analyzeRiskRegime();
      
      res.json(regime);
    } catch (error) {
      console.error('❌ Failed to get risk regime analysis:', error);
      res.status(500).json({ error: 'Failed to get risk regime analysis' });
    }
  }));

  // Get crisis indicators
  app.get('/api/volatility-forecasting/crisis-indicators', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('⚠️ Getting crisis indicators...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const indicators = await volatilityForecastingService.detectCrisisIndicators();
      
      res.json({ indicators });
    } catch (error) {
      console.error('❌ Failed to get crisis indicators:', error);
      res.status(500).json({ error: 'Failed to get crisis indicators' });
    }
  }));

  // Get volatility surface
  app.get('/api/volatility-forecasting/volatility-surface/:symbol', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      
      console.log(`📊 Getting volatility surface for ${symbol}...`);
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const surface = await volatilityForecastingService.generateVolatilitySurface(symbol);
      
      if (!surface) {
        return res.status(404).json({ error: 'Volatility surface not available for this asset' });
      }
      
      res.json(surface);
    } catch (error) {
      console.error(`❌ Failed to get volatility surface for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to get volatility surface' });
    }
  }));

  // Run stress tests
  app.post('/api/volatility-forecasting/stress-tests', authenticateToken, strictLimit, validateBody(stressTestSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { assets, scenarioIds } = req.body;
      console.log(`🧪 Running stress tests for ${assets.length} assets...`);
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const results = await volatilityForecastingService.runStressTests(assets, scenarioIds);
      
      res.json({ results });
    } catch (error) {
      console.error('❌ Failed to run stress tests:', error);
      res.status(500).json({ error: 'Failed to run stress tests' });
    }
  }));

  // Get tail risk metrics
  app.get('/api/volatility-forecasting/tail-risk/:symbol', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { timeframes } = req.query;
      
      console.log(`📉 Getting tail risk metrics for ${symbol}...`);
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      const requestedTimeframes = timeframes ? (timeframes as string).split(',') : ['1d', '7d', '30d'];
      const metrics = await volatilityForecastingService.calculateTailRiskMetrics(symbol, requestedTimeframes);
      
      res.json({ metrics });
    } catch (error) {
      console.error(`❌ Failed to get tail risk metrics for ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to get tail risk metrics' });
    }
  }));

  // Get volatility alerts
  app.get('/api/volatility-forecasting/alerts', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { severity, type, active } = req.query;
      
      console.log('🚨 Getting volatility alerts...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      let alerts = await volatilityForecastingService.getVolatilityAlerts();
      
      // Apply filters
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }
      if (type) {
        alerts = alerts.filter(alert => alert.alertType === type);
      }
      if (active === 'true') {
        alerts = alerts.filter(alert => alert.isActive);
      }
      
      res.json({ alerts });
    } catch (error) {
      console.error('❌ Failed to get volatility alerts:', error);
      res.status(500).json({ error: 'Failed to get volatility alerts' });
    }
  }));

  // Acknowledge volatility alert
  app.post('/api/volatility-forecasting/alerts/:alertId/acknowledge', authenticateToken, mediumLimit, validateBody(ackAlertSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;
      
      console.log(`🚨 Acknowledging volatility alert ${alertId}...`);
      
      // In a real implementation, this would update the alert in the database
      // For now, we'll just return success
      res.json({ 
        message: 'Alert acknowledged successfully',
        alertId,
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to acknowledge alert ${req.params.alertId}:`, error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  }));

  // Get comprehensive volatility analysis for discover page
  app.get('/api/volatility-forecasting/discover-analysis', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('📊 Getting volatility analysis for discover page...');
      const { volatilityForecastingService } = await import('../services/volatilityForecastingService');
      
      // Get key assets for analysis
      const keyAssets = ['BTC', 'ETH', 'SOL', 'SPY', 'QQQ'];
      
      const [
        forecasts,
        stressIndicators,
        riskRegime,
        crisisIndicators,
        activeAlerts
      ] = await Promise.all([
        Promise.all(keyAssets.map(symbol => 
          volatilityForecastingService.generateVolatilityForecast(symbol, ['1d', '7d', '30d'])
        )),
        volatilityForecastingService.getStressIndicators(),
        volatilityForecastingService.analyzeRiskRegime(),
        volatilityForecastingService.detectCrisisIndicators(),
        volatilityForecastingService.getVolatilityAlerts()
      ]);
      
      // Create volatility heatmap data
      const volatilityHeatmap = forecasts.map(forecast => ({
        symbol: forecast.symbol,
        currentVol: forecast.currentVolatility.realized7d,
        forecastVol: forecast.predictions.find(p => p.horizon === '7d')?.expectedVolatility || 0,
        change: forecast.predictions.find(p => p.horizon === '7d')?.expectedVolatility || 0 - forecast.currentVolatility.realized7d,
        regime: forecast.predictions.find(p => p.horizon === '7d')?.regime || 'normal',
        confidence: forecast.predictions.find(p => p.horizon === '7d')?.confidence || 70
      }));
      
      // Get top stress indicators
      const topStressIndicators = stressIndicators
        .sort((a, b) => b.normalizedValue - a.normalizedValue)
        .slice(0, 4);
      
      // Get highest crisis probability
      const topCrisisIndicator = crisisIndicators.reduce((max, indicator) => 
        indicator.probability > max.probability ? indicator : max, 
        crisisIndicators[0] || { probability: 0, name: 'No crisis indicators' }
      );
      
      const analysis = {
        overview: {
          overallStressLevel: Math.floor(
            stressIndicators.reduce((sum, indicator) => sum + indicator.normalizedValue, 0) / stressIndicators.length
          ),
          activeRegime: riskRegime.regime,
          regimeConfidence: riskRegime.confidence,
          crisisProbability: topCrisisIndicator.probability || 0,
          activeAlertsCount: activeAlerts.length
        },
        volatilityHeatmap,
        stressIndicators: topStressIndicators,
        riskRegime: {
          current: riskRegime.regime,
          confidence: riskRegime.confidence,
          duration: riskRegime.duration.current,
          recommendations: riskRegime.implications.recommendedAction
        },
        crisisWatch: {
          highestProbability: topCrisisIndicator.probability || 0,
          type: topCrisisIndicator.type || 'none',
          name: topCrisisIndicator.name || 'No active crisis indicators',
          timeframe: topCrisisIndicator.timeframe || 'N/A'
        },
        alerts: activeAlerts.slice(0, 3), // Top 3 alerts
        recommendations: {
          positionSizing: riskRegime.implications.positionSizing >= 1.0 ? 'normal' : 'reduced',
          hedging: stressIndicators.some(i => i.level === 'extreme') ? 'required' : 'optional',
          monitoring: ['VIX levels', 'Credit spreads', 'Correlation metrics']
        },
        lastUpdated: new Date().toISOString()
      };
      
      res.json(analysis);
    } catch (error) {
      console.error('❌ Failed to get volatility analysis for discover page:', error);
      res.status(500).json({ error: 'Failed to get volatility analysis' });
    }
  }));

  // =============================================================================
  // CROSS-MARKET SIGNAL GENERATION ROUTES - Phase 3 Final Feature
  // =============================================================================

  // Initialize cross-market signal service
  const { crossMarketSignalService } = await import('../services/crossMarketSignalService');

  // Get unified cross-market signals dashboard
  app.get('/api/cross-market-signals/dashboard', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('🎯 Fetching cross-market signals dashboard');
      const dashboardData = await crossMarketSignalService.getSignalDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error('❌ Failed to get cross-market signals dashboard:', error);
      res.status(500).json({ error: 'Failed to get cross-market signals dashboard' });
    }
  }));

  // Generate and get unified signals
  app.get('/api/cross-market-signals/unified-signals', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('🚀 Generating unified cross-market signals');
      const signals = await crossMarketSignalService.generateUnifiedSignals();
      res.json({ 
        success: true,
        signals,
        count: signals.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to generate unified signals:', error);
      res.status(500).json({ error: 'Failed to generate unified signals' });
    }
  }));

  // Get cross-market alerts
  app.get('/api/cross-market-signals/alerts', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('🚨 Fetching cross-market alerts');
      const alerts = await crossMarketSignalService.generateCrossMarketAlerts();
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
      
      res.json({
        success: true,
        alerts: alerts,
        criticalAlerts: criticalAlerts,
        totalAlerts: alerts.length,
        criticalCount: criticalAlerts.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get cross-market alerts:', error);
      res.status(500).json({ error: 'Failed to get cross-market alerts' });
    }
  }));

  // Get cross-market correlation analysis
  app.get('/api/cross-market-signals/correlations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('📊 Fetching cross-market correlation data');
      const correlationData = await crossMarketSignalService.getCrossMarketCorrelationData();
      res.json({
        success: true,
        ...correlationData
      });
    } catch (error) {
      console.error('❌ Failed to get cross-market correlations:', error);
      res.status(500).json({ error: 'Failed to get cross-market correlations' });
    }
  }));

  // Get signal for specific asset
  app.get('/api/cross-market-signals/asset/:symbol', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { symbol } = req.params;
      console.log(`🎯 Fetching signal for asset: ${symbol}`);
      
      const allSignals = await crossMarketSignalService.generateUnifiedSignals();
      const assetSignal = allSignals.find(signal => 
        signal.affectedAssets.some(asset => asset.symbol === symbol.toUpperCase())
      );
      
      if (!assetSignal) {
        return res.status(404).json({ error: `No signal found for asset ${symbol}` });
      }
      
      res.json({
        success: true,
        signal: assetSignal,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to get signal for asset ${req.params.symbol}:`, error);
      res.status(500).json({ error: 'Failed to get asset signal' });
    }
  }));

  // Get comprehensive trading recommendations
  app.get('/api/cross-market-signals/recommendations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { assets } = req.query; // Optional comma-separated list of assets
      console.log('📈 Fetching comprehensive trading recommendations');
      
      const signals = await crossMarketSignalService.generateUnifiedSignals();
      
      // Filter by requested assets if provided
      let filteredSignals = signals;
      if (assets && typeof assets === 'string') {
        const requestedAssets = assets.split(',').map(a => a.trim().toUpperCase());
        filteredSignals = signals.filter(signal =>
          signal.affectedAssets.some(asset => requestedAssets.includes(asset.symbol))
        );
      }
      
      // Transform to recommendations format
      const recommendations = filteredSignals.map(signal => ({
        symbol: signal.affectedAssets[0]?.symbol,
        signalStrength: signal.compositeScore.overall,
        confidence: signal.compositeScore.confidence,
        direction: signal.affectedAssets[0]?.direction,
        expectedMove: signal.affectedAssets[0]?.expectedMove,
        timeframe: signal.affectedAssets[0]?.timeframe,
        riskLevel: signal.affectedAssets[0]?.riskLevel,
        primaryAction: signal.tradingRecommendations.primaryAction,
        entryPrice: signal.tradingRecommendations.entryStrategy.preferredEntry,
        stopLoss: signal.tradingRecommendations.riskManagement.stopLoss,
        takeProfit: signal.tradingRecommendations.riskManagement.takeProfit,
        positionSizing: signal.tradingRecommendations.positionSizing.recommendedAllocation,
        rationale: signal.summary,
        lastUpdated: signal.updatedAt
      }));
      
      res.json({
        success: true,
        recommendations: recommendations.slice(0, 20), // Top 20 recommendations
        totalCount: recommendations.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get trading recommendations:', error);
      res.status(500).json({ error: 'Failed to get trading recommendations' });
    }
  }));

  // Acknowledge an alert
  app.post('/api/cross-market-signals/alerts/:alertId/acknowledge', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { alertId } = req.params;
      console.log(`✅ Acknowledging alert: ${alertId}`);
      
      // This would update the alert status in a real implementation
      // For now, just return success
      res.json({
        success: true,
        message: 'Alert acknowledged',
        alertId,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: req.user!.id
      });
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  }));

  // Get signal performance metrics
  app.get('/api/cross-market-signals/performance', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('📊 Fetching signal performance metrics');
      
      const dashboardData = await crossMarketSignalService.getSignalDashboardData();
      
      res.json({
        success: true,
        performance: dashboardData.performanceSummary,
        overviewMetrics: dashboardData.overviewMetrics,
        lastUpdated: dashboardData.lastUpdated
      });
    } catch (error) {
      console.error('❌ Failed to get signal performance metrics:', error);
      res.status(500).json({ error: 'Failed to get signal performance metrics' });
    }
  }));

  // Update signal configuration (admin only)
  app.post('/api/cross-market-signals/config', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      // In production, you'd want proper admin authentication
      const newConfig = req.body;
      console.log('⚙️ Updating cross-market signal configuration');
      
      crossMarketSignalService.updateConfiguration(newConfig);
      
      res.json({
        success: true,
        message: 'Configuration updated successfully',
        config: crossMarketSignalService.getConfiguration(),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to update signal configuration:', error);
      res.status(500).json({ error: 'Failed to update signal configuration' });
    }
  }));

  // Get comprehensive analysis for discover page
  app.get('/api/cross-market-signals/discover-analysis', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 Fetching comprehensive cross-market analysis for discover page');
      
      const [dashboardData, correlationData, topSignals] = await Promise.all([
        crossMarketSignalService.getSignalDashboardData(),
        crossMarketSignalService.getCrossMarketCorrelationData(),
        crossMarketSignalService.generateUnifiedSignals()
      ]);
      
      // Create comprehensive analysis for discover page
      const analysis = {
        // Overview metrics
        overview: {
          totalActiveSignals: dashboardData.overviewMetrics.totalActiveSignals,
          avgConfidenceScore: dashboardData.overviewMetrics.avgConfidenceScore,
          highPriorityAlerts: dashboardData.overviewMetrics.highPriorityAlerts,
          successRateToday: dashboardData.overviewMetrics.successRateToday,
          marketRegime: dashboardData.marketStatus.currentRegime,
          overallCorrelation: dashboardData.marketStatus.overallCorrelation,
          stressLevel: dashboardData.marketStatus.stressLevel
        },
        
        // Top signals with key information
        topSignals: topSignals.slice(0, 8).map(signal => ({
          id: signal.id,
          symbol: signal.affectedAssets[0]?.symbol,
          signalType: signal.signalType,
          priority: signal.priority,
          title: signal.title,
          summary: signal.summary,
          overallScore: signal.compositeScore.overall,
          confidence: signal.compositeScore.confidence,
          direction: signal.affectedAssets[0]?.direction,
          expectedMove: signal.affectedAssets[0]?.expectedMove,
          timeframe: signal.affectedAssets[0]?.timeframe,
          riskLevel: signal.affectedAssets[0]?.riskLevel,
          primaryAction: signal.tradingRecommendations.primaryAction,
          components: signal.compositeScore.components,
          createdAt: signal.createdAt,
          validUntil: signal.validUntil
        })),
        
        // Critical alerts
        criticalAlerts: dashboardData.criticalAlerts.map(alert => ({
          id: alert.id,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          affectedAssets: alert.affectedAssets,
          triggeredAt: alert.triggeredAt,
          requiresAction: alert.requiresAction
        })),
        
        // Market correlations summary
        correlationSummary: {
          regime: correlationData.correlationRegime.current,
          confidence: correlationData.correlationRegime.confidence,
          duration: correlationData.correlationRegime.duration,
          significantChanges: correlationData.significantChanges.length,
          topCorrelations: correlationData.correlationMatrix
            .filter(corr => Math.abs(corr.correlation) > 0.6)
            .slice(0, 5)
            .map(corr => ({
              assetPair: `${corr.asset1}-${corr.asset2}`,
              correlation: corr.correlation,
              strength: corr.strength,
              breakdownRisk: corr.breakdownRisk
            }))
        },
        
        // Performance summary
        performance: dashboardData.performanceSummary,
        
        // Market context
        marketContext: dashboardData.marketContext,
        
        lastUpdated: new Date().toISOString()
      };
      
      res.json(analysis);
    } catch (error) {
      console.error('❌ Failed to get cross-market analysis for discover page:', error);
      res.status(500).json({ error: 'Failed to get cross-market analysis' });
    }
  }));

}
