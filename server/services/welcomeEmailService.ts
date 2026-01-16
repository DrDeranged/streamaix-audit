import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate mobile-optimized welcome email HTML
 * Uses table-based layout and inline styles for maximum email client compatibility
 */
function generateWelcomeHTML(email: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
  <title>Welcome to StreamAiX</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #0a0a14; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a14;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Content Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #12121f; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 24px; background-color: #1a1a2e; border-bottom: 2px solid #7c3aed;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-size: 48px;">🚀</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; color: #a78bfa; line-height: 1.2;">
                      Welcome to StreamAiX
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #94a3b8; line-height: 1.5;">
                      Your gateway to AI-powered market intelligence
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 17px; color: #e2e8f0; line-height: 1.6;">
                You're now part of an exclusive community receiving <strong style="color: #a78bfa;">maximum alpha</strong> delivered straight to your inbox.
              </p>
              
              <!-- What You'll Receive Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e3a2f; border: 2px solid #22c55e; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <span style="font-size: 24px; vertical-align: middle;">📬</span>
                          <strong style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #4ade80; margin-left: 8px; vertical-align: middle;">What You'll Receive:</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; padding-left: 8px; border-left: 3px solid #4ade80;">
                          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #ffffff; line-height: 1.4;">
                            <strong>Morning Market Alpha</strong>
                          </p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #94a3b8;">
                            8:00 AM EST daily
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0 8px; border-left: 3px solid #4ade80;">
                          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #ffffff; line-height: 1.4;">
                            <strong>Market Close Recap</strong>
                          </p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #94a3b8;">
                            4:00 PM EST daily
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Included -->
          <tr>
            <td style="padding: 0 24px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #a78bfa; font-weight: 700;">
                📊 Every Newsletter Includes:
              </h2>
              
              <!-- 2x2 Grid using nested tables -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48%" valign="top" style="padding: 0 4px 8px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1f1f3a; border: 1px solid #7c3aed; border-radius: 10px;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">₿</span>
                          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff;">Crypto Prices</p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8;">BTC, ETH, top movers</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="48%" valign="top" style="padding: 0 0 8px 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a2f3d; border: 1px solid #06b6d4; border-radius: 10px;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">📈</span>
                          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff;">Tech Stocks</p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8;">NVDA, AAPL, TSLA</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="48%" valign="top" style="padding: 0 4px 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #2a2514; border: 1px solid #f59e0b; border-radius: 10px;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">🎯</span>
                          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff;">Predictions</p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8;">Hot markets to watch</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="48%" valign="top" style="padding: 0 0 0 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e3a2f; border: 1px solid #22c55e; border-radius: 10px;">
                      <tr>
                        <td style="padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">🧠</span>
                          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff;">AI Alpha</p>
                          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8;">Actionable insights</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #7c3aed; border-radius: 12px;">
                    <a href="https://streamaix.com" target="_blank" style="display: inline-block; padding: 18px 48px; font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px;">
                      Explore StreamAiX →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features Preview -->
          <tr>
            <td style="padding: 24px; background-color: #0d0d18; border-top: 1px solid #2d2d4a;">
              <h3 style="margin: 0 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #a78bfa; text-align: center; font-weight: 700;">
                🔥 Also on StreamAiX:
              </h3>
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #94a3b8; line-height: 1.8; text-align: center;">
                <span style="color: #22d3ee;">Live AI Streams</span> • 
                <span style="color: #a78bfa;">Prediction Markets</span><br/>
                <span style="color: #4ade80;">Portfolio Tracker</span> • 
                <span style="color: #fbbf24;">Bounty Board</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #080810; text-align: center;">
              <p style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #64748b;">
                You're receiving this because you subscribed to StreamAiX.
              </p>
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #475569;">
                © 2026 StreamAiX • AI-Powered Market Intelligence
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Content Table -->
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper Table -->

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
