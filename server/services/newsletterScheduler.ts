import cron from 'node-cron';
import { newsletterService } from './newsletterService';
import { storage } from '../storage';

/**
 * Newsletter scheduler service
 * Sends automated newsletters every Monday and Friday at 8am EST
 */
class NewsletterScheduler {
  private mondayJob: cron.ScheduledTask | null = null;
  private fridayJob: cron.ScheduledTask | null = null;
  private isStarted = false;

  /**
   * Start the newsletter scheduler
   * Sends newsletters Monday and Friday at 8am EST (12pm UTC in winter, 1pm UTC in summer)
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

    this.isStarted = true;
    console.log('✅ Newsletter scheduler started - Sends Monday & Friday at 8am EST');
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
}

export const newsletterScheduler = new NewsletterScheduler();
