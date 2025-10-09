import { MarketDataService } from './marketDataService';

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi?: number[];
  macd?: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  movingAverages?: {
    sma20: number[];
    sma50: number[];
    sma200: number[];
    ema12: number[];
    ema26: number[];
  };
  bollingerBands?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  volumeIndicators?: {
    volumeMA: number[];
    volumeRatio: number[];
    onBalanceVolume: number[];
  };
}

export interface ChartConfiguration {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  indicators: string[];
  overlays: string[];
  startDate?: string;
  endDate?: string;
}

export interface MultiAssetChartData {
  primary: {
    symbol: string;
    data: ChartDataPoint[];
    indicators: TechnicalIndicators;
  };
  comparison?: {
    symbol: string;
    data: ChartDataPoint[];
    normalizedData: number[]; // Price normalized to primary asset
  }[];
  correlations?: {
    [symbol: string]: number;
  };
  metadata: {
    timeframe: string;
    lastUpdated: string;
    dataPoints: number;
  };
}

export class ChartingService {
  private static instance: ChartingService;
  private marketDataService: MarketDataService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache for chart data

  constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }

  static getInstance(): ChartingService {
    if (!ChartingService.instance) {
      ChartingService.instance = new ChartingService();
    }
    return ChartingService.instance;
  }

  /**
   * Get comprehensive chart data with technical indicators for a single asset
   */
  async getChartData(config: ChartConfiguration): Promise<MultiAssetChartData | null> {
    const cacheKey = `chart_${config.symbol}_${config.timeframe}_${config.indicators.join(',')}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }

    try {
      // Get historical price data
      const priceData = await this.getHistoricalData(config.symbol, config.timeframe, config.assetType);
      
      if (!priceData || priceData.length === 0) {
        console.warn(`⚠️ No price data available for ${config.symbol}`);
        return null;
      }

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(priceData, config.indicators);

      const chartData: MultiAssetChartData = {
        primary: {
          symbol: config.symbol,
          data: priceData,
          indicators
        },
        metadata: {
          timeframe: config.timeframe,
          lastUpdated: new Date().toISOString(),
          dataPoints: priceData.length
        }
      };

      this.setCache(cacheKey, chartData);
      console.log(`📊 Generated chart data for ${config.symbol} (${config.timeframe}) with ${config.indicators.length} indicators`);
      
      return chartData;

    } catch (error: any) {
      console.error(`❌ Failed to get chart data for ${config.symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get multi-asset comparison chart data with correlation analysis
   */
  async getMultiAssetChartData(
    primarySymbol: string,
    comparisonSymbols: string[],
    timeframe: string,
    assetTypes: { [symbol: string]: string }
  ): Promise<MultiAssetChartData | null> {
    const cacheKey = `multi_${primarySymbol}_${comparisonSymbols.join(',')}_${timeframe}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }

    try {
      // Get primary asset data
      const primaryData = await this.getHistoricalData(
        primarySymbol, 
        timeframe, 
        assetTypes[primarySymbol] as any
      );

      if (!primaryData || primaryData.length === 0) {
        return null;
      }

      // Get comparison assets data
      const comparisonData = await Promise.all(
        comparisonSymbols.map(async (symbol) => {
          const data = await this.getHistoricalData(
            symbol, 
            timeframe, 
            assetTypes[symbol] as any
          );
          
          if (!data || data.length === 0) return null;

          // Normalize data to primary asset's starting price
          const normalizedData = this.normalizeToBaseline(data, primaryData);

          return {
            symbol,
            data,
            normalizedData
          };
        })
      );

      // Filter out null results
      const validComparisons = comparisonData.filter(d => d !== null);

      // Calculate correlations
      const correlations = this.calculateCorrelations(primaryData, validComparisons);

      // Calculate technical indicators for primary asset
      const indicators = this.calculateTechnicalIndicators(primaryData, [
        'rsi', 'macd', 'movingAverages', 'bollingerBands', 'volumeIndicators'
      ]);

      const chartData: MultiAssetChartData = {
        primary: {
          symbol: primarySymbol,
          data: primaryData,
          indicators
        },
        comparison: validComparisons,
        correlations,
        metadata: {
          timeframe,
          lastUpdated: new Date().toISOString(),
          dataPoints: primaryData.length
        }
      };

      this.setCache(cacheKey, chartData);
      console.log(`📊 Generated multi-asset chart: ${primarySymbol} vs ${validComparisons.length} assets`);
      
      return chartData;

    } catch (error: any) {
      console.error('❌ Failed to get multi-asset chart data:', error.message);
      return null;
    }
  }

  /**
   * Get historical price data for a symbol
   */
  private async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    assetType: 'crypto' | 'stock' | 'bond' | 'commodity' | 'currency'
  ): Promise<ChartDataPoint[]> {
    // Generate synthetic chart data based on real current prices
    // Note: Historical data points are mathematically derived, not actual market data
    
    try {
      let currentPrice = 0;
      
      // Get current price from market data service
      if (assetType === 'crypto') {
        const quotes = await this.marketDataService.getCryptoQuotes([symbol]);
        currentPrice = quotes[0]?.price || 0;
      } else if (assetType === 'stock') {
        const stocks = await this.marketDataService.getCryptoStocks();
        const stockData = stocks.find(s => s.symbol === symbol);
        currentPrice = stockData?.price || 0;
      }

      if (currentPrice === 0) {
        // No price data available - return empty chart data instead of mock
        console.log(`⚠️ No price data available for ${symbol} - cannot generate chart`);
        return [];
      }

      return this.generateHistoricalData(symbol, currentPrice, timeframe);

    } catch (error) {
      console.error(`Failed to get historical data for ${symbol}:`, error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Generate realistic historical price data for charting
   */
  private generateHistoricalData(symbol: string, currentPrice: number, timeframe: string): ChartDataPoint[] {
    const dataPoints: ChartDataPoint[] = [];
    const intervals = this.getTimeframeIntervals(timeframe);
    const { count, intervalMs } = intervals;

    let price = currentPrice * 0.85; // Start 15% below current price
    const volatility = this.getAssetVolatility(symbol);
    
    for (let i = 0; i < count; i++) {
      const timestamp = Date.now() - (count - i) * intervalMs;
      const date = new Date(timestamp).toISOString();

      // Generate realistic OHLCV data
      const changePercent = (Math.random() - 0.5) * volatility;
      const open = price;
      const trend = (i / count) * 0.2; // Slight upward trend
      const high = open * (1 + Math.abs(changePercent) * 0.7 + trend);
      const low = open * (1 - Math.abs(changePercent) * 0.7);
      const close = open * (1 + changePercent + trend);
      
      // Generate volume (higher for crypto, lower for stocks)
      const baseVolume = symbol.length === 3 ? 1000000 : 50000; // Crypto vs Stock
      const volumeVariation = 0.3 + Math.random() * 1.4;
      const volume = Math.floor(baseVolume * volumeVariation);

      dataPoints.push({
        timestamp,
        date,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume
      });

      price = close;
    }

    // Ensure last point matches current price
    if (dataPoints.length > 0) {
      dataPoints[dataPoints.length - 1].close = currentPrice;
    }

    return dataPoints;
  }

  /**
   * Calculate all technical indicators for the given price data
   */
  private calculateTechnicalIndicators(data: ChartDataPoint[], indicators: string[]): TechnicalIndicators {
    const result: TechnicalIndicators = {};

    if (indicators.includes('rsi')) {
      result.rsi = this.calculateRSI(data, 14);
    }

    if (indicators.includes('macd')) {
      result.macd = this.calculateMACD(data);
    }

    if (indicators.includes('movingAverages')) {
      result.movingAverages = {
        sma20: this.calculateSMA(data, 20),
        sma50: this.calculateSMA(data, 50),
        sma200: this.calculateSMA(data, 200),
        ema12: this.calculateEMA(data, 12),
        ema26: this.calculateEMA(data, 26)
      };
    }

    if (indicators.includes('bollingerBands')) {
      result.bollingerBands = this.calculateBollingerBands(data, 20, 2);
    }

    if (indicators.includes('volumeIndicators')) {
      result.volumeIndicators = {
        volumeMA: this.calculateVolumeMA(data, 20),
        volumeRatio: this.calculateVolumeRatio(data),
        onBalanceVolume: this.calculateOBV(data)
      };
    }

    return result;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(data: ChartDataPoint[], period: number = 14): number[] {
    if (data.length < period + 1) return [];

    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(Math.max(change, 0));
      losses.push(Math.max(-change, 0));
    }

    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Add initial RSI value
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(data: ChartDataPoint[]): { macd: number[]; signal: number[]; histogram: number[] } {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    
    const macd: number[] = [];
    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macd.push(ema12[i] - ema26[i]);
    }

    const signal = this.calculateEMAFromArray(macd, 9);
    const histogram: number[] = [];
    
    for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
      histogram.push(macd[i] - signal[i]);
    }

    return { macd, signal, histogram };
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(data: ChartDataPoint[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, point) => acc + point.close, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(data: ChartDataPoint[], period: number): number[] {
    if (data.length === 0) return [];
    
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA value is the first close price
    ema.push(data[0].close);
    
    for (let i = 1; i < data.length; i++) {
      const currentEMA = (data[i].close * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return ema;
  }

  /**
   * Calculate EMA from an array of numbers
   */
  private calculateEMAFromArray(values: number[], period: number): number[] {
    if (values.length === 0) return [];
    
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    ema.push(values[0]);
    
    for (let i = 1; i < values.length; i++) {
      const currentEMA = (values[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return ema;
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(data: ChartDataPoint[], period: number = 20, stdDev: number = 2): 
    { upper: number[]; middle: number[]; lower: number[] } {
    
    const sma = this.calculateSMA(data, period);
    const upper: number[] = [];
    const middle: number[] = sma;
    const lower: number[] = [];

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      
      // Calculate standard deviation
      const variance = slice.reduce((acc, point) => acc + Math.pow(point.close - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (standardDeviation * stdDev));
      lower.push(mean - (standardDeviation * stdDev));
    }

    return { upper, middle, lower };
  }

  /**
   * Calculate Volume Moving Average
   */
  private calculateVolumeMA(data: ChartDataPoint[], period: number): number[] {
    const volumeMA: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, point) => acc + point.volume, 0);
      volumeMA.push(sum / period);
    }
    
    return volumeMA;
  }

  /**
   * Calculate Volume Ratio (current volume / average volume)
   */
  private calculateVolumeRatio(data: ChartDataPoint[]): number[] {
    const volumeMA = this.calculateVolumeMA(data, 20);
    const ratios: number[] = [];
    
    for (let i = 19; i < data.length; i++) {
      const currentVolume = data[i].volume;
      const avgVolume = volumeMA[i - 19];
      ratios.push(avgVolume > 0 ? currentVolume / avgVolume : 1);
    }
    
    return ratios;
  }

  /**
   * Calculate On-Balance Volume (OBV)
   */
  private calculateOBV(data: ChartDataPoint[]): number[] {
    if (data.length === 0) return [];
    
    const obv: number[] = [data[0].volume];
    
    for (let i = 1; i < data.length; i++) {
      const prevOBV = obv[i - 1];
      const currentVolume = data[i].volume;
      
      if (data[i].close > data[i - 1].close) {
        obv.push(prevOBV + currentVolume);
      } else if (data[i].close < data[i - 1].close) {
        obv.push(prevOBV - currentVolume);
      } else {
        obv.push(prevOBV);
      }
    }
    
    return obv;
  }

  /**
   * Normalize comparison asset data to baseline (primary asset)
   */
  private normalizeToBaseline(comparisonData: ChartDataPoint[], baselineData: ChartDataPoint[]): number[] {
    if (comparisonData.length === 0 || baselineData.length === 0) return [];
    
    const baselineStart = baselineData[0].close;
    const comparisonStart = comparisonData[0].close;
    
    return comparisonData.map(point => {
      const comparisonChange = (point.close - comparisonStart) / comparisonStart;
      return baselineStart * (1 + comparisonChange);
    });
  }

  /**
   * Calculate correlations between primary asset and comparison assets
   */
  private calculateCorrelations(
    primaryData: ChartDataPoint[], 
    comparisonData: { symbol: string; data: ChartDataPoint[]; normalizedData: number[] }[]
  ): { [symbol: string]: number } {
    const correlations: { [symbol: string]: number } = {};
    
    const primaryPrices = primaryData.map(d => d.close);
    
    comparisonData.forEach(({ symbol, data }) => {
      const comparisonPrices = data.map(d => d.close);
      correlations[symbol] = this.calculatePearsonCorrelation(primaryPrices, comparisonPrices);
    });
    
    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get timeframe configuration
   */
  private getTimeframeIntervals(timeframe: string): { count: number; intervalMs: number } {
    const configs = {
      '1m': { count: 1440, intervalMs: 60 * 1000 }, // 24 hours of 1-minute data
      '5m': { count: 1728, intervalMs: 5 * 60 * 1000 }, // 6 days of 5-minute data
      '15m': { count: 1344, intervalMs: 15 * 60 * 1000 }, // 14 days of 15-minute data
      '1h': { count: 1680, intervalMs: 60 * 60 * 1000 }, // 70 days of hourly data
      '4h': { count: 1260, intervalMs: 4 * 60 * 60 * 1000 }, // 210 days of 4-hour data
      '1d': { count: 365, intervalMs: 24 * 60 * 60 * 1000 }, // 1 year of daily data
      '1w': { count: 260, intervalMs: 7 * 24 * 60 * 60 * 1000 } // 5 years of weekly data
    };
    
    return configs[timeframe as keyof typeof configs] || configs['1d'];
  }

  /**
   * Get asset volatility for realistic price generation
   */
  private getAssetVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      // Crypto (higher volatility)
      'BTC': 0.04, 'ETH': 0.05, 'SOL': 0.08, 'ADA': 0.10, 'DOT': 0.09,
      'LINK': 0.07, 'AVAX': 0.08, 'MATIC': 0.09, 'UNI': 0.08,
      
      // Stocks (moderate volatility)
      'AAPL': 0.02, 'GOOGL': 0.025, 'MSFT': 0.02, 'AMZN': 0.03,
      'TSLA': 0.05, 'NVDA': 0.04, 'META': 0.035, 'NFLX': 0.04,
      
      // Commodities
      'GOLD': 0.015, 'SILVER': 0.025, 'OIL': 0.03
    };
    
    return volatilities[symbol] || 0.03; // Default 3% volatility
  }

  /**
   * Cache management
   */
  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get available timeframes
   */
  getAvailableTimeframes(): string[] {
    return ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  }

  /**
   * Get available technical indicators
   */
  getAvailableIndicators(): string[] {
    return ['rsi', 'macd', 'movingAverages', 'bollingerBands', 'volumeIndicators'];
  }

  /**
   * Get supported asset types
   */
  getSupportedAssetTypes(): string[] {
    return ['crypto', 'stock', 'bond', 'commodity', 'currency'];
  }
}

export const chartingService = ChartingService.getInstance();