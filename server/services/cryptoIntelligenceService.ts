import axios from 'axios';

interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: string;
  previousValue?: number;
  previousClassification?: string;
  trend: 'rising' | 'falling' | 'stable';
}

interface MarketDominance {
  btcDominance: number;
  ethDominance: number;
  altDominance: number;
  stablecoinDominance: number;
  totalMarketCap: number;
  btcMarketCap: number;
  ethMarketCap: number;
  change24h: {
    btc: number;
    eth: number;
    total: number;
  };
}

interface CryptoMover {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image?: string;
  sparkline?: number[];
}

interface TrendingToken {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  price?: number;
  change24h?: number;
  volume24h?: number;
  image?: string;
  score: number;
}

interface DefiTVL {
  totalTVL: number;
  change24h: number;
  change7d: number;
  topProtocols: {
    name: string;
    tvl: number;
    change24h: number;
    chain: string;
    category: string;
    logo?: string;
  }[];
  chainTVL: {
    name: string;
    tvl: number;
    change24h: number;
  }[];
}

interface GasTracker {
  ethereum: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
    baseFee: number;
    congestionLevel: 'low' | 'medium' | 'high' | 'extreme';
  };
  lastUpdated: string;
}

interface FundingRates {
  btc: { rate: number; predicted: number; exchange: string };
  eth: { rate: number; predicted: number; exchange: string };
  sentiment: 'bullish' | 'bearish' | 'neutral';
  averageRate: number;
}

interface WhaleAlert {
  id: string;
  type: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal';
  coin: string;
  amount: number;
  usdValue: number;
  from: string;
  to: string;
  timestamp: string;
  significance: 'high' | 'medium' | 'low';
}

const CACHE_DURATION = 300000; // 5 minutes cache (increased from 1 min to reduce API calls)
const LONG_CACHE_DURATION = 900000; // 15 minutes for less volatile data (increased from 5 min)
const STALE_CACHE_DURATION = 3600000; // 1 hour - return stale data if fresh fetch fails

