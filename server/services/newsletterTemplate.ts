import { NewsletterContent, getFeatureHighlights } from './newsletterContentGenerator';

export function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const features = getFeatureHighlights().slice(0, 3);

  const fearGreedColor = content.fearGreedIndex >= 60 ? '#059669' :
    content.fearGreedIndex >= 40 ? '#b45309' : '#dc2626';
  const fearGreedLabel = content.fearGreedIndex >= 75 ? 'Extreme Greed' :
    content.fearGreedIndex >= 60 ? 'Greed' :
    content.fearGreedIndex >= 40 ? 'Neutral' :
    content.fearGreedIndex >= 25 ? 'Fear' : 'Extreme Fear';

  const green = '#059669';
  const greenBg = '#ecfdf5';
  const red = '#dc2626';
  const redBg = '#fef2f2';

  const btcSign = (content.btcChange || 0) >= 0;
  const ethSign = (content.ethChange || 0) >= 0;
  const spySign = (content.spyChange || 0) >= 0;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${content.subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table, td, div, p, a, span { font-family: Arial, sans-serif !important; }</style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; width: 100%; background-color: #f0f0f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: inherit; }

    /* ── Mobile overrides ── */
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .outer-pad { padding: 0 !important; }

      /* Price cards stack vertically */
      .price-col { display: block !important; width: 100% !important; box-sizing: border-box; padding: 4px 0 !important; }
      .price-inner { border-radius: 10px !important; }
      .price-amount { font-size: 22px !important; }

      /* Content padding */
      .content-pad { padding: 0 16px 20px !important; }
      .section-mb { margin-bottom: 20px !important; }

      /* Section headings */
      .section-title { font-size: 16px !important; }

      /* Coin/stock rows */
      .coin-name { font-size: 14px !important; }
      .coin-price { font-size: 14px !important; }
      .coin-avatar { width: 30px !important; height: 30px !important; line-height: 30px !important; font-size: 12px !important; }

      /* Fear & Greed */
      .fg-number { font-size: 40px !important; }

      /* CTA */
      .cta-btn { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f5;">
  <tr>
    <td align="center" class="outer-pad" style="padding:24px 12px;">

      <!-- Main card -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">

        <!-- ─── HEADER ─── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%);padding:36px 24px 20px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:6px 18px;margin-bottom:12px;">
              <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;">Autonomous Market Intelligence</span>
            </div>
            <h1 style="margin:0;font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-1px;">StreamAiX</h1>
            <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
          </td>
        </tr>

        <!-- ─── PRICE BANNER ─── -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:0 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>

                <!-- BTC -->
                <td class="price-col" width="33%" style="padding:0 5px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    class="price-inner" style="background-color:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 10px;text-align:center;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Bitcoin</p>
                        <p class="price-amount" style="margin:6px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">$${formatPrice(content.btcPrice || 0)}</p>
                        <span style="display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background-color:${btcSign ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'};color:${btcSign ? '#6ee7b7' : '#fca5a5'};">
                          ${btcSign ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>

                <!-- ETH -->
                <td class="price-col" width="33%" style="padding:0 5px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    class="price-inner" style="background-color:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 10px;text-align:center;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Ethereum</p>
                        <p class="price-amount" style="margin:6px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">$${formatPrice(content.ethPrice || 0)}</p>
                        <span style="display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background-color:${ethSign ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'};color:${ethSign ? '#6ee7b7' : '#fca5a5'};">
                          ${ethSign ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>

                <!-- S&P 500 -->
                <td class="price-col" width="33%" style="padding:0 5px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    class="price-inner" style="background-color:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 10px;text-align:center;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">S&amp;P 500</p>
                        <p class="price-amount" style="margin:6px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">$${formatPrice(content.spyPrice || 0)}</p>
                        <span style="display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background-color:${spySign ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'};color:${spySign ? '#6ee7b7' : '#fca5a5'};">
                          ${spySign ? '+' : ''}${(content.spyChange || 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>

              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── FEAR & GREED ─── -->
        <tr>
          <td style="padding:24px;background-color:#f8f9fb;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Crypto Fear &amp; Greed Index</p>
                  <p class="fg-number" style="margin:10px 0 4px;font-size:52px;font-weight:800;line-height:1;color:${fearGreedColor};">${content.fearGreedIndex || 50}</p>
                  <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${fearGreedColor};">${fearGreedLabel}</p>
                  <div style="height:10px;background:linear-gradient(90deg,#dc2626 0%,#f59e0b 50%,#059669 100%);border-radius:5px;position:relative;">
                  </div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-13px;">
                    <tr>
                      <td width="${Math.min(Math.max(content.fearGreedIndex || 50, 3), 97)}%" style="text-align:right;">
                        <span style="display:inline-block;width:20px;height:20px;background:#1e293b;border:3px solid #ffffff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);vertical-align:top;"></span>
                      </td>
                      <td></td>
                    </tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                    <tr>
                      <td style="text-align:left;font-size:10px;color:#9ca3af;font-weight:600;">Fear</td>
                      <td style="text-align:center;font-size:10px;color:#9ca3af;font-weight:600;">Neutral</td>
                      <td style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;">Greed</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── CONTENT BODY ─── -->
        <tr>
          <td class="content-pad" style="padding:0 24px 24px;">

            <!-- Market Summary -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;margin-top:24px;">
              <tr>
                <td>
                  ${sectionHeader('📊', 'Market Summary')}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#f8f9fb;border:1px solid #e5e7eb;border-left:4px solid #7c3aed;border-radius:12px;">
                    <tr>
                      <td style="padding:18px 20px;font-size:15px;line-height:1.75;color:#374151;">
                        ${content.marketSummary}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Alpha Insight -->
            ${content.alphaInsight ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('🎯', 'Alpha Insight')}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-left:4px solid #7c3aed;border-radius:12px;">
                    <tr>
                      <td style="padding:18px 20px;font-size:15px;line-height:1.75;color:#4c1d95;">
                        <strong style="color:#6d28d9;">Key Takeaway:</strong> ${content.alphaInsight}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Top Gainers -->
            ${content.topGainers.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('🚀', 'Top Crypto Gainers (24h)')}
                  ${content.topGainers.slice(0, 5).map(coin => coinRow(coin.symbol, coin.name, coin.price, coin.changePercent, true, green, greenBg)).join('')}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Top Losers -->
            ${content.topLosers.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('📉', 'Top Crypto Losers (24h)')}
                  ${content.topLosers.slice(0, 5).map(coin => coinRow(coin.symbol, coin.name, coin.price, coin.changePercent, false, red, redBg)).join('')}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Stock Gainers -->
            ${content.stockGainers && content.stockGainers.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('📈', 'Top Tech &amp; AI Stocks (24h)')}
                  ${content.stockGainers.slice(0, 5).map(s => stockRow(s.symbol, s.name, s.price, s.changePercent, s.sector, true, green, greenBg)).join('')}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Stock Losers -->
            ${content.stockLosers && content.stockLosers.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('⬇️', 'Tech Stocks Under Pressure (24h)')}
                  ${content.stockLosers.slice(0, 5).map(s => stockRow(s.symbol, s.name, s.price, s.changePercent, s.sector, false, red, redBg)).join('')}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Hot Prediction Markets -->
            ${content.hotMarkets && content.hotMarkets.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('🔥', 'Hot Prediction Markets')}
                  ${content.hotMarkets.slice(0, 3).map(market => `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;">
                    <tr>
                      <td style="padding:18px;">
                        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#111827;line-height:1.5;">${market.question}</p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="33%" style="text-align:center;border-right:1px solid #f3f4f6;">
                              <p style="margin:0;font-size:20px;font-weight:800;color:#7c3aed;">${market.yesPercent}%</p>
                              <p style="margin:3px 0 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Yes Odds</p>
                            </td>
                            <td width="33%" style="text-align:center;border-right:1px solid #f3f4f6;">
                              <p style="margin:0;font-size:20px;font-weight:800;color:#7c3aed;">${formatVolume(market.volume)}</p>
                              <p style="margin:3px 0 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Volume</p>
                            </td>
                            <td width="33%" style="text-align:center;">
                              <p style="margin:0;font-size:20px;font-weight:800;color:#7c3aed;">${market.traders}</p>
                              <p style="margin:3px 0 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Traders</p>
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
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('🎙️', 'Upcoming AI Market Streams')}
                  ${content.upcomingStreams.slice(0, 2).map(stream => `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:10px;">
                    <tr>
                      <td style="padding:16px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="46" style="vertical-align:middle;">
                              <div style="width:42px;height:42px;background:linear-gradient(135deg,#7c3aed 0%,#6366f1 100%);border-radius:10px;text-align:center;line-height:42px;font-size:20px;">${stream.emoji || '🎤'}</div>
                            </td>
                            <td style="padding-left:14px;vertical-align:middle;">
                              <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">${stream.title}</p>
                              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${stream.time}</p>
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
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('📰', 'Latest Market News')}
                  ${content.newsStories.slice(0, 3).map(news => `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;">
                    <tr>
                      <td style="padding:16px;">
                        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;line-height:1.5;">
                          <a href="${news.url}" target="_blank" rel="noopener noreferrer" style="color:#111827;text-decoration:none;">${news.title}</a>
                        </p>
                        <p style="margin:0;font-size:12px;color:#9ca3af;">
                          <span style="color:#7c3aed;font-weight:600;">${news.source}</span> &nbsp;•&nbsp; ${getTimeAgo(new Date(news.published))}
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
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="section-mb" style="margin-bottom:24px;">
              <tr>
                <td>
                  ${sectionHeader('✨', "What's on StreamAiX")}
                  ${features.map(feature => `
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#fafafa;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;">
                    <tr>
                      <td style="padding:16px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="40" style="vertical-align:top;font-size:24px;line-height:1;">${feature.emoji}</td>
                            <td style="padding-left:14px;vertical-align:top;">
                              <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${feature.title}</p>
                              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${feature.description}</p>
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

            <!-- CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td style="text-align:center;padding:8px 0 16px;">
                  <a href="https://streamaix.com" target="_blank" rel="noopener noreferrer"
                    class="cta-btn"
                    style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:0.2px;">
                    Open StreamAiX →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ─── FOOTER ─── -->
        <tr>
          <td style="background-color:#f8f9fb;padding:28px 24px;text-align:center;border-top:1px solid #e5e7eb;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td style="text-align:center;">
                  <a href="https://twitter.com/streamaix" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;background-color:#e5e7eb;color:#374151;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:600;margin:0 4px 8px;">Twitter / X</a>
                  <a href="https://discord.gg/streamaix" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;background-color:#e5e7eb;color:#374151;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:600;margin:0 4px 8px;">Discord</a>
                  <a href="https://t.me/streamaix" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;background-color:#e5e7eb;color:#374151;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:600;margin:0 4px 8px;">Telegram</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
              You're receiving this email because you joined the StreamAiX waitlist.<br>
              <a href="https://streamaix.com/unsubscribe/${unsubscribeToken}" style="color:#7c3aed;text-decoration:none;">Unsubscribe</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
              © ${new Date().getFullYear()} StreamAiX. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`.trim();
}

/* ─── Helpers ─── */

function sectionHeader(emoji: string, title: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="width:34px;height:34px;background-color:#ede9fe;border-radius:8px;text-align:center;vertical-align:middle;font-size:17px;">${emoji}</td>
      <td class="section-title" style="padding-left:12px;font-size:18px;font-weight:700;color:#111827;">${title}</td>
    </tr>
  </table>`;
}

function coinRow(symbol: string, name: string, price: number, changePercent: number, isPositive: boolean, color: string, bg: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:8px;">
    <tr>
      <td style="padding:14px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="38" style="vertical-align:middle;">
              <div class="coin-avatar" style="width:36px;height:36px;background:${getCoinGradient(symbol)};border-radius:50%;text-align:center;line-height:36px;font-size:13px;font-weight:800;color:#ffffff;">${symbol.charAt(0)}</div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <p class="coin-name" style="margin:0;font-size:15px;font-weight:600;color:#111827;">${name}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${symbol}</p>
            </td>
            <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
              <p class="coin-price" style="margin:0;font-size:15px;font-weight:700;color:#111827;">$${formatPrice(price || 0)}</p>
              <span style="display:inline-block;margin-top:4px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background-color:${bg};color:${color};">
                ${isPositive ? '+' : ''}${(changePercent || 0).toFixed(2)}%
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function stockRow(symbol: string, name: string, price: number, changePercent: number, sector: string, isPositive: boolean, color: string, bg: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:8px;">
    <tr>
      <td style="padding:14px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="38" style="vertical-align:middle;">
              <div class="coin-avatar" style="width:36px;height:36px;background:${isPositive ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#b91c1c)'};border-radius:8px;text-align:center;line-height:36px;font-size:9px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${symbol.length <= 4 ? symbol : symbol.substring(0,4)}</div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <p class="coin-name" style="margin:0;font-size:15px;font-weight:600;color:#111827;">${name}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${sector}</p>
            </td>
            <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
              <p class="coin-price" style="margin:0;font-size:15px;font-weight:700;color:#111827;">$${formatPrice(price || 0)}</p>
              <span style="display:inline-block;margin-top:4px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background-color:${bg};color:${color};">
                ${isPositive ? '+' : ''}${(changePercent || 0).toFixed(2)}%
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

function getCoinGradient(symbol: string): string {
  const s = symbol.toLowerCase();
  if (s === 'btc') return 'linear-gradient(135deg,#f7931a,#e07c0e)';
  if (s === 'eth') return 'linear-gradient(135deg,#627eea,#4a5adc)';
  if (s === 'sol') return 'linear-gradient(135deg,#9945ff,#14f195)';
  if (s === 'xrp') return 'linear-gradient(135deg,#23292f,#444f5c)';
  if (s === 'bnb') return 'linear-gradient(135deg,#f3ba2f,#d4a429)';
  if (s === 'ada') return 'linear-gradient(135deg,#0033ad,#0055cc)';
  if (s === 'avax') return 'linear-gradient(135deg,#e84142,#c12d2e)';
  if (s === 'dot') return 'linear-gradient(135deg,#e6007a,#b3005f)';
  if (s === 'link') return 'linear-gradient(135deg,#2a5ada,#1a3fb5)';
  if (s === 'matic' || s === 'pol') return 'linear-gradient(135deg,#8247e5,#6a35c7)';
  return 'linear-gradient(135deg,#7c3aed,#4f46e5)';
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}

export function generateNewsletterText(content: NewsletterContent): string {
  const features = getFeatureHighlights();
  let text = `STREAMAIX MARKET ALPHA\n${content.subject}\n\n${'─'.repeat(40)}\n\n`;
  text += `💰 MARKET SNAPSHOT\n`;
  text += `BTC: $${formatPrice(content.btcPrice || 0)} (${(content.btcChange || 0) >= 0 ? '+' : ''}${(content.btcChange || 0).toFixed(2)}%)\n`;
  text += `ETH: $${formatPrice(content.ethPrice || 0)} (${(content.ethChange || 0) >= 0 ? '+' : ''}${(content.ethChange || 0).toFixed(2)}%)\n`;
  text += `S&P 500: $${formatPrice(content.spyPrice || 0)} (${(content.spyChange || 0) >= 0 ? '+' : ''}${(content.spyChange || 0).toFixed(2)}%)\n\n`;
  text += `Fear & Greed: ${content.fearGreedIndex || 50}/100\n\n`;
  text += `📊 MARKET SUMMARY\n${content.marketSummary}\n\n`;
  if (content.alphaInsight) text += `🎯 ALPHA INSIGHT\n${content.alphaInsight}\n\n`;
  if (content.topGainers.length > 0) {
    text += `🚀 TOP GAINERS (24H)\n`;
    content.topGainers.forEach(c => { text += `  ${c.name} (${c.symbol}): $${formatPrice(c.price)} (+${c.changePercent.toFixed(2)}%)\n`; });
    text += '\n';
  }
  if (content.topLosers.length > 0) {
    text += `📉 TOP LOSERS (24H)\n`;
    content.topLosers.forEach(c => { text += `  ${c.name} (${c.symbol}): $${formatPrice(c.price)} (${c.changePercent.toFixed(2)}%)\n`; });
    text += '\n';
  }
  if (content.stockGainers?.length > 0) {
    text += `📈 TOP TECH STOCKS\n`;
    content.stockGainers.forEach(s => { text += `  ${s.name} (${s.symbol}): $${formatPrice(s.price)} (+${s.changePercent.toFixed(2)}%)\n`; });
    text += '\n';
  }
  if (content.hotMarkets?.length > 0) {
    text += `🔥 HOT PREDICTION MARKETS\n`;
    content.hotMarkets.forEach(m => { text += `  • ${m.question}\n    Yes: ${m.yesPercent}% | Volume: ${formatVolume(m.volume)}\n`; });
    text += '\n';
  }
  if (content.newsStories?.length > 0) {
    text += `📰 LATEST NEWS\n`;
    content.newsStories.forEach(n => { text += `  • ${n.title}\n    ${n.source} – ${n.url}\n`; });
    text += '\n';
  }
  text += `✨ WHAT'S ON STREAMAIX\n`;
  features.slice(0, 3).forEach(f => { text += `\n${f.emoji} ${f.title}\n   ${f.description}\n`; });
  text += `\n${'─'.repeat(40)}\n\nVisit: https://streamaix.com\nUnsubscribe: https://streamaix.com/unsubscribe\n\n© ${new Date().getFullYear()} StreamAiX. All rights reserved.`;
  return text.trim();
}
