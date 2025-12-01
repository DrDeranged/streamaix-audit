import cron from 'node-cron';
import { pushNotificationService } from './pushNotificationService';
import { marketDataService } from './marketDataService';
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

class MarketIntelligenceNotifier {
  private isStarted = false;
  private priceSnapshots: Map<string, PriceSnapshot[]> = new Map();
  private lastPriceAlerts: Map<string, number> = new Map();
  
  private readonly TRACKED_CRYPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
  private readonly TRACKED_STOCKS = ['MSTR', 'COIN', 'RIOT', 'MARA', 'NVDA', 'TSLA'];
  private readonly PRICE_ALERT_THRESHOLD = 3; // 3% in 1 hour
  private readonly ALERT_COOLDOWN = 30 * 60 * 1000; // 30 min cooldown per asset

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

    // Breaking News Check - Every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.checkBreakingNews();
    }, { timezone: "America/New_York" });

    this.isStarted = true;
    console.log('📡 Market Intelligence Notifier started');
    console.log('   ⏰ Morning Briefing: 8am EST (Mon-Fri)');
    console.log('   📊 Market Movers: Every 4 hours');
    console.log('   ⚡ Price Alerts: Every 15 min (3%+ moves)');
    console.log('   🏛️ Macro Alerts: Every 2 hours');
    console.log('   🌆 Evening Recap: 6pm EST (Mon-Fri)');
    console.log('   📅 Weekly Preview: Sunday 7pm EST');
  }

  stop(): void {
    this.isStarted = false;
    console.log('⏹️ Market Intelligence Notifier stopped');
  }

  async sendMorningBriefing(): Promise<void> {
    try {
      const [cryptoData, stockData, economicEvents] = await Promise.all([
        marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO),
        marketDataService.getCryptoStocks(),
        marketDataService.getEconomicCalendar({ timeRange: '1d', impact: ['high'] })
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
      const cryptoData = await marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO);
      
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

  async checkBreakingNews(): Promise<void> {
    // This could be expanded to check RSS feeds or news APIs
    // For now, we'll rely on the price alerts for breaking moves
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

  getStatus(): { isRunning: boolean; trackedAssets: number; priceSnapshots: number } {
    return {
      isRunning: this.isStarted,
      trackedAssets: this.TRACKED_CRYPTO.length + this.TRACKED_STOCKS.length,
      priceSnapshots: Array.from(this.priceSnapshots.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

export const marketIntelligenceNotifier = new MarketIntelligenceNotifier();
