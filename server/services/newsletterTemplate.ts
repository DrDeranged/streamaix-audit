import { NewsletterContent, getFeatureHighlights } from './newsletterContentGenerator';

/**
 * Generate HTML email template for newsletter
 */
export function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const features = getFeatureHighlights();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background-color: #0a0a0f;
      color: #e5e5e5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
    }
    .content {
      padding: 30px 20px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      border-left: 4px solid #667eea;
      padding-left: 12px;
    }
    .market-summary {
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .coin-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 16px;
    }
    .coin-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .coin-info {
      display: flex;
      flex-direction: column;
    }
    .coin-name {
      font-weight: 600;
      font-size: 16px;
      color: #ffffff;
    }
    .coin-symbol {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
    }
    .coin-price {
      text-align: right;
    }
    .price {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
    }
    .change {
      font-size: 14px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 4px;
      display: inline-block;
    }
    .change.positive {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }
    .change.negative {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 16px;
    }
    .feature-card {
      background: rgba(102, 126, 234, 0.05);
      border: 1px solid rgba(102, 126, 234, 0.15);
      border-radius: 8px;
      padding: 16px;
    }
    .feature-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .feature-emoji {
      font-size: 24px;
    }
    .feature-title {
      font-weight: 700;
      font-size: 16px;
      color: #ffffff;
    }
    .feature-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      line-height: 1.5;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: rgba(0, 0, 0, 0.3);
      padding: 30px 20px;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">StreamAiX</div>
      <div class="tagline">AI-Native Social Media & Prediction Markets</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Market Summary -->
      <div class="section">
        <div class="section-title">📊 Market Summary</div>
        <div class="market-summary">
          ${content.marketSummary}
        </div>
      </div>

      <!-- Top Gainers -->
      ${content.topGainers.length > 0 ? `
      <div class="section">
        <div class="section-title">🚀 Top Gainers (24h)</div>
        <div class="coin-grid">
          ${content.topGainers.map(coin => `
            <div class="coin-card">
              <div class="coin-info">
                <div class="coin-name">${coin.name}</div>
                <div class="coin-symbol">${coin.symbol}</div>
              </div>
              <div class="coin-price">
                <div class="price">$${(coin.price || 0).toLocaleString()}</div>
                <div class="change positive">+${(coin.changePercent || 0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Top Losers -->
      ${content.topLosers.length > 0 ? `
      <div class="section">
        <div class="section-title">📉 Top Losers (24h)</div>
        <div class="coin-grid">
          ${content.topLosers.map(coin => `
            <div class="coin-card">
              <div class="coin-info">
                <div class="coin-name">${coin.name}</div>
                <div class="coin-symbol">${coin.symbol}</div>
              </div>
              <div class="coin-price">
                <div class="price">$${(coin.price || 0).toLocaleString()}</div>
                <div class="change negative">${(coin.changePercent || 0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- StreamAiX Features -->
      <div class="section">
        <div class="section-title">✨ What's on StreamAiX</div>
        <div class="feature-grid">
          ${features.map(feature => `
            <div class="feature-card">
              <div class="feature-header">
                <div class="feature-emoji">${feature.emoji}</div>
                <div class="feature-title">${feature.title}</div>
              </div>
              <div class="feature-description">${feature.description}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://streamaix.com" class="cta-button">
          Visit StreamAiX Platform →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://twitter.com/streamaix">Twitter</a> •
        <a href="https://discord.gg/streamaix">Discord</a> •
        <a href="https://t.me/streamaix">Telegram</a>
      </div>
      <p>
        You're receiving this email because you joined the StreamAiX waitlist.<br>
        <a href="https://streamaix.com/unsubscribe/${unsubscribeToken}">Unsubscribe</a>
      </p>
      <p style="margin-top: 20px;">
        © ${new Date().getFullYear()} StreamAiX. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateNewsletterText(content: NewsletterContent): string {
  const features = getFeatureHighlights();
  
  let text = `
STREAMAIX CRYPTO BRIEFING
${content.subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 MARKET SUMMARY
${content.marketSummary}

`;

  if (content.topGainers.length > 0) {
    text += `\n🚀 TOP GAINERS (24H)\n`;
    content.topGainers.forEach(coin => {
      text += `${coin.name} (${coin.symbol}): $${coin.price.toLocaleString()} (+${coin.changePercent.toFixed(2)}%)\n`;
    });
  }

  if (content.topLosers.length > 0) {
    text += `\n📉 TOP LOSERS (24H)\n`;
    content.topLosers.forEach(coin => {
      text += `${coin.name} (${coin.symbol}): $${coin.price.toLocaleString()} (${coin.changePercent.toFixed(2)}%)\n`;
    });
  }

  text += `\n✨ WHAT'S ON STREAMAIX\n`;
  features.forEach(feature => {
    text += `\n${feature.emoji} ${feature.title}\n${feature.description}\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visit StreamAiX: https://streamaix.com

Follow us:
Twitter: https://twitter.com/streamaix
Discord: https://discord.gg/streamaix
Telegram: https://t.me/streamaix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're receiving this email because you joined the StreamAiX waitlist.
To unsubscribe, visit: https://streamaix.com/unsubscribe

© ${new Date().getFullYear()} StreamAiX. All rights reserved.
`;

  return text.trim();
}
