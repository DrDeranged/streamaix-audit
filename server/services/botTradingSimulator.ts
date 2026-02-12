// NOTE: To start the bot trading simulator, import and call botTradingSimulator.start()
// from your server initialization code (e.g., server/index.ts or wherever services are started).
// Example: import { botTradingSimulator } from './services/botTradingSimulator'; botTradingSimulator.start();

import { db } from '../db';
import { aiAgents, botStakes, botSimTrades, botPerformanceSnapshots } from '@shared/schema';
import { eq, desc, sql, and, count, sum } from 'drizzle-orm';
import axios from 'axios';

const CRYPTO_ASSETS = [
  { symbol: 'bitcoin', name: 'BTC', type: 'crypto' },
  { symbol: 'ethereum', name: 'ETH', type: 'crypto' },
  { symbol: 'solana', name: 'SOL', type: 'crypto' },
  { symbol: 'cardano', name: 'ADA', type: 'crypto' },
  { symbol: 'avalanche-2', name: 'AVAX', type: 'crypto' },
  { symbol: 'chainlink', name: 'LINK', type: 'crypto' },
  { symbol: 'polkadot', name: 'DOT', type: 'crypto' },
  { symbol: 'dogecoin', name: 'DOGE', type: 'crypto' },
];

const STOCK_ASSETS = [
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'META', name: 'Meta', type: 'stock' },
  { symbol: 'AMD', name: 'AMD', type: 'stock' },
];

const STOCK_BASE_PRICES: Record<string, number> = {
  'NVDA': 875,
  'AAPL': 230,
  'TSLA': 250,
  'MSFT': 420,
  'GOOGL': 175,
  'AMZN': 200,
  'META': 550,
  'AMD': 165,
};

const ALL_ASSETS = [...CRYPTO_ASSETS, ...STOCK_ASSETS];

const STRATEGY_CONFIG: Record<string, { longBias: number; closeChance: number; positionMultiplier: number }> = {
  momentum: { longBias: 0.75, closeChance: 0.3, positionMultiplier: 1.5 },
  contrarian: { longBias: 0.4, closeChance: 0.4, positionMultiplier: 1.0 },
  'swing-trader': { longBias: 0.55, closeChance: 0.35, positionMultiplier: 1.2 },
  scalper: { longBias: 0.5, closeChance: 0.6, positionMultiplier: 0.6 },
  conservative: { longBias: 0.45, closeChance: 0.25, positionMultiplier: 0.7 },
  aggressive: { longBias: 0.7, closeChance: 0.5, positionMultiplier: 2.0 },
  hodler: { longBias: 0.85, closeChance: 0.1, positionMultiplier: 1.5 },
  'day-trader': { longBias: 0.55, closeChance: 0.55, positionMultiplier: 1.3 },
  quantitative: { longBias: 0.52, closeChance: 0.35, positionMultiplier: 1.1 },
  arbitrage: { longBias: 0.5, closeChance: 0.45, positionMultiplier: 0.8 },
};

const RISK_MULTIPLIER: Record<string, number> = {
  low: 0.5,
  medium: 1.0,
  high: 2.0,
};

const MOMENTUM_LONG_REASONS = [
  '{asset} showing bullish momentum above 50-day MA, entering long',
  '{asset} breaking resistance with strong volume, momentum long',
  '{asset} golden cross confirmed, strong uptrend signal',
  '{asset} institutional accumulation detected, riding momentum',
  '{asset} RSI trending up from oversold, momentum entry',
];

const MOMENTUM_SHORT_REASONS = [
  '{asset} bearish divergence on MACD, entering short',
  '{asset} death cross forming, downtrend momentum short',
  '{asset} breaking key support with volume, momentum short',
];

const CONTRARIAN_LONG_REASONS = [
  '{asset} oversold on RSI, contrarian long entry',
  '{asset} at major support with extreme fear, buying the dip',
  '{asset} capitulation volume detected, contrarian buy',
  '{asset} sentiment at extreme low, mean reversion play',
];

