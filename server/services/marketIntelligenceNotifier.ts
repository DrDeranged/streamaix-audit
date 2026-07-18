import { jobScheduler } from '../jobs/scheduler';
import { pushNotificationService } from './pushNotificationService';
import { marketDataService } from './marketDataService';
import { newsService } from './newsService';
import { derivativesAnalyticsService } from './derivativesAnalyticsService';
import { institutionalFlowService } from './institutionalFlowService';
import { alphaInsightsEngine } from './alphaInsightsEngine';
import { alphaIntelligenceService } from './alphaIntelligenceService';
import { stockMarketService } from './stockMarketService';
import { notificationDataValidator } from './notificationDataValidator';
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
  private lastAlphaSignals: Map<string, number> = new Map();
  
  // Alpha Intelligence tracking
  private lastNarrativeMomentum: Map<string, number> = new Map();
  private lastCTAlphaSignals: Map<string, number> = new Map();
  private lastTokenUnlockAlerts: Map<string, number> = new Map();
  private lastAirdropAlerts: Map<string, number> = new Map();
  private lastGovernanceAlerts: Map<string, number> = new Map();
  private lastVCWalletAlerts: Map<string, number> = new Map();
  private lastExchangeFlowAlerts: Map<string, number> = new Map();
  private lastAITradeIdeas: number = 0;
  private lastEventImpactAlerts: Map<string, number> = new Map();
  private lastAnomalyAlerts: Map<string, number> = new Map();
  private lastConferenceAlerts: Map<string, number> = new Map();
  private lastStockAlerts: Map<string, number> = new Map();
  private previousNarrativeMomentum: Map<string, number> = new Map();
  
  // Notification deduplication to prevent duplicate messages
  private sentNotificationHashes: Map<string, number> = new Map();
  private readonly NOTIFICATION_DEDUPE_TTL = 60 * 60 * 1000; // 1 hour dedup window
  
  private readonly TRACKED_CRYPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
  private readonly TRACKED_STOCKS = ['MSTR', 'COIN', 'RIOT', 'MARA', 'NVDA', 'TSLA'];
  private readonly PRICE_ALERT_THRESHOLD = 3; // 3% in 1 hour
  private readonly ALERT_COOLDOWN = 30 * 60 * 1000; // 30 min cooldown per asset
  private readonly NEWS_ARTICLE_RETENTION = 24 * 60 * 60 * 1000; // 24 hours
  
  // Trading metric thresholds
  private readonly FUNDING_RATE_EXTREME_THRESHOLD = 0.10; // 0.10% per 8h (annualized ~36%) - Only alert on truly extreme rates
  private readonly FUNDING_RATE_HIGH_THRESHOLD = 0.03; // 0.03% per 8h
  private readonly LIQUIDATION_SPIKE_THRESHOLD = 50_000_000; // $50M in liquidations
  private readonly WHALE_ALERT_THRESHOLD = 10_000_000; // $10M whale movement
  
  // Alpha Intelligence thresholds
  private readonly NARRATIVE_SPIKE_THRESHOLD = 10; // 10% momentum increase
  private readonly CT_CONFIDENCE_THRESHOLD = 75; // Only high-confidence signals
  private readonly VC_WALLET_MIN_VALUE = 5_000_000; // $5M+ moves
  private readonly STOCK_MOVE_THRESHOLD = 4; // 4%+ move in tech stocks

  start(): void {
    if (this.isStarted) {
      console.log('⚠️ Market Intelligence Notifier is already running');
      return;
    }

    // QUIET MODE: Skip all background polling to save API calls
    // Data will only be fetched on-demand when users actively request it
    if (process.env.QUIET_MODE === 'true') {
      console.log('🔇 [Market Intelligence] QUIET MODE enabled - all background polling disabled');
      console.log('   → Data will only be fetched when users actively request it');
      console.log('   → This dramatically reduces CoinGecko API usage');
      this.isStarted = true; // Mark as started but don't schedule any crons
      return;
    }

    // Morning Briefing - 8am EST weekdays
    jobScheduler.registerCron('market-intel-morning-briefing', '0 8 * * 1-5', async () => {
      console.log('🌅 Morning Briefing starting...');
      await this.sendMorningBriefing();
    }, { timezone: 'America/New_York' });

    // Market Movers - Every 4 hours (6am, 10am, 2pm, 6pm, 10pm EST)
    jobScheduler.registerCron('market-intel-market-movers', '0 6,10,14,18,22 * * *', async () => {
      console.log('📊 Market Movers update starting...');
      await this.sendMarketMovers();
    }, { timezone: 'America/New_York' });

    // Price Monitor - Every 2 hours for significant moves (reduced from 15 min to save API calls)
    jobScheduler.registerCron('market-intel-price-alerts', '0 */2 * * *', async () => {
      await this.checkPriceAlerts();
    }, { timezone: 'America/New_York' });

    // Macro Alerts - Check Fed/economic news every 2 hours
    jobScheduler.registerCron('market-intel-macro-alerts', '0 */2 * * *', async () => {
      console.log('🏛️ Checking macro events...');
      await this.checkMacroAlerts();
    }, { timezone: 'America/New_York' });

    // Evening Recap - 6pm EST weekdays
    jobScheduler.registerCron('market-intel-evening-recap', '0 18 * * 1-5', async () => {
      console.log('🌆 Evening Recap starting...');
      await this.sendEveningRecap();
    }, { timezone: 'America/New_York' });

    // Weekly Preview - Sunday 7pm EST
    jobScheduler.registerCron('market-intel-weekly-preview', '0 19 * * 0', async () => {
      console.log('📅 Weekly Preview starting...');
      await this.sendWeeklyPreview();
    }, { timezone: 'America/New_York' });

    // CoinDesk Breaking News - Every 2 hours (reduced from 15 min to save API calls)
    jobScheduler.registerCron('market-intel-coin-desk-news', '0 */2 * * *', async () => {
      await this.checkCoinDeskNews();
    }, { timezone: 'America/New_York' });

    // Trading Metrics Monitor - Every 3 hours (reduced from 10 min to save API calls)
    jobScheduler.registerCron('market-intel-trading-metrics', '0 */3 * * *', async () => {
      await this.checkTradingMetrics();
    }, { timezone: 'America/New_York' });

    // Whale Alert Monitor - Every 2 hours (reduced from 5 min to save API calls)
    jobScheduler.registerCron('market-intel-whale-alerts', '0 */2 * * *', async () => {
      await this.checkWhaleAlerts();
    }, { timezone: 'America/New_York' });

    // Liquidation Alert Monitor - Every 2 hours (reduced from 5 min to save API calls)
    jobScheduler.registerCron('market-intel-liquidation-alerts', '0 */2 * * *', async () => {
      await this.checkLiquidationAlerts();
    }, { timezone: 'America/New_York' });

    // Funding Rate Monitor - Every 4 hours (reduced from 30 min to save API calls)
    jobScheduler.registerCron('market-intel-funding-rate-alerts', '0 */4 * * *', async () => {
      await this.checkFundingRateAlerts();
    }, { timezone: 'America/New_York' });

    // High-Conviction Alpha Signals - Every 4 hours (reduced from 20 min to save API calls)
    jobScheduler.registerCron('market-intel-alpha-signals', '0 */4 * * *', async () => {
      console.log('🎯 Checking alpha signal confluence...');
      await this.checkAlphaSignals();
    }, { timezone: 'America/New_York' });

    // ============================================================
    // ALPHA INTELLIGENCE NOTIFICATIONS (NEW)
    // ============================================================

    // Narrative Momentum Alerts - Every 6 hours (reduced from 30 min to save API calls)
    jobScheduler.registerCron('market-intel-narrative-momentum', '0 */6 * * *', async () => {
      await this.checkNarrativeMomentum();
    }, { timezone: 'America/New_York' });

    // CT Alpha Feed - Every 4 hours (reduced from 15 min to save API calls)
    jobScheduler.registerCron('market-intel-ctalpha-signals', '0 */4 * * *', async () => {
      await this.checkCTAlphaSignals();
    }, { timezone: 'America/New_York' });

    // Token Unlock Warnings - Every 4 hours
    jobScheduler.registerCron('market-intel-token-unlocks', '0 */4 * * *', async () => {
      await this.checkTokenUnlocks();
    }, { timezone: 'America/New_York' });

    // Airdrop Radar - Daily at 9am EST
    jobScheduler.registerCron('market-intel-airdrop-opportunities', '0 9 * * *', async () => {
      await this.checkAirdropOpportunities();
    }, { timezone: 'America/New_York' });

    // Governance Critical Alerts - Every 6 hours (reduced from hourly to save API calls)
    jobScheduler.registerCron('market-intel-governance-alerts', '0 */6 * * *', async () => {
      await this.checkGovernanceAlerts();
    }, { timezone: 'America/New_York' });

    // VC Wallet Activity - Every 4 hours (reduced from 10 min to save API calls)
    jobScheduler.registerCron('market-intel-vcwallet-activity', '0 */4 * * *', async () => {
      await this.checkVCWalletActivity();
    }, { timezone: 'America/New_York' });

    // Exchange Flow Anomalies - Every 4 hours (reduced from 15 min to save API calls)
    jobScheduler.registerCron('market-intel-exchange-flow-anomalies', '0 */4 * * *', async () => {
      await this.checkExchangeFlowAnomalies();
    }, { timezone: 'America/New_York' });

    // AI Trade Ideas - Every 4 hours
    jobScheduler.registerCron('market-intel-aitrade-ideas', '0 */4 * * *', async () => {
      await this.pushAITradeIdeas();
    }, { timezone: 'America/New_York' });

    // Event Impact Pre-Alerts - Every 6 hours
    jobScheduler.registerCron('market-intel-event-impacts', '0 */6 * * *', async () => {
      await this.checkEventImpacts();
    }, { timezone: 'America/New_York' });

    // Anomaly Detection - Every 4 hours (reduced from 10 min to save API calls)
    jobScheduler.registerCron('market-intel-market-anomalies', '0 */4 * * *', async () => {
      await this.checkMarketAnomalies();
    }, { timezone: 'America/New_York' });

    // Conference Calendar - Weekly Sunday 5pm EST
    jobScheduler.registerCron('market-intel-conference-reminders', '0 17 * * 0', async () => {
      await this.sendConferenceReminders();
    }, { timezone: 'America/New_York' });

    // Tech/AI Stock Alerts - Every 30 minutes (market hours)
    jobScheduler.registerCron('market-intel-tech-stock-alerts', '*/30 9-16 * * 1-5', async () => {
      await this.checkTechStockAlerts();
    }, { timezone: 'America/New_York' });

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
    console.log('   🎯 Alpha Signals: Every 20 min (confluence detection)');
    console.log('   📈 Narrative Momentum: Every 30 min');
    console.log('   🐦 CT Alpha Feed: Every 15 min');
    console.log('   🔓 Token Unlocks: Every 4 hours');
    console.log('   🎁 Airdrop Radar: Daily 9am EST');
    console.log('   🗳️ Governance: Every hour');
    console.log('   💼 VC Wallet Tracker: Every 10 min');
    console.log('   🏦 Exchange Flows: Every 15 min');
    console.log('   💡 AI Trade Ideas: Every 4 hours');
    console.log('   📅 Event Impacts: Every 6 hours');
    console.log('   🚨 Anomaly Detector: Every 10 min');
    console.log('   🎤 Conferences: Weekly Sunday 5pm EST');
    console.log('   📊 Tech/AI Stocks: Every 30 min (market hours)');
  }

  stop(): void {
    this.isStarted = false;
    console.log('⏹️ Market Intelligence Notifier stopped');
  }

  /**
   * Validated notification sender - all notifications pass through CoinGecko cross-referencing
   * before being sent to ensure real-time data accuracy
   */
  private async sendValidatedNotification(
    notificationType: string,
    payload: { title: string; body: string; url?: string; tag?: string; requireInteraction?: boolean; actions?: Array<{ action: string; title: string }> },
    category: string,
    requiredAssets: string[] = ['BTC', 'ETH']
  ): Promise<boolean> {
    try {
      // Validate notification data against live CoinGecko prices
      const validation = await notificationDataValidator.validateNotification({
        type: notificationType,
        title: payload.title,
        body: payload.body,
        requiredAssets,
        data: { category, originalPayload: payload }
      });

      if (!validation.isValid) {
        console.log(`⚠️ [Validator] ${notificationType} notification BLOCKED: ${validation.errors.join(', ')}`);
        return false;
      }

      if (validation.warnings.length > 0) {
        console.log(`⚠️ [Validator] ${notificationType} warnings: ${validation.warnings.join(', ')}`);
      }

      // Append market context to body if not already included
      const marketContext = await notificationDataValidator.getRealTimeMarketContext();
      const contextLine = `\n\n📊 BTC: $${marketContext.btcPrice.toLocaleString()} (${marketContext.btcChange24h >= 0 ? '+' : ''}${marketContext.btcChange24h.toFixed(1)}%)`;
      
      const enhancedPayload = {
        ...payload,
        body: payload.body.includes('BTC:') ? payload.body : payload.body + contextLine
      };

      await pushNotificationService.sendToAll(enhancedPayload, category);
      console.log(`✅ [Validator] ${notificationType} notification sent (freshness: ${validation.dataFreshness})`);
      return true;
    } catch (error) {
      console.error(`❌ [Validator] Failed to validate/send ${notificationType}:`, error);
      return false;
    }
  }

  async sendMorningBriefing(): Promise<void> {
    try {
      const [cryptoData, economicEvents] = await Promise.all([
        marketDataService.getCryptoQuotes(this.TRACKED_CRYPTO),
        marketDataService.getEconomicCalendar({ timeRange: '1d', impact: ['high'] })
      ]);

      if (cryptoData.length === 0) {
        console.log('⚠️ No crypto data available for morning briefing');
        return;
      }

      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');

      // Today's key events
      const todayEvents = economicEvents.filter(e => {
        const eventDate = new Date(e.scheduledDate);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).slice(0, 3);

      // Market sentiment based on actual data
      const avgChange = cryptoData.reduce((sum, c) => sum + c.percentChange24h, 0) / cryptoData.length;
      const sentimentEmoji = avgChange > 2 ? '🟢' : avgChange < -2 ? '🔴' : '🟡';
      
      // Sort by change to find top movers
      const sorted = [...cryptoData].sort((a, b) => Math.abs(b.percentChange24h) - Math.abs(a.percentChange24h));
      const topMover = sorted[0];

      // Data-only notification body (no OpenAI)
      let body = '';
      if (btc) {
        body += `📊 BTC: $${btc.price.toLocaleString()} (${this.formatChange(btc.percentChange24h)})\n`;
      }
      if (eth) {
        body += `📊 ETH: $${eth.price.toLocaleString()} (${this.formatChange(eth.percentChange24h)})\n`;
      }
      
      body += `\n🔥 Top Mover: ${topMover.symbol} ${this.formatChange(topMover.percentChange24h)}`;
      
      if (todayEvents.length > 0) {
        body += `\n\n📅 ${todayEvents.length} high-impact event${todayEvents.length > 1 ? 's' : ''} today`;
      }

      // Simple factual title based on market direction
      const marketDirection = avgChange > 2 ? 'Markets Up' : avgChange < -2 ? 'Markets Down' : 'Markets Steady';
      const title = `${sentimentEmoji} Good Morning! ${marketDirection}`;

      // Check deduplication
      const hash = this.generateNotificationHash(title, body);
      if (this.isDuplicateNotification(hash)) {
        console.log('⚠️ Morning briefing skipped - duplicate content');
        return;
      }

      await pushNotificationService.sendToAll({
        title,
        body,
        url: '/discover',
        tag: `morning-briefing-${new Date().toDateString()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_markets', title: '📊 View' },
          { action: 'start_trading', title: '⚡ Trade' }
        ]
      }, 'morning_briefing');

      this.markNotificationSent(hash);
      console.log('✅ Morning briefing sent (CoinGecko data only)');
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

      // Clean, scannable format with visual separators
      let body = '';
      
      if (gainers.length > 0) {
        body += `🟢 ${gainers.map(g => `${g.symbol} ${this.formatChange(g.percentChange24h)}`).join('  ·  ')}\n\n`;
      }
      
      if (losers.length > 0) {
        body += `🔴 ${losers.map(l => `${l.symbol} ${this.formatChange(l.percentChange24h)}`).join('  ·  ')}`;
      }

      // Overall market direction
      const avgChange = cryptoData.reduce((sum, c) => sum + c.percentChange24h, 0) / cryptoData.length;
      const marketTrend = avgChange > 1 ? '📈 Trending up' : avgChange < -1 ? '📉 Trending down' : '➡️ Sideways';
      body += `\n\n${marketTrend} ${this.formatChange(avgChange)}`;

      const title = avgChange > 2 ? '🚀 Markets Pumping' : 
                    avgChange < -2 ? '💥 Markets Dumping' : 
                    '📊 Market Update';

      await pushNotificationService.sendToAll({
        title,
        body,
        url: '/discover',
        tag: `market-movers-${Date.now()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_all', title: '📈 View' },
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

      // Log data source status for debugging
      if (cryptoData.length === 0) {
        console.warn('⚠️ [Price Alerts] No crypto data available - all APIs failed');
        return;
      }
      
      console.log(`📊 [Price Alerts] Received ${cryptoData.length}/${this.TRACKED_CRYPTO.length} prices, tracking ${this.priceSnapshots.size} assets`);

      let alertsChecked = 0;
      let alertsSent = 0;

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

        alertsChecked++;

        // Check for significant move in last hour
        const oldestPrice = filteredSnapshots[0].price;
        const currentPrice = crypto.price;
        const hourlyChange = ((currentPrice - oldestPrice) / oldestPrice) * 100;

        // Check cooldown
        const lastAlert = this.lastPriceAlerts.get(key) || 0;
        if (now - lastAlert < this.ALERT_COOLDOWN) continue;

        if (Math.abs(hourlyChange) >= this.PRICE_ALERT_THRESHOLD) {
          const isUp = hourlyChange > 0;
          const emoji = isUp ? '🚀' : '💥';
          
          // Data-only notification (no OpenAI)
          const direction = isUp ? 'surging' : 'dropping';
          const title = `${emoji} ${crypto.symbol} ${direction} ${this.formatChange(hourlyChange)} in 1hr`;
          const body = `💰 Price: $${currentPrice.toLocaleString()}\n📊 24h: ${this.formatChange(crypto.percentChange24h)}\n📈 Volume: $${(crypto.volume24h / 1e6).toFixed(1)}M`;
          
          // Check deduplication
          const hash = this.generateNotificationHash(title, body);
          if (this.isDuplicateNotification(hash)) {
            console.log(`⚠️ Price alert for ${key} skipped - duplicate`);
            continue;
          }
          
          await pushNotificationService.sendToAll({
            title,
            body,
            url: '/discover',
            tag: `price-surge-${key}`,
            requireInteraction: true,
            actions: [
              { action: 'trade_now', title: '⚡ Trade' },
              { action: 'view_chart', title: '📊 Chart' }
            ]
          }, 'price_alert');

          this.markNotificationSent(hash);
          this.lastPriceAlerts.set(key, now);
          alertsSent++;
          console.log(`🚨 Price alert sent for ${key}: ${hourlyChange.toFixed(2)}% in 1h (CoinGecko data only)`);
        }
      }

      // Summary log
      if (alertsChecked > 0 || alertsSent > 0) {
        console.log(`📊 [Price Alerts] Checked ${alertsChecked} assets, sent ${alertsSent} AI-enhanced alerts (threshold: ${this.PRICE_ALERT_THRESHOLD}%)`);
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

        // Concise, actionable format
        const title = `${impactEmoji} ${event.title.substring(0, 40)}`;
        const timeLabel = minutesUntil <= 60 ? `${minutesUntil}min` : `${Math.round(minutesUntil/60)}hr`;
        const body = `⏰ ${timeLabel} away\n\n⚠️ High-impact · Expect volatility`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `macro-${event.id || Date.now()}`,
          requireInteraction: true,
          actions: [
            { action: 'prepare', title: '🎯 Prepare' },
            { action: 'dismiss', title: '✓ OK' }
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
      
      if (cryptoData.length === 0) {
        console.log('⚠️ No crypto data available for evening recap');
        return;
      }
      
      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');
      
      // Calculate overall market performance
      const avgChange = cryptoData.reduce((sum, c) => sum + c.percentChange24h, 0) / cryptoData.length;
      
      // Sort to find best and worst performers
      const sorted = [...cryptoData].sort((a, b) => b.percentChange24h - a.percentChange24h);
      const bestPerformer = sorted[0];
      const worstPerformer = sorted[sorted.length - 1];

      // Market sentiment emoji
      const sentimentEmoji = avgChange > 2 ? '🟢' : avgChange < -2 ? '🔴' : '🟡';

      // Data-only notification body (no OpenAI)
      let body = '';
      if (btc) {
        body += `📊 BTC: $${btc.price.toLocaleString()} (${this.formatChange(btc.percentChange24h)})\n`;
      }
      if (eth) {
        body += `📊 ETH: $${eth.price.toLocaleString()} (${this.formatChange(eth.percentChange24h)})\n`;
      }
      
      body += `\n🏆 Best: ${bestPerformer.symbol} ${this.formatChange(bestPerformer.percentChange24h)}`;
      body += `\n📉 Worst: ${worstPerformer.symbol} ${this.formatChange(worstPerformer.percentChange24h)}`;
      body += `\n\n📈 Market Avg: ${this.formatChange(avgChange)}`;

      // Simple factual title
      const marketDirection = avgChange > 2 ? 'ended up' : avgChange < -2 ? 'ended down' : 'closed flat';
      const title = `${sentimentEmoji} Markets ${marketDirection} today`;

      // Check deduplication
      const hash = this.generateNotificationHash(title, body);
      if (this.isDuplicateNotification(hash)) {
        console.log('⚠️ Evening recap skipped - duplicate content');
        return;
      }

      await pushNotificationService.sendToAll({
        title,
        body,
        url: '/discover',
        tag: `evening-recap-${new Date().toDateString()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_summary', title: '📊 Details' },
          { action: 'set_alerts', title: '🔔 Alerts' }
        ]
      }, 'evening_recap');

      this.markNotificationSent(hash);
      console.log('✅ Evening recap sent (CoinGecko data only)');
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

      // Compact weekly preview
      let body = '';
      
      if (weekEvents.length > 0) {
        body += weekEvents.slice(0, 3).map(e => {
          const date = new Date(e.scheduledDate);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return `${dayName}: ${e.title.substring(0, 35)}`;
        }).join('\n');
      } else {
        body += 'No major events scheduled';
      }

      if (btc) {
        body += `\n\n₿ $${this.formatPrice(btc.price)} · 7d: ${this.formatChange(btc.percentChange7d || 0)}`;
      }

      await pushNotificationService.sendToAll({
        title: '📅 Week Ahead',
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
        
        // Clean, focused news format
        const title = `${emoji} ${article.title.substring(0, 55)}${article.title.length > 55 ? '...' : ''}`;
        const body = article.summary.substring(0, 100) + '...';
        
        await pushNotificationService.sendToAll({
          title,
          body,
          url: article.url,
          tag: `coindesk-${article.id}`,
          requireInteraction: false,
          actions: [
            { action: 'read_more', title: '📖 Read' },
            { action: 'dismiss', title: '✓ OK' }
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
      const [btcPositioning, ethPositioning, cryptoData] = await Promise.all([
        derivativesAnalyticsService.getFuturesPositioning('BTC'),
        derivativesAnalyticsService.getFuturesPositioning('ETH'),
        marketDataService.getCryptoQuotes(['BTC', 'ETH'])
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
        
        // Check cooldown (6 hours for funding rate alerts to reduce repetitive notifications)
        if (now - lastAlert < 6 * 60 * 60 * 1000) continue;

        const absRate = Math.abs(fundingRate);
        if (absRate >= this.FUNDING_RATE_EXTREME_THRESHOLD) {
          const crypto = cryptoData.find(c => c.symbol === symbol);
          const priceChange = crypto?.percentChange24h || 0;

          // Generate AI-powered signal insight
          const insight = await alphaInsightsEngine.generateTradingSignalInsight(
            symbol,
            'funding',
            { fundingRate, priceChange },
            { marketTrend: priceChange > 0 ? 'bullish' : 'bearish' }
          );

          const isLongsPaying = fundingRate > 0;
          const emoji = isLongsPaying ? '🔥' : '❄️';
          
          // AI-enhanced notification
          const title = `${emoji} ${symbol} Extreme Funding (${insight.signalStrength})`;
          const body = `💰 ${(fundingRate * 100).toFixed(2)}% (${isLongsPaying ? 'longs pay' : 'shorts pay'})\n\n🎯 ${insight.recommendation}\n\n⏱️ ${insight.timeframe} · ${insight.riskReward}`;
          
          await pushNotificationService.sendToAll({
            title,
            body,
            url: '/discover',
            tag: `funding-${symbol}`,
            requireInteraction: true,
            actions: [
              { action: 'view_details', title: '📊 Details' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          }, 'funding_rate_alerts');

          this.lastFundingRateAlerts.set(symbol, now);
          console.log(`💰 AI-enhanced funding rate alert sent for ${symbol}: ${(fundingRate * 100).toFixed(3)}%`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check funding rate alerts:', error);
    }
  }

  async checkLiquidationAlerts(): Promise<void> {
    try {
      const [btcLiquidations, ethLiquidations, cryptoData] = await Promise.all([
        derivativesAnalyticsService.getLiquidationData('BTC'),
        derivativesAnalyticsService.getLiquidationData('ETH'),
        marketDataService.getCryptoQuotes(['BTC', 'ETH'])
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
          const crypto = cryptoData.find(c => c.symbol === symbol);
          const priceChange = crypto?.percentChange24h || 0;

          // Generate AI-powered signal insight
          const insight = await alphaInsightsEngine.generateTradingSignalInsight(
            symbol,
            'liquidation',
            { liquidationVolume: totalLiquidations, priceChange },
            { marketTrend: priceChange > 0 ? 'bullish' : 'bearish' }
          );

          const isLongsRekt = data.liquidations24h.long > data.liquidations24h.short;
          const emoji = isLongsRekt ? '🔴' : '🟢';
          
          // AI-enhanced notification
          const title = `💥 ${symbol} Cascade (${insight.signalStrength})`;
          const body = `$${this.formatLargeNumber(totalLiquidations)} liquidated (${isLongsRekt ? 'longs rekt' : 'shorts rekt'})\n\n🎯 ${insight.recommendation}\n\n⏱️ ${insight.timeframe}`;
          
          await pushNotificationService.sendToAll({
            title,
            body,
            url: '/discover',
            tag: `liquidation-${symbol}`,
            requireInteraction: true,
            actions: [
              { action: 'view_heatmap', title: '🔥 View' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          }, 'liquidation_alerts');

          this.lastLiquidationAlerts.set(symbol, now);
          console.log(`💥 AI-enhanced liquidation alert sent for ${symbol}: $${this.formatLargeNumber(totalLiquidations)}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check liquidation alerts:', error);
    }
  }

  async checkWhaleAlerts(): Promise<void> {
    try {
      // Get smart money movements which include whale activity
      const [whaleActivity, cryptoData] = await Promise.all([
        institutionalFlowService.getSmartMoneyMovements(['BTC', 'ETH', 'SOL'], this.WHALE_ALERT_THRESHOLD),
        marketDataService.getCryptoQuotes(['BTC', 'ETH', 'SOL'])
      ]);
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

        const crypto = cryptoData.find(c => c.symbol === (whale.asset || 'BTC'));
        const priceChange = crypto?.percentChange24h || 0;

        // Generate AI-powered signal insight
        const insight = await alphaInsightsEngine.generateTradingSignalInsight(
          whale.asset || 'BTC',
          'whale',
          { whaleSize: whale.value, priceChange },
          { marketTrend: priceChange > 0 ? 'bullish' : 'bearish' }
        );

        const isBuying = whale.type === 'accumulation';
        const emoji = isBuying ? '🟢' : whale.type === 'distribution' ? '🔴' : '🐋';
        const action = isBuying ? 'Accumulating' : whale.type === 'distribution' ? 'Distributing' : 'Moving';
        
        // AI-enhanced whale notification
        const title = `🐋 ${whale.asset || 'Crypto'} Whale ${action} (${insight.signalStrength})`;
        const body = `$${this.formatLargeNumber(whale.value)} ${action.toLowerCase()}\n\n🎯 ${insight.recommendation}\n\n⏱️ ${insight.timeframe}`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `whale-${alertKey}`,
          requireInteraction: true,
          actions: [
            { action: 'track', title: '👁️ Track' },
            { action: 'trade', title: '⚡ Trade' }
          ]
        }, 'whale_alerts');

        this.lastWhaleAlerts.set(alertKey, now);
        console.log(`🐋 AI-enhanced whale alert sent: $${this.formatLargeNumber(whale.value)} ${whale.type}`);
      }
    } catch (error) {
      console.error('❌ Failed to check whale alerts:', error);
    }
  }

  // ============================================================================
  // HIGH-CONVICTION ALPHA SIGNALS
  // ============================================================================

  async checkAlphaSignals(): Promise<void> {
    try {
      const symbols = ['BTC', 'ETH', 'SOL'];
      const now = Date.now();

      // Gather all signals for confluence detection
      const [cryptoData, btcPositioning, ethPositioning, btcLiquidations, ethLiquidations] = await Promise.all([
        marketDataService.getCryptoQuotes(symbols),
        derivativesAnalyticsService.getFuturesPositioning('BTC'),
        derivativesAnalyticsService.getFuturesPositioning('ETH'),
        derivativesAnalyticsService.getLiquidationData('BTC'),
        derivativesAnalyticsService.getLiquidationData('ETH')
      ]);

      const signalData = [
        { 
          symbol: 'BTC', 
          crypto: cryptoData.find(c => c.symbol === 'BTC'),
          positioning: btcPositioning,
          liquidations: btcLiquidations
        },
        { 
          symbol: 'ETH', 
          crypto: cryptoData.find(c => c.symbol === 'ETH'),
          positioning: ethPositioning,
          liquidations: ethLiquidations
        }
      ];

      for (const { symbol, crypto, positioning, liquidations } of signalData) {
        if (!crypto) continue;

        // Check cooldown (4 hours for alpha signals)
        const lastAlert = this.lastAlphaSignals.get(symbol) || 0;
        if (now - lastAlert < 4 * 60 * 60 * 1000) continue;

        // Count confluence signals
        const signals: { type: string; direction: 'bullish' | 'bearish'; strength: number }[] = [];

        // 1. Price momentum signal
        if (Math.abs(crypto.percentChange24h) >= 5) {
          signals.push({
            type: 'momentum',
            direction: crypto.percentChange24h > 0 ? 'bullish' : 'bearish',
            strength: Math.min(Math.abs(crypto.percentChange24h) / 10, 1)
          });
        }

        // 2. Funding rate signal (contrarian)
        if (positioning && positioning.fundingRateHistory[0]) {
          const fundingRate = positioning.fundingRateHistory[0].rate;
          if (Math.abs(fundingRate) >= 0.01) { // 1%+ funding
            signals.push({
              type: 'funding',
              direction: fundingRate > 0 ? 'bearish' : 'bullish', // Contrarian
              strength: Math.min(Math.abs(fundingRate) / 0.05, 1)
            });
          }
        }

        // 3. Liquidation cascade signal (follow the cascade)
        if (liquidations) {
          const totalLiqs = liquidations.liquidations24h.totalNotional;
          if (totalLiqs >= 100_000_000) { // $100M+
            const longsRekt = liquidations.liquidations24h.long > liquidations.liquidations24h.short;
            signals.push({
              type: 'liquidation',
              direction: longsRekt ? 'bearish' : 'bullish',
              strength: Math.min(totalLiqs / 500_000_000, 1)
            });
          }
        }

        // 4. Volume surge signal
        if (crypto.volume24h && crypto.marketCap) {
          const volumeToMcap = crypto.volume24h / crypto.marketCap;
          if (volumeToMcap >= 0.1) { // Volume > 10% of market cap
            signals.push({
              type: 'volume',
              direction: crypto.percentChange24h > 0 ? 'bullish' : 'bearish',
              strength: Math.min(volumeToMcap / 0.2, 1)
            });
          }
        }

        // Need at least 3 signals aligned for high-conviction alert
        if (signals.length < 3) continue;

        // Calculate signal alignment
        const bullishCount = signals.filter(s => s.direction === 'bullish').length;
        const bearishCount = signals.filter(s => s.direction === 'bearish').length;
        const dominantDirection = bullishCount >= bearishCount ? 'bullish' : 'bearish';
        const alignedSignals = dominantDirection === 'bullish' ? bullishCount : bearishCount;

        // Only fire if 75%+ signals aligned
        if (alignedSignals / signals.length < 0.75) continue;

        // Generate AI-powered alpha signal
        const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
        const insight = await alphaInsightsEngine.generateAlphaSignal({
          symbol,
          direction: dominantDirection,
          signals: signals.map(s => s.type),
          priceChange: crypto.percentChange24h,
          fundingRate: positioning?.fundingRateHistory[0]?.rate || 0,
          liquidations: liquidations?.liquidations24h.totalNotional || 0,
          volumeSurge: (crypto.volume24h || 0) / (crypto.marketCap || 1)
        });

        const signalStrength = avgStrength > 0.7 ? 'HIGH' : avgStrength > 0.4 ? 'MEDIUM' : 'MODERATE';
        const emoji = dominantDirection === 'bullish' ? '🚀' : '📉';
        const directionText = dominantDirection === 'bullish' ? 'BULLISH' : 'BEARISH';

        const title = `${emoji} ALPHA: ${symbol} ${directionText} Confluence (${signalStrength})`;
        const body = `📊 ${signals.length} aligned signals detected\n\n🎯 ${insight.recommendation}\n\n⏱️ ${insight.timeframe}\n💰 ${insight.riskReward}`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/intelligence',
          tag: `alpha-${symbol}-${Date.now()}`,
          requireInteraction: true,
          actions: [
            { action: 'view_analysis', title: '📊 Analysis' },
            { action: 'trade_now', title: '⚡ Trade' }
          ]
        }, 'alpha_signals');

        this.lastAlphaSignals.set(symbol, now);
        console.log(`🎯 ALPHA SIGNAL sent for ${symbol}: ${directionText} with ${signals.length} signals`);
      }
    } catch (error) {
      console.error('❌ Failed to check alpha signals:', error);
    }
  }

  // ============================================================================
  // ALPHA INTELLIGENCE NOTIFICATION METHODS
  // ============================================================================

  async checkNarrativeMomentum(): Promise<void> {
    try {
      const narratives = await alphaIntelligenceService.getNarrativeMomentum();
      const now = Date.now();

      for (const narrative of narratives) {
        const previousMomentum = this.previousNarrativeMomentum.get(narrative.narrative) || narrative.momentum;
        const momentumChange = narrative.momentum - previousMomentum;
        
        // Update previous momentum
        this.previousNarrativeMomentum.set(narrative.narrative, narrative.momentum);

        // Check for significant momentum spike (rising trend + high change)
        if (narrative.trend === 'rising' && momentumChange >= this.NARRATIVE_SPIKE_THRESHOLD) {
          const lastAlert = this.lastNarrativeMomentum.get(narrative.narrative) || 0;
          if (now - lastAlert < 2 * 60 * 60 * 1000) continue; // 2hr cooldown

          const emoji = narrative.momentum > 80 ? '🔥' : '📈';
          const title = `${emoji} ${narrative.narrative} Narrative Surging`;
          const body = `Momentum: ${narrative.momentum}% (+${momentumChange.toFixed(0)}%)\nSocial Buzz: ${narrative.socialBuzz}%\n\nTop tokens: ${narrative.topTokens.slice(0, 3).join(', ')}\n\n${narrative.description}`;

          await pushNotificationService.sendToAll({
            title,
            body,
            url: '/discover',
            tag: `narrative-${narrative.narrative}`,
            requireInteraction: true,
            actions: [
              { action: 'view', title: '📊 View' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          }, 'narrative_momentum');

          this.lastNarrativeMomentum.set(narrative.narrative, now);
          console.log(`📈 Narrative alert: ${narrative.narrative} +${momentumChange.toFixed(0)}%`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check narrative momentum:', error);
    }
  }

  async checkCTAlphaSignals(): Promise<void> {
    try {
      const signals = await alphaIntelligenceService.getCTAlphaFeed();
      const now = Date.now();

      // Only push high-confidence signals
      const highConfidenceSignals = signals.filter(s => s.confidence >= this.CT_CONFIDENCE_THRESHOLD);

      for (const signal of highConfidenceSignals.slice(0, 2)) {
        const lastAlert = this.lastCTAlphaSignals.get(signal.id) || 0;
        if (now - lastAlert < 60 * 60 * 1000) continue; // 1hr cooldown per signal

        // Validate signal against live market data
        const validation = await notificationDataValidator.validateCTAlphaSignal({
          influencer: signal.influencer,
          token: signal.token,
          signal: signal.signal,
          sentiment: signal.sentiment,
          confidence: signal.confidence
        });

        // Log any market alignment warnings but don't block
        if (!validation.marketAlignment) {
          console.log(`⚠️ CT Signal alignment warning: ${validation.errors.join(', ')}`);
        }

        const sentimentEmoji = signal.sentiment === 'bullish' ? '🟢' : signal.sentiment === 'bearish' ? '🔴' : '🟡';
        const alignmentNote = validation.marketAlignment ? '' : ' ⚠️';
        const title = `🐦 CT Alpha: ${signal.influencer}${alignmentNote}`;
        
        // Include validated price if available
        const priceInfo = validation.tokenPrice 
          ? `\n💰 ${signal.token}: $${validation.tokenPrice.toLocaleString()}`
          : '';
        const body = `${sentimentEmoji} ${signal.signal}\n\n${signal.token ? `Token: ${signal.token}` : ''}${priceInfo}\nConfidence: ${signal.confidence}%\nEngagement: ${signal.engagement.toLocaleString()}`;

        await this.sendValidatedNotification(
          'ct_alpha_signal',
          {
            title,
            body,
            url: '/discover',
            tag: `ct-alpha-${signal.id}`,
            requireInteraction: true,
            actions: [
              { action: 'view', title: '👀 View' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          },
          'ct_alpha',
          signal.token ? [signal.token] : ['BTC', 'ETH']
        );

        this.lastCTAlphaSignals.set(signal.id, now);
        console.log(`🐦 CT Alpha alert: ${signal.influencer} - ${signal.sentiment} (validated: ${validation.isValid})`);
      }
    } catch (error) {
      console.error('❌ Failed to check CT alpha signals:', error);
    }
  }

  async checkTokenUnlocks(): Promise<void> {
    try {
      const unlocks = await alphaIntelligenceService.getTokenUnlocks();
      const now = Date.now();

      for (const unlock of unlocks) {
        const unlockTime = new Date(unlock.unlockDate).getTime();
        const hoursUntil = (unlockTime - now) / (60 * 60 * 1000);

        // Alert 24h and 1h before
        const shouldAlert24h = hoursUntil <= 24 && hoursUntil > 23;
        const shouldAlert1h = hoursUntil <= 1 && hoursUntil > 0;

        if (!shouldAlert24h && !shouldAlert1h) continue;

        const lastAlert = this.lastTokenUnlockAlerts.get(unlock.id) || 0;
        const cooldown = shouldAlert1h ? 30 * 60 * 1000 : 12 * 60 * 60 * 1000;
        if (now - lastAlert < cooldown) continue;

        const impactEmoji = unlock.priceImpact === 'high' ? '🔴' : unlock.priceImpact === 'medium' ? '🟡' : '🟢';
        const timeLabel = shouldAlert1h ? '⚠️ 1 HOUR' : '📅 24 HOURS';
        const title = `🔓 ${unlock.symbol} Unlock ${timeLabel}`;
        const body = `Amount: ${(unlock.amount / 1_000_000).toFixed(1)}M tokens\nValue: $${(unlock.valueUsd / 1_000_000).toFixed(1)}M (${unlock.percentOfSupply.toFixed(1)}% of supply)\n\n${impactEmoji} Impact: ${unlock.priceImpact.toUpperCase()}\n📉 Predicted move: ${unlock.predictedMove}%`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `unlock-${unlock.id}-${shouldAlert1h ? '1h' : '24h'}`,
          requireInteraction: true,
          actions: [
            { action: 'prepare', title: '🎯 Prepare' },
            { action: 'dismiss', title: '✓ OK' }
          ]
        }, 'token_unlock');

        this.lastTokenUnlockAlerts.set(unlock.id, now);
        console.log(`🔓 Token unlock alert: ${unlock.symbol} in ${hoursUntil.toFixed(0)}h`);
      }
    } catch (error) {
      console.error('❌ Failed to check token unlocks:', error);
    }
  }

  async checkAirdropOpportunities(): Promise<void> {
    try {
      const airdrops = await alphaIntelligenceService.getAirdropRadar();
      const now = Date.now();

      // Only alert on confirmed or high-value speculated airdrops
      const notableAirdrops = airdrops.filter(a => 
        a.status === 'confirmed' || (a.status === 'speculated' && a.difficulty !== 'hard')
      );

      if (notableAirdrops.length === 0) return;

      // Check daily cooldown
      const lastDailyAlert = this.lastAirdropAlerts.get('daily') || 0;
      if (now - lastDailyAlert < 23 * 60 * 60 * 1000) return;

      const confirmedCount = notableAirdrops.filter(a => a.status === 'confirmed').length;
      const title = `🎁 Airdrop Radar: ${notableAirdrops.length} Opportunities`;
      
      let body = '';
      for (const airdrop of notableAirdrops.slice(0, 3)) {
        const statusEmoji = airdrop.status === 'confirmed' ? '✅' : airdrop.status === 'ongoing' ? '🔄' : '🔮';
        body += `${statusEmoji} ${airdrop.project} (${airdrop.chain})\n   Est: ${airdrop.estimatedValue} · ${airdrop.difficulty}\n\n`;
      }

      await pushNotificationService.sendToAll({
        title,
        body: body.trim(),
        url: '/discover',
        tag: `airdrops-${new Date().toDateString()}`,
        requireInteraction: false,
        actions: [
          { action: 'view_all', title: '🎁 View All' },
          { action: 'dismiss', title: '✓ OK' }
        ]
      }, 'airdrop_radar');

      this.lastAirdropAlerts.set('daily', now);
      console.log(`🎁 Airdrop radar: ${notableAirdrops.length} opportunities pushed`);
    } catch (error) {
      console.error('❌ Failed to check airdrop opportunities:', error);
    }
  }

  async checkGovernanceAlerts(): Promise<void> {
    try {
      const proposals = await alphaIntelligenceService.getGovernancePulse();
      const now = Date.now();

      // Focus on active proposals with high price impact nearing deadline
      const criticalProposals = proposals.filter(p => {
        if (p.status !== 'active' || p.priceImpact !== 'high') return false;
        const deadline = new Date(p.deadline).getTime();
        const hoursLeft = (deadline - now) / (60 * 60 * 1000);
        return hoursLeft > 0 && hoursLeft <= 24; // Within 24 hours
      });

      for (const proposal of criticalProposals) {
        const lastAlert = this.lastGovernanceAlerts.get(proposal.id) || 0;
        if (now - lastAlert < 6 * 60 * 60 * 1000) continue; // 6hr cooldown

        const deadline = new Date(proposal.deadline);
        const hoursLeft = Math.round((deadline.getTime() - now) / (60 * 60 * 1000));
        const quorumReached = (proposal.votesFor + proposal.votesAgainst) >= proposal.quorum;
        const passing = proposal.votesFor > proposal.votesAgainst;

        const statusEmoji = passing ? '🟢' : '🔴';
        const title = `🗳️ Critical Vote: ${proposal.protocol}`;
        const body = `${proposal.title}\n\n${statusEmoji} ${passing ? 'Passing' : 'Failing'} · ${quorumReached ? '✅ Quorum reached' : '⚠️ Needs quorum'}\n⏰ ${hoursLeft}h remaining\n\n${proposal.summary}`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `governance-${proposal.id}`,
          requireInteraction: true,
          actions: [
            { action: 'vote', title: '🗳️ Vote' },
            { action: 'view', title: '👀 View' }
          ]
        }, 'governance');

        this.lastGovernanceAlerts.set(proposal.id, now);
        console.log(`🗳️ Governance alert: ${proposal.protocol} - ${hoursLeft}h left`);
      }
    } catch (error) {
      console.error('❌ Failed to check governance alerts:', error);
    }
  }

  async checkVCWalletActivity(): Promise<void> {
    try {
      const activities = await alphaIntelligenceService.getVCWalletActivity();
      const now = Date.now();

      // Focus on major moves
      const majorMoves = activities.filter(a => 
        a.significance === 'major' && a.valueUsd >= this.VC_WALLET_MIN_VALUE
      );

      for (const activity of majorMoves.slice(0, 2)) {
        const lastAlert = this.lastVCWalletAlerts.get(activity.id) || 0;
        if (now - lastAlert < 30 * 60 * 1000) continue; // 30min cooldown

        // Validate VC wallet activity against live prices
        const validation = await notificationDataValidator.validateVCWalletAlert({
          fund: activity.fund,
          action: activity.action,
          token: activity.token,
          amount: activity.amount,
          valueUsd: activity.valueUsd
        });

        // Log price validation errors but don't block
        if (!validation.isValid) {
          console.log(`⚠️ VC Wallet validation warning: ${validation.errors.join(', ')}`);
        }

        const actionEmoji = activity.action === 'buy' ? '🟢' : activity.action === 'sell' ? '🔴' : '↔️';
        const actionText = activity.action.toUpperCase();
        const title = `💼 ${activity.fund} ${actionText} Alert`;
        
        // Include current price if validated
        const priceInfo = validation.currentPrice 
          ? `\n📊 Current ${activity.token}: $${validation.currentPrice.toLocaleString()} (${validation.priceChange24h! >= 0 ? '+' : ''}${validation.priceChange24h?.toFixed(1)}%)`
          : '';
        const body = `${actionEmoji} ${activity.token}: $${this.formatLargeNumber(activity.valueUsd)}\n${activity.amount.toLocaleString()} tokens${priceInfo}\n\nTx: ${activity.txHash}`;

        await this.sendValidatedNotification(
          'vc_wallet_activity',
          {
            title,
            body,
            url: '/discover',
            tag: `vc-${activity.id}`,
            requireInteraction: true,
            actions: [
              { action: 'view_tx', title: '🔗 View' },
              { action: 'trade', title: '⚡ Trade' }
            ]
          },
          'vc_wallet',
          [activity.token]
        );

        this.lastVCWalletAlerts.set(activity.id, now);
        console.log(`💼 VC alert: ${activity.fund} ${activity.action} ${activity.token} (validated: ${validation.isValid})`);
      }
    } catch (error) {
      console.error('❌ Failed to check VC wallet activity:', error);
    }
  }

  async checkExchangeFlowAnomalies(): Promise<void> {
    try {
      const flows = await alphaIntelligenceService.getExchangeFlows();
      const now = Date.now();

      for (const flow of flows) {
        // Alert on significant net flows (accumulation or distribution)
        const netFlowAbs = Math.abs(flow.netFlow);
        if (netFlowAbs < 3000) continue; // Minimum 3000 BTC equivalent

        const lastAlert = this.lastExchangeFlowAlerts.get(flow.exchange) || 0;
        if (now - lastAlert < 2 * 60 * 60 * 1000) continue; // 2hr cooldown

        const trendEmoji = flow.trend === 'accumulation' ? '🟢' : flow.trend === 'distribution' ? '🔴' : '🟡';
        const flowDirection = flow.netFlow < 0 ? 'OUT' : 'IN';
        const title = `🏦 ${flow.exchange}: ${Math.abs(flow.netFlow).toLocaleString()} BTC ${flowDirection}`;
        const body = `${trendEmoji} Trend: ${flow.trend.toUpperCase()}\n\nInflow 24h: ${flow.inflow24h.toLocaleString()} BTC\nOutflow 24h: ${flow.outflow24h.toLocaleString()} BTC\n7d Change: ${flow.change7d > 0 ? '+' : ''}${flow.change7d.toFixed(1)}%`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `exchange-${flow.exchange}`,
          requireInteraction: true,
          actions: [
            { action: 'view', title: '📊 View' },
            { action: 'trade', title: '⚡ Trade' }
          ]
        }, 'exchange_flow');

        this.lastExchangeFlowAlerts.set(flow.exchange, now);
        console.log(`🏦 Exchange flow alert: ${flow.exchange} ${flow.trend}`);
      }
    } catch (error) {
      console.error('❌ Failed to check exchange flow anomalies:', error);
    }
  }

  async pushAITradeIdeas(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastAITradeIdeas < 3 * 60 * 60 * 1000) return; // 3hr cooldown

      const ideas = await alphaIntelligenceService.getAITradeIdeas();
      if (ideas.length === 0) return;

      const topIdea = ideas[0];
      
      // Validate trade idea against live market prices
      const validation = await notificationDataValidator.validateAndEnrichTradeIdea({
        asset: topIdea.asset,
        entry: topIdea.entry,
        target: topIdea.target,
        stopLoss: topIdea.stopLoss,
        direction: topIdea.direction,
        reasoning: topIdea.reasoning
      });

      // If entry is more than 5% off live price, block the notification
      if (!validation.isValid) {
        console.log(`⚠️ AI Trade Idea blocked: ${validation.errors.join(', ')}`);
        return;
      }

      const directionEmoji = topIdea.direction === 'long' ? '🟢' : '🔴';
      
      // Include live price comparison
      const livePriceInfo = validation.livePrice 
        ? `\n📊 Live: $${validation.livePrice.toLocaleString()} (${validation.priceDeviation! >= 0 ? '+' : ''}${validation.priceDeviation?.toFixed(1)}% from entry)`
        : '';
      const title = `💡 AI Trade Idea: ${topIdea.asset} ${topIdea.direction.toUpperCase()}`;
      const body = `${directionEmoji} Entry: $${topIdea.entry.toLocaleString()}${livePriceInfo}\n🎯 Target: $${topIdea.target.toLocaleString()}\n🛡️ Stop: $${topIdea.stopLoss.toLocaleString()}\n\nR:R ${topIdea.riskReward.toFixed(1)}:1 · Confidence: ${topIdea.confidence}%\n\n${topIdea.reasoning}`;

      await this.sendValidatedNotification(
        'ai_trade_idea',
        {
          title,
          body,
          url: '/discover',
          tag: `trade-idea-${topIdea.id}`,
          requireInteraction: true,
          actions: [
            { action: 'trade', title: '⚡ Trade' },
            { action: 'view_all', title: '📊 More' }
          ]
        },
        'ai_trade_idea',
        [topIdea.asset]
      );

      this.lastAITradeIdeas = now;
      console.log(`💡 AI trade idea pushed: ${topIdea.asset} ${topIdea.direction} (validated with live price $${validation.livePrice})`);
    } catch (error) {
      console.error('❌ Failed to push AI trade ideas:', error);
    }
  }

  async checkEventImpacts(): Promise<void> {
    try {
      const events = await alphaIntelligenceService.getEventImpactPredictions();
      const now = Date.now();

      for (const event of events) {
        const eventTime = new Date(event.date).getTime();
        const hoursUntil = (eventTime - now) / (60 * 60 * 1000);

        // Alert 24-48h before high-impact events
        if (hoursUntil < 24 || hoursUntil > 48) continue;
        if (Math.abs(event.predictedImpact) < 5) continue; // Only 5%+ predicted moves

        const lastAlert = this.lastEventImpactAlerts.get(event.id) || 0;
        if (now - lastAlert < 12 * 60 * 60 * 1000) continue; // 12hr cooldown

        const impactEmoji = event.predictedImpact > 0 ? '📈' : '📉';
        const title = `📅 Event Alert: ${event.event}`;
        const body = `⏰ ${Math.round(hoursUntil)}h away\n\n${impactEmoji} Predicted impact: ${event.predictedImpact > 0 ? '+' : ''}${event.predictedImpact}%\nConfidence: ${event.confidence}%\n\nAffected: ${event.affectedAssets.join(', ')}\n\n${event.analysis}`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `event-${event.id}`,
          requireInteraction: true,
          actions: [
            { action: 'prepare', title: '🎯 Prepare' },
            { action: 'view', title: '📊 Details' }
          ]
        }, 'event_impact');

        this.lastEventImpactAlerts.set(event.id, now);
        console.log(`📅 Event impact alert: ${event.event} in ${Math.round(hoursUntil)}h`);
      }
    } catch (error) {
      console.error('❌ Failed to check event impacts:', error);
    }
  }

  async checkMarketAnomalies(): Promise<void> {
    try {
      const anomalies = await alphaIntelligenceService.getAnomalies();
      const now = Date.now();

      // Only alert on critical and warning severity
      const significantAnomalies = anomalies.filter(a => 
        a.severity === 'critical' || a.severity === 'warning'
      );

      for (const anomaly of significantAnomalies.slice(0, 2)) {
        const lastAlert = this.lastAnomalyAlerts.get(anomaly.id) || 0;
        const cooldown = anomaly.severity === 'critical' ? 15 * 60 * 1000 : 60 * 60 * 1000;
        if (now - lastAlert < cooldown) continue;

        const severityEmoji = anomaly.severity === 'critical' ? '🚨' : '⚠️';
        const title = `${severityEmoji} Market Anomaly: ${anomaly.type}`;
        const body = `Asset: ${anomaly.asset}\n\n${anomaly.description}\n\n💡 ${anomaly.recommendation}`;

        // Use validated notification for anomalies to include live market context
        await this.sendValidatedNotification(
          'market_anomaly',
          {
            title,
            body,
            url: '/discover',
            tag: `anomaly-${anomaly.id}`,
            requireInteraction: anomaly.severity === 'critical',
            actions: [
              { action: 'view', title: '📊 Analyze' },
              { action: 'trade', title: '⚡ Act' }
            ]
          },
          'anomaly',
          [anomaly.asset]
        );

        this.lastAnomalyAlerts.set(anomaly.id, now);
        console.log(`${severityEmoji} Anomaly alert: ${anomaly.type} on ${anomaly.asset}`);
      }
    } catch (error) {
      console.error('❌ Failed to check market anomalies:', error);
    }
  }

  async sendConferenceReminders(): Promise<void> {
    try {
      const conferences = await alphaIntelligenceService.getCryptoConferences();
      const now = Date.now();

      // Get conferences in the next 2 weeks
      const upcomingConferences = conferences.filter(c => {
        const startDate = new Date(c.startDate).getTime();
        const daysUntil = (startDate - now) / (24 * 60 * 60 * 1000);
        return daysUntil > 0 && daysUntil <= 14;
      });

      if (upcomingConferences.length === 0) return;

      const title = `🎤 Crypto Conferences This Week`;
      let body = '';
      for (const conf of upcomingConferences.slice(0, 3)) {
        const startDate = new Date(conf.startDate);
        const tierEmoji = conf.tier === 'major' ? '⭐' : '📍';
        body += `${tierEmoji} ${conf.name}\n   ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${conf.location}\n   ${conf.relevantTokens.slice(0, 3).join(', ')}\n\n`;
      }

      await pushNotificationService.sendToAll({
        title,
        body: body.trim(),
        url: '/discover',
        tag: `conferences-weekly`,
        requireInteraction: false,
        actions: [
          { action: 'view_all', title: '📅 Calendar' },
          { action: 'dismiss', title: '✓ OK' }
        ]
      }, 'conference');

      console.log(`🎤 Conference reminders: ${upcomingConferences.length} upcoming`);
    } catch (error) {
      console.error('❌ Failed to send conference reminders:', error);
    }
  }

  async checkTechStockAlerts(): Promise<void> {
    try {
      const { gainers, losers } = await stockMarketService.getTechAiMovers();
      const now = Date.now();

      // Alert on big movers (threshold-based)
      const bigMovers = [...gainers, ...losers].filter(s => 
        Math.abs(s.changePercent) >= this.STOCK_MOVE_THRESHOLD
      );

      for (const stock of bigMovers.slice(0, 2)) {
        const lastAlert = this.lastStockAlerts.get(stock.symbol) || 0;
        if (now - lastAlert < 2 * 60 * 60 * 1000) continue; // 2hr cooldown

        const directionEmoji = stock.changePercent > 0 ? '🟢' : '🔴';
        const title = `📊 ${stock.symbol} ${stock.changePercent > 0 ? 'Surging' : 'Dropping'}`;
        const body = `${stock.name}\n\n${directionEmoji} ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(1)}%\n💵 $${stock.price.toFixed(2)}\n\nSector: ${stock.sector}`;

        await pushNotificationService.sendToAll({
          title,
          body,
          url: '/discover',
          tag: `stock-${stock.symbol}`,
          requireInteraction: false,
          actions: [
            { action: 'view', title: '📊 View' },
            { action: 'trade', title: '⚡ Trade' }
          ]
        }, 'tech_stock');

        this.lastStockAlerts.set(stock.symbol, now);
        console.log(`📊 Tech stock alert: ${stock.symbol} ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(1)}%`);
      }
    } catch (error) {
      console.error('❌ Failed to check tech stock alerts:', error);
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

  private formatChangeCompact(change: number): string {
    const emoji = change >= 2 ? '🟢' : change <= -2 ? '🔴' : '';
    const sign = change >= 0 ? '+' : '';
    return `${emoji}${sign}${change.toFixed(1)}%`;
  }

  private generateNotificationHash(title: string, body: string): string {
    return `${title}:${body}`.slice(0, 100);
  }

  private isDuplicateNotification(hash: string): boolean {
    const now = Date.now();
    this.cleanupExpiredHashes();
    const lastSent = this.sentNotificationHashes.get(hash);
    if (!lastSent) return false;
    return (now - lastSent) < this.NOTIFICATION_DEDUPE_TTL;
  }

  private markNotificationSent(hash: string): void {
    this.sentNotificationHashes.set(hash, Date.now());
  }

  private cleanupExpiredHashes(): void {
    const now = Date.now();
    for (const [hash, timestamp] of this.sentNotificationHashes.entries()) {
      if (now - timestamp > this.NOTIFICATION_DEDUPE_TTL) {
        this.sentNotificationHashes.delete(hash);
      }
    }
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
