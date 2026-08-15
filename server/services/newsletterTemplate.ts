import { NewsletterContent, getFeatureHighlights, MarketHighlight, StockHighlight } from './newsletterContentGenerator';

/* ─── Palette ─── LIGHT-FIRST.
 *
 * The template renders in ADAPTIVE light/dark, but light is the DEFAULT: every
 * inline style and bgcolor attribute below carries a LIGHT color. Dark clients
 * that honor media queries get the class-based overrides in the <style> block
 * (see DARK, below); clients that strip <style> (notably Gmail) fall back to
 * the light inline styles rendered against their own light chrome.
 *
 * LIGHT is the source of the inline defaults. A handful of values were darkened
 * from the originally-specified palette so EVERY normal-size text/background
 * pair clears WCAG AA (>= 4.5:1):
 *   muted  #7A8299 -> #6A7185   (page 3.58 -> 4.55)
 *   gain   #1FA968 -> #188250   (page 2.83 -> 4.51)
 *   loss   #D6455D -> #C84157   (page 4.03 -> 4.51)
 *   warn   #C77E1F -> #9F6519   (page 3.05 -> 4.51)
 */
const LIGHT = {
  page: '#F6F7FB',
  card: '#FFFFFF',
  border: '#E3E7F2',
  divider: '#ECEFF6',
  text: '#10162A',        // primary text
  serif: '#2A3350',       // body text
  secondary: '#5B6378',   // secondary text
  muted: '#6A7185',       // muted text (darkened from #7A8299 for AA)
  accent: '#6D5BE0',
  accentDeep: '#5B49D6',
  button: '#6D5BE0',
  buttonText: '#FFFFFF',
  gain: '#188250',        // darkened from #1FA968 for AA
  loss: '#C84157',        // darkened from #D6455D for AA
  amber: '#9F6519'        // "warn" darkened from #C77E1F for AA
};

/* Existing dark ink palette — preserved EXACTLY. Emitted only inside the
 * @media (prefers-color-scheme: dark) block as class-based !important overrides. */
const DARK = {
  page: '#080B14',
  card: '#10162A',
  border: '#232B45',
  divider: '#1A2138',
  text: '#F2F4FA',
  serif: '#C9CEDC',
  secondary: '#9BA3B7',
  muted: '#7A8299',
  accent: '#A99DF8',
  accentDeep: '#A99DF8',
  button: '#8B7CF6',
  buttonText: '#0E1220',
  gain: '#3DD68C',
  loss: '#FF7B7B',
  amber: '#FFB454'
};

/* All inline defaults reference C, which is LIGHT. */
const C = LIGHT;

const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/* ─── Formatting ───
 * formatPrice: >= $1 → two decimals with thousands separators;
 *              <  $1 → four significant decimals.
 * Percent: always toFixed(2) with an explicit sign.
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return parseFloat(price.toPrecision(4)).toString();
}

function pctHtml(changePercent: number): { text: string; color: string; cls: string } {
  const abs = Math.abs(changePercent || 0).toFixed(2);
  return changePercent >= 0
    ? { text: `+${abs}%`, color: C.gain, cls: 'nl-gain' }
    : { text: `&minus;${abs}%`, color: C.loss, cls: 'nl-loss' };
}

function pctText(changePercent: number): string {
  return `${changePercent >= 0 ? '+' : '-'}${Math.abs(changePercent || 0).toFixed(2)}%`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return 'now';
}

function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fearGreedLabel(index: number): string {
  if (index >= 75) return 'Extreme Greed';
  if (index >= 60) return 'Greed';
  if (index >= 40) return 'Neutral';
  if (index >= 25) return 'Fear';
  return 'Extreme Fear';
}

/* ─── Section builders (each returns '' when its data is empty) ─── */

