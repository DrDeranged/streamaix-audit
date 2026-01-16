import { marketDataService } from './marketDataService';
import { stockMarketService } from './stockMarketService';
import { db } from '../db';
import { predictionMarkets } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface MarketHighlight {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  isPositive: boolean;
}

export interface StockHighlight {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  sector: string;
}

export interface HotMarket {
  question: string;
  yesPercent: number;
  volume: number;
  traders: number;
}

export interface UpcomingStream {
  title: string;
  time: string;
  emoji: string;
}

export interface NewsletterContent {
  subject: string;
  marketHighlights: MarketHighlight[];
  topGainers: MarketHighlight[];
  topLosers: MarketHighlight[];
  stockGainers: StockHighlight[];
  stockLosers: StockHighlight[];
  marketSummary: string;
  alphaInsight: string;
  totalMarketCap: string;
  btcDominance: string;
  btcPrice: number;
  btcChange: number;
  ethPrice: number;
  ethChange: number;
  spyPrice: number;
  spyChange: number;
  fearGreedIndex: number;
  hotMarkets: HotMarket[];
  upcomingStreams: UpcomingStream[];
  newsStories: Array<{
    title: string;
    url: string;
    source: string;
    published: string;
  }>;
}

const MEME_COIN_PATTERNS = [
  'inu', 'shib', 'doge', 'pepe', 'elon', 'floki', 'baby', 
  'moon', 'safe', 'rocket', 'meme', 'wojak', 'chad', 
  'bonk', 'bome', 'wif', 'pepe2', 'dogelon'
];

function isMemeCoin(name: string, symbol: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();
  return MEME_COIN_PATTERNS.some(pattern => 
    lowerName.includes(pattern) || lowerSymbol.includes(pattern)
  );
}

function calculateRelevanceScore(coin: any): number {
  const marketCapWeight = Math.log10(coin.marketCap || 1);
  const volumeWeight = Math.log10(coin.volume24h || 1);
  const priceChangeWeight = Math.abs(coin.percentChange24h);
  return marketCapWeight * volumeWeight * priceChangeWeight;
}

/**
 * Fetch Fear & Greed Index from Alternative.me API
 */
async function fetchFearGreedIndex(): Promise<number> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();
    if (data && data.data && data.data[0]) {
      return parseInt(data.data[0].value, 10);
    }
    return 50;
  } catch (error) {
    console.error('Error fetching Fear & Greed:', error);
    return 50;
  }
}

/**
 * Fetch hot prediction markets from database
 */
async function fetchHotMarkets(): Promise<HotMarket[]> {
  try {
    const markets = await db.select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.status, 'active'))
      .orderBy(desc(predictionMarkets.totalVolume))
      .limit(5);

    return markets.map(m => {
      const yesPrice = m.yesPrice || 5000;
      const noPrice = m.noPrice || 5000;
      const yesPercent = Math.round((yesPrice / 10000) * 100);
      
      return {
        question: m.question,
        yesPercent,
        volume: m.totalVolume || 0,
        traders: m.totalTrades || 0
      };
    });
  } catch (error) {
    console.error('Error fetching hot markets:', error);
    return [];
  }
}

/**
 * Fetch top stock movers from Finnhub API
 */
async function fetchStockMovers(): Promise<{ gainers: StockHighlight[]; losers: StockHighlight[]; spy: { price: number; change: number } }> {
  try {
    const movers = await stockMarketService.getTechAiMovers();
    
    const formatStock = (s: any): StockHighlight => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change: s.change,
      changePercent: s.changePercent,
      isPositive: s.changePercent > 0,
      sector: s.sector
    });
    
    const gainers = movers.gainers.slice(0, 5).map(formatStock);
    const losers = movers.losers.slice(0, 5).map(formatStock);
    
    // Fetch SPY (S&P 500 ETF) for macro indicator
    let spyData = { price: 0, change: 0 };
    try {
      const spyQuote = await stockMarketService.getStockQuote('SPY');
      if (spyQuote && spyQuote.c > 0) {
        spyData = { price: spyQuote.c, change: spyQuote.dp || 0 };
      }
    } catch (e) {
      console.warn('Failed to fetch SPY quote');
    }
    
    return { gainers, losers, spy: spyData };
  } catch (error) {
    console.error('Error fetching stock movers:', error);
    return { gainers: [], losers: [], spy: { price: 0, change: 0 } };
  }
}

/**
 * Generate alpha insight based on market conditions
 */
