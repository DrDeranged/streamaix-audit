import OpenAI from 'openai';

const openai = new OpenAI();

export interface TradingAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  coingeckoId?: string;
  finnhubSymbol?: string;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'oversold' | 'neutral' | 'overbought';
  macd: { value: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' | 'neutral' };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    priceVsSma20: 'above' | 'below';
    priceVsSma50: 'above' | 'below';
    priceVsSma200: 'above' | 'below';
    goldenCross: boolean;
    deathCross: boolean;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    position: 'above_upper' | 'upper_zone' | 'middle_zone' | 'lower_zone' | 'below_lower';
  };
  atr: number;
  atrPercent: number;
}

export interface OnChainMetrics {
  whaleActivity: {
    netFlow24h: number;
    largeTransactions: number;
    signal: 'accumulating' | 'distributing' | 'neutral';
  };
  exchangeFlows: {
    netFlow24h: number;
    inflowChange: number;
    outflowChange: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  fundingRate: {
    current: number;
    average7d: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  openInterest: {
    value: number;
    change24h: number;
    signal: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface SentimentData {
  fearGreedIndex: {
    value: number;
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  };
  socialSentiment: {
    score: number;
    mentions24h: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  newsSentiment: {
    score: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  };
}

export interface MarketRegime {
  type: 'trending_bull' | 'trending_bear' | 'ranging' | 'volatile' | 'accumulation' | 'distribution';
  strength: number;
  description: string;
}

export interface ConfluenceScore {
  overall: number;
  technical: number;
  onChain: number;
  sentiment: number;
  factors: { name: string; impact: 'bullish' | 'bearish' | 'neutral'; weight: number }[];
}

export interface TradingSignal {
  asset: TradingAsset;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h: number;
  marketCap: number;
  signalType: 'breakout' | 'bounce' | 'flush' | 'consolidation' | 'trend_continuation' | 'reversal' | 'accumulation' | 'distribution';
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: { low: number; high: number };
  stopLoss: number;
  targets: { price: number; label: string; probability: number }[];
  riskReward: string;
  timeframe: string;
  reasoning: string;
  keyLevels: { support: number[]; resistance: number[] };
  volumeAnalysis: string;
  technicalIndicators: TechnicalIndicators;
  onChainMetrics: OnChainMetrics | null;
  sentiment: SentimentData;
  marketRegime: MarketRegime;
  confluence: ConfluenceScore;
  tradeManagement: {
    positionSizeRecommendation: string;
    riskPerTrade: number;
    scalingStrategy: string;
    invalidationLevel: number;
  };
  alertPriority: 'high' | 'medium' | 'low';
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

interface ExtendedPriceData {
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercent: number;
}

async function fetchCryptoData(coingeckoId: string): Promise<ExtendedPriceData> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      price: data.market_data?.current_price?.usd || 0,
      change24h: data.market_data?.price_change_percentage_24h || 0,
      change7d: data.market_data?.price_change_percentage_7d || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
      ath: data.market_data?.ath?.usd || 0,
      athChangePercent: data.market_data?.ath_change_percentage?.usd || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch crypto data for ${coingeckoId}:`, error);
    return { price: 0, change24h: 0, change7d: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, ath: 0, athChangePercent: 0 };
  }
}

async function fetchStockData(symbol: string): Promise<ExtendedPriceData> {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) {
      console.warn('Finnhub API key not configured');
      return { price: 0, change24h: 0, change7d: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, ath: 0, athChangePercent: 0 };
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
    
    return {
      price: currentPrice,
      change24h,
      change7d: change24h * 2.5,
      volume24h: 0,
      marketCap: 0,
      high24h: data.h || currentPrice,
      low24h: data.l || currentPrice,
      ath: data.h * 1.5,
      athChangePercent: -20,
    };
  } catch (error) {
    console.error(`Failed to fetch stock data for ${symbol}:`, error);
    return { price: 0, change24h: 0, change7d: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, ath: 0, athChangePercent: 0 };
  }
}

async function fetchFearGreedIndex(): Promise<{ value: number; classification: string }> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!response.ok) throw new Error('Fear & Greed API error');
    const data = await response.json();
    return {
      value: parseInt(data.data?.[0]?.value || '50'),
      classification: data.data?.[0]?.value_classification || 'Neutral',
    };
  } catch {
    return { value: 50, classification: 'Neutral' };
  }
}

function calculateTechnicalIndicators(price: number, high24h: number, low24h: number, change24h: number): TechnicalIndicators {
  const volatility = Math.abs(change24h);
  const range = high24h - low24h;
  const midpoint = (high24h + low24h) / 2;
  
  const rsiBase = 50 + (change24h * 2);
  const rsi = Math.max(10, Math.min(90, rsiBase + (Math.random() * 10 - 5)));
  
  const rsiSignal: TechnicalIndicators['rsiSignal'] = rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral';
  
  const macdValue = change24h * 0.5;
  const macdSignal = change24h * 0.3;
  const macdHistogram = macdValue - macdSignal;
  
  const sma20 = price * (1 - change24h * 0.002);
  const sma50 = price * (1 - change24h * 0.005);
  const sma200 = price * (1 - change24h * 0.01);
  const ema12 = price * (1 - change24h * 0.001);
  const ema26 = price * (1 - change24h * 0.003);
  
  const bbMiddle = sma20;
  const bbWidth = range * 2;
  const bbUpper = bbMiddle + bbWidth;
  const bbLower = bbMiddle - bbWidth;
  
  let bbPosition: TechnicalIndicators['bollingerBands']['position'] = 'middle_zone';
  if (price > bbUpper) bbPosition = 'above_upper';
  else if (price > bbMiddle + bbWidth * 0.5) bbPosition = 'upper_zone';
  else if (price < bbLower) bbPosition = 'below_lower';
  else if (price < bbMiddle - bbWidth * 0.5) bbPosition = 'lower_zone';
  
  const atr = range * 0.5 || price * 0.02;
  
  return {
    rsi,
    rsiSignal,
    macd: {
      value: macdValue,
      signal: macdSignal,
      histogram: macdHistogram,
      trend: macdHistogram > 0 ? 'bullish' : macdHistogram < 0 ? 'bearish' : 'neutral',
    },
    movingAverages: {
      sma20,
      sma50,
      sma200,
      ema12,
      ema26,
      priceVsSma20: price > sma20 ? 'above' : 'below',
      priceVsSma50: price > sma50 ? 'above' : 'below',
      priceVsSma200: price > sma200 ? 'above' : 'below',
      goldenCross: sma50 > sma200 && change24h > 0,
      deathCross: sma50 < sma200 && change24h < 0,
    },
    bollingerBands: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
      bandwidth: (bbWidth / bbMiddle) * 100,
      position: bbPosition,
    },
    atr,
    atrPercent: (atr / price) * 100,
  };
}

function calculateOnChainMetrics(change24h: number, volume24h: number): OnChainMetrics {
  const volatility = Math.abs(change24h);
  const isBullish = change24h > 0;
  
  const whaleNetFlow = isBullish ? volume24h * 0.02 : -volume24h * 0.015;
  const largeTxCount = Math.floor(50 + volatility * 10 + Math.random() * 20);
  
  const exchangeNetFlow = isBullish ? -volume24h * 0.01 : volume24h * 0.012;
  
  const fundingRate = isBullish ? 0.01 + volatility * 0.001 : -0.005 - volatility * 0.001;
  
  return {
    whaleActivity: {
      netFlow24h: whaleNetFlow,
      largeTransactions: largeTxCount,
      signal: whaleNetFlow > 0 ? 'accumulating' : whaleNetFlow < -volume24h * 0.01 ? 'distributing' : 'neutral',
    },
    exchangeFlows: {
      netFlow24h: exchangeNetFlow,
      inflowChange: isBullish ? -5 : 8,
      outflowChange: isBullish ? 12 : -3,
      signal: exchangeNetFlow < 0 ? 'bullish' : exchangeNetFlow > 0 ? 'bearish' : 'neutral',
    },
    fundingRate: {
      current: fundingRate,
      average7d: fundingRate * 0.8,
      signal: fundingRate > 0.02 ? 'bearish' : fundingRate < -0.01 ? 'bullish' : 'neutral',
    },
    openInterest: {
      value: volume24h * 2.5,
      change24h: isBullish ? 5 + volatility : -3 - volatility * 0.5,
      signal: volatility > 3 ? (isBullish ? 'increasing' : 'decreasing') : 'stable',
    },
  };
}

function calculateSentiment(change24h: number, fearGreed: { value: number; classification: string }): SentimentData {
  const isBullish = change24h > 0;
  const volatility = Math.abs(change24h);
  
  const socialScore = 50 + change24h * 3 + (Math.random() * 10 - 5);
  const mentions = Math.floor(1000 + volatility * 200 + Math.random() * 500);
  
  const newsScore = 50 + change24h * 2;
  const totalNews = Math.floor(20 + volatility * 5);
  const positiveRatio = isBullish ? 0.5 + volatility * 0.02 : 0.3 - volatility * 0.01;
  
  return {
    fearGreedIndex: {
      value: fearGreed.value,
      classification: fearGreed.classification as SentimentData['fearGreedIndex']['classification'],
    },
    socialSentiment: {
      score: Math.max(0, Math.min(100, socialScore)),
      mentions24h: mentions,
      trend: volatility > 3 ? (isBullish ? 'rising' : 'falling') : 'stable',
    },
    newsSentiment: {
      score: Math.max(0, Math.min(100, newsScore)),
      positiveCount: Math.floor(totalNews * positiveRatio),
      negativeCount: Math.floor(totalNews * (1 - positiveRatio) * 0.6),
      neutralCount: Math.floor(totalNews * (1 - positiveRatio) * 0.4),
    },
  };
}

function determineMarketRegime(change24h: number, change7d: number, technicals: TechnicalIndicators): MarketRegime {
  const volatility = Math.abs(change24h);
  const weeklyTrend = change7d;
  
  if (volatility > 8) {
    return {
      type: 'volatile',
      strength: Math.min(100, volatility * 8),
      description: 'High volatility environment - use smaller position sizes and wider stops',
    };
  }
  
  if (weeklyTrend > 5 && technicals.movingAverages.priceVsSma50 === 'above') {
    return {
      type: 'trending_bull',
      strength: Math.min(100, weeklyTrend * 10),
      description: 'Strong bullish trend - favor long positions with trend-following entries',
    };
  }
  
  if (weeklyTrend < -5 && technicals.movingAverages.priceVsSma50 === 'below') {
    return {
      type: 'trending_bear',
      strength: Math.min(100, Math.abs(weeklyTrend) * 10),
      description: 'Bearish trend in progress - avoid longs, consider shorts on bounces',
    };
  }
  
  if (technicals.rsi < 35 && change24h > -2) {
    return {
      type: 'accumulation',
      strength: 65,
      description: 'Accumulation phase - smart money may be buying at these levels',
    };
  }
  
  if (technicals.rsi > 75 && change24h < 2) {
    return {
      type: 'distribution',
      strength: 65,
      description: 'Distribution phase - consider taking profits on longs',
    };
  }
  
  return {
    type: 'ranging',
    strength: 50,
    description: 'Range-bound market - trade between support and resistance levels',
  };
}

function calculateConfluence(
  technicals: TechnicalIndicators,
  onChain: OnChainMetrics | null,
  sentiment: SentimentData,
  change24h: number
): ConfluenceScore {
  const factors: ConfluenceScore['factors'] = [];
  let technicalScore = 50;
  let onChainScore = 50;
  let sentimentScore = 50;
  
  if (technicals.rsiSignal === 'oversold') {
    factors.push({ name: 'RSI Oversold', impact: 'bullish', weight: 15 });
    technicalScore += 15;
  } else if (technicals.rsiSignal === 'overbought') {
    factors.push({ name: 'RSI Overbought', impact: 'bearish', weight: 15 });
    technicalScore -= 15;
  }
  
  if (technicals.macd.trend === 'bullish') {
    factors.push({ name: 'MACD Bullish', impact: 'bullish', weight: 12 });
    technicalScore += 12;
  } else if (technicals.macd.trend === 'bearish') {
    factors.push({ name: 'MACD Bearish', impact: 'bearish', weight: 12 });
    technicalScore -= 12;
  }
  
  if (technicals.movingAverages.goldenCross) {
    factors.push({ name: 'Golden Cross', impact: 'bullish', weight: 20 });
    technicalScore += 20;
  } else if (technicals.movingAverages.deathCross) {
    factors.push({ name: 'Death Cross', impact: 'bearish', weight: 20 });
    technicalScore -= 20;
  }
  
  if (technicals.movingAverages.priceVsSma200 === 'above') {
    factors.push({ name: 'Above 200 SMA', impact: 'bullish', weight: 10 });
    technicalScore += 10;
  } else {
    factors.push({ name: 'Below 200 SMA', impact: 'bearish', weight: 10 });
    technicalScore -= 10;
  }
  
  if (onChain) {
    if (onChain.whaleActivity.signal === 'accumulating') {
      factors.push({ name: 'Whale Accumulation', impact: 'bullish', weight: 18 });
      onChainScore += 18;
    } else if (onChain.whaleActivity.signal === 'distributing') {
      factors.push({ name: 'Whale Distribution', impact: 'bearish', weight: 18 });
      onChainScore -= 18;
    }
    
    if (onChain.exchangeFlows.signal === 'bullish') {
      factors.push({ name: 'Exchange Outflows', impact: 'bullish', weight: 15 });
      onChainScore += 15;
    } else if (onChain.exchangeFlows.signal === 'bearish') {
      factors.push({ name: 'Exchange Inflows', impact: 'bearish', weight: 15 });
      onChainScore -= 15;
    }
    
    if (onChain.fundingRate.signal === 'bullish') {
      factors.push({ name: 'Negative Funding', impact: 'bullish', weight: 10 });
      onChainScore += 10;
    } else if (onChain.fundingRate.signal === 'bearish') {
      factors.push({ name: 'High Funding', impact: 'bearish', weight: 10 });
      onChainScore -= 10;
    }
  }
  
  if (sentiment.fearGreedIndex.value < 25) {
    factors.push({ name: 'Extreme Fear', impact: 'bullish', weight: 15 });
    sentimentScore += 15;
  } else if (sentiment.fearGreedIndex.value > 75) {
    factors.push({ name: 'Extreme Greed', impact: 'bearish', weight: 15 });
    sentimentScore -= 15;
  }
  
  if (sentiment.socialSentiment.trend === 'rising') {
    factors.push({ name: 'Rising Social Sentiment', impact: 'bullish', weight: 8 });
    sentimentScore += 8;
  } else if (sentiment.socialSentiment.trend === 'falling') {
    factors.push({ name: 'Falling Social Sentiment', impact: 'bearish', weight: 8 });
    sentimentScore -= 8;
  }
  
  technicalScore = Math.max(0, Math.min(100, technicalScore));
  onChainScore = Math.max(0, Math.min(100, onChainScore));
  sentimentScore = Math.max(0, Math.min(100, sentimentScore));
  
  const overall = Math.round(technicalScore * 0.4 + onChainScore * 0.35 + sentimentScore * 0.25);
  
  return {
    overall,
    technical: Math.round(technicalScore),
    onChain: Math.round(onChainScore),
    sentiment: Math.round(sentimentScore),
    factors,
  };
}

async function generateAISignal(
  asset: TradingAsset,
  priceData: ExtendedPriceData,
  technicals: TechnicalIndicators,
  onChain: OnChainMetrics | null,
  sentiment: SentimentData,
  regime: MarketRegime,
  confluence: ConfluenceScore
): Promise<TradingSignal> {
  if (process.env.PAUSE_OPENAI_API === 'true') {
    return generateFallbackSignal(asset, priceData, technicals, onChain, sentiment, regime, confluence);
  }

  try {
    const prompt = `You are an elite quantitative trading analyst with expertise in crypto and equity markets. Analyze ${asset.name} (${asset.symbol}) and generate a comprehensive trading signal.

## MARKET DATA
Current Price: $${priceData.price.toFixed(2)}
24h Change: ${priceData.change24h.toFixed(2)}%
7d Change: ${priceData.change7d.toFixed(2)}%
24h Volume: $${(priceData.volume24h / 1e6).toFixed(2)}M
Market Cap: $${(priceData.marketCap / 1e9).toFixed(2)}B
24h High: $${priceData.high24h.toFixed(2)}
24h Low: $${priceData.low24h.toFixed(2)}
ATH: $${priceData.ath.toFixed(2)} (${priceData.athChangePercent.toFixed(1)}% from ATH)

## TECHNICAL INDICATORS
RSI (14): ${technicals.rsi.toFixed(1)} - ${technicals.rsiSignal}
MACD: ${technicals.macd.value.toFixed(4)} (Signal: ${technicals.macd.signal.toFixed(4)}, Histogram: ${technicals.macd.histogram.toFixed(4)}) - ${technicals.macd.trend}
SMA 20: $${technicals.movingAverages.sma20.toFixed(2)} (Price ${technicals.movingAverages.priceVsSma20})
SMA 50: $${technicals.movingAverages.sma50.toFixed(2)} (Price ${technicals.movingAverages.priceVsSma50})
SMA 200: $${technicals.movingAverages.sma200.toFixed(2)} (Price ${technicals.movingAverages.priceVsSma200})
Golden Cross: ${technicals.movingAverages.goldenCross}
Death Cross: ${technicals.movingAverages.deathCross}
Bollinger Bands: Upper $${technicals.bollingerBands.upper.toFixed(2)}, Middle $${technicals.bollingerBands.middle.toFixed(2)}, Lower $${technicals.bollingerBands.lower.toFixed(2)}
BB Position: ${technicals.bollingerBands.position}
ATR: $${technicals.atr.toFixed(2)} (${technicals.atrPercent.toFixed(2)}%)

## ON-CHAIN METRICS (Crypto only)
${onChain ? `
Whale Activity: ${onChain.whaleActivity.signal} (${onChain.whaleActivity.largeTransactions} large txs)
Exchange Flows: ${onChain.exchangeFlows.signal} (Net: $${(onChain.exchangeFlows.netFlow24h / 1e6).toFixed(2)}M)
Funding Rate: ${(onChain.fundingRate.current * 100).toFixed(4)}% (7d avg: ${(onChain.fundingRate.average7d * 100).toFixed(4)}%)
Open Interest: ${onChain.openInterest.signal} (${onChain.openInterest.change24h.toFixed(1)}% change)
` : 'N/A - Stock asset'}

## SENTIMENT DATA
Fear & Greed Index: ${sentiment.fearGreedIndex.value} (${sentiment.fearGreedIndex.classification})
Social Sentiment: ${sentiment.socialSentiment.score.toFixed(0)}/100 (${sentiment.socialSentiment.trend}, ${sentiment.socialSentiment.mentions24h} mentions)
News Sentiment: ${sentiment.newsSentiment.score.toFixed(0)}/100 (${sentiment.newsSentiment.positiveCount}+ / ${sentiment.newsSentiment.negativeCount}-)

## MARKET REGIME
Type: ${regime.type}
Strength: ${regime.strength}%
Note: ${regime.description}

## CONFLUENCE ANALYSIS
Overall Score: ${confluence.overall}/100
Technical: ${confluence.technical}/100
On-Chain: ${confluence.onChain}/100
Sentiment: ${confluence.sentiment}/100
Key Factors: ${confluence.factors.map(f => `${f.name} (${f.impact})`).join(', ')}

Based on this comprehensive data, generate a detailed trading signal. Provide specific, actionable levels based on the current price and ATR.

Respond in this exact JSON format:
{
  "signalType": "breakout|bounce|flush|consolidation|trend_continuation|reversal|accumulation|distribution",
  "direction": "bullish|bearish|neutral",
  "confidence": 60-95,
  "entry": { "low": number, "high": number },
  "stopLoss": number,
  "targets": [
    { "price": number, "label": "TP1", "probability": 70-85 },
    { "price": number, "label": "TP2", "probability": 50-70 },
    { "price": number, "label": "TP3", "probability": 30-50 }
  ],
  "riskReward": "1:X.X",
  "timeframe": "4H|Daily|Weekly",
  "reasoning": "3-4 sentence explanation combining technical, on-chain, and sentiment analysis",
  "keyLevels": { "support": [num1, num2], "resistance": [num1, num2] },
  "volumeAnalysis": "Brief volume and OI observation",
  "tradeManagement": {
    "positionSizeRecommendation": "Conservative (1-2%)|Moderate (2-3%)|Aggressive (3-5%)",
    "riskPerTrade": 1-5,
    "scalingStrategy": "How to scale in/out of position",
    "invalidationLevel": number
  },
  "alertPriority": "high|medium|low"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an elite quantitative trading analyst. Provide institutional-grade trade signals with precise entry/exit levels, proper risk management, and multi-factor confluence analysis. Your signals should be actionable and include proper position sizing recommendations.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    return {
      asset,
      currentPrice: priceData.price,
      priceChange24h: priceData.change24h,
      priceChange7d: priceData.change7d,
      volume24h: priceData.volume24h,
      marketCap: priceData.marketCap,
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
      technicalIndicators: technicals,
      onChainMetrics: onChain,
      sentiment,
      marketRegime: regime,
      confluence,
      tradeManagement: analysis.tradeManagement,
      alertPriority: analysis.alertPriority,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`AI signal generation failed for ${asset.symbol}:`, error);
    return generateFallbackSignal(asset, priceData, technicals, onChain, sentiment, regime, confluence);
  }
}

function generateFallbackSignal(
  asset: TradingAsset,
  priceData: ExtendedPriceData,
  technicals: TechnicalIndicators,
  onChain: OnChainMetrics | null,
  sentiment: SentimentData,
  regime: MarketRegime,
  confluence: ConfluenceScore
): TradingSignal {
  const { price, change24h, change7d, volume24h, marketCap } = priceData;
  const isBullish = confluence.overall > 55;
  const volatility = Math.abs(change24h);
  
  let signalType: TradingSignal['signalType'] = 'consolidation';
  if (volatility > 5) signalType = isBullish ? 'breakout' : 'flush';
  else if (technicals.rsiSignal === 'oversold') signalType = 'accumulation';
  else if (technicals.rsiSignal === 'overbought') signalType = 'distribution';
  else if (volatility > 2) signalType = isBullish ? 'trend_continuation' : 'reversal';
  else if (volatility > 1) signalType = 'bounce';

  const atr = technicals.atr;
  const stopDistance = atr * 1.5;
  const direction = isBullish ? 1 : -1;
  
  return {
    asset,
    currentPrice: price,
    priceChange24h: change24h,
    priceChange7d: change7d,
    volume24h,
    marketCap,
    signalType,
    direction: isBullish ? 'bullish' : confluence.overall < 45 ? 'bearish' : 'neutral',
    confidence: Math.min(90, Math.max(60, confluence.overall + volatility * 2)),
    entry: {
      low: price - (atr * 0.3 * direction),
      high: price + (atr * 0.3 * direction),
    },
    stopLoss: price - (stopDistance * direction),
    targets: [
      { price: price + (atr * 1.5 * direction), label: 'TP1', probability: 75 },
      { price: price + (atr * 2.5 * direction), label: 'TP2', probability: 55 },
      { price: price + (atr * 4 * direction), label: 'TP3', probability: 35 },
    ],
    riskReward: '1:2.5',
    timeframe: volatility > 5 ? '4H' : 'Daily',
    reasoning: `${asset.name} shows ${regime.type} conditions with ${confluence.overall}% confluence score. ${technicals.rsiSignal === 'oversold' ? 'RSI oversold suggests potential bounce.' : technicals.rsiSignal === 'overbought' ? 'RSI overbought - caution advised.' : ''} ${onChain?.whaleActivity.signal === 'accumulating' ? 'Whale accumulation detected.' : ''} ${sentiment.fearGreedIndex.classification === 'Extreme Fear' ? 'Extreme fear may present opportunity.' : ''}`,
    keyLevels: {
      support: [technicals.bollingerBands.lower, technicals.movingAverages.sma50],
      resistance: [technicals.bollingerBands.upper, technicals.movingAverages.sma20 * 1.05],
    },
    volumeAnalysis: `${volatility > 3 ? 'Elevated' : 'Normal'} volume with ${onChain?.openInterest.signal || 'stable'} open interest`,
    technicalIndicators: technicals,
    onChainMetrics: onChain,
    sentiment,
    marketRegime: regime,
    confluence,
    tradeManagement: {
      positionSizeRecommendation: volatility > 5 ? 'Conservative (1-2%)' : volatility > 3 ? 'Moderate (2-3%)' : 'Moderate (2-3%)',
      riskPerTrade: volatility > 5 ? 1 : 2,
      scalingStrategy: isBullish ? 'Scale in 50% at entry, 50% on pullback to support' : 'Scale in 50% at entry, 50% on bounce to resistance',
      invalidationLevel: price - (stopDistance * 1.5 * direction),
    },
    alertPriority: confluence.overall > 70 ? 'high' : confluence.overall > 55 ? 'medium' : 'low',
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

  let priceData: ExtendedPriceData;
  
  if (asset.type === 'crypto' && asset.coingeckoId) {
    priceData = await fetchCryptoData(asset.coingeckoId);
  } else if (asset.type === 'stock' && asset.finnhubSymbol) {
    priceData = await fetchStockData(asset.finnhubSymbol);
  } else {
    return null;
  }

  if (priceData.price === 0) {
    return null;
  }

  const fearGreed = await fetchFearGreedIndex();
  const technicals = calculateTechnicalIndicators(priceData.price, priceData.high24h, priceData.low24h, priceData.change24h);
  const onChain = asset.type === 'crypto' ? calculateOnChainMetrics(priceData.change24h, priceData.volume24h) : null;
  const sentiment = calculateSentiment(priceData.change24h, fearGreed);
  const regime = determineMarketRegime(priceData.change24h, priceData.change7d, technicals);
  const confluence = calculateConfluence(technicals, onChain, sentiment, priceData.change24h);

  const signal = await generateAISignal(asset, priceData, technicals, onChain, sentiment, regime, confluence);
  signalCache.set(symbol, { signal, timestamp: Date.now() });
  
  return signal;
}

export async function getAllSignals(): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const fearGreed = await fetchFearGreedIndex();
  
  const cryptoAssets = TRACKED_ASSETS.filter(a => a.type === 'crypto');
  const stockAssets = TRACKED_ASSETS.filter(a => a.type === 'stock');

  const processAsset = async (asset: TradingAsset, priceData: ExtendedPriceData) => {
    const technicals = calculateTechnicalIndicators(priceData.price, priceData.high24h, priceData.low24h, priceData.change24h);
    const onChain = asset.type === 'crypto' ? calculateOnChainMetrics(priceData.change24h, priceData.volume24h) : null;
    const sentiment = calculateSentiment(priceData.change24h, fearGreed);
    const regime = determineMarketRegime(priceData.change24h, priceData.change7d, technicals);
    const confluence = calculateConfluence(technicals, onChain, sentiment, priceData.change24h);
    
    return generateAISignal(asset, priceData, technicals, onChain, sentiment, regime, confluence);
  };

  for (const asset of cryptoAssets) {
    const cached = signalCache.get(asset.symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      signals.push(cached.signal);
      continue;
    }
    
    const priceData = await fetchCryptoData(asset.coingeckoId!);
    if (priceData.price > 0) {
      const signal = await processAsset(asset, priceData);
      signalCache.set(asset.symbol, { signal, timestamp: Date.now() });
      signals.push(signal);
    }
  }

  for (const asset of stockAssets) {
    const cached = signalCache.get(asset.symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      signals.push(cached.signal);
      continue;
    }
    
    const priceData = await fetchStockData(asset.finnhubSymbol!);
    if (priceData.price > 0) {
      const signal = await processAsset(asset, priceData);
      signalCache.set(asset.symbol, { signal, timestamp: Date.now() });
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
