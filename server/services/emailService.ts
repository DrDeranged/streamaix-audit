import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private fromEmail = 'onboarding@resend.dev'; // You'll update this to your verified domain
  private adminEmail = 'arslandin.founder@streamaix.com';

  async sendWaitlistConfirmation(email: string, name?: string): Promise<void> {
    const displayName = name || 'there';
    
    try {
      await resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🎉 Welcome to StreamAiX Waitlist!',
        html: this.getConfirmationEmailTemplate(displayName),
      });
      console.log(`✅ Confirmation email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  async sendAdminNotification(email: string, name?: string): Promise<void> {
    try {
      await resend.emails.send({
        from: this.fromEmail,
        to: this.adminEmail,
        subject: '🚀 New StreamAiX Waitlist Signup',
        html: this.getAdminNotificationTemplate(email, name),
      });
      console.log(`✅ Admin notification sent for ${email}`);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      // Don't throw - admin notification failure shouldn't block user experience
    }
  }

  private getConfirmationEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            margin: 10px 0 0 0;
            font-size: 16px;
          }
          .content {
            background: #ffffff;
            padding: 40px 30px;
            border: 1px solid #e0e0e0;
          }
          .content h2 {
            color: #667eea;
            margin-top: 0;
          }
          .features {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .features li {
            margin: 8px 0;
            color: #555;
          }
          .cta {
            text-align: center;
            margin: 30px 0;
          }
          .cta a {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            font-weight: 600;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .footer p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>StreamAiX</h1>
          <p>AI-Native Content Analysis & Prediction Markets</p>
        </div>
        
        <div class="content">
          <h2>Hey ${name}! 👋</h2>
          
          <p>You're officially on the <strong>StreamAiX waitlist</strong>! We're thrilled to have you join us on this journey.</p>
          
          <p>StreamAiX is building the future of decentralized AI content analysis and prediction markets. Here's what you can expect:</p>
          
          <div class="features">
            <ul>
              <li>🤖 <strong>AI-Powered Analysis</strong> - GPT-4 transforms podcasts and videos into actionable insights</li>
              <li>📊 <strong>Prediction Markets</strong> - Trade on outcomes with autonomous AI agents</li>
              <li>💰 <strong>DeFi Bounties</strong> - Earn STREAM tokens for quality content analysis</li>
              <li>📈 <strong>Market Intelligence</strong> - Real-time analytics across crypto and stocks</li>
              <li>🌐 <strong>Web3 Native</strong> - Built on Base with decentralized storage</li>
            </ul>
          </div>
          
          <p>We'll notify you as soon as StreamAiX launches. In the meantime, follow our progress:</p>
          
          <div class="cta">
            <a href="https://twitter.com/streamaix" target="_blank">Follow on Twitter</a>
          </div>
          
          <p>Got questions? Reply to this email anytime. We read every message.</p>
          
          <p>Thanks for believing in the future of AI-powered content!</p>
          
          <p style="margin-top: 30px;">
            <strong>The StreamAiX Team</strong><br>
            <em>Stream the Noise. Capture the Signal.</em>
          </p>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="https://twitter.com/streamaix">Twitter</a> •
            <a href="https://github.com/streamaix">GitHub</a> •
            <a href="https://discord.gg/streamaix">Discord</a>
          </div>
          <p>&copy; 2025 StreamAiX. All rights reserved.</p>
          <p style="font-size: 12px; color: #999;">
            You're receiving this because you joined our waitlist.<br>
            We'll only email you about important updates.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getAdminNotificationTemplate(email: string, name?: string): string {
    const displayName = name ? `${name} (${email})` : email;
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
          }
          .info-box p {
            margin: 5px 0;
          }
          .label {
            font-weight: 600;
            color: #059669;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 New Waitlist Signup</h1>
        </div>
        
        <div class="content">
          <p>Great news! Someone just joined the StreamAiX waitlist.</p>
          
          <div class="info-box">
            <p><span class="label">Email:</span> ${email}</p>
            ${name ? `<p><span class="label">Name:</span> ${name}</p>` : ''}
            <p><span class="label">Source:</span> Landing Page</p>
            <p><span class="label">Timestamp:</span> ${timestamp}</p>
          </div>
          
          <p>A confirmation email has been automatically sent to the user.</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            This notification was sent from your StreamAiX waitlist system.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
