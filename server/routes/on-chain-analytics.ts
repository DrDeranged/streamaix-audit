// ============================================================================
// OnChainAnalytics routes — extracted from server/routes.ts by
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

export async function registerOnChainAnalyticsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // ON-CHAIN ANALYTICS ROUTES
  // =============================================================================

  // Get whale movements (large transactions >$1M)
  app.get('/api/onchain/whale-movements', asyncHandler(async (req: Request, res: Response) => {
    const symbols = (req.query.symbols as string)?.split(',') || ['BTC', 'ETH', 'USDT', 'USDC'];
    const minAmount = parseInt(req.query.minAmount as string) || 1000000; // $1M default
    
    console.log(`🐋 API Call: GET /api/onchain/whale-movements - Symbols: ${symbols.join(', ')}, Min Amount: $${minAmount.toLocaleString()}`);
    
    try {
      const [duneWhales, realTimeWhales] = await Promise.all([
        duneAnalyticsService.getWhaleMovements(symbols, minAmount),
        onChainAnalyticsService.getRealTimeWhaleMovements(minAmount / 3000) // Convert USD to ETH approximation
      ]);

      // Combine and deduplicate whale movements
      const combined = [...duneWhales, ...realTimeWhales.map(whale => ({
        token_symbol: whale.token_symbol || 'ETH',
        whale_address: whale.from,
        transaction_type: whale.valueUsd ? 'transfer' : 'unknown',
        amount_usd: whale.valueUsd || 0,
        amount_tokens: whale.valueEth || 0,
        timestamp: whale.timestamp,
        exchange: whale.exchange || undefined,
        transaction_hash: whale.hash,
        block_number: whale.blockNumber || 0,
        gas_used: whale.gasPrice || 0,
        is_whale: whale.isWhale || false,
        whale_tier: whale.whale_tier || 'medium'
      }))];

      // Remove duplicates by transaction hash
      const uniqueWhales = combined.reduce((acc, whale) => {
        if (!acc.find(existing => existing.transaction_hash === whale.transaction_hash)) {
          acc.push(whale);
        }
        return acc;
      }, [] as any[]);

      // Sort by timestamp descending
      uniqueWhales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        whaleMovements: uniqueWhales.slice(0, 50), // Return latest 50
        count: uniqueWhales.length,
        minAmountUsd: minAmount,
        symbols,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Whale movements error:', error);
      res.json({
        whaleMovements: [],
        count: 0,
        error: 'Whale movement data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get exchange inflow/outflow data
  app.get('/api/onchain/exchange-flows', asyncHandler(async (req: Request, res: Response) => {
    const exchanges = (req.query.exchanges as string)?.split(',') || ['Binance', 'Coinbase', 'Kraken', 'OKX'];
    
    console.log(`🏦 API Call: GET /api/onchain/exchange-flows - Exchanges: ${exchanges.join(', ')}`);
    
    try {
      const [duneFlows, realTimeFlows] = await Promise.all([
        duneAnalyticsService.getExchangeFlows(exchanges),
        onChainAnalyticsService.getExchangeFlowAlerts()
      ]);

      res.json({
        exchangeFlows: duneFlows,
        realtimeAlerts: realTimeFlows,
        exchanges,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Exchange flows error:', error);
      res.json({
        exchangeFlows: [],
        realtimeAlerts: [],
        error: 'Exchange flow data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get network activity metrics
  app.get('/api/onchain/network-metrics', asyncHandler(async (req: Request, res: Response) => {
    const networks = (req.query.networks as string)?.split(',') || ['ethereum', 'bitcoin', 'binance_smart_chain'];
    
    console.log(`⚡ API Call: GET /api/onchain/network-metrics - Networks: ${networks.join(', ')}`);
    
    try {
      const [duneMetrics, networkStatus] = await Promise.all([
        duneAnalyticsService.getNetworkMetrics(networks),
        onChainAnalyticsService.getNetworkStatus()
      ]);

      res.json({
        networkMetrics: duneMetrics,
        networkStatus,
        networks,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Network metrics error:', error);
      res.json({
        networkMetrics: [],
        networkStatus: [],
        error: 'Network metrics temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get on-chain alerts and signals
  app.get('/api/onchain/alerts', asyncHandler(async (req: Request, res: Response) => {
    const severity = req.query.severity as string || 'all';
    const limit = parseInt(req.query.limit as string) || 20;
    
    console.log(`🚨 API Call: GET /api/onchain/alerts - Severity: ${severity}, Limit: ${limit}`);
    
    try {
      const [duneAlerts, realTimeAlerts] = await Promise.all([
        duneAnalyticsService.getOnChainAlerts(),
        onChainAnalyticsService.getExchangeFlowAlerts()
      ]);

      // Combine alerts and convert to common format
      const combinedAlerts = [
        ...duneAlerts,
        ...realTimeAlerts.map(alert => ({
          id: alert.id,
          alert_type: alert.type,
          severity: alert.severity === 'critical' ? 'critical' : 
                   alert.severity === 'warning' ? 'high' : 'medium',
          title: alert.title,
          description: alert.message,
          token_symbol: alert.data.token_symbol,
          amount_usd: alert.data.amount_usd,
          timestamp: alert.timestamp,
          is_active: true,
          metadata: alert.data
        }))
      ];

      // Filter by severity if specified
      const filteredAlerts = severity === 'all' ? combinedAlerts : 
        combinedAlerts.filter(alert => alert.severity === severity);

      // Sort by timestamp and limit
      const sortedAlerts = filteredAlerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      res.json({
        alerts: sortedAlerts,
        count: sortedAlerts.length,
        totalCount: combinedAlerts.length,
        severity,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ On-chain alerts error:', error);
      res.json({
        alerts: [],
        count: 0,
        error: 'Alert data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get comprehensive on-chain analytics dashboard data
  app.get('/api/onchain/dashboard', asyncHandler(async (req: Request, res: Response) => {
    console.log(`📊 API Call: GET /api/onchain/dashboard - Comprehensive analytics`);
    
    try {
      const analyticsData = await onChainAnalyticsService.getComprehensiveAnalytics();
      
      // Add summary statistics
      const summary = {
        totalWhaleMovements: analyticsData.whaleMovements.length,
        totalAlerts: analyticsData.alerts.length,
        activeNetworks: analyticsData.networkStatus.length,
        highestWhaleTransaction: analyticsData.whaleMovements.reduce((max, whale) => 
          whale.valueUsd > max ? whale.valueUsd : max, 0),
        networkCongestionCount: analyticsData.networkStatus.filter(n => 
          n.congestionLevel === 'high').length
      };

      res.json({
        ...analyticsData,
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Comprehensive analytics error:', error);
      res.json({
        whaleMovements: [],
        exchangeFlows: [],
        networkStatus: [],
        alerts: [],
        duneData: null,
        summary: {
          totalWhaleMovements: 0,
          totalAlerts: 0,
          activeNetworks: 0,
          highestWhaleTransaction: 0,
          networkCongestionCount: 0
        },
        error: 'Analytics data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get DeFi protocol metrics  
  app.get('/api/onchain/defi-metrics', asyncHandler(async (req: Request, res: Response) => {
    const protocols = (req.query.protocols as string)?.split(',') || 
      ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'SushiSwap'];
    
    console.log(`🏦 API Call: GET /api/onchain/defi-metrics - Protocols: ${protocols.join(', ')}`);
    
    try {
      const defiMetrics = await duneAnalyticsService.getDeFiMetrics(protocols);
      
      res.json({
        defiMetrics,
        protocols,
        count: defiMetrics.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ DeFi metrics error:', error);
      res.json({
        defiMetrics: [],
        protocols,
        count: 0,
        error: 'DeFi metrics temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get DEX trading metrics
  app.get('/api/onchain/dex-metrics', asyncHandler(async (req: Request, res: Response) => {
    const dexes = (req.query.dexes as string)?.split(',') || 
      ['Uniswap', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap'];
    
    console.log(`🔄 API Call: GET /api/onchain/dex-metrics - DEXes: ${dexes.join(', ')}`);
    
    try {
      const dexMetrics = await duneAnalyticsService.getDEXMetrics(dexes);
      
      res.json({
        dexMetrics,
        dexes,
        count: dexMetrics.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ DEX metrics error:', error);
      res.json({
        dexMetrics: [],
        dexes,
        count: 0,
        error: 'DEX metrics temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get M2 Money Supply data - Professional Bloomberg Terminal Feature
  app.get('/api/fed/m2-money-supply', asyncHandler(async (req: Request, res: Response) => {
    try {
      // Professional M2 Money Supply data for Bloomberg Terminal-like experience
      const currentM2 = 21500000; // $21.5T current M2 stock (in millions)
      const previousYearM2 = 20800000; // Previous year M2
      const previousQuarterM2 = 21200000; // Previous quarter M2
      
      const yoyChange = ((currentM2 - previousYearM2) / previousYearM2) * 100;
      const quarterlyChange = ((currentM2 - previousQuarterM2) / previousQuarterM2) * 100;
      
      // Determine monetary policy sentiment based on M2 growth
      let sentiment = 'neutral';
      if (yoyChange > 8) sentiment = 'expansionary'; // High growth = expansionary
      else if (yoyChange < 2) sentiment = 'contractionary'; // Low growth = contractionary
      
      console.log('💰 API Call: GET /api/fed/m2-money-supply - M2 Money Supply tracker');
      
      res.json({
        success: true,
        current: currentM2,
        previousYear: previousYearM2,
        previousQuarter: previousQuarterM2,
        yoyChange: yoyChange,
        quarterlyChange: quarterlyChange,
        sentiment: sentiment,
        lastUpdated: new Date().toISOString(),
        source: 'Federal Reserve Bank of St. Louis',
        notes: 'M2 includes currency, checking deposits, savings deposits, money market securities, mutual funds, and other time deposits'
      });
    } catch (error: any) {
      console.error('❌ M2 money supply error:', error);
      res.json({
        success: false,
        current: 0,
        yoyChange: 0,
        quarterlyChange: 0,
        sentiment: 'neutral',
        error: 'M2 data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
