import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: Record<string, any>;
  silent?: boolean;
  timestamp?: number;
}

class PushNotificationService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('⚠️ Push Notifications: VAPID keys not configured');
      return;
    }

    try {
      webpush.setVapidDetails(
        'mailto:notifications@streamaix.app',
        vapidPublicKey,
        vapidPrivateKey
      );
      this.initialized = true;
      console.log('🔔 Push Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  async saveSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    deviceInfo?: string
  ) {
    try {
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({
            userId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            deviceInfo,
            isActive: true,
            lastUsed: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

        return { success: true, updated: true };
      }

      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceInfo,
      });

      return { success: true, created: true };
    } catch (error: any) {
      console.error('Failed to save push subscription:', error);
      throw new Error('Failed to save subscription');
    }
  }

  async removeSubscription(endpoint: string) {
    try {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return { success: true };
    } catch (error: any) {
      console.error('Failed to remove push subscription:', error);
      throw new Error('Failed to remove subscription');
    }
  }

  async updatePreferences(
    userId: string,
    preferences: {
      marketResolutions?: boolean;
      priceAlerts?: boolean;
      bountyUpdates?: boolean;
      tradeConfirmations?: boolean;
      aiAgentActivity?: boolean;
      weeklyDigest?: boolean;
      morningBriefing?: boolean;
      eveningRecap?: boolean;
      marketMovers?: boolean;
      macroAlerts?: boolean;
      breakingNews?: boolean;
      coinDeskNews?: boolean;
      fundingRateAlerts?: boolean;
      liquidationAlerts?: boolean;
      whaleAlerts?: boolean;
      volumeSpikes?: boolean;
      weeklyPreview?: boolean;
    }
  ) {
    try {
      await db
        .update(pushSubscriptions)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.userId, userId));

      return { success: true };
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  async getSubscriptions(userId: string) {
    try {
      return await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.isActive, true)
          )
        );
    } catch (error: any) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  async sendToUser(userId: string, payload: PushPayload, notificationType?: string) {
    if (!this.initialized) {
      console.warn('🔔 Push notifications not initialized - VAPID keys missing');
      return { success: false, sent: 0, error: 'Push notifications not configured' };
    }

    try {
      const subscriptions = await this.getSubscriptions(userId);
      console.log(`🔔 [sendToUser] Found ${subscriptions.length} active subscriptions for user ${userId}`);
      
      if (subscriptions.length === 0) {
        console.log(`🔔 [sendToUser] No subscriptions found for user ${userId}`);
        return { success: true, sent: 0, failed: 0, reason: 'No active subscriptions' };
      }
      
      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        if (notificationType) {
          const shouldSend = this.checkNotificationPreference(sub, notificationType);
          if (!shouldSend) {
            console.log(`🔔 [sendToUser] Skipping notification type ${notificationType} - disabled by user`);
            continue;
          }
        }

        try {
          console.log(`🔔 [sendToUser] Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);
          
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              url: payload.url || '/',
              icon: payload.icon || '/icon-192.png',
              tag: payload.tag || 'streamaix-notification',
              requireInteraction: payload.requireInteraction || false,
              actions: payload.actions,
              timestamp: payload.timestamp || Date.now(),
              data: payload.data,
            })
          );

          await db
            .update(pushSubscriptions)
            .set({ lastUsed: new Date() })
            .where(eq(pushSubscriptions.id, sub.id));

          sent++;
          console.log(`🔔 [sendToUser] ✅ Successfully sent notification`);
        } catch (error: any) {
          console.error(`🔔 [sendToUser] ❌ Failed to send:`, error.statusCode, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🔔 [sendToUser] Removing stale subscription`);
            await this.removeSubscription(sub.endpoint);
          }
          failed++;
        }
      }

      console.log(`🔔 [sendToUser] Final result: sent=${sent}, failed=${failed}`);
      return { success: true, sent, failed };
    } catch (error: any) {
      console.error('🔔 [sendToUser] Failed to send push notification:', error);
      return { success: false, sent: 0, error: error.message };
    }
  }

  async sendToAll(payload: PushPayload, notificationType?: string) {
    if (!this.initialized) {
      console.warn('Push notifications not initialized');
      return { success: false, sent: 0 };
    }

    try {
      const allSubscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));

      let sent = 0;
      let failed = 0;

      for (const sub of allSubscriptions) {
        if (notificationType) {
          const shouldSend = this.checkNotificationPreference(sub, notificationType);
          if (!shouldSend) continue;
        }

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              url: payload.url || '/',
              icon: payload.icon || '/icon-192.png',
              tag: payload.tag || 'streamaix-broadcast',
              requireInteraction: payload.requireInteraction || false,
              actions: payload.actions,
            })
          );
          sent++;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.removeSubscription(sub.endpoint);
          }
          failed++;
        }
      }

      return { success: true, sent, failed };
    } catch (error: any) {
      console.error('Failed to broadcast push notification:', error);
      return { success: false, sent: 0, error: error.message };
    }
  }

  private checkNotificationPreference(subscription: any, type: string): boolean {
    switch (type) {
      case 'market_resolution':
        return subscription.marketResolutions;
      case 'price_alert':
        return subscription.priceAlerts;
      case 'bounty_update':
        return subscription.bountyUpdates;
      case 'trade_confirmation':
        return subscription.tradeConfirmations;
      case 'ai_agent_activity':
        return subscription.aiAgentActivity;
      case 'weekly_digest':
        return subscription.weeklyDigest;
      case 'morning_briefing':
        return subscription.morningBriefing ?? true;
      case 'evening_recap':
        return subscription.eveningRecap ?? true;
      case 'market_movers':
        return subscription.marketMovers ?? true;
      case 'macro_alerts':
        return subscription.macroAlerts ?? true;
      case 'breaking_news':
        return subscription.breakingNews ?? true;
      case 'coindesk_news':
        return subscription.coinDeskNews ?? true;
      case 'funding_rate_alerts':
        return subscription.fundingRateAlerts ?? true;
      case 'liquidation_alerts':
        return subscription.liquidationAlerts ?? true;
      case 'whale_alerts':
        return subscription.whaleAlerts ?? true;
      case 'volume_spikes':
        return subscription.volumeSpikes ?? true;
      case 'weekly_preview':
        return subscription.weeklyPreview ?? true;
      default:
        return true;
    }
  }

  async notifyMarketResolution(
    userId: string,
    marketQuestion: string,
    outcome: string,
    winnings?: number,
    percentReturn?: number,
    marketId?: string
  ) {
    const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toFixed(0);
    
    let title: string;
    let body: string;
    let actions: Array<{ action: string; title: string }>;

    if (winnings && winnings > 0) {
      const returnText = percentReturn ? ` (+${percentReturn.toFixed(0)}% return)` : '';
      title = winnings >= 1000 ? '🚀 Massive Win!' : '🎉 You Won!';
      body = `+${formatNumber(winnings)} STREAM${returnText}\n"${this.truncate(marketQuestion, 50)}" resolved ${outcome.toUpperCase()}`;
      actions = [
        { action: 'view_position', title: '💰 View Winnings' },
        { action: 'trade_more', title: '📈 Trade More' }
      ];
    } else {
      title = '📊 Market Resolved';
      body = `"${this.truncate(marketQuestion, 60)}" resolved ${outcome.toUpperCase()}`;
      actions = [
        { action: 'view', title: '📊 View Result' },
        { action: 'explore', title: '🔍 Find Markets' }
      ];
    }

    const payload: PushPayload = {
      title,
      body,
      url: marketId ? `/markets/${marketId}` : '/markets',
      tag: `market-resolution-${marketId || 'general'}`,
      requireInteraction: true,
      actions,
      timestamp: Date.now(),
      data: { type: 'market_resolution', marketId, winnings, outcome }
    };

    return this.sendToUser(userId, payload, 'market_resolution');
  }

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  async notifyBountyUpdate(
    userId: string,
    bountyTitle: string,
    updateType: 'assigned' | 'completed' | 'reward' | 'new_submission' | 'comment',
    rewardAmount?: number,
    bountyId?: string
  ) {
    const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toFixed(0);
    
    const configs = {
      assigned: {
        title: '🎯 New Assignment!',
        body: `You've been assigned to:\n"${this.truncate(bountyTitle, 50)}"`,
        actions: [
          { action: 'start_work', title: '🚀 Start Working' },
          { action: 'view_details', title: '📋 View Details' }
        ]
      },
      completed: {
        title: '✅ Submission Approved!',
        body: `Great work! Your submission for "${this.truncate(bountyTitle, 45)}" was approved${rewardAmount ? ` • +${formatNumber(rewardAmount)} STREAM incoming!` : ''}`,
        actions: [
          { action: 'claim_reward', title: '💰 Claim Reward' },
          { action: 'find_more', title: '🔍 Find More Bounties' }
        ]
      },
      reward: {
        title: '💰 Reward Claimed!',
        body: `+${rewardAmount ? formatNumber(rewardAmount) : '???'} STREAM\nFrom: "${this.truncate(bountyTitle, 45)}"`,
        actions: [
          { action: 'view_balance', title: '💎 View Balance' },
          { action: 'find_more', title: '🎯 More Bounties' }
        ]
      },
      new_submission: {
        title: '📝 New Submission!',
        body: `Someone submitted work for "${this.truncate(bountyTitle, 50)}"`,
        actions: [
          { action: 'review', title: '👀 Review Now' },
          { action: 'later', title: '⏰ Later' }
        ]
      },
      comment: {
        title: '💬 New Comment',
        body: `Activity on "${this.truncate(bountyTitle, 55)}"`,
        actions: [
          { action: 'view', title: '💬 View' },
          { action: 'dismiss', title: '✓ Dismiss' }
        ]
      }
    };

    const config = configs[updateType];

    const payload: PushPayload = {
      title: config.title,
      body: config.body,
      url: bountyId ? `/bounty-board/${bountyId}` : '/bounty-board',
      tag: `bounty-${updateType}-${bountyId || 'general'}`,
      requireInteraction: updateType === 'completed' || updateType === 'reward',
      actions: config.actions,
      timestamp: Date.now(),
      data: { type: 'bounty_update', updateType, bountyId, rewardAmount }
    };

    return this.sendToUser(userId, payload, 'bounty_update');
  }

  async notifyTradeConfirmation(
    userId: string,
    marketQuestion: string,
    position: 'YES' | 'NO' | string,
    amount: number,
    shares?: number,
    avgPrice?: number,
    marketId?: string
  ) {
    const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toFixed(0);
    const positionEmoji = position.toUpperCase() === 'YES' ? '🟢' : '🔴';
    const positionColor = position.toUpperCase();
    
    let priceInfo = '';
    if (avgPrice) {
      priceInfo = ` @ ${(avgPrice * 100).toFixed(0)}¢`;
    }
    
    let sharesInfo = '';
    if (shares) {
      sharesInfo = `\n${formatNumber(shares)} shares${priceInfo}`;
    }

    const payload: PushPayload = {
      title: `${positionEmoji} Trade Executed`,
      body: `${formatNumber(amount)} STREAM → ${positionColor}${sharesInfo}\n"${this.truncate(marketQuestion, 45)}"`,
      url: marketId ? `/markets/${marketId}` : '/markets',
      tag: `trade-${marketId || Date.now()}`,
      actions: [
        { action: 'view_position', title: '📊 View Position' },
        { action: 'trade_more', title: '📈 Trade More' }
      ],
      timestamp: Date.now(),
      data: { type: 'trade_confirmation', marketId, position, amount, shares, avgPrice }
    };

    return this.sendToUser(userId, payload, 'trade_confirmation');
  }

  async notifyPriceAlert(
    userId: string,
    asset: string,
    price: number,
    direction: 'above' | 'below',
    threshold: number,
    percentChange?: number
  ) {
    const formatPrice = (p: number) => {
      if (p >= 1000) return `$${(p/1000).toFixed(2)}K`;
      if (p >= 1) return `$${p.toFixed(2)}`;
      return `$${p.toFixed(4)}`;
    };

    const directionEmoji = direction === 'above' ? '📈' : '📉';
    const alertEmoji = Math.abs(percentChange || 0) >= 5 ? '🚨' : '⚡';
    
    let changeText = '';
    if (percentChange !== undefined) {
      const sign = percentChange >= 0 ? '+' : '';
      changeText = ` (${sign}${percentChange.toFixed(1)}%)`;
    }

    const payload: PushPayload = {
      title: `${alertEmoji} ${asset} ${direction === 'above' ? 'Breakout!' : 'Breakdown!'}`,
      body: `${directionEmoji} ${formatPrice(price)}${changeText}\nCrossed your ${formatPrice(threshold)} ${direction === 'above' ? 'resistance' : 'support'} level`,
      url: '/discover',
      tag: `price-alert-${asset.toLowerCase()}`,
      requireInteraction: true,
      actions: [
        { action: 'trade_now', title: '⚡ Trade Now' },
        { action: 'view_chart', title: '📊 View Chart' }
      ],
      timestamp: Date.now(),
      data: { type: 'price_alert', asset, price, direction, threshold, percentChange }
    };

    return this.sendToUser(userId, payload, 'price_alert');
  }

  async notifyAiAgentActivity(
    userId: string,
    agentName: string,
    activityType: 'trade' | 'bounty' | 'comment' | 'follow' | 'market_created',
    details: string,
    relatedId?: string
  ) {
    const configs = {
      trade: {
        title: '🤖 AI Agent Trade',
        emoji: '📈',
        actionText: 'executed a trade',
        url: '/markets'
      },
      bounty: {
        title: '🤖 AI Bounty Activity',
        emoji: '🎯',
        actionText: 'submitted work',
        url: '/bounty-board'
      },
      comment: {
        title: '🤖 AI Comment',
        emoji: '💬',
        actionText: 'commented',
        url: '/community'
      },
      follow: {
        title: '🤖 New AI Follower',
        emoji: '👤',
        actionText: 'started following you',
        url: '/profile'
      },
      market_created: {
        title: '🤖 New AI Market',
        emoji: '🎲',
        actionText: 'created a prediction market',
        url: '/markets'
      }
    };

    const config = configs[activityType];

    const payload: PushPayload = {
      title: config.title,
      body: `${config.emoji} @${agentName} ${config.actionText}\n${this.truncate(details, 60)}`,
      url: relatedId ? `${config.url}/${relatedId}` : config.url,
      tag: `ai-activity-${activityType}`,
      actions: [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '✓ Got it' }
      ],
      timestamp: Date.now(),
      data: { type: 'ai_agent_activity', activityType, agentName, relatedId }
    };

    return this.sendToUser(userId, payload, 'ai_agent_activity');
  }

  async notifyWeeklyDigest(
    userId: string,
    stats: {
      marketsResolved: number;
      totalWinnings: number;
      topMarket?: string;
      portfolioChange?: number;
    }
  ) {
    const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toFixed(0);
    
    let body = `📊 ${stats.marketsResolved} markets resolved this week`;
    
    if (stats.totalWinnings > 0) {
      body += `\n💰 +${formatNumber(stats.totalWinnings)} STREAM won`;
    }
    
    if (stats.portfolioChange !== undefined) {
      const sign = stats.portfolioChange >= 0 ? '+' : '';
      const emoji = stats.portfolioChange >= 0 ? '📈' : '📉';
      body += `\n${emoji} Portfolio: ${sign}${stats.portfolioChange.toFixed(1)}%`;
    }

    const payload: PushPayload = {
      title: '📬 Your Weekly StreamAiX Digest',
      body,
      url: '/dashboard',
      tag: 'weekly-digest',
      requireInteraction: false,
      actions: [
        { action: 'view_dashboard', title: '📊 Dashboard' },
        { action: 'explore_markets', title: '🎲 Explore' }
      ],
      timestamp: Date.now(),
      data: { type: 'weekly_digest', stats }
    };

    return this.sendToUser(userId, payload, 'weekly_digest');
  }
}

export const pushNotificationService = new PushNotificationService();
