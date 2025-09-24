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

  // Core AI Processing Endpoints
  app.post('/api/analyze-content', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({
          error: 'URL is required'
        });
      }

      console.log(`🚀 Starting content analysis for: ${url}`);

      // Create summary record and start processing
      const summary = await storage.createSummary({
        originalUrl: url,
        processingStatus: 'processing',
        title: 'Extracting content...',
        summary: 'Processing your content with AI...',
        contentType: 'video',
        platform: 'youtube',
        creatorId: null, // Anonymous processing for now
        isPublic: true
      });

      // Start async processing with real AI service
      AIService.processContent(url, {
        contentType: 'video',
        platform: 'youtube'
      }).then(async (result) => {
        await storage.updateSummary(summary.id, {
          ...result,
          title: result.summary ? result.summary.slice(0, 100) : 'Processed Content',
          processingStatus: result.processingStatus,
          updatedAt: new Date()
        });
        console.log(`✅ Processing completed for: ${summary.id}`);
      }).catch(async (error) => {
        await storage.updateSummary(summary.id, {
          processingStatus: 'failed',
          summary: `Processing failed: ${error.message}`,
          updatedAt: new Date()
        });
        console.error(`❌ Processing failed for: ${summary.id}`, error);
      });

      res.json({
        success: true,
        summaryId: summary.id,
        message: 'Content processing started'
      });

    } catch (error: any) {
      console.error('Failed to start content analysis:', error);
      res.status(500).json({
        error: 'Failed to start processing',
        message: error.message
      });
    }
  });

  // Check processing status and get results
  app.get('/api/processing-result/:summaryId', async (req, res) => {
    try {
      const { summaryId } = req.params;
      
      const summary = await storage.getSummary(summaryId);
      
      if (!summary) {
        return res.status(404).json({
          error: 'Summary not found'
        });
      }

      res.json({
        success: true,
        status: summary.processingStatus,
        summary: summary,
        isComplete: summary.processingStatus === 'completed',
        isFailed: summary.processingStatus === 'failed'
      });

    } catch (error: any) {
      console.error('Failed to get processing result:', error);
      res.status(500).json({
        error: 'Failed to get processing status',
        message: error.message
      });
    }
  });

  // Get summaries (for dashboard)
  app.get('/api/summaries', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const summaries = await storage.getSummaries(limit);
      
      res.json({
        success: true,
        summaries,
        count: summaries.length
      });
    } catch (error: any) {
      console.error('Failed to fetch summaries:', error);
      res.status(500).json({
        error: 'Failed to fetch summaries',
        message: error.message
      });
    }
  });

  // Get single summary
  app.get('/api/summaries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await storage.getSummary(id);
      
      if (!summary) {
        return res.status(404).json({
          error: 'Summary not found'
        });
      }

      res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error('Failed to fetch summary:', error);
      res.status(500).json({
        error: 'Failed to fetch summary',
        message: error.message
      });
    }
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      // Check user credentials manually for now
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      const isValidPassword = await AuthService.comparePassword(password, user.password || '');
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      const token = AuthService.generateToken({ id: user.id, username: user.username });
      const result = { success: true, user, token };

      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          error: 'Username already exists'
        });
      }
      
      const hashedPassword = await AuthService.hashPassword(password);
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        authProvider: 'local'
      });
      
      const token = AuthService.generateToken({ id: user.id, username: user.username });
      const result = { success: true, user, token };

      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  });

  // Add missing public summaries endpoint for live content demo
  app.get('/api/summaries/public', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const summaries = await storage.getSummaries(limit);
      
      // Filter to only public summaries and add demo data if needed
      const publicSummaries = summaries.filter(s => s.isPublic);
      
      // If no summaries, return demo data for the live demo
      if (publicSummaries.length === 0) {
        const demoSummaries = [
          {
            id: 'demo-1',
            title: 'Bitcoin Market Analysis - Crypto Weekly Update',
            summary: 'Deep dive into Bitcoin price movements and institutional adoption trends.',
            platform: 'YouTube',
            contentType: 'video',
            processingStatus: 'completed',
            accuracy: 94,
            createdAt: new Date().toISOString(),
            tags: ['bitcoin', 'analysis', 'crypto']
          },
          {
            id: 'demo-2',
            title: 'DeFi Protocol Security Deep Dive',
            summary: 'Comprehensive analysis of smart contract vulnerabilities and security best practices.',
            platform: 'Podcast',
            contentType: 'audio',
            processingStatus: 'completed',
            accuracy: 91,
            createdAt: new Date().toISOString(),
            tags: ['defi', 'security', 'smartcontracts']
          }
        ];
        
        return res.json({
          success: true,
          summaries: demoSummaries,
          count: demoSummaries.length
        });
      }

      res.json({
        success: true,
        summaries: publicSummaries,
        count: publicSummaries.length
      });
    } catch (error: any) {
      console.error('Failed to fetch public summaries:', error);
      res.status(500).json({
        error: 'Failed to fetch public summaries',
        message: error.message
      });
    }
  });

  return server;
}