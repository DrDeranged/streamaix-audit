// ============================================================================
// RiskAssessment routes — extracted from server/routes.ts by
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
import { RiskAssessmentService } from "../services/riskAssessmentService";

const riskAssessmentService = RiskAssessmentService.getInstance();
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

export async function registerRiskAssessmentRoutes(app: Express): Promise<void> {
  // =============================================================================
  // RISK ASSESSMENT AND PORTFOLIO ANALYSIS ROUTES
  // =============================================================================

  // Get comprehensive risk dashboard data
  app.get('/api/risk/dashboard', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('🎯 API Call: GET /api/risk/dashboard - Comprehensive risk assessment data');
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      
      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Risk dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate risk dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get portfolio risk metrics
  app.get('/api/risk/metrics', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('📊 API Call: GET /api/risk/metrics - Portfolio risk metrics');
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      
      res.json({
        success: true,
        data: {
          portfolio: dashboardData.portfolio,
          riskMetrics: dashboardData.riskMetrics
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Risk metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate risk metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Run stress tests on portfolio
  app.get('/api/risk/stress-tests', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const scenarios = req.query.scenarios as string;
    
    console.log(`🔥 API Call: GET /api/risk/stress-tests - Scenarios: ${scenarios || 'all'}`);
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      let stressTests = dashboardData.stressTests;
      
      // Filter by specific scenarios if requested
      if (scenarios) {
        const requestedScenarios = scenarios.split(',');
        stressTests = stressTests.filter(test => 
          requestedScenarios.includes(test.scenario.scenarioType)
        );
      }
      
      res.json({
        success: true,
        data: {
          stressTests,
          portfolio: dashboardData.portfolio,
          summary: {
            totalScenarios: stressTests.length,
            worstCaseScenario: stressTests.reduce((worst, current) => 
              current.portfolioImpact.totalLossPercent > worst.portfolioImpact.totalLossPercent ? current : worst
            ),
            averageLoss: stressTests.reduce((sum, test) => 
              sum + test.portfolioImpact.totalLossPercent, 0) / stressTests.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Stress tests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run stress tests',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get position sizing recommendations
  app.get('/api/risk/position-sizing', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const method = req.query.method as string || 'risk_parity';
    const timeHorizon = req.query.timeHorizon as string || '3m';
    
    console.log(`⚖️ API Call: GET /api/risk/position-sizing - Method: ${method}, Horizon: ${timeHorizon}`);
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      let recommendations = dashboardData.positionSizing;
      
      // Filter by method and time horizon if specified
      if (method !== 'all') {
        recommendations = recommendations.filter(rec => rec.sizingMethod === method);
      }
      if (timeHorizon !== 'all') {
        recommendations = recommendations.filter(rec => rec.timeHorizon === timeHorizon);
      }
      
      res.json({
        success: true,
        data: {
          recommendations,
          summary: {
            totalRecommendations: recommendations.length,
            averageConfidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length,
            highConfidenceCount: recommendations.filter(rec => rec.confidence > 80).length,
            rebalancingNeeded: recommendations.filter(rec => 
              Math.abs(rec.recommendedAllocation - rec.currentAllocation) > 5
            ).length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Position sizing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate position sizing recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get portfolio composition analysis
  app.get('/api/risk/composition', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('🥧 API Call: GET /api/risk/composition - Portfolio composition analysis');
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      
      res.json({
        success: true,
        data: {
          composition: dashboardData.composition,
          portfolio: {
            totalValue: dashboardData.portfolio.totalValue,
            totalAllocated: dashboardData.portfolio.totalAllocated,
            availableCash: dashboardData.portfolio.availableCash,
            positionCount: dashboardData.portfolio.positions.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Portfolio composition error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze portfolio composition',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get risk alerts and monitoring
  app.get('/api/risk/alerts', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const severity = req.query.severity as string;
    const alertType = req.query.alertType as string;
    
    console.log(`🚨 API Call: GET /api/risk/alerts - Severity: ${severity || 'all'}, Type: ${alertType || 'all'}`);
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      let alerts = dashboardData.riskAlerts;
      
      // Filter alerts by severity and type if specified
      if (severity && severity !== 'all') {
        alerts = alerts.filter(alert => alert.severity === severity);
      }
      if (alertType && alertType !== 'all') {
        alerts = alerts.filter(alert => alert.alertType === alertType);
      }
      
      // Sort by severity (critical first)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      
      res.json({
        success: true,
        data: {
          alerts,
          summary: {
            totalAlerts: alerts.length,
            criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
            highAlerts: alerts.filter(a => a.severity === 'high').length,
            mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
            lowAlerts: alerts.filter(a => a.severity === 'low').length,
            activeAlerts: alerts.filter(a => a.isActive).length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Risk alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve risk alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Acknowledge risk alert
  app.patch('/api/risk/alerts/:alertId/acknowledge', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { alertId } = req.params;
    
    console.log(`✅ API Call: PATCH /api/risk/alerts/${alertId}/acknowledge`);
    
    try {
      // In production, this would update the alert in the database
      // For now, we'll return a success response
      res.json({
        success: true,
        data: {
          alertId,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: req.user?.id
        },
        message: 'Risk alert acknowledged successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Acknowledge alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get Value at Risk calculations
  app.get('/api/risk/var', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const confidence = parseInt(req.query.confidence as string) || 95;
    const horizon = parseInt(req.query.horizon as string) || 1;
    
    console.log(`📈 API Call: GET /api/risk/var - Confidence: ${confidence}%, Horizon: ${horizon} day(s)`);
    
    try {
      const dashboardData = await riskAssessmentService.getRiskDashboard();
      const riskMetrics = dashboardData.riskMetrics;
      
      // Select appropriate VaR based on parameters
      let varValue = 0;
      if (confidence === 95 && horizon === 1) {
        varValue = riskMetrics.var95_1d;
      } else if (confidence === 99 && horizon === 1) {
        varValue = riskMetrics.var99_1d;
      } else if (confidence === 95 && horizon === 7) {
        varValue = riskMetrics.var95_7d;
      } else if (confidence === 99 && horizon === 7) {
        varValue = riskMetrics.var99_7d;
      } else {
        // Calculate approximation for other combinations
        const baseVar = confidence === 95 ? riskMetrics.var95_1d : riskMetrics.var99_1d;
        varValue = baseVar * Math.sqrt(horizon);
      }
      
      const portfolioValue = dashboardData.portfolio.totalValue;
      const varAmount = portfolioValue * (varValue / 100);
      
      res.json({
        success: true,
        data: {
          varPercent: varValue,
          varAmount: varAmount,
          confidence,
          horizon,
          portfolioValue,
          interpretation: `There is a ${100 - confidence}% chance of losing more than $${varAmount.toLocaleString()} over the next ${horizon} day(s)`,
          riskLevel: varValue > 10 ? 'high' : varValue > 5 ? 'medium' : 'low'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('VaR calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate Value at Risk',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }));

}
