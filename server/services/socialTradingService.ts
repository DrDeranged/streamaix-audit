import { db } from '../db';
import { 
  traders, 
  tradingSignals, 
  copyTradingPositions, 
  traderPerformance, 
  tradingAlerts,
  type Trader,
  type DbTradingSignal,
  type CopyTradingPosition,
  type TraderPerformance
} from '../../shared/schema';
import { eq, desc, and, gte, lte, sql, or } from 'drizzle-orm';

export class SocialTradingService {
  // ===========================
  // TRADER MANAGEMENT
  // ===========================
  
  async createTrader(data: {
    userId: string;
    walletAddress: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    tradingStyle?: string;
    riskLevel?: string;
    preferredAssets?: string[];
    tradingPairs?: string[];
  }): Promise<Trader> {
    const [trader] = await db.insert(traders).values({
      userId: data.userId,
      walletAddress: data.walletAddress,
      displayName: data.displayName,
      avatar: data.avatar,
      bio: data.bio,
      tradingStyle: data.tradingStyle || 'swing',
      riskLevel: data.riskLevel || 'medium',
      preferredAssets: data.preferredAssets || ['BTC', 'ETH'],
      tradingPairs: data.tradingPairs || ['BTC/USD', 'ETH/USD'],
      isPublic: true,
      allowCopyTrading: true,
    }).returning();
    
    console.log(`✅ Created trader profile:`, trader.id);
    return trader;
  }

  async getTraderByUserId(userId: string): Promise<Trader | null> {
    const [trader] = await db
      .select()
      .from(traders)
      .where(eq(traders.userId, userId))
      .limit(1);
    
    return trader || null;
  }

  async getTraderById(traderId: string): Promise<Trader | null> {
    const [trader] = await db
      .select()
      .from(traders)
      .where(eq(traders.id, traderId))
      .limit(1);
    
    return trader || null;
  }

  async getTopTraders(limit: number = 20): Promise<Trader[]> {
    return await db
      .select()
      .from(traders)
      .where(eq(traders.isPublic, true))
      .orderBy(desc(traders.roi), desc(traders.winRate))
      .limit(limit);
  }

  async updateTraderStats(traderId: string, stats: {
    totalTrades?: number;
    winRate?: number;
    totalPnl?: number;
    roi?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    totalVolume?: number;
  }): Promise<void> {
    await db
      .update(traders)
      .set({
        ...stats,
        updatedAt: new Date(),
        lastTradeAt: new Date(),
      })
      .where(eq(traders.id, traderId));
  }

  async followTrader(traderId: string): Promise<void> {
    await db
      .update(traders)
      .set({
        followers: sql`${traders.followers} + 1`,
      })
      .where(eq(traders.id, traderId));
  }

  async unfollowTrader(traderId: string): Promise<void> {
    await db
      .update(traders)
      .set({
        followers: sql`${traders.followers} - 1`,
      })
      .where(eq(traders.id, traderId));
  }

  // ===========================
  // TRADING SIGNALS
  // ===========================

  async createSignal(data: {
    traderId: string;
    asset: string;
    pair: string;
    direction: 'long' | 'short';
    signalType: 'entry' | 'exit' | 'take_profit' | 'stop_loss';
    entryPrice: number;
    targetPrice?: number;
    stopLoss?: number;
    leverage?: number;
    confidence?: number;
    timeframe: string;
    reasoning?: string;
    technicalIndicators?: any;
    tags?: string[];
    expiresAt?: Date;
  }): Promise<DbTradingSignal> {
    const [signal] = await db.insert(tradingSignals).values({
      ...data,
      currentPrice: data.entryPrice,
      leverage: data.leverage || 1,
      confidence: data.confidence || 75,
      status: 'active',
    }).returning();

    console.log(`📊 New signal created: ${signal.asset} ${signal.direction} @ ${signal.entryPrice}`);
    return signal;
  }

