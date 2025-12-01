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
      console.warn('🔔 [sendToAll] Push notifications not initialized - VAPID keys missing');
      return { success: false, sent: 0 };
    }

    try {
      const allSubscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));

      console.log(`🔔 [sendToAll] Broadcasting "${payload.title}" to ${allSubscriptions.length} subscriptions (type: ${notificationType || 'general'})`);
      
      let sent = 0;
      let failed = 0;
      let skipped = 0;

      for (const sub of allSubscriptions) {
        if (notificationType) {
          const shouldSend = this.checkNotificationPreference(sub, notificationType);
          if (!shouldSend) {
            skipped++;
            continue;
          }
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
          console.error(`🔔 [sendToAll] ❌ Failed to send to endpoint:`, error.statusCode, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🔔 [sendToAll] Removing stale subscription`);
            await this.removeSubscription(sub.endpoint);
          }
          failed++;
        }
      }

      console.log(`🔔 [sendToAll] Result: sent=${sent}, failed=${failed}, skipped=${skipped}`);
      return { success: true, sent, failed };
    } catch (error: any) {
      console.error('🔔 [sendToAll] Failed to broadcast push notification:', error);
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
      const returnPct = percentReturn ? ` · +${percentReturn.toFixed(0)}%` : '';
      title = winnings >= 1000 ? `🚀 +${formatNumber(winnings)} STREAM${returnPct}` : `🎉 +${formatNumber(winnings)} STREAM${returnPct}`;
      body = `${outcome.toUpperCase()} won\n\n${this.truncate(marketQuestion, 55)}`;
      actions = [
        { action: 'view_position', title: '💰 View' },
        { action: 'trade_more', title: '📈 Trade' }
      ];
    } else {
      title = `📊 Resolved ${outcome.toUpperCase()}`;
      body = this.truncate(marketQuestion, 70);
      actions = [
        { action: 'view', title: '📊 View' },
        { action: 'explore', title: '🔍 Markets' }
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
        title: '🎯 New Assignment',
        body: this.truncate(bountyTitle, 60),
        actions: [
          { action: 'start_work', title: '🚀 Start' },
          { action: 'view_details', title: '📋 Details' }
        ]
      },
      completed: {
        title: rewardAmount ? `✅ Approved · +${formatNumber(rewardAmount)} STREAM` : '✅ Approved',
        body: this.truncate(bountyTitle, 60),
        actions: [
          { action: 'claim_reward', title: '💰 Claim' },
          { action: 'find_more', title: '🔍 More' }
        ]
      },
      reward: {
        title: `💰 +${rewardAmount ? formatNumber(rewardAmount) : '???'} STREAM`,
        body: `Reward claimed\n\n${this.truncate(bountyTitle, 50)}`,
        actions: [
          { action: 'view_balance', title: '💎 Balance' },
          { action: 'find_more', title: '🎯 More' }
        ]
      },
      new_submission: {
        title: '📝 New Submission',
        body: this.truncate(bountyTitle, 60),
        actions: [
          { action: 'review', title: '👀 Review' },
          { action: 'later', title: '⏰ Later' }
        ]
      },
      comment: {
        title: '💬 New Comment',
        body: this.truncate(bountyTitle, 60),
        actions: [
          { action: 'view', title: '💬 View' },
          { action: 'dismiss', title: '✓ OK' }
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
      title: `${positionEmoji} ${positionColor} · ${formatNumber(amount)} STREAM`,
      body: `${shares ? formatNumber(shares) + ' shares' : ''}${priceInfo}\n\n${this.truncate(marketQuestion, 50)}`,
      url: marketId ? `/markets/${marketId}` : '/markets',
      tag: `trade-${marketId || Date.now()}`,
      actions: [
        { action: 'view_position', title: '📊 View' },
        { action: 'trade_more', title: '📈 Trade' }
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

    const levelType = direction === 'above' ? 'resistance' : 'support';
    const payload: PushPayload = {
      title: `${alertEmoji} ${asset} ${direction === 'above' ? '↗️' : '↘️'} ${formatPrice(price)}`,
      body: `Crossed ${formatPrice(threshold)} ${levelType}${changeText}`,
      url: '/discover',
      tag: `price-alert-${asset.toLowerCase()}`,
      requireInteraction: true,
      actions: [
        { action: 'trade_now', title: '⚡ Trade' },
        { action: 'view_chart', title: '📊 Chart' }
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
        title: `🤖 @${agentName} traded`,
        emoji: '📈',
        url: '/markets'
      },
      bounty: {
        title: `🤖 @${agentName} submitted`,
        emoji: '🎯',
        url: '/bounty-board'
      },
      comment: {
        title: `💬 @${agentName} commented`,
        emoji: '💬',
        url: '/community'
      },
      follow: {
        title: `👤 @${agentName} followed you`,
        emoji: '👤',
        url: '/profile'
      },
      market_created: {
        title: `🎲 @${agentName} created market`,
        emoji: '🎲',
        url: '/markets'
      }
    };

    const config = configs[activityType];

    const payload: PushPayload = {
      title: config.title,
      body: this.truncate(details, 70),
      url: relatedId ? `${config.url}/${relatedId}` : config.url,
      tag: `ai-activity-${activityType}`,
      actions: [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '✓ OK' }
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
      title: '📬 Weekly Digest',
      body,
      url: '/dashboard',
      tag: 'weekly-digest',
      requireInteraction: false,
      actions: [
        { action: 'view_dashboard', title: '📊 View' },
        { action: 'explore_markets', title: '🎲 Explore' }
      ],
      timestamp: Date.now(),
      data: { type: 'weekly_digest', stats }
    };

    return this.sendToUser(userId, payload, 'weekly_digest');
  }
}

export const pushNotificationService = new PushNotificationService();
