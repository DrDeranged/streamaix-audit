import axios from 'axios';

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector: string;
}

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  sector: string;
  reason: string;
}

class StockMarketService {
  private static instance: StockMarketService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private finnhubApiKey = process.env.FINNHUB_API_KEY || '';

  // Major tech/AI stocks to track
  private techAiStocks = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'AI/Semiconductors' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'AI/Cloud' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'AI/Search' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'AI/Social' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'AI/Cloud' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tech/Consumer' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'AI/Semiconductors' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'AI/EV' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'AI/Enterprise' },
    { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'AI/Enterprise' },
    { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'AI/Data' },
    { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'AI/Data' },
    { symbol: 'AI', name: 'C3.ai Inc.', sector: 'AI/Enterprise' },
    { symbol: 'PATH', name: 'UiPath Inc.', sector: 'AI/Automation' },
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', sector: 'AI/Cybersecurity' },
    { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'AI/Cybersecurity' },
    { symbol: 'MU', name: 'Micron Technology', sector: 'AI/Memory' },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'AI/Semiconductors' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'AI/Semiconductors' },
    { symbol: 'MRVL', name: 'Marvell Technology', sector: 'AI/Semiconductors' },
    { symbol: 'ARM', name: 'ARM Holdings', sector: 'AI/Semiconductors' },
    { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'AI/Infrastructure' },
    { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'AI/Enterprise' },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'AI/Software' },
    { symbol: 'IBM', name: 'IBM Corporation', sector: 'AI/Enterprise' },
    { symbol: 'UBER', name: 'Uber Technologies', sector: 'Tech/Mobility' },
    { symbol: 'COIN', name: 'Coinbase Global', sector: 'Crypto/Tech' },
    { symbol: 'MSTR', name: 'MicroStrategy Inc.', sector: 'Crypto/Tech' },
    { symbol: 'SQ', name: 'Block Inc.', sector: 'Fintech' },
    { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Tech/E-commerce' },
  ];

  private constructor() {}

  static getInstance(): StockMarketService {
    if (!StockMarketService.instance) {
      StockMarketService.instance = new StockMarketService();
    }
    return StockMarketService.instance;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  async getStockQuote(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol,
          token: this.finnhubApiKey
        },
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch quote for ${symbol}`);
      return null;
    }
  }

  async getTechAiMovers(): Promise<{ gainers: StockMover[]; losers: StockMover[]; trending: TrendingStock[] }> {
    const cacheKey = 'tech_ai_movers';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const stockData: StockMover[] = [];

    // Fetch quotes for all tech/AI stocks in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < this.techAiStocks.length; i += batchSize) {
      const batch = this.techAiStocks.slice(i, i + batchSize);
      const promises = batch.map(async (stock) => {
        try {
          const quote = await this.getStockQuote(stock.symbol);
          if (quote && quote.c > 0) {
            return {
              symbol: stock.symbol,
              name: stock.name,
              price: quote.c,
              change: quote.d || 0,
              changePercent: quote.dp || 0,
              volume: quote.v || 0,
              sector: stock.sector
            };
          }
        } catch (e) {
          // Skip failed requests
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.forEach(r => {
        if (r) stockData.push(r);
      });

      // Small delay between batches
      if (i + batchSize < this.techAiStocks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // If we couldn't fetch real data, use simulated data
    if (stockData.length < 10) {
      return this.getSimulatedMovers();
    }

    // Sort by change percentage
    const sorted = [...stockData].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sorted.filter(s => s.changePercent > 0).slice(0, 10);
    const losers = sorted.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);

    // Trending based on volume and movement
    const trending: TrendingStock[] = [...stockData]
      .filter(s => Math.abs(s.changePercent) > 1)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 10)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        volume: s.volume,
        sector: s.sector,
        reason: s.changePercent > 3 ? 'Breakout' : s.changePercent < -3 ? 'Selloff' : 'Active'
      }));

    const result = { gainers, losers, trending };
    this.setCache(cacheKey, result, 300000); // 5 min cache
    return result;
  }

  private getSimulatedMovers(): { gainers: StockMover[]; losers: StockMover[]; trending: TrendingStock[] } {
    // Simulated data for when API is unavailable
    const now = new Date();
    const baseVariation = Math.sin(now.getTime() / 3600000) * 2;

    const simulatedGainers: StockMover[] = [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 142.50 + baseVariation, change: 5.23, changePercent: 3.8, volume: 45000000, sector: 'AI/Semiconductors' },
      { symbol: 'SMCI', name: 'Super Micro Computer', price: 42.80 + baseVariation, change: 2.15, changePercent: 5.3, volume: 12000000, sector: 'AI/Infrastructure' },
      { symbol: 'PLTR', name: 'Palantir Technologies', price: 71.20 + baseVariation, change: 2.85, changePercent: 4.2, volume: 28000000, sector: 'AI/Data' },
      { symbol: 'ARM', name: 'ARM Holdings', price: 158.40 + baseVariation, change: 4.92, changePercent: 3.2, volume: 8500000, sector: 'AI/Semiconductors' },
      { symbol: 'MSTR', name: 'MicroStrategy Inc.', price: 395.00 + baseVariation * 5, change: 18.50, changePercent: 4.9, volume: 15000000, sector: 'Crypto/Tech' },
      { symbol: 'COIN', name: 'Coinbase Global', price: 312.50 + baseVariation * 3, change: 12.40, changePercent: 4.1, volume: 22000000, sector: 'Crypto/Tech' },
    ];

    const simulatedLosers: StockMover[] = [
      { symbol: 'INTC', name: 'Intel Corporation', price: 20.15 - baseVariation, change: -0.85, changePercent: -4.1, volume: 52000000, sector: 'AI/Semiconductors' },
      { symbol: 'AI', name: 'C3.ai Inc.', price: 35.20 - baseVariation, change: -1.42, changePercent: -3.9, volume: 5500000, sector: 'AI/Enterprise' },
      { symbol: 'PATH', name: 'UiPath Inc.', price: 13.80 - baseVariation, change: -0.48, changePercent: -3.4, volume: 4200000, sector: 'AI/Automation' },
      { symbol: 'SNOW', name: 'Snowflake Inc.', price: 178.90 - baseVariation, change: -5.20, changePercent: -2.8, volume: 6800000, sector: 'AI/Data' },
      { symbol: 'SHOP', name: 'Shopify Inc.', price: 108.50 - baseVariation, change: -2.35, changePercent: -2.1, volume: 9500000, sector: 'Tech/E-commerce' },
      { symbol: 'UBER', name: 'Uber Technologies', price: 68.40 - baseVariation, change: -1.15, changePercent: -1.7, volume: 18000000, sector: 'Tech/Mobility' },
    ];

    const simulatedTrending: TrendingStock[] = [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 142.50, changePercent: 3.8, volume: 45000000, sector: 'AI/Semiconductors', reason: 'AI Rally' },
      { symbol: 'MSTR', name: 'MicroStrategy Inc.', price: 395.00, changePercent: 4.9, volume: 15000000, sector: 'Crypto/Tech', reason: 'BTC Correlation' },
      { symbol: 'PLTR', name: 'Palantir Technologies', price: 71.20, changePercent: 4.2, volume: 28000000, sector: 'AI/Data', reason: 'Gov Contracts' },
      { symbol: 'COIN', name: 'Coinbase Global', price: 312.50, changePercent: 4.1, volume: 22000000, sector: 'Crypto/Tech', reason: 'Crypto Volume' },
      { symbol: 'SMCI', name: 'Super Micro Computer', price: 42.80, changePercent: 5.3, volume: 12000000, sector: 'AI/Infrastructure', reason: 'AI Servers' },
      { symbol: 'ARM', name: 'ARM Holdings', price: 158.40, changePercent: 3.2, volume: 8500000, sector: 'AI/Semiconductors', reason: 'Mobile AI' },
    ];

    return {
      gainers: simulatedGainers,
      losers: simulatedLosers,
      trending: simulatedTrending
    };
  }
}

export const stockMarketService = StockMarketService.getInstance();
