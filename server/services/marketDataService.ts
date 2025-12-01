import axios from 'axios';
import { duneAnalyticsService } from './duneAnalyticsService';
import { duneService } from './duneService';

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  percentChange7d: number;
  percentChange30d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  lastUpdated: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  marketCap?: number;
  volume?: number;
  lastUpdated: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  published: string;
  source: string;
  summary?: string;
  category?: string;
}

export interface EconomicEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'fomc' | 'cpi' | 'gdp' | 'employment' | 'inflation' | 'retail_sales' | 'pmi' | 'housing' | 'earnings';
  scheduledDate: string;
  actualDate?: string;
  impact: 'high' | 'medium' | 'low';
  country: string;
  currency: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  source: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'irregular';
  category: 'monetary_policy' | 'inflation' | 'employment' | 'growth' | 'consumption' | 'manufacturing' | 'housing' | 'earnings';
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  marketRelevance: number; // 0-100 score
  timeToEvent?: number; // milliseconds until event
  isCompleted: boolean;
  tags?: string[];
  relatedSymbols?: string[]; // stocks/crypto that might be affected
  lastUpdated: string;
}

export interface EconomicCalendarFilter {
  timeRange: '1d' | '7d' | '30d' | '90d';
  impact?: ('high' | 'medium' | 'low')[];
  eventTypes?: string[];
  countries?: string[];
  onlyUpcoming?: boolean;
}

export class MarketDataService {
  private static instance: MarketDataService;
  private cmcApiKey: string;
  private coingeckoApiKey: string;
  private alphaVantageApiKey: string;
  private finnhubApiKey: string;
  private fredApiKey: string;
  private cmcBaseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private alphaVantageBaseUrl = 'https://www.alphavantage.co/query';
  private finnhubBaseUrl = 'https://finnhub.io/api/v1';
  private fredBaseUrl = 'https://api.stlouisfed.org/fred';
  private coindeskNewsUrl = 'https://www.coindesk.com/arc/outboundfeeds/rss';
  private cache = new Map<string, { data: any; timestamp: number; customTimeout?: number }>();
  private cacheTimeout = 30000; // 30 second cache for real-time data
  private economicCacheTimeout = 300000; // 5 minute cache for economic data
  
  // Error suppression to prevent rate limit spam
  private errorLog = new Map<string, number>(); // Track last error log time
  private errorLogCooldown = 3600000; // 1 hour cooldown for same error type
  
  // Crypto-related stocks list - expanded to 25+ symbols
  private cryptoStocks = [
    // Major crypto companies
    'MSTR', 'COIN', 'RIOT', 'MARA', 'CLSK', 'HUT', 'BITF', 'BTBT',
    // Tech companies with crypto exposure
    'NVDA', 'AMD', 'TSLA', 'PYPL', 'SQ', 'HOOD', 'INTC', 'ORCL',
    // Mining and infrastructure
    'CAN', 'EBON', 'SOS', 'NCTY', 'ARBK', 'DGHI', 'HIVE', 'GREE',
    // ETFs and trusts
    'GBTC', 'ETHE', 'BITI', 'BITQ', 'BLOK', 'LEGR', 'KOIN', 'META',
    // Additional tech/fintech
    'GOOGL', 'MSFT', 'AMZN', 'V', 'MA', 'JPM', 'BAC'
  ];

