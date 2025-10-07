import { Router } from 'express';
import { socialTradingService } from './services/socialTradingService';
import { insertTraderSchema, insertTradingSignalSchema, insertCopyTradingPositionSchema, insertTradingAlertSchema } from '../shared/schema';
import { z } from 'zod';

const router = Router();

// ===========================
// TRADER PROFILE ROUTES
// ===========================

// Create trader profile
router.post('/api/trading/traders', async (req, res) => {
  try {
    const data = insertTraderSchema.parse(req.body);
    const trader = await socialTradingService.createTrader(data);
    res.json(trader);
  } catch (error: any) {
    console.error('❌ Create trader error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get trader by ID
router.get('/api/trading/traders/:id', async (req, res) => {
  try {
    const trader = await socialTradingService.getTraderById(req.params.id);
    if (!trader) {
      return res.status(404).json({ error: 'Trader not found' });
    }
    res.json(trader);
  } catch (error: any) {
    console.error('❌ Get trader error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get trader by user ID
router.get('/api/trading/traders/user/:userId', async (req, res) => {
  try {
    const trader = await socialTradingService.getTraderByUserId(req.params.userId);
    if (!trader) {
      return res.status(404).json({ error: 'Trader not found' });
    }
    res.json(trader);
  } catch (error: any) {
    console.error('❌ Get trader by user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top traders
router.get('/api/trading/traders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const traders = await socialTradingService.getTopTraders(limit);
    res.json(traders);
  } catch (error: any) {
    console.error('❌ Get top traders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Follow trader
router.post('/api/trading/traders/:id/follow', async (req, res) => {
  try {
    await socialTradingService.followTrader(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Follow trader error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unfollow trader
router.post('/api/trading/traders/:id/unfollow', async (req, res) => {
  try {
    await socialTradingService.unfollowTrader(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Unfollow trader error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/api/trading/leaderboard', async (req, res) => {
  try {
    const sortBy = (req.query.sortBy as 'roi' | 'winRate' | 'totalPnl' | 'sharpeRatio') || 'roi';
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await socialTradingService.getLeaderboard(sortBy, limit);
    res.json(leaderboard);
  } catch (error: any) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// TRADING SIGNAL ROUTES
// ===========================

// Create trading signal
router.post('/api/trading/signals', async (req, res) => {
  try {
    const data = insertTradingSignalSchema.parse(req.body);
    const signal = await socialTradingService.createSignal(data);
    res.json(signal);
  } catch (error: any) {
    console.error('❌ Create signal error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get signal by ID
router.get('/api/trading/signals/:id', async (req, res) => {
  try {
    const signal = await socialTradingService.getSignalById(req.params.id);
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    res.json(signal);
  } catch (error: any) {
    console.error('❌ Get signal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active signals
router.get('/api/trading/signals', async (req, res) => {
  try {
    const traderId = req.query.traderId as string | undefined;
    const asset = req.query.asset as string | undefined;
    const signals = await socialTradingService.getActiveSignals(traderId, asset);
    res.json(signals);
  } catch (error: any) {
    console.error('❌ Get signals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update signal price
router.patch('/api/trading/signals/:id/price', async (req, res) => {
  try {
    const schema = z.object({ currentPrice: z.number() });
    const { currentPrice } = schema.parse(req.body);
    await socialTradingService.updateSignalPrice(req.params.id, currentPrice);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Update signal price error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Close signal
router.post('/api/trading/signals/:id/close', async (req, res) => {
  try {
    const schema = z.object({ closePrice: z.number() });
    const { closePrice } = schema.parse(req.body);
    const signal = await socialTradingService.closeSignal(req.params.id, closePrice);
    res.json(signal);
  } catch (error: any) {
    console.error('❌ Close signal error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Increment signal engagement (views, likes, copies)
router.post('/api/trading/signals/:id/engage/:type', async (req, res) => {
  try {
    const type = req.params.type as 'views' | 'likes' | 'copies';
    if (!['views', 'likes', 'copies'].includes(type)) {
      return res.status(400).json({ error: 'Invalid engagement type' });
    }
    await socialTradingService.incrementSignalEngagement(req.params.id, type);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Increment engagement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// COPY TRADING ROUTES
// ===========================

// Create copy position
router.post('/api/trading/copy-positions', async (req, res) => {
  try {
    const data = insertCopyTradingPositionSchema.parse(req.body);
    const position = await socialTradingService.createCopyPosition(data);
    res.json(position);
  } catch (error: any) {
    console.error('❌ Create copy position error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get copy position by ID
router.get('/api/trading/copy-positions/:id', async (req, res) => {
  try {
    const position = await socialTradingService.getCopyPosition(req.params.id);
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json(position);
  } catch (error: any) {
    console.error('❌ Get copy position error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's copy positions
router.get('/api/trading/copy-positions/user/:userId', async (req, res) => {
  try {
    const positions = await socialTradingService.getCopyPositionsByUser(req.params.userId);
    res.json(positions);
  } catch (error: any) {
    console.error('❌ Get user positions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update copy position price
router.patch('/api/trading/copy-positions/:id/price', async (req, res) => {
  try {
    const schema = z.object({ currentPrice: z.number() });
    const { currentPrice } = schema.parse(req.body);
    await socialTradingService.updateCopyPositionPrice(req.params.id, currentPrice);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Update copy position price error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Close copy position
router.post('/api/trading/copy-positions/:id/close', async (req, res) => {
  try {
    const schema = z.object({ exitPrice: z.number() });
    const { exitPrice } = schema.parse(req.body);
    const position = await socialTradingService.closeCopyPosition(req.params.id, exitPrice);
    res.json(position);
  } catch (error: any) {
    console.error('❌ Close copy position error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// PERFORMANCE TRACKING ROUTES
// ===========================

// Record trader performance
router.post('/api/trading/traders/:id/performance', async (req, res) => {
  try {
    const schema = z.object({
      period: z.enum(['daily', 'weekly', 'monthly']),
    });
    const { period } = schema.parse(req.body);
    await socialTradingService.recordTraderPerformance(req.params.id, period);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Record performance error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get trader performance history
router.get('/api/trading/traders/:id/performance/:period', async (req, res) => {
  try {
    const period = req.params.period as 'daily' | 'weekly' | 'monthly';
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await socialTradingService.getTraderPerformanceHistory(req.params.id, period, limit);
    res.json(history);
  } catch (error: any) {
    console.error('❌ Get performance history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// GLOBAL STATS ROUTES
// ===========================

// Get global trading stats
router.get('/api/trading/stats', async (req, res) => {
  try {
    const stats = await socialTradingService.getGlobalStats();
    res.json(stats);
  } catch (error: any) {
    console.error('❌ Get global stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
