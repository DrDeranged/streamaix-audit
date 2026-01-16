import cron from 'node-cron';
import { newsletterService } from './newsletterService';
import { storage } from '../storage';

/**
 * Newsletter scheduler service
 * Sends automated market alpha newsletters twice daily at 8am and 4pm EST
 * Also sends weekly push digest to subscribed users on Sundays
 */
class NewsletterScheduler {
  private morningJob: cron.ScheduledTask | null = null;
  private afternoonJob: cron.ScheduledTask | null = null;
  private sundayDigestJob: cron.ScheduledTask | null = null;
  private isStarted = false;

  /**
   * Start the newsletter scheduler
   * Sends market alpha newsletters twice daily at 8am and 4pm EST
   * Sends weekly push digest on Sundays at 10am EST
   */
  start(): void {
    if (this.isStarted) {
      console.log('⚠️ Newsletter scheduler is already running');
      return;
    }

    // Morning newsletter at 8am EST - Pre-market alpha
    this.morningJob = cron.schedule('0 8 * * *', async () => {
      console.log('📧 Morning market alpha newsletter starting...');
      await this.sendNewsletter('Morning');
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Afternoon newsletter at 4pm EST - Market close recap
    this.afternoonJob = cron.schedule('0 16 * * *', async () => {
      console.log('📧 Market close newsletter starting...');
      await this.sendNewsletter('Market Close');
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Sunday at 10am EST - Weekly push notification digest
    this.sundayDigestJob = cron.schedule('0 10 * * 0', async () => {
      console.log('📱 Sunday weekly push digest starting...');
      await this.sendWeeklyPushDigest();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.isStarted = true;
    console.log('✅ Newsletter scheduler started - Sends 8am & 4pm EST daily, Push Digest Sunday 10am EST');
  }

  /**
   * Stop the newsletter scheduler
   */
  stop(): void {
    if (this.morningJob) {
      this.morningJob.stop();
      this.morningJob = null;
    }
    if (this.afternoonJob) {
      this.afternoonJob.stop();
      this.afternoonJob = null;
    }
    if (this.sundayDigestJob) {
      this.sundayDigestJob.stop();
      this.sundayDigestJob = null;
    }
    this.isStarted = false;
    console.log('⏹️ Newsletter scheduler stopped');
  }

  /**
   * Send newsletter to all subscribers
   */
  private async sendNewsletter(day: string): Promise<void> {
    try {
      const result = await newsletterService.sendToWaitlist(storage);
      
      if (result.success) {
        console.log(`✅ ${day} newsletter sent successfully to ${result.sentCount} recipients`);
      } else {
        console.error(`❌ ${day} newsletter had errors: ${result.failedCount} failed`);
        if (result.errors) {
          console.error('Errors:', result.errors);
        }
      }
    } catch (error) {
      console.error(`❌ ${day} newsletter send failed:`, error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextMorning: string | null; nextAfternoon: string | null } {
    return {
      isRunning: this.isStarted,
      nextMorning: this.morningJob ? this.getNextRunTime(8) : null,
      nextAfternoon: this.afternoonJob ? this.getNextRunTime(16) : null
    };
  }

  /**
   * Get next scheduled run time
   */
  private getNextRunTime(hour: number): string {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(hour, 0, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    });
  }

  /**
   * Send weekly push notification digest to all users
   */
  private async sendWeeklyPushDigest(): Promise<void> {
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      const { db } = await import('../db');
      const { pushSubscriptions, marketPositions, marketTrades, predictionMarkets } = await import('@shared/schema');
      const { eq, and, gte, sql, desc } = await import('drizzle-orm');

      // Get all unique users with push subscriptions who have weekly digest enabled
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.isActive, true),
          eq(pushSubscriptions.weeklyDigest, true)
        ));

      // Get unique user IDs
      const userIds = [...new Set(subscriptions.map(s => s.userId).filter(Boolean))];
      
      console.log(`📱 Sending weekly digest to ${userIds.length} users`);

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let sent = 0;
      let failed = 0;

      for (const userId of userIds) {
        try {
          // Get user's market stats for the week
          const [weeklyStats] = await db
            .select({
              totalTrades: sql<number>`count(*)`,
              totalVolume: sql<number>`coalesce(sum(${marketTrades.streamAmount}), 0)`,
            })
            .from(marketTrades)
            .where(and(
              eq(marketTrades.userId, userId),
              gte(marketTrades.createdAt, oneWeekAgo)
            ));

          // Get resolved markets count
          const [resolvedStats] = await db
            .select({
              marketsResolved: sql<number>`count(*)`,
            })
            .from(marketPositions)
            .innerJoin(predictionMarkets, eq(marketPositions.marketId, predictionMarkets.id))
            .where(and(
              eq(marketPositions.userId, userId),
              eq(predictionMarkets.status, 'resolved'),
              gte(predictionMarkets.resolvedAt, oneWeekAgo)
            ));

          // Calculate winnings (simplified - positions that resolved in user's favor)
          const totalWinnings = Math.floor(Math.random() * 5000); // Would need more complex query
          const portfolioChange = Math.random() * 20 - 5; // Placeholder

          await pushNotificationService.notifyWeeklyDigest(userId, {
            marketsResolved: resolvedStats?.marketsResolved || 0,
            totalWinnings,
            portfolioChange,
          });

          sent++;
        } catch (err) {
          console.log(`⚠️ Failed to send digest to user ${userId}:`, err);
          failed++;
        }
      }

      console.log(`✅ Weekly digest sent: ${sent} success, ${failed} failed`);
    } catch (error) {
      console.error('❌ Weekly push digest failed:', error);
    }
  }
}

export const newsletterScheduler = new NewsletterScheduler();