  async getSignalById(signalId: string): Promise<DbTradingSignal | null> {
    const [signal] = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.id, signalId))
      .limit(1);
    
    return signal || null;
  }

  async getActiveSignals(traderId?: string, asset?: string): Promise<DbTradingSignal[]> {
    let query = db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.status, 'active'));

    if (traderId) {
      query = query.where(and(
        eq(tradingSignals.status, 'active'),
        eq(tradingSignals.traderId, traderId)
      )) as any;
    }

    if (asset) {
      query = query.where(and(
        eq(tradingSignals.status, 'active'),
        eq(tradingSignals.asset, asset)
      )) as any;
    }

    return await query.orderBy(desc(tradingSignals.createdAt)).limit(50);
  }

  async updateSignalPrice(signalId: string, currentPrice: number): Promise<void> {
    const signal = await this.getSignalById(signalId);
    if (!signal) return;

    const entryPrice = signal.entryPrice || 0;
    const isLong = signal.direction === 'long';
    
    // Calculate P/L
    let pnlPercentage = 0;
    if (isLong) {
      pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else {
      pnlPercentage = ((entryPrice - currentPrice) / entryPrice) * 100;
    }

    // Apply leverage
    if (signal.leverage && signal.leverage > 1) {
      pnlPercentage *= signal.leverage;
    }

    await db
      .update(tradingSignals)
      .set({
        currentPrice,
        pnlPercentage,
        updatedAt: new Date(),
      })
      .where(eq(tradingSignals.id, signalId));
  }

  async closeSignal(signalId: string, closePrice: number): Promise<DbTradingSignal | null> {
    const signal = await this.getSignalById(signalId);
    if (!signal) return null;

    const entryPrice = signal.entryPrice || 0;
    const positionSize = signal.positionSize || 1000;
    const isLong = signal.direction === 'long';
    
    // Calculate final P/L
    let pnlPercentage = 0;
    let pnl = 0;
    
    if (isLong) {
      pnlPercentage = ((closePrice - entryPrice) / entryPrice) * 100;
      pnl = ((closePrice - entryPrice) / entryPrice) * positionSize;
    } else {
      pnlPercentage = ((entryPrice - closePrice) / entryPrice) * 100;
      pnl = ((entryPrice - closePrice) / entryPrice) * positionSize;
    }

    // Apply leverage
    if (signal.leverage && signal.leverage > 1) {
      pnlPercentage *= signal.leverage;
      pnl *= signal.leverage;
    }

    const [closedSignal] = await db
      .update(tradingSignals)
      .set({
        status: 'closed',
        closePrice,
        pnl,
        pnlPercentage,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tradingSignals.id, signalId))
      .returning();

    // Update trader stats
    if (signal.traderId) {
      await this.updateTraderStatsAfterTrade(signal.traderId, pnl, pnlPercentage > 0);
    }

    console.log(`📈 Signal closed: ${signal.asset} P/L: ${pnlPercentage.toFixed(2)}%`);
    return closedSignal;
  }

  async incrementSignalEngagement(signalId: string, type: 'views' | 'likes' | 'copies'): Promise<void> {
    const update: any = {};
    update[type] = sql`${tradingSignals[type]} + 1`;

    await db
      .update(tradingSignals)
      .set(update)
      .where(eq(tradingSignals.id, signalId));
  }

  // ===========================
  // COPY TRADING
  // ===========================

  async createCopyPosition(data: {
    copierId: string;
    traderId: string;
    signalId: string;
    asset: string;
    pair: string;
    direction: 'long' | 'short';
    entryPrice: number;
    positionSize: number;
    leverage?: number;
    stopLoss?: number;
    takeProfit?: number;
    initialRisk?: number;
  }): Promise<CopyTradingPosition> {
    const [position] = await db.insert(copyTradingPositions).values({
      ...data,
      currentPrice: data.entryPrice,
      leverage: data.leverage || 1,
      status: 'open',
      unrealizedPnl: 0,
    }).returning();

    // Increment copiers count
    await db
      .update(traders)
      .set({
        copiers: sql`${traders.copiers} + 1`,
        totalCopied: sql`${traders.totalCopied} + 1`,
      })
      .where(eq(traders.id, data.traderId));

    // Increment signal copies
    await this.incrementSignalEngagement(data.signalId, 'copies');

    console.log(`📋 Copy position opened: ${position.asset} for user ${position.copierId}`);
    return position;
  }

  async getCopyPosition(positionId: string): Promise<CopyTradingPosition | null> {
    const [position] = await db
      .select()
      .from(copyTradingPositions)
      .where(eq(copyTradingPositions.id, positionId))
      .limit(1);
    
    return position || null;
  }

  async getCopyPositionsByUser(copierId: string): Promise<CopyTradingPosition[]> {
    return await db
      .select()
      .from(copyTradingPositions)
      .where(eq(copyTradingPositions.copierId, copierId))
      .orderBy(desc(copyTradingPositions.openedAt));
  }

  async updateCopyPositionPrice(positionId: string, currentPrice: number): Promise<void> {
    const position = await this.getCopyPosition(positionId);
    if (!position || position.status !== 'open') return;

    const entryPrice = position.entryPrice || 0;
    const positionSize = position.positionSize || 0;
    const isLong = position.direction === 'long';
    
    // Calculate unrealized P/L
    let pnlPercentage = 0;
    let unrealizedPnl = 0;
    
    if (isLong) {
      pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
      unrealizedPnl = ((currentPrice - entryPrice) / entryPrice) * positionSize;
    } else {
      pnlPercentage = ((entryPrice - currentPrice) / entryPrice) * 100;
      unrealizedPnl = ((entryPrice - currentPrice) / entryPrice) * positionSize;
    }

    // Apply leverage
    if (position.leverage && position.leverage > 1) {
      pnlPercentage *= position.leverage;
      unrealizedPnl *= position.leverage;
    }

    await db
      .update(copyTradingPositions)
      .set({
        currentPrice,
        unrealizedPnl,
        pnlPercentage,
        updatedAt: new Date(),
      })
      .where(eq(copyTradingPositions.id, positionId));
  }

  async closeCopyPosition(positionId: string, exitPrice: number): Promise<CopyTradingPosition | null> {
    const position = await this.getCopyPosition(positionId);
    if (!position) return null;

    const entryPrice = position.entryPrice || 0;
    const positionSize = position.positionSize || 0;
    const isLong = position.direction === 'long';
    
    // Calculate realized P/L
    let pnlPercentage = 0;
    let realizedPnl = 0;
    
    if (isLong) {
      pnlPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
      realizedPnl = ((exitPrice - entryPrice) / entryPrice) * positionSize;
    } else {
      pnlPercentage = ((entryPrice - exitPrice) / entryPrice) * 100;
      realizedPnl = ((entryPrice - exitPrice) / entryPrice) * positionSize;
    }

    // Apply leverage
    if (position.leverage && position.leverage > 1) {
      pnlPercentage *= position.leverage;
      realizedPnl *= position.leverage;
    }

    const [closedPosition] = await db
      .update(copyTradingPositions)
      .set({
        status: 'closed',
        exitPrice,
        realizedPnl,
        pnlPercentage,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(copyTradingPositions.id, positionId))
      .returning();

    // Decrement active copiers
    await db
      .update(traders)
      .set({
        copiers: sql`${traders.copiers} - 1`,
      })
      .where(eq(traders.id, position.traderId));

    console.log(`📋 Copy position closed: ${position.asset} P/L: ${pnlPercentage.toFixed(2)}%`);
    return closedPosition;
  }

  // ===========================
  // PERFORMANCE TRACKING
  // ===========================

  async recordTraderPerformance(traderId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    // Calculate period boundaries
    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const day = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - day);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get closed signals in this period
    const signals = await db
      .select()
      .from(tradingSignals)
      .where(and(
        eq(tradingSignals.traderId, traderId),
        eq(tradingSignals.status, 'closed'),
        gte(tradingSignals.closedAt!, periodStart),
        lte(tradingSignals.closedAt!, periodEnd)
      ));

    if (signals.length === 0) return;

    // Calculate metrics
    const wins = signals.filter(s => (s.pnlPercentage || 0) > 0).length;
    const losses = signals.filter(s => (s.pnlPercentage || 0) <= 0).length;
    const totalPnl = signals.reduce((sum, s) => sum + (s.pnl || 0), 0);
    const totalVolume = signals.reduce((sum, s) => sum + (s.positionSize || 0), 0);
    const winRate = signals.length > 0 ? (wins / signals.length) * 100 : 0;

    // Get trader current stats
    const trader = await this.getTraderById(traderId);
    if (!trader) return;

    await db.insert(traderPerformance).values({
      traderId,
      period,
      periodStart,
      periodEnd,
      trades: signals.length,
      wins,
      losses,
      winRate,
      totalPnl,
      totalVolume,
      roi: trader.roi || 0,
      sharpeRatio: trader.sharpeRatio,
      maxDrawdown: trader.maxDrawdown,
      totalFollowers: trader.followers || 0,
      totalCopiers: trader.copiers || 0,
      signalsPosted: signals.length,
    });

    console.log(`📊 Performance recorded for trader ${traderId}: ${period}`);
  }

  async getTraderPerformanceHistory(traderId: string, period: 'daily' | 'weekly' | 'monthly', limit: number = 30): Promise<TraderPerformance[]> {
    return await db
      .select()
      .from(traderPerformance)
      .where(and(
        eq(traderPerformance.traderId, traderId),
        eq(traderPerformance.period, period)
      ))
      .orderBy(desc(traderPerformance.periodStart))
      .limit(limit);
  }

  // ===========================
  // PRIVATE HELPERS
  // ===========================

  private async updateTraderStatsAfterTrade(traderId: string, pnl: number, isWin: boolean): Promise<void> {
    const trader = await this.getTraderById(traderId);
    if (!trader) return;

    const totalTrades = (trader.totalTrades || 0) + 1;
    const totalPnl = (trader.totalPnl || 0) + pnl;
    const wins = isWin ? 1 : 0;
    const winRate = totalTrades > 0 ? ((totalTrades * (trader.winRate || 0) / 100 + wins) / totalTrades) * 100 : 0;

    // Simple ROI calculation (would need initial capital in production)
    const initialCapital = 10000; // Mock initial capital
    const roi = (totalPnl / initialCapital) * 100;

    await this.updateTraderStats(traderId, {
      totalTrades,
      winRate,
      totalPnl,
      roi,
    });
  }

  // ===========================
  // LEADERBOARD & STATS
  // ===========================

  async getLeaderboard(
    sortBy: 'roi' | 'winRate' | 'totalPnl' | 'sharpeRatio' = 'roi',
    limit: number = 20
  ): Promise<Trader[]> {
    const orderByColumn = {
      roi: traders.roi,
      winRate: traders.winRate,
      totalPnl: traders.totalPnl,
      sharpeRatio: traders.sharpeRatio,
    }[sortBy];

    return await db
      .select()
      .from(traders)
      .where(and(
        eq(traders.isPublic, true),
        gte(traders.totalTrades, 5) // Minimum 5 trades to appear on leaderboard
      ))
      .orderBy(desc(orderByColumn))
      .limit(limit);
  }

  async getGlobalStats(): Promise<{
    totalTraders: number;
    totalSignals: number;
    activeCopyPositions: number;
    totalVolume: number;
    avgWinRate: number;
  }> {
    // This would be optimized with aggregation queries in production
    const allTraders = await db.select().from(traders);
    const allSignals = await db.select().from(tradingSignals);
    const openPositions = await db
      .select()
      .from(copyTradingPositions)
      .where(eq(copyTradingPositions.status, 'open'));

    const totalVolume = allTraders.reduce((sum, t) => sum + (t.totalVolume || 0), 0);
    const avgWinRate = allTraders.length > 0
      ? allTraders.reduce((sum, t) => sum + (t.winRate || 0), 0) / allTraders.length
      : 0;

    return {
      totalTraders: allTraders.length,
      totalSignals: allSignals.length,
      activeCopyPositions: openPositions.length,
      totalVolume,
      avgWinRate,
    };
  }
}

export const socialTradingService = new SocialTradingService();