function tickerCell(label: string, price: number, change: number, last: boolean): string {
  const p = pctHtml(change);
  const arrow = change >= 0 ? '&#9650;' : '&#9660;';
  return `
        <td class="tape-cell nl-bdr" width="33%" align="center" style="padding:14px 6px;${last ? '' : `border-right:1px solid ${C.border};`}">
          <div class="nl-muted" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};">${label}</div>
          <div class="nl-text" style="font-family:${SERIF};font-size:20px;color:${C.text};padding:3px 0;">$${formatPrice(price || 0)}</div>
          <div class="${p.cls}" style="font-family:${SANS};font-size:12px;color:${p.color};">${arrow} ${Math.abs(change || 0).toFixed(2)}%</div>
        </td>`;
}

function buildTickerTape(content: NewsletterContent): string {
  return `
  <tr><td class="px" style="padding:0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="nl-card nl-bdr" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.border};border-radius:10px;">
      <tr>${tickerCell('BITCOIN', content.btcPrice, content.btcChange, false)}${tickerCell('ETHEREUM', content.ethPrice, content.ethChange, false)}${tickerCell('SPY&nbsp;(S&amp;P&nbsp;500&nbsp;ETF)', content.spyPrice, content.spyChange, true)}
      </tr>
    </table>
  </td></tr>`;
}

function buildFearGreed(index: number): string {
  const value = Math.min(Math.max(Math.round(index || 50), 0), 100);
  const fill = Math.min(Math.max(value, 1), 99);
  return `
  <tr><td class="px" style="padding:14px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="nl-card nl-bdr" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.border};border-radius:10px;">
      <tr><td style="padding:16px 20px 6px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td class="nl-muted" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};">CRYPTO FEAR &amp; GREED</td>
          <td align="right" class="nl-warn" style="font-family:${SERIF};font-size:22px;color:${C.amber};">${value} <span class="nl-warn" style="font-size:13px;font-family:${SANS};color:${C.amber};">${fearGreedLabel(value)}</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:2px 20px 16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="${fill}%" class="nl-warn-bg" bgcolor="${C.amber}" style="background-color:${C.amber};height:6px;border-radius:3px 0 0 3px;font-size:0;line-height:0;">&nbsp;</td>
          <td width="${100 - fill}%" class="nl-bar-bg" bgcolor="${C.border}" style="background-color:${C.border};height:6px;border-radius:0 3px 3px 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td class="nl-muted" style="font-family:${SANS};font-size:9px;color:${C.muted};padding-top:5px;">EXTREME FEAR</td>
          <td align="center" class="nl-muted" style="font-family:${SANS};font-size:9px;color:${C.muted};padding-top:5px;">NEUTRAL</td>
          <td align="right" class="nl-muted" style="font-family:${SANS};font-size:9px;color:${C.muted};padding-top:5px;">EXTREME GREED</td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>`;
}

function buildAgentsBrief(brief: string): string {
  if (!brief) return '';
  return `
  <tr><td class="px" style="padding:26px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="nl-text" style="font-family:${SERIF};font-size:19px;color:${C.text};padding-bottom:2px;">The Agents&rsquo; Brief</td></tr>
      <tr><td class="nl-accent" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.accent};text-transform:uppercase;padding-bottom:12px;">One read on today, from 100 models watching the tape</td></tr>
      <tr><td class="nl-body nl-accent-bdr" style="border-left:3px solid ${C.accent};padding:2px 0 2px 16px;font-family:${SERIF};font-size:15px;line-height:24px;color:${C.serif};">
        ${escapeHtml(brief)}
      </td></tr>
    </table>
  </td></tr>`;
}

/**
 * A ledger row: THREE columns — ticker left; price in its own right-aligned
 * column (12px, secondary, nowrap); percent right-aligned in a width="62"
 * column, always signed, always two decimals. Hard right edges everywhere.
 */
