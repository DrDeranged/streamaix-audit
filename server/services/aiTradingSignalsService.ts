import OpenAI from 'openai';

const openai = new OpenAI();

export interface TradingAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  coingeckoId?: string;
  finnhubSymbol?: string;
}

export interface TradingSignal {
  asset: TradingAsset;
  currentPrice: number;
  priceChange24h: number;
  signalType: 'breakout' | 'bounce' | 'flush' | 'consolidation' | 'trend_continuation' | 'reversal';
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: { low: number; high: number };
  stopLoss: number;
  targets: { price: number; label: string }[];
  riskReward: string;
  timeframe: string;
  reasoning: string;
  keyLevels: { support: number; resistance: number };
  volumeAnalysis: string;
  generatedAt: string;
}

const TRACKED_ASSETS: TradingAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', coingeckoId: 'bitcoin' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', coingeckoId: 'solana' },
  { symbol: 'HYPE', name: 'Hyperliquid', type: 'crypto', coingeckoId: 'hyperliquid' },
  { symbol: 'ZEC', name: 'Zcash', type: 'crypto', coingeckoId: 'zcash' },
  { symbol: 'CIFR', name: 'Cipher Mining', type: 'stock', finnhubSymbol: 'CIFR' },
  { symbol: 'CORZ', name: 'Core Scientific', type: 'stock', finnhubSymbol: 'CORZ' },
  { symbol: 'HUT', name: 'Hut 8', type: 'stock', finnhubSymbol: 'HUT' },
  { symbol: 'GLXY', name: 'Galaxy Digital', type: 'stock', finnhubSymbol: 'GLXY.TO' },
  { symbol: 'COIN', name: 'Coinbase', type: 'stock', finnhubSymbol: 'COIN' },
];

const signalCache: Map<string, { signal: TradingSignal; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000;

async function fetchCryptoPrice(coingeckoId: string): Promise<{ price: number; change24h: number }> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      price: data[coingeckoId]?.usd || 0,
      change24h: data[coingeckoId]?.usd_24h_change || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch crypto price for ${coingeckoId}:`, error);
    return { price: 0, change24h: 0 };
  }
}

async function fetchStockPrice(symbol: string): Promise<{ price: number; change24h: number }> {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) {
      console.warn('Finnhub API key not configured');
      return { price: 0, change24h: 0 };
    }
    
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    const currentPrice = data.c || 0;
    const previousClose = data.pc || currentPrice;
    const change24h = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
    
    return { price: currentPrice, change24h };
  } catch (error) {
    console.error(`Failed to fetch stock price for ${symbol}:`, error);
    return { price: 0, change24h: 0 };
  }
}

async function generateAISignal(asset: TradingAsset, price: number, change24h: number): Promise<TradingSignal> {
  if (process.env.PAUSE_OPENAI_API === 'true') {
    return generateFallbackSignal(asset, price, change24h);
  }

  try {
    const prompt = `You are an expert technical analyst. Analyze ${asset.name} (${asset.symbol}) for a potential trading setup.

Current Price: $${price.toFixed(asset.type === 'crypto' ? 2 : 2)}
24h Change: ${change24h.toFixed(2)}%
Asset Type: ${asset.type === 'crypto' ? 'Cryptocurrency' : 'Stock (Bitcoin Mining/Crypto Related)'}

Generate a detailed trading signal analysis. Consider:
1. Recent price action and momentum
2. Key support and resistance levels
3. Volume implications
4. Risk/reward setup
5. Timeframe for the trade

Respond in this exact JSON format:
{
  "signalType": "breakout|bounce|flush|consolidation|trend_continuation|reversal",
  "direction": "bullish|bearish|neutral",
  "confidence": 65-95,
  "entry": { "low": number, "high": number },
  "stopLoss": number,
  "targets": [
    { "price": number, "label": "TP1" },
    { "price": number, "label": "TP2" },
    { "price": number, "label": "TP3" }
  ],
  "riskReward": "1:2.5",
  "timeframe": "4H|Daily|Weekly",
  "reasoning": "2-3 sentence explanation of the setup",
  "keyLevels": { "support": number, "resistance": number },
  "volumeAnalysis": "Brief volume observation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional trading analyst. Always provide realistic, actionable trading signals with proper risk management.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    return {
      asset,
      currentPrice: price,
      priceChange24h: change24h,
      signalType: analysis.signalType,
      direction: analysis.direction,
      confidence: analysis.confidence,
      entry: analysis.entry,
      stopLoss: analysis.stopLoss,
      targets: analysis.targets,
      riskReward: analysis.riskReward,
      timeframe: analysis.timeframe,
      reasoning: analysis.reasoning,
      keyLevels: analysis.keyLevels,
      volumeAnalysis: analysis.volumeAnalysis,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`AI signal generation failed for ${asset.symbol}:`, error);
    return generateFallbackSignal(asset, price, change24h);
  }
}

