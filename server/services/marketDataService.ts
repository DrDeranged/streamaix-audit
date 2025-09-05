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
  private cmcBaseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private coindeskNewsUrl = 'https://www.coindesk.com/arc/outboundfeeds/rss';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache
  
  // Crypto-related stocks list
  private cryptoStocks = [
    'MSTR', 'TSLA', 'SQ', 'PYPL', 'NVDA', 'AMD', 'INTC', 'COIN',
    'HOOD', 'RIOT', 'MARA', 'CAN', 'BTBT', 'EBON', 'SOS', 'NCTY',
    'ARBK', 'DGHI', 'GBTC', 'ETHE', 'BITF', 'HUT', 'HIVE', 'CLSK'
  ];

  constructor() {
    this.cmcApiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
    
    console.log('🔑 Market Data Service initialized:');
    console.log(`  - CoinMarketCap: ${this.cmcApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - CoinGecko: ${this.coingeckoApiKey ? '✅ Available' : '❌ Missing'}`);
    
    if (!this.cmcApiKey && !this.coingeckoApiKey) {
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
    
    const timeout = (cached as any).customTimeout || this.cacheTimeout;
    return Date.now() - cached.timestamp < timeout;
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
    
    // Convert symbols to CoinGecko IDs (simplified mapping)
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
        'LINK': 'chainlink'
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

      this.setCache(cacheKey, quotes);
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

      this.setCache(cacheKey, quotes);
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

  /**
   * Get crypto-related stocks data
   */
  async getCryptoStocks(): Promise<StockQuote[]> {
    const cacheKey = 'crypto_stocks';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock data for crypto stocks since we don't have stock API keys
      const mockStocks: StockQuote[] = this.cryptoStocks.map((symbol, index) => {
        const basePrice = Math.random() * 500 + 50;
        const change = (Math.random() - 0.5) * 10;
        return {
          symbol: symbol,
          name: this.getStockName(symbol),
          price: basePrice,
          percentChange24h: change,
          marketCap: basePrice * 1000000000 * Math.random(),
          volume: Math.random() * 10000000,
          lastUpdated: new Date().toISOString()
        };
      });

      this.setCache(cacheKey, mockStocks);
      console.log(`📈 Generated crypto stock data for ${this.cryptoStocks.length} symbols`);
      return mockStocks;
    } catch (error) {
      console.error('❌ Failed to fetch crypto stocks:', error);
      return [];
    }
  }

  private getStockName(symbol: string): string {
    const names: { [key: string]: string } = {
      'MSTR': 'MicroStrategy Inc',
      'TSLA': 'Tesla Inc',
      'SQ': 'Block Inc',
      'PYPL': 'PayPal Holdings',
      'NVDA': 'NVIDIA Corporation',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'COIN': 'Coinbase Global Inc',
      'HOOD': 'Robinhood Markets',
      'RIOT': 'Riot Platforms Inc',
      'MARA': 'Marathon Digital',
      'CAN': 'Canaan Inc',
      'BTBT': 'Bit Digital Inc',
      'EBON': 'Ebang International',
      'SOS': 'SOS Limited',
      'NCTY': '9th City Ltd',
      'ARBK': 'Argo Blockchain',
      'DGHI': 'Digihost Technology',
      'GBTC': 'Grayscale Bitcoin Trust',
      'ETHE': 'Grayscale Ethereum Trust',
      'BITF': 'Bitfarms Ltd',
      'HUT': 'Hut 8 Mining Corp',
      'HIVE': 'HIVE Blockchain',
      'CLSK': 'CleanSpark Inc'
    };
    return names[symbol] || `${symbol} Corp`;
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
      this.setCache(cacheKey, news, 300000); // Cache for 5 minutes
      console.log(`📰 Fetched ${news.length} news articles from CoinDesk`);
      return news;
    } catch (error: any) {
      console.error('❌ Failed to fetch CoinDesk news:', error.message);
      return this.getMockNews(limit);
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
          const cdataMatch = title.match(/^<!\[CDATA\[(.*?)\]\]>$/s);
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
          const cdataMatch = description.match(/^<!\[CDATA\[(.*?)\]\]>$/s);
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
      return this.getMockNews(limit);
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
    const cdataRegex = /^<!\[CDATA\[(.*?)\]\]>$/s;
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
  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(),
      customTimeout: timeout
    });
  }

  /**
   * Mock news data for fallback
   */
  private getMockNews(limit: number): NewsArticle[] {
    const mockArticles = [
      {
        title: "CoinDesk News Service Unavailable",
        url: "https://coindesk.com",
        published: new Date().toISOString(),
        source: "System",
        summary: "Real-time financial news requires active internet connection and CoinDesk service availability.",
        category: "System"
      }
    ];
    
    return mockArticles.slice(0, limit);
  }
}

export const marketDataService = MarketDataService.getInstance();