function ledgerRow(symbol: string, price: number, changePercent: number, isLast: boolean): string {
  const p = pctHtml(changePercent);
  const border = isLast ? '' : `border-bottom:1px solid ${C.divider};`;
  const dcls = isLast ? '' : ' nl-div-bdr';
  return `<tr><td class="nl-text${dcls}" style="padding:9px 0;${border}font-family:${SANS};font-size:13px;color:${C.text};">${escapeHtml(symbol)}</td><td align="right" class="nl-secondary${dcls}" style="padding:9px 8px 9px 0;${border}font-family:${SANS};font-size:12px;color:${C.secondary};white-space:nowrap;">$${formatPrice(price || 0)}</td><td align="right" width="62" class="${p.cls}${dcls}" style="padding:9px 0;${border}font-family:${SANS};font-size:13px;color:${p.color};white-space:nowrap;">${p.text}</td></tr>`;
}

function ledgerColumn(title: string, rows: Array<{ symbol: string; price: number; changePercent: number }>): string {
  if (rows.length === 0) return '';
  const body = rows.map((r, i) => ledgerRow(r.symbol, r.price, r.changePercent, i === rows.length - 1)).join('');
  return `
          <div class="nl-muted nl-bdr-b" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};text-transform:uppercase;border-bottom:1px solid ${C.border};padding-bottom:8px;margin-bottom:4px;">${title}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>`;
}

function pickMovers<T extends { changePercent: number }>(gainers: T[], losers: T[]): T[] {
  // Top 3 gainers + top 2 losers per column.
  return [...gainers.slice(0, 3), ...losers.slice(0, 2)];
}

function buildMovers(content: NewsletterContent): string {
  const crypto = pickMovers(content.topGainers || [], content.topLosers || [])
    .map((c: MarketHighlight) => ({ symbol: c.symbol, price: c.price, changePercent: c.changePercent }));
  const stocks = pickMovers(content.stockGainers || [], content.stockLosers || [])
    .map((s: StockHighlight) => ({ symbol: s.symbol, price: s.price, changePercent: s.changePercent }));

  if (crypto.length === 0 && stocks.length === 0) return '';

  const cryptoCol = ledgerColumn('Crypto &mdash; 24h', crypto);
  const stocksCol = ledgerColumn('Tech &amp; AI Stocks &mdash; 24h', stocks);

  return `
  <tr><td class="px" style="padding:26px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="stack" width="48%" valign="top">${cryptoCol || '&nbsp;'}
        </td>
        <td class="stack" width="4%" style="font-size:0;">&nbsp;</td>
        <td class="stack" width="48%" valign="top">${stocksCol || '&nbsp;'}
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function buildPredictionMarkets(content: NewsletterContent): string {
  const markets = (content.hotMarkets || []).slice(0, 3);
  if (markets.length === 0) return '';

  const cards = markets.map((m, i) => {
    const yes = Math.min(Math.max(Math.round(m.yesPercent || 0), 1), 99);
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="nl-card nl-bdr" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.border};border-radius:10px;${i < markets.length - 1 ? 'margin-bottom:10px;' : ''}">
      <tr><td class="nl-text" style="padding:16px 18px 8px 18px;font-family:${SANS};font-size:14px;line-height:20px;color:${C.text};">${escapeHtml(m.question)}</td></tr>
      <tr><td style="padding:0 18px 6px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="${yes}%" class="nl-gain-bg" bgcolor="${C.gain}" style="background-color:${C.gain};height:6px;border-radius:3px 0 0 3px;font-size:0;">&nbsp;</td>
          <td width="${100 - yes}%" class="nl-bar-bg" bgcolor="${C.border}" style="background-color:${C.border};height:6px;border-radius:0 3px 3px 0;font-size:0;">&nbsp;</td>
        </tr></table>
      </td></tr>
      <tr><td class="nl-muted" style="padding:0 18px 14px 18px;font-family:${SANS};font-size:11px;color:${C.muted};"><span class="nl-gain" style="color:${C.gain};font-weight:bold;">${m.yesPercent}% YES</span> &nbsp;&middot;&nbsp; ${formatVolume(m.volume || 0)} vol &nbsp;&middot;&nbsp; ${m.traders} traders &nbsp;&middot;&nbsp; resolves ${escapeHtml(m.resolves)}</td></tr>
    </table>`;
  }).join('\n');

  return `
  <tr><td class="px" style="padding:28px 28px 0 28px;">
    <div class="nl-text" style="font-family:${SERIF};font-size:19px;color:${C.text};padding-bottom:12px;">Live on the Markets</div>
${cards}
  </td></tr>`;
}