const CONTRARIAN_SHORT_REASONS = [
  '{asset} overbought on RSI, taking contrarian short',
  '{asset} at extreme greed levels, fading the rally',
  '{asset} parabolic move unsustainable, contrarian short',
];

const SWING_LONG_REASONS = [
  '{asset} bouncing off trendline support, swing long',
  '{asset} forming higher low pattern, swing entry',
  '{asset} consolidation breakout setup, entering long swing',
];

const SWING_SHORT_REASONS = [
  '{asset} rejected at resistance zone, swing short entry',
  '{asset} lower high formation confirmed, swing short',
  '{asset} bearish engulfing at key level, short swing',
];

const SCALP_LONG_REASONS = [
  '{asset} 5-min chart bullish setup, quick scalp long',
  '{asset} bid-ask spread tightening, scalp entry long',
  '{asset} microstructure bullish, short-term scalp',
];

const SCALP_SHORT_REASONS = [
  '{asset} 5-min chart rejection, quick scalp short',
  '{asset} order book imbalance favoring sellers, scalp short',
  '{asset} micro resistance hit, scalp short entry',
];

const CONSERVATIVE_LONG_REASONS = [
  '{asset} fundamentals strong with low volatility, conservative long',
  '{asset} stable uptrend with solid support, value entry',
  '{asset} risk-adjusted return favorable, measured long position',
  '{asset} blue-chip holding at discount, conservative accumulation',
];

const CONSERVATIVE_SHORT_REASONS = [
  '{asset} showing deteriorating fundamentals, protective short hedge',
  '{asset} overvalued relative to peers, conservative short position',
  '{asset} risk management dictates reducing exposure, hedge short',
];

const AGGRESSIVE_LONG_REASONS = [
  '{asset} breakout with massive volume, aggressive leveraged long',
  '{asset} parabolic setup forming, full-size long entry',
  '{asset} high-conviction bullish catalyst, maximum position long',
  '{asset} volatility squeeze about to pop upward, aggressive entry',
];

const AGGRESSIVE_SHORT_REASONS = [
  '{asset} breakdown confirmed, aggressive short with leverage',
  '{asset} bearish catalyst imminent, full-size short position',
  '{asset} distribution pattern complete, maximum conviction short',
];

const HODLER_LONG_REASONS = [
  '{asset} long-term thesis intact, adding to core position',
  '{asset} accumulating on dip for long-term hold',
  '{asset} fundamental value play, buy and hold strategy',
  '{asset} dollar-cost averaging into position, patient accumulation',
  '{asset} generational buying opportunity, building long-term stack',
];

const HODLER_SHORT_REASONS = [
  '{asset} trimming position at extreme overbought levels',
  '{asset} rebalancing portfolio, taking partial profits on rally',
];

const DAYTRADER_LONG_REASONS = [
  '{asset} intraday bullish pattern, day trade long',
  '{asset} opening range breakout confirmed, quick long entry',
  '{asset} VWAP reclaim with momentum, day trade long',
  '{asset} pre-market gap up holding, intraday long play',
];

const DAYTRADER_SHORT_REASONS = [
  '{asset} intraday breakdown below support, day trade short',
  '{asset} failed breakout, quick reversal short entry',
  '{asset} below VWAP with selling pressure, day trade short',
];

const QUANTITATIVE_LONG_REASONS = [
  '{asset} statistical model signals long, z-score favorable',
  '{asset} mean reversion model triggered buy signal',
  '{asset} multi-factor model consensus: long with 72% confidence',
  '{asset} regression analysis indicates undervalued, quantitative long',
];

const QUANTITATIVE_SHORT_REASONS = [
  '{asset} quantitative model short signal, 2 sigma deviation',
  '{asset} statistical arbitrage opportunity, paired short',
  '{asset} factor model indicates overvalued, systematic short',
];

