import { marketDataService } from './marketDataService';
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
  marketSummary: string;
  totalMarketCap: string;
  btcDominance: string;
  btcPrice: number;
  btcChange: number;
  ethPrice: number;
  ethChange: number;
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
    const [cryptoData, fearGreedIndex, hotMarkets, upcomingStreams] = await Promise.all([
      marketDataService.getTopCryptos(50),
      fetchFearGreedIndex(),
      fetchHotMarkets(),
      fetchUpcomingStreams()
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
      subject: `📈 StreamAiX Crypto Briefing - ${dayOfWeek}, ${dateStr}`,
      marketHighlights,
      topGainers,
      topLosers,
      marketSummary,
      totalMarketCap: '~$2.8T',
      btcDominance: btcData ? '~50%' : 'N/A',
      btcPrice: btcData?.price || 0,
      btcChange: btcData?.changePercent || 0,
      ethPrice: ethData?.price || 0,
      ethChange: ethData?.changePercent || 0,
      fearGreedIndex,
      hotMarkets,
      upcomingStreams,
      newsStories
    };
  } catch (error) {
    console.error('Error generating newsletter content:', error);
    
    return {
      subject: `📈 StreamAiX Crypto Briefing - ${new Date().toLocaleDateString()}`,
      marketHighlights: [],
      topGainers: [],
      topLosers: [],
      marketSummary: 'Market data temporarily unavailable. Visit StreamAiX to explore our AI-powered prediction markets!',
      totalMarketCap: 'N/A',
      btcDominance: 'N/A',
      btcPrice: 0,
      btcChange: 0,
      ethPrice: 0,
      ethChange: 0,
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