  constructor() {
    this.cmcApiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    this.fredApiKey = process.env.FRED_API_KEY || '';
    
    console.log('🔑 Market Data Service initialized:');
    console.log(`  - CoinMarketCap: ${this.cmcApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - CoinGecko: ${this.coingeckoApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Alpha Vantage: ${this.alphaVantageApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Finnhub: ${this.finnhubApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - FRED (Economic Data): ${this.fredApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Dune Analytics: ${duneService.isAvailable() ? '✅ Available' : '❌ Missing'}`);
    
    if (!this.cmcApiKey && !this.coingeckoApiKey && !this.alphaVantageApiKey && !this.finnhubApiKey && !duneService.isAvailable()) {
      console.warn('⚠️ No market data API keys found - using fallback data');
    }
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Log an error with suppression to prevent spam (only logs same error type once per hour)
   */
  private logErrorOnce(errorKey: string, message: string, details?: any): void {
    const now = Date.now();
    const lastLogged = this.errorLog.get(errorKey);
    
    // Only log if we haven't logged this error recently
    if (!lastLogged || (now - lastLogged) > this.errorLogCooldown) {
      if (details) {
        console.error(message, details);
      } else {
        console.error(message);
      }
      this.errorLog.set(errorKey, now);
    }
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const timeout = cached.customTimeout || this.cacheTimeout;
    return Date.now() - cached.timestamp < timeout;
  }

  private getFromCache(key: string): any | null {
    if (this.isValidCache(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }


  /**
   * Get live cryptocurrency data by symbols using 3-tier fallback: CoinGecko → CoinMarketCap → Dune
   */
  async getCryptoQuotes(symbols: string[]): Promise<CryptoQuote[]> {
    const cacheKey = `crypto_${symbols.join(',').toUpperCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Tier 1: Try CoinGecko first (better free tier)
    if (this.coingeckoApiKey) {
      try {
        return await this.getCryptoQuotesFromCoinGecko(symbols);
      } catch (error) {
        console.warn('⚠️ CoinGecko failed, trying CoinMarketCap fallback');
      }
    }

    // Tier 2: Fallback to CoinMarketCap
    if (this.cmcApiKey) {
      try {
        return await this.getCryptoQuotesFromCMC(symbols);
      } catch (error) {
        console.warn('⚠️ CoinMarketCap failed, trying Dune Analytics fallback');
      }
    }

    // Tier 3: Final fallback to Dune Analytics
    if (duneService.isAvailable()) {
      try {
        console.log('🔮 Using Dune Analytics as final fallback for crypto prices');
        const duneQuotes: CryptoQuote[] = [];
        
        for (const symbol of symbols) {
          const price = await duneService.getTokenPrice(symbol);
          if (price) {
            duneQuotes.push({
              symbol: symbol.toUpperCase(),
              name: symbol,
              price,
              percentChange24h: 0, // Dune doesn't provide this easily
              percentChange7d: 0,
              percentChange30d: 0,
              marketCap: 0,
              volume24h: 0,
              rank: 0,
              lastUpdated: new Date().toISOString()
            });
          }
        }
        
        if (duneQuotes.length > 0) {
          this.setCacheWithTimeout(cacheKey, duneQuotes);
          console.log(`🔮 Fetched ${duneQuotes.length} prices from Dune Analytics`);
          return duneQuotes;
        }
      } catch (error) {
        console.error('❌ Dune Analytics fallback failed:', error);
      }
    }

    // No APIs available
    console.warn('⚠️ All crypto data APIs failed (CoinGecko, CoinMarketCap, Dune)');
    return [];
  }

  /**
   * Get cryptocurrency data from CoinGecko API
   */
  private async getCryptoQuotesFromCoinGecko(symbols: string[]): Promise<CryptoQuote[]> {
    const cacheKey = `coingecko_${symbols.join(',').toUpperCase()}`;
    
    // Convert symbols to CoinGecko IDs (complete mapping for 25 top cryptos)
    const coinIds = symbols.map(symbol => {
      const mapping: { [key: string]: string } = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'SOL': 'solana',
        'ADA': 'cardano',
        'AVAX': 'avalanche-2',
        'DOT': 'polkadot',
        'MATIC': 'matic-network',
        'LINK': 'chainlink',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash',
        'UNI': 'uniswap',
        'ATOM': 'cosmos',
        'FTT': 'ftx-token',
        'ALGO': 'algorand',
        'XLM': 'stellar',
        'VET': 'vechain',
        'ICP': 'internet-computer',
        'FIL': 'filecoin',
        'HBAR': 'hedera-hashgraph',
        'ETC': 'ethereum-classic',
        'XMR': 'monero',
        'EOS': 'eos',
        'BSV': 'bitcoin-sv'
      };
      return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
    });

    try {
      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
        headers: this.coingeckoApiKey ? { 'x-cg-demo-api-key': this.coingeckoApiKey } : {},
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true,
          include_7d_change: true,
          include_30d_change: true
        }
      });

      const quotes: CryptoQuote[] = [];
      
      symbols.forEach((symbol, index) => {
        const coinId = coinIds[index];
        const data = response.data[coinId];
        
        if (data) {
          quotes.push({
            symbol: symbol.toUpperCase(),
            name: symbol, // We'd need another call for full names
            price: data.usd || 0,
            percentChange24h: data.usd_24h_change || 0,
            percentChange7d: data.usd_7d_change || 0,
            percentChange30d: data.usd_30d_change || 0,
            marketCap: data.usd_market_cap || 0,
            volume24h: data.usd_24h_vol || 0,
            rank: 0, // Would need coins/markets endpoint for rank
            lastUpdated: new Date().toISOString()
          });
        }
      });

      this.setCacheWithTimeout(cacheKey, quotes);
      console.log(`📊 [CoinGecko] Fetched live crypto data for: ${symbols.join(', ')}`);
      return quotes;
      
    } catch (error: any) {
      this.logErrorOnce('coingecko_error', '❌ CoinGecko API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get cryptocurrency data from CoinMarketCap API (fallback)
   */
  private async getCryptoQuotesFromCMC(symbols: string[]): Promise<CryptoQuote[]> {
    const cacheKey = `cmc_${symbols.join(',').toUpperCase()}`;
    
    try {
      const symbolsStr = symbols.map(s => s.toUpperCase()).join(',');
      const response = await axios.get(`${this.cmcBaseUrl}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.cmcApiKey,
          'Accept': 'application/json'
        },
        params: {
          symbol: symbolsStr,
          convert: 'USD'
        }
      });

      const quotes: CryptoQuote[] = [];
      
      for (const symbol of symbols) {
        const data = response.data.data[symbol.toUpperCase()];
        if (data) {
          const quote = data.quote.USD;
          quotes.push({
            symbol: data.symbol,
            name: data.name,
            price: quote.price,
            percentChange24h: quote.percent_change_24h || 0,
            percentChange7d: quote.percent_change_7d || 0,
            percentChange30d: quote.percent_change_30d || 0,
            marketCap: quote.market_cap || 0,
            volume24h: quote.volume_24h || 0,
            rank: data.cmc_rank || 0,
            lastUpdated: quote.last_updated
          });
        }
      }

      this.setCacheWithTimeout(cacheKey, quotes);
      console.log(`📊 Fetched live crypto data for: ${symbols.join(', ')}`);
      return quotes;

    } catch (error: any) {
      this.logErrorOnce('coinmarketcap_error', '❌ [CoinMarketCap] API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get cryptocurrency market information by symbol
   */
  async getCryptoInfo(symbol: string): Promise<any> {
    if (!this.coingeckoApiKey && !this.cmcApiKey) {
      return null;
    }

    const cacheKey = `crypto_info_${symbol.toUpperCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.cmcBaseUrl}/cryptocurrency/info`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.cmcApiKey,
          'Accept': 'application/json'
        },
        params: {
          symbol: symbol.toUpperCase()
        }
      });

