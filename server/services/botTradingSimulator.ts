import { db } from '../db';
import { knowledgeAvatars, botStakes, botSimTrades, botPerformanceSnapshots } from '@shared/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
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

const CRYPTO_PRICE_RANGES: Record<string, [number, number]> = {
  'BTC': [90000, 105000],
  'ETH': [3000, 4000],
  'SOL': [170, 250],
  'ADA': [0.4, 0.8],
  'AVAX': [25, 50],
  'LINK': [12, 25],
  'DOT': [5, 12],
  'DOGE': [0.08, 0.2],
  'XRP': [0.5, 1.2],
  'UNI': [6, 15],
  'AAVE': [80, 180],
  'TRX': [0.08, 0.18],
  'MATIC': [0.5, 1.5],
  'FTM': [0.3, 0.9],
  'YFI': [6000, 12000],
  'COMP': [40, 90],
  'SNX': [2, 6],
  'MKR': [1200, 2500],
  'CRV': [0.4, 1.2],
};

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
      price = await this.simulateStockPrice(asset.symbol);
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
  const range = CRYPTO_PRICE_RANGES[assetName];
  if (range) {
    return range[0] + Math.random() * (range[1] - range[0]);
  }
  return 1 + Math.random() * 100;
}

function generateSimulatedStockPrice(symbol: string): number {
  const basePrice = STOCK_BASE_PRICES[symbol];
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
