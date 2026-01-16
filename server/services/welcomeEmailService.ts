import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate welcome email HTML
 */
function generateWelcomeHTML(email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to StreamAiX</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, rgba(30,30,60,0.95) 0%, rgba(20,20,40,0.98) 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.2) 50%, rgba(6,182,212,0.3) 100%); border-bottom: 1px solid rgba(139,92,246,0.3);">
        <div style="font-size: 42px; margin-bottom: 10px;">🚀</div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(90deg, #a78bfa 0%, #22d3ee 50%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          Welcome to StreamAiX
        </h1>
        <p style="margin: 15px 0 0; color: #94a3b8; font-size: 16px;">
          Your gateway to AI-powered market intelligence
        </p>
      </td>
    </tr>

    <!-- Welcome Message -->
    <tr>
      <td style="padding: 35px 30px;">
        <p style="font-size: 18px; color: #e2e8f0; margin: 0 0 20px; line-height: 1.6;">
          You're now part of an exclusive community receiving <strong style="color: #a78bfa;">maximum alpha</strong> delivered straight to your inbox.
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <span style="font-size: 24px;">📬</span>
            <strong style="color: #34d399; font-size: 18px;">What You'll Receive:</strong>
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #94a3b8; line-height: 2;">
            <li><strong style="color: #e2e8f0;">Morning Market Alpha</strong> - 8:00 AM EST daily</li>
            <li><strong style="color: #e2e8f0;">Market Close Recap</strong> - 4:00 PM EST daily</li>
          </ul>
        </div>
      </td>
    </tr>

    <!-- What's Included -->
    <tr>
      <td style="padding: 0 30px 35px;">
        <h2 style="color: #a78bfa; font-size: 20px; margin: 0 0 20px; font-weight: 700;">
          📊 Every Newsletter Includes:
        </h2>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
              <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; padding: 15px;">
                <div style="font-size: 20px; margin-bottom: 8px;">₿</div>
                <strong style="color: #e2e8f0; font-size: 14px;">Crypto Prices</strong>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">BTC, ETH, top movers</p>
              </div>
            </td>
            <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
              <div style="background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.2); border-radius: 10px; padding: 15px;">
                <div style="font-size: 20px; margin-bottom: 8px;">📈</div>
                <strong style="color: #e2e8f0; font-size: 14px;">Tech Stocks</strong>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">NVDA, AAPL, TSLA +more</p>
              </div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
              <div style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); border-radius: 10px; padding: 15px;">
                <div style="font-size: 20px; margin-bottom: 8px;">🎯</div>
                <strong style="color: #e2e8f0; font-size: 14px;">Prediction Markets</strong>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">Hot markets to watch</p>
              </div>
            </td>
            <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
              <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 15px;">
                <div style="font-size: 20px; margin-bottom: 8px;">🧠</div>
                <strong style="color: #e2e8f0; font-size: 14px;">AI Alpha Insight</strong>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">Actionable takeaways</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding: 0 30px 40px; text-align: center;">
        <a href="https://streamaix.com" style="display: inline-block; background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px rgba(139,92,246,0.4);">
          Explore StreamAiX →
        </a>
      </td>
    </tr>

    <!-- Features Preview -->
    <tr>
      <td style="padding: 30px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(139,92,246,0.2);">
        <h3 style="color: #a78bfa; font-size: 16px; margin: 0 0 15px; text-align: center;">
          🔥 Also Available on StreamAiX:
        </h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; text-align: center;">
          <strong style="color: #22d3ee;">Live AI Streams</strong> • 
          <strong style="color: #a78bfa;">Prediction Markets</strong> • 
          <strong style="color: #34d399;">Portfolio Tracker</strong> • 
          <strong style="color: #fbbf24;">Bounty Board</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 25px 30px; text-align: center; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(100,100,150,0.2);">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 10px;">
          You're receiving this because you subscribed to StreamAiX updates.
        </p>
        <p style="color: #475569; font-size: 11px; margin: 0;">
          © 2026 StreamAiX • AI-Powered Market Intelligence
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate welcome email plain text
 */
function generateWelcomeText(): string {
  return `
Welcome to StreamAiX! 🚀

You're now part of an exclusive community receiving maximum alpha delivered straight to your inbox.

WHAT YOU'LL RECEIVE:
📬 Morning Market Alpha - 8:00 AM EST daily
📬 Market Close Recap - 4:00 PM EST daily

EVERY NEWSLETTER INCLUDES:
• Crypto Prices (BTC, ETH, top movers)
• Tech Stocks (NVDA, AAPL, TSLA +more)
• Hot Prediction Markets
• AI Alpha Insight with actionable takeaways

ALSO AVAILABLE ON STREAMAIX:
• Live AI Streams
• Prediction Markets
• Portfolio Tracker
• Bounty Board

Visit us: https://streamaix.com

---
You're receiving this because you subscribed to StreamAiX updates.
© 2026 StreamAiX • AI-Powered Market Intelligence
  `.trim();
}

/**
 * Send welcome email to new subscriber
 */
export async function sendWelcomeEmail(email: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ RESEND_API_KEY not configured, skipping welcome email');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'StreamAiX <arslandin.founder@streamaix.com>',
      replyTo: 'arslandin.founder@streamaix.com',
      to: email,
      subject: '🚀 Welcome to StreamAiX - Your Market Alpha Awaits',
      html: generateWelcomeHTML(email),
      text: generateWelcomeText()
    });

    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return false;
  }
}
