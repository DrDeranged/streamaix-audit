import { Resend } from 'resend';
import { generateNewsletterContent } from './newsletterContentGenerator';
import { generateNewsletterHTML, generateNewsletterText } from './newsletterTemplate';
import type { Waitlist, Newsletter, InsertNewsletter } from '@shared/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewsletterSendResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  newsletterId?: string;
  errors?: string[];
}

/**
 * Newsletter service for batch sending emails to waitlist
 */
class NewsletterService {
  /**
   * Generate and send newsletter to all subscribed waitlist users
   */
  async sendToWaitlist(storage: any): Promise<NewsletterSendResult> {
    try {
      console.log('📧 Generating newsletter content...');
      
      // Generate newsletter content from live market data
      const content = await generateNewsletterContent();
      
      console.log('📋 Fetching subscribed recipients...');
      
      // Get all non-unsubscribed waitlist emails
      const recipients = await storage.getSubscribedWaitlist();
      
      if (recipients.length === 0) {
        console.log('⚠️ No recipients found');
        return {
          success: true,
          sentCount: 0,
          failedCount: 0
        };
      }

      console.log(`📨 Sending newsletter to ${recipients.length} recipients...`);

      // Save newsletter to database
      const newsletter = await storage.createNewsletter({
        subject: content.subject,
        content: JSON.stringify(content),
        marketData: content,
        recipientCount: recipients.length,
        status: 'sent'
      });

      // Send emails in batches (Resend allows up to 100 recipients per email)
      const batchSize = 100;
      const results = {
        sentCount: 0,
        failedCount: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        try {
          await this.sendBatch(batch, content);
          results.sentCount += batch.length;
          
          // Rate limiting: wait 1 second between batches
          if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to send batch ${i / batchSize + 1}:`, error);
          results.failedCount += batch.length;
          results.errors.push(`Batch ${i / batchSize + 1}: ${error}`);
        }
      }

      console.log(`✅ Newsletter sent: ${results.sentCount} successful, ${results.failedCount} failed`);

      return {
        success: results.failedCount === 0,
        sentCount: results.sentCount,
        failedCount: results.failedCount,
        newsletterId: newsletter.id,
        errors: results.errors.length > 0 ? results.errors : undefined
      };
    } catch (error) {
      console.error('❌ Newsletter send failed:', error);
      throw error;
    }
  }

  /**
   * Send newsletter to a batch of recipients
   */
  private async sendBatch(recipients: Waitlist[], content: any): Promise<void> {
    const emailPromises = recipients.map(async (recipient) => {
      // Generate unsubscribe token if not exists
      const unsubscribeToken = recipient.unsubscribeToken || this.generateUnsubscribeToken();
      
      const htmlContent = generateNewsletterHTML(content, unsubscribeToken);
      const textContent = generateNewsletterText(content);

      try {
        await resend.emails.send({
          from: 'StreamAiX <onboarding@resend.dev>',
          to: recipient.email,
          subject: content.subject,
          html: htmlContent,
          text: textContent,
          headers: {
            'List-Unsubscribe': `<https://streamaix.com/unsubscribe/${unsubscribeToken}>`,
          }
        });
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        throw error;
      }
    });

    await Promise.all(emailPromises);
  }

  /**
   * Send test newsletter to a specific email
   */
  async sendTestNewsletter(email: string): Promise<void> {
    const content = await generateNewsletterContent();
    const testToken = this.generateUnsubscribeToken();
    
    const htmlContent = generateNewsletterHTML(content, testToken);
    const textContent = generateNewsletterText(content);

    await resend.emails.send({
      from: 'StreamAiX <onboarding@resend.dev>',
      to: email,
      subject: `[TEST] ${content.subject}`,
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Generate a unique unsubscribe token
   */
  private generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Unsubscribe a user from newsletters
   */
  async unsubscribe(storage: any, token: string): Promise<boolean> {
    try {
      const result = await storage.unsubscribeFromNewsletter(token);
      return result;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }
}

export const newsletterService = new NewsletterService();