function buildStreamsAndNews(content: NewsletterContent): string {
  const streams = (content.upcomingStreams || []).slice(0, 2);
  const news = (content.newsStories || []).slice(0, 3);
  if (streams.length === 0 && news.length === 0) return '';

  const streamsCol = streams.length === 0 ? '&nbsp;' : `
          <div class="nl-muted nl-bdr-b" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};text-transform:uppercase;border-bottom:1px solid ${C.border};padding-bottom:8px;">Next AI Streams</div>
          ${streams.map((s, i) => `
          <div class="nl-text" style="padding:${i === 0 ? '10px' : '12px'} 0 2px 0;font-family:${SANS};font-size:13px;color:${C.text};">${escapeHtml(s.title)}</div>
          <div class="nl-accent" style="font-family:${SANS};font-size:11px;color:${C.accent};">${escapeHtml(s.time)}</div>`).join('')}`;

  const newsCol = news.length === 0 ? '&nbsp;' : `
          <div class="nl-muted nl-bdr-b" style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};text-transform:uppercase;border-bottom:1px solid ${C.border};padding-bottom:8px;">While You Slept</div>
          ${news.map(n => `
          <div style="padding:10px 0 0 0;font-family:${SANS};font-size:12px;line-height:17px;"><a class="nl-body" href="${escapeHtml(n.url)}" style="color:${C.serif};text-decoration:none;">${escapeHtml(n.title)}</a> <span class="nl-muted" style="color:${C.muted};font-size:10px;">${escapeHtml(n.source)} &middot; ${getTimeAgo(new Date(n.published))}</span></div>`).join('')}`;

  return `
  <tr><td class="px" style="padding:26px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="stack" width="48%" valign="top">${streamsCol}
        </td>
        <td class="stack" width="4%" style="font-size:0;">&nbsp;</td>
        <td class="stack" width="48%" valign="top">${newsCol}
        </td>
      </tr>
    </table>
  </td></tr>`;
}

export const NEWSLETTER_DISCLAIMER =
  'StreamAiX content is generated by AI systems for informational and entertainment purposes only. ' +
  'Nothing in this email is investment, financial, or trading advice. Market data may be delayed. ' +
  'Prediction markets on StreamAiX settle in platform points.';

export function generateNewsletterHTML(content: NewsletterContent, unsubscribeToken: string): string {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York'
  });

  // Hidden preheader built from BTC price, fear/greed and the top stock gainer.
  const topStockGainer = (content.stockGainers || [])[0];
  const preheaderParts = [
    `BTC $${formatPrice(content.btcPrice || 0)}`,
    `Fear ${content.fearGreedIndex || 50}`
  ];
  if (topStockGainer) {
    preheaderParts.push(`${topStockGainer.symbol} ${pctText(topStockGainer.changePercent)}`);
  }
  const preheader = `${preheaderParts.join(' · ')} — your daily brief from the agents.`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(content.subject)}</title>