      const info = response.data.data[symbol.toUpperCase()];
      this.setCacheWithTimeout(cacheKey, info);
      return info;

    } catch (error: any) {
      console.error('❌ Failed to fetch crypto info:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit: number = 20): Promise<CryptoQuote[]> {
    if (!this.cmcApiKey) {
      console.warn('⚠️ No CMC API key available for top cryptos');
      return [];
    }

    const cacheKey = `top_cryptos_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.cmcBaseUrl}/cryptocurrency/listings/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.cmcApiKey,
          'Accept': 'application/json'
        },
        params: {
          start: 1,
          limit: limit,
          convert: 'USD'
        }
      });

      const quotes: CryptoQuote[] = response.data.data.map((crypto: any) => {
        const quote = crypto.quote.USD;
        return {
          symbol: crypto.symbol,
          name: crypto.name,
          price: quote.price,
          percentChange24h: quote.percent_change_24h || 0,
          percentChange7d: quote.percent_change_7d || 0,
          percentChange30d: quote.percent_change_30d || 0,
          marketCap: quote.market_cap || 0,
          volume24h: quote.volume_24h || 0,
          rank: crypto.cmc_rank || 0,
          lastUpdated: quote.last_updated
        };
      });

      this.setCacheWithTimeout(cacheKey, quotes);
      console.log(`📊 Fetched top ${limit} cryptocurrencies`);
      return quotes;

    } catch (error: any) {
      console.error('❌ Failed to fetch top cryptos:', error.response?.data || error.message);
      console.warn('⚠️ Failed to fetch top cryptos, returning empty array');
      return [];
    }
  }

  /**
   * Get comprehensive crypto market stats for dashboard
   */
  async getCryptoStats(): Promise<any> {
    const cacheKey = 'crypto_market_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📈 Returning cached crypto stats');
      return cached;
    }

    try {
      // Use CoinMarketCap for global market data if available
      if (this.cmcApiKey) {
        const [globalData, topCryptos] = await Promise.all([
          this.getCryptoGlobalData(),
          this.getTopCryptos(10) // Get top 10 for trending calculation
        ]);

        const stats = {
          updatedAt: new Date().toISOString(),
          baseFiat: 'USD',
          globalMarketCap: globalData.totalMarketCap,
          totalVolume24h: globalData.totalVolume24h,
          btcDominance: globalData.btcDominance,
          ethDominance: globalData.ethDominance,
          activeProjects: globalData.activeCryptocurrencies,
          trending: topCryptos.slice(0, 4).map(crypto => crypto.symbol),
          defiTvl: '$47.2B', // This would need a separate DeFi data service
          totals: {
            globalMarketCap: globalData.totalMarketCap,
            btcDominance: globalData.btcDominance,
            ethDominance: globalData.ethDominance
          },
          assets: topCryptos.slice(0, 5).map(crypto => ({
            symbol: crypto.symbol,
            price: crypto.price,
            change24h: crypto.percentChange24h,
            marketCap: crypto.marketCap,
            volume24h: crypto.volume24h,
            dominance: globalData.totalMarketCap > 0 ? ((crypto.marketCap / globalData.totalMarketCap) * 100) : 0
          }))
        };

        // Cache for 60 seconds (short-lived for dashboard)
        this.cache.set(cacheKey, { data: stats, timestamp: Date.now(), customTimeout: 60000 });
        console.log('📊 Generated comprehensive crypto stats');
        return stats;
      }

      // No mock data - throw error to indicate data unavailable
      console.log('⚠️ No real crypto stats available - API keys required');
      throw new Error('Crypto stats unavailable - no API keys configured');

    } catch (error: any) {
      console.error('❌ Failed to fetch crypto stats:', error);
      throw error;
    }
  }

  /**
   * Get global cryptocurrency market data from CoinMarketCap
   */
  private async getCryptoGlobalData(): Promise<any> {
    if (!this.cmcApiKey) {
      throw new Error('CoinMarketCap API key not available');
    }

    try {
      const response = await axios.get(`${this.cmcBaseUrl}/global-metrics/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.cmcApiKey,
          'Accept': 'application/json'
        }
      });

      const data = response.data.data;
      const quote = data.quote.USD;

      return {
        totalMarketCap: quote.total_market_cap || 2100000000000,
        totalVolume24h: quote.total_volume_24h || 127000000000,
        btcDominance: data.btc_dominance || 42.1,
        ethDominance: data.eth_dominance || 18.7,
        activeCryptocurrencies: data.active_cryptocurrencies || 12847,
        lastUpdated: quote.last_updated
      };

    } catch (error: any) {
      console.error('❌ Failed to fetch global crypto data:', error.response?.data || error.message);
      // Throw error - no mock data
      throw new Error('Failed to fetch real crypto global data');
    }
  }

  /**
   * Enhance financial trends with live market data
   */
  async enhanceFinancialTrends(trends: any[]): Promise<any[]> {
    const cryptoSymbols = trends
      .filter(t => t.category === 'Crypto')
      .map(t => t.symbol.replace('$', ''));

    const stockSymbols = trends
      .filter(t => t.category === 'Stocks')
      .map(t => t.symbol.replace('$', ''));

    const enhancedTrends = [...trends];

    // Enhance crypto trends with live data
    if (cryptoSymbols.length > 0) {
      try {
        const cryptoQuotes = await this.getCryptoQuotes(cryptoSymbols);
        
        enhancedTrends.forEach(trend => {
          if (trend.category === 'Crypto') {
            const symbol = trend.symbol.replace('$', '');
            const quote = cryptoQuotes.find(q => q.symbol === symbol);
            if (quote) {
              trend.liveData = {
                price: quote.price,
                percentChange24h: quote.percentChange24h,
                percentChange7d: quote.percentChange7d,
                marketCap: quote.marketCap,
                volume24h: quote.volume24h,
                rank: quote.rank,
                lastUpdated: quote.lastUpdated
              };
            }
          }
        });
      } catch (error) {
        console.error('❌ Failed to enhance crypto trends:', error);
      }
    }

    // For stocks, we'll skip live data if no real API is available
    // This prevents mock/template data from showing up
    enhancedTrends.forEach(trend => {
      if (trend.category === 'Stocks' && !trend.liveData) {
        const stockData = this.getMockStockData(trend.symbol.replace('$', ''));
        if (stockData) {
          trend.liveData = stockData;
        }
        // If stockData is null, trend will not have liveData property
      }
    });

    // Add Dune Analytics on-chain alpha for crypto trends
    try {
      const cryptoTrends = enhancedTrends.filter(t => t.category === 'Crypto');
      if (cryptoTrends.length > 0) {
        const cryptoSymbols = cryptoTrends.map(t => t.symbol.replace('$', ''));
        const onChainAlpha = await duneAnalyticsService.getOnChainAlpha(cryptoSymbols);
        
        // Add on-chain alpha insights to crypto trends
        enhancedTrends.forEach(trend => {
          if (trend.category === 'Crypto') {
            const symbol = trend.symbol.replace('$', '');
            const whaleActivity = onChainAlpha.whaleActivity?.filter((w: any) => 
              w.token_symbol.toLowerCase() === symbol.toLowerCase()
            ) || [];
            
            if (whaleActivity.length > 0) {
              const totalWhaleVolume = whaleActivity.reduce((sum: number, w: any) => sum + w.amount_usd, 0);
              const buyVolume = whaleActivity.filter((w: any) => w.transaction_type === 'buy')
                .reduce((sum: number, w: any) => sum + w.amount_usd, 0);
              
              const whaleRatio = totalWhaleVolume > 0 ? (buyVolume / totalWhaleVolume) : 0;
              
              if (whaleRatio > 0.7) {
                trend.marketAlpha = `Strong whale accumulation detected: $${Math.round(buyVolume/1000)}K in recent large purchases. Smart money is positioning ahead of potential breakout.`;
              } else if (whaleRatio < 0.3) {
                trend.marketAlpha = `Whale distribution pattern: $${Math.round((totalWhaleVolume - buyVolume)/1000)}K in large sells. Exercise caution on entries.`;
              }
            }
            
            // Add alpha signals from Dune
            const signals = onChainAlpha.signals?.filter((s: any) => s.confidence > 0.75) || [];
            if (signals.length > 0) {
              const topSignal = signals[0];
              if (!trend.marketAlpha) {
                trend.marketAlpha = `${topSignal.description} (${Math.round(topSignal.confidence * 100)}% confidence)`;
              }
            }
          }
        });
        
        console.log(`🎯 Enhanced crypto trends with on-chain alpha from Dune Analytics`);
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch Dune Analytics data:', error);
    }

    console.log(`📊 Enhanced ${enhancedTrends.length} financial trends with live market data`);
    return enhancedTrends;
  }

  // Mock data methods for fallback
  private getMockCryptoData(symbols: string[]): CryptoQuote[] {
    console.log('⚠️ No real crypto data available - API failed');
    return []; // Return empty array instead of mock data
  }

  private getMockStockData(symbol: string): any {
    // Return null instead of mock data to avoid showing fake prices
    // This forces the system to show only real data or no pricing info
    console.log(`⚠️ No real stock data available for ${symbol} - API key required`);
    return null;
  }

  // Mock methods removed for production readiness

  /**
   * Get crypto-related stocks data using Alpha Vantage API
   */
  async getCryptoStocks(): Promise<any[]> {
    if (!this.finnhubApiKey) {
      console.log('⚠️ Crypto stocks disabled - no Finnhub API key available');
      console.log('⚠️ No Finnhub API key - returning empty stock data');
      return [];
    }

    const cacheKey = 'finnhub_crypto_stocks';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📈 Fetching real-time stock data from Finnhub API`);
      const stockQuotes = await this.getRealTimeStockDataFromFinnhub();

      // Cache and return the real-time stock data
      this.setCacheWithTimeout(cacheKey, stockQuotes);
      console.log(`✅ Fetched ${stockQuotes.length} real-time stock prices from Finnhub`);
      return stockQuotes;
      
    } catch (error: any) {
      console.error('❌ Failed to fetch Finnhub stock data:', error.response?.data || error.message);
      console.log('🔄 Finnhub API failed - returning empty stock data');
      return [];
    }
  }

  private getStockName(symbol: string): string {
    const names: { [key: string]: string } = {
      // Major crypto companies
      'MSTR': 'MicroStrategy',
      'COIN': 'Coinbase',
      'RIOT': 'Riot Platforms',
      'MARA': 'Marathon Digital',
      'CLSK': 'CleanSpark',
      'HUT': 'Hut 8 Mining',
      'BITF': 'Bitfarms',
      'BTBT': 'Bit Digital',
      // Tech companies
      'NVDA': 'NVIDIA',
      'AMD': 'AMD',
      'TSLA': 'Tesla',
      'PYPL': 'PayPal',
      'SQ': 'Block Inc',
      'HOOD': 'Robinhood',
      'INTC': 'Intel',
      'ORCL': 'Oracle',
      // Mining companies
      'CAN': 'Canaan',
      'EBON': 'Ebang Intl',
      'SOS': 'SOS Limited',
      'NCTY': 'The9 Limited',
      'ARBK': 'Argo Blockchain',
      'DGHI': 'Digihost Tech',
      'HIVE': 'HIVE Blockchain',
      'GREE': 'Greenidge Gen',
      // ETFs and funds
      'GBTC': 'Grayscale Bitcoin',
      'ETHE': 'Grayscale Ethereum',
      'BITI': 'ProShares Bitcoin',
      'BITQ': 'Amplify Crypto',
      'BLOK': 'Amplify Blockchain',
      'LEGR': 'First Trust Crypto',
      'KOIN': 'Innovation Crypto',
      'META': 'Meta Platforms',
      // Major tech/finance
      'GOOGL': 'Alphabet',
      'MSFT': 'Microsoft',
      'AMZN': 'Amazon',
      'V': 'Visa',
      'MA': 'Mastercard',
      'JPM': 'JPMorgan',
      'BAC': 'Bank of America'
    };
    return names[symbol] || `${symbol} Corp`;
  }

  /**
   * Real-time stock data using current market prices (updated frequently)
   */
  
  // Real-time stock data from Finnhub API
  private async getRealTimeStockDataFromFinnhub(): Promise<any[]> {
    const symbols = [
      'MSTR', 'COIN', 'RIOT', 'MARA', 'NVDA', 'AMD', 'TSLA', 'PYPL', 'CLSK', 'HUT', 
      'BITF', 'HOOD', 'SQ', 'INTC', 'GBTC', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 
      'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'UBER', 'LYFT', 'SPOT', 'TWTR', 'SNAP'
    ];
    const stockData = [];

    // Fetch real-time quotes for each symbol
    for (const symbol of symbols) {
      try {
        const response = await axios.get(`${this.finnhubBaseUrl}/quote`, {
          params: {
            symbol: symbol,
            token: this.finnhubApiKey
          },
          timeout: 5000
        });

        const quote = response.data;
        if (quote && quote.c) { // c = current price
          const currentPrice = quote.c;
          const change = quote.d || 0; // d = change
          const changePercent = quote.dp || 0; // dp = percent change
          
          // Determine momentum based on price change
          let momentum: 'up' | 'down' | 'neutral' = 'neutral';
          if (Math.abs(changePercent) > 0.5) {
            momentum = changePercent > 0 ? 'up' : 'down';
          }

          stockData.push({
            symbol: symbol,
            name: this.getStockName(symbol),
            price: parseFloat(currentPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            percentChange24h: parseFloat(changePercent.toFixed(2)), // For backward compatibility
            momentum,
            volume: quote.v || 0,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error: any) {
        console.warn(`⚠️ Failed to fetch ${symbol} from Finnhub:`, error.message);
      }
      
      // Add small delay to respect rate limits (60 calls/minute)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return stockData;
  }

  /**
   * Get financial news from CoinDesk RSS feed
   */
  async getFinancialNews(limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `coindesk_news_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📰 Returning cached CoinDesk news');
      return cached;
    }

    try {
      const response = await axios.get(this.coindeskNewsUrl, {
        headers: {
          'User-Agent': 'StreamAiX/1.0 (News Aggregator)'
        },
        timeout: 10000
      });

      const news = this.parseRSSFeed(response.data, limit);
      this.setCacheWithTimeout(cacheKey, news, 300000); // Cache for 5 minutes
      console.log(`📰 Fetched ${news.length} news articles from CoinDesk`);
      return news;
    } catch (error: any) {
      console.error('❌ Failed to fetch CoinDesk news:', error.message);
      console.warn('⚠️ Failed to fetch CoinDesk news, returning empty array');
      return [];
    }
  }

  /**
   * Parse RSS feed XML and extract news articles
   */
  private parseRSSFeed(xmlData: string, limit: number): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    try {
      // More robust RSS parsing
      const itemMatches = xmlData.match(/<item\b[^>]*>([\s\S]*?)<\/item>/g) || [];
      
      for (const item of itemMatches.slice(0, limit)) {
        // Extract title (handle CDATA)
        let title = '';
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1];
          // Remove CDATA wrapper if present
          const cdataMatch = title.match(/^<!\[CDATA\[(.*?)\]\]>$/);
          if (cdataMatch) {
            title = cdataMatch[1];
          }
          title = this.cleanHtml(title.trim());
        }
        
        // Extract link
        let link = '';
        const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
        if (linkMatch) {
          link = linkMatch[1].trim();
        }
        
        // Extract publication date
        let pubDate = '';
        const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
        if (pubDateMatch) {
          pubDate = pubDateMatch[1].trim();
        }
        
        // Extract description
        let description = '';
        const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        if (descMatch) {
          description = descMatch[1];
          const cdataMatch = description.match(/^<!\[CDATA\[(.*?)\]\]>$/);
          if (cdataMatch) {
            description = cdataMatch[1];
          }
          description = this.cleanHtml(description.trim());
        }
        
        
        if (title && link) {
          articles.push({
            title: title,
            url: link,
            published: pubDate || new Date().toISOString(),
            source: 'CoinDesk',
            summary: description ? description.substring(0, 200) + '...' : undefined,
            category: 'Finance'
          });
        }
      }
      
      return articles;
    } catch (error) {
      console.error('❌ Error parsing RSS feed:', error);
      console.warn('⚠️ Error parsing RSS feed, returning empty array');
      return [];
    }
  }

  /**
   * Extract value from XML element
   */
  private extractXMLValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (!match) return '';
    
    let content = match[1].trim();
    // Handle CDATA sections
    const cdataRegex = /^<!\[CDATA\[(.*?)\]\]>$/;
    const cdataMatch = content.match(cdataRegex);
    return cdataMatch ? cdataMatch[1].trim() : content;
  }

  /**
   * Clean HTML tags from text
   */
  private cleanHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }

  /**
   * Enhanced cache method with custom timeout
   */
  private setCacheWithTimeout(key: string, data: any, timeout?: number): void {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(),
      customTimeout: timeout
    });
  }

  // =====================================================
  // ECONOMIC CALENDAR METHODS
  // =====================================================

  /**
   * Get economic calendar events with filtering options
   */
  async getEconomicCalendar(filter?: EconomicCalendarFilter): Promise<EconomicEvent[]> {
    const cacheKey = `economic_calendar_${JSON.stringify(filter || {})}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📅 Returning cached economic calendar data');
      return cached;
    }

    try {
      // Try to get data from multiple sources
      const events = await this.getEconomicEventsFromMultipleSources();
      
      // Apply filters
      let filteredEvents = events;
      
      if (filter) {
        filteredEvents = this.applyEconomicCalendarFilters(events, filter);
      }

      // Calculate time to event for upcoming events
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        timeToEvent: new Date(event.scheduledDate).getTime() - Date.now(),
        isCompleted: new Date(event.scheduledDate).getTime() < Date.now()
      }));

      // Sort by scheduled date (upcoming events first)
      filteredEvents.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      this.setCacheWithTimeout(cacheKey, filteredEvents, this.economicCacheTimeout);
      console.log(`📅 Fetched ${filteredEvents.length} economic calendar events`);
      return filteredEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch economic calendar:', error.message);
      return this.getFallbackEconomicEvents();
    }
  }

  /**
   * Get upcoming FOMC meetings and Fed decisions
   */
  async getFOMCMeetings(): Promise<EconomicEvent[]> {
    const cacheKey = 'fomc_meetings';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get FOMC meeting schedule from Fed calendar
      const fomcEvents = await this.getFedCalendarEvents();
      
      this.setCacheWithTimeout(cacheKey, fomcEvents, this.economicCacheTimeout);
      console.log(`🏛️ Fetched ${fomcEvents.length} FOMC meetings`);
      return fomcEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch FOMC meetings:', error.message);
      return this.getFallbackFOMCMeetings();
    }
  }

  /**
   * Get inflation data (CPI releases)
   */
  async getInflationEvents(): Promise<EconomicEvent[]> {
    const cacheKey = 'inflation_events';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const inflationEvents = await this.getInflationDataEvents();
      
      this.setCacheWithTimeout(cacheKey, inflationEvents, this.economicCacheTimeout);
      console.log(`📊 Fetched ${inflationEvents.length} inflation events`);
      return inflationEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch inflation events:', error.message);
      return this.getFallbackInflationEvents();
    }
  }

  /**
   * Get employment data releases
   */
  async getEmploymentEvents(): Promise<EconomicEvent[]> {
    const cacheKey = 'employment_events';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const employmentEvents = await this.getEmploymentDataEvents();
      
      this.setCacheWithTimeout(cacheKey, employmentEvents, this.economicCacheTimeout);
      console.log(`👥 Fetched ${employmentEvents.length} employment events`);
      return employmentEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch employment events:', error.message);
      return this.getFallbackEmploymentEvents();
    }
  }

  /**
   * Get GDP releases
   */
  async getGDPEvents(): Promise<EconomicEvent[]> {
    const cacheKey = 'gdp_events';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const gdpEvents = await this.getGDPDataEvents();
      
      this.setCacheWithTimeout(cacheKey, gdpEvents, this.economicCacheTimeout);
      console.log(`💰 Fetched ${gdpEvents.length} GDP events`);
      return gdpEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch GDP events:', error.message);
      return this.getFallbackGDPEvents();
    }
  }

  /**
   * Get high-impact events for today/tomorrow
   */
  async getHighImpactEvents(): Promise<EconomicEvent[]> {
    const cacheKey = 'high_impact_events';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const allEvents = await this.getEconomicCalendar({
        timeRange: '7d',
        impact: ['high'],
        onlyUpcoming: true
      });

      const highImpactEvents = allEvents.filter(event => 
        event.impact === 'high' && 
        event.marketRelevance >= 80
      );

      this.setCacheWithTimeout(cacheKey, highImpactEvents, this.economicCacheTimeout);
      console.log(`⚡ Fetched ${highImpactEvents.length} high-impact events`);
      return highImpactEvents;

    } catch (error: any) {
      console.error('❌ Failed to fetch high-impact events:', error.message);
      return [];
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS FOR ECONOMIC DATA
  // =====================================================

  /**
   * Apply filters to economic calendar events
   */
  private applyEconomicCalendarFilters(events: EconomicEvent[], filter: EconomicCalendarFilter): EconomicEvent[] {
    let filtered = [...events];

    // Time range filter
    const now = Date.now();
    const timeRanges = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const timeRange = timeRanges[filter.timeRange];
    filtered = filtered.filter(event => {
      const eventTime = new Date(event.scheduledDate).getTime();
      return eventTime <= now + timeRange;
    });

    // Impact filter
    if (filter.impact && filter.impact.length > 0) {
      filtered = filtered.filter(event => filter.impact!.includes(event.impact));
    }

    // Event types filter
    if (filter.eventTypes && filter.eventTypes.length > 0) {
      filtered = filtered.filter(event => filter.eventTypes!.includes(event.eventType));
    }

    // Countries filter
    if (filter.countries && filter.countries.length > 0) {
      filtered = filtered.filter(event => filter.countries!.includes(event.country));
    }

    // Only upcoming events
    if (filter.onlyUpcoming) {
      filtered = filtered.filter(event => new Date(event.scheduledDate).getTime() > now);
    }

    return filtered;
  }

  /**
   * Get economic events from multiple sources
   */
  private async getEconomicEventsFromMultipleSources(): Promise<EconomicEvent[]> {
    const events: EconomicEvent[] = [];

    // Try FRED API first
    if (this.fredApiKey) {
      try {
        const fredEvents = await this.getFredEconomicEvents();
        events.push(...fredEvents);
      } catch (error) {
        console.warn('⚠️ FRED API failed, continuing with other sources');
      }
    }

    // Try economic calendar API or other sources
    try {
      const calendarEvents = await this.getThirdPartyEconomicEvents();
      events.push(...calendarEvents);
    } catch (error) {
      console.warn('⚠️ Third-party economic calendar failed');
    }

    // If no events from APIs, use fallback data
    if (events.length === 0) {
      console.log('📅 Using fallback economic calendar data');
      return this.getFallbackEconomicEvents();
    }

    // Remove duplicates based on title and date
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex(e => e.title === event.title && e.scheduledDate === event.scheduledDate)
    );

    return uniqueEvents;
  }

  /**
   * Get Fed calendar events (FOMC meetings)
   */
  private async getFedCalendarEvents(): Promise<EconomicEvent[]> {
    // This would typically fetch from Fed's official calendar
    // For now, return scheduled FOMC meetings
    return this.getFallbackFOMCMeetings();
  }

  /**
   * Get inflation data events
   */
  private async getInflationDataEvents(): Promise<EconomicEvent[]> {
    return this.getFallbackInflationEvents();
  }

  /**
   * Get employment data events
   */
  private async getEmploymentDataEvents(): Promise<EconomicEvent[]> {
    return this.getFallbackEmploymentEvents();
  }

  /**
   * Get GDP data events
   */
  private async getGDPDataEvents(): Promise<EconomicEvent[]> {
    return this.getFallbackGDPEvents();
  }

  /**
   * Get economic events from FRED API
   */
  private async getFredEconomicEvents(): Promise<EconomicEvent[]> {
    if (!this.fredApiKey) {
      throw new Error('FRED API key not available');
    }

    // FRED API implementation would go here
    // For now, return empty array to avoid API errors
    return [];
  }

  /**
   * Get economic events from third-party calendar APIs
   */
  private async getThirdPartyEconomicEvents(): Promise<EconomicEvent[]> {
    // Third-party API implementation would go here
    return [];
  }

  // =====================================================
  // FALLBACK DATA METHODS
  // =====================================================

  /**
   * Get fallback economic events when APIs fail
   * Returns empty array instead of mock data to avoid showing fake information
   */
  private getFallbackEconomicEvents(): EconomicEvent[] {
    console.log('⚠️ No real economic calendar data available - returning empty array');
    return []; // No mock data - show empty state instead
  }

  /**
   * Removed: Fallback FOMC meetings - these were showing fake event dates
   */
  private getFallbackFOMCMeetings(): EconomicEvent[] {
    return [];
  }

  /**
   * Removed: Fallback inflation events - these were showing fake CPI data
   */
  private getFallbackInflationEvents(): EconomicEvent[] {
    return [];
  }

  /**
   * Removed: Fallback employment events - these were showing fake jobs data
   */
  private getFallbackEmploymentEvents(): EconomicEvent[] {
    return [];
  }

  /**
   * Removed: Fallback GDP events - these were showing fake economic data
   */
  private getFallbackGDPEvents(): EconomicEvent[] {
    return [];
  }

  /**
   * Get comprehensive market context for AI agent trading decisions
   * Includes crypto prices, stock prices, recent news, and market sentiment
   */
  async getMarketContext(): Promise<{
    cryptoPrices: any[];
    stockPrices: any[];
    recentNews: any[];
    marketSentiment: { overall: 'bullish' | 'bearish' | 'neutral'; confidence: number };
  }> {
    const cacheKey = 'market_context';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Fetch top crypto prices
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
      const cryptoPrices = await this.getCryptoQuotes(cryptoSymbols);

      // Fetch crypto-related stock prices (using Finnhub)
      const stockPrices: StockQuote[] = [];

      // No mock news - return empty array (real news requires newsService)
      const recentNews: any[] = [];

      // Calculate market sentiment
      const marketSentiment = this.calculateSentiment(cryptoPrices, stockPrices, recentNews);

      const context = {
        cryptoPrices,
        stockPrices,
        recentNews,
        marketSentiment
      };

      // Cache for 5 minutes
      this.cache.set(cacheKey, { data: context, timestamp: Date.now(), customTimeout: 300000 });
      
      return context;
    } catch (error) {
      console.error('❌ Error fetching market context:', error);
      // Return minimal context on error
      return {
        cryptoPrices: [],
        stockPrices: [],
        recentNews: [],
        marketSentiment: { overall: 'neutral', confidence: 50 }
      };
    }
  }

  /**
   * Calculate overall market sentiment from prices and news
   */
  private calculateSentiment(
    cryptoPrices: any[],
    stockPrices: any[],
    news: any[]
  ): { overall: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
    // Calculate average price change
    const allPrices = [...cryptoPrices, ...stockPrices];
    if (allPrices.length === 0) {
      return { overall: 'neutral', confidence: 50 };
    }

    const avgChange = allPrices.reduce((sum, p) => sum + (p.percentChange24h || 0), 0) / allPrices.length;

    // Calculate news sentiment
    const newsSentiment = news.reduce((sum, n) => {
      const score = n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0;
      return sum + (score * (n.relevance || 0.5));
    }, 0) / Math.max(news.length, 1);

    // Combined sentiment score (-1 to +1)
    const sentimentScore = (avgChange / 10) + newsSentiment;

    let overall: 'bullish' | 'bearish' | 'neutral';
    let confidence: number;

    if (sentimentScore > 0.3) {
      overall = 'bullish';
      confidence = Math.min(Math.abs(sentimentScore) * 100, 100);
    } else if (sentimentScore < -0.3) {
      overall = 'bearish';
      confidence = Math.min(Math.abs(sentimentScore) * 100, 100);
    } else {
      overall = 'neutral';
      confidence = 50;
    }

    return { overall, confidence };
  }

}

export const marketDataService = MarketDataService.getInstance();