function generateAlphaInsight(
  btcChange: number,
  ethChange: number,
  spyChange: number,
  fearGreedIndex: number,
  stockGainers: StockHighlight[],
  cryptoGainers: MarketHighlight[]
): string {
  const insights: string[] = [];
  
  // Correlation insight
  const cryptoUp = btcChange > 0 && ethChange > 0;
  const stocksUp = spyChange > 0;
  
  if (cryptoUp && stocksUp) {
    insights.push("Risk-on mode: Both crypto and equities rallying. Consider momentum plays.");
  } else if (cryptoUp && !stocksUp) {
    insights.push("Crypto decoupling from stocks. Watch for Bitcoin-led altcoin rotation.");
  } else if (!cryptoUp && stocksUp) {
    insights.push("Stocks outperforming crypto. Capital may be rotating to traditional assets.");
  } else {
    insights.push("Risk-off environment. Consider defensive positions or stablecoins.");
  }
  
  // Fear & Greed insight
  if (fearGreedIndex < 25) {
    insights.push("Extreme fear = potential buying opportunity for long-term holders.");
  } else if (fearGreedIndex > 75) {
    insights.push("Extreme greed = consider taking profits on overextended positions.");
  }
  
  // Top mover insight
  if (stockGainers.length > 0) {
    const topStock = stockGainers[0];
    if (topStock.changePercent > 5) {
      insights.push(`${topStock.symbol} surging ${topStock.changePercent.toFixed(1)}% - check for catalyst.`);
    }
  }
  
  return insights.join(' ');
}

/**
 * Get upcoming scheduled streams (daily 8am/4pm EST market updates)
 */
async function fetchUpcomingStreams(): Promise<UpcomingStream[]> {
  try {
    const now = new Date();
    
    const morningTime = new Date();
    morningTime.setHours(8, 0, 0, 0);
    if (morningTime < now) morningTime.setDate(morningTime.getDate() + 1);
    
    const afternoonTime = new Date();
    afternoonTime.setHours(16, 0, 0, 0);
    if (afternoonTime < now) afternoonTime.setDate(afternoonTime.getDate() + 1);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    };
    
    return [
      {
        title: 'Morning Market Update',
        time: morningTime.toLocaleString('en-US', formatOptions) + ' EST',
        emoji: '🌅'
      },
      {
        title: 'Market Close Recap',
        time: afternoonTime.toLocaleString('en-US', formatOptions) + ' EST',
        emoji: '🌙'
      }
    ];
  } catch (error) {
    console.error('Error fetching upcoming streams:', error);
    return [];
  }
}

/**
 * Generate newsletter content from live crypto market data
 */
export async function generateNewsletterContent(): Promise<NewsletterContent> {
  try {
    const [cryptoData, fearGreedIndex, hotMarkets, upcomingStreams, stockData] = await Promise.all([
      marketDataService.getTopCryptos(50),
      fetchFearGreedIndex(),
      fetchHotMarkets(),
      fetchUpcomingStreams(),
      fetchStockMovers()
    ]);
    
    if (!cryptoData || cryptoData.length === 0) {
      throw new Error('No crypto data available');
    }

    const filteredCoins = cryptoData.filter(coin => 
      !isMemeCoin(coin.name, coin.symbol) && 
      coin.marketCap > 100000000 &&
      coin.volume24h > 1000000
    );

    const allCoins: (MarketHighlight & { relevanceScore: number })[] = filteredCoins.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.price,
      change24h: (coin.price * coin.percentChange24h) / 100,
      changePercent: coin.percentChange24h,
      isPositive: coin.percentChange24h > 0,
      relevanceScore: calculateRelevanceScore(coin)
    }));

    const gainers = allCoins
      .filter(c => c.isPositive)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
    const losers = allCoins
      .filter(c => !c.isPositive)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const topGainers = gainers.slice(0, 5);
    const topLosers = losers.slice(0, 5);
    const marketHighlights = allCoins.slice(0, 3);

    const btcData = allCoins.find(c => c.symbol === 'BTC');
    const ethData = allCoins.find(c => c.symbol === 'ETH');
    
    const marketSummary = generateMarketSummary(btcData, ethData, topGainers, topLosers, fearGreedIndex);
    
    const alphaInsight = generateAlphaInsight(
      btcData?.changePercent || 0,
      ethData?.changePercent || 0,
      stockData.spy.change,
      fearGreedIndex,
      stockData.gainers,
      topGainers
    );

    let newsStories: Array<{ title: string; url: string; source: string; published: string }> = [];
    try {
      const newsArticles = await marketDataService.getFinancialNews(5);
      newsStories = newsArticles.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source || 'CoinDesk',
        published: article.published
      }));
    } catch (error) {
      console.error('Error fetching news stories:', error);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      subject: `📈 StreamAiX Market Alpha - ${dayOfWeek}, ${dateStr}`,
      marketHighlights,
      topGainers,
      topLosers,
      stockGainers: stockData.gainers,
      stockLosers: stockData.losers,
      marketSummary,
      alphaInsight,
      totalMarketCap: '~$2.8T',
      btcDominance: btcData ? '~50%' : 'N/A',
      btcPrice: btcData?.price || 0,
      btcChange: btcData?.changePercent || 0,
      ethPrice: ethData?.price || 0,
      ethChange: ethData?.changePercent || 0,
      spyPrice: stockData.spy.price,
      spyChange: stockData.spy.change,
      fearGreedIndex,
      hotMarkets,
      upcomingStreams,
      newsStories
    };
  } catch (error) {
    console.error('Error generating newsletter content:', error);
    
    return {
      subject: `📈 StreamAiX Market Alpha - ${new Date().toLocaleDateString()}`,
      marketHighlights: [],
      topGainers: [],
      topLosers: [],
      stockGainers: [],
      stockLosers: [],
      marketSummary: 'Market data temporarily unavailable. Visit StreamAiX to explore our AI-powered prediction markets!',
      alphaInsight: 'Check back soon for AI-powered market insights.',
      totalMarketCap: 'N/A',
      btcDominance: 'N/A',
      btcPrice: 0,
      btcChange: 0,
      ethPrice: 0,
      ethChange: 0,
      spyPrice: 0,
      spyChange: 0,
      fearGreedIndex: 50,
      hotMarkets: [],
      upcomingStreams: [],
      newsStories: []
    };
  }
}

