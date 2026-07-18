import { db } from '../db';
import { jobScheduler } from '../jobs/scheduler';
import { knowledgeAvatars, botStakes, botSimTrades, botPerformanceSnapshots, users } from '@shared/schema';
import { eq, desc, sql, and, isNotNull } from 'drizzle-orm';
import { getAvatarPersona, getAllAvatarHandles, type AvatarTradingPersona } from './avatarTradingPersonas';
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
  { symbol: 'ripple', name: 'XRP', type: 'crypto' },
  { symbol: 'uniswap', name: 'UNI', type: 'crypto' },
  { symbol: 'aave', name: 'AAVE', type: 'crypto' },
  { symbol: 'tron', name: 'TRX', type: 'crypto' },
  { symbol: 'matic-network', name: 'MATIC', type: 'crypto' },
  { symbol: 'fantom', name: 'FTM', type: 'crypto' },
  { symbol: 'yearn-finance', name: 'YFI', type: 'crypto' },
  { symbol: 'compound-governance-token', name: 'COMP', type: 'crypto' },
  { symbol: 'synthetix-network-token', name: 'SNX', type: 'crypto' },
  { symbol: 'maker', name: 'MKR', type: 'crypto' },
  { symbol: 'curve-dao-token', name: 'CRV', type: 'crypto' },
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

const STOCK_FALLBACK_PRICES: Record<string, number> = {
  'NVDA': 185,
  'AAPL': 278,
  'TSLA': 411,
  'MSFT': 445,
  'GOOGL': 195,
  'AMZN': 235,
  'META': 620,
  'AMD': 120,
};

const CRYPTO_FALLBACK_PRICES: Record<string, number> = {
  'BTC': 92000,
  'ETH': 2500,
  'SOL': 140,
  'ADA': 0.75,
  'AVAX': 35,
  'LINK': 18,
  'DOT': 7,
  'DOGE': 0.15,
  'XRP': 2.5,
  'UNI': 10,
  'AAVE': 250,
  'TRX': 0.24,
  'MATIC': 0.35,
  'FTM': 0.6,
  'YFI': 8500,
  'COMP': 55,
  'SNX': 1.5,
  'MKR': 1600,
  'CRV': 0.55,
};

const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const PRICE_CACHE_TTL_MS = 10 * 60 * 1000;

const COINGECKO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'XRP': 'ripple',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'TRX': 'tron',
  'MATIC': 'matic-network',
  'FTM': 'fantom',
  'YFI': 'yearn-finance',
  'COMP': 'compound-governance-token',
  'SNX': 'synthetix-network-token',
  'MKR': 'maker',
  'CRV': 'curve-dao-token',
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const DELAY_BETWEEN_API_CALLS_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeightedAsset(assets: AvatarTradingPersona['preferredAssets']): AvatarTradingPersona['preferredAssets'][0] {
  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const asset of assets) {
    roll -= asset.weight;
    if (roll <= 0) return asset;
  }
  return assets[assets.length - 1];
}

function getCoingeckoId(symbol: string): string | null {
  if (COINGECKO_ID_MAP[symbol]) return COINGECKO_ID_MAP[symbol];
  const found = CRYPTO_ASSETS.find(a => a.name === symbol || a.symbol === symbol);
  return found ? found.symbol : null;
}

export class BotTradingSimulator {
  private lastSnapshotDate: Map<string, string> = new Map();

  async start() {
    if (process.env.QUIET_MODE === 'true') {
      console.log('[Bot Simulator] QUIET_MODE enabled, not starting');
      return;
    }

    console.log('[Bot Simulator] Starting bot trading simulator (2-hour cycle)');
    console.log('[Bot Simulator] First cycle will run in 60 seconds...');

    jobScheduler.register('bot-trading-simulator', TWO_HOURS_MS, () => this.runTradingCycle(), {
      runOnStart: true,
      staggerMs: 60_000,
    });
  }

  async stop() {
    jobScheduler.cancel('bot-trading-simulator');
    console.log('[Bot Simulator] Stopped');
  }

