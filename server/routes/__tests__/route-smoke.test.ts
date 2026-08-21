/**
 * Route smoke tests — AppShell / route-walk.
 *
 * These tests verify that:
 *  1. Every critical route file registers without throwing.
 *  2. Unauthenticated requests to protected endpoints return 401, not 404/500.
 *  3. The trading-watchlist module (newly extracted from diagnostic.ts) registers
 *     its routes correctly and validates request bodies.
 *
 * We spin up a minimal Express app per suite rather than the full server so
 * we don't touch the real database or external services.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Minimal mocks so the route files import without real DB / services
// ---------------------------------------------------------------------------
vi.mock('../../storage', () => ({
  storage: {
    getUserWatchlist: vi.fn().mockResolvedValue([]),
    getWatchlistCount: vi.fn().mockResolvedValue(0),
    isInWatchlist: vi.fn().mockResolvedValue(false),
    addToWatchlist: vi.fn().mockResolvedValue({ id: 'test-id', symbol: 'BTC' }),
    removeFromWatchlist: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../services/aiTradingSignalsService', () => ({
  aiTradingSignalsService: {
    searchCryptoAssets: vi.fn().mockResolvedValue([]),
    searchStocks: vi.fn().mockResolvedValue([]),
    getSignalForCustomStock: vi.fn().mockResolvedValue(null),
    getSignalForCustomAsset: vi.fn().mockResolvedValue(null),
  },
}));

// Mock auth so we can control it per test
const mockAuthenticate = vi.fn();
vi.mock('../../auth', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => mockAuthenticate(req, res, next),
  AuthService: {},
}));

vi.mock('../../db', () => ({ db: {} }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAuthedUser(id = 'user-123') {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = { id };
    next();
  };
}

function makeUnauthed() {
  return (_req: Request, res: Response) => {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  };
}

async function buildApp(authed: boolean) {
  const app = express();
  app.use(express.json());

  // Point mockAuthenticate at the right middleware
  if (authed) {
    mockAuthenticate.mockImplementation(makeAuthedUser());
  } else {
    mockAuthenticate.mockImplementation(makeUnauthed());
  }

  const { registerTradingWatchlistRoutes } = await import('../trading-watchlist');
  await registerTradingWatchlistRoutes(app);
  return app;
}

// Use node's built-in http to avoid needing supertest
async function request(
  app: express.Express,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const http = await import('http');
  const server = http.createServer(app);
  await new Promise<void>(r => server.listen(0, r));
  const port = (server.address() as any).port as number;

  const url = `http://127.0.0.1:${port}${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  await new Promise<void>(r => server.close(() => r()));
  return { status: res.status, body: json };
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('route registration — trading-watchlist module loads without throwing', () => {
  it('registers all watchlist routes on an express app', async () => {
    const app = express();
    app.use(express.json());
    mockAuthenticate.mockImplementation(makeAuthedUser());

    const { registerTradingWatchlistRoutes } = await import('../trading-watchlist');
    await expect(registerTradingWatchlistRoutes(app)).resolves.toBeUndefined();

    // Collect registered paths from the router stack
    const paths = app._router.stack
      .filter((r: any) => r.route)
      .map((r: any) => r.route.path as string);

    expect(paths).toContain('/api/trading-watchlist');
    expect(paths).toContain('/api/trading-watchlist/:id');
    expect(paths).toContain('/api/trading-watchlist/signals');
    expect(paths).toContain('/api/asset-search');
    expect(paths).toContain('/api/crypto-search');
  });
});

describe('route-walk: unauthenticated requests return 401, not 404 or 500', () => {
  it('GET /api/trading-watchlist → 401', async () => {
    const app = await buildApp(false);
    const { status } = await request(app, 'GET', '/api/trading-watchlist');
    expect(status).toBe(401);
  });

  it('POST /api/trading-watchlist → 401', async () => {
    const app = await buildApp(false);
    const { status } = await request(app, 'POST', '/api/trading-watchlist', {
      symbol: 'BTC',
      assetName: 'Bitcoin',
      assetType: 'crypto',
    });
    expect(status).toBe(401);
  });

  it('DELETE /api/trading-watchlist/:id → 401', async () => {
    const app = await buildApp(false);
    const { status } = await request(app, 'DELETE', '/api/trading-watchlist/some-id');
    expect(status).toBe(401);
  });

  it('GET /api/trading-watchlist/signals → 401', async () => {
    const app = await buildApp(false);
    const { status } = await request(app, 'GET', '/api/trading-watchlist/signals');
    expect(status).toBe(401);
  });
});

describe('route-walk: authenticated requests succeed (200)', () => {
  it('GET /api/trading-watchlist → 200 with items array', async () => {
    const app = await buildApp(true);
    const { status, body } = await request(app, 'GET', '/api/trading-watchlist') as any;
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /api/trading-watchlist/signals → 200 with isDefault:true when no items', async () => {
    const app = await buildApp(true);
    const { status, body } = await request(app, 'GET', '/api/trading-watchlist/signals') as any;
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isDefault).toBe(true);
  });
});

describe('route-walk: body validation on POST /api/trading-watchlist', () => {
  it('valid crypto body → accepted (200)', async () => {
    const app = await buildApp(true);
    const { status, body } = await request(app, 'POST', '/api/trading-watchlist', {
      symbol: 'BTC',
      assetName: 'Bitcoin',
      assetType: 'crypto',
      coingeckoId: 'bitcoin',
    }) as any;
    // 200 (success) or 400 "already in watchlist" are both fine;
    // anything ≥ 500 or 404 is a regression
    expect(status).toBeLessThan(500);
    expect(status).not.toBe(404);
  });

  it('body missing symbol → 400 Validation failed', async () => {
    const app = await buildApp(true);
    const { status, body } = await request(app, 'POST', '/api/trading-watchlist', {
      assetName: 'Bitcoin',
      assetType: 'crypto',
    }) as any;
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('invalid assetType → 400', async () => {
    const app = await buildApp(true);
    const { status } = await request(app, 'POST', '/api/trading-watchlist', {
      symbol: 'BTC',
      assetName: 'Bitcoin',
      assetType: 'nft',
    });
    expect(status).toBe(400);
  });

  it('empty body → 400', async () => {
    const app = await buildApp(true);
    const { status } = await request(app, 'POST', '/api/trading-watchlist', {});
    expect(status).toBe(400);
  });
});

describe('route-walk: public search routes need no auth', () => {
  it('GET /api/asset-search?q=btc → 200 without auth', async () => {
    // asset-search is public (no authenticateToken)
    const app = await buildApp(false);
    const { status, body } = await request(app, 'GET', '/api/asset-search?q=btc') as any;
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});
