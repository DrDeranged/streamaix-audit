import axios from 'axios';
import { duneAnalyticsService } from './duneAnalyticsService';
import { MarketDataService } from './marketDataService';
import { macroDataService } from './macroDataService';

export interface MarketPulseSection<T> {
  data: T;
  asOf?: string;
  delayed?: boolean;
}

export interface MarketPulse {
  asOf: string;
  delayed: boolean;
  btcDominance?: MarketPulseSection<{ value: number; trend?: number }>;
  totalMarketCap?: MarketPulseSection<{ value: number; trend?: number }>;
  fearGreed?: MarketPulseSection<any>;
  unusualVolumeCount?: MarketPulseSection<number>;
  movers?: MarketPulseSection<any[]>;
  sectorSplit?: MarketPulseSection<Array<{ sector: string; gainers: number; losers: number }>>;
  earnings?: MarketPulseSection<any[]>;
}

/** Kept pure/exported so the volume policy can be tested without HTTP calls. */
export function percentileRank(value: number, sample: number[]): number {
  const values = sample.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length || !Number.isFinite(value)) return 0;
  return Math.round((values.filter(v => v <= value).length / values.length) * 100);
}

export function isUnusualVolume(volume24h: number, average30d: number): boolean {
  return Number.isFinite(volume24h) && Number.isFinite(average30d) &&
    average30d > 0 && volume24h >= average30d * 1.5;
}

