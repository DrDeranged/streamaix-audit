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
  private cacheTimeout = 1800000; // 30 minute cache for real-time data (increased from 2 min to save API calls)
  private longCacheTimeout = 3600000; // 1 hour for less volatile data (increased from 10 min)

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    console.log('📊 Macro Data Service initialized (using Yahoo Finance + Finnhub fallback)');
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

  private async fetchYahooQuote(symbol: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    previousClose: number;
  } | null> {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1d'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result?.meta) return null;

      const meta = result.meta;
      const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
      const currentPrice = meta.regularMarketPrice || 0;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        price: currentPrice,
        change,
        changePercent,
        high: meta.regularMarketDayHigh || currentPrice * 1.005,
        low: meta.regularMarketDayLow || currentPrice * 0.995,
        previousClose
      };
    } catch (error: any) {
      console.warn(`⚠️ Yahoo Finance failed for ${symbol}:`, error.message);
      return null;
    }
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
      return null;
    }
  }

  private async fetchQuoteWithFallback(symbol: string, yahooSymbol?: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    previousClose: number;
  } | null> {
    const ySymbol = yahooSymbol || symbol;
    
    const yahooData = await this.fetchYahooQuote(ySymbol);
    if (yahooData && yahooData.price > 0) {
      return yahooData;
    }

    const finnhubData = await this.fetchFinnhubQuote(symbol);
    if (finnhubData && finnhubData.c > 0) {
      return {
        price: finnhubData.c,
        change: finnhubData.d || 0,
        changePercent: finnhubData.dp || 0,
        high: finnhubData.h || finnhubData.c,
        low: finnhubData.l || finnhubData.c,
        previousClose: finnhubData.pc || finnhubData.c
      };
    }

    return null;
  }

  async getIndexFutures(): Promise<IndexFutures> {
    const cacheKey = 'index_futures';
    const cached = this.getCached<IndexFutures>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    const [spyQuote, qqqQuote, diaQuote, iwmQuote] = await Promise.all([
      this.fetchYahooQuote('^GSPC'),  // S&P 500 Index (not ETF)
      this.fetchYahooQuote('^NDX'),   // Nasdaq 100 Index (not ETF)
      this.fetchYahooQuote('^DJI'),   // Dow Jones Industrial Average
      this.fetchYahooQuote('^RUT'),   // Russell 2000 Index
    ]);

    const result: IndexFutures = {
      es: {
        symbol: 'ES',
        name: 'S&P 500',
        value: spyQuote?.price || 0,
        change: spyQuote?.change || 0,
        changePercent: spyQuote?.changePercent || 0,
        high: spyQuote?.high,
        low: spyQuote?.low,
        previousClose: spyQuote?.previousClose,
        lastUpdate: now
      },
      nq: {
        symbol: 'NQ',
        name: 'Nasdaq 100',
        value: qqqQuote?.price || 0,
        change: qqqQuote?.change || 0,
        changePercent: qqqQuote?.changePercent || 0,
        high: qqqQuote?.high,
        low: qqqQuote?.low,
        previousClose: qqqQuote?.previousClose,
        lastUpdate: now
      },
      ym: {
        symbol: 'YM',
        name: 'Dow Jones',
        value: diaQuote?.price || 0,
        change: diaQuote?.change || 0,
        changePercent: diaQuote?.changePercent || 0,
        high: diaQuote?.high,
        low: diaQuote?.low,
        previousClose: diaQuote?.previousClose,
        lastUpdate: now
      },
      rty: {
        symbol: 'RTY',
        name: 'Russell 2000',
        value: iwmQuote?.price || 0,
        change: iwmQuote?.change || 0,
        changePercent: iwmQuote?.changePercent || 0,
        high: iwmQuote?.high,
        low: iwmQuote?.low,
        previousClose: iwmQuote?.previousClose,
        lastUpdate: now
      }
    };

    if (spyQuote || qqqQuote || diaQuote || iwmQuote) {
      console.log(`✅ Macro indices fetched: SPY=$${spyQuote?.price?.toFixed(2) || '0'}, QQQ=$${qqqQuote?.price?.toFixed(2) || '0'}`);
      this.setCache(cacheKey, result);
    }

    return result;
  }

  async getVolatilityIndices(): Promise<VolatilityIndices> {
    const cacheKey = 'volatility_indices';
    const cached = this.getCached<VolatilityIndices>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    const [vixQuote, dxyQuote] = await Promise.all([
      this.fetchYahooQuote('^VIX'),  // VIX - CBOE Volatility Index (Yahoo symbol)
      this.fetchYahooQuote('DX-Y.NYB'),  // DXY - US Dollar Index (Yahoo symbol)
    ]);

    const vixValue = vixQuote?.price || 0;
    let vixLevel = 'low';
    if (vixValue >= 35) vixLevel = 'extreme';
    else if (vixValue >= 25) vixLevel = 'high';
    else if (vixValue >= 20) vixLevel = 'elevated';
    else if (vixValue >= 15) vixLevel = 'moderate';

    const dxyChange = dxyQuote?.changePercent || 0;
    const dxyTrend = dxyChange > 0.1 ? 'bullish' : dxyChange < -0.1 ? 'bearish' : 'neutral';

    const result: VolatilityIndices = {
      vix: {
        symbol: 'VIX',
        name: 'CBOE Volatility Index',
        value: vixValue,
        change: vixQuote?.change || 0,
        changePercent: vixQuote?.changePercent || 0,
        high: vixQuote?.high,
        low: vixQuote?.low,
        previousClose: vixQuote?.previousClose,
        lastUpdate: now,
        level: vixLevel
      },
      dxy: {
        symbol: 'DXY',
        name: 'US Dollar Index',
        value: dxyQuote?.price || 0,
        change: dxyQuote?.change || 0,
        changePercent: dxyQuote?.changePercent || 0,
        high: dxyQuote?.high,
        low: dxyQuote?.low,
        previousClose: dxyQuote?.previousClose,
        lastUpdate: now,
        trend: dxyTrend
      }
    };

    if (vixQuote || dxyQuote) {
      console.log(`✅ Volatility indices fetched: VIX=${vixValue?.toFixed(2) || '0'}, DXY=${dxyQuote?.price?.toFixed(2) || '0'}`);
      this.setCache(cacheKey, result);
    }

    return result;
  }

  async getPreciousMetals(): Promise<{
    gold: { price: number; change: number; changePercent: number };
    silver: { price: number; change: number; changePercent: number };
    lastUpdate: string;
    source: string;
  }> {
    const cacheKey = 'precious_metals';
    const cached = this.getCached<{
      gold: { price: number; change: number; changePercent: number };
      silver: { price: number; change: number; changePercent: number };
      lastUpdate: string;
      source: string;
    }>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    // Yahoo Finance symbols for gold and silver futures
    const [goldQuote, silverQuote] = await Promise.all([
      this.fetchYahooQuote('GC=F'),  // Gold futures
      this.fetchYahooQuote('SI=F'),  // Silver futures
    ]);

    const result = {
      gold: {
        price: goldQuote?.price || 0,
        change: goldQuote?.change || 0,
        changePercent: goldQuote?.changePercent || 0
      },
      silver: {
        price: silverQuote?.price || 0,
        change: silverQuote?.change || 0,
        changePercent: silverQuote?.changePercent || 0
      },
      lastUpdate: now,
      source: 'Yahoo Finance'
    };

    if (goldQuote || silverQuote) {
      console.log(`✅ Precious metals fetched: Gold=$${goldQuote?.price?.toFixed(2) || '0'}, Silver=$${silverQuote?.price?.toFixed(2) || '0'}`);
      this.setCache(cacheKey, result);
    }

    return result;
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

  async getTreasuryYields(): Promise<{
    yields: Record<string, { rate: number; change: number; changePercent: number }>;
    yieldSpread2s10s: number;
    yieldCurveStatus: string;
    lastUpdate: string;
    source: string;
  }> {
    const cacheKey = 'treasury_yields';
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    // Yahoo Finance symbols for treasury yields
    // ^IRX = 13-week (3M), ^FVX = 5Y, ^TNX = 10Y, ^TYX = 30Y
    const [irx, fvx, tnx, tyx] = await Promise.all([
      this.fetchYahooQuote('^IRX'),  // 3-month
      this.fetchYahooQuote('^FVX'),  // 5-year
      this.fetchYahooQuote('^TNX'),  // 10-year
      this.fetchYahooQuote('^TYX'),  // 30-year
    ]);

    // For missing maturities, interpolate from available data
    const rate3M = irx?.price || 0;
    const rate5Y = fvx?.price || 0;
    const rate10Y = tnx?.price || 0;
    const rate30Y = tyx?.price || 0;

    // Interpolate missing maturities (6M, 1Y, 2Y)
    const rate6M = rate3M > 0 ? rate3M + (rate5Y - rate3M) * 0.06 : 0;
    const rate1Y = rate3M > 0 ? rate3M + (rate5Y - rate3M) * 0.2 : 0;
    const rate2Y = rate3M > 0 ? rate3M + (rate5Y - rate3M) * 0.4 : 0;

    const yields: Record<string, { rate: number; change: number; changePercent: number }> = {
      '3M': { 
        rate: rate3M, 
        change: irx?.change || 0, 
        changePercent: irx?.changePercent || 0 
      },
      '6M': { 
        rate: rate6M, 
        change: (irx?.change || 0) * 0.9, 
        changePercent: (irx?.changePercent || 0) * 0.9 
      },
      '1Y': { 
        rate: rate1Y, 
        change: (irx?.change || 0) * 0.8, 
        changePercent: (irx?.changePercent || 0) * 0.8 
      },
      '2Y': { 
        rate: rate2Y, 
        change: ((irx?.change || 0) + (fvx?.change || 0)) / 2, 
        changePercent: ((irx?.changePercent || 0) + (fvx?.changePercent || 0)) / 2 
      },
      '5Y': { 
        rate: rate5Y, 
        change: fvx?.change || 0, 
        changePercent: fvx?.changePercent || 0 
      },
      '10Y': { 
        rate: rate10Y, 
        change: tnx?.change || 0, 
        changePercent: tnx?.changePercent || 0 
      },
      '30Y': { 
        rate: rate30Y, 
        change: tyx?.change || 0, 
        changePercent: tyx?.changePercent || 0 
      },
    };

    // Calculate 2s10s spread (using interpolated 2Y and real 10Y)
    const yieldSpread2s10s = rate10Y - rate2Y;
    const yieldCurveStatus = yieldSpread2s10s < 0 ? 'inverted' : yieldSpread2s10s < 0.25 ? 'flat' : 'normal';

    const result = {
      yields,
      yieldSpread2s10s,
      yieldCurveStatus,
      lastUpdate: new Date().toISOString(),
      source: 'Yahoo Finance'
    };

    if (irx || fvx || tnx || tyx) {
      console.log(`✅ Treasury yields fetched: 3M=${rate3M.toFixed(2)}%, 10Y=${rate10Y.toFixed(2)}%, 30Y=${rate30Y.toFixed(2)}%`);
      this.setCache(cacheKey, result);
    }

    return result;
  }

  async getExtendedVolatility(): Promise<{
    gvz: { value: number; change: number; changePercent: number };
    ovx: { value: number; change: number; changePercent: number };
    source: string;
  }> {
    const cacheKey = 'extended_volatility';
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const [gvzQuote, ovxQuote] = await Promise.all([
      this.fetchYahooQuote('^GVZ'),  // Gold Volatility Index
      this.fetchYahooQuote('^OVX'),  // Crude Oil Volatility Index
    ]);

    const result = {
      gvz: {
        value: gvzQuote?.price || 0,
        change: gvzQuote?.change || 0,
        changePercent: gvzQuote?.changePercent || 0
      },
      ovx: {
        value: ovxQuote?.price || 0,
        change: ovxQuote?.change || 0,
        changePercent: ovxQuote?.changePercent || 0
      },
      source: 'Yahoo Finance'
    };

    if (gvzQuote || ovxQuote) {
      console.log(`✅ Extended volatility fetched: GVZ=${gvzQuote?.price?.toFixed(2) || '0'}, OVX=${ovxQuote?.price?.toFixed(2) || '0'}`);
      this.setCache(cacheKey, result);
    }

    return result;
  }
}

export const macroDataService = MacroDataService.getInstance();