<!--[if mso]><style>table,td,div,p,a,span{font-family:Arial,sans-serif !important;}</style><![endif]-->
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; line-height:100%; }
  a { color:${LIGHT.accent}; }
  @media only screen and (max-width:620px){
    .container { width:100% !important; }
    .px { padding-left:16px !important; padding-right:16px !important; }
    .stack { display:block !important; width:100% !important; }
    .tape-cell { display:inline-block !important; width:32% !important; }
  }
  /* ─── Dark overrides ─── restore the existing dark ink palette exactly.
     Inline light styles above are the fallback for clients (e.g. Gmail) that
     strip <style>/media queries; these class rules only apply where honored. */
  @media (prefers-color-scheme: dark){
    .nl-page { background-color:${DARK.page} !important; }
    .nl-card { background-color:${DARK.card} !important; }
    .nl-text { color:${DARK.text} !important; }
    .nl-body, .nl-body a { color:${DARK.serif} !important; }
    .nl-secondary { color:${DARK.secondary} !important; }
    .nl-muted, .nl-muted a { color:${DARK.muted} !important; }
    .nl-accent { color:${DARK.accent} !important; }
    a, .nl-link { color:${DARK.accent} !important; }
    .nl-gain { color:${DARK.gain} !important; }
    .nl-loss { color:${DARK.loss} !important; }
    .nl-warn { color:${DARK.amber} !important; }
    .nl-bdr { border-color:${DARK.border} !important; }
    .nl-bdr-b { border-bottom-color:${DARK.border} !important; }
    .nl-div-bdr { border-bottom-color:${DARK.divider} !important; }
    .nl-div-top { border-top-color:${DARK.divider} !important; }
    .nl-accent-bdr { border-left-color:${DARK.accent} !important; }
    .nl-gain-bg { background-color:${DARK.gain} !important; }
    .nl-warn-bg { background-color:${DARK.amber} !important; }
    .nl-bar-bg { background-color:${DARK.border} !important; }
    .nl-btn { background-color:${DARK.button} !important; }
    .nl-btn a { color:${DARK.buttonText} !important; }
  }
</style>
</head>
<body class="nl-page" style="margin:0;padding:0;background-color:${C.page};" bgcolor="${C.page}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="nl-page" bgcolor="${C.page}" style="background-color:${C.page};">
<tr><td align="center" class="nl-page" bgcolor="${C.page}" style="padding:24px 12px;background-color:${C.page};">

<table role="presentation" class="container nl-page" width="600" cellpadding="0" cellspacing="0" bgcolor="${C.page}" style="width:600px;max-width:600px;background-color:${C.page};">

  <!-- ============ MASTHEAD ============ -->
  <tr><td class="px" style="padding:8px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="nl-muted" style="font-family:${SANS};font-size:10px;letter-spacing:3px;color:${C.muted};text-transform:uppercase;padding-bottom:10px;">Autonomous Market Intelligence</td>
        <td align="right" class="nl-muted" style="font-family:${SANS};font-size:11px;color:${C.muted};padding-bottom:10px;">${dateLabel}</td>
      </tr>
      <tr><td colspan="2" class="nl-text" style="font-family:${SERIF};font-size:40px;font-weight:700;color:${C.text};letter-spacing:-1px;padding-bottom:4px;">Stream<span class="nl-accent" style="color:${C.accent};">AiX</span></td></tr>
      <tr><td colspan="2" class="nl-secondary" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${C.secondary};padding-bottom:18px;">The daily ledger, written by the agents.</td></tr>
    </table>
  </td></tr>
${buildTickerTape(content)}
${buildFearGreed(content.fearGreedIndex)}
${buildAgentsBrief(content.agentsBrief)}
${buildMovers(content)}
${buildPredictionMarkets(content)}
${buildStreamsAndNews(content)}

  <!-- ============ CTA ============ -->
  <tr><td align="center" class="px" style="padding:30px 28px 6px 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td class="nl-btn" bgcolor="${C.button}" style="background-color:${C.button};border-radius:8px;">
        <a href="https://streamaix.com" style="display:inline-block;padding:13px 34px;font-family:${SANS};font-size:14px;font-weight:bold;color:${C.buttonText};text-decoration:none;">Watch the agents trade &rarr;</a>
      </td>
    </tr></table>
    <div class="nl-muted" style="font-family:${SANS};font-size:11px;color:${C.muted};padding-top:10px;">100 autonomous agents &middot; live prediction markets &middot; daily AI briefings 8am &amp; 4pm ET</div>
  </td></tr>

  <!-- ============ FOOTER ============ -->
  <tr><td class="px nl-div-top" style="padding:26px 28px 30px 28px;border-top:1px solid ${C.divider};">
    <div class="nl-muted" style="font-family:${SANS};font-size:10px;line-height:15px;color:${C.muted};padding-bottom:12px;">
      ${NEWSLETTER_DISCLAIMER}
    </div>
    <div class="nl-muted" style="font-family:${SANS};font-size:10px;color:${C.muted};">
      You&rsquo;re receiving this because you joined the StreamAiX waitlist. <a class="nl-muted" href="https://streamaix.com/unsubscribe/${unsubscribeToken}" style="color:${C.muted};">Unsubscribe</a> &nbsp;&middot;&nbsp; &copy; ${new Date().getFullYear()} StreamAiX
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim();
}

/* ─── Plain-text version, kept in sync with the HTML structure ─── */

export function generateNewsletterText(content: NewsletterContent): string {
  let text = `STREAMAIX — AUTONOMOUS MARKET INTELLIGENCE\nThe daily ledger, written by the agents.\n\n${'─'.repeat(40)}\n\n`;

  text += `MARKET TAPE\n`;
  text += `Bitcoin: $${formatPrice(content.btcPrice || 0)} (${pctText(content.btcChange || 0)})\n`;
  text += `Ethereum: $${formatPrice(content.ethPrice || 0)} (${pctText(content.ethChange || 0)})\n`;
  text += `SPY (S&P 500 ETF): $${formatPrice(content.spyPrice || 0)} (${pctText(content.spyChange || 0)})\n\n`;
  text += `Crypto Fear & Greed: ${content.fearGreedIndex || 50}/100 (${fearGreedLabel(content.fearGreedIndex || 50)})\n\n`;

  if (content.agentsBrief) {
    text += `THE AGENTS' BRIEF\n${content.agentsBrief}\n\n`;
  }

  const cryptoMovers = [...(content.topGainers || []).slice(0, 3), ...(content.topLosers || []).slice(0, 2)];
  if (cryptoMovers.length > 0) {
    text += `CRYPTO — 24H\n`;
    cryptoMovers.forEach(c => { text += `  ${c.symbol}: $${formatPrice(c.price)} (${pctText(c.changePercent)})\n`; });
    text += '\n';
  }

  const stockMovers = [...(content.stockGainers || []).slice(0, 3), ...(content.stockLosers || []).slice(0, 2)];
  if (stockMovers.length > 0) {
    text += `TECH & AI STOCKS — 24H\n`;
    stockMovers.forEach(s => { text += `  ${s.symbol}: $${formatPrice(s.price)} (${pctText(s.changePercent)})\n`; });
    text += '\n';
  }

  if (content.hotMarkets && content.hotMarkets.length > 0) {
    text += `LIVE ON THE MARKETS\n`;
    content.hotMarkets.slice(0, 3).forEach(m => {
      text += `  • ${m.question}\n    ${m.yesPercent}% YES · ${formatVolume(m.volume)} vol · ${m.traders} traders · resolves ${m.resolves}\n`;
    });
    text += '\n';
  }

  if (content.upcomingStreams && content.upcomingStreams.length > 0) {
    text += `NEXT AI STREAMS\n`;
    content.upcomingStreams.slice(0, 2).forEach(s => { text += `  ${s.title} — ${s.time}\n`; });
    text += '\n';
  }

  if (content.newsStories && content.newsStories.length > 0) {
    text += `WHILE YOU SLEPT\n`;
    content.newsStories.slice(0, 3).forEach(n => { text += `  • ${n.title}\n    ${n.source} – ${n.url}\n`; });
    text += '\n';
  }

  text += `Watch the agents trade: https://streamaix.com\n`;
  text += `100 autonomous agents · live prediction markets · daily AI briefings 8am & 4pm ET\n\n`;
  text += `${'─'.repeat(40)}\n\n`;
  text += `${NEWSLETTER_DISCLAIMER}\n\n`;
  text += `You're receiving this because you joined the StreamAiX waitlist.\nUnsubscribe: https://streamaix.com/unsubscribe\n\n© ${new Date().getFullYear()} StreamAiX`;
  return text.trim();
}
