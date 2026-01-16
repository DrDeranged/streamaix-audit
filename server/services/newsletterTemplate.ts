import { NewsletterContent, getFeatureHighlights } from './newsletterContentGenerator';

/**
 * Generate HTML email template for newsletter - Mobile-First Design
 */
export function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const features = getFeatureHighlights().slice(0, 3);
  
  const fearGreedColor = content.fearGreedIndex >= 60 ? '#10b981' : 
                          content.fearGreedIndex >= 40 ? '#f59e0b' : '#ef4444';
  const fearGreedLabel = content.fearGreedIndex >= 75 ? 'Extreme Greed' :
                          content.fearGreedIndex >= 60 ? 'Greed' :
                          content.fearGreedIndex >= 40 ? 'Neutral' :
                          content.fearGreedIndex >= 25 ? 'Fear' : 'Extreme Fear';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${content.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background-color: #0a0a0f;
      color: #e5e5e5;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      line-height: 1.6;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
    }
    
    /* Header with gradient */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f472b6 100%);
      padding: 32px 24px 24px;
      text-align: center;
    }
    .logo {
      font-size: 36px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    /* Price Banner */
    .price-banner {
      display: table;
      width: 100%;
      margin-top: 16px;
    }
    .price-badge {
      display: table-cell;
      width: 50%;
      padding: 0 6px;
      vertical-align: top;
    }
    .price-badge-inner {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 14px 12px;
      text-align: center;
    }
    .price-badge-symbol {
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: 0.5px;
    }
    .price-badge-value {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 4px 0;
    }
    .price-badge-change {
      font-size: 14px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
    }
    .price-badge-change.positive {
      background: rgba(16, 185, 129, 0.25);
      color: #34d399;
    }
    .price-badge-change.negative {
      background: rgba(239, 68, 68, 0.25);
      color: #f87171;
    }
    
    /* Fear & Greed Indicator */
    .fear-greed-section {
      padding: 20px 24px;
      background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
    }
    .fear-greed-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    .fear-greed-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .fear-greed-value {
      font-size: 48px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .fear-greed-status {
      font-size: 18px;
      font-weight: 700;
    }
    .fear-greed-bar {
      margin-top: 16px;
      height: 8px;
      background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
      border-radius: 4px;
      position: relative;
    }
    .fear-greed-marker {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    /* Content sections */
    .content {
      padding: 24px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-header {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .section-icon {
      display: table-cell;
      width: 36px;
      vertical-align: middle;
    }
    .section-icon-inner {
      width: 32px;
      height: 32px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      text-align: center;
      line-height: 32px;
      font-size: 18px;
    }
    .section-title {
      display: table-cell;
      vertical-align: middle;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      padding-left: 12px;
    }
    
    /* Market Summary */
    .market-summary {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 1px solid rgba(102, 126, 234, 0.25);
      border-radius: 16px;
      padding: 24px;
      font-size: 17px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.9);
    }
    
    /* Coin Cards - Improved Mobile Design */
    .coin-list {
      margin-top: 16px;
    }
    .coin-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 12px;
    }
    .coin-card-inner {
      display: table;
      width: 100%;
    }
    .coin-icon-cell {
      display: table-cell;
      width: 48px;
      vertical-align: middle;
    }
    .coin-icon {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      text-align: center;
      line-height: 42px;
      font-size: 22px;
      font-weight: 700;
    }
    .coin-icon.btc { background: linear-gradient(135deg, #f7931a 0%, #e88a15 100%); color: #fff; }
    .coin-icon.eth { background: linear-gradient(135deg, #627eea 0%, #4a5adc 100%); color: #fff; }
    .coin-icon.sol { background: linear-gradient(135deg, #9945ff 0%, #14f195 100%); color: #fff; }
    .coin-icon.generic { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #fff; }
    .coin-info-cell {
      display: table-cell;
      vertical-align: middle;
      padding-left: 14px;
    }
    .coin-name {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
    }
    .coin-symbol {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin-top: 2px;
    }
    .coin-price-cell {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
    }
    .coin-price {
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
    }
    .coin-change {
      font-size: 15px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 8px;
      margin-top: 6px;
      display: inline-block;
    }
    .coin-change.positive {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .coin-change.negative {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    
    /* Hot Markets Section */
    .market-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 12px;
    }
    .market-question {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .market-stats {
      display: table;
      width: 100%;
    }
    .market-stat {
      display: table-cell;
      width: 33.33%;
      text-align: center;
    }
    .market-stat-value {
      font-size: 18px;
      font-weight: 800;
      color: #f59e0b;
    }
    .market-stat-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    
    /* Upcoming Streams */
    .stream-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.25);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 12px;
    }
    .stream-card-inner {
      display: table;
      width: 100%;
    }
    .stream-icon-cell {
      display: table-cell;
      width: 52px;
      vertical-align: middle;
    }
    .stream-icon {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      border-radius: 12px;
      text-align: center;
      line-height: 46px;
      font-size: 22px;
    }
    .stream-info-cell {
      display: table-cell;
      vertical-align: middle;
      padding-left: 14px;
    }
    .stream-title {
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.4;
    }
    .stream-time {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;
    }
    .stream-badge {
      display: inline-block;
      background: rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* News Cards */
    .news-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 12px;
    }
    .news-title {
      font-size: 17px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .news-title a {
      color: #ffffff;
      text-decoration: none;
    }
    .news-meta {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
    .news-source {
      color: #667eea;
      font-weight: 600;
    }
    
    /* Feature Cards */
    .feature-grid {
      margin-top: 16px;
    }
    .feature-card {
      background: rgba(102, 126, 234, 0.08);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 12px;
    }
    .feature-card-inner {
      display: table;
      width: 100%;
    }
    .feature-icon-cell {
      display: table-cell;
      width: 48px;
      vertical-align: top;
    }
    .feature-icon {
      font-size: 28px;
    }
    .feature-content-cell {
      display: table-cell;
      vertical-align: top;
      padding-left: 14px;
    }
    .feature-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .feature-description {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }
    
    /* CTA Button */
    .cta-section {
      text-align: center;
      padding: 24px 0 8px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 18px 40px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 17px;
      letter-spacing: 0.3px;
    }
    
    /* Footer */
    .footer {
      background: rgba(0, 0, 0, 0.4);
      padding: 32px 24px;
      text-align: center;
    }
    .social-links {
      margin-bottom: 20px;
    }
    .social-link {
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8) !important;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      margin: 0 6px 8px;
    }
    .footer-text {
      color: rgba(255, 255, 255, 0.5);
      font-size: 13px;
      line-height: 1.6;
    }
    .footer-text a {
      color: #667eea;
      text-decoration: none;
    }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 480px) {
      .header {
        padding: 24px 16px 20px;
      }
      .logo {
        font-size: 30px;
      }
      .tagline {
        font-size: 14px;
      }
      .price-badge-inner {
        padding: 12px 8px;
      }
      .price-badge-value {
        font-size: 18px;
      }
      .fear-greed-section {
        padding: 16px;
      }
      .fear-greed-value {
        font-size: 40px;
      }
      .content {
        padding: 16px;
      }
      .section-title {
        font-size: 18px;
      }
      .market-summary {
        padding: 18px;
        font-size: 16px;
      }
      .coin-card {
        padding: 16px;
      }
      .coin-name {
        font-size: 16px;
      }
      .coin-price {
        font-size: 17px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Price Badges -->
    <div class="header">
      <div class="logo">StreamAiX</div>
      <div class="tagline">AI-Native Social Media & Prediction Markets</div>
      
      <!-- BTC/ETH Price Badges -->
      <div class="price-banner">
        <div class="price-badge">
          <div class="price-badge-inner">
            <div class="price-badge-symbol">BTC</div>
            <div class="price-badge-value">$${formatPrice(content.btcPrice || 0)}</div>
            <div class="price-badge-change ${(content.btcChange || 0) >= 0 ? 'positive' : 'negative'}">
              ${(content.btcChange || 0) >= 0 ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%
            </div>
          </div>
        </div>
        <div class="price-badge">
          <div class="price-badge-inner">
            <div class="price-badge-symbol">ETH</div>
            <div class="price-badge-value">$${formatPrice(content.ethPrice || 0)}</div>
            <div class="price-badge-change ${(content.ethChange || 0) >= 0 ? 'positive' : 'negative'}">
              ${(content.ethChange || 0) >= 0 ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Fear & Greed Index -->
    <div class="fear-greed-section">
      <div class="fear-greed-card">
        <div class="fear-greed-label">Crypto Fear & Greed Index</div>
        <div class="fear-greed-value" style="color: ${fearGreedColor};">${content.fearGreedIndex || 50}</div>
        <div class="fear-greed-status" style="color: ${fearGreedColor};">${fearGreedLabel}</div>
        <div class="fear-greed-bar">
          <div class="fear-greed-marker" style="left: ${Math.min(Math.max(content.fearGreedIndex || 50, 5), 95)}%;"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Market Summary -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">📊</div></div>
          <div class="section-title">Market Summary</div>
        </div>
        <div class="market-summary">
          ${content.marketSummary}
        </div>
      </div>

      <!-- Top Gainers -->
      ${content.topGainers.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">🚀</div></div>
          <div class="section-title">Top Gainers (24h)</div>
        </div>
        <div class="coin-list">
          ${content.topGainers.slice(0, 5).map(coin => `
            <div class="coin-card">
              <div class="coin-card-inner">
                <div class="coin-icon-cell">
                  <div class="coin-icon ${getCoinIconClass(coin.symbol)}">${coin.symbol.charAt(0)}</div>
                </div>
                <div class="coin-info-cell">
                  <div class="coin-name">${coin.name}</div>
                  <div class="coin-symbol">${coin.symbol}</div>
                </div>
                <div class="coin-price-cell">
                  <div class="coin-price">$${formatPrice(coin.price || 0)}</div>
                  <div class="coin-change positive">+${(coin.changePercent || 0).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Top Losers -->
      ${content.topLosers.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">📉</div></div>
          <div class="section-title">Top Losers (24h)</div>
        </div>
        <div class="coin-list">
          ${content.topLosers.slice(0, 5).map(coin => `
            <div class="coin-card">
              <div class="coin-card-inner">
                <div class="coin-icon-cell">
                  <div class="coin-icon ${getCoinIconClass(coin.symbol)}">${coin.symbol.charAt(0)}</div>
                </div>
                <div class="coin-info-cell">
                  <div class="coin-name">${coin.name}</div>
                  <div class="coin-symbol">${coin.symbol}</div>
                </div>
                <div class="coin-price-cell">
                  <div class="coin-price">$${formatPrice(coin.price || 0)}</div>
                  <div class="coin-change negative">${(coin.changePercent || 0).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Hot Prediction Markets -->
      ${content.hotMarkets && content.hotMarkets.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">🔥</div></div>
          <div class="section-title">Hot Prediction Markets</div>
        </div>
        <div class="coin-list">
          ${content.hotMarkets.slice(0, 3).map(market => `
            <div class="market-card">
              <div class="market-question">${market.question}</div>
              <div class="market-stats">
                <div class="market-stat">
                  <div class="market-stat-value">${market.yesPercent}%</div>
                  <div class="market-stat-label">Yes Odds</div>
                </div>
                <div class="market-stat">
                  <div class="market-stat-value">${formatVolume(market.volume)}</div>
                  <div class="market-stat-label">Volume</div>
                </div>
                <div class="market-stat">
                  <div class="market-stat-value">${market.traders}</div>
                  <div class="market-stat-label">Traders</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Upcoming Streams -->
      ${content.upcomingStreams && content.upcomingStreams.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">🎙️</div></div>
          <div class="section-title">Upcoming AI Streams</div>
        </div>
        <div class="coin-list">
          ${content.upcomingStreams.slice(0, 2).map(stream => `
            <div class="stream-card">
              <div class="stream-card-inner">
                <div class="stream-icon-cell">
                  <div class="stream-icon">${stream.emoji || '🎤'}</div>
                </div>
                <div class="stream-info-cell">
                  <div class="stream-title">${stream.title}</div>
                  <div class="stream-time">${stream.time}</div>
                  <div class="stream-badge">AI-Powered TTS</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Latest News -->
      ${content.newsStories && content.newsStories.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">📰</div></div>
          <div class="section-title">Latest Crypto News</div>
        </div>
        <div class="coin-list">
          ${content.newsStories.slice(0, 3).map(news => `
            <div class="news-card">
              <div class="news-title">
                <a href="${news.url}" target="_blank" rel="noopener noreferrer">
                  ${news.title}
                </a>
              </div>
              <div class="news-meta">
                <span class="news-source">${news.source}</span> • ${getTimeAgo(new Date(news.published))}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Platform Features -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon"><div class="section-icon-inner">✨</div></div>
          <div class="section-title">What's on StreamAiX</div>
        </div>
        <div class="feature-grid">
          ${features.map(feature => `
            <div class="feature-card">
              <div class="feature-card-inner">
                <div class="feature-icon-cell">
                  <div class="feature-icon">${feature.emoji}</div>
                </div>
                <div class="feature-content-cell">
                  <div class="feature-title">${feature.title}</div>
                  <div class="feature-description">${feature.description}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-section">
        <a href="https://streamaix.com" class="cta-button">
          Visit StreamAiX Platform →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://twitter.com/streamaix" class="social-link">Twitter</a>
        <a href="https://discord.gg/streamaix" class="social-link">Discord</a>
        <a href="https://t.me/streamaix" class="social-link">Telegram</a>
      </div>
      <p class="footer-text">
        You're receiving this email because you joined the StreamAiX waitlist.<br>
        <a href="https://streamaix.com/unsubscribe/${unsubscribeToken}">Unsubscribe</a>
      </p>
      <p class="footer-text" style="margin-top: 16px;">
        © ${new Date().getFullYear()} StreamAiX. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format price with appropriate decimal places
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  }
}

/**
 * Format volume to readable string
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Get CSS class for coin icon based on symbol
 */
function getCoinIconClass(symbol: string): string {
  const lower = symbol.toLowerCase();
  if (lower === 'btc') return 'btc';
  if (lower === 'eth') return 'eth';
  if (lower === 'sol') return 'sol';
  return 'generic';
}

/**
 * Format time ago from a date
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return 'Less than 1 hour ago';
  }
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

💰 MARKET SNAPSHOT
BTC: $${formatPrice(content.btcPrice || 0)} (${(content.btcChange || 0) >= 0 ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%)
ETH: $${formatPrice(content.ethPrice || 0)} (${(content.ethChange || 0) >= 0 ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%)

😨 Fear & Greed Index: ${content.fearGreedIndex || 50}/100

📊 MARKET SUMMARY
${content.marketSummary}

`;

  if (content.topGainers.length > 0) {
    text += `\n🚀 TOP GAINERS (24H)\n`;
    content.topGainers.forEach(coin => {
      text += `  ${coin.name} (${coin.symbol}): $${formatPrice(coin.price)} (+${coin.changePercent.toFixed(2)}%)\n`;
    });
  }

  if (content.topLosers.length > 0) {
    text += `\n📉 TOP LOSERS (24H)\n`;
    content.topLosers.forEach(coin => {
      text += `  ${coin.name} (${coin.symbol}): $${formatPrice(coin.price)} (${coin.changePercent.toFixed(2)}%)\n`;
    });
  }

  if (content.hotMarkets && content.hotMarkets.length > 0) {
    text += `\n🔥 HOT PREDICTION MARKETS\n`;
    content.hotMarkets.forEach(market => {
      text += `  • ${market.question}\n    Yes: ${market.yesPercent}% | Volume: ${formatVolume(market.volume)}\n`;
    });
  }

  if (content.newsStories && content.newsStories.length > 0) {
    text += `\n📰 LATEST NEWS\n`;
    content.newsStories.forEach(news => {
      text += `  • ${news.title}\n    ${news.source} - ${news.url}\n`;
    });
  }

  text += `\n✨ WHAT'S ON STREAMAIX\n`;
  features.slice(0, 3).forEach(feature => {
    text += `\n${feature.emoji} ${feature.title}\n   ${feature.description}\n`;
  });

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