/**
 * Generate a narrative market summary
 */
function generateMarketSummary(
  btcData: any,
  ethData: any,
  topGainers: MarketHighlight[],
  topLosers: MarketHighlight[],
  fearGreedIndex: number
): string {
  const parts: string[] = [];

  if (btcData) {
    const btcTrend = btcData.changePercent > 0 ? 'gained' : 'declined';
    parts.push(
      `Bitcoin ${btcTrend} ${Math.abs(btcData.changePercent).toFixed(2)}% to $${btcData.price.toLocaleString()}`
    );
  }

  if (ethData) {
    const ethTrend = ethData.changePercent > 0 ? 'up' : 'down';
    parts.push(
      `Ethereum is ${ethTrend} ${Math.abs(ethData.changePercent).toFixed(2)}% at $${ethData.price.toLocaleString()}`
    );
  }

  const sentimentLabel = fearGreedIndex >= 75 ? 'extreme greed' :
                         fearGreedIndex >= 60 ? 'greed' :
                         fearGreedIndex >= 40 ? 'neutral' :
                         fearGreedIndex >= 25 ? 'fear' : 'extreme fear';
  
  parts.push(`Market sentiment sits at ${fearGreedIndex}/100 (${sentimentLabel})`);

  const gainersCount = topGainers.length;
  const losersCount = topLosers.length;
  
  if (gainersCount > losersCount) {
    parts.push('Overall momentum is bullish with strong gains across altcoins.');
  } else if (losersCount > gainersCount) {
    parts.push('Markets are experiencing some turbulence with notable corrections.');
  } else {
    parts.push('Markets are trading mixed with selective opportunities.');
  }

  return parts.join('. ') + '.';
}

/**
 * Generate feature highlights for newsletter
 */
export function getFeatureHighlights(): Array<{ title: string; description: string; emoji: string }> {
  return [
    {
      emoji: '🤖',
      title: 'AI Agent Trading',
      description: 'Watch 50 autonomous AI trading bots analyze and trade on prediction markets 24/7'
    },
    {
      emoji: '📊',
      title: 'Prediction Markets',
      description: 'Trade YES/NO positions on crypto events with instant liquidity'
    },
    {
      emoji: '🎙️',
      title: 'Daily AI Streams',
      description: 'Tune into 8am & 4pm EST market briefings hosted by AI Knowledge Avatars'
    },
    {
      emoji: '💰',
      title: 'DeFi Bounties',
      description: 'Earn STREAM tokens by creating summaries of crypto content'
    },
    {
      emoji: '🎯',
      title: 'Smart Insights',
      description: 'AI-powered market intelligence with confidence scoring'
    },
    {
      emoji: '🚀',
      title: 'Base Network',
      description: 'Built on Ethereum L2 for fast, low-cost transactions'
    }
  ];
}
