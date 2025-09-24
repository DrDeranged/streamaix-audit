import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, DatabaseStorage } from "./storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { StreamProcessor } from "./services/streamProcessor";
import { StreamProcessorV2 } from "./services/streamProcessorV2";
import RebuiltContentProcessor from "./services/rebuiltContentProcessor";
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
import { marketEventModelingService } from "./services/marketEventModelingService";
import { patternRecognitionService } from "./services/patternRecognitionService";
import { knowledgeAvatarService } from './services/knowledgeAvatarService';
import passport from "passport";

// Initialize services
const marketDataService = MarketDataService.getInstance();
const correlationAnalysisService = CorrelationAnalysisService.getInstance();
const riskAssessmentService = RiskAssessmentService.getInstance();
const predictiveAnalyticsService = new PredictiveAnalyticsService(storage as DatabaseStorage);
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

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Knowledge Avatars endpoints
  app.get('/api/knowledge-avatars', async (req, res) => {
    try {
      console.log('🎓 Fetching Knowledge Avatars...');
      const avatars = await knowledgeAvatarService.getKnowledgeAvatars();
      
      res.json({
        success: true,
        avatars,
        count: avatars.length
      });
    } catch (error: any) {
      console.error('Failed to fetch knowledge avatars:', error);
      res.status(500).json({
        error: 'Failed to fetch knowledge avatars',
        message: error.message
      });
    }
  });

  app.post('/api/knowledge-avatars/initialize', async (req, res) => {
    try {
      console.log('🎓 Initializing Knowledge Avatars...');
      await knowledgeAvatarService.initializeKnowledgeAvatars();
      
      res.json({
        success: true,
        message: 'Knowledge avatars initialized successfully'
      });
    } catch (error: any) {
      console.error('Failed to initialize knowledge avatars:', error);
      res.status(500).json({
        error: 'Failed to initialize knowledge avatars',
        message: error.message
      });
    }
  });

  return server;
}