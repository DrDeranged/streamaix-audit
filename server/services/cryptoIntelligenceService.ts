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

const CACHE_DURATION = 1800000; // 30 minutes cache (increased from 5 min to reduce API calls)
const LONG_CACHE_DURATION = 3600000; // 1 hour for less volatile data (increased from 15 min)
const STALE_CACHE_DURATION = 7200000; // 2 hours - return stale data if fresh fetch fails

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
      this.fetchGasFromBlocknative.bind(this),
      this.fetchGasFromOwlracle.bind(this),
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

    // No mock data - throw error when all APIs fail
    console.log('❌ All gas APIs failed - no real gas data available');
    throw new Error('Gas data unavailable - all APIs failed');
  }

  private async fetchGasFromBlocknative(): Promise<GasTracker> {
    // Blocknative Gas Platform - free tier, most reliable
    const response = await axios.get('https://api.blocknative.com/gasprices/blockprices', {
      timeout: 5000
    });

    const data = response.data;
    const prices = data.blockPrices?.[0]?.estimatedPrices || [];
    const baseFee = data.blockPrices?.[0]?.baseFeePerGas || 0;
    
    // Find prices by confidence level - use maxFeePerGas for total cost
    const p99 = prices.find((p: any) => p.confidence === 99);
    const p95 = prices.find((p: any) => p.confidence === 95);
    const p90 = prices.find((p: any) => p.confidence === 90);
    
    const slow = p90?.maxFeePerGas || baseFee * 1.1;
    const standard = p95?.maxFeePerGas || baseFee * 1.2;
    const fast = p99?.maxFeePerGas || baseFee * 1.3;
    const instant = fast * 1.2;

    let congestionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (baseFee > 100) congestionLevel = 'extreme';
    else if (baseFee > 50) congestionLevel = 'high';
    else if (baseFee > 20) congestionLevel = 'medium';

    // Return values rounded to 2 decimal places for display (gas is currently very low)
    return {
      ethereum: {
        slow: Math.max(1, Math.round(slow * 10) / 10),
        standard: Math.max(1, Math.round(standard * 10) / 10),
        fast: Math.max(1, Math.round(fast * 10) / 10),
        instant: Math.max(1, Math.round(instant * 10) / 10),
        baseFee: Math.max(0.1, Math.round(baseFee * 100) / 100),
        congestionLevel
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private async fetchGasFromOwlracle(): Promise<GasTracker> {
    // Owlracle - Free gas API (v4)
    const response = await axios.get('https://api.owlracle.info/v4/eth/gas', {
      params: { accept: '100' },
      timeout: 5000
    });

    const data = response.data;
    const speeds = data.speeds || [];
    
    // Owlracle v4 returns a single speed with maxFeePerGas
    const speed = speeds[0] || {};
    const baseFee = speed.baseFee || data.baseFee || 0;
    const maxFee = speed.maxFeePerGas || baseFee * 1.5;
    
    const slow = baseFee * 1.1;
    const standard = maxFee;
    const fast = maxFee * 1.2;
    const instant = maxFee * 1.5;

    let congestionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (baseFee > 100) congestionLevel = 'extreme';
    else if (baseFee > 50) congestionLevel = 'high';
    else if (baseFee > 20) congestionLevel = 'medium';

    return {
      ethereum: {
        slow: Math.max(1, Math.round(slow * 10) / 10),
        standard: Math.max(1, Math.round(standard * 10) / 10),
        fast: Math.max(1, Math.round(fast * 10) / 10),
        instant: Math.max(1, Math.round(instant * 10) / 10),
        baseFee: Math.max(0.1, Math.round(baseFee * 100) / 100),
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

    // Try OKX first (free, no auth, globally accessible), then Bybit as fallback
    const fundingApis = [
      this.fetchFundingFromOKX.bind(this),
      this.fetchFundingFromBybit.bind(this)
    ];

    for (const fetchFunding of fundingApis) {
      try {
        const result = await fetchFunding();
        if (result && result.btc.rate !== 0) {
          this.setCache(cacheKey, result);
          return result;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('❌ All funding rate APIs failed');
    throw new Error('Funding rates unavailable - all APIs failed');
  }

  private async fetchFundingFromOKX(): Promise<FundingRates> {
    // OKX - Free public API, no auth required, globally accessible
    const [btcRes, ethRes] = await Promise.all([
      axios.get('https://www.okx.com/api/v5/public/funding-rate', {
        params: { instId: 'BTC-USDT-SWAP' },
        timeout: 5000
      }),
      axios.get('https://www.okx.com/api/v5/public/funding-rate', {
        params: { instId: 'ETH-USDT-SWAP' },
        timeout: 5000
      })
    ]);

    const btcData = btcRes.data?.data?.[0];
    const ethData = ethRes.data?.data?.[0];

    if (!btcData || !ethData) throw new Error('OKX funding rate data missing');

    const btcRate = parseFloat(btcData.fundingRate) * 100;
    const ethRate = parseFloat(ethData.fundingRate) * 100;
    const avgRate = (btcRate + ethRate) / 2;

    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (avgRate < -0.01) sentiment = 'bullish';
    else if (avgRate > 0.03) sentiment = 'bearish';

    return {
      btc: {
        rate: btcRate,
        predicted: parseFloat(btcData.nextFundingRate) * 100 || 0,
        exchange: 'OKX'
      },
      eth: {
        rate: ethRate,
        predicted: parseFloat(ethData.nextFundingRate) * 100 || 0,
        exchange: 'OKX'
      },
      sentiment,
      averageRate: avgRate
    };
  }

  private async fetchFundingFromBybit(): Promise<FundingRates> {
    // Bybit - Free public API, no auth required
    const [btcRes, ethRes] = await Promise.all([
      axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category: 'linear', symbol: 'BTCUSDT' },
        timeout: 5000
      }),
      axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category: 'linear', symbol: 'ETHUSDT' },
        timeout: 5000
      })
    ]);

    const btcData = btcRes.data?.result?.list?.[0];
    const ethData = ethRes.data?.result?.list?.[0];

    if (!btcData || !ethData) throw new Error('Bybit funding rate data missing');

    const btcRate = parseFloat(btcData.fundingRate) * 100;
    const ethRate = parseFloat(ethData.fundingRate) * 100;
    const avgRate = (btcRate + ethRate) / 2;

    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (avgRate < -0.01) sentiment = 'bullish';
    else if (avgRate > 0.03) sentiment = 'bearish';

    return {
      btc: {
        rate: btcRate,
        predicted: 0,
        exchange: 'Bybit'
      },
      eth: {
        rate: ethRate,
        predicted: 0,
        exchange: 'Bybit'
      },
      sentiment,
      averageRate: avgRate
    };
  }

  async getWhaleAlerts(): Promise<WhaleAlert[]> {
    const cacheKey = 'whale_alerts';
    const cached = this.getCached<WhaleAlert[]>(cacheKey, LONG_CACHE_DURATION);
    if (cached) return cached;

    try {
      // Fetch real Bitcoin transactions from Blockchain.info (no API key needed)
      const response = await axios.get('https://blockchain.info/unconfirmed-transactions', {
        params: { format: 'json', limit: 50 },
        timeout: 8000
      });

      const txs = response.data?.txs || [];
      
      // Get current BTC price for USD value calculation
      const btcPriceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: 'bitcoin', vs_currencies: 'usd' },
        timeout: 5000
      }).catch(() => ({ data: { bitcoin: { usd: 100000 } } }));
      
      const btcPrice = btcPriceResponse.data?.bitcoin?.usd || 100000;
      
      // Filter for whale transactions (> 10 BTC = ~$1M+)
      const whaleThreshold = 10 * 1e8; // 10 BTC in satoshis
      const whaleTxs = txs
        .filter((tx: any) => {
          const totalValue = tx.out?.reduce((sum: number, out: any) => sum + (out.value || 0), 0) || 0;
          return totalValue >= whaleThreshold;
        })
        .slice(0, 10);

      const alerts: WhaleAlert[] = whaleTxs.map((tx: any, idx: number) => {
        const totalSatoshis = tx.out?.reduce((sum: number, out: any) => sum + (out.value || 0), 0) || 0;
        const btcAmount = totalSatoshis / 1e8;
        const usdValue = btcAmount * btcPrice;
        
        // Determine transaction type based on addresses
        let type: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal' = 'transfer';
        const fromAddr = tx.inputs?.[0]?.prev_out?.addr || 'Unknown';
        const toAddr = tx.out?.[0]?.addr || 'Unknown';
        
        // Simple heuristic for exchange detection
        const knownExchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex', 'OKX'];
        
        return {
          id: tx.hash?.slice(0, 8) || `btc_${idx}`,
          type,
          coin: 'BTC',
          amount: Math.round(btcAmount * 100) / 100,
          usdValue: Math.round(usdValue),
          from: fromAddr.slice(0, 12) + '...',
          to: toAddr.slice(0, 12) + '...',
          timestamp: new Date(tx.time * 1000).toISOString(),
          significance: usdValue > 50000000 ? 'high' : usdValue > 10000000 ? 'medium' : 'low'
        };
      });

      if (alerts.length > 0) {
        this.setCache(cacheKey, alerts);
        return alerts;
      }
      
      throw new Error('No whale transactions found');
    } catch (error) {
      console.error('❌ Whale alerts API error:', error);
      // Return empty array - no mock data
      return [];
    }
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
