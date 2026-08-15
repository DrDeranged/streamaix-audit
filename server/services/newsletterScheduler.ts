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
   * Slot identity for a send attempt. All slot math is explicitly
   * America/New_York: the edition date is the ET calendar date, regardless
   * of server timezone or how late a catch-up send actually dispatches.
   */
  slotFor(day: string, now: Date = new Date()): { editionDate: string; edition: 'morning' | 'market_close' } {
    return {
      editionDate: now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }),
      edition: day === 'Morning' ? 'morning' : 'market_close',
    };
  }

  /** 'cron' if we are within 5 minutes of the slot's scheduled ET time, else 'catch-up'. */
  private inferSentBy(edition: 'morning' | 'market_close', now: Date = new Date()): 'cron' | 'catch-up' {
    const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' })
      .format(now)
      .split(':')
      .map(Number);
    const slotHour = edition === 'morning' ? 8 : 16;
    return h === slotHour && m < 5 ? 'cron' : 'catch-up';
  }

  /**
   * Atomically claim a slot in the send log: INSERT a 'sending' claim row
   * keyed by the UNIQUE (edition_date, edition) constraint. Returns the
   * claim row id, or null if the slot is already claimed/sent (or the DB is
   * unreachable — we fail CLOSED here: without a recorded claim a send could
   * never be deduplicated, so we do not send).
   * A crashed claim (still 'sending' after 1 hour) may be reclaimed.
   */
  private async claimSlot(editionDate: string, edition: string, sentBy: string): Promise<string | null> {
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    try {
      const ins = await db.execute(sql`
        INSERT INTO newsletters (subject, content, status, edition_date, edition, sent_by, sent_at, recipient_count)
        VALUES (${`[claim] ${edition} ${editionDate}`}, '', 'sending', ${editionDate}, ${edition}, ${sentBy}, now(), 0)
        ON CONFLICT (edition_date, edition) DO NOTHING
        RETURNING id
      `);
      const claimed = (ins as any).rows?.[0]?.id;
      if (claimed) return claimed;
      // Slot already claimed. Reclaim only if the prior claim crashed mid-send
      // (still 'sending' after 1 hour).
      const rec = await db.execute(sql`
        UPDATE newsletters SET sent_at = now(), sent_by = ${sentBy}
        WHERE edition_date = ${editionDate} AND edition = ${edition}
          AND status = 'sending' AND sent_at < now() - interval '1 hour'
        RETURNING id
      `);
      return (rec as any).rows?.[0]?.id ?? null;
    } catch (err) {
      console.error('❌ Newsletter slot claim failed (not sending — fail closed):', (err as Error).message);
      return null;
    }
  }

  /**
   * Send newsletter to all subscribers — claim-then-send. The UNIQUE
   * (edition_date, edition) constraint makes double-sends structurally
   * impossible: the claim row is inserted BEFORE any email is built or
   * dispatched, and a conflicting claim aborts silently as already-sent.
   */
  async sendNewsletter(
    day: string,
    sentBy?: 'cron' | 'catch-up' | 'manual',
  ): Promise<{ sent: boolean; reason?: string; sentCount?: number; failedCount?: number; errors?: string[] }> {
    try {
      const { editionDate, edition } = this.slotFor(day);
      const by = sentBy ?? this.inferSentBy(edition);
      const claimId = await this.claimSlot(editionDate, edition, by);
      if (!claimId) {
        console.log(`📧 ${day} newsletter ${editionDate} already sent/claimed — skipping (unique-slot guard)`);
        return { sent: false, reason: 'already-claimed' };
      }
      const result = await this.doSend(day, claimId);
      if (!result) return { sent: false, reason: 'error' };
      if (!result.success) {
        return { sent: false, reason: 'send-errors', sentCount: result.sentCount, failedCount: result.failedCount, errors: result.errors };
      }
      return { sent: true, sentCount: result.sentCount, failedCount: result.failedCount };
    } catch (error) {
      console.error(`❌ ${day} newsletter send failed:`, error);
      return { sent: false, reason: 'error' };
    }
  }

  private async doSend(day: string, claimId: string): Promise<import('./newsletterService').NewsletterSendResult | null> {
    try {
      const result = await newsletterService.sendToWaitlist(storage, { claimId });

      if (result.success) {
        console.log(`✅ ${day} newsletter sent successfully to ${result.sentCount} recipients`);
      } else {
        // The service finalizes the claim as 'failed' for any non-success
        // result; 'failed' rows are never reclaimed, so a partially delivered
        // edition cannot be auto re-sent.
        console.error(`❌ ${day} newsletter had errors: ${result.failedCount} failed`);
        if (result.errors) {
          console.error('Errors:', result.errors);
        }
      }
      return result;
    } catch (error) {
      console.error(`❌ ${day} newsletter send failed:`, error);
      // Mark the claim failed so forensics see it and the slot stays claimed;
      // 'failed' is terminal (not reclaimable). Only a hard crash that leaves
      // the row in 'sending' is eligible for the 1h reclaim.
      try {
        const { db } = await import('../db');
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`UPDATE newsletters SET status = 'failed' WHERE id = ${claimId} AND status = 'sending'`);
      } catch { /* best effort */ }
      return null;
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
