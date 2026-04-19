// ============================================================================
// PushNotifications routes — extracted from server/routes.ts by
// scripts/split-routes.ts. No behavior changes; this is a pure file
// reorganization to break the 20k-line monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
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
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { youtubeService } from "../services/youtubeService";
import { trendingService } from "../services/trendingService";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";
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

export async function registerPushNotificationsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PUSH NOTIFICATIONS API
  // =============================================================================
  
  const { pushNotificationService } = await import('../services/pushNotificationService');

  // Get VAPID public key for client
  app.get("/api/push/vapid-key", asyncHandler(async (req: Request, res: Response) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return res.status(500).json({ success: false, error: 'Push notifications not configured' });
    }
    res.json({ success: true, vapidPublicKey });
  }));

  // Subscribe to push notifications
  app.post("/api/push/subscribe", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { subscription, deviceInfo } = req.body;
    
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, error: 'Invalid subscription data' });
    }

    const result = await pushNotificationService.saveSubscription(
      req.user.id,
      subscription,
      deviceInfo
    );

    res.json({ success: true, ...result });
  }));

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'Endpoint required' });
    }

    const result = await pushNotificationService.removeSubscription(endpoint);
    res.json({ success: true, ...result });
  }));

  // Get user's push subscriptions
  app.get("/api/push/subscriptions", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const subscriptions = await pushNotificationService.getSubscriptions(req.user.id);
    res.json({ 
      success: true, 
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        marketResolutions: s.marketResolutions,
        priceAlerts: s.priceAlerts,
        bountyUpdates: s.bountyUpdates,
        tradeConfirmations: s.tradeConfirmations,
        aiAgentActivity: s.aiAgentActivity,
        weeklyDigest: s.weeklyDigest,
        morningBriefing: s.morningBriefing,
        eveningRecap: s.eveningRecap,
        marketMovers: s.marketMovers,
        macroAlerts: s.macroAlerts,
        breakingNews: s.breakingNews,
        coinDeskNews: s.coinDeskNews,
        fundingRateAlerts: s.fundingRateAlerts,
        liquidationAlerts: s.liquidationAlerts,
        whaleAlerts: s.whaleAlerts,
        volumeSpikes: s.volumeSpikes,
        weeklyPreview: s.weeklyPreview,
        streamLive: s.streamLive,
        streamTips: s.streamTips,
        streamMilestones: s.streamMilestones,
        streamReminders: s.streamReminders,
        lastUsed: s.lastUsed,
      }))
    });
  }));

  // Update notification preferences
  app.patch("/api/push/preferences", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { 
      marketResolutions, priceAlerts, bountyUpdates, tradeConfirmations, 
      aiAgentActivity, weeklyDigest, morningBriefing, eveningRecap,
      marketMovers, macroAlerts, breakingNews, coinDeskNews,
      fundingRateAlerts, liquidationAlerts, whaleAlerts, volumeSpikes, weeklyPreview,
      streamLive, streamTips, streamMilestones, streamReminders
    } = req.body;

    const result = await pushNotificationService.updatePreferences(req.user.id, {
      marketResolutions,
      priceAlerts,
      bountyUpdates,
      tradeConfirmations,
      aiAgentActivity,
      weeklyDigest,
      morningBriefing,
      eveningRecap,
      marketMovers,
      macroAlerts,
      breakingNews,
      coinDeskNews,
      fundingRateAlerts,
      liquidationAlerts,
      whaleAlerts,
      volumeSpikes,
      weeklyPreview,
      streamLive,
      streamTips,
      streamMilestones,
      streamReminders,
    });

    res.json({ success: true, ...result });
  }));

  // Test push notification (for debugging)
  app.post("/api/push/test", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    console.log(`🔔 [Push Test] Sending test notification to user: ${req.user.id}`);

    const result = await pushNotificationService.sendToUser(req.user.id, {
      title: '🎉 StreamAiX Notifications Active!',
      body: 'You\'re all set! You\'ll now receive alerts about market resolutions, trades, bounties, and more.',
      url: '/dashboard',
      tag: 'test-notification',
      actions: [
        { action: 'view_dashboard', title: '📊 Dashboard' },
        { action: 'dismiss', title: '✓ Got it' }
      ],
    });

    console.log(`🔔 [Push Test] Result for user ${req.user.id}:`, JSON.stringify(result));

    if (result.sent === 0 && result.success) {
      return res.json({ 
        success: false, 
        error: 'No active subscriptions found. Please enable notifications first.',
        ...result 
      });
    }

    res.json({ success: true, ...result });
  }));

  // Comprehensive push notification diagnostics endpoint
  app.get("/api/push/debug", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    console.log(`🔔 [Push Debug] Diagnostics requested by user: ${req.user.id}`);

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    
    // Get all subscriptions for this user
    const userSubscriptions = await pushNotificationService.getSubscriptions(req.user.id);
    
    // Get total subscription count from database
    const allSubscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    const diagnostics = {
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      
      // Server configuration status
      serverConfig: {
        vapidPublicKeyConfigured: !!vapidPublicKey,
        vapidPrivateKeyConfigured: !!vapidPrivateKey,
        vapidPublicKeyLength: vapidPublicKey?.length || 0,
        vapidPublicKeyPreview: vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : null,
        serviceInitialized: !!vapidPublicKey && !!vapidPrivateKey,
      },
      
      // User subscription status
      userSubscriptions: {
        count: userSubscriptions.length,
        devices: userSubscriptions.map(sub => ({
          id: sub.id,
          isActive: sub.isActive,
          createdAt: sub.createdAt,
          lastUsed: sub.lastUsed,
          deviceInfo: sub.deviceInfo,
          endpointPreview: sub.endpoint ? `${sub.endpoint.substring(0, 60)}...` : null,
          endpointType: sub.endpoint?.includes('fcm.googleapis.com') ? 'Chrome/FCM' 
            : sub.endpoint?.includes('mozilla.com') ? 'Firefox'
            : sub.endpoint?.includes('windows.com') ? 'Edge/Windows'
            : sub.endpoint?.includes('apple.com') || sub.endpoint?.includes('push.apple.com') ? 'Safari/iOS'
            : 'Unknown',
          hasP256dh: !!sub.p256dh,
          hasAuth: !!sub.auth,
          preferences: {
            marketResolutions: sub.marketResolutions,
            priceAlerts: sub.priceAlerts,
            bountyUpdates: sub.bountyUpdates,
            tradeConfirmations: sub.tradeConfirmations,
            aiAgentActivity: sub.aiAgentActivity,
            weeklyDigest: sub.weeklyDigest,
          }
        })),
      },
      
      // Platform-wide stats
      platformStats: {
        totalActiveSubscriptions: allSubscriptions.length,
        subscriptionsByType: {
          chrome: allSubscriptions.filter(s => s.endpoint?.includes('fcm.googleapis.com')).length,
          firefox: allSubscriptions.filter(s => s.endpoint?.includes('mozilla.com')).length,
          safari: allSubscriptions.filter(s => s.endpoint?.includes('apple.com') || s.endpoint?.includes('push.apple.com')).length,
          edge: allSubscriptions.filter(s => s.endpoint?.includes('windows.com')).length,
          other: allSubscriptions.filter(s => 
            !s.endpoint?.includes('fcm.googleapis.com') && 
            !s.endpoint?.includes('mozilla.com') && 
            !s.endpoint?.includes('apple.com') &&
            !s.endpoint?.includes('push.apple.com') &&
            !s.endpoint?.includes('windows.com')
          ).length,
        }
      },
      
      // Troubleshooting tips based on status
      troubleshooting: [] as string[],
    };
    
    // Add troubleshooting tips
    if (!diagnostics.serverConfig.serviceInitialized) {
      diagnostics.troubleshooting.push('CRITICAL: VAPID keys not configured on server');
    }
    if (diagnostics.userSubscriptions.count === 0) {
      diagnostics.troubleshooting.push('No active subscriptions for this user - enable notifications in settings');
    }
    if (diagnostics.platformStats.subscriptionsByType.safari === 0) {
      diagnostics.troubleshooting.push('No Safari/iOS subscriptions detected - iOS requires PWA installation first');
    }
    
    console.log(`🔔 [Push Debug] Diagnostics result:`, JSON.stringify(diagnostics, null, 2));

    res.json({ 
      success: true, 
      diagnostics 
    });
  }));

  // Enhanced test with detailed error reporting
  app.post("/api/push/test-detailed", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    console.log(`🔔 [Push Test Detailed] Starting for user: ${req.user.id}`);
    
    const testId = `test-${Date.now()}`;
    const steps: Array<{ step: string; status: 'success' | 'failed' | 'skipped'; details: string; timestamp: string }> = [];
    
    const addStep = (step: string, status: 'success' | 'failed' | 'skipped', details: string) => {
      steps.push({ step, status, details, timestamp: new Date().toISOString() });
      console.log(`🔔 [Push Test ${testId}] ${step}: ${status} - ${details}`);
    };

    // Step 1: Check VAPID configuration
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      addStep('VAPID Configuration', 'failed', 'VAPID keys not set in environment');
      return res.json({ success: false, testId, steps, finalStatus: 'VAPID keys missing' });
    }
    addStep('VAPID Configuration', 'success', `Public key: ${vapidPublicKey.substring(0, 20)}...`);

    // Step 2: Get user subscriptions
    const subscriptions = await pushNotificationService.getSubscriptions(req.user.id);
    
    if (subscriptions.length === 0) {
      addStep('Get Subscriptions', 'failed', 'No active subscriptions found for user');
      return res.json({ 
        success: false, 
        testId, 
        steps, 
        finalStatus: 'No subscriptions',
        hint: 'User needs to enable notifications first. On iOS, the app must be installed as PWA.'
      });
    }
    addStep('Get Subscriptions', 'success', `Found ${subscriptions.length} subscription(s)`);

    // Step 3: Attempt to send to each subscription
    const sendResults: Array<{ endpoint: string; success: boolean; error?: string }> = [];
    
    for (const sub of subscriptions) {
      try {
        addStep(`Prepare Subscription`, 'success', `Endpoint type: ${sub.endpoint?.includes('fcm') ? 'FCM/Chrome' : sub.endpoint?.includes('apple') ? 'Apple/Safari' : 'Other'}`);
        
        const webpush = (await import('web-push')).default;
        
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: `🧪 Test #${testId.slice(-4)}`,
            body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
            url: '/dashboard',
            tag: testId,
            timestamp: Date.now(),
            data: { type: 'test', testId }
          })
        );
        
        sendResults.push({ endpoint: sub.endpoint.substring(0, 50), success: true });
        addStep('Send Notification', 'success', `Delivered to ${sub.endpoint.substring(0, 40)}...`);
        
        // Update last used
        await db
          .update(pushSubscriptions)
          .set({ lastUsed: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
          
      } catch (error: any) {
        const errorCode = error.statusCode || 'unknown';
        const errorMessage = error.message || 'Unknown error';
        
        sendResults.push({ 
          endpoint: sub.endpoint.substring(0, 50), 
          success: false, 
          error: `${errorCode}: ${errorMessage}` 
        });
        
        addStep('Send Notification', 'failed', `Error ${errorCode}: ${errorMessage}`);
        
        // Handle stale subscriptions
        if (errorCode === 410 || errorCode === 404) {
          addStep('Cleanup', 'success', 'Removed stale subscription (410/404)');
          await pushNotificationService.removeSubscription(sub.endpoint);
        }
      }
    }

    const successCount = sendResults.filter(r => r.success).length;
    const failCount = sendResults.filter(r => !r.success).length;
    
    addStep('Final Summary', successCount > 0 ? 'success' : 'failed', 
      `Sent: ${successCount}, Failed: ${failCount}`);

    res.json({ 
      success: successCount > 0, 
      testId,
      steps,
      sendResults,
      finalStatus: successCount > 0 
        ? `Successfully sent to ${successCount} device(s)` 
        : `Failed to send to all ${failCount} device(s)`,
      hint: failCount > 0 
        ? 'Some notifications failed. Check if browser notifications are enabled and not blocked.'
        : undefined
    });
  }));

}
