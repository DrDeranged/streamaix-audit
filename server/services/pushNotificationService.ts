import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
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
      console.warn('Push notifications not initialized');
      return { success: false, sent: 0 };
    }

    try {
      const subscriptions = await this.getSubscriptions(userId);
      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
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
              tag: payload.tag || 'streamaix-notification',
              requireInteraction: payload.requireInteraction || false,
              actions: payload.actions,
            })
          );

          await db
            .update(pushSubscriptions)
            .set({ lastUsed: new Date() })
            .where(eq(pushSubscriptions.id, sub.id));

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
      console.error('Failed to send push notification:', error);
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
      default:
        return true;
    }
  }

  async notifyMarketResolution(
    userId: string,
    marketQuestion: string,
    outcome: string,
    winnings?: number
  ) {
    const payload: PushPayload = {
      title: winnings && winnings > 0 ? '🎉 You Won!' : '📊 Market Resolved',
      body: winnings && winnings > 0
        ? `You won ${winnings} STREAM! "${marketQuestion}" resolved ${outcome}`
        : `"${marketQuestion}" resolved ${outcome}`,
      url: '/markets',
      tag: 'market-resolution',
      requireInteraction: true,
    };

    return this.sendToUser(userId, payload, 'market_resolution');
  }

  async notifyBountyUpdate(
    userId: string,
    bountyTitle: string,
    updateType: 'assigned' | 'completed' | 'reward'
  ) {
    const messages = {
      assigned: `You've been assigned to: "${bountyTitle}"`,
      completed: `Your submission for "${bountyTitle}" was approved!`,
      reward: `You earned rewards from "${bountyTitle}"`,
    };

    const payload: PushPayload = {
      title: updateType === 'reward' ? '💰 Reward Earned!' : '📋 Bounty Update',
      body: messages[updateType],
      url: '/bounty-board',
      tag: 'bounty-update',
    };

    return this.sendToUser(userId, payload, 'bounty_update');
  }

  async notifyTradeConfirmation(
    userId: string,
    marketQuestion: string,
    position: string,
    amount: number
  ) {
    const payload: PushPayload = {
      title: '✅ Trade Confirmed',
      body: `${amount} STREAM on ${position} for "${marketQuestion}"`,
      url: '/markets',
      tag: 'trade-confirmation',
    };

    return this.sendToUser(userId, payload, 'trade_confirmation');
  }

  async notifyPriceAlert(
    userId: string,
    asset: string,
    price: number,
    direction: 'above' | 'below',
    threshold: number
  ) {
    const payload: PushPayload = {
      title: `🚨 ${asset} Price Alert`,
      body: `${asset} is now ${direction} $${threshold} (Current: $${price.toFixed(2)})`,
      url: '/discover',
      tag: 'price-alert',
      requireInteraction: true,
    };

    return this.sendToUser(userId, payload, 'price_alert');
  }
}

export const pushNotificationService = new PushNotificationService();
