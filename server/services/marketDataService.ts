import axios from 'axios';

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

export class MarketDataService {
  private static instance: MarketDataService;
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ COINMARKETCAP_API_KEY not found - market data will be unavailable');
    }
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private getFromCache(key: string): any | null {
    if (this.isValidCache(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get live cryptocurrency data by symbols
   */
  async getCryptoQuotes(symbols: string[]): Promise<CryptoQuote[]> {
    if (!this.apiKey) {
      return this.getMockCryptoData(symbols);
    }

    const cacheKey = `crypto_${symbols.join(',').toUpperCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const symbolsStr = symbols.map(s => s.toUpperCase()).join(',');
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
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

      this.setCache(cacheKey, quotes);
      console.log(`📊 Fetched live crypto data for: ${symbols.join(', ')}`);
      return quotes;

    } catch (error: any) {
      console.error('❌ Failed to fetch crypto data:', error.response?.data || error.message);
      return this.getMockCryptoData(symbols);
    }
  }

  /**
   * Get cryptocurrency market information by symbol
   */
  async getCryptoInfo(symbol: string): Promise<any> {
    if (!this.apiKey) {
      return this.getMockCryptoInfo(symbol);
    }

    const cacheKey = `crypto_info_${symbol.toUpperCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/info`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json'
        },
        params: {
          symbol: symbol.toUpperCase()
        }
      });

      const info = response.data.data[symbol.toUpperCase()];
      this.setCache(cacheKey, info);
      return info;

    } catch (error: any) {
      console.error('❌ Failed to fetch crypto info:', error.response?.data || error.message);
      return this.getMockCryptoInfo(symbol);
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit: number = 20): Promise<CryptoQuote[]> {
    if (!this.apiKey) {
      return this.getMockTopCryptos(limit);
    }

    const cacheKey = `top_cryptos_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/listings/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
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

      this.setCache(cacheKey, quotes);
      console.log(`📊 Fetched top ${limit} cryptocurrencies`);
      return quotes;

    } catch (error: any) {
      console.error('❌ Failed to fetch top cryptos:', error.response?.data || error.message);
      return this.getMockTopCryptos(limit);
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

    return enhancedTrends;
  }

  // Mock data methods for fallback
  private getMockCryptoData(symbols: string[]): CryptoQuote[] {
    const mockData: Record<string, CryptoQuote> = {
      'BTC': {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 45230.50,
        percentChange24h: 2.4,
        percentChange7d: -1.2,
        percentChange30d: 8.7,
        marketCap: 885000000000,
        volume24h: 25000000000,
        rank: 1,
        lastUpdated: new Date().toISOString()
      },
      'ETH': {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2650.80,
        percentChange24h: 3.1,
        percentChange7d: 2.8,
        percentChange30d: 12.4,
        marketCap: 318000000000,
        volume24h: 15000000000,
        rank: 2,
        lastUpdated: new Date().toISOString()
      },
      'SOL': {
        symbol: 'SOL',
        name: 'Solana',
        price: 98.45,
        percentChange24h: 5.2,
        percentChange7d: 8.1,
        percentChange30d: 25.6,
        marketCap: 45000000000,
        volume24h: 2500000000,
        rank: 5,
        lastUpdated: new Date().toISOString()
      }
    };

    return symbols
      .map(symbol => mockData[symbol.toUpperCase()])
      .filter(Boolean);
  }

  private getMockStockData(symbol: string): any {
    // Return null instead of mock data to avoid showing fake prices
    // This forces the system to show only real data or no pricing info
    console.log(`⚠️ No real stock data available for ${symbol} - API key required`);
    return null;
  }

  private getMockCryptoInfo(symbol: string): any {
    return {
      name: symbol,
      symbol: symbol.toUpperCase(),
      description: `${symbol} cryptocurrency information`,
      website: [`https://${symbol.toLowerCase()}.org`],
      technical_doc: [`https://${symbol.toLowerCase()}.org/whitepaper`]
    };
  }

  private getMockTopCryptos(limit: number): CryptoQuote[] {
    const topCryptos = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
    return topCryptos.slice(0, limit).map((symbol, index) => ({
      symbol,
      name: `${symbol} Token`,
      price: Math.random() * 1000 + 100,
      percentChange24h: (Math.random() - 0.5) * 10,
      percentChange7d: (Math.random() - 0.5) * 20,
      percentChange30d: (Math.random() - 0.5) * 40,
      marketCap: Math.random() * 100000000000,
      volume24h: Math.random() * 10000000000,
      rank: index + 1,
      lastUpdated: new Date().toISOString()
    }));
  }
}

export const marketDataService = MarketDataService.getInstance();