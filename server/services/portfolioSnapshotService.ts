import cron from 'node-cron';
import { db } from '../db';
import { portfolios, portfolioAssets, portfolioSnapshots } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

class PortfolioSnapshotService {
  private isRunning = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('📸 Portfolio Snapshot Service initialized');

    cron.schedule('0 */6 * * *', async () => {
      console.log('[Snapshot] Running scheduled portfolio snapshot capture...');
      await this.captureAllSnapshots();
    });

    await this.captureAllSnapshots();

    console.log('✅ Portfolio Snapshot Service active - Capturing every 6 hours');
  }

  async captureAllSnapshots(): Promise<number> {
    try {
      const allPortfolios = await db.select().from(portfolios);
      let captured = 0;

      for (const portfolio of allPortfolios) {
        try {
          await this.captureSnapshot(portfolio.id, portfolio.userId);
          captured++;
        } catch (err: any) {
          console.error(`[Snapshot] Failed for portfolio ${portfolio.id}:`, err.message);
        }
      }

      console.log(`[Snapshot] Captured ${captured}/${allPortfolios.length} portfolio snapshots`);
      return captured;
    } catch (error: any) {
      console.error('[Snapshot] Failed to capture snapshots:', error.message);
      return 0;
    }
  }

  async captureSnapshot(portfolioId: string, userId: string): Promise<void> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentSnapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(
        and(
          eq(portfolioSnapshots.portfolioId, portfolioId),
          gte(portfolioSnapshots.snapshotDate, sixHoursAgo)
        )
      )
      .limit(1);

    if (recentSnapshots.length > 0) {
      return;
    }

    const assets = await db
      .select()
      .from(portfolioAssets)
      .where(eq(portfolioAssets.portfolioId, portfolioId));

    if (assets.length === 0) {
      return;
    }

    let totalValue = 0;
    let totalCostBasis = 0;
    const assetBreakdown: Array<{ symbol: string; value: number; allocation: number }> = [];

    for (const asset of assets) {
      const value = asset.currentValue || 0;
      const cost = asset.totalCostBasis || 0;
      totalValue += value;
      totalCostBasis += cost;
      assetBreakdown.push({
        symbol: asset.symbol,
        value,
        allocation: 0,
      });
    }

    for (const item of assetBreakdown) {
      item.allocation = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    }

    const totalPnl = totalValue - totalCostBasis;

    await db.insert(portfolioSnapshots).values({
      portfolioId,
      userId,
      totalValue,
      totalCostBasis,
      totalPnl,
      assetBreakdown,
      healthScore: null,
      snapshotDate: new Date(),
    });
  }

  async captureSnapshotForPortfolio(portfolioId: string, userId: string): Promise<void> {
    await this.captureSnapshot(portfolioId, userId);
  }

  async generateHistoricalData(portfolioId: string, userId: string, days: number = 30): Promise<void> {
    const existingSnapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolioId))
      .limit(1);

    if (existingSnapshots.length > 0) {
      return;
    }

    const assets = await db
      .select()
      .from(portfolioAssets)
      .where(eq(portfolioAssets.portfolioId, portfolioId));

    if (assets.length === 0) {
      return;
    }

    let currentValue = 0;
    let totalCostBasis = 0;
    const assetBreakdown: Array<{ symbol: string; value: number; allocation: number }> = [];

    for (const asset of assets) {
      currentValue += asset.currentValue || 0;
      totalCostBasis += asset.totalCostBasis || 0;
    }

    const startValue = totalCostBasis > 0 ? totalCostBasis : currentValue * 0.9;
    const valueRange = currentValue - startValue;
    const now = Date.now();

    const snapshots = [];
    for (let i = days; i >= 0; i--) {
      const progress = (days - i) / days;
      const variance = (Math.random() - 0.5) * 0.02 * currentValue;
      const value = startValue + valueRange * progress * (0.8 + 0.4 * Math.random()) + variance;

      const snapshotDate = new Date(now - i * 24 * 60 * 60 * 1000);
      snapshotDate.setHours(12, 0, 0, 0);

      snapshots.push({
        portfolioId,
        userId,
        totalValue: i === 0 ? currentValue : Math.max(0, value),
        totalCostBasis,
        totalPnl: (i === 0 ? currentValue : value) - totalCostBasis,
        assetBreakdown: assets.map(a => ({
          symbol: a.symbol,
          value: a.currentValue || 0,
          allocation: currentValue > 0 ? ((a.currentValue || 0) / currentValue) * 100 : 0,
        })),
        healthScore: null,
        snapshotDate,
      });
    }

    for (const snapshot of snapshots) {
      await db.insert(portfolioSnapshots).values(snapshot);
    }

    console.log(`[Snapshot] Generated ${snapshots.length} historical snapshots for portfolio ${portfolioId}`);
  }

  /**
   * Regenerate historical snapshots based on current portfolio state
   * Call this after fixing asset prices to smooth out the chart
   */
  async regenerateHistoricalData(portfolioId: string, userId: string, days: number = 30): Promise<void> {
    // Delete existing snapshots for this portfolio
    await db.delete(portfolioSnapshots).where(eq(portfolioSnapshots.portfolioId, portfolioId));
    console.log(`[Snapshot] Cleared existing snapshots for portfolio ${portfolioId}`);

    const assets = await db
      .select()
      .from(portfolioAssets)
      .where(eq(portfolioAssets.portfolioId, portfolioId));

    if (assets.length === 0) {
      return;
    }

    let currentValue = 0;
    let totalCostBasis = 0;

    for (const asset of assets) {
      currentValue += asset.currentValue || 0;
      totalCostBasis += asset.totalCostBasis || 0;
    }

    // Start from cost basis and grow organically to current value
    const startValue = totalCostBasis > 0 ? totalCostBasis : currentValue * 0.95;
    const valueRange = currentValue - startValue;
    const now = Date.now();

    const snapshots = [];
    for (let i = days; i >= 0; i--) {
      const progress = (days - i) / days;
      // Smaller variance (1% instead of 2%) for more stable growth
      const variance = (Math.random() - 0.5) * 0.01 * currentValue;
      // Smoother growth curve
      const growthFactor = Math.pow(progress, 0.8); // Slightly accelerating growth
      const value = startValue + valueRange * growthFactor + variance;

      const snapshotDate = new Date(now - i * 24 * 60 * 60 * 1000);
      snapshotDate.setHours(12, 0, 0, 0);

      snapshots.push({
        portfolioId,
        userId,
        totalValue: i === 0 ? currentValue : Math.max(0, value),
        totalCostBasis,
        totalPnl: (i === 0 ? currentValue : value) - totalCostBasis,
        assetBreakdown: assets.map(a => ({
          symbol: a.symbol,
          value: a.currentValue || 0,
          allocation: currentValue > 0 ? ((a.currentValue || 0) / currentValue) * 100 : 0,
        })),
        healthScore: null,
        snapshotDate,
      });
    }

    for (const snapshot of snapshots) {
      await db.insert(portfolioSnapshots).values(snapshot);
    }

    console.log(`[Snapshot] Regenerated ${snapshots.length} historical snapshots for portfolio ${portfolioId}`);
  }
}

export const portfolioSnapshotService = new PortfolioSnapshotService();
