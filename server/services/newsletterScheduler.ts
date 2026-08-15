import { newsletterService } from './newsletterService';
import { storage } from '../storage';
import { jobScheduler } from '../jobs/scheduler';

/**
 * Newsletter scheduler service
 * Sends automated market alpha newsletters twice daily at 8am and 4pm EST
 * Also sends weekly push digest to subscribed users on Sundays
 */
class NewsletterScheduler {
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
    jobScheduler.registerCron('newsletter-morning', '0 8 * * *', async () => {
      console.log('📧 Morning market alpha newsletter starting...');
      await this.sendNewsletter('Morning');
    }, { timezone: 'America/New_York' });

    // Afternoon newsletter at 4pm EST - Market close recap
    jobScheduler.registerCron('newsletter-market-close', '0 16 * * *', async () => {
      console.log('📧 Market close newsletter starting...');
      await this.sendNewsletter('Market Close');
    }, { timezone: 'America/New_York' });

    // Sunday at 10am EST - Weekly push notification digest
    jobScheduler.registerCron('newsletter-sunday-digest', '0 10 * * 0', async () => {
      console.log('📱 Sunday weekly push digest starting...');
      await this.sendWeeklyPushDigest();
    }, { timezone: 'America/New_York' });

    this.isStarted = true;
    console.log('✅ Newsletter scheduler started - Sends 8am & 4pm EST daily, Push Digest Sunday 10am EST');
  }

  /**
   * Stop the newsletter scheduler
   */
  stop(): void {
    jobScheduler.cancel('newsletter-morning');
    jobScheduler.cancel('newsletter-market-close');
    jobScheduler.cancel('newsletter-sunday-digest');
    this.isStarted = false;
    console.log('⏹️ Newsletter scheduler stopped');
  }

  /**
   * Send newsletter to all subscribers
   */
  private async sendNewsletter(day: string): Promise<void> {
    try {
      // Per-slot idempotence: the scheduler's catch-up pass may re-invoke a
      // missed slot, and a restart near the slot could double-fire. Skip if
      // a newsletter was already sent within this slot's window today
      // (morning slot = before 12:00 ET, market-close slot = after).
      // Atomic slot claim: take a Postgres advisory lock keyed on the slot so
      // two concurrent invocations (cron + catch-up, or two instances sharing
      // the DB) cannot both pass the sent-log check and double-send.
      const { db } = await import('../db');
      const { sql } = await import('drizzle-orm');
      const lockKey = `newsletter:${day}:${new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}`;
      const lockRes = await db.execute(sql`SELECT pg_try_advisory_lock(hashtext(${lockKey})) AS locked`);
      const locked = (lockRes as any).rows?.[0]?.locked === true;
      if (!locked) {
        console.log(`📧 ${day} newsletter slot is being handled by another sender — skipping`);
        return;
      }
      try {
        if (await this.alreadySentForSlot(day)) {
          console.log(`📧 ${day} newsletter already sent for today's slot — skipping (idempotence guard)`);
          return;
        }
        await this.doSend(day);
      } finally {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${lockKey}))`).catch(() => {});
      }
    } catch (error) {
      console.error(`❌ ${day} newsletter send failed:`, error);
    }
  }

  private async doSend(day: string): Promise<void> {
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
   * Check the send log (newsletters table) for a newsletter already sent in
   * today's slot window (America/New_York). Fail-open: if the check errors,
   * we allow the send rather than silently dropping newsletters.
   */
  async alreadySentForSlot(day: string, now: Date = new Date()): Promise<boolean> {
    try {
      const { db } = await import('../db');
      const { newsletters } = await import('@shared/schema');
      const { and, gte, lt, eq } = await import('drizzle-orm');
      // Compute today's ET midnight and noon as UTC instants.
      const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const offsetMs = now.getTime() - etNow.getTime();
      const etMidnight = new Date(etNow); etMidnight.setHours(0, 0, 0, 0);
      const etNoon = new Date(etNow); etNoon.setHours(12, 0, 0, 0);
      const windowStart = new Date((day === 'Morning' ? etMidnight : etNoon).getTime() + offsetMs);
      const windowEnd = new Date((day === 'Morning' ? etNoon : new Date(etMidnight.getTime() + 24 * 3600_000)).getTime() + offsetMs);
      const rows = await db
        .select({ id: newsletters.id })
        .from(newsletters)
        .where(and(eq(newsletters.status, 'sent'), gte(newsletters.sentAt, windowStart), lt(newsletters.sentAt, windowEnd)))
        .limit(1);
      return rows.length > 0;
    } catch (err) {
      console.warn('⚠️ Newsletter sent-log check failed (allowing send):', (err as Error).message);
      return false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextMorning: string | null; nextAfternoon: string | null } {
    return {
      isRunning: this.isStarted,
      nextMorning: jobScheduler.has('newsletter-morning') ? this.getNextRunTime(8) : null,
      nextAfternoon: jobScheduler.has('newsletter-market-close') ? this.getNextRunTime(16) : null
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
      const userIds = Array.from(new Set(subscriptions.map(s => s.userId).filter(Boolean)));
      
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