  async runTradingCycle() {
    if (process.env.QUIET_MODE === 'true') return;

    const startTime = Date.now();
    console.log('[Bot Simulator] === Starting trading cycle ===');

    try {
      const allAvatars = await this.getAllActiveAvatars();

      if (allAvatars.length === 0) {
        console.log('[Bot Simulator] No active avatars found, skipping cycle');
        return;
      }

      console.log(`[Bot Simulator] Processing ${allAvatars.length} active avatars`);

      for (const { avatar, persona, totalStaked } of allAvatars) {
        try {
          await this.processAvatar(avatar, persona, totalStaked);
        } catch (err) {
          console.error(`[Bot Simulator] Error processing avatar ${avatar.name}:`, err);
        }
      }

      await this.updateStakes();

      const today = new Date().toISOString().split('T')[0];
      for (const { avatar } of allAvatars) {
        const lastSnapshot = this.lastSnapshotDate.get(avatar.id);
        if (lastSnapshot !== today) {
          try {
            await this.takePerformanceSnapshot(avatar.id);
            this.lastSnapshotDate.set(avatar.id, today);
          } catch (err) {
            console.error(`[Bot Simulator] Error taking snapshot for ${avatar.name}:`, err);
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Bot Simulator] === Cycle completed in ${elapsed}s ===`);
    } catch (err) {
      console.error('[Bot Simulator] Fatal error in trading cycle:', err);
    }
  }

  private async getAllActiveAvatars(): Promise<Array<{ avatar: any; persona: AvatarTradingPersona; totalStaked: number }>> {
    const avatars = await db
      .select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true));

    const stakesResult = await db
      .select({
        avatarId: botStakes.avatarId,
        totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)::int`,
      })
      .from(botStakes)
      .where(eq(botStakes.status, 'active'))
      .groupBy(botStakes.avatarId);

    const stakeMap = new Map<string, number>();
    for (const stake of stakesResult) {
      if (stake.avatarId) stakeMap.set(stake.avatarId, Number(stake.totalStaked));
    }

    const results: Array<{ avatar: any; persona: AvatarTradingPersona; totalStaked: number }> = [];

    for (const avatar of avatars) {
      const persona = getAvatarPersona(avatar.handle);
      if (!persona) continue;

      results.push({
        avatar,
        persona,
        totalStaked: stakeMap.get(avatar.id) || 0,
      });
    }

    return results;
  }

  private async processAvatar(avatar: any, persona: AvatarTradingPersona, totalStaked: number) {
    console.log(`[Bot Simulator] Processing avatar: ${avatar.name} (style: ${persona.tradingStyle}, risk: ${persona.riskTolerance})`);

    const openTrades = await db
      .select()
      .from(botSimTrades)
      .where(and(
        eq(botSimTrades.avatarId, avatar.id),
        eq(botSimTrades.status, 'open')
      ));

    for (const trade of openTrades) {
      if (Math.random() < persona.closeChance) {
        try {
          await this.closeTrade(trade, persona);
          await delay(DELAY_BETWEEN_API_CALLS_MS);
        } catch (err) {
          console.error(`[Bot Simulator] Error closing trade ${trade.id}:`, err);
        }
      }
    }

    if (Math.random() < persona.tradeFrequency) {
      const selectedAsset = pickWeightedAsset(persona.preferredAssets);
      try {
        await this.openTrade(avatar, persona, selectedAsset);
      } catch (err) {
        console.error(`[Bot Simulator] Error opening trade for ${avatar.name}:`, err);
      }
    }
  }

  private async openTrade(avatar: any, persona: AvatarTradingPersona, asset: { symbol: string; name: string; type: 'crypto' | 'stock'; weight: number }) {
    let price: number | null = null;

    if (asset.type === 'crypto') {
      const coingeckoId = getCoingeckoId(asset.symbol) || asset.symbol;
      price = await this.fetchCryptoPrice(coingeckoId);
    } else {
      price = await this.fetchStockPrice(asset.symbol);
    }

    if (!price || price <= 0) {
      console.log(`[Bot Simulator] Could not fetch price for ${asset.name}, skipping`);
      return;
    }

    const riskMult = persona.riskTolerance === 'high' ? 2.0 : persona.riskTolerance === 'medium' ? 1.0 : 0.5;
    const direction = Math.random() < persona.longBias ? 'long' : 'short';

    let baseQuantity: number;
    if (asset.type === 'crypto') {
      baseQuantity = (1000 / price) * persona.positionMultiplier * riskMult;
    } else {
      baseQuantity = Math.max(1, Math.round(10 * persona.positionMultiplier * riskMult));
    }

    const quantity = Math.max(0.0001, baseQuantity);
    const reasons = direction === 'long' ? persona.longReasons : persona.shortReasons;
    const reasoning = pickRandom(reasons).replace('{asset}', asset.name);

    await db.insert(botSimTrades).values({
      avatarId: avatar.id,
      asset: asset.name,
      assetType: asset.type,
      direction,
      entryPrice: price,
      quantity,
      status: 'open',
      reasoning,
    });

    console.log(`[Bot Simulator] ${avatar.name} opened ${direction} ${asset.name} @ $${price.toFixed(2)} qty: ${quantity.toFixed(4)}`);

    try {
      const { notifyTradeEvent } = await import('./avatarLeaderboardService');
      notifyTradeEvent({ avatarId: avatar.id, action: 'opened', asset: asset.name, direction });
    } catch {}
  }

  private async closeTrade(trade: any, persona: AvatarTradingPersona) {
    let currentPrice: number | null = null;

    if (trade.assetType === 'crypto') {
      const coingeckoId = getCoingeckoId(trade.asset);
      if (coingeckoId) {
        currentPrice = await this.fetchCryptoPrice(coingeckoId);
      }
    } else {
      const stockAsset = STOCK_ASSETS.find(a => a.name === trade.asset || a.symbol === trade.asset);
      if (stockAsset) {
        currentPrice = await this.fetchStockPrice(stockAsset.symbol);
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
    const closeReason = pickRandom(persona.closeReasons).replace('{asset}', trade.asset);

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

    try {
      const { notifyTradeEvent } = await import('./avatarLeaderboardService');
      if (trade.avatarId) {
        notifyTradeEvent({ avatarId: trade.avatarId, action: 'closed', asset: trade.asset, direction: trade.direction, pnl });
      }
    } catch {}
  }

  private getCachedPrice(key: string): number | null {
    const cached = priceCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < PRICE_CACHE_TTL_MS) {
      return cached.price;
    }
    return null;
  }

  private setCachedPrice(key: string, price: number): void {
    priceCache.set(key, { price, timestamp: Date.now() });
  }

  private async fetchCryptoPrice(coingeckoId: string): Promise<number | null> {
    const symbolEntry = Object.entries(COINGECKO_ID_MAP).find(([_, id]) => id === coingeckoId);
    const symbol = symbolEntry ? symbolEntry[0] : coingeckoId.toUpperCase();
    const cacheKey = `crypto_${coingeckoId}`;

    const cached = this.getCachedPrice(cacheKey);
    if (cached) {
      return cached;
    }

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
      if (price && price > 0) {
        this.setCachedPrice(cacheKey, price);
        console.log(`[Bot Simulator] CoinGecko price for ${symbol}: $${price}`);
        return price;
      }
    } catch (err: any) {
      console.error(`[Bot Simulator] CoinGecko price fetch failed for ${coingeckoId}:`, err.message);
    }

    const fallback = CRYPTO_FALLBACK_PRICES[symbol];
    if (fallback) {
      console.log(`[Bot Simulator] Using fallback price for ${symbol}: $${fallback}`);
      return fallback;
    }
    return null;
  }

  private async fetchStockPrice(symbol: string): Promise<number | null> {
    const cacheKey = `stock_${symbol}`;

    const cached = this.getCachedPrice(cacheKey);
    if (cached) {
      return cached;
    }

    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      try {
        const response = await axios.get('https://finnhub.io/api/v1/quote', {
          params: { symbol: symbol.toUpperCase(), token: finnhubKey },
          timeout: 8000,
        });

        const quote = response.data;
        if (quote && quote.c > 0) {
          const price = parseFloat(quote.c.toFixed(2));
          this.setCachedPrice(cacheKey, price);
          console.log(`[Bot Simulator] Finnhub price for ${symbol}: $${price}`);
          return price;
        }
      } catch (err: any) {
        console.error(`[Bot Simulator] Finnhub price fetch failed for ${symbol}:`, err.message);
      }
    }

    const fallback = STOCK_FALLBACK_PRICES[symbol];
    if (fallback) {
      console.log(`[Bot Simulator] Using fallback price for ${symbol}: $${fallback}`);
      return fallback;
    }
    return null;
  }

