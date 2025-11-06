import { getTopMovers, getCryptoMarketData } from './cryptoDataService';

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
}

/**
 * Generate newsletter content from live crypto market data
 */
export async function generateNewsletterContent(): Promise<NewsletterContent> {
  try {
    // Fetch top movers and market data
    const [topMovers, marketData] = await Promise.all([
      getTopMovers(10),
      getCryptoMarketData(['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'])
    ]);

    // Separate gainers and losers
    const topGainers = topMovers
      .filter(coin => coin.changePercent > 0)
      .slice(0, 3)
      .map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.price,
        change24h: coin.change24h,
        changePercent: coin.changePercent,
        isPositive: true
      }));

    const topLosers = topMovers
      .filter(coin => coin.changePercent < 0)
      .slice(0, 3)
      .map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.price,
        change24h: coin.change24h,
        changePercent: coin.changePercent,
        isPositive: false
      }));

    // Get major coin highlights
    const marketHighlights: MarketHighlight[] = marketData.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.price,
      change24h: coin.change24h,
      changePercent: coin.changePercent,
      isPositive: coin.changePercent > 0
    }));

    // Generate market summary
    const btcData = marketData.find(c => c.symbol === 'btc');
    const ethData = marketData.find(c => c.symbol === 'eth');
    
    const marketSummary = generateMarketSummary(btcData, ethData, topGainers, topLosers);

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
      btcDominance: btcData ? '~50%' : 'N/A'
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
      btcDominance: 'N/A'
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
      description: 'Watch our 4 AI agents analyze and trade on prediction markets in real-time'
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
