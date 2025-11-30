import axios from 'axios';

export interface MacroIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  previousClose?: number;
  lastUpdate: string;
}

export interface IndexFutures {
  es: MacroIndex; // S&P 500 E-mini
  nq: MacroIndex; // Nasdaq 100 E-mini
  ym: MacroIndex; // Dow Jones E-mini
  rty: MacroIndex; // Russell 2000 E-mini
}

export interface VolatilityIndices {
  vix: MacroIndex & { level: string };
  dxy: MacroIndex & { trend: string };
}

export interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: string;
  previousValue?: number;
  previousClassification?: string;
  trend: 'rising' | 'falling' | 'stable';
}

class MacroDataService {
  private static instance: MacroDataService;
  private finnhubApiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache for real-time data
  private longCacheTimeout = 300000; // 5 minutes for less volatile data

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    
    if (this.finnhubApiKey) {
      console.log('📊 Macro Data Service initialized with Finnhub API');
    } else {
      console.warn('⚠️ Macro Data Service: FINNHUB_API_KEY not found');
    }
  }

  static getInstance(): MacroDataService {
    if (!MacroDataService.instance) {
      MacroDataService.instance = new MacroDataService();
    }
    return MacroDataService.instance;
  }

  private getCached<T>(key: string, timeout: number = this.cacheTimeout): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async fetchFinnhubQuote(symbol: string): Promise<{
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High
    l: number; // Low
    o: number; // Open
    pc: number; // Previous close
  } | null> {
    if (!this.finnhubApiKey) return null;

    try {
      const response = await axios.get('https://finnhub.io/api/v1/quote', {
        params: {
          symbol,
          token: this.finnhubApiKey
        },
        timeout: 5000
      });

      const data = response.data;
      if (data && data.c && data.c > 0) {
        return data;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status !== 429) {
        console.warn(`⚠️ Failed to fetch ${symbol} from Finnhub:`, error.message);
      }
      return null;
    }
  }

  async getIndexFutures(): Promise<IndexFutures> {
    const cacheKey = 'index_futures';
    const cached = this.getCached<IndexFutures>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    const [spyQuote, qqqQuote, diaQuote, iwmQuote] = await Promise.all([
      this.fetchFinnhubQuote('SPY'),  // S&P 500 ETF
      this.fetchFinnhubQuote('QQQ'),  // Nasdaq 100 ETF
      this.fetchFinnhubQuote('DIA'),  // Dow Jones ETF
      this.fetchFinnhubQuote('IWM'),  // Russell 2000 ETF
    ]);

    const result: IndexFutures = {
      es: {
        symbol: 'ES',
        name: 'S&P 500',
        value: spyQuote ? spyQuote.c : 0,
        change: spyQuote ? spyQuote.d : 0,
        changePercent: spyQuote ? spyQuote.dp : 0,
        high: spyQuote?.h,
        low: spyQuote?.l,
        previousClose: spyQuote?.pc,
        lastUpdate: now
      },
      nq: {
        symbol: 'NQ',
        name: 'Nasdaq 100',
        value: qqqQuote ? qqqQuote.c : 0,
        change: qqqQuote ? qqqQuote.d : 0,
        changePercent: qqqQuote ? qqqQuote.dp : 0,
        high: qqqQuote?.h,
        low: qqqQuote?.l,
        previousClose: qqqQuote?.pc,
        lastUpdate: now
      },
      ym: {
        symbol: 'YM',
        name: 'Dow Jones',
        value: diaQuote ? diaQuote.c : 0,
        change: diaQuote ? diaQuote.d : 0,
        changePercent: diaQuote ? diaQuote.dp : 0,
        high: diaQuote?.h,
        low: diaQuote?.l,
        previousClose: diaQuote?.pc,
        lastUpdate: now
      },
      rty: {
        symbol: 'RTY',
        name: 'Russell 2000',
        value: iwmQuote ? iwmQuote.c : 0,
        change: iwmQuote ? iwmQuote.d : 0,
        changePercent: iwmQuote ? iwmQuote.dp : 0,
        high: iwmQuote?.h,
        low: iwmQuote?.l,
        previousClose: iwmQuote?.pc,
        lastUpdate: now
      }
    };

    if (spyQuote || qqqQuote || diaQuote || iwmQuote) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  async getVolatilityIndices(): Promise<VolatilityIndices> {
    const cacheKey = 'volatility_indices';
    const cached = this.getCached<VolatilityIndices>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    const [vixQuote, uupQuote] = await Promise.all([
      this.fetchFinnhubQuote('VIX'),  // VIX - CBOE Volatility Index
      this.fetchFinnhubQuote('UUP'),  // Dollar Index ETF (proxy for DXY)
    ]);

    const vixValue = vixQuote?.c || 0;
    let vixLevel = 'low';
    if (vixValue >= 35) vixLevel = 'extreme';
    else if (vixValue >= 25) vixLevel = 'high';
    else if (vixValue >= 20) vixLevel = 'elevated';
    else if (vixValue >= 15) vixLevel = 'moderate';

    const dxyChange = uupQuote?.dp || 0;
    const dxyTrend = dxyChange > 0.1 ? 'bullish' : dxyChange < -0.1 ? 'bearish' : 'neutral';

    const result: VolatilityIndices = {
      vix: {
        symbol: 'VIX',
        name: 'CBOE Volatility Index',
        value: vixValue,
        change: vixQuote?.d || 0,
        changePercent: vixQuote?.dp || 0,
        high: vixQuote?.h,
        low: vixQuote?.l,
        previousClose: vixQuote?.pc,
        lastUpdate: now,
        level: vixLevel
      },
      dxy: {
        symbol: 'DXY',
        name: 'US Dollar Index',
        value: uupQuote ? this.convertUUPtoDXY(uupQuote.c) : 0,
        change: uupQuote?.d ? uupQuote.d * 4 : 0, // Scale change
        changePercent: uupQuote?.dp || 0,
        high: uupQuote?.h ? this.convertUUPtoDXY(uupQuote.h) : undefined,
        low: uupQuote?.l ? this.convertUUPtoDXY(uupQuote.l) : undefined,
        previousClose: uupQuote?.pc ? this.convertUUPtoDXY(uupQuote.pc) : undefined,
        lastUpdate: now,
        trend: dxyTrend
      }
    };

    if (vixQuote || uupQuote) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  private convertUUPtoDXY(uupPrice: number): number {
    return uupPrice * 3.75 + 10;
  }

  async getFearGreedIndex(): Promise<FearGreedData> {
    const cacheKey = 'fear_greed';
    const cached = this.getCached<FearGreedData>(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      const response = await axios.get('https://api.alternative.me/fng/?limit=2', {
        timeout: 5000
      });

      const data = response.data.data;
      if (!data || !data[0]) {
        throw new Error('Invalid Fear & Greed response');
      }

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
      console.log(`✅ Fear & Greed Index: ${result.value} (${result.valueClassification})`);
      return result;
    } catch (error: any) {
      console.error('❌ Fear & Greed API error:', error.message);
      
      const stale = this.cache.get(cacheKey);
      if (stale) {
        console.log('📦 Using stale Fear & Greed data');
        return stale.data;
      }

      return {
        value: 50,
        valueClassification: 'Neutral',
        timestamp: new Date().toISOString(),
        trend: 'stable'
      };
    }
  }

  async getAllMacroData(): Promise<{
    indices: IndexFutures;
    volatility: VolatilityIndices;
    fearGreed: FearGreedData;
  }> {
    const [indices, volatility, fearGreed] = await Promise.all([
      this.getIndexFutures(),
      this.getVolatilityIndices(),
      this.getFearGreedIndex()
    ]);

    return { indices, volatility, fearGreed };
  }
}

export const macroDataService = MacroDataService.getInstance();
