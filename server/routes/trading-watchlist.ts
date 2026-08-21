// ============================================================================
// Trading Watchlist routes — extracted from server/routes/diagnostic.ts.
// Owns all /api/trading-watchlist/* and /api/asset-search routes.
// ============================================================================
import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../auth";
import { validateBody } from "../middleware/security";
import { asyncHandler } from "./_shared";
import { addToWatchlistSchema } from "../middleware/validationSchemas";
import { aiTradingSignalsService } from "../services/aiTradingSignalsService";

// Platform default starter set — shown when a user has no personal watchlist items.
// Never written to the database; always computed on demand.
const PLATFORM_DEFAULT_ASSETS: Array<{
  symbol: string;
  assetName: string;
  assetType: 'crypto' | 'stock';
  coingeckoId: string | null;
}> = [
  { symbol: 'BTC',  assetName: 'Bitcoin',   assetType: 'crypto', coingeckoId: 'bitcoin'  },
  { symbol: 'ETH',  assetName: 'Ethereum',  assetType: 'crypto', coingeckoId: 'ethereum' },
  { symbol: 'SOL',  assetName: 'Solana',    assetType: 'crypto', coingeckoId: 'solana'   },
  { symbol: 'NVDA', assetName: 'NVIDIA',    assetType: 'stock',  coingeckoId: null        },
  { symbol: 'AMD',  assetName: 'AMD',       assetType: 'stock',  coingeckoId: null        },
  { symbol: 'MSFT', assetName: 'Microsoft', assetType: 'stock',  coingeckoId: null        },
];

export async function registerTradingWatchlistRoutes(app: Express): Promise<void> {
  // ---------------------------------------------------------------------------
  // Asset search (supports the watchlist add UI)
  // ---------------------------------------------------------------------------

  app.get('/api/crypto-search', asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ success: true, results: [] });
      }
      const results = await aiTradingSignalsService.searchCryptoAssets(query);
      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Crypto search error:', error);
      res.json({ success: false, results: [], error: error.message });
    }
  }));

  app.get('/api/asset-search', asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ success: true, crypto: [], stocks: [] });
      }
      const [cryptoResults, stockResults] = await Promise.all([
        aiTradingSignalsService.searchCryptoAssets(query),
        aiTradingSignalsService.searchStocks(query),
      ]);
      res.json({ success: true, crypto: cryptoResults, stocks: stockResults });
    } catch (error: any) {
      console.error('Asset search error:', error);
      res.json({ success: false, crypto: [], stocks: [], error: error.message });
    }
  }));

  // ---------------------------------------------------------------------------
  // Personal watchlist CRUD
  // ---------------------------------------------------------------------------

  app.get('/api/trading-watchlist', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const items = await storage.getUserWatchlist(userId);
      res.json({ success: true, items });
    } catch (error: any) {
      console.error('Get watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  app.post('/api/trading-watchlist', authenticateToken, validateBody(addToWatchlistSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { symbol, assetName, assetType, coingeckoId, notes } = req.body;
      if (!symbol || !assetName || !assetType) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const count = await storage.getWatchlistCount(userId);
      if (count >= 5) {
        return res.status(400).json({ success: false, error: 'Maximum 5 assets allowed in watchlist' });
      }

      const exists = await storage.isInWatchlist(userId, symbol);
      if (exists) {
        return res.status(400).json({ success: false, error: 'Asset already in watchlist' });
      }

      const item = await storage.addToWatchlist({ userId, symbol, assetName, assetType, coingeckoId, notes });
      res.json({ success: true, item });
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  app.delete('/api/trading-watchlist/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      await storage.removeFromWatchlist(userId, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }));

  // ---------------------------------------------------------------------------
  // Signals — computed from personal list, or platform defaults when empty
  // GET /api/trading-watchlist/signals
  //
  // When the user has no personal items: returns signals for PLATFORM_DEFAULT_ASSETS
  // with isDefault: true.  Never writes default rows to the database.
  // ---------------------------------------------------------------------------
  app.get('/api/trading-watchlist/signals', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const items = await storage.getUserWatchlist(userId);

      const sourceItems = items.length > 0
        ? items.map(i => ({ ...i, isDefault: false }))
        : PLATFORM_DEFAULT_ASSETS.map(a => ({ ...a, id: '', isDefault: true, createdAt: new Date() }));
      const isDefaultSet = items.length === 0;

      const signals: unknown[] = [];

      for (const item of sourceItems) {
        if (item.assetType === 'stock') {
          const signal = await aiTradingSignalsService.getSignalForCustomStock(item.symbol, item.assetName);
          if (signal) signals.push({ ...signal, watchlistId: item.id, isDefault: item.isDefault });
        } else if (item.coingeckoId) {
          const signal = await aiTradingSignalsService.getSignalForCustomAsset(item.coingeckoId, item.symbol, item.assetName);
          if (signal) signals.push({ ...signal, watchlistId: item.id, isDefault: item.isDefault });
        }
      }

      res.json({ success: true, signals, isDefault: isDefaultSet });
    } catch (error: any) {
      console.error('Get watchlist signals error:', error);
      res.status(500).json({ success: false, signals: [], error: error.message });
    }
  }));
}