function generateFallbackSignal(asset: TradingAsset, price: number, change24h: number): TradingSignal {
  const isBullish = change24h > 0;
  const volatility = Math.abs(change24h);
  
  let signalType: TradingSignal['signalType'] = 'consolidation';
  if (volatility > 5) signalType = isBullish ? 'breakout' : 'flush';
  else if (volatility > 2) signalType = isBullish ? 'trend_continuation' : 'reversal';
  else if (volatility > 1) signalType = 'bounce';

  const stopDistance = price * 0.03;
  const targetMultiplier = isBullish ? 1 : -1;
  
  return {
    asset,
    currentPrice: price,
    priceChange24h: change24h,
    signalType,
    direction: isBullish ? 'bullish' : change24h < -1 ? 'bearish' : 'neutral',
    confidence: Math.min(85, 60 + volatility * 3),
    entry: {
      low: price * (isBullish ? 0.99 : 0.98),
      high: price * (isBullish ? 1.01 : 1.0),
    },
    stopLoss: price - (stopDistance * targetMultiplier),
    targets: [
      { price: price + (stopDistance * 1.5 * targetMultiplier), label: 'TP1' },
      { price: price + (stopDistance * 2.5 * targetMultiplier), label: 'TP2' },
      { price: price + (stopDistance * 4 * targetMultiplier), label: 'TP3' },
    ],
    riskReward: '1:2.5',
    timeframe: 'Daily',
    reasoning: `${asset.name} showing ${Math.abs(change24h).toFixed(1)}% ${isBullish ? 'gain' : 'decline'} over 24h. ${signalType.replace('_', ' ')} pattern identified with ${isBullish ? 'bullish' : 'bearish'} momentum.`,
    keyLevels: {
      support: price * 0.95,
      resistance: price * 1.05,
    },
    volumeAnalysis: `${volatility > 3 ? 'Elevated' : 'Normal'} volume activity detected`,
    generatedAt: new Date().toISOString(),
  };
}

export async function getSignalForAsset(symbol: string): Promise<TradingSignal | null> {
  const asset = TRACKED_ASSETS.find(a => a.symbol === symbol);
  if (!asset) return null;

  const cached = signalCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.signal;
  }

  let priceData: { price: number; change24h: number };
  
  if (asset.type === 'crypto' && asset.coingeckoId) {
    priceData = await fetchCryptoPrice(asset.coingeckoId);
  } else if (asset.type === 'stock' && asset.finnhubSymbol) {
    priceData = await fetchStockPrice(asset.finnhubSymbol);
  } else {
    return null;
  }

  if (priceData.price === 0) {
    return null;
  }

  const signal = await generateAISignal(asset, priceData.price, priceData.change24h);
  signalCache.set(symbol, { signal, timestamp: Date.now() });
  
  return signal;
}

export async function getAllSignals(): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  
  const cryptoAssets = TRACKED_ASSETS.filter(a => a.type === 'crypto');
  const stockAssets = TRACKED_ASSETS.filter(a => a.type === 'stock');

  const cryptoPrices = await Promise.all(
    cryptoAssets.map(async (asset) => {
      const cached = signalCache.get(asset.symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { asset, cached: cached.signal };
      }
      const price = await fetchCryptoPrice(asset.coingeckoId!);
      return { asset, price };
    })
  );

  const stockPrices = await Promise.all(
    stockAssets.map(async (asset) => {
      const cached = signalCache.get(asset.symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { asset, cached: cached.signal };
      }
      const price = await fetchStockPrice(asset.finnhubSymbol!);
      return { asset, price };
    })
  );

  for (const result of [...cryptoPrices, ...stockPrices]) {
    if ('cached' in result && result.cached) {
      signals.push(result.cached);
    } else if ('price' in result && result.price.price > 0) {
      const signal = await generateAISignal(result.asset, result.price.price, result.price.change24h);
      signalCache.set(result.asset.symbol, { signal, timestamp: Date.now() });
      signals.push(signal);
    }
  }

  return signals;
}

export function getTrackedAssets(): TradingAsset[] {
  return TRACKED_ASSETS;
}

export const aiTradingSignalsService = {
  getSignalForAsset,
  getAllSignals,
  getTrackedAssets,
};
