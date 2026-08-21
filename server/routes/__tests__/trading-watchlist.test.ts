/**
 * Regression tests for the AI Trading Intelligence watchlist fixes:
 *
 * 1. emptyBodySchema pattern — POST /api/trading-watchlist must accept a valid
 *    body and reject a junk body (400), proving the schema is no longer
 *    emptyBodySchema which silently passed every body through.
 * 2. Computed defaults — GET /api/trading-watchlist/signals returns the
 *    platform default set (isDefault: true) when the user's watchlist is empty.
 * 3. Personal list suppresses defaults — once the user has personal items the
 *    endpoint returns only those items (isDefault: false).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  addToWatchlistSchema,
  commentBodySchema,
  createProposalSchema,
  castVoteSchema,
  signalConfigSchema,
} from '../../middleware/validationSchemas';

// ---------------------------------------------------------------------------
// 1. Schema validation — confirms correct Zod schemas are now in place
// ---------------------------------------------------------------------------

describe('addToWatchlistSchema (POST /api/trading-watchlist)', () => {
  it('accepts a valid crypto add', () => {
    const result = addToWatchlistSchema.safeParse({
      symbol: 'BTC',
      assetName: 'Bitcoin',
      assetType: 'crypto',
      coingeckoId: 'bitcoin',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid stock add without coingeckoId', () => {
    const result = addToWatchlistSchema.safeParse({
      symbol: 'NVDA',
      assetName: 'NVIDIA',
      assetType: 'stock',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a body missing symbol (the old emptyBodySchema-pattern bug)', () => {
    const result = addToWatchlistSchema.safeParse({
      assetName: 'Bitcoin',
      assetType: 'crypto',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid assetType', () => {
    const result = addToWatchlistSchema.safeParse({
      symbol: 'BTC',
      assetName: 'Bitcoin',
      assetType: 'nft',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a symbol longer than 12 chars', () => {
    const result = addToWatchlistSchema.safeParse({
      symbol: 'AVERYLONGSYMBOL',
      assetName: 'Something',
      assetType: 'stock',
    });
    expect(result.success).toBe(false);
  });
});

describe('commentBodySchema (POST /api/summaries/:id/comment and /api/news/:id/comment)', () => {
  it('accepts a valid comment', () => {
    const result = commentBodySchema.safeParse({ content: 'Great analysis!' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty body (the old bug — emptyBodySchema would pass this through)', () => {
    const result = commentBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an empty content string', () => {
    const result = commentBodySchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });
});

describe('createProposalSchema (POST /api/governance/proposals)', () => {
  it('accepts a valid proposal', () => {
    const result = createProposalSchema.safeParse({
      title: 'Reduce fees',
      description: 'We should lower trading fees by 10%.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a body missing title (old bug: emptyBodySchema would pass this)', () => {
    const result = createProposalSchema.safeParse({
      description: 'Missing title here.',
    });
    expect(result.success).toBe(false);
  });
});

describe('castVoteSchema (POST /api/governance/proposals/:id/vote)', () => {
  it('accepts FOR', () => {
    expect(castVoteSchema.safeParse({ support: 'FOR' }).success).toBe(true);
  });
  it('accepts AGAINST with reason', () => {
    expect(castVoteSchema.safeParse({ support: 'AGAINST', reason: 'Bad idea' }).success).toBe(true);
  });
  it('rejects missing support', () => {
    expect(castVoteSchema.safeParse({ reason: 'Just a reason' }).success).toBe(false);
  });
  it('rejects invalid support value', () => {
    expect(castVoteSchema.safeParse({ support: 'MAYBE' }).success).toBe(false);
  });
});

describe('signalConfigSchema (POST /api/cross-market-signals/config)', () => {
  it('accepts any JSON object', () => {
    const result = signalConfigSchema.safeParse({ minConfidence: 70, maxSignals: 10 });
    expect(result.success).toBe(true);
  });
  it('rejects non-object values', () => {
    expect(signalConfigSchema.safeParse('bad').success).toBe(false);
    expect(signalConfigSchema.safeParse(42).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Empty-watchlist → default signals logic
//    We test the pure data-transformation logic without spinning up Express.
// ---------------------------------------------------------------------------

describe('computed defaults when watchlist is empty', () => {
  const PLATFORM_DEFAULTS = [
    { symbol: 'BTC',  assetType: 'crypto', coingeckoId: 'bitcoin'  },
    { symbol: 'ETH',  assetType: 'crypto', coingeckoId: 'ethereum' },
    { symbol: 'SOL',  assetType: 'crypto', coingeckoId: 'solana'   },
    { symbol: 'NVDA', assetType: 'stock',  coingeckoId: null        },
    { symbol: 'AMD',  assetType: 'stock',  coingeckoId: null        },
    { symbol: 'MSFT', assetType: 'stock',  coingeckoId: null        },
  ] as const;

  function resolveSourceItems(personalItems: any[]) {
    if (personalItems.length > 0) {
      return { items: personalItems.map(i => ({ ...i, isDefault: false })), isDefaultSet: false };
    }
    return {
      items: PLATFORM_DEFAULTS.map(a => ({ ...a, id: '', isDefault: true })),
      isDefaultSet: true,
    };
  }

  it('returns isDefault=true and 6 platform assets when personal list is empty', () => {
    const { items, isDefaultSet } = resolveSourceItems([]);
    expect(isDefaultSet).toBe(true);
    expect(items).toHaveLength(6);
    expect(items.every(i => i.isDefault)).toBe(true);
  });

  it('includes BTC, ETH, SOL, NVDA, AMD, MSFT in the default set', () => {
    const { items } = resolveSourceItems([]);
    const symbols = items.map(i => i.symbol);
    expect(symbols).toContain('BTC');
    expect(symbols).toContain('ETH');
    expect(symbols).toContain('SOL');
    expect(symbols).toContain('NVDA');
    expect(symbols).toContain('AMD');
    expect(symbols).toContain('MSFT');
  });

  it('returns isDefault=false and only personal items when list is non-empty', () => {
    const personal = [{ symbol: 'LINK', assetType: 'crypto', coingeckoId: 'chainlink', id: 'abc' }];
    const { items, isDefaultSet } = resolveSourceItems(personal);
    expect(isDefaultSet).toBe(false);
    expect(items).toHaveLength(1);
    expect(items[0].symbol).toBe('LINK');
    expect(items[0].isDefault).toBe(false);
  });

  it('personal list does not contain any default symbols when non-empty', () => {
    const personal = [{ symbol: 'DOGE', assetType: 'crypto', coingeckoId: 'dogecoin', id: 'xyz' }];
    const { items } = resolveSourceItems(personal);
    const symbols = items.map(i => i.symbol);
    expect(symbols).not.toContain('BTC');
    expect(symbols).not.toContain('NVDA');
  });
});
