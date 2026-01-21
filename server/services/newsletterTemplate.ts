import { NewsletterContent, getFeatureHighlights } from './newsletterContentGenerator';

/**
 * Generate HTML email template for newsletter - Light Theme with Inline Styles
 * Designed for maximum email client compatibility (Gmail, Outlook, Apple Mail, mobile)
 */
export function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const features = getFeatureHighlights().slice(0, 3);
  
  const fearGreedColor = content.fearGreedIndex >= 60 ? '#059669' : 
                          content.fearGreedIndex >= 40 ? '#d97706' : '#dc2626';
  const fearGreedLabel = content.fearGreedIndex >= 75 ? 'Extreme Greed' :
                          content.fearGreedIndex >= 60 ? 'Greed' :
                          content.fearGreedIndex >= 40 ? 'Neutral' :
                          content.fearGreedIndex >= 25 ? 'Fear' : 'Extreme Fear';
  
  const positiveColor = '#059669';
  const negativeColor = '#dc2626';
  const positiveBg = '#dcfce7';
  const negativeBg = '#fee2e2';
  
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${content.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table, td, div, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 600px) {
      .mobile-full { width: 100% !important; }
      .mobile-padding { padding: 16px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="mobile-full" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ec4899 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">StreamAiX</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Autonomous Market Intelligence</p>
            </td>
          </tr>
          
          <!-- Price Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- BTC -->
                  <td width="33%" style="padding: 0 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(255, 255, 255, 0.15); border-radius: 10px;">
                      <tr>
                        <td style="padding: 14px 8px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.85); letter-spacing: 0.5px;">BTC</p>
                          <p style="margin: 4px 0; font-size: 18px; font-weight: 800; color: #ffffff;">$${formatPrice(content.btcPrice || 0)}</p>
                          <span style="display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${(content.btcChange || 0) >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; color: ${(content.btcChange || 0) >= 0 ? '#6ee7b7' : '#fca5a5'};">
                            ${(content.btcChange || 0) >= 0 ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- ETH -->
                  <td width="33%" style="padding: 0 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(255, 255, 255, 0.15); border-radius: 10px;">
                      <tr>
                        <td style="padding: 14px 8px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.85); letter-spacing: 0.5px;">ETH</p>
                          <p style="margin: 4px 0; font-size: 18px; font-weight: 800; color: #ffffff;">$${formatPrice(content.ethPrice || 0)}</p>
                          <span style="display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${(content.ethChange || 0) >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; color: ${(content.ethChange || 0) >= 0 ? '#6ee7b7' : '#fca5a5'};">
                            ${(content.ethChange || 0) >= 0 ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- S&P 500 -->
                  <td width="33%" style="padding: 0 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(255, 255, 255, 0.15); border-radius: 10px;">
                      <tr>
                        <td style="padding: 14px 8px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.85); letter-spacing: 0.5px;">S&P 500</p>
                          <p style="margin: 4px 0; font-size: 18px; font-weight: 800; color: #ffffff;">$${formatPrice(content.spyPrice || 0)}</p>
                          <span style="display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${(content.spyChange || 0) >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; color: ${(content.spyChange || 0) >= 0 ? '#6ee7b7' : '#fca5a5'};">
                            ${(content.spyChange || 0) >= 0 ? '+' : ''}${(content.spyChange || 0).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Fear & Greed Index -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Crypto Fear & Greed Index</p>
                    <p style="margin: 8px 0 4px; font-size: 48px; font-weight: 800; color: ${fearGreedColor};">${content.fearGreedIndex || 50}</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${fearGreedColor};">${fearGreedLabel}</p>
                    <!-- Gradient Bar -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td>
                          <div style="position: relative; height: 8px; background: linear-gradient(90deg, #dc2626 0%, #d97706 50%, #059669 100%); border-radius: 4px;">
                          </div>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: -12px;">
                            <tr>
                              <td width="${Math.min(Math.max(content.fearGreedIndex || 50, 5), 95)}%" style="text-align: right;">
                                <span style="display: inline-block; width: 16px; height: 16px; background-color: #1e293b; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                              </td>
                              <td></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding: 0 24px 24px;">
              
              <!-- Market Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #ede9fe; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">📊</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Market Summary</td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px; font-size: 15px; line-height: 1.7; color: #334155;">
                          ${content.marketSummary}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Alpha Insight -->
              ${content.alphaInsight ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #dcfce7; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">🎯</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Alpha Insight</td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px; font-size: 15px; line-height: 1.7; color: #065f46;">
                          <strong style="color: #047857;">Today's Key Takeaway:</strong> ${content.alphaInsight}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Top Gainers -->
              ${content.topGainers.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #dcfce7; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">🚀</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Top Gainers (24h)</td>
                      </tr>
                    </table>
                    ${content.topGainers.slice(0, 5).map(coin => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" style="vertical-align: middle;">
                                <div style="width: 36px; height: 36px; background: ${getCoinGradient(coin.symbol)}; border-radius: 50%; text-align: center; line-height: 36px; font-size: 14px; font-weight: 700; color: #ffffff;">${coin.symbol.charAt(0)}</div>
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">${coin.name}</p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; text-transform: uppercase;">${coin.symbol}</p>
                              </td>
                              <td style="text-align: right; vertical-align: middle;">
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">$${formatPrice(coin.price || 0)}</p>
                                <span style="display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${positiveBg}; color: ${positiveColor};">+${(coin.changePercent || 0).toFixed(2)}%</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Top Losers -->
              ${content.topLosers.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fee2e2; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">📉</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Top Losers (24h)</td>
                      </tr>
                    </table>
                    ${content.topLosers.slice(0, 5).map(coin => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" style="vertical-align: middle;">
                                <div style="width: 36px; height: 36px; background: ${getCoinGradient(coin.symbol)}; border-radius: 50%; text-align: center; line-height: 36px; font-size: 14px; font-weight: 700; color: #ffffff;">${coin.symbol.charAt(0)}</div>
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">${coin.name}</p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; text-transform: uppercase;">${coin.symbol}</p>
                              </td>
                              <td style="text-align: right; vertical-align: middle;">
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">$${formatPrice(coin.price || 0)}</p>
                                <span style="display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${negativeBg}; color: ${negativeColor};">${(coin.changePercent || 0).toFixed(2)}%</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Stock Gainers -->
              ${content.stockGainers && content.stockGainers.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #dbeafe; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">📈</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Top Tech Stocks (24h)</td>
                      </tr>
                    </table>
                    ${content.stockGainers.slice(0, 5).map(stock => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #059669; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" style="vertical-align: middle;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px; text-align: center; line-height: 36px; font-size: 10px; font-weight: 700; color: #ffffff;">${stock.symbol}</div>
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">${stock.name}</p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${stock.sector}</p>
                              </td>
                              <td style="text-align: right; vertical-align: middle;">
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">$${formatPrice(stock.price || 0)}</p>
                                <span style="display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${positiveBg}; color: ${positiveColor};">+${(stock.changePercent || 0).toFixed(2)}%</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Stock Losers -->
              ${content.stockLosers && content.stockLosers.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fee2e2; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">📉</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Tech Stocks Down (24h)</td>
                      </tr>
                    </table>
                    ${content.stockLosers.slice(0, 5).map(stock => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #dc2626; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" style="vertical-align: middle;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 8px; text-align: center; line-height: 36px; font-size: 10px; font-weight: 700; color: #ffffff;">${stock.symbol}</div>
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">${stock.name}</p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${stock.sector}</p>
                              </td>
                              <td style="text-align: right; vertical-align: middle;">
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">$${formatPrice(stock.price || 0)}</p>
                                <span style="display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: ${negativeBg}; color: ${negativeColor};">${(stock.changePercent || 0).toFixed(2)}%</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Hot Prediction Markets -->
              ${content.hotMarkets && content.hotMarkets.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fef3c7; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">🔥</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Hot Prediction Markets</td>
                      </tr>
                    </table>
                    ${content.hotMarkets.slice(0, 3).map(market => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1e293b; line-height: 1.4;">${market.question}</p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="33%" style="text-align: center;">
                                <p style="margin: 0; font-size: 18px; font-weight: 800; color: #d97706;">${market.yesPercent}%</p>
                                <p style="margin: 2px 0 0; font-size: 11px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Yes Odds</p>
                              </td>
                              <td width="33%" style="text-align: center;">
                                <p style="margin: 0; font-size: 18px; font-weight: 800; color: #d97706;">${formatVolume(market.volume)}</p>
                                <p style="margin: 2px 0 0; font-size: 11px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Volume</p>
                              </td>
                              <td width="33%" style="text-align: center;">
                                <p style="margin: 0; font-size: 18px; font-weight: 800; color: #d97706;">${market.traders}</p>
                                <p style="margin: 2px 0 0; font-size: 11px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Traders</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Upcoming Streams -->
              ${content.upcomingStreams && content.upcomingStreams.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #ede9fe; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">🎙️</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Upcoming AI Streams</td>
                      </tr>
                    </table>
                    ${content.upcomingStreams.slice(0, 2).map(stream => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="46" style="vertical-align: middle;">
                                <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 10px; text-align: center; line-height: 42px; font-size: 20px;">${stream.emoji || '🎤'}</div>
                              </td>
                              <td style="padding-left: 14px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.4;">${stream.title}</p>
                                <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${stream.time}</p>
                                <span style="display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background-color: #ddd6fe; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px;">AI-Powered TTS</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Latest News -->
              ${content.newsStories && content.newsStories.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #e0e7ff; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">📰</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">Latest Crypto News</td>
                      </tr>
                    </table>
                    ${content.newsStories.slice(0, 3).map(news => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #1e293b; line-height: 1.4;">
                            <a href="${news.url}" target="_blank" rel="noopener noreferrer" style="color: #1e293b; text-decoration: none;">${news.title}</a>
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #64748b;">
                            <span style="color: #667eea; font-weight: 600;">${news.source}</span> • ${getTimeAgo(new Date(news.published))}
                          </p>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Platform Features -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fce7f3; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 16px;">✨</td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">What's on StreamAiX</td>
                      </tr>
                    </table>
                    ${features.map(feature => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" style="vertical-align: top; font-size: 24px;">${feature.emoji}</td>
                              <td style="padding-left: 12px; vertical-align: top;">
                                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;">${feature.title}</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">${feature.description}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="https://streamaix.com" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px;">Visit StreamAiX Platform →</a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 28px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://twitter.com/streamaix" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #e2e8f0; color: #475569; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 0 4px 8px;">Twitter</a>
                    <a href="https://discord.gg/streamaix" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #e2e8f0; color: #475569; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 0 4px 8px;">Discord</a>
                    <a href="https://t.me/streamaix" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #e2e8f0; color: #475569; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 0 4px 8px;">Telegram</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                You're receiving this email because you joined the StreamAiX waitlist.<br>
                <a href="https://streamaix.com/unsubscribe/${unsubscribeToken}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} StreamAiX. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
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
 * Get gradient background for coin icon based on symbol
 */
function getCoinGradient(symbol: string): string {
  const lower = symbol.toLowerCase();
  if (lower === 'btc') return 'linear-gradient(135deg, #f7931a 0%, #e88a15 100%)';
  if (lower === 'eth') return 'linear-gradient(135deg, #627eea 0%, #4a5adc 100%)';
  if (lower === 'sol') return 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)';
  if (lower === 'xrp') return 'linear-gradient(135deg, #23292f 0%, #444f5c 100%)';
  if (lower === 'bnb') return 'linear-gradient(135deg, #f3ba2f 0%, #d4a429 100%)';
  if (lower === 'ada') return 'linear-gradient(135deg, #0033ad 0%, #0044cc 100%)';
  if (lower === 'doge') return 'linear-gradient(135deg, #c2a633 0%, #a08c2a 100%)';
  return 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
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
STREAMAIX MARKET ALPHA
${content.subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 MARKET SNAPSHOT
BTC: $${formatPrice(content.btcPrice || 0)} (${(content.btcChange || 0) >= 0 ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%)
ETH: $${formatPrice(content.ethPrice || 0)} (${(content.ethChange || 0) >= 0 ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%)
S&P 500: $${formatPrice(content.spyPrice || 0)} (${(content.spyChange || 0) >= 0 ? '+' : ''}${(content.spyChange || 0).toFixed(2)}%)

😨 Fear & Greed Index: ${content.fearGreedIndex || 50}/100

📊 MARKET SUMMARY
${content.marketSummary}

`;

  if (content.alphaInsight) {
    text += `\n🎯 ALPHA INSIGHT\n${content.alphaInsight}\n`;
  }

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

  if (content.stockGainers && content.stockGainers.length > 0) {
    text += `\n📈 TOP TECH STOCKS (24H)\n`;
    content.stockGainers.forEach(stock => {
      text += `  ${stock.name} (${stock.symbol}): $${formatPrice(stock.price)} (+${stock.changePercent.toFixed(2)}%)\n`;
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