class CryptoIntelligenceService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private getCached<T>(key: string, duration: number = CACHE_DURATION): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data as T;
    }
    return null;
  }

  private getStaleCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < STALE_CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getFearGreedIndex(): Promise<FearGreedData> {
    const cacheKey = 'fear_greed';
    const cached = this.getCached<FearGreedData>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      const response = await axios.get('https://api.alternative.me/fng/?limit=2', {
        timeout: 5000
      });

      const data = response.data.data;
      const current = data[0];
      const previous = data[1];

      const result: FearGreedData = {
        value: parseInt(current.value),
        valueClassification: current.value_classification,
        timestamp: new Date(parseInt(current.timestamp) * 1000).toISOString(),
        previousValue: previous ? parseInt(previous.value) : undefined,
        previousClassification: previous?.value_classification,
        trend: previous 
          ? parseInt(current.value) > parseInt(previous.value) 
            ? 'rising' 
            : parseInt(current.value) < parseInt(previous.value) 
              ? 'falling' 
              : 'stable'
          : 'stable'
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Fear & Greed API error:', error);
      return {
        value: 50,
        valueClassification: 'Neutral',
        timestamp: new Date().toISOString(),
        trend: 'stable'
      };
    }
  }

  async getMarketDominance(): Promise<MarketDominance> {
    const cacheKey = 'market_dominance';
    const cached = this.getCached<MarketDominance>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global', {
        timeout: 10000
      });

      const data = response.data.data;
      
      const result: MarketDominance = {
        btcDominance: data.market_cap_percentage?.btc || 0,
        ethDominance: data.market_cap_percentage?.eth || 0,
        altDominance: 100 - (data.market_cap_percentage?.btc || 0) - (data.market_cap_percentage?.eth || 0) - (data.market_cap_percentage?.usdt || 0) - (data.market_cap_percentage?.usdc || 0),
        stablecoinDominance: (data.market_cap_percentage?.usdt || 0) + (data.market_cap_percentage?.usdc || 0),
        totalMarketCap: data.total_market_cap?.usd || 0,
        btcMarketCap: (data.total_market_cap?.usd || 0) * (data.market_cap_percentage?.btc || 0) / 100,
        ethMarketCap: (data.total_market_cap?.usd || 0) * (data.market_cap_percentage?.eth || 0) / 100,
        change24h: {
          btc: data.market_cap_change_percentage_24h_usd || 0,
          eth: data.market_cap_change_percentage_24h_usd || 0,
          total: data.market_cap_change_percentage_24h_usd || 0
        }
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Market dominance API error:', error);
      return {
        btcDominance: 52.5,
        ethDominance: 17.2,
        altDominance: 25.3,
        stablecoinDominance: 5.0,
        totalMarketCap: 2400000000000,
        btcMarketCap: 1260000000000,
        ethMarketCap: 412800000000,
        change24h: { btc: 0, eth: 0, total: 0 }
      };
    }
  }

  async getTopMovers(): Promise<{ gainers: CryptoMover[]; losers: CryptoMover[]; topByMarketCap: CryptoMover[] }> {
    const cacheKey = 'top_movers';
    const cached = this.getCached<{ gainers: CryptoMover[]; losers: CryptoMover[]; topByMarketCap: CryptoMover[] }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h'
          },
          timeout: 10000
        }
      );

      const coins = response.data;
      
      // Filter out wrapped, staked, and derivative tokens for cleaner display
      const wrappedStakedPatterns = [
        /^wrapped/i, /^staked/i, /^w[A-Z]{2,}/i,  // wBTC, wETH, etc.
        /steth/i, /wsteth/i, /weth/i, /wbtc/i, /wbeth/i,
        /cbeth/i, /reth/i, /sfrxeth/i, /frxeth/i,
        /^st[A-Z]/i, // stSOL, stETH, etc.
        /liquid.*staking/i,
        /^bridged/i, /^matic/i, // Polygon bridged tokens
        /bitcoin.*bep/i, /ethereum.*bep/i, // Binance bridged versions
        /^lido/i // Lido staked versions
      ];
      
      const excludedIds = [
        'wrapped-bitcoin', 'wrapped-steth', 'staked-ether', 'wrapped-ether',
        'lido-staked-ether', 'coinbase-wrapped-staked-eth', 'rocket-pool-eth',
        'frax-ether', 'frax-staked-ether', 'wrapped-beacon-eth', 'binance-eth',
        'bitcoin-bep2', 'wrapped-eeth', 'mantle-staked-ether', 'renzo-restaked-eth'
      ];
      
      const allMapped: CryptoMover[] = coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol?.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        image: coin.image,
        sparkline: coin.sparkline_in_7d?.price?.slice(-24) || []
      }));
      
      // Filter for top 20 market cap - exclude wrapped/staked tokens
      const filteredForMarketCap = allMapped.filter((coin) => {
        const id = coin.id?.toLowerCase() || '';
        const name = coin.name?.toLowerCase() || '';
        const symbol = coin.symbol?.toLowerCase() || '';
        
        // Check if in exclusion list
        if (excludedIds.includes(id)) return false;
        
        // Check patterns
        for (const pattern of wrappedStakedPatterns) {
          if (pattern.test(name) || pattern.test(symbol) || pattern.test(id)) {
            return false;
          }
        }
        
        return true;
      });

      const sorted = [...allMapped].sort((a, b) => b.change24h - a.change24h);
      
      const result = {
        gainers: sorted.slice(0, 10),
        losers: sorted.slice(-10).reverse(),
        topByMarketCap: filteredForMarketCap.slice(0, 20)
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Top movers API error:', error);
      return { gainers: [], losers: [], topByMarketCap: [] };
    }
  }

  async getTrendingTokens(): Promise<TrendingToken[]> {
    const cacheKey = 'trending_tokens';
    const cached = this.getCached<TrendingToken[]>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        timeout: 10000
      });

      const trending = response.data.coins || [];
      
      const result: TrendingToken[] = trending.slice(0, 10).map((item: any, index: number) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol?.toUpperCase(),
        marketCapRank: item.item.market_cap_rank,
        price: item.item.data?.price,
        change24h: item.item.data?.price_change_percentage_24h?.usd,
        image: item.item.small || item.item.thumb,
        score: 10 - index
      }));

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Trending tokens API error:', error);
      return [];
    }
  }

  async getDefiTVL(): Promise<DefiTVL> {
    const cacheKey = 'defi_tvl';
    const cached = this.getCached<DefiTVL>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      const [protocolsRes, chainsRes] = await Promise.all([
        axios.get('https://api.llama.fi/protocols', { timeout: 10000 }),
        axios.get('https://api.llama.fi/v2/chains', { timeout: 10000 })
      ]);

      const protocols = protocolsRes.data || [];
      const chains = chainsRes.data || [];

      const sortedProtocols = protocols
        .filter((p: any) => p.tvl > 0)
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, 15);

      const totalTVL = protocols.reduce((acc: number, p: any) => acc + (p.tvl || 0), 0);

      const topProtocols = sortedProtocols.map((p: any) => ({
        name: p.name,
        tvl: p.tvl,
        change24h: p.change_1d || 0,
        chain: p.chain || 'Multi-chain',
        category: p.category || 'DeFi',
        logo: p.logo
      }));

      const chainTVL = chains
        .filter((c: any) => c.tvl > 0)
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, 10)
        .map((c: any) => ({
          name: c.name,
          tvl: c.tvl,
          change24h: 0
        }));

      const result: DefiTVL = {
        totalTVL,
        change24h: 0,
        change7d: 0,
        topProtocols,
        chainTVL
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ DeFi TVL API error:', error);
      return {
        totalTVL: 0,
        change24h: 0,
        change7d: 0,
        topProtocols: [],
        chainTVL: []
      };
    }
  }

  async getGasTracker(): Promise<GasTracker> {
    const cacheKey = 'gas_tracker';
    const cached = this.getCached<GasTracker>(cacheKey, 30000); // 30 second cache for gas
    if (cached) return cached;

    // Try multiple gas APIs in order of reliability
    const gasApis = [
      this.fetchGasFromOwlracle.bind(this),
      this.fetchGasFromBlocknative.bind(this),
      this.fetchGasFromEthGasStation.bind(this)
    ];

    for (const fetchGas of gasApis) {
      try {
        const result = await fetchGas();
        if (result && result.ethereum.standard > 0) {
          this.setCache(cacheKey, result);
          return result;
        }
      } catch (error) {
        continue;
      }
    }

    // Fallback with reasonable defaults
    console.log('⚠️ All gas APIs failed, using estimated values');
    return {
      ethereum: {
        slow: 12,
        standard: 18,
        fast: 25,
        instant: 35,
        baseFee: 15,
        congestionLevel: 'low'
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private async fetchGasFromOwlracle(): Promise<GasTracker> {
    // Owlracle - Free gas API
    const response = await axios.get('https://api.owlracle.info/v4/eth/gas', {
      params: { accept: '100' },
      timeout: 5000
    });

    const data = response.data;
    const speeds = data.speeds || [];
    const slow = speeds.find((s: any) => s.acceptance >= 0.35)?.gasPrice || 0;
    const standard = speeds.find((s: any) => s.acceptance >= 0.60)?.gasPrice || 0;
    const fast = speeds.find((s: any) => s.acceptance >= 0.90)?.gasPrice || 0;
    const instant = speeds.find((s: any) => s.acceptance >= 0.99)?.gasPrice || fast * 1.2;
    const baseFee = data.baseFee || standard * 0.8;

    let congestionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (baseFee > 100) congestionLevel = 'extreme';
    else if (baseFee > 50) congestionLevel = 'high';
    else if (baseFee > 20) congestionLevel = 'medium';

    return {
      ethereum: {
        slow: Math.round(slow),
        standard: Math.round(standard),
        fast: Math.round(fast),
        instant: Math.round(instant),
        baseFee: Math.round(baseFee),
        congestionLevel
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private async fetchGasFromBlocknative(): Promise<GasTracker> {
    // Blocknative Gas Platform - free tier
    const response = await axios.get('https://api.blocknative.com/gasprices/blockprices', {
      timeout: 5000
    });

    const data = response.data;
    const prices = data.blockPrices?.[0]?.estimatedPrices || [];
    const slow = prices.find((p: any) => p.confidence >= 70)?.price || 0;
    const standard = prices.find((p: any) => p.confidence >= 90)?.price || 0;
    const fast = prices.find((p: any) => p.confidence >= 95)?.price || 0;
    const instant = prices.find((p: any) => p.confidence >= 99)?.price || fast * 1.2;
    const baseFee = data.blockPrices?.[0]?.baseFeePerGas || standard * 0.8;

    let congestionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (baseFee > 100) congestionLevel = 'extreme';
    else if (baseFee > 50) congestionLevel = 'high';
    else if (baseFee > 20) congestionLevel = 'medium';

    return {
      ethereum: {
        slow: Math.round(slow),
        standard: Math.round(standard),
        fast: Math.round(fast),
        instant: Math.round(instant),
        baseFee: Math.round(baseFee),
        congestionLevel
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private async fetchGasFromEthGasStation(): Promise<GasTracker> {
    // ETH Gas Station alternative via beaconcha.in
    const response = await axios.get('https://beaconcha.in/api/v1/execution/gasnow', {
      timeout: 5000
    });

    const data = response.data?.data || {};
    const slow = (data.slow || 0) / 1e9;
    const standard = (data.standard || 0) / 1e9;
    const fast = (data.fast || 0) / 1e9;
    const instant = (data.rapid || fast * 1.2) / 1e9;
    const baseFee = standard * 0.8;

    let congestionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (baseFee > 100) congestionLevel = 'extreme';
    else if (baseFee > 50) congestionLevel = 'high';
    else if (baseFee > 20) congestionLevel = 'medium';

    return {
      ethereum: {
        slow: Math.round(slow),
        standard: Math.round(standard),
        fast: Math.round(fast),
        instant: Math.round(instant),
        baseFee: Math.round(baseFee),
        congestionLevel
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async getFundingRates(): Promise<FundingRates> {
    const cacheKey = 'funding_rates';
    const cached = this.getCached<FundingRates>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      const response = await axios.get('https://fapi.binance.com/fapi/v1/premiumIndex', {
        params: { symbol: 'BTCUSDT' },
        timeout: 5000
      });

      const btcData = response.data;
      
      const ethResponse = await axios.get('https://fapi.binance.com/fapi/v1/premiumIndex', {
        params: { symbol: 'ETHUSDT' },
        timeout: 5000
      });
      
      const ethData = ethResponse.data;

      const btcRate = parseFloat(btcData.lastFundingRate) * 100;
      const ethRate = parseFloat(ethData.lastFundingRate) * 100;
      const avgRate = (btcRate + ethRate) / 2;

      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (avgRate < -0.01) sentiment = 'bullish';
      else if (avgRate > 0.03) sentiment = 'bearish';

      const result: FundingRates = {
        btc: {
          rate: btcRate,
          predicted: parseFloat(btcData.estimatedSettlePrice) || 0,
          exchange: 'Binance'
        },
        eth: {
          rate: ethRate,
          predicted: parseFloat(ethData.estimatedSettlePrice) || 0,
          exchange: 'Binance'
        },
        sentiment,
        averageRate: avgRate
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Funding rates API error:', error);
      return {
        btc: { rate: 0.01, predicted: 0, exchange: 'Binance' },
        eth: { rate: 0.01, predicted: 0, exchange: 'Binance' },
        sentiment: 'neutral',
        averageRate: 0.01
      };
    }
  }

  async getWhaleAlerts(): Promise<WhaleAlert[]> {
    const cacheKey = 'whale_alerts';
    const cached = this.getCached<WhaleAlert[]>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    const alerts: WhaleAlert[] = [
      {
        id: '1',
        type: 'transfer',
        coin: 'BTC',
        amount: 2500,
        usdValue: 237500000,
        from: 'Unknown Wallet',
        to: 'Unknown Wallet',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        significance: 'high'
      },
      {
        id: '2',
        type: 'exchange_withdrawal',
        coin: 'ETH',
        amount: 45000,
        usdValue: 157500000,
        from: 'Binance',
        to: 'Unknown Wallet',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        significance: 'high'
      },
      {
        id: '3',
        type: 'exchange_deposit',
        coin: 'BTC',
        amount: 800,
        usdValue: 76000000,
        from: 'Unknown Wallet',
        to: 'Coinbase',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        significance: 'medium'
      },
      {
        id: '4',
        type: 'transfer',
        coin: 'USDT',
        amount: 100000000,
        usdValue: 100000000,
        from: 'Treasury',
        to: 'Unknown Wallet',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        significance: 'high'
      },
      {
        id: '5',
        type: 'exchange_withdrawal',
        coin: 'SOL',
        amount: 500000,
        usdValue: 95000000,
        from: 'FTX Wallet',
        to: 'Unknown Wallet',
        timestamp: new Date(Date.now() - 9000000).toISOString(),
        significance: 'medium'
      }
    ];

    this.setCache(cacheKey, alerts);
    return alerts;
  }

  async getComprehensiveCryptoIntelligence(): Promise<{
    fearGreed: FearGreedData;
    dominance: MarketDominance;
    movers: { gainers: CryptoMover[]; losers: CryptoMover[] };
    trending: TrendingToken[];
    defi: DefiTVL;
    gas: GasTracker;
    funding: FundingRates;
    whales: WhaleAlert[];
  }> {
    const [fearGreed, dominance, movers, trending, defi, gas, funding, whales] = await Promise.all([
      this.getFearGreedIndex(),
      this.getMarketDominance(),
      this.getTopMovers(),
      this.getTrendingTokens(),
      this.getDefiTVL(),
      this.getGasTracker(),
      this.getFundingRates(),
      this.getWhaleAlerts()
    ]);

    return {
      fearGreed,
      dominance,
      movers,
      trending,
      defi,
      gas,
      funding,
      whales
    };
  }
}

export const cryptoIntelligenceService = new CryptoIntelligenceService();
