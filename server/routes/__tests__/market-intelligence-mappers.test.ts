import { describe, expect, it } from 'vitest';
import type { CryptoQuote } from '../../services/marketDataService';
import {
  buildMarketMovements,
  buildMarketSentiments,
  buildMarketSignals,
} from '../market-intelligence-mappers';

const quote: CryptoQuote = {
  symbol: 'BTC',
  name: 'Bitcoin',
  price: 100_000,
  percentChange24h: 4,
  percentChange7d: 7,
  percentChange30d: 12,
  marketCap: 2_000_000_000_000,
  volume24h: 30_000_000_000,
  rank: 1,
  lastUpdated: '2026-08-20T00:00:00.000Z',
};

describe('market intelligence CryptoQuote mapping', () => {
  it('maps typed top-crypto fields into a signal without invented cap growth', () => {
    const [signal] = buildMarketSignals(
      [quote],
      '2026-08-20T12:00:00.000Z',
    );
    expect(signal).toMatchObject({
      id: 'btc',
      asset: 'Bitcoin',
      price: 100_000,
      change24h: 4,
      type: 'bullish',
      timestamp: '2026-08-20T12:00:00.000Z',
    });
    expect(signal.reasoning).toContain('24 hours');
    expect(signal.reasoning).not.toContain('market cap growth');
  });

  it('derives market-cap movement from the real quote shape', () => {
    const [movement] = buildMarketMovements(
      [quote],
    );
    expect(movement).toMatchObject({
      type: 'market_cap_estimate',
      asset: 'BTC',
      amount: 20_000,
      amountUsd: 2_000_000_000,
      significance: 'medium',
      change24h: 4,
      provenance: {
        kind: 'synthetic_estimate',
        source: 'top_cryptos',
        observedOnChain: false,
      },
    });
    expect(movement).not.toHaveProperty('from');
    expect(movement).not.toHaveProperty('to');
  });

  it('clamps every derived sentiment score to 0..100', () => {
    const [sentiment] = buildMarketSentiments(
      [{ ...quote, percentChange24h: 50 }],
      () => 1,
    );
    expect(sentiment.overall).toBe(100);
    expect(sentiment.social).toBe(100);
    expect(sentiment.news).toBe(100);
    expect(sentiment.technical).toBe(100);
  });
});