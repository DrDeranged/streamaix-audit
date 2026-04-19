// ============================================================================
// Avatar routes — extracted from server/routes.ts by
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

export async function registerAvatarRoutes(app: Express): Promise<void> {
  // =============================================================================
  // AVATAR ROUTES
  // =============================================================================

  // Get all avatars for landing page (cached for 5 minutes)
  app.get('/api/avatars', asyncHandler(async (req: Request, res: Response) => {
    try {
      const cacheKey = 'avatars:all';
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return res.json({ avatars: cached });
      }
      
      const avatars = await storage.getKnowledgeAvatars(50, 0);
      cacheService.set(cacheKey, avatars, 300); // Cache for 5 minutes
      res.json({ avatars });
    } catch (error) {
      console.error('Error fetching avatars:', error);
      res.status(500).json({ error: 'Failed to fetch avatars' });
    }
  }));

  // Get avatar by ID - MUST be before /:handle to avoid route matching issues
  app.get('/api/avatars/by-id/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      res.json(avatar);
    } catch (error) {
      console.error('Error fetching avatar by ID:', error);
      res.status(500).json({ error: 'Failed to fetch avatar' });
    }
  }));

  // Get trending avatars - MUST be before /:handle to avoid route matching issues
  app.get('/api/avatars/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;
    
    try {
      const trendingIds = await recommendationEngine.getTrendingAvatars(limit);
      
      // Fetch full avatar data
      const trending = await Promise.all(
        trendingIds.map(id => storage.getKnowledgeAvatar(id))
      );
      
      res.json({ trending: trending.filter(Boolean) });
    } catch (error) {
      console.error('Error fetching trending avatars:', error);
      res.status(500).json({ error: 'Failed to fetch trending avatars' });
    }
  }));

  // Get avatar by handle
  app.get('/api/avatars/:handle', asyncHandler(async (req: Request, res: Response) => {
    const { handle } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatarByHandle(handle);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      res.json({ avatar });
    } catch (error) {
      console.error('Error fetching avatar:', error);
      res.status(500).json({ error: 'Failed to fetch avatar' });
    }
  }));

  // Get avatar insights
  app.get('/api/avatars/:handle/insights', asyncHandler(async (req: Request, res: Response) => {
    const { handle } = req.params;
    const { category } = req.query;
    
    try {
      const avatar = await storage.getKnowledgeAvatarByHandle(handle);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      const insights = await storage.getAvatarInsights(avatar.id, category as string);
      res.json({ insights });
    } catch (error) {
      console.error('Error fetching avatar insights:', error);
      res.status(500).json({ error: 'Failed to fetch avatar insights' });
    }
  }));

  // Check follow status
  app.get('/api/avatars/:id/follow-status', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      const isFollowing = await storage.isFollowingAvatar(req.user!.id, id);
      
      // Get follow details if following
      let notificationsEnabled = false;
      if (isFollowing) {
        const followedAvatars = await storage.getUserFollowedAvatars(req.user!.id);
        const followData = followedAvatars.find(f => f.avatarId === id);
        notificationsEnabled = followData?.notificationsEnabled || false;
      }

      res.json({ 
        isFollowing,
        notificationsEnabled 
      });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ error: 'Failed to check follow status' });
    }
  }));

  // Follow avatar
  app.post('/api/avatars/:id/follow', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { notificationsEnabled = true } = req.body;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      // Check if already following
      const isAlreadyFollowing = await storage.isFollowingAvatar(req.user!.id, id);
      if (isAlreadyFollowing) {
        return res.status(409).json({ error: 'Already following this avatar' });
      }

      const follow = await storage.followAvatar(req.user!.id, id);
      
      res.status(201).json({
        message: 'Successfully followed avatar',
        follow
      });
    } catch (error) {
      console.error('Error following avatar:', error);
      res.status(500).json({ error: 'Failed to follow avatar' });
    }
  }));

  // Unfollow avatar
  app.delete('/api/avatars/:id/unfollow', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      // Check if following
      const isFollowing = await storage.isFollowingAvatar(req.user!.id, id);
      if (!isFollowing) {
        return res.status(409).json({ error: 'Not following this avatar' });
      }

      const success = await storage.unfollowAvatar(req.user!.id, id);
      
      if (success) {
        res.json({ message: 'Successfully unfollowed avatar' });
      } else {
        res.status(500).json({ error: 'Failed to unfollow avatar' });
      }
    } catch (error) {
      console.error('Error unfollowing avatar:', error);
      res.status(500).json({ error: 'Failed to unfollow avatar' });
    }
  }));

  // Get user's followed avatars
  app.get('/api/users/:id/followed-avatars', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const followedAvatars = await storage.getUserFollowedAvatars(id);
      res.json({ followedAvatars });
    } catch (error) {
      console.error('Error fetching followed avatars:', error);
      res.status(500).json({ error: 'Failed to fetch followed avatars' });
    }
  }));

  // Get avatar followers
  app.get('/api/avatars/:id/followers', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      const followers = await storage.getAvatarFollowers(id);
      res.json({ followers });
    } catch (error) {
      console.error('Error fetching avatar followers:', error);
      res.status(500).json({ error: 'Failed to fetch avatar followers' });
    }
  }));

  // Get detailed analytics for avatar
  app.get('/api/avatars/:id/analytics', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const avatar = await storage.getKnowledgeAvatar(id);
      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      // Return detailed analytics data
      res.json({
        id: avatar.id,
        name: avatar.name,
        handle: avatar.handle,
        bio: avatar.bio,
        netWorth: avatar.netWorth,
        portfolioRoi: avatar.portfolioRoi,
        investmentThesis: avatar.investmentThesis,
        bestCalls: avatar.bestCalls,
        worstCalls: avatar.worstCalls,
        recentActivity: avatar.recentActivity,
        category: avatar.category,
        riskScore: avatar.riskScore,
        volatility: avatar.volatility,
        marketOutlook: avatar.marketOutlook,
        performanceHistory: avatar.performanceHistory
      });
    } catch (error) {
      console.error('Error fetching avatar analytics:', error);
      res.status(500).json({ error: 'Failed to fetch avatar analytics' });
    }
  }));

  // Get personalized avatar recommendations
  app.get('/api/avatars/recommendations/:userId', asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    
    try {
      const recommendations = await recommendationEngine.generateRecommendations(userId, limit);
      
      // Enrich with avatar data
      const enriched = await Promise.all(
        recommendations.map(async (rec) => {
          const avatar = await storage.getKnowledgeAvatar(rec.avatarId);
          return {
            ...rec,
            avatar
          };
        })
      );
      
      res.json({ recommendations: enriched });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }));

  // Get similar avatars
  app.get('/api/avatars/:id/similar', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;
    
    try {
      const similar = await recommendationEngine.getSimilarAvatars(id, limit);
      
      // Enrich with avatar data
      const enriched = await Promise.all(
        similar.map(async (rec) => {
          const avatar = await storage.getKnowledgeAvatar(rec.avatarId);
          return {
            ...rec,
            avatar
          };
        })
      );
      
      res.json({ similar: enriched });
    } catch (error) {
      console.error('Error fetching similar avatars:', error);
      res.status(500).json({ error: 'Failed to fetch similar avatars' });
    }
  }));

  // Avatar Chat - Chat with AI personas of Knowledge Avatars
  app.post('/api/avatars/:avatarId/chat', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { avatarId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const result = await avatarChatService.generateAvatarChatResponse(
        avatarId,
        userId,
        message.trim()
      );
      res.json(result);
    } catch (error) {
      console.error('Avatar chat error:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }));

  // Get chat history with an avatar
  app.get('/api/avatars/:avatarId/chat/history', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { avatarId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const messages = await avatarChatService.getConversationHistory(userId, avatarId);
      res.json({ messages });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  }));

  // Clear chat history with an avatar
  app.delete('/api/avatars/:avatarId/chat/history', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { avatarId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      await avatarChatService.clearConversation(userId, avatarId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  }));

  // Social sentiment analysis endpoint for crypto entrepreneurs
  // Returns cached fallback data when Twitter API is rate-limited
  const sentimentCache = new Map<string, { data: any; timestamp: number }>();
  const SENTIMENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache
  
  // Pre-populated fallback data for when APIs are unavailable
  const fallbackSentimentData: Record<string, any> = {
    'naval': { name: 'Naval Ravikant', followers: 2400000, influenceScore: 95, engagement: 85, marketImpact: 'high', positivity: 72 },
    'VitalikButerin': { name: 'Vitalik Buterin', followers: 5100000, influenceScore: 98, engagement: 92, marketImpact: 'high', positivity: 68 },
    'saylor': { name: 'Michael Saylor', followers: 3200000, influenceScore: 92, engagement: 88, marketImpact: 'high', positivity: 85 },
    'brian_armstrong': { name: 'Brian Armstrong', followers: 1800000, influenceScore: 88, engagement: 75, marketImpact: 'high', positivity: 65 },
    'cz_binance': { name: 'Changpeng Zhao', followers: 8900000, influenceScore: 96, engagement: 90, marketImpact: 'high', positivity: 70 },
    'CathieDWood': { name: 'Cathie Wood', followers: 1500000, influenceScore: 85, engagement: 78, marketImpact: 'medium', positivity: 75 },
    'tyler': { name: 'Tyler Winklevoss', followers: 680000, influenceScore: 78, engagement: 65, marketImpact: 'medium', positivity: 68 },
    'cameron': { name: 'Cameron Winklevoss', followers: 620000, influenceScore: 76, engagement: 62, marketImpact: 'medium', positivity: 70 },
    'balajis': { name: 'Balaji Srinivasan', followers: 1100000, influenceScore: 88, engagement: 82, marketImpact: 'high', positivity: 65 },
    'paulg': { name: 'Paul Graham', followers: 1800000, influenceScore: 90, engagement: 85, marketImpact: 'medium', positivity: 72 }
  };

  app.get('/api/social-sentiment/:username', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      // Map frontend names to actual Twitter usernames
      const twitterUsernames: Record<string, string> = {
        'Naval Ravikant': 'naval',
        'Vitalik Buterin': 'VitalikButerin', 
        'Michael Saylor': 'saylor',
        'Brian Armstrong': 'brian_armstrong',
        'Changpeng Zhao': 'cz_binance',
        'Cathie Wood': 'CathieDWood',
        'Tyler Winklevoss': 'tyler',
        'Cameron Winklevoss': 'cameron',
        'Balaji Srinivasan': 'balajis',
        'Paul Graham': 'paulg'
      };

      const twitterUsername = twitterUsernames[username];
      if (!twitterUsername) {
        return res.status(200).json({ 
          success: true, 
          cached: true,
          data: {
            username: 'unknown',
            profile: { name: username, followers: 0, verified: false, description: '' },
            sentiment: { influenceScore: 50, engagement: 50, marketImpact: 'medium', recentActivity: 0, positivity: 50 },
            lastUpdated: new Date().toISOString()
          }
        });
      }

      // Check cache first
      const cached = sentimentCache.get(twitterUsername);
      if (cached && Date.now() - cached.timestamp < SENTIMENT_CACHE_TTL) {
        return res.json({ success: true, cached: true, data: cached.data });
      }

      // Try to get live data from Twitter
      try {
        const { TwitterService } = await import('../services/twitterService');
        const twitterService = new TwitterService();

        const [profile, tweets] = await Promise.all([
          twitterService.getUserProfile(twitterUsername),
          twitterService.getUserTweets(twitterUsername, 20)
        ]);

        if (profile) {
          const sentimentAnalysis = analyzeSentiment(tweets, profile);
          const responseData = {
            username: twitterUsername,
            profile: {
              name: profile.name,
              followers: profile.public_metrics?.followers_count || 0,
              verified: profile.verified || false,
              description: profile.description || ''
            },
            sentiment: sentimentAnalysis,
            lastUpdated: new Date().toISOString()
          };
          
          // Cache the response
          sentimentCache.set(twitterUsername, { data: responseData, timestamp: Date.now() });
          
          return res.json({ success: true, cached: false, data: responseData });
        }
      } catch (twitterError) {
        console.log(`⚠️ Twitter API unavailable for ${twitterUsername}, using fallback data`);
      }

      // Use fallback data if Twitter API fails
      const fallback = fallbackSentimentData[twitterUsername];
      if (fallback) {
        const fallbackResponse = {
          username: twitterUsername,
          profile: {
            name: fallback.name,
            followers: fallback.followers,
            verified: true,
            description: ''
          },
          sentiment: {
            influenceScore: fallback.influenceScore,
            engagement: fallback.engagement,
            marketImpact: fallback.marketImpact,
            recentActivity: 10,
            positivity: fallback.positivity
          },
          lastUpdated: new Date().toISOString()
        };
        return res.json({ success: true, cached: true, fallback: true, data: fallbackResponse });
      }

      // Final fallback - generic response
      return res.json({
        success: true,
        cached: true,
        fallback: true,
        data: {
          username: twitterUsername,
          profile: { name: username, followers: 0, verified: false, description: '' },
          sentiment: { influenceScore: 50, engagement: 50, marketImpact: 'medium', recentActivity: 0, positivity: 50 },
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching social sentiment:', error);
      // Still return success with fallback data instead of 500 error
      return res.json({ 
        success: true, 
        cached: true,
        fallback: true,
        data: {
          username: req.params.username,
          profile: { name: req.params.username, followers: 0, verified: false, description: '' },
          sentiment: { influenceScore: 50, engagement: 50, marketImpact: 'medium', recentActivity: 0, positivity: 50 },
          lastUpdated: new Date().toISOString()
        }
      });
    }
  }));

  // Helper function for sentiment analysis
  function analyzeSentiment(tweets: any[], profile: any) {
    if (!tweets || tweets.length === 0) {
      return {
        influenceScore: Math.min((profile.public_metrics?.followers_count || 0) / 1000000 * 100, 100),
        engagement: 0,
        marketImpact: 'low',
        recentActivity: 0,
        positivity: 50
      };
    }

    // Calculate engagement rate
    const totalEngagement = tweets.reduce((sum: number, tweet: any) => {
      const metrics = tweet.public_metrics || {};
      return sum + (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
    }, 0);

    const avgEngagement = totalEngagement / tweets.length;
    const followerCount = profile.public_metrics?.followers_count || 1;
    const engagementRate = (avgEngagement / followerCount) * 100;

    // Analyze tweet content for sentiment
    const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft'];
    const positiveWords = ['bullish', 'up', 'good', 'great', 'positive', 'growth', 'success'];
    const negativeWords = ['bearish', 'down', 'bad', 'crash', 'dump', 'negative', 'loss'];

    let cryptoMentions = 0;
    let positiveScore = 0;
    let negativeScore = 0;

    tweets.forEach((tweet: any) => {
      const text = tweet.text.toLowerCase();
      
      cryptoKeywords.forEach(keyword => {
        if (text.includes(keyword)) cryptoMentions++;
      });
      
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveScore++;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeScore++;
      });
    });

    const positivity = positiveScore + negativeScore > 0 
      ? (positiveScore / (positiveScore + negativeScore)) * 100 
      : 50;

    return {
      influenceScore: Math.min((followerCount / 1000000) * 100, 100),
      engagement: Math.min(engagementRate * 10, 100),
      marketImpact: cryptoMentions > 3 ? 'high' : cryptoMentions > 1 ? 'medium' : 'low',
      recentActivity: tweets.length,
      positivity: Math.round(positivity)
    };
  }

}
