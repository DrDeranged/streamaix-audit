import type { CryptoQuote } from '../services/marketDataService';

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, value));

export function buildMarketSignals(
  quotes: CryptoQuote[],
  timestamp = new Date().toISOString(),
) {
  return quotes.slice(0, 10).map((coin) => {
    const change = coin.percentChange24h ?? 0;
    const type =
      change > 3 ? ('bullish' as const) :
      change < -3 ? ('bearish' as const) :
      ('neutral' as const);
    const strength = clamp(Math.abs(change) * 10);

    let signal: string;
    let reasoning: string;
    if (type === 'bullish') {
      signal = change > 8 ? 'Strong Buy Signal' : 'Momentum Building';
      reasoning = `${coin.name} is up ${change.toFixed(1)}% over 24 hours`;
    } else if (type === 'bearish') {
      signal = change < -8 ? 'Caution: Sharp Decline' : 'Short-term Weakness';
      reasoning = `${coin.name} is down ${Math.abs(change).toFixed(1)}% over 24 hours; watch support levels`;
    } else {
      signal = 'Consolidating';
      reasoning = `${coin.name} is trading within a narrow 24-hour range`;
    }

    return {
      id: coin.symbol.toLowerCase(),
      type,
      strength: Math.round(strength),
      asset: coin.name,
      price: coin.price,
      change24h: change,
      signal,
      reasoning,
      confidence: Math.round(clamp(60 + Math.abs(change) * 3, 0, 95)),
      timestamp,
    };
  });
}

export function buildMarketMovements(
  quotes: CryptoQuote[],
) {
  return quotes.slice(0, 5).map((coin, index) => {
    const change = Math.abs(coin.percentChange24h ?? 0);
    const significance =
      change > 5 ? ('high' as const) :
      change > 2 ? ('medium' as const) :
      ('low' as const);
    const amount =
      coin.price > 0 && coin.marketCap > 0
        ? Math.round((coin.marketCap / coin.price) * 0.001)
        : 0;

    return {
      id: `market-cap-estimate-${coin.symbol.toLowerCase()}-${index}`,
      type: 'market_cap_estimate' as const,
      asset: coin.symbol.toUpperCase(),
      amount,
      amountUsd: amount * coin.price,
      change24h: coin.percentChange24h ?? 0,
      timestamp: coin.lastUpdated,
      significance,
      provenance: {
        kind: 'synthetic_estimate' as const,
        source: 'top_cryptos' as const,
        methodology:
          '0.1% of implied circulating supply from market cap divided by price',
        observedOnChain: false,
      },
    };
  });
}

export function buildMarketSentiments(
  quotes: CryptoQuote[],
  random: () => number = Math.random,
) {
  return quotes.slice(0, 6).map((coin) => {
    const change = coin.percentChange24h ?? 0;
    const overall = clamp(50 + change * 5);
    const component = (spread: number) =>
      Math.round(clamp(overall + (random() - 0.5) * spread));

    return {
      asset: coin.name,
      overall: Math.round(overall),
      social: component(20),
      news: component(15),
      technical: component(10),
      trend:
        change > 2 ? ('rising' as const) :
        change < -2 ? ('falling' as const) :
        ('stable' as const),
    };
  });
}