const ARBITRAGE_LONG_REASONS = [
  '{asset} price dislocation detected, arbitrage long leg',
  '{asset} cross-exchange spread favorable, buying the discount',
  '{asset} basis trade opportunity, long spot position',
  '{asset} triangular arbitrage setup, entering long leg',
];

const ARBITRAGE_SHORT_REASONS = [
  '{asset} premium detected on this venue, arbitrage short leg',
  '{asset} futures-spot spread wide, selling the premium',
  '{asset} cross-market inefficiency, short leg of arb pair',
];

const CLOSE_REASONS = [
  'Target reached, taking profit on {asset}',
  'Stop loss triggered on {asset}, managing risk',
  'Trailing stop hit on {asset}, locking gains',
  'Time-based exit on {asset}, rebalancing portfolio',
  'Volatility spike on {asset}, reducing exposure',
];

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const DELAY_BETWEEN_API_CALLS_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class BotTradingSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private lastSnapshotDate: Map<string, string> = new Map();

  async start() {
    if (process.env.QUIET_MODE === 'true') {
      console.log('[Bot Simulator] QUIET_MODE enabled, not starting');
      return;
    }

    console.log('[Bot Simulator] Starting bot trading simulator (2-hour cycle)');
    console.log('[Bot Simulator] First cycle will run in 60 seconds...');

    setTimeout(async () => {
      try {
        await this.runTradingCycle();
      } catch (err) {
        console.error('[Bot Simulator] Error in initial cycle:', err);
      }
    }, 60_000);

    this.intervalId = setInterval(async () => {
      try {
        await this.runTradingCycle();
      } catch (err) {
        console.error('[Bot Simulator] Error in trading cycle:', err);
      }
    }, TWO_HOURS_MS);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Bot Simulator] Stopped');
    }
  }

  async runTradingCycle() {
    if (process.env.QUIET_MODE === 'true') return;

    const startTime = Date.now();
    console.log('[Bot Simulator] === Starting trading cycle ===');

    try {
      const allBots = await this.getAllActiveBots();

      if (allBots.length === 0) {
        console.log('[Bot Simulator] No active bots found, skipping cycle');
        return;
      }

      console.log(`[Bot Simulator] Processing ${allBots.length} active bots`);

      for (const { agent, totalStaked } of allBots) {
        try {
          await this.processBot(agent, totalStaked);
        } catch (err) {
          console.error(`[Bot Simulator] Error processing bot ${agent.name}:`, err);
        }
      }

      await this.updateStakes();

      const today = new Date().toISOString().split('T')[0];
      for (const { agent } of allBots) {
        const lastSnapshot = this.lastSnapshotDate.get(agent.id);
        if (lastSnapshot !== today) {
          try {
            await this.takePerformanceSnapshot(agent.id);
            this.lastSnapshotDate.set(agent.id, today);
          } catch (err) {
            console.error(`[Bot Simulator] Error taking snapshot for ${agent.name}:`, err);
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Bot Simulator] === Cycle completed in ${elapsed}s ===`);
    } catch (err) {
      console.error('[Bot Simulator] Fatal error in trading cycle:', err);
    }
  }

  private async getAllActiveBots(): Promise<Array<{ agent: any; totalStaked: number }>> {
    const agents = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.isActive, true));

    const stakesResult = await db
      .select({
        agentId: botStakes.agentId,
        totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)::int`,
      })
      .from(botStakes)
      .where(eq(botStakes.status, 'active'))
      .groupBy(botStakes.agentId);

    const stakeMap = new Map<string, number>();
    for (const stake of stakesResult) {
      stakeMap.set(stake.agentId, Number(stake.totalStaked));
    }

    return agents.map(agent => ({
      agent,
      totalStaked: stakeMap.get(agent.id) || 0,
    }));
  }

  private async processBot(agent: any, totalStaked: number) {
    console.log(`[Bot Simulator] Processing bot: ${agent.name} (personality: ${agent.personality}, risk: ${agent.riskTolerance})`);

    const openTrades = await db
      .select()
      .from(botSimTrades)
      .where(and(
        eq(botSimTrades.agentId, agent.id),
        eq(botSimTrades.status, 'open')
      ));

    const strategyConfig = STRATEGY_CONFIG[agent.personality] || STRATEGY_CONFIG['swing-trader'];
    const closeChance = strategyConfig.closeChance;

    for (const trade of openTrades) {
      if (Math.random() < (agent.personality === 'scalper' ? 0.6 : closeChance)) {
        try {
          await this.closeTrade(trade);
          await delay(DELAY_BETWEEN_API_CALLS_MS);
        } catch (err) {
          console.error(`[Bot Simulator] Error closing trade ${trade.id}:`, err);
        }
      }
    }

    if (Math.random() < 0.6) {
      const asset = pickRandom(ALL_ASSETS);
      try {
        await this.openTrade(agent, asset);
      } catch (err) {
        console.error(`[Bot Simulator] Error opening trade for ${agent.name}:`, err);
      }
    }
  }

  private async openTrade(agent: any, asset: { symbol: string; name: string; type: string }) {
    let price: number | null = null;

    if (asset.type === 'crypto') {
      price = await this.fetchCryptoPrice(asset.symbol);
    } else {
      price = await this.simulateStockPrice(asset.symbol);
    }

    if (!price || price <= 0) {
      console.log(`[Bot Simulator] Could not fetch price for ${asset.name}, skipping`);
      return;
    }

    const strategyConfig = STRATEGY_CONFIG[agent.personality] || STRATEGY_CONFIG['swing-trader'];
    const riskMult = RISK_MULTIPLIER[agent.riskTolerance] || 1.0;

    const direction = Math.random() < strategyConfig.longBias ? 'long' : 'short';

    let baseQuantity: number;
    if (asset.type === 'crypto') {
      baseQuantity = (1000 / price) * strategyConfig.positionMultiplier * riskMult;
    } else {
      baseQuantity = Math.max(1, Math.round(10 * strategyConfig.positionMultiplier * riskMult));
    }

    const quantity = Math.max(0.0001, baseQuantity);
    const reasoning = this.generateReasoning(asset.name, direction, agent.personality);

    await db.insert(botSimTrades).values({
      agentId: agent.id,
      asset: asset.name,
      assetType: asset.type,
      direction,
      entryPrice: price,
      quantity,
      status: 'open',
      reasoning,
    });

    console.log(`[Bot Simulator] ${agent.name} opened ${direction} ${asset.name} @ $${price.toFixed(2)} qty: ${quantity.toFixed(4)}`);
  }

  private async closeTrade(trade: any) {
    let currentPrice: number | null = null;

    if (trade.assetType === 'crypto') {
      const cryptoAsset = CRYPTO_ASSETS.find(a => a.name === trade.asset);
      if (cryptoAsset) {
        currentPrice = await this.fetchCryptoPrice(cryptoAsset.symbol);
      }
    } else {
      const stockAsset = STOCK_ASSETS.find(a => a.name === trade.asset);
      if (stockAsset) {
        currentPrice = await this.simulateStockPrice(stockAsset.symbol);
      }
    }

    if (!currentPrice || currentPrice <= 0) {
      console.log(`[Bot Simulator] Could not fetch close price for ${trade.asset}, skipping close`);
      return;
    }

    let pnl: number;
    if (trade.direction === 'long') {
      pnl = (currentPrice - trade.entryPrice) * trade.quantity;
    } else {
      pnl = (trade.entryPrice - currentPrice) * trade.quantity;
    }

    const pnlPercent = ((pnl / (trade.entryPrice * trade.quantity)) * 100);

    const closeReason = pickRandom(CLOSE_REASONS).replace('{asset}', trade.asset);

    await db
      .update(botSimTrades)
      .set({
        exitPrice: currentPrice,
        pnl,
        pnlPercent,
        status: 'closed',
        closedAt: new Date(),
        reasoning: `${trade.reasoning} | Close: ${closeReason}`,
      })
      .where(eq(botSimTrades.id, trade.id));

    console.log(`[Bot Simulator] Closed ${trade.direction} ${trade.asset}: P&L $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
  }

  private async fetchCryptoPrice(coingeckoId: string): Promise<number | null> {
    try {
      const apiKey = process.env.COINGECKO_PRO_API_KEY;
      const headers: Record<string, string> = {};
      let baseUrl = 'https://api.coingecko.com/api/v3';

      if (apiKey) {
        headers['x-cg-pro-api-key'] = apiKey;
        baseUrl = 'https://pro-api.coingecko.com/api/v3';
      }

      const response = await axios.get(`${baseUrl}/simple/price`, {
        params: { ids: coingeckoId, vs_currencies: 'usd' },
        headers,
        timeout: 10000,
      });

      const price = response.data?.[coingeckoId]?.usd;
      return price || null;
    } catch (err: any) {
      console.error(`[Bot Simulator] CoinGecko price fetch failed for ${coingeckoId}:`, err.message);
      return null;
    }
  }

  private async simulateStockPrice(symbol: string): Promise<number | null> {
    const basePrice = STOCK_BASE_PRICES[symbol];
    if (!basePrice) return null;

    const randomWalk = (Math.random() - 0.48) * 0.06;
    const price = basePrice * (1 + randomWalk);
    return Math.round(price * 100) / 100;
  }

  private async updateStakes() {
    try {
      const agentPnls = await db
        .select({
          agentId: botSimTrades.agentId,
          totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)`,
        })
        .from(botSimTrades)
        .where(eq(botSimTrades.status, 'closed'))
        .groupBy(botSimTrades.agentId);

      const pnlMap = new Map<string, number>();
      for (const row of agentPnls) {
        pnlMap.set(row.agentId, Number(row.totalPnl));
      }

      const agentTotals = await db
        .select({
          agentId: botStakes.agentId,
          totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)`,
        })
        .from(botStakes)
        .where(eq(botStakes.status, 'active'))
        .groupBy(botStakes.agentId);

      const totalStakedMap = new Map<string, number>();
      for (const row of agentTotals) {
        totalStakedMap.set(row.agentId, Number(row.totalStaked));
      }

      const activeStakes = await db
        .select()
        .from(botStakes)
        .where(eq(botStakes.status, 'active'));

      for (const stake of activeStakes) {
        const totalBotPnl = pnlMap.get(stake.agentId) || 0;
        const totalStakedOnBot = totalStakedMap.get(stake.agentId) || stake.amount;

        if (totalStakedOnBot === 0) continue;

        const stakePnl = (totalBotPnl / totalStakedOnBot) * stake.amount;
        const currentValue = stake.amount + Math.round(stakePnl);
        const pnlPercent = (stakePnl / stake.amount) * 100;

        await db
          .update(botStakes)
          .set({
            totalPnl: Math.round(stakePnl),
            currentValue,
            totalPnlPercent: Math.round(pnlPercent * 100) / 100,
            updatedAt: new Date(),
          })
          .where(eq(botStakes.id, stake.id));
      }

      console.log(`[Bot Simulator] Updated ${activeStakes.length} active stakes`);
    } catch (err) {
      console.error('[Bot Simulator] Error updating stakes:', err);
    }
  }

  private async takePerformanceSnapshot(agentId: string) {
    try {
      const closedTrades = await db
        .select({
          totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)`,
          totalTrades: sql<number>`COUNT(*)::int`,
          wins: sql<number>`COUNT(*) FILTER (WHERE ${botSimTrades.pnl} > 0)::int`,
        })
        .from(botSimTrades)
        .where(and(
          eq(botSimTrades.agentId, agentId),
          eq(botSimTrades.status, 'closed')
        ));

      const stats = closedTrades[0] || { totalPnl: 0, totalTrades: 0, wins: 0 };
      const totalPnl = Number(stats.totalPnl);
      const totalTrades = Number(stats.totalTrades);
      const wins = Number(stats.wins);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      const totalStaked = await db
        .select({
          total: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)`,
        })
        .from(botStakes)
        .where(and(
          eq(botStakes.agentId, agentId),
          eq(botStakes.status, 'active')
        ));

      const stakedAmount = Number(totalStaked[0]?.total || 0);
      const totalValue = stakedAmount + totalPnl;
      const cumulativeRoi = stakedAmount > 0 ? (totalPnl / stakedAmount) * 100 : 0;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const prevSnapshots = await db
        .select()
        .from(botPerformanceSnapshots)
        .where(eq(botPerformanceSnapshots.agentId, agentId))
        .orderBy(desc(botPerformanceSnapshots.snapshotDate))
        .limit(1);

      const prevValue = prevSnapshots[0] ? Number(prevSnapshots[0].totalValue) : stakedAmount;
      const dailyPnl = totalValue - prevValue;
      const dailyPnlPercent = prevValue > 0 ? (dailyPnl / prevValue) * 100 : 0;

      await db.insert(botPerformanceSnapshots).values({
        agentId,
        totalValue,
        dailyPnl,
        dailyPnlPercent: Math.round(dailyPnlPercent * 100) / 100,
        cumulativeRoi: Math.round(cumulativeRoi * 100) / 100,
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        snapshotDate: new Date(),
      });

      console.log(`[Bot Simulator] Snapshot for agent ${agentId}: value=$${totalValue.toFixed(2)}, ROI=${cumulativeRoi.toFixed(2)}%`);
    } catch (err) {
      console.error(`[Bot Simulator] Error taking snapshot for ${agentId}:`, err);
    }
  }

  private generateReasoning(assetName: string, direction: string, personality: string): string {
    let reasons: string[];

    switch (personality) {
      case 'momentum':
        reasons = direction === 'long' ? MOMENTUM_LONG_REASONS : MOMENTUM_SHORT_REASONS;
        break;
      case 'contrarian':
        reasons = direction === 'long' ? CONTRARIAN_LONG_REASONS : CONTRARIAN_SHORT_REASONS;
        break;
      case 'swing-trader':
        reasons = direction === 'long' ? SWING_LONG_REASONS : SWING_SHORT_REASONS;
        break;
      case 'scalper':
        reasons = direction === 'long' ? SCALP_LONG_REASONS : SCALP_SHORT_REASONS;
        break;
      case 'conservative':
        reasons = direction === 'long' ? CONSERVATIVE_LONG_REASONS : CONSERVATIVE_SHORT_REASONS;
        break;
      case 'aggressive':
        reasons = direction === 'long' ? AGGRESSIVE_LONG_REASONS : AGGRESSIVE_SHORT_REASONS;
        break;
      case 'hodler':
        reasons = direction === 'long' ? HODLER_LONG_REASONS : HODLER_SHORT_REASONS;
        break;
      case 'day-trader':
        reasons = direction === 'long' ? DAYTRADER_LONG_REASONS : DAYTRADER_SHORT_REASONS;
        break;
      case 'quantitative':
        reasons = direction === 'long' ? QUANTITATIVE_LONG_REASONS : QUANTITATIVE_SHORT_REASONS;
        break;
      case 'arbitrage':
        reasons = direction === 'long' ? ARBITRAGE_LONG_REASONS : ARBITRAGE_SHORT_REASONS;
        break;
      default:
        reasons = direction === 'long' ? SWING_LONG_REASONS : SWING_SHORT_REASONS;
    }

    return pickRandom(reasons).replace('{asset}', assetName);
  }
}

export const botTradingSimulator = new BotTradingSimulator();