  private async updateStakes() {
    try {
      const avatarPnls = await db
        .select({
          avatarId: botSimTrades.avatarId,
          totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)`,
        })
        .from(botSimTrades)
        .where(eq(botSimTrades.status, 'closed'))
        .groupBy(botSimTrades.avatarId);

      const pnlMap = new Map<string, number>();
      for (const row of avatarPnls) {
        if (row.avatarId) pnlMap.set(row.avatarId, Number(row.totalPnl));
      }

      const avatarTotals = await db
        .select({
          avatarId: botStakes.avatarId,
          totalStaked: sql<number>`COALESCE(SUM(${botStakes.amount}), 0)`,
        })
        .from(botStakes)
        .where(eq(botStakes.status, 'active'))
        .groupBy(botStakes.avatarId);

      const totalStakedMap = new Map<string, number>();
      for (const row of avatarTotals) {
        if (row.avatarId) totalStakedMap.set(row.avatarId, Number(row.totalStaked));
      }

      const activeStakes = await db
        .select()
        .from(botStakes)
        .where(eq(botStakes.status, 'active'));

      for (const stake of activeStakes) {
        const key = stake.avatarId || stake.agentId;
        if (!key) continue;

        const totalBotPnl = pnlMap.get(key) || 0;
        const totalStakedOnBot = totalStakedMap.get(key) || stake.amount;

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

  private async takePerformanceSnapshot(avatarId: string) {
    try {
      const closedTrades = await db
        .select({
          totalPnl: sql<number>`COALESCE(SUM(${botSimTrades.pnl}), 0)`,
          totalTrades: sql<number>`COUNT(*)::int`,
          wins: sql<number>`COUNT(*) FILTER (WHERE ${botSimTrades.pnl} > 0)::int`,
        })
        .from(botSimTrades)
        .where(and(
          eq(botSimTrades.avatarId, avatarId),
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
          eq(botStakes.avatarId, avatarId),
          eq(botStakes.status, 'active')
        ));

      const stakedAmount = Number(totalStaked[0]?.total || 0);
      const totalValue = stakedAmount + totalPnl;
      const cumulativeRoi = stakedAmount > 0 ? (totalPnl / stakedAmount) * 100 : 0;

      const prevSnapshots = await db
        .select()
        .from(botPerformanceSnapshots)
        .where(eq(botPerformanceSnapshots.avatarId, avatarId))
        .orderBy(desc(botPerformanceSnapshots.snapshotDate))
        .limit(1);

      const prevValue = prevSnapshots[0] ? Number(prevSnapshots[0].totalValue) : stakedAmount;
      const dailyPnl = totalValue - prevValue;
      const dailyPnlPercent = prevValue > 0 ? (dailyPnl / prevValue) * 100 : 0;

      await db.insert(botPerformanceSnapshots).values({
        avatarId,
        totalValue,
        dailyPnl,
        dailyPnlPercent: Math.round(dailyPnlPercent * 100) / 100,
        cumulativeRoi: Math.round(cumulativeRoi * 100) / 100,
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        snapshotDate: new Date(),
      });

      console.log(`[Bot Simulator] Snapshot for avatar ${avatarId}: value=$${totalValue.toFixed(2)}, ROI=${cumulativeRoi.toFixed(2)}%`);
    } catch (err) {
      console.error(`[Bot Simulator] Error taking snapshot for ${avatarId}:`, err);
    }
  }
}

export const botTradingSimulator = new BotTradingSimulator();

function generateSimulatedCryptoPrice(assetName: string): number {
  const basePrice = CRYPTO_FALLBACK_PRICES[assetName];
  if (basePrice) {
    const variation = (Math.random() - 0.5) * 0.06;
    return basePrice * (1 + variation);
  }
  return 1 + Math.random() * 100;
}

function generateSimulatedStockPrice(symbol: string): number {
  const basePrice = STOCK_FALLBACK_PRICES[symbol];
  if (basePrice) {
    const variation = (Math.random() - 0.48) * 0.1;
    return basePrice * (1 + variation);
  }
  return 100 + Math.random() * 200;
}

export async function seedBotHistoricalTrades() {
  console.log('[Bot Simulator] Seeding historical trades...');

  const avatars = await db
    .select()
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.isActive, true));

  if (avatars.length === 0) {
    console.log('[Bot Simulator] No active avatars found for seeding');
    return;
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const avatar of avatars) {
    const persona = getAvatarPersona(avatar.handle);
    if (!persona) {
      console.log(`[Bot Simulator] No persona found for ${avatar.handle}, skipping`);
      continue;
    }

    const baseTradeCount = 30 + Math.round(60 * persona.tradeFrequency);
    const tradeCount = baseTradeCount + Math.floor(Math.random() * 10) - 5;
    const positiveBias = 0.5 + persona.tradeFrequency * 0.1;

    console.log(`[Bot Simulator] Seeding ${tradeCount} trades for ${avatar.name}`);

    const trades: any[] = [];

    for (let i = 0; i < tradeCount; i++) {
      const selectedAsset = pickWeightedAsset(persona.preferredAssets);
      const tradeTime = new Date(now - Math.random() * thirtyDaysMs);
      const closeTime = new Date(tradeTime.getTime() + Math.random() * 48 * 60 * 60 * 1000 + 30 * 60 * 1000);

      let entryPrice: number;
      let exitPrice: number;
      let assetType = selectedAsset.type;

      if (selectedAsset.type === 'crypto') {
        entryPrice = generateSimulatedCryptoPrice(selectedAsset.name);
      } else {
        entryPrice = generateSimulatedStockPrice(selectedAsset.symbol);
      }

      const direction = Math.random() < persona.longBias ? 'long' : 'short';

      const isWin = Math.random() < positiveBias;
      const pnlMagnitude = Math.random() * 0.08 + 0.005;
      const priceChange = isWin
        ? entryPrice * pnlMagnitude
        : entryPrice * -pnlMagnitude;

      if (direction === 'long') {
        exitPrice = entryPrice + priceChange;
      } else {
        exitPrice = entryPrice - priceChange;
      }

      exitPrice = Math.max(exitPrice, entryPrice * 0.8);

      const riskMult = persona.riskTolerance === 'high' ? 2.0 : persona.riskTolerance === 'medium' ? 1.0 : 0.5;
      let quantity: number;
      if (selectedAsset.type === 'crypto') {
        quantity = Math.max(0.0001, (1000 / entryPrice) * persona.positionMultiplier * riskMult);
      } else {
        quantity = Math.max(1, Math.round(10 * persona.positionMultiplier * riskMult));
      }

      let pnl: number;
      if (direction === 'long') {
        pnl = (exitPrice - entryPrice) * quantity;
      } else {
        pnl = (entryPrice - exitPrice) * quantity;
      }
      const pnlPercent = (pnl / (entryPrice * quantity)) * 100;

      const reasons = direction === 'long' ? persona.longReasons : persona.shortReasons;
      const closeReasons = persona.closeReasons;
      const reasoning = `${pickRandom(reasons).replace('{asset}', selectedAsset.name)} | Close: ${pickRandom(closeReasons).replace('{asset}', selectedAsset.name)}`;

      trades.push({
        avatarId: avatar.id,
        asset: selectedAsset.name,
        assetType,
        direction,
        entryPrice: Math.round(entryPrice * 100) / 100,
        exitPrice: Math.round(exitPrice * 100) / 100,
        quantity: Math.round(quantity * 10000) / 10000,
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        status: 'closed',
        reasoning,
        closedAt: closeTime,
        createdAt: tradeTime,
      });
    }

    for (let batch = 0; batch < trades.length; batch += 50) {
      const chunk = trades.slice(batch, batch + 50);
      await db.insert(botSimTrades).values(chunk);
    }
  }

  console.log(`[Bot Simulator] Seeded historical trades for ${avatars.length} avatars`);
}

export async function updateAvatarTradingStats() {
  try {
    console.log('[Bot Simulator] Updating avatar trading stats from closed trades...');

    const statsResult = await db
      .select({
        avatarId: botSimTrades.avatarId,
        totalTrades: sql<number>`COUNT(*)::int`,
        wins: sql<number>`COUNT(*) FILTER (WHERE ${botSimTrades.pnl} > 0)::int`,
        avgPnlPercent: sql<number>`COALESCE(AVG(${botSimTrades.pnlPercent}), 0)`,
      })
      .from(botSimTrades)
      .where(and(
        eq(botSimTrades.status, 'closed'),
        isNotNull(botSimTrades.avatarId)
      ))
      .groupBy(botSimTrades.avatarId);

    if (statsResult.length === 0) {
      console.log('[Bot Simulator] No closed trades found, skipping stats update');
      return;
    }

    let updatedCount = 0;
    for (const row of statsResult) {
      if (!row.avatarId) continue;

      const totalTrades = Number(row.totalTrades);
      const wins = Number(row.wins);
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 10000) / 100 : 0;
      const avgTradeRoi = Math.round(Number(row.avgPnlPercent) * 100) / 100;

      await db
        .update(knowledgeAvatars)
        .set({
          totalTrades,
          winRate,
          avgTradeRoi,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeAvatars.id, row.avatarId));

      updatedCount++;
    }

    console.log(`[Bot Simulator] Updated trading stats for ${updatedCount} avatars`);
  } catch (err) {
    console.error('[Bot Simulator] Error updating avatar trading stats:', err);
  }
}

const POPULAR_AVATAR_HANDLES = ['pmarca', 'CryptoHayes', 'VitalikButerin', 'saylor', 'cz_binance', 'elonmusk', 'sama'];

export async function seedAgentStakesOnAvatars() {
  try {
    console.log('[Bot Simulator] Seeding agent stakes on avatars...');

    const aiAgentUsers = await db
      .select()
      .from(users)
      .where(eq(users.isAiAgent, true));

    if (aiAgentUsers.length === 0) {
      console.log('[Bot Simulator] No AI agent users found, skipping stakes seeding');
      return;
    }

    const tradingHandles = getAllAvatarHandles();
    const tradingAvatars = await db
      .select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true));

    const eligibleAvatars = tradingAvatars.filter(a => tradingHandles.includes(a.handle));

    if (eligibleAvatars.length === 0) {
      console.log('[Bot Simulator] No trading avatars found, skipping stakes seeding');
      return;
    }

    const existingStakes = await db
      .select({
        userId: botStakes.userId,
        avatarId: botStakes.avatarId,
      })
      .from(botStakes)
      .where(eq(botStakes.status, 'active'));

    const existingStakeKeys = new Set(
      existingStakes.map(s => `${s.userId}-${s.avatarId}`)
    );

    const popularAvatars = eligibleAvatars.filter(a => POPULAR_AVATAR_HANDLES.includes(a.handle));
    const regularAvatars = eligibleAvatars.filter(a => !POPULAR_AVATAR_HANDLES.includes(a.handle));

    let totalStakesCreated = 0;

    for (const agent of aiAgentUsers) {
      const agentPoints = agent.streamPoints || 0;
      if (agentPoints < 100) continue;

      const numStakes = 2 + Math.floor(Math.random() * 4);
      const maxBudget = Math.floor(agentPoints * (0.05 + Math.random() * 0.15));

      const selectedAvatars: typeof eligibleAvatars = [];
      const usedIds = new Set<string>();

      for (let i = 0; i < numStakes && selectedAvatars.length < numStakes; i++) {
        let pool: typeof eligibleAvatars;
        if (i < 2 && popularAvatars.length > 0 && Math.random() < 0.6) {
          pool = popularAvatars;
        } else {
          pool = eligibleAvatars;
        }

        const available = pool.filter(a => !usedIds.has(a.id));
        if (available.length === 0) continue;

        const chosen = available[Math.floor(Math.random() * available.length)];
        usedIds.add(chosen.id);
        selectedAvatars.push(chosen);
      }

      let remainingBudget = maxBudget;

      for (const avatar of selectedAvatars) {
        const stakeKey = `${agent.id}-${avatar.id}`;
        if (existingStakeKeys.has(stakeKey)) continue;

        const isPopular = POPULAR_AVATAR_HANDLES.includes(avatar.handle);
        const minStake = 100;
        const maxStake = Math.min(5000, remainingBudget, isPopular ? 5000 : 3000);

        if (maxStake < minStake) continue;

        const amount = Math.floor(minStake + Math.random() * (maxStake - minStake));
        remainingBudget -= amount;

        await db.insert(botStakes).values({
          userId: agent.id,
          avatarId: avatar.id,
          amount,
          currentValue: amount,
          totalPnl: 0,
          totalPnlPercent: 0,
          status: 'active',
        });

        existingStakeKeys.add(stakeKey);
        totalStakesCreated++;
      }
    }

    console.log(`[Bot Simulator] Created ${totalStakesCreated} agent stakes across ${aiAgentUsers.length} AI agents`);
  } catch (err) {
    console.error('[Bot Simulator] Error seeding agent stakes:', err);
  }
}