export function selectMarketMovers(coins: any[], count = 5): any[] {
  const stable = new Set(['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'USDE', 'USDS']);
  const valid = coins.filter(coin => !stable.has(String(coin.symbol || '').toUpperCase()) &&
    Number.isFinite(Number(coin.price_change_percentage_24h)));
  const gainers = [...valid].sort((a, b) => Number(b.price_change_percentage_24h) - Number(a.price_change_percentage_24h)).slice(0, count);
  const losers = [...valid].sort((a, b) => Number(a.price_change_percentage_24h) - Number(b.price_change_percentage_24h)).slice(0, count);
  return [...gainers, ...losers].filter((coin, index, all) => all.findIndex(item => item.id === coin.id) === index);
}

export function previousDominanceShift(currentDominance: number, totalCapChange: number, btcCapChange: number): number | undefined {
  if (![currentDominance, totalCapChange, btcCapChange].every(Number.isFinite) ||
      currentDominance < 0 || currentDominance > 100 ||
      1 + totalCapChange / 100 <= 0 || 1 + btcCapChange / 100 <= 0) return undefined;
  const currentTotal = 1;
  const previousTotal = currentTotal / (1 + totalCapChange / 100);
  const currentBtc = currentDominance / 100;
  const previousBtc = currentBtc / (1 + btcCapChange / 100);
  const previousDominance = (previousBtc / previousTotal) * 100;
  return Number.isFinite(previousDominance) ? currentDominance - previousDominance : undefined;
}

interface UnifiedMarketData {
  // Asset identification
  symbol: string;
  name: string;
  category: 'Crypto' | 'Stocks' | 'Bonds' | 'Commodities' | 'ETFs' | 'Forex';
  
  // Price data
  price: number;
  percentChange24h: number;
  percentChange7d?: number;
  percentChange30d?: number;
  
  // Volume & market data
  volume24h?: number;
  marketCap?: number;
  
  // Asset-specific data
  fundamentals?: {
    pe_ratio?: number;
    dividend_yield?: number;
    book_value?: number;
    earnings_growth?: number;
    revenue_growth?: number;
    debt_to_equity?: number;
  };
  
  // Alternative data
  sentiment?: number;
  socialMentions?: number;
  institutionalFlow?: number;
  
  // On-chain data (for crypto)
  onChainMetrics?: {
    whaleActivity?: string;
    dexVolume?: number;
    protocolTvl?: number;
    activeAddresses?: number;
  };
  
  // Yield data (for bonds/commodities)
  yield?: number;
  duration?: number;
  
  // Alpha signals
  alphaSignals?: Array<{
    type: string;
    strength: 'weak' | 'moderate' | 'strong';
    description: string;
    confidence: number;
  }>;
  
  lastUpdated: string;
}

interface TreasuryYieldData {
  date: string;
  value: number;
  series_id: string;
}

interface CommodityData {
  name: string;
  price: number;
  unit: string;
  change_24h?: number;
  timestamp: string;
}

export class ComprehensiveMarketService {
  private static instance: ComprehensiveMarketService;
  private marketDataService: MarketDataService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 60 * 60 * 1000; // 60 minutes (increased from 5 min to save API calls)
  
  // API Keys
  private readonly fredApiKey = process.env.FRED_API_KEY;
  private readonly alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly commoditiesApiKey = process.env.COMMODITIES_API_KEY;
  private readonly coingeckoProKey = process.env.COINGECKO_PRO_API_KEY || '';
  private readonly finnhubKey = process.env.FINNHUB_API_KEY || '';
  private pulseCache = new Map<string, { data: any; timestamp: number }>();
  private pulseWarnings = new Set<string>();
  private pulseFailures = new Map<string, number>();
  private pulseDisabled = new Set<string>();
  private readonly pulseFailureCooldown = 5 * 60 * 1000;
  private pulseHistoryCache = new Map<string, { data: { volumes: number[]; high: number; low: number }; timestamp: number }>();
  private readonly pulseCacheTimeout = 10 * 60 * 1000;
  
  constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }

  static getInstance(): ComprehensiveMarketService {
    if (!ComprehensiveMarketService.instance) {
      ComprehensiveMarketService.instance = new ComprehensiveMarketService();
    }
    return ComprehensiveMarketService.instance;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private warnPulseProvider(provider: string, error: unknown): void {
    if (!this.pulseWarnings.has(provider)) {
      this.pulseWarnings.add(provider);
      console.warn(`[market-pulse] ${provider} unavailable; using last good data`);
    }
  }

  private async pulseProvider<T>(key: string, provider: string, fetcher: () => Promise<T>): Promise<MarketPulseSection<T> | undefined> {
    const current = this.pulseCache.get(key);
    if (current && Date.now() - current.timestamp < this.pulseCacheTimeout) {
      return { data: current.data, asOf: new Date(current.timestamp).toISOString(), delayed: false };
    }
    const failedAt = this.pulseFailures.get(key) || this.pulseFailures.get(provider);
    if (this.pulseDisabled.has(provider) || (failedAt && Date.now() - failedAt < this.pulseFailureCooldown)) {
      return current ? { data: current.data, asOf: new Date(current.timestamp).toISOString(), delayed: true } : undefined;
    }
    try {
      const data = await fetcher();
      if (data === undefined || data === null) return undefined;
      const timestamp = Date.now();
      this.pulseCache.set(key, { data, timestamp });
      return { data, asOf: new Date(timestamp).toISOString(), delayed: false };
    } catch (error) {
      const errorCode = Number((error as any)?.response?.data?.error_code);
      if (errorCode === 10010) this.pulseDisabled.add(provider);
      this.pulseFailures.set(key, Date.now());
      this.pulseFailures.set(provider, Date.now());
      this.warnPulseProvider(provider, error);
      return current ? { data: current.data, asOf: new Date(current.timestamp).toISOString(), delayed: true } : undefined;
    }
  }

  /**
   * Provider-backed, best-effort market snapshot. A failed provider never turns
   * into fabricated zeros: only a previously successful section is returned.
   */
  async getMarketPulse(): Promise<MarketPulse> {
    // Use the existing static coverage list. Do not load the broad quote
    // universe here: that path can hit Finnhub's rate limiter and block pulse.
    const covered = this.finnhubKey ? this.marketDataService.getCoveredStockSymbols(20) : [];
    if (covered.length) this.pulseCache.set('covered-stock-symbols', { data: covered, timestamp: Date.now() });
    const sections = await Promise.all([
      this.pulseProvider('global', 'CoinGecko', async () => {
        if (!this.coingeckoProKey) return undefined as any;
        const response = await axios.get('https://pro-api.coingecko.com/api/v3/global', {
          headers: { 'x-cg-pro-api-key': this.coingeckoProKey }, timeout: 8000
        });
        const d = response.data?.data;
        if (!d?.market_cap_percentage?.btc || !d?.total_market_cap?.usd) throw new Error('invalid global response');
        let btc: any;
        try {
          const btcResponse = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
            headers: { 'x-cg-pro-api-key': this.coingeckoProKey },
            params: { vs_currency: 'usd', days: 2, interval: 'daily' },
            timeout: 8000
          });
          const caps = (btcResponse.data?.market_caps || []).map((row: any[]) => Number(row[1])).filter(Number.isFinite);
          if (caps.length >= 2) btc = { usd_24h_market_cap_change: ((caps[caps.length - 1] - caps[caps.length - 2]) / caps[caps.length - 2]) * 100 };
        } catch (error) {
          const errorCode = Number((error as any)?.response?.data?.error_code);
          if (errorCode === 10010) this.pulseDisabled.add('CoinGecko');
          this.pulseFailures.set('CoinGecko', Date.now());
          this.warnPulseProvider('CoinGecko', error);
        }
        const totalTrend = Number(d.market_cap_change_percentage_24h_usd);
        const btcTrend = Number(btc?.usd_24h_market_cap_change);
        const dominance = Number(d.market_cap_percentage.btc);
        return {
          btc: { value: dominance, trend: previousDominanceShift(dominance, totalTrend, btcTrend) },
          cap: { value: Number(d.total_market_cap.usd), trend: Number.isFinite(totalTrend) ? totalTrend : undefined }
        };
      }),
      this.pulseProvider('fear-greed', 'Fear & Greed', () => macroDataService.getFearGreedIndex()),
      this.pulseProvider('movers', 'CoinGecko', async () => {
        if (!this.coingeckoProKey) return undefined as any;
        return this.fetchPulseMovers();
      }),
      this.pulseProvider('stock-sectors', 'Finnhub', async () => {
        if (!this.finnhubKey) return undefined as any;
        return this.fetchStockSectorSplit();
      }),
      this.pulseProvider('earnings', 'Finnhub', async () => {
        if (!this.finnhubKey) return undefined as any;
        return this.fetchPulseEarnings(covered);
      }),
    ]);
    const [global, fearGreed, movers, stockSectors, earnings] = sections;
    const result: MarketPulse = { asOf: new Date().toISOString(), delayed: sections.some(s => !!s?.delayed) };
    if (global) {
      result.btcDominance = { data: global.data.btc, asOf: global.asOf, delayed: global.delayed };
      result.totalMarketCap = { data: global.data.cap, asOf: global.asOf, delayed: global.delayed };
    }
    if (fearGreed) result.fearGreed = fearGreed;
    if (movers) {
      result.movers = { data: movers.data.items, asOf: movers.asOf, delayed: movers.delayed };
      const unusual = movers.data.items.filter((m: any) => m.unusualVolume).length;
      result.unusualVolumeCount = { data: unusual, asOf: movers.asOf, delayed: movers.delayed };
    }
    if (stockSectors) result.sectorSplit = stockSectors;
    if (earnings) result.earnings = earnings;
    return result;
  }

  private async fetchPulseMovers(): Promise<{ items: any[]; sectorSplit: Array<{ sector: string; gainers: number; losers: number }> }> {
    if (!this.coingeckoProKey) throw new Error('CoinGecko Pro key unavailable');
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/markets', {
      headers: { 'x-cg-pro-api-key': this.coingeckoProKey },
      params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 100, page: 1, sparkline: false },
      timeout: 10000
    });
    // CoinGecko may ignore change-based ordering; rank the market-cap batch
    // locally and use the documented 24h field returned by this endpoint.
    const coins = selectMarketMovers(response.data || []);
    if (!Array.isArray(coins) || !coins.length) throw new Error('invalid movers response');
    const items = await Promise.all(coins.map(async (coin: any) => {
      const history = await this.getPulseHistory(coin.id);
      const average30d = history?.volumes.length ? history.volumes.reduce((a, b) => a + b, 0) / history.volumes.length : undefined;
      const values = history?.volumes || [];
      return {
        symbol: String(coin.symbol || '').toUpperCase(), name: coin.name,
        change24h: Number(coin.price_change_percentage_24h),
        volume24h: coin.total_volume, averageVolume30d: average30d,
        volumePercentile30d: average30d === undefined ? undefined : percentileRank(coin.total_volume, values),
        unusualVolume: average30d === undefined ? undefined : isUnusualVolume(coin.total_volume, average30d),
        distance30dHigh: history && coin.current_price ? (coin.current_price - history.high) / coin.current_price : undefined,
        distance30dLow: history && coin.current_price ? (coin.current_price - history.low) / coin.current_price : undefined,
        sector: coin.category || undefined
      };
    }));
    const split = new Map<string, { sector: string; gainers: number; losers: number }>();
    items.forEach(item => {
      if (!item.sector) return;
      const existing = split.get(item.sector) || { sector: item.sector, gainers: 0, losers: 0 };
      item.change24h >= 0 ? existing.gainers++ : existing.losers++;
      split.set(item.sector, existing);
    });
    return { items, sectorSplit: Array.from(split.values()) };
  }

  private async fetchPulseEarnings(covered: string[]): Promise<any[]> {
    if (!this.finnhubKey || !covered.length) throw new Error('Finnhub coverage unavailable');
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 86400000);
    const response = await axios.get('https://finnhub.io/api/v1/calendar/earnings', {
      params: { from: now.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), token: this.finnhubKey }, timeout: 8000
    });
    const rows = response.data?.earningsCalendar;
    if (!Array.isArray(rows)) throw new Error('invalid earnings response');
    return rows.filter((row: any) => row.symbol && covered.includes(String(row.symbol).toUpperCase())).map((row: any) => ({
      symbol: row.symbol, date: row.date, hour: row.hour, epsEstimate: row.epsEstimate,
      revenueEstimate: row.revenueEstimate
    }));
  }

  /** Finnhub-only stock sector breadth for the small covered universe. */
  private async fetchStockSectorSplit(): Promise<Array<{ sector: string; gainers: number; losers: number }>> {
    const symbols = this.marketDataService.getCoveredStockSymbols(8);
    if (!symbols.length) throw new Error('no covered stock movers');
    const rows = await Promise.allSettled(symbols.map(async (symbol: string) => {
      const stock = await this.marketDataService.getStockQuote(symbol);
      if (!stock || !Number.isFinite(Number(stock.percentChange24h))) return undefined;
      const response = await axios.get('https://finnhub.io/api/v1/stock/profile2', {
        params: { symbol, token: this.finnhubKey }, timeout: 4000
      });
      const sector = response.data?.finnhubIndustry;
      return sector ? { sector, change: Number(stock.percentChange24h) } : undefined;
    }));
    const grouped = new Map<string, { sector: string; gainers: number; losers: number }>();
    rows.filter(row => row.status === 'fulfilled').map(row => row.value).filter(Boolean).forEach(row => {
      const value = row as { sector: string; change: number };
      const item = grouped.get(value.sector) || { sector: value.sector, gainers: 0, losers: 0 };
      value.change >= 0 ? item.gainers++ : item.losers++;
      grouped.set(value.sector, item);
    });
    const result = Array.from(grouped.values());
    if (!result.length) throw new Error('Finnhub returned no stock sectors');
    return result;
  }

  private async getPulseHistory(id: string): Promise<{ volumes: number[]; high: number; low: number } | undefined> {
    const cached = this.pulseHistoryCache.get(id);
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) return cached.data;
    try {
      const chart = await axios.get(`https://pro-api.coingecko.com/api/v3/coins/${id}/market_chart`, {
        headers: { 'x-cg-pro-api-key': this.coingeckoProKey }, params: { vs_currency: 'usd', days: 31, interval: 'daily' }, timeout: 8000
      });
      const cutoff = new Date();
      cutoff.setUTCHours(0, 0, 0, 0);
      const daily = new Map<string, { volume: number; high: number; low: number }>();
      (chart.data?.total_volumes || []).forEach((v: any[]) => {
        const date = new Date(Number(v[0])); date.setUTCHours(0, 0, 0, 0);
        if (date >= cutoff || !Number.isFinite(Number(v[1]))) return;
        const key = date.toISOString();
        const row = daily.get(key) || { volume: 0, high: -Infinity, low: Infinity };
        row.volume += Number(v[1]); daily.set(key, row);
      });
      (chart.data?.prices || []).forEach((v: any[]) => {
        const date = new Date(Number(v[0])); date.setUTCHours(0, 0, 0, 0);
        if (date >= cutoff || !Number.isFinite(Number(v[1]))) return;
        const row = daily.get(date.toISOString()) || { volume: 0, high: -Infinity, low: Infinity };
        row.high = Math.max(row.high, Number(v[1])); row.low = Math.min(row.low, Number(v[1])); daily.set(date.toISOString(), row);
      });
      const rows = Array.from(daily.values()).filter(row => row.volume > 0 && row.high > -Infinity).slice(-30);
      if (!rows.length) return undefined;
      const data = { volumes: rows.map(row => row.volume), high: Math.max(...rows.map(row => row.high)), low: Math.min(...rows.map(row => row.low)) };
      this.pulseHistoryCache.set(id, { data, timestamp: Date.now() });
      return data;
    } catch (error) { this.warnPulseProvider('CoinGecko history', error); return undefined; }
  }

  /**
   * Get comprehensive market data for any asset across all categories
   */
  async getUnifiedMarketData(symbol: string, category: string): Promise<UnifiedMarketData | null> {
    const cacheKey = `unified_${symbol}_${category}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let data: UnifiedMarketData | null = null;

      switch (category.toLowerCase()) {
        case 'crypto':
          data = await this.getCryptoData(symbol);
          break;
        case 'stocks':
          data = await this.getStockData(symbol);
          break;
        case 'bonds':
          data = await this.getBondData(symbol);
          break;
        case 'commodities':
          data = await this.getCommodityData(symbol);
          break;
        case 'etfs':
          data = await this.getETFData(symbol);
          break;
        case 'forex':
          data = await this.getForexData(symbol);
          break;
        default:
          console.log(`⚠️ Unknown category: ${category}`);
          return null;
      }

      if (data) {
        this.setCache(cacheKey, data);
      }
      return data;

    } catch (error) {
      console.error(`❌ Failed to fetch unified data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced crypto data with on-chain analytics
   */
  private async getCryptoData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Get basic price data from existing service
      const quotes = await this.marketDataService.getCryptoQuotes([symbol]);
      const quote = quotes.find(q => q.symbol === symbol);
      
      if (!quote) return null;

      // Get on-chain data from Dune Analytics
      const onChainAlpha = await duneAnalyticsService.getOnChainAlpha([symbol]);
      
      // Build comprehensive crypto data
      const data: UnifiedMarketData = {
        symbol: quote.symbol,
        name: quote.name,
        category: 'Crypto',
        price: quote.price,
        percentChange24h: quote.percentChange24h,
        percentChange7d: quote.percentChange7d,
        percentChange30d: quote.percentChange30d,
        volume24h: quote.volume24h,
        marketCap: quote.marketCap,
        onChainMetrics: {
          whaleActivity: this.analyzeWhaleActivity(onChainAlpha.whaleActivity),
          dexVolume: this.calculateDEXVolume(onChainAlpha.dexTrends),
          activeAddresses: 0 // Would come from specific Dune queries
        },
        alphaSignals: this.generateCryptoAlphaSignals(quote, onChainAlpha),
        lastUpdated: new Date().toISOString()
      };

      console.log(`📊 Enhanced crypto data for ${symbol} with on-chain analytics`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get crypto data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced stock data with fundamentals and institutional flow
   */
  private async getStockData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Use Alpha Vantage for comprehensive stock data
      if (!this.alphaVantageKey) {
        console.log(`⚠️ Alpha Vantage key not available for ${symbol} - using basic data`);
        return this.getBasicStockData(symbol);
      }

      const [quote, fundamentals, earnings] = await Promise.all([
        this.getAlphaVantageQuote(symbol),
        this.getAlphaVantageFundamentals(symbol),
        this.getAlphaVantageEarnings(symbol)
      ]);

      if (!quote) return null;

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: quote.name || symbol,
        category: 'Stocks',
        price: quote.price,
        percentChange24h: quote.change_percent || 0,
        volume24h: quote.volume,
        marketCap: fundamentals?.market_capitalization,
        fundamentals: {
          pe_ratio: fundamentals?.pe_ratio,
          dividend_yield: fundamentals?.dividend_yield,
          book_value: fundamentals?.book_value,
          earnings_growth: earnings?.quarterly_earnings_growth,
          revenue_growth: earnings?.quarterly_revenue_growth,
          debt_to_equity: fundamentals?.debt_to_equity
        },
        alphaSignals: this.generateStockAlphaSignals(quote, fundamentals, earnings),
        lastUpdated: new Date().toISOString()
      };

      console.log(`📈 Enhanced stock data for ${symbol} with fundamentals`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get stock data for ${symbol}:`, error);
      return this.getBasicStockData(symbol);
    }
  }

  /**
   * Bond data with Treasury yields and credit analysis
   */
  private async getBondData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Get Treasury yield data from FRED
      let yieldData = null;
      if (this.fredApiKey) {
        yieldData = await this.getTreasuryYield(symbol);
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: this.getBondName(symbol),
        category: 'Bonds',
        price: yieldData?.value || 0,
        percentChange24h: 0, // Would need historical comparison
        yield: yieldData?.value,
        alphaSignals: this.generateBondAlphaSignals(yieldData),
        lastUpdated: new Date().toISOString()
      };

      console.log(`💰 Enhanced bond data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get bond data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Commodity data with futures and spot pricing
   */
  private async getCommodityData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      let commodityPrice = null;

      // Try Commodities API first
      if (this.commoditiesApiKey) {
        commodityPrice = await this.getCommoditiesApiData(symbol);
      }

      // Fallback to FRED for major commodities
      if (!commodityPrice && this.fredApiKey) {
        commodityPrice = await this.getFredCommodityData(symbol);
      }

      if (!commodityPrice) {
        console.log(`⚠️ No commodity data available for ${symbol}`);
        return null;
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: commodityPrice.name || symbol,
        category: 'Commodities',
        price: commodityPrice.price,
        percentChange24h: commodityPrice.change_24h || 0,
        alphaSignals: this.generateCommodityAlphaSignals(commodityPrice),
        lastUpdated: new Date().toISOString()
      };

      console.log(`🛢️ Enhanced commodity data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get commodity data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * ETF data with holdings and performance analysis
   */
  private async getETFData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // ETFs can be treated similar to stocks but with additional sector analysis
      const stockData = await this.getStockData(symbol);
      if (!stockData) return null;

      stockData.category = 'ETFs';
      stockData.alphaSignals = this.generateETFAlphaSignals(stockData);

      console.log(`📦 Enhanced ETF data for ${symbol}`);
      return stockData;

    } catch (error) {
      console.error(`❌ Failed to get ETF data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Forex data with currency correlations
   */
  private async getForexData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      let forexData = null;

      if (this.alphaVantageKey) {
        forexData = await this.getAlphaVantageForex(symbol);
      }

      if (!forexData) {
        console.log(`⚠️ No forex data available for ${symbol}`);
        return null;
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Exchange Rate`,
        category: 'Forex',
        price: forexData.rate,
        percentChange24h: forexData.change_percent || 0,
        alphaSignals: this.generateForexAlphaSignals(forexData),
        lastUpdated: new Date().toISOString()
      };

      console.log(`💱 Enhanced forex data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get forex data for ${symbol}:`, error);
      return null;
    }
  }

  // Alpha Signal Generation Methods
  private generateCryptoAlphaSignals(quote: any, onChainData: any): Array<any> {
    const signals = [];

    // Enhanced price momentum with multi-timeframe analysis
    if (quote.percentChange24h > 10) {
      signals.push({
        type: 'price_momentum',
        strength: 'strong',
        description: `Strong 24h momentum: +${quote.percentChange24h.toFixed(2)}%`,
        confidence: 0.8,
        technicalIndicator: 'RSI_BULLISH',
        volumeConfirmation: quote.volume24h > (quote.avgVolume || 0) * 1.5
      });
    }

    // Whale activity signals from on-chain data
    if (onChainData.whaleActivity && onChainData.whaleActivity.largeTransfers > 0) {
      signals.push({
        type: 'whale_accumulation',
        strength: 'strong',
        description: `Whale accumulation detected: ${onChainData.whaleActivity.largeTransfers} large transfers`,
        confidence: 0.85,
        onChainMetric: 'WHALE_INFLOW'
      });
    }

    // DeFi protocol metrics
    if (onChainData.dexTrends && onChainData.dexTrends.volumeIncrease > 50) {
      signals.push({
        type: 'defi_activity',
        strength: 'moderate',
        description: `DEX volume surge: +${onChainData.dexTrends.volumeIncrease}%`,
        confidence: 0.75,
        protocol: 'MULTI_DEX'
      });
    }

    // Additional on-chain signals
    if (onChainData.signals) {
      signals.push(...onChainData.signals);
    }

    return signals;
  }

  private generateStockAlphaSignals(quote: any, fundamentals: any, earnings: any): Array<any> {
    const signals = [];

    // Enhanced valuation analysis
    if (fundamentals?.pe_ratio && fundamentals.pe_ratio < 15) {
      signals.push({
        type: 'valuation',
        strength: fundamentals.pe_ratio < 10 ? 'strong' : 'moderate',
        description: `Attractive P/E ratio: ${fundamentals.pe_ratio} vs sector average`,
        confidence: 0.8,
        metric: 'PE_DISCOUNT',
        benchmarks: { sectorPE: 18, marketPE: 22 }
      });
    }

    // Revenue quality and growth acceleration
    if (earnings?.quarterly_earnings_growth > 20) {
      signals.push({
        type: 'growth_acceleration',
        strength: 'strong',
        description: `Strong earnings growth: ${earnings.quarterly_earnings_growth}% QoQ`,
        confidence: 0.85,
        catalyst: 'EARNINGS_BEAT',
        sustainability: earnings.consecutive_quarters_growth || 1
      });
    }

    // Institutional flow analysis
    if (fundamentals?.institutional_ownership > 70) {
      signals.push({
        type: 'institutional_interest',
        strength: 'moderate',
        description: `High institutional ownership: ${fundamentals.institutional_ownership}%`,
        confidence: 0.75,
        flow: 'ACCUMULATION'
      });
    }

    // Dividend sustainability for income plays
    if (fundamentals?.dividend_yield > 3 && fundamentals?.payout_ratio < 60) {
      signals.push({
        type: 'income_opportunity',
        strength: 'moderate',
        description: `Sustainable dividend: ${fundamentals.dividend_yield}% yield`,
        confidence: 0.8,
        safety: 'HIGH'
      });
    }

    return signals;
  }

  private generateBondAlphaSignals(yieldData: any): Array<any> {
    const signals = [];

    if (yieldData?.value > 4.5) {
      signals.push({
        type: 'yield_opportunity',
        strength: 'moderate',
        description: `Attractive yield level: ${yieldData.value}%`,
        confidence: 0.75
      });
    }

    return signals;
  }

  private generateCommodityAlphaSignals(commodityData: any): Array<any> {
    const signals = [];

    if (commodityData.change_24h > 5) {
      signals.push({
        type: 'supply_demand',
        strength: 'strong',
        description: `Strong price movement: +${commodityData.change_24h}%`,
        confidence: 0.8
      });
    }

    return signals;
  }

  private generateETFAlphaSignals(etfData: any): Array<any> {
    // Reuse stock signals but add ETF-specific analysis
    return etfData.alphaSignals || [];
  }

  private generateForexAlphaSignals(forexData: any): Array<any> {
    const signals = [];

    if (Math.abs(forexData.change_percent) > 2) {
      signals.push({
        type: 'currency_movement',
        strength: 'moderate',
        description: `Significant currency movement: ${forexData.change_percent}%`,
        confidence: 0.7
      });
    }

    return signals;
  }

  // API Integration Methods
  private async getAlphaVantageQuote(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      const data = response.data['Global Quote'];
      return data ? {
        name: symbol,
        price: parseFloat(data['05. price']),
        change_percent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume'])
      } : null;

    } catch (error) {
      console.error(`❌ Alpha Vantage quote failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getAlphaVantageFundamentals(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Alpha Vantage fundamentals failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getAlphaVantageEarnings(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'EARNINGS',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Alpha Vantage earnings failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getTreasuryYield(seriesId: string): Promise<TreasuryYieldData | null> {
    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      const observations = response.data.observations;
      if (observations && observations.length > 0) {
        const latest = observations[0];
        return {
          date: latest.date,
          value: parseFloat(latest.value),
          series_id: seriesId
        };
      }
      return null;

    } catch (error) {
      console.error(`❌ FRED Treasury yield failed for ${seriesId}:`, error);
      return null;
    }
  }

  private async getCommoditiesApiData(symbol: string): Promise<CommodityData | null> {
    try {
      const response = await axios.get('https://commodities-api.com/api/latest', {
        params: {
          access_key: this.commoditiesApiKey,
          symbols: symbol.toUpperCase()
        }
      });

      const data = response.data.data;
      if (data && data[symbol.toUpperCase()]) {
        return {
          name: symbol,
          price: data[symbol.toUpperCase()],
          unit: 'USD',
          timestamp: response.data.timestamp
        };
      }
      return null;

    } catch (error) {
      console.error(`❌ Commodities API failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getFredCommodityData(symbol: string): Promise<CommodityData | null> {
    // Map common commodity symbols to FRED series IDs
    const fredMapping: Record<string, string> = {
      'GOLD': 'GOLDAMGBD228NLBM',
      'OIL': 'DCOILWTICO',
      'WTI': 'DCOILWTICO',
      'BRENT': 'DCOILBRENTEU',
      'SILVER': 'LBMA/SILVER',
      'COPPER': 'PCOPPUSDM'
    };

    const seriesId = fredMapping[symbol.toUpperCase()];
    if (!seriesId) return null;

    const yieldData = await this.getTreasuryYield(seriesId);
    if (!yieldData) return null;

    return {
      name: symbol,
      price: yieldData.value,
      unit: 'USD',
      timestamp: yieldData.date
    };
  }

  private async getAlphaVantageForex(symbol: string): Promise<any> {
    // Extract currency pair (e.g., "EUR/USD" -> from: "EUR", to: "USD")
    const [from, to] = symbol.split('/');
    if (!from || !to) return null;

    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          apikey: this.alphaVantageKey
        }
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      return data ? {
        rate: parseFloat(data['5. Exchange Rate']),
        change_percent: 0 // Would need additional API call for change
      } : null;

    } catch (error) {
      console.error(`❌ Alpha Vantage forex failed for ${symbol}:`, error);
      return null;
    }
  }

  // Helper methods
  private analyzeWhaleActivity(whaleActivity: any[]): string {
    if (!whaleActivity || whaleActivity.length === 0) {
      return 'No significant whale activity detected';
    }

    const buyVolume = whaleActivity
      .filter(w => w.transaction_type === 'buy')
      .reduce((sum, w) => sum + w.amount_usd, 0);
    
    const sellVolume = whaleActivity
      .filter(w => w.transaction_type === 'sell')
      .reduce((sum, w) => sum + w.amount_usd, 0);

    if (buyVolume > sellVolume * 2) {
      return 'Strong whale accumulation';
    } else if (sellVolume > buyVolume * 2) {
      return 'Whale distribution pattern';
    } else {
      return 'Balanced whale activity';
    }
  }

  private calculateDEXVolume(dexTrends: any[]): number {
    if (!dexTrends || dexTrends.length === 0) return 0;
    return dexTrends.reduce((sum, dex) => sum + (dex.volume_24h || 0), 0);
  }

  private getBondName(symbol: string): string {
    const bondNames: Record<string, string> = {
      'DGS10': '10-Year Treasury',
      'DGS30': '30-Year Treasury',
      'DGS2': '2-Year Treasury',
      'DGS5': '5-Year Treasury'
    };
    return bondNames[symbol] || `${symbol} Bond`;
  }

  private getBasicStockData(symbol: string): UnifiedMarketData {
    return {
      symbol: symbol.toUpperCase(),
      name: symbol,
      category: 'Stocks',
      price: 0,
      percentChange24h: 0,
      alphaSignals: [{
        type: 'data_limitation',
        strength: 'weak',
        description: 'Limited data available - API key required for comprehensive analysis',
        confidence: 0.5
      }],
      lastUpdated: new Date().toISOString()
    };
  }
}

export const comprehensiveMarketService = ComprehensiveMarketService.getInstance();

/** Compatibility entry point used by newsletter and HTTP consumers. */
export async function getMarketPulse(): Promise<any> {
  return comprehensiveMarketService.getMarketPulse();
}