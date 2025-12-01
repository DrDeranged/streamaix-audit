import cron from 'node-cron';
import { pushNotificationService } from './pushNotificationService';
import { marketDataService } from './marketDataService';
import { newsService } from './newsService';
import { derivativesAnalyticsService } from './derivativesAnalyticsService';
import { institutionalFlowService } from './institutionalFlowService';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface PriceSnapshot {
  symbol: string;
  price: number;
  timestamp: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface SentNewsArticle {
  id: string;
  sentAt: number;
}

interface TradingMetricSnapshot {
  symbol: string;
  fundingRate: number;
  openInterest: number;
  liquidations24h: number;
  timestamp: number;
}

class MarketIntelligenceNotifier {
  private isStarted = false;
  private priceSnapshots: Map<string, PriceSnapshot[]> = new Map();
  private lastPriceAlerts: Map<string, number> = new Map();
  private sentNewsArticles: SentNewsArticle[] = [];
  private tradingMetricSnapshots: Map<string, TradingMetricSnapshot[]> = new Map();
  private lastFundingRateAlerts: Map<string, number> = new Map();
  private lastLiquidationAlerts: Map<string, number> = new Map();
  private lastWhaleAlerts: Map<string, number> = new Map();
  
  private readonly TRACKED_CRYPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
  private readonly TRACKED_STOCKS = ['MSTR', 'COIN', 'RIOT', 'MARA', 'NVDA', 'TSLA'];
  private readonly PRICE_ALERT_THRESHOLD = 3; // 3% in 1 hour
  private readonly ALERT_COOLDOWN = 30 * 60 * 1000; // 30 min cooldown per asset
  private readonly NEWS_ARTICLE_RETENTION = 24 * 60 * 60 * 1000; // 24 hours
  
  // Trading metric thresholds
  private readonly FUNDING_RATE_EXTREME_THRESHOLD = 0.05; // 0.05% per 8h (annualized ~18%)
  private readonly FUNDING_RATE_HIGH_THRESHOLD = 0.03; // 0.03% per 8h
  private readonly LIQUIDATION_SPIKE_THRESHOLD = 50_000_000; // $50M in liquidations
  private readonly WHALE_ALERT_THRESHOLD = 10_000_000; // $10M whale movement

  start(): void {
    if (this.isStarted) {
      console.log('⚠️ Market Intelligence Notifier is already running');
      return;
    }

    // Morning Briefing - 8am EST weekdays
    cron.schedule('0 8 * * 1-5', async () => {
      console.log('🌅 Morning Briefing starting...');
      await this.sendMorningBriefing();
    }, { timezone: "America/New_York" });

    // Market Movers - Every 4 hours (6am, 10am, 2pm, 6pm, 10pm EST)
    cron.schedule('0 6,10,14,18,22 * * *', async () => {
      console.log('📊 Market Movers update starting...');
      await this.sendMarketMovers();
    }, { timezone: "America/New_York" });

    // Price Monitor - Every 15 minutes for significant moves
    cron.schedule('*/15 * * * *', async () => {
      await this.checkPriceAlerts();
    }, { timezone: "America/New_York" });

    // Macro Alerts - Check Fed/economic news every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      console.log('🏛️ Checking macro events...');
      await this.checkMacroAlerts();
    }, { timezone: "America/New_York" });

    // Evening Recap - 6pm EST weekdays
    cron.schedule('0 18 * * 1-5', async () => {
      console.log('🌆 Evening Recap starting...');
      await this.sendEveningRecap();
    }, { timezone: "America/New_York" });

    // Weekly Preview - Sunday 7pm EST
    cron.schedule('0 19 * * 0', async () => {
      console.log('📅 Weekly Preview starting...');
      await this.sendWeeklyPreview();
    }, { timezone: "America/New_York" });

    // CoinDesk Breaking News - Every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.checkCoinDeskNews();
    }, { timezone: "America/New_York" });

    // Trading Metrics Monitor - Every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      await this.checkTradingMetrics();
    }, { timezone: "America/New_York" });

    // Whale Alert Monitor - Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkWhaleAlerts();
    }, { timezone: "America/New_York" });

    // Liquidation Alert Monitor - Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkLiquidationAlerts();
    }, { timezone: "America/New_York" });

    // Funding Rate Monitor - Every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.checkFundingRateAlerts();
    }, { timezone: "America/New_York" });

    this.isStarted = true;
    console.log('📡 Market Intelligence Notifier started');
    console.log('   ⏰ Morning Briefing: 8am EST (Mon-Fri)');
    console.log('   📊 Market Movers: Every 4 hours');
    console.log('   ⚡ Price Alerts: Every 15 min (3%+ moves)');
    console.log('   🏛️ Macro Alerts: Every 2 hours');
    console.log('   🌆 Evening Recap: 6pm EST (Mon-Fri)');
    console.log('   📅 Weekly Preview: Sunday 7pm EST');
    console.log('   📰 CoinDesk News: Every 15 min');
    console.log('   📈 Trading Metrics: Every 10 min');
    console.log('   🐋 Whale Alerts: Every 5 min');
    console.log('   💥 Liquidation Alerts: Every 5 min');
    console.log('   💰 Funding Rate Alerts: Every 30 min');
  }

  stop(): void {
    this.isStarted = false;
    console.log('⏹️ Market Intelligence Notifier stopped');
  }

  async sendMorningBriefing(): Promise<void> {
    try {
      const [cryptoData, stockData, economicEvents, topNews] = await Promise.all([
        marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO),
        marketDataService.getCryptoStocks(),
        marketDataService.getEconomicCalendar({ timeRange: '1d', impact: ['high'] }),
        newsService.getCryptoNews(3)
      ]);

      // Find biggest movers
      const topGainer = cryptoData.reduce((max, c) => 
        (c.percentChange24h > (max?.percentChange24h || -Infinity)) ? c : max, cryptoData[0]);
      const topLoser = cryptoData.reduce((min, c) => 
        (c.percentChange24h < (min?.percentChange24h || Infinity)) ? c : min, cryptoData[0]);
      
      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');

      // Market sentiment based on BTC movement
      const sentiment = btc && btc.percentChange24h > 2 ? '🟢 Bullish' : 
                       btc && btc.percentChange24h < -2 ? '🔴 Bearish' : '🟡 Neutral';

      // Today's key events
      const todayEvents = economicEvents.filter(e => {
        const eventDate = new Date(e.scheduledDate);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).slice(0, 2);

      let body = `${sentiment} Morning\n\n`;
      
      if (btc) {
        body += `₿ BTC: $${this.formatPrice(btc.price)} (${this.formatChange(btc.percentChange24h)})\n`;
      }
      if (eth) {
        body += `Ξ ETH: $${this.formatPrice(eth.price)} (${this.formatChange(eth.percentChange24h)})\n`;
      }
      
      body += `\n🏆 Top Gainer: ${topGainer?.symbol} ${this.formatChange(topGainer?.percentChange24h || 0)}`;
      body += `\n📉 Top Loser: ${topLoser?.symbol} ${this.formatChange(topLoser?.percentChange24h || 0)}`;
      
      if (todayEvents.length > 0) {
        body += `\n\n📅 Today: ${todayEvents.map(e => e.title).join(', ')}`;
      }

      // Add top news headline
      if (topNews.length > 0) {
        body += `\n\n📰 ${topNews[0].title.substring(0, 60)}...`;
      }

      await pushNotificationService.sendToAll({
        title: '🌅 Good Morning! Your Market Briefing',
        body,
        url: '/discover',
        tag: `morning-briefing-${new Date().toDateString()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_markets', title: '📊 Markets' },
          { action: 'start_trading', title: '⚡ Trade' }
        ]
      }, 'morning_briefing');

      console.log('✅ Morning briefing sent');
    } catch (error) {
      console.error('❌ Failed to send morning briefing:', error);
    }
  }

  async sendMarketMovers(): Promise<void> {
    try {
      const cryptoData = await marketDataService.getCryptoQuotes([
        'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
        'ATOM', 'UNI', 'LTC', 'BCH', 'ALGO'
      ]);

      if (cryptoData.length === 0) {
        console.log('⚠️ No crypto data available for market movers');
        return;
      }

      // Sort by absolute change
      const sorted = [...cryptoData].sort((a, b) => 
        Math.abs(b.percentChange24h) - Math.abs(a.percentChange24h)
      );

      const gainers = sorted.filter(c => c.percentChange24h > 0).slice(0, 3);
      const losers = sorted.filter(c => c.percentChange24h < 0).slice(0, 3);

      let body = '🚀 TOP GAINERS\n';
      gainers.forEach(g => {
        body += `${g.symbol}: ${this.formatChange(g.percentChange24h)} ($${this.formatPrice(g.price)})\n`;
      });

      body += '\n📉 TOP LOSERS\n';
      losers.forEach(l => {
        body += `${l.symbol}: ${this.formatChange(l.percentChange24h)} ($${this.formatPrice(l.price)})\n`;
      });

      // Overall market direction
      const avgChange = cryptoData.reduce((sum, c) => sum + c.percentChange24h, 0) / cryptoData.length;
      const marketEmoji = avgChange > 1 ? '🟢' : avgChange < -1 ? '🔴' : '🟡';
      body += `\n${marketEmoji} Market avg: ${this.formatChange(avgChange)}`;

      await pushNotificationService.sendToAll({
        title: '📊 Market Movers Update',
        body,
        url: '/discover',
        tag: `market-movers-${Date.now()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_all', title: '📈 View All' },
          { action: 'trade', title: '⚡ Trade' }
        ]
      }, 'market_movers');

      console.log('✅ Market movers notification sent');
    } catch (error) {
      console.error('❌ Failed to send market movers:', error);
    }
  }

  async checkPriceAlerts(): Promise<void> {
    try {
      const cryptoData = await marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO);
      const now = Date.now();

      for (const crypto of cryptoData) {
        const key = crypto.symbol;
        const snapshot: PriceSnapshot = {
          symbol: crypto.symbol,
          price: crypto.price,
          timestamp: now
        };

        // Store snapshot
        if (!this.priceSnapshots.has(key)) {
          this.priceSnapshots.set(key, []);
        }
        const snapshots = this.priceSnapshots.get(key)!;
        snapshots.push(snapshot);

        // Keep only last hour of snapshots
        const oneHourAgo = now - 60 * 60 * 1000;
        const filteredSnapshots = snapshots.filter(s => s.timestamp > oneHourAgo);
        this.priceSnapshots.set(key, filteredSnapshots);

        if (filteredSnapshots.length < 2) continue;

        // Check for significant move in last hour
        const oldestPrice = filteredSnapshots[0].price;
        const currentPrice = crypto.price;
        const hourlyChange = ((currentPrice - oldestPrice) / oldestPrice) * 100;

        // Check cooldown
        const lastAlert = this.lastPriceAlerts.get(key) || 0;
        if (now - lastAlert < this.ALERT_COOLDOWN) continue;

        if (Math.abs(hourlyChange) >= this.PRICE_ALERT_THRESHOLD) {
          const direction = hourlyChange > 0 ? '🚀' : '💥';
          const moveType = hourlyChange > 0 ? 'surging' : 'plunging';
          
          await pushNotificationService.sendToAll({
            title: `${direction} ${crypto.symbol} ${moveType.toUpperCase()}!`,
            body: `${this.formatChange(hourlyChange)} in the last hour!\n$${this.formatPrice(oldestPrice)} → $${this.formatPrice(currentPrice)}\n\n24h: ${this.formatChange(crypto.percentChange24h)}`,
            url: '/discover',
            tag: `price-surge-${key}`,
            requireInteraction: true,
            actions: [
              { action: 'trade_now', title: '⚡ Trade Now' },
              { action: 'view_chart', title: '📊 Chart' }
            ]
          }, 'price_alert');

          this.lastPriceAlerts.set(key, now);
          console.log(`🚨 Price alert sent for ${key}: ${hourlyChange.toFixed(2)}% in 1h`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check price alerts:', error);
    }
  }

  async checkMacroAlerts(): Promise<void> {
    try {
      const events = await marketDataService.getEconomicCalendar({ 
        timeRange: '1d',
        impact: ['high']
      });

      const now = Date.now();
      const upcomingEvents = events.filter(e => {
        const eventTime = new Date(e.scheduledDate).getTime();
        const hoursUntil = (eventTime - now) / (60 * 60 * 1000);
        return hoursUntil > 0 && hoursUntil <= 2; // Events in next 2 hours
      });

      for (const event of upcomingEvents.slice(0, 2)) {
        const eventTime = new Date(event.scheduledDate);
        const minutesUntil = Math.round((eventTime.getTime() - now) / (60 * 1000));
        
        const impactEmoji = event.category === 'monetary_policy' ? '🏛️' : 
                           event.category === 'inflation' ? '📈' :
                           event.category === 'employment' ? '👥' : '📊';

        await pushNotificationService.sendToAll({
          title: `${impactEmoji} Macro Alert: ${event.title}`,
          body: `⏰ In ${minutesUntil} minutes\n${event.description || ''}\n\n💡 High-impact event - volatility expected`,
          url: '/discover',
          tag: `macro-${event.id || Date.now()}`,
          requireInteraction: true,
          actions: [
            { action: 'prepare', title: '🎯 Prepare' },
            { action: 'dismiss', title: '✓ Got it' }
          ]
        }, 'macro_alerts');

        console.log(`🏛️ Macro alert sent: ${event.title}`);
      }
    } catch (error) {
      console.error('❌ Failed to check macro alerts:', error);
    }
  }

  async sendEveningRecap(): Promise<void> {
    try {
      const [cryptoData, tradingMetrics] = await Promise.all([
        marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO),
        this.getTradingMetricsSummary()
      ]);
      
      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');
      
      // Calculate overall market performance
      const avgChange = cryptoData.reduce((sum, c) => sum + c.percentChange24h, 0) / cryptoData.length;
      const marketStatus = avgChange > 2 ? '🟢 Great day!' : 
                          avgChange > 0 ? '🟡 Slight gains' :
                          avgChange > -2 ? '🟡 Minor dip' : '🔴 Rough day';

      // Find day's biggest winner and loser
      const topGainer = cryptoData.reduce((max, c) => 
        (c.percentChange24h > (max?.percentChange24h || -Infinity)) ? c : max, cryptoData[0]);
      const topLoser = cryptoData.reduce((min, c) => 
        (c.percentChange24h < (min?.percentChange24h || Infinity)) ? c : min, cryptoData[0]);

      let body = `${marketStatus}\n\n`;
      
      if (btc) {
        body += `₿ BTC closed: $${this.formatPrice(btc.price)} (${this.formatChange(btc.percentChange24h)})\n`;
      }
      if (eth) {
        body += `Ξ ETH closed: $${this.formatPrice(eth.price)} (${this.formatChange(eth.percentChange24h)})\n`;
      }
      
      body += `\n📊 Market Average: ${this.formatChange(avgChange)}`;
      body += `\n🏆 Star of the Day: ${topGainer?.symbol} ${this.formatChange(topGainer?.percentChange24h || 0)}`;
      body += `\n📉 Laggard: ${topLoser?.symbol} ${this.formatChange(topLoser?.percentChange24h || 0)}`;

      // Add trading metrics summary
      if (tradingMetrics) {
        body += `\n\n📈 TRADING METRICS`;
        body += `\n💰 Funding: ${tradingMetrics.avgFundingRate > 0 ? '+' : ''}${(tradingMetrics.avgFundingRate * 100).toFixed(3)}%`;
        body += `\n💥 Liquidations: $${this.formatLargeNumber(tradingMetrics.totalLiquidations)}`;
      }

      await pushNotificationService.sendToAll({
        title: '🌆 Evening Market Recap',
        body,
        url: '/discover',
        tag: `evening-recap-${new Date().toDateString()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_summary', title: '📊 Full Summary' },
          { action: 'set_alerts', title: '⚡ Set Alerts' }
        ]
      }, 'evening_recap');

      console.log('✅ Evening recap sent');
    } catch (error) {
      console.error('❌ Failed to send evening recap:', error);
    }
  }

  async sendWeeklyPreview(): Promise<void> {
    try {
      const events = await marketDataService.getEconomicCalendar({ 
        timeRange: '7d',
        impact: ['high', 'medium']
      });

      // Get events for next 7 days
      const now = Date.now();
      const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
      const weekEvents = events.filter(e => {
        const eventTime = new Date(e.scheduledDate).getTime();
        return eventTime > now && eventTime < weekFromNow;
      }).slice(0, 5);

      const cryptoData = await marketDataService.getCryptoQuotes(['BTC', 'ETH']);
      const btc = cryptoData.find(c => c.symbol === 'BTC');

      let body = '📅 KEY EVENTS THIS WEEK\n\n';
      
      if (weekEvents.length > 0) {
        weekEvents.forEach(e => {
          const date = new Date(e.scheduledDate);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          body += `${dayName}: ${e.title}\n`;
        });
      } else {
        body += 'No major economic events scheduled\n';
      }

      body += '\n📊 CURRENT LEVELS\n';
      if (btc) {
        body += `BTC: $${this.formatPrice(btc.price)}\n`;
        body += `7-day: ${this.formatChange(btc.percentChange7d || 0)}\n`;
      }

      body += '\n💡 Stay alert for opportunities!';

      await pushNotificationService.sendToAll({
        title: '📅 Your Week Ahead in Crypto',
        body,
        url: '/discover',
        tag: 'weekly-preview',
        requireInteraction: false,
        actions: [
          { action: 'view_calendar', title: '📅 Calendar' },
          { action: 'explore', title: '🔍 Explore' }
        ]
      }, 'weekly_digest');

      console.log('✅ Weekly preview sent');
    } catch (error) {
      console.error('❌ Failed to send weekly preview:', error);
    }
  }

  // ============================================================================
  // COINDESK NEWS ALERTS
  // ============================================================================

  async checkCoinDeskNews(): Promise<void> {
    try {
      const articles = await newsService.fetchCoinDeskNews();
      const now = Date.now();
      
      // Clean up old sent articles (older than 24 hours)
      this.sentNewsArticles = this.sentNewsArticles.filter(
        a => now - a.sentAt < this.NEWS_ARTICLE_RETENTION
      );

      // Find new breaking stories (published within last 30 minutes)
      const thirtyMinutesAgo = now - 30 * 60 * 1000;
      const newArticles = articles.filter(article => {
        const pubDate = new Date(article.published).getTime();
        const isRecent = pubDate > thirtyMinutesAgo;
        const notSent = !this.sentNewsArticles.some(sent => sent.id === article.id);
        const isImportant = this.isImportantNews(article.title, article.summary);
        return isRecent && notSent && isImportant;
      });

      if (newArticles.length === 0) return;

      // Send top 2 most important stories
      for (const article of newArticles.slice(0, 2)) {
        const emoji = this.getNewsEmoji(article.category);
        
        await pushNotificationService.sendToAll({
          title: `${emoji} CoinDesk: ${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}`,
          body: `${article.summary.substring(0, 120)}...\n\n📰 Source: ${article.source} | ${article.category}`,
          url: article.url,
          tag: `coindesk-${article.id}`,
          requireInteraction: false,
          actions: [
            { action: 'read_more', title: '📖 Read More' },
            { action: 'dismiss', title: '✓ Dismiss' }
          ]
        }, 'coindesk_news');

        this.sentNewsArticles.push({ id: article.id, sentAt: now });
        console.log(`📰 CoinDesk alert sent: ${article.title.substring(0, 40)}...`);
      }
    } catch (error) {
      console.error('❌ Failed to check CoinDesk news:', error);
    }
  }

  private isImportantNews(title: string, summary: string): boolean {
    const text = `${title} ${summary}`.toLowerCase();
    const importantKeywords = [
      'breaking', 'just in', 'urgent', 'alert', 'sec', 'etf', 'approve',
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'regulation', 'ban',
      'hack', 'exploit', 'crash', 'surge', 'rally', 'all-time high', 'ath',
      'federal reserve', 'fed', 'interest rate', 'inflation', 'elon musk',
      'blackrock', 'grayscale', 'coinbase', 'binance', 'ftx', 'bankruptcy',
      'lawsuit', 'investigation', 'billion', 'million', 'whale', 'dump',
      'pump', 'trump', 'election', 'government', 'treasury', 'bank'
    ];

    return importantKeywords.some(keyword => text.includes(keyword));
  }

  private getNewsEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Bitcoin': '₿',
      'Ethereum': 'Ξ',
      'DeFi': '🔗',
      'Regulation': '⚖️',
      'Markets': '📈',
      'Technology': '🔧',
      'Business': '💼',
      'NFT & Metaverse': '🎨',
      'General': '📰'
    };
    return emojiMap[category] || '📰';
  }

  // ============================================================================
  // TRADING METRICS ALERTS
  // ============================================================================

  async checkTradingMetrics(): Promise<void> {
    try {
      // Get derivatives data for major assets
      const [btcPositioning, ethPositioning] = await Promise.all([
        derivativesAnalyticsService.getFuturesPositioning('BTC'),
        derivativesAnalyticsService.getFuturesPositioning('ETH')
      ]);

      const now = Date.now();
      const metrics: TradingMetricSnapshot[] = [];

      if (btcPositioning) {
        metrics.push({
          symbol: 'BTC',
          fundingRate: btcPositioning.fundingRateHistory[0]?.rate || 0,
          openInterest: btcPositioning.totalLongOI + btcPositioning.totalShortOI,
          liquidations24h: 0, // Will be filled from liquidation data
          timestamp: now
        });
      }

      if (ethPositioning) {
        metrics.push({
          symbol: 'ETH',
          fundingRate: ethPositioning.fundingRateHistory[0]?.rate || 0,
          openInterest: ethPositioning.totalLongOI + ethPositioning.totalShortOI,
          liquidations24h: 0,
          timestamp: now
        });
      }

      // Store snapshots for trend analysis
      for (const metric of metrics) {
        if (!this.tradingMetricSnapshots.has(metric.symbol)) {
          this.tradingMetricSnapshots.set(metric.symbol, []);
        }
        const snapshots = this.tradingMetricSnapshots.get(metric.symbol)!;
        snapshots.push(metric);

        // Keep only last 24 hours of snapshots
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        this.tradingMetricSnapshots.set(
          metric.symbol,
          snapshots.filter(s => s.timestamp > oneDayAgo)
        );
      }

    } catch (error) {
      console.error('❌ Failed to check trading metrics:', error);
    }
  }

  async checkFundingRateAlerts(): Promise<void> {
    try {
      const [btcPositioning, ethPositioning] = await Promise.all([
        derivativesAnalyticsService.getFuturesPositioning('BTC'),
        derivativesAnalyticsService.getFuturesPositioning('ETH')
      ]);

      const now = Date.now();
      const positions = [
        { symbol: 'BTC', data: btcPositioning },
        { symbol: 'ETH', data: ethPositioning }
      ];

      for (const { symbol, data } of positions) {
        if (!data || data.fundingRateHistory.length === 0) continue;

        const fundingRate = data.fundingRateHistory[0].rate;
        const lastAlert = this.lastFundingRateAlerts.get(symbol) || 0;
        
        // Check cooldown (1 hour for funding rate alerts)
        if (now - lastAlert < 60 * 60 * 1000) continue;

        const absRate = Math.abs(fundingRate);
        if (absRate >= this.FUNDING_RATE_EXTREME_THRESHOLD) {
          const direction = fundingRate > 0 ? '🔥 LONGS PAYING' : '❄️ SHORTS PAYING';
          const sentiment = fundingRate > 0 ? 'extremely bullish' : 'extremely bearish';
          
          await pushNotificationService.sendToAll({
            title: `${direction} - ${symbol} Funding Rate Alert!`,
            body: `Funding Rate: ${(fundingRate * 100).toFixed(3)}%\n\nMarket is ${sentiment}!\n\n⚠️ This is ~${Math.round(absRate * 3 * 365)}% annualized - potential reversal signal`,
            url: '/discover',
            tag: `funding-${symbol}`,
            requireInteraction: true,
            actions: [
              { action: 'view_details', title: '📊 Details' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          }, 'funding_rate_alerts');

          this.lastFundingRateAlerts.set(symbol, now);
          console.log(`💰 Funding rate alert sent for ${symbol}: ${(fundingRate * 100).toFixed(3)}%`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check funding rate alerts:', error);
    }
  }

  async checkLiquidationAlerts(): Promise<void> {
    try {
      const [btcLiquidations, ethLiquidations] = await Promise.all([
        derivativesAnalyticsService.getLiquidationData('BTC'),
        derivativesAnalyticsService.getLiquidationData('ETH')
      ]);

      const now = Date.now();
      const liquidationData = [
        { symbol: 'BTC', data: btcLiquidations },
        { symbol: 'ETH', data: ethLiquidations }
      ];

      for (const { symbol, data } of liquidationData) {
        if (!data) continue;

        const totalLiquidations = data.liquidations24h.totalNotional;
        const lastAlert = this.lastLiquidationAlerts.get(symbol) || 0;
        
        // Check cooldown (30 minutes for liquidation alerts)
        if (now - lastAlert < 30 * 60 * 1000) continue;

        if (totalLiquidations >= this.LIQUIDATION_SPIKE_THRESHOLD) {
          const dominantSide = data.liquidations24h.long > data.liquidations24h.short ? 'LONGS' : 'SHORTS';
          const emoji = dominantSide === 'LONGS' ? '🔴' : '🟢';
          
          await pushNotificationService.sendToAll({
            title: `💥 ${symbol} Liquidation Cascade!`,
            body: `$${this.formatLargeNumber(totalLiquidations)} liquidated in 24h!\n\n${emoji} ${dominantSide} getting rekt\n📊 Longs: $${this.formatLargeNumber(data.liquidations24h.long)}\n📊 Shorts: $${this.formatLargeNumber(data.liquidations24h.short)}`,
            url: '/discover',
            tag: `liquidation-${symbol}`,
            requireInteraction: true,
            actions: [
              { action: 'view_heatmap', title: '🔥 Heatmap' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          }, 'liquidation_alerts');

          this.lastLiquidationAlerts.set(symbol, now);
          console.log(`💥 Liquidation alert sent for ${symbol}: $${this.formatLargeNumber(totalLiquidations)}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check liquidation alerts:', error);
    }
  }

  async checkWhaleAlerts(): Promise<void> {
    try {
      // Get smart money movements which include whale activity
      const whaleActivity = await institutionalFlowService.getSmartMoneyMovements(['BTC', 'ETH', 'SOL'], this.WHALE_ALERT_THRESHOLD);
      const now = Date.now();

      if (!whaleActivity || whaleActivity.length === 0) return;

      // Find significant whale movements in last 10 minutes
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const recentWhaleMovements = whaleActivity.filter((w: any) => {
        const txTime = new Date(w.timestamp).getTime();
        return txTime > tenMinutesAgo && w.value >= this.WHALE_ALERT_THRESHOLD;
      });

      for (const whale of recentWhaleMovements.slice(0, 2)) {
        const alertKey = whale.hash || `${whale.from}-${whale.timestamp}`;
        const lastAlert = this.lastWhaleAlerts.get(alertKey);
        
        if (lastAlert) continue; // Already sent for this transaction

        const direction = whale.type === 'accumulation' ? '🐋 WHALE BUYING' : 
                         whale.type === 'distribution' ? '🐋 WHALE SELLING' : '🐋 WHALE ALERT';
        
        const sentiment = whale.type === 'accumulation' ? '🟢 Bullish' : 
                         whale.type === 'distribution' ? '🔴 Bearish' : '🟡 Neutral';

        await pushNotificationService.sendToAll({
          title: `${direction} - $${this.formatLargeNumber(whale.value)}`,
          body: `${whale.asset || 'Crypto'} moved!\n\n${sentiment} signal\n📍 From: ${this.truncateAddress(whale.from)}\n📍 To: ${this.truncateAddress(whale.to)}\n\n🎯 Impact: ${whale.impact?.toUpperCase() || 'SIGNIFICANT'}`,
          url: '/discover',
          tag: `whale-${alertKey}`,
          requireInteraction: true,
          actions: [
            { action: 'track', title: '👁️ Track' },
            { action: 'trade', title: '⚡ Trade' }
          ]
        }, 'whale_alerts');

        this.lastWhaleAlerts.set(alertKey, now);
        console.log(`🐋 Whale alert sent: $${this.formatLargeNumber(whale.value)} ${whale.type}`);
      }
    } catch (error) {
      console.error('❌ Failed to check whale alerts:', error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getTradingMetricsSummary(): Promise<{ avgFundingRate: number; totalLiquidations: number } | null> {
    try {
      const [btcPositioning, btcLiquidations] = await Promise.all([
        derivativesAnalyticsService.getFuturesPositioning('BTC'),
        derivativesAnalyticsService.getLiquidationData('BTC')
      ]);

      return {
        avgFundingRate: btcPositioning?.fundingRateHistory[0]?.rate || 0,
        totalLiquidations: btcLiquidations?.liquidations24h.totalNotional || 0
      };
    } catch (error) {
      console.error('❌ Failed to get trading metrics summary:', error);
      return null;
    }
  }

  async sendManualAlert(title: string, body: string, url?: string): Promise<void> {
    await pushNotificationService.sendToAll({
      title,
      body,
      url: url || '/discover',
      tag: `manual-alert-${Date.now()}`,
      requireInteraction: true,
      actions: [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '✓ Dismiss' }
      ]
    });
    console.log(`📢 Manual alert sent: ${title}`);
  }

  private formatPrice(price: number): string {
    if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  }

  private formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  private formatLargeNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private truncateAddress(address: string): string {
    if (!address || address.length < 10) return address || 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getStatus(): { 
    isRunning: boolean; 
    trackedAssets: number; 
    priceSnapshots: number;
    sentNewsCount: number;
    tradingMetricSnapshots: number;
  } {
    return {
      isRunning: this.isStarted,
      trackedAssets: this.TRACKED_CRYPTO.length + this.TRACKED_STOCKS.length,
      priceSnapshots: Array.from(this.priceSnapshots.values()).reduce((sum, arr) => sum + arr.length, 0),
      sentNewsCount: this.sentNewsArticles.length,
      tradingMetricSnapshots: Array.from(this.tradingMetricSnapshots.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const marketIntelligenceNotifier = new MarketIntelligenceNotifier();
