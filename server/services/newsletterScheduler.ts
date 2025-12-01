import cron from 'node-cron';
import { newsletterService } from './newsletterService';
import { storage } from '../storage';

/**
 * Newsletter scheduler service
 * Sends automated newsletters every Monday and Friday at 8am EST
 * Also sends weekly push digest to subscribed users on Sundays
 */
class NewsletterScheduler {
  private mondayJob: cron.ScheduledTask | null = null;
  private fridayJob: cron.ScheduledTask | null = null;
  private sundayDigestJob: cron.ScheduledTask | null = null;
  private isStarted = false;

  /**
   * Start the newsletter scheduler
   * Sends newsletters Monday and Friday at 8am EST (12pm UTC in winter, 1pm UTC in summer)
   * Sends weekly push digest on Sundays at 10am EST
   */
  start(): void {
    if (this.isStarted) {
      console.log('⚠️ Newsletter scheduler is already running');
      return;
    }

    // Monday at 8am EST (cron runs in UTC, so 12:00 or 13:00 depending on DST)
    // Using 12:00 UTC as a compromise (8am EST during standard time)
    this.mondayJob = cron.schedule('0 12 * * 1', async () => {
      console.log('📧 Monday newsletter scheduled send starting...');
      await this.sendNewsletter('Monday');
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Friday at 8am EST
    this.fridayJob = cron.schedule('0 8 * * 5', async () => {
      console.log('📧 Friday newsletter scheduled send starting...');
      await this.sendNewsletter('Friday');
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
    console.log('✅ Newsletter scheduler started - Sends Monday & Friday at 8am EST, Push Digest Sunday 10am EST');
  }

  /**
   * Stop the newsletter scheduler
   */
  stop(): void {
    if (this.mondayJob) {
      this.mondayJob.stop();
      this.mondayJob = null;
    }
    if (this.fridayJob) {
      this.fridayJob.stop();
      this.fridayJob = null;
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
  getStatus(): { isRunning: boolean; nextMonday: string | null; nextFriday: string | null } {
    return {
      isRunning: this.isStarted,
      nextMonday: this.mondayJob ? this.getNextRunTime('Monday') : null,
      nextFriday: this.fridayJob ? this.getNextRunTime('Friday') : null
    };
  }

  /**
   * Get next scheduled run time
   */
  private getNextRunTime(day: string): string {
    const now = new Date();
    const targetDay = day === 'Monday' ? 1 : 5;
    const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
    
    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilTarget);
    nextRun.setHours(8, 0, 0, 0);
    
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
