import { marketDataService } from './marketDataService';

export interface MarketHighlight {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  isPositive: boolean;
}

export interface NewsletterContent {
  subject: string;
  marketHighlights: MarketHighlight[];
  topGainers: MarketHighlight[];
  topLosers: MarketHighlight[];
  marketSummary: string;
  totalMarketCap: string;
  btcDominance: string;
  newsStories: Array<{
    title: string;
    url: string;
    source: string;
    published: string;
  }>;
}

// Meme coin patterns to filter out
const MEME_COIN_PATTERNS = [
  'inu', 'shib', 'doge', 'pepe', 'elon', 'floki', 'baby', 
  'moon', 'safe', 'rocket', 'meme', 'wojak', 'chad', 
  'bonk', 'bome', 'wif', 'pepe2', 'dogelon'
];

/**
 * Check if a coin is likely a meme coin based on name patterns
 */
function isMemeCoin(name: string, symbol: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();
  return MEME_COIN_PATTERNS.some(pattern => 
    lowerName.includes(pattern) || lowerSymbol.includes(pattern)
  );
}

/**
 * Calculate relevance score for a coin based on market cap, volume, and price movement
 */
function calculateRelevanceScore(coin: any): number {
  const marketCapWeight = Math.log10(coin.marketCap || 1);
  const volumeWeight = Math.log10(coin.volume24h || 1);
  const priceChangeWeight = Math.abs(coin.percentChange24h);
  
  // Higher market cap and volume make the price movement more relevant
  return marketCapWeight * volumeWeight * priceChangeWeight;
}

/**
 * Generate newsletter content from live crypto market data
 */
export async function generateNewsletterContent(): Promise<NewsletterContent> {
  try {
    // Fetch top 50 cryptocurrencies by market cap from CoinMarketCap
    const cryptoData = await marketDataService.getTopCryptos(50);
    
    if (!cryptoData || cryptoData.length === 0) {
      throw new Error('No crypto data available');
    }

    // Filter out meme coins and convert to market highlights format
    const filteredCoins = cryptoData.filter(coin => 
      !isMemeCoin(coin.name, coin.symbol) && 
      coin.marketCap > 100000000 && // At least $100M market cap
      coin.volume24h > 1000000 // At least $1M daily volume
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

    // Separate gainers and losers, sorted by relevance score
    const gainers = allCoins
      .filter(c => c.isPositive)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
    const losers = allCoins
      .filter(c => !c.isPositive)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const topGainers = gainers.slice(0, 5);
    const topLosers = losers.slice(0, 5);

    // Get major coin highlights (BTC, ETH, SOL)
    const marketHighlights = allCoins.slice(0, 3);

    // Generate market summary
    const btcData = allCoins.find(c => c.symbol === 'BTC');
    const ethData = allCoins.find(c => c.symbol === 'ETH');
    
    const marketSummary = generateMarketSummary(btcData, ethData, topGainers, topLosers);

    // Fetch latest crypto news stories
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
      // Continue without news if fetch fails
    }

    // Format date for subject
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      subject: `📈 StreamAiX Crypto Briefing - ${dayOfWeek}, ${dateStr}`,
      marketHighlights,
      topGainers,
      topLosers,
      marketSummary,
      totalMarketCap: '~$2.8T', // You can fetch this from CoinGecko global endpoint
      btcDominance: btcData ? '~50%' : 'N/A',
      newsStories
    };
  } catch (error) {
    console.error('Error generating newsletter content:', error);
    
    // Return fallback content if APIs fail
    return {
      subject: `📈 StreamAiX Crypto Briefing - ${new Date().toLocaleDateString()}`,
      marketHighlights: [],
      topGainers: [],
      topLosers: [],
      marketSummary: 'Market data temporarily unavailable. Visit StreamAiX to explore our AI-powered prediction markets!',
      totalMarketCap: 'N/A',
      btcDominance: 'N/A',
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
  topLosers: MarketHighlight[]
): string {
  const parts: string[] = [];

  // BTC summary
  if (btcData) {
    const btcTrend = btcData.changePercent > 0 ? 'gained' : 'declined';
    parts.push(
      `Bitcoin ${btcTrend} ${Math.abs(btcData.changePercent).toFixed(2)}% to $${btcData.price.toLocaleString()}`
    );
  }

  // ETH summary
  if (ethData) {
    const ethTrend = ethData.changePercent > 0 ? 'up' : 'down';
    parts.push(
      `Ethereum is ${ethTrend} ${Math.abs(ethData.changePercent).toFixed(2)}% at $${ethData.price.toLocaleString()}`
    );
  }

  // Market sentiment
  const gainersCount = topGainers.length;
  const losersCount = topLosers.length;
  
  if (gainersCount > losersCount) {
    parts.push('Markets are showing bullish momentum with strong gains across altcoins.');
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
      emoji: '🔮',
      title: 'Live Analytics',
      description: 'Real-time data from 67+ API endpoints tracking markets 24/7'
    },
    {
      emoji: '🚀',
      title: 'Base Network',
      description: 'Built on Ethereum L2 for fast, low-cost transactions'
    }
  ];
}
