import axios from 'axios';
import { duneAnalyticsService } from './duneAnalyticsService';

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

export class MarketDataService {
  private static instance: MarketDataService;
  private cmcApiKey: string;
  private coingeckoApiKey: string;
  private alphaVantageApiKey: string;
  private finnhubApiKey: string;
  private cmcBaseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private alphaVantageBaseUrl = 'https://www.alphavantage.co/query';
  private finnhubBaseUrl = 'https://finnhub.io/api/v1';
  private coindeskNewsUrl = 'https://www.coindesk.com/arc/outboundfeeds/rss';
  private cache = new Map<string, { data: any; timestamp: number; customTimeout?: number }>();
  private cacheTimeout = 30000; // 30 second cache for real-time data
  
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
    
    console.log('🔑 Market Data Service initialized:');
    console.log(`  - CoinMarketCap: ${this.cmcApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - CoinGecko: ${this.coingeckoApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Alpha Vantage: ${this.alphaVantageApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Finnhub: ${this.finnhubApiKey ? '✅ Available' : '❌ Missing'}`);
    
    if (!this.cmcApiKey && !this.coingeckoApiKey && !this.alphaVantageApiKey && !this.finnhubApiKey) {
      console.warn('⚠️ No market data API keys found - using fallback data');
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
   * Get live cryptocurrency data by symbols using CoinGecko (with CoinMarketCap fallback)
   */
  async getCryptoQuotes(symbols: string[]): Promise<CryptoQuote[]> {
    const cacheKey = `crypto_${symbols.join(',').toUpperCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Try CoinGecko first (better free tier)
    if (this.coingeckoApiKey) {
      try {
        return await this.getCryptoQuotesFromCoinGecko(symbols);
      } catch (error) {
        console.warn('⚠️ CoinGecko failed, trying CoinMarketCap fallback');
      }
    }

    // Fallback to CoinMarketCap
    if (this.cmcApiKey) {
      try {
        return await this.getCryptoQuotesFromCMC(symbols);
      } catch (error) {
        console.error('❌ Both APIs failed, using empty data');
      }
    }

    // No APIs available
    console.warn('⚠️ No market data APIs available');
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
      console.error('❌ CoinGecko API error:', error.response?.data || error.message);
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
      console.error('❌ [CoinMarketCap] API error:', error.response?.data || error.message);
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

}

export const marketDataService = MarketDataService.getInstance();