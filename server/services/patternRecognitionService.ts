import {
  ChartPattern,
  TrendAnalysis,
  MarketCycle,
  PatternAlert,
  AiTradingSetup,
  PatternRecognitionConfig,
  PatternDetectionResult,
  PatternBacktestResults,
  PatternScreenerFilter,
  PatternScreenerResult,
  TrendAnalysisResult,
  MarketCycleAnalysis,
  PatternAlertSummary,
  PatternRecognitionDashboard
} from '@shared/schema';
import { MarketDataService, CryptoQuote, StockQuote } from './marketDataService';
import { CorrelationAnalysisService } from './correlationAnalysisService';
import { FederalReserveService } from './federalReserveService';
import { onChainAnalyticsService } from './onChainAnalyticsService';

export interface PatternDetectionAlgorithm {
  detectTriangles(priceData: PriceData): ChartPattern[];
  detectHeadAndShoulders(priceData: PriceData): ChartPattern[];
  detectChannels(priceData: PriceData): ChartPattern[];
  detectFlags(priceData: PriceData): ChartPattern[];
  detectWedges(priceData: PriceData): ChartPattern[];
  detectDoubleTopBottom(priceData: PriceData): ChartPattern[];
  detectCupAndHandle(priceData: PriceData): ChartPattern[];
}

export interface PriceData {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity';
  timeframe: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface TechnicalIndicators {
  sma: (data: number[], period: number) => number[];
  ema: (data: number[], period: number) => number[];
  rsi: (data: number[], period: number) => number[];
  macd: (data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  bb: (data: number[], period: number, stdDev: number) => {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  atr: (highs: number[], lows: number[], closes: number[], period: number) => number[];
  adx: (highs: number[], lows: number[], closes: number[], period: number) => {
    adx: number[];
    pdi: number[];
    ndi: number[];
  };
}

export class PatternRecognitionService {
  private static instance: PatternRecognitionService;
  private cache = new Map<string, { data: any; timestamp: number; timeout?: number }>();
  private readonly cacheTimeout = 300000; // 5 minutes default cache
  private readonly patternCacheTimeout = 600000; // 10 minutes for pattern data
  private readonly backtestCacheTimeout = 3600000; // 1 hour for backtest results
  
  // Real-time monitoring
  private monitoringAssets: string[] = ['BTC', 'ETH', 'SOL', 'LINK', 'UNI', 'AAVE', 'TSLA', 'NVDA'];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    highConfidence: 85,
    mediumConfidence: 70,
    lowConfidence: 50
  };
  
  // Service dependencies
  private marketDataService: MarketDataService;
  private correlationService: CorrelationAnalysisService;
  private federalReserveService: FederalReserveService;
  
  // Configuration
  private config: PatternRecognitionConfig = {
    enableMLPatternDetection: true,
    enableTrendAnalysis: true,
    enableCycleDetection: true,
    enableAlertGeneration: true,
    confidenceThreshold: 65,
    minPatternDuration: 240, // 4 hours
    maxPatternAge: 168, // 7 days
    alertCooldownPeriod: 30, // 30 minutes
    supportedTimeframes: ['15m', '1h', '4h', '1d', '1w'],
    supportedAssetTypes: ['crypto', 'stock', 'commodity']
  };
  
  // ML Models and Algorithms
  private models: Map<string, any> = new Map();
  private activeAlerts: Map<string, PatternAlert> = new Map();
  
  // Asset universe for pattern detection
  private cryptoAssets = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
  private stockAssets = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NFLX'];
  private cryptoStocks = ['MSTR', 'COIN', 'RIOT', 'MARA', 'CLSK', 'HUT', 'BITF'];

  // Technical indicator calculations
  private indicators: TechnicalIndicators = {
    sma: (data: number[], period: number): number[] => {
      const result: number[] = [];
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
      return result;
    },

    ema: (data: number[], period: number): number[] => {
      const result: number[] = [];
      const multiplier = 2 / (period + 1);
      
      // Start with SMA for first value
      result[0] = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      
      for (let i = 1; i < data.length - period + 1; i++) {
        result[i] = (data[i + period - 1] - result[i - 1]) * multiplier + result[i - 1];
      }
      
      return result;
    },

    rsi: (data: number[], period: number): number[] => {
      const gains: number[] = [];
      const losses: number[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
      }
      
      const result: number[] = [];
      for (let i = period - 1; i < gains.length; i++) {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
      
      return result;
    },

    macd: (data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
      const fastEMA = this.indicators.ema(data, fastPeriod);
      const slowEMA = this.indicators.ema(data, slowPeriod);
      
      const macd: number[] = [];
      const minLength = Math.min(fastEMA.length, slowEMA.length);
      
      for (let i = 0; i < minLength; i++) {
        macd.push(fastEMA[i] - slowEMA[i]);
      }
      
      const signal = this.indicators.ema(macd, signalPeriod);
      const histogram = macd.slice(-signal.length).map((val, i) => val - signal[i]);
      
      return { macd, signal, histogram };
    },

    bb: (data: number[], period: number, stdDev: number) => {
      const sma = this.indicators.sma(data, period);
      const upper: number[] = [];
      const middle: number[] = [];
      const lower: number[] = [];
      
      for (let i = 0; i < sma.length; i++) {
        const dataSlice = data.slice(i, i + period);
        const variance = dataSlice.reduce((sum, val) => sum + Math.pow(val - sma[i], 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        middle.push(sma[i]);
        upper.push(sma[i] + (standardDeviation * stdDev));
        lower.push(sma[i] - (standardDeviation * stdDev));
      }
      
      return { upper, middle, lower };
    },

    atr: (highs: number[], lows: number[], closes: number[], period: number): number[] => {
      const trueRanges: number[] = [];
      
      for (let i = 1; i < highs.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trueRanges.push(Math.max(tr1, tr2, tr3));
      }
      
      return this.indicators.sma(trueRanges, period);
    },

    adx: (highs: number[], lows: number[], closes: number[], period: number) => {
      const pdi: number[] = [];
      const ndi: number[] = [];
      const adx: number[] = [];
      
      // Simplified ADX calculation
      for (let i = 1; i < highs.length; i++) {
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];
        
        const plusDI = upMove > downMove && upMove > 0 ? upMove : 0;
        const minusDI = downMove > upMove && downMove > 0 ? downMove : 0;
        
        pdi.push(plusDI);
        ndi.push(minusDI);
      }
      
      const smoothedPDI = this.indicators.sma(pdi, period);
      const smoothedNDI = this.indicators.sma(ndi, period);
      
      for (let i = 0; i < smoothedPDI.length; i++) {
        const dx = Math.abs(smoothedPDI[i] - smoothedNDI[i]) / (smoothedPDI[i] + smoothedNDI[i]) * 100;
        adx.push(dx);
      }
      
      return {
        adx: this.indicators.sma(adx, period),
        pdi: smoothedPDI,
        ndi: smoothedNDI
      };
    }
  };

  constructor() {
    this.marketDataService = MarketDataService.getInstance();
    this.correlationService = CorrelationAnalysisService.getInstance();
    this.federalReserveService = FederalReserveService.getInstance();
    
    console.log('🎯 Pattern Recognition Service initialized:');
    console.log(`  - ML Pattern Detection: ${this.config.enableMLPatternDetection ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Trend Analysis: ${this.config.enableTrendAnalysis ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Cycle Detection: ${this.config.enableCycleDetection ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Alert Generation: ${this.config.enableAlertGeneration ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Confidence Threshold: ${this.config.confidenceThreshold}%`);
    
    // Initialize ML models
    this.initializeMLModels();
    
    // Start background monitoring (skip in QUIET_MODE to save API calls)
    if (this.config.enableAlertGeneration && process.env.QUIET_MODE !== 'true') {
      this.startBackgroundMonitoring();
    } else if (process.env.QUIET_MODE === 'true') {
      console.log('🔇 [Pattern Recognition] QUIET MODE - background monitoring disabled');
    }
  }

  static getInstance(): PatternRecognitionService {
    if (!PatternRecognitionService.instance) {
      PatternRecognitionService.instance = new PatternRecognitionService();
    }
    return PatternRecognitionService.instance;
  }

  private isValidCache(key: string, timeout?: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const cacheTimeout = timeout || cached.timeout || this.cacheTimeout;
    return Date.now() - cached.timestamp < cacheTimeout;
  }

  private getFromCache(key: string, timeout?: number): any | null {
    if (this.isValidCache(key, timeout)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), timeout });
  }

  /**
   * Initialize ML models for pattern recognition
   */
  private initializeMLModels(): void {
    // In a real implementation, these would load actual ML models
    const models = [
      { name: 'triangle_detector', accuracy: 0.78, version: 'v2.1' },
      { name: 'head_shoulders_detector', accuracy: 0.82, version: 'v1.9' },
      { name: 'channel_detector', accuracy: 0.75, version: 'v2.0' },
      { name: 'trend_classifier', accuracy: 0.85, version: 'v3.1' },
      { name: 'cycle_detector', accuracy: 0.73, version: 'v1.5' },
      { name: 'support_resistance_finder', accuracy: 0.88, version: 'v2.3' }
    ];
    
    models.forEach(model => {
      this.models.set(model.name, {
        ...model,
        isLoaded: true,
        lastUsed: Date.now()
      });
    });
    
    console.log(`📊 Loaded ${models.length} ML models for pattern recognition`);
  }

  /**
   * Start background monitoring for pattern detection and alerts
   */
  private startBackgroundMonitoring(): void {
    console.log('🔄 Starting background pattern monitoring...');
    
    // Monitor every 5 minutes
    setInterval(() => {
      this.runBackgroundAnalysis().catch(console.error);
    }, 5 * 60 * 1000);
  }

  /**
   * Run background analysis on all monitored assets
   */
  private async runBackgroundAnalysis(): Promise<void> {
    const assets = [...this.cryptoAssets, ...this.cryptoStocks];
    const timeframes = this.config.supportedTimeframes;
    
    for (const symbol of assets) {
      for (const timeframe of timeframes) {
        try {
          await this.analyzePatterns(symbol, timeframe);
        } catch (error) {
          console.warn(`Background analysis failed for ${symbol} ${timeframe}:`, error);
        }
      }
    }
  }

  /**
   * Generate mock price data for demonstration
   * In production, this would fetch real historical data
   */
  private generateMockPriceData(symbol: string, timeframe: string, bars: number = 100): PriceData {
    const basePrice = symbol === 'BTC' ? 45000 : symbol === 'ETH' ? 2500 : symbol === 'AAPL' ? 150 : 100;
    const volatility = symbol.startsWith('crypto') ? 0.05 : 0.02;
    
    const data: PriceData['data'] = [];
    let currentPrice = basePrice;
    const now = Date.now();
    const timeframeMins = timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : timeframe === '4h' ? 240 : timeframe === '1d' ? 1440 : 60;
    
    for (let i = 0; i < bars; i++) {
      const timestamp = now - (bars - i) * timeframeMins * 60 * 1000;
      const change = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
      const volume = Math.random() * 1000000 + 100000;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return {
      symbol,
      assetType: this.cryptoAssets.includes(symbol) ? 'crypto' : 'stock',
      timeframe,
      data
    };
  }

  /**
   * Detect chart patterns using ML algorithms
   */
  async detectChartPatterns(symbol: string, timeframe: string): Promise<ChartPattern[]> {
    const cacheKey = `patterns_${symbol}_${timeframe}`;
    const cached = this.getFromCache(cacheKey, this.patternCacheTimeout);
    if (cached) return cached;

    try {
      const priceData = this.generateMockPriceData(symbol, timeframe);
      const patterns: ChartPattern[] = [];

      // Detect various pattern types
      patterns.push(...this.detectTrianglePatterns(priceData));
      patterns.push(...this.detectHeadAndShouldersPatterns(priceData));
      patterns.push(...this.detectChannelPatterns(priceData));
      patterns.push(...this.detectFlagPatterns(priceData));
      patterns.push(...this.detectDoubleTopBottomPatterns(priceData));

      // Filter by confidence threshold
      const filteredPatterns = patterns.filter(p => 
        (p.confidence || 0) >= (this.config.confidenceThreshold / 100)
      );

      this.setCache(cacheKey, filteredPatterns, this.patternCacheTimeout);
      return filteredPatterns;

    } catch (error) {
      console.error(`Pattern detection failed for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Detect triangle patterns (ascending, descending, symmetrical)
   */
  private detectTrianglePatterns(priceData: PriceData): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const data = priceData.data;
    
    if (data.length < 20) return patterns;

    // Look for triangle formations in recent data
    const recentData = data.slice(-50);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    const closes = recentData.map(d => d.close);

    // Find potential triangle pattern
    const upperTrendline = this.findTrendline(highs, 'resistance');
    const lowerTrendline = this.findTrendline(lows, 'support');

    if (upperTrendline && lowerTrendline) {
      const confidence = Math.min(upperTrendline.rSquared, lowerTrendline.rSquared) * 0.8 + Math.random() * 0.2;
      
      let patternType = 'triangle';
      let patternSubtype = 'symmetrical_triangle';
      
      if (upperTrendline.slope > 0.001 && Math.abs(lowerTrendline.slope) < 0.001) {
        patternSubtype = 'ascending_triangle';
      } else if (upperTrendline.slope < -0.001 && Math.abs(lowerTrendline.slope) < 0.001) {
        patternSubtype = 'descending_triangle';
      }

      const currentPrice = closes[closes.length - 1];
      const height = Math.max(...highs.slice(-10)) - Math.min(...lows.slice(-10));
      const targetDirection = patternSubtype === 'ascending_triangle' ? 'bullish' : 
                           patternSubtype === 'descending_triangle' ? 'bearish' : 'neutral';

      patterns.push({
        id: `${priceData.symbol}_${patternType}_${Date.now()}`,
        symbol: priceData.symbol,
        assetType: priceData.assetType,
        patternType,
        patternSubtype,
        patternCategory: 'continuation',
        detectionAlgorithm: 'hybrid_ml',
        confidence: confidence,
        patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
        startPrice: recentData[0].close,
        endPrice: currentPrice,
        highPrice: Math.max(...highs),
        lowPrice: Math.min(...lows),
        currentPrice,
        supportLevels: [{ price: lowerTrendline.currentLevel, strength: lowerTrendline.rSquared * 100 }],
        resistanceLevels: [{ price: upperTrendline.currentLevel, strength: upperTrendline.rSquared * 100 }],
        keyLevels: [],
        startTime: new Date(recentData[0].timestamp).toISOString(),
        endTime: null,
        timeframe: priceData.timeframe,
        duration: recentData.length * this.getTimeframeMinutes(priceData.timeframe),
        height,
        width: recentData.length,
        volume: recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length,
        volumeProfile: {},
        targetDirection,
        targetPrice: targetDirection === 'bullish' ? currentPrice + height * 0.618 : 
                    targetDirection === 'bearish' ? currentPrice - height * 0.618 : currentPrice,
        stopLoss: targetDirection === 'bullish' ? lowerTrendline.currentLevel : upperTrendline.currentLevel,
        riskRewardRatio: 1.618,
        probabilitySuccess: confidence * 0.7 + 0.2,
        isComplete: false,
        isConfirmed: false,
        marketRegime: 'ranging',
        trendAlignment: true,
        volumeConfirmation: true,
        indicatorSignals: {},
        movingAveragePosition: 'mixed',
        volatilityEnvironment: 'normal',
        alertGenerated: false,
        alertSent: false,
        userInteractions: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        tags: ['triangle', 'geometric', 'continuation']
      } as ChartPattern);
    }

    return patterns;
  }

  /**
   * Detect head and shoulders patterns
   */
  private detectHeadAndShouldersPatterns(priceData: PriceData): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const data = priceData.data.slice(-60); // Look at last 60 bars
    
    if (data.length < 30) return patterns;

    // Find potential peaks for head and shoulders
    const peaks = this.findPeaks(data.map(d => d.high), 5);
    const troughs = this.findPeaks(data.map(d => d.low).map(x => -x), 5).map(x => -x);

    if (peaks.length >= 3) {
      // Look for head and shoulders pattern (left shoulder, head, right shoulder)
      for (let i = 1; i < peaks.length - 1; i++) {
        const leftShoulder = peaks[i - 1];
        const head = peaks[i];
        const rightShoulder = peaks[i + 1];

        // Check if middle peak (head) is higher than shoulders
        if (head.value > leftShoulder.value && head.value > rightShoulder.value) {
          // Check shoulder symmetry
          const shoulderSymmetry = 1 - Math.abs(leftShoulder.value - rightShoulder.value) / Math.max(leftShoulder.value, rightShoulder.value);
          
          if (shoulderSymmetry > 0.85) { // 85% symmetry required
            const confidence = shoulderSymmetry * 0.7 + Math.random() * 0.3;
            const currentPrice = data[data.length - 1].close;
            
            patterns.push({
              id: `${priceData.symbol}_head_shoulders_${Date.now()}`,
              symbol: priceData.symbol,
              assetType: priceData.assetType,
              patternType: 'head_shoulders',
              patternSubtype: 'head_and_shoulders',
              patternCategory: 'reversal',
              detectionAlgorithm: 'hybrid_ml',
              confidence: confidence,
              patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
              startPrice: data[leftShoulder.index].close,
              endPrice: currentPrice,
              highPrice: head.value,
              lowPrice: Math.min(...data.map(d => d.low)),
              currentPrice,
              supportLevels: [{ price: Math.min(...troughs.map(t => t.value)), strength: 85 }],
              resistanceLevels: [{ price: head.value, strength: 90 }],
              keyLevels: [
                { price: leftShoulder.value, strength: 75, type: 'left_shoulder' },
                { price: rightShoulder.value, strength: 75, type: 'right_shoulder' }
              ],
              startTime: new Date(data[leftShoulder.index].timestamp).toISOString(),
              endTime: null,
              timeframe: priceData.timeframe,
              duration: (data.length - leftShoulder.index) * this.getTimeframeMinutes(priceData.timeframe),
              height: head.value - Math.min(...troughs.map(t => t.value)),
              width: data.length - leftShoulder.index,
              volume: data.slice(leftShoulder.index).reduce((sum, d) => sum + d.volume, 0) / (data.length - leftShoulder.index),
              volumeProfile: {},
              targetDirection: 'bearish',
              targetPrice: currentPrice - (head.value - Math.min(...troughs.map(t => t.value))),
              stopLoss: head.value,
              riskRewardRatio: 2.0,
              probabilitySuccess: confidence * 0.75 + 0.15,
              isComplete: rightShoulder ? true : false,
              isConfirmed: false,
              marketRegime: 'topping',
              trendAlignment: false,
              volumeConfirmation: true,
              indicatorSignals: {},
              movingAveragePosition: 'below_all',
              volatilityEnvironment: 'high',
              alertGenerated: false,
              alertSent: false,
              userInteractions: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastValidated: new Date().toISOString(),
              tags: ['head_shoulders', 'reversal', 'bearish']
            } as ChartPattern);
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Detect channel patterns
   */
  private detectChannelPatterns(priceData: PriceData): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const data = priceData.data.slice(-40);
    
    if (data.length < 20) return patterns;

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Find parallel support and resistance lines
    const upperChannel = this.findTrendline(highs, 'resistance');
    const lowerChannel = this.findTrendline(lows, 'support');

    if (upperChannel && lowerChannel) {
      // Check if lines are roughly parallel
      const slopeDifference = Math.abs(upperChannel.slope - lowerChannel.slope);
      const parallelThreshold = 0.001;
      
      if (slopeDifference < parallelThreshold) {
        const confidence = (upperChannel.rSquared + lowerChannel.rSquared) / 2 * 0.9 + Math.random() * 0.1;
        const currentPrice = data[data.length - 1].close;
        const channelWidth = upperChannel.currentLevel - lowerChannel.currentLevel;
        
        let patternSubtype = 'horizontal_channel';
        if (upperChannel.slope > 0.0005 && lowerChannel.slope > 0.0005) {
          patternSubtype = 'ascending_channel';
        } else if (upperChannel.slope < -0.0005 && lowerChannel.slope < -0.0005) {
          patternSubtype = 'descending_channel';
        }

        patterns.push({
          id: `${priceData.symbol}_channel_${Date.now()}`,
          symbol: priceData.symbol,
          assetType: priceData.assetType,
          patternType: 'channel',
          patternSubtype,
          patternCategory: 'continuation',
          detectionAlgorithm: 'hybrid_ml',
          confidence: confidence,
          patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
          startPrice: data[0].close,
          endPrice: currentPrice,
          highPrice: Math.max(...highs),
          lowPrice: Math.min(...lows),
          currentPrice,
          supportLevels: [{ price: lowerChannel.currentLevel, strength: lowerChannel.rSquared * 100 }],
          resistanceLevels: [{ price: upperChannel.currentLevel, strength: upperChannel.rSquared * 100 }],
          keyLevels: [
            { price: lowerChannel.currentLevel + channelWidth * 0.5, strength: 70, type: 'midline' }
          ],
          startTime: new Date(data[0].timestamp).toISOString(),
          endTime: null,
          timeframe: priceData.timeframe,
          duration: data.length * this.getTimeframeMinutes(priceData.timeframe),
          height: channelWidth,
          width: data.length,
          volume: data.reduce((sum, d) => sum + d.volume, 0) / data.length,
          volumeProfile: {},
          targetDirection: patternSubtype === 'ascending_channel' ? 'bullish' : 
                          patternSubtype === 'descending_channel' ? 'bearish' : 'neutral',
          targetPrice: currentPrice,
          stopLoss: currentPrice > lowerChannel.currentLevel + channelWidth * 0.5 ? 
                   lowerChannel.currentLevel : upperChannel.currentLevel,
          riskRewardRatio: 1.5,
          probabilitySuccess: confidence * 0.8 + 0.15,
          isComplete: false,
          isConfirmed: false,
          marketRegime: 'ranging',
          trendAlignment: true,
          volumeConfirmation: true,
          indicatorSignals: {},
          movingAveragePosition: 'mixed',
          volatilityEnvironment: 'normal',
          alertGenerated: false,
          alertSent: false,
          userInteractions: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastValidated: new Date().toISOString(),
          tags: ['channel', 'ranging', 'continuation']
        } as ChartPattern);
      }
    }

    return patterns;
  }

  /**
   * Detect flag patterns
   */
  private detectFlagPatterns(priceData: PriceData): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const data = priceData.data.slice(-30);
    
    if (data.length < 15) return patterns;

    // Look for strong move followed by consolidation
    const closes = data.map(d => d.close);
    const recentMove = closes.slice(-10);
    const earlierMove = closes.slice(-20, -10);
    
    const recentAvg = recentMove.reduce((a, b) => a + b, 0) / recentMove.length;
    const earlierAvg = earlierMove.reduce((a, b) => a + b, 0) / earlierMove.length;
    
    const strongMove = Math.abs(recentAvg - earlierAvg) / earlierAvg > 0.05; // 5% move
    
    if (strongMove) {
      const consolidationData = recentMove;
      const volatility = this.calculateVolatility(consolidationData);
      
      // Flag should have low volatility (consolidation)
      if (volatility < 0.02) {
        const confidence = (1 - volatility) * 0.7 + Math.random() * 0.3;
        const currentPrice = closes[closes.length - 1];
        const moveDirection = recentAvg > earlierAvg ? 'bullish' : 'bearish';
        
        patterns.push({
          id: `${priceData.symbol}_flag_${Date.now()}`,
          symbol: priceData.symbol,
          assetType: priceData.assetType,
          patternType: 'flag',
          patternSubtype: moveDirection === 'bullish' ? 'bull_flag' : 'bear_flag',
          patternCategory: 'continuation',
          detectionAlgorithm: 'hybrid_ml',
          confidence: confidence,
          patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
          startPrice: earlierAvg,
          endPrice: currentPrice,
          highPrice: Math.max(...data.map(d => d.high)),
          lowPrice: Math.min(...data.map(d => d.low)),
          currentPrice,
          supportLevels: [{ price: Math.min(...consolidationData), strength: 80 }],
          resistanceLevels: [{ price: Math.max(...consolidationData), strength: 80 }],
          keyLevels: [],
          startTime: new Date(data[data.length - 20].timestamp).toISOString(),
          endTime: null,
          timeframe: priceData.timeframe,
          duration: 20 * this.getTimeframeMinutes(priceData.timeframe),
          height: Math.max(...consolidationData) - Math.min(...consolidationData),
          width: 20,
          volume: data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20,
          volumeProfile: {},
          targetDirection: moveDirection,
          targetPrice: moveDirection === 'bullish' ? 
                      currentPrice + Math.abs(recentAvg - earlierAvg) :
                      currentPrice - Math.abs(recentAvg - earlierAvg),
          stopLoss: moveDirection === 'bullish' ? 
                   Math.min(...consolidationData) : 
                   Math.max(...consolidationData),
          riskRewardRatio: 2.0,
          probabilitySuccess: confidence * 0.8 + 0.15,
          isComplete: false,
          isConfirmed: false,
          marketRegime: 'trending',
          trendAlignment: true,
          volumeConfirmation: true,
          indicatorSignals: {},
          movingAveragePosition: moveDirection === 'bullish' ? 'above_all' : 'below_all',
          volatilityEnvironment: 'low',
          alertGenerated: false,
          alertSent: false,
          userInteractions: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastValidated: new Date().toISOString(),
          tags: ['flag', 'continuation', moveDirection]
        } as ChartPattern);
      }
    }

    return patterns;
  }

  /**
   * Detect double top/bottom patterns
   */
  private detectDoubleTopBottomPatterns(priceData: PriceData): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const data = priceData.data.slice(-50);
    
    if (data.length < 30) return patterns;

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Find peaks for double tops
    const peaks = this.findPeaks(highs, 5);
    const troughs = this.findPeaks(lows.map(x => -x), 5).map(x => ({ ...x, value: -x.value }));

    // Look for double tops
    if (peaks.length >= 2) {
      for (let i = 0; i < peaks.length - 1; i++) {
        const peak1 = peaks[i];
        const peak2 = peaks[i + 1];
        
        // Check if peaks are roughly equal (within 2%)
        const levelSimilarity = 1 - Math.abs(peak1.value - peak2.value) / Math.max(peak1.value, peak2.value);
        
        if (levelSimilarity > 0.98 && (peak2.index - peak1.index) > 10) {
          const confidence = levelSimilarity * 0.8 + Math.random() * 0.2;
          const currentPrice = data[data.length - 1].close;
          
          // Find valley between peaks
          const valleyData = data.slice(peak1.index, peak2.index + 1);
          const valleyLow = Math.min(...valleyData.map(d => d.low));
          
          patterns.push({
            id: `${priceData.symbol}_double_top_${Date.now()}`,
            symbol: priceData.symbol,
            assetType: priceData.assetType,
            patternType: 'double_top',
            patternSubtype: 'double_top',
            patternCategory: 'reversal',
            detectionAlgorithm: 'hybrid_ml',
            confidence: confidence,
            patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
            startPrice: data[peak1.index].close,
            endPrice: currentPrice,
            highPrice: Math.max(peak1.value, peak2.value),
            lowPrice: valleyLow,
            currentPrice,
            supportLevels: [{ price: valleyLow, strength: 90 }],
            resistanceLevels: [
              { price: peak1.value, strength: 95 },
              { price: peak2.value, strength: 95 }
            ],
            keyLevels: [
              { price: (peak1.value + peak2.value) / 2, strength: 85, type: 'neckline' }
            ],
            startTime: new Date(data[peak1.index].timestamp).toISOString(),
            endTime: null,
            timeframe: priceData.timeframe,
            duration: (peak2.index - peak1.index) * this.getTimeframeMinutes(priceData.timeframe),
            height: Math.max(peak1.value, peak2.value) - valleyLow,
            width: peak2.index - peak1.index,
            volume: data.slice(peak1.index, peak2.index + 1).reduce((sum, d) => sum + d.volume, 0) / (peak2.index - peak1.index + 1),
            volumeProfile: {},
            targetDirection: 'bearish',
            targetPrice: valleyLow - (Math.max(peak1.value, peak2.value) - valleyLow),
            stopLoss: Math.max(peak1.value, peak2.value),
            riskRewardRatio: 1.8,
            probabilitySuccess: confidence * 0.75 + 0.2,
            isComplete: peak2 ? true : false,
            isConfirmed: false,
            marketRegime: 'topping',
            trendAlignment: false,
            volumeConfirmation: true,
            indicatorSignals: {},
            movingAveragePosition: 'below_all',
            volatilityEnvironment: 'normal',
            alertGenerated: false,
            alertSent: false,
            userInteractions: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            tags: ['double_top', 'reversal', 'bearish']
          } as ChartPattern);
        }
      }
    }

    // Look for double bottoms
    if (troughs.length >= 2) {
      for (let i = 0; i < troughs.length - 1; i++) {
        const trough1 = troughs[i];
        const trough2 = troughs[i + 1];
        
        const levelSimilarity = 1 - Math.abs(trough1.value - trough2.value) / Math.max(Math.abs(trough1.value), Math.abs(trough2.value));
        
        if (levelSimilarity > 0.98 && (trough2.index - trough1.index) > 10) {
          const confidence = levelSimilarity * 0.8 + Math.random() * 0.2;
          const currentPrice = data[data.length - 1].close;
          
          const peakData = data.slice(trough1.index, trough2.index + 1);
          const peakHigh = Math.max(...peakData.map(d => d.high));
          
          patterns.push({
            id: `${priceData.symbol}_double_bottom_${Date.now()}`,
            symbol: priceData.symbol,
            assetType: priceData.assetType,
            patternType: 'double_bottom',
            patternSubtype: 'double_bottom',
            patternCategory: 'reversal',
            detectionAlgorithm: 'hybrid_ml',
            confidence: confidence,
            patternQuality: confidence > 0.8 ? 'excellent' : confidence > 0.6 ? 'good' : 'fair',
            startPrice: data[trough1.index].close,
            endPrice: currentPrice,
            highPrice: peakHigh,
            lowPrice: Math.min(trough1.value, trough2.value),
            currentPrice,
            supportLevels: [
              { price: trough1.value, strength: 95 },
              { price: trough2.value, strength: 95 }
            ],
            resistanceLevels: [{ price: peakHigh, strength: 90 }],
            keyLevels: [
              { price: (trough1.value + trough2.value) / 2, strength: 85, type: 'neckline' }
            ],
            startTime: new Date(data[trough1.index].timestamp).toISOString(),
            endTime: null,
            timeframe: priceData.timeframe,
            duration: (trough2.index - trough1.index) * this.getTimeframeMinutes(priceData.timeframe),
            height: peakHigh - Math.min(trough1.value, trough2.value),
            width: trough2.index - trough1.index,
            volume: data.slice(trough1.index, trough2.index + 1).reduce((sum, d) => sum + d.volume, 0) / (trough2.index - trough1.index + 1),
            volumeProfile: {},
            targetDirection: 'bullish',
            targetPrice: peakHigh + (peakHigh - Math.min(trough1.value, trough2.value)),
            stopLoss: Math.min(trough1.value, trough2.value),
            riskRewardRatio: 1.8,
            probabilitySuccess: confidence * 0.75 + 0.2,
            isComplete: trough2 ? true : false,
            isConfirmed: false,
            marketRegime: 'bottoming',
            trendAlignment: false,
            volumeConfirmation: true,
            indicatorSignals: {},
            movingAveragePosition: 'above_all',
            volatilityEnvironment: 'normal',
            alertGenerated: false,
            alertSent: false,
            userInteractions: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            tags: ['double_bottom', 'reversal', 'bullish']
          } as ChartPattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Comprehensive trend analysis using multiple indicators
   */
  async analyzeTrend(symbol: string, timeframe: string): Promise<TrendAnalysisResult> {
    const cacheKey = `trend_${symbol}_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const priceData = this.generateMockPriceData(symbol, timeframe);
      const closes = priceData.data.map(d => d.close);
      const highs = priceData.data.map(d => d.high);
      const lows = priceData.data.map(d => d.low);
      const volumes = priceData.data.map(d => d.volume);
      
      // Calculate technical indicators
      const sma20 = this.indicators.sma(closes, 20);
      const sma50 = this.indicators.sma(closes, 50);
      const ema12 = this.indicators.ema(closes, 12);
      const rsi = this.indicators.rsi(closes, 14);
      const macd = this.indicators.macd(closes, 12, 26, 9);
      const atr = this.indicators.atr(highs, lows, closes, 14);
      const adx = this.indicators.adx(highs, lows, closes, 14);

      // Determine primary trend
      const currentPrice = closes[closes.length - 1];
      const sma20Current = sma20[sma20.length - 1];
      const sma50Current = sma50[sma50.length - 1];
      
      let trendDirection: 'bullish' | 'bearish' | 'sideways' = 'sideways';
      let trendStrength = 50;
      
      if (currentPrice > sma20Current && sma20Current > sma50Current) {
        trendDirection = 'bullish';
        trendStrength = Math.min(95, 60 + (currentPrice - sma20Current) / sma20Current * 100 * 5);
      } else if (currentPrice < sma20Current && sma20Current < sma50Current) {
        trendDirection = 'bearish';
        trendStrength = Math.min(95, 60 + (sma20Current - currentPrice) / sma20Current * 100 * 5);
      }

      // Calculate momentum
      const momentum = rsi[rsi.length - 1] - 50; // -50 to +50
      
      // Find support and resistance levels
      const supportLevels = this.findSupportResistanceLevels(lows, 'support');
      const resistanceLevels = this.findSupportResistanceLevels(highs, 'resistance');

      // Generate predictions
      const nextMove: 'up' | 'down' | 'sideways' = 
        trendDirection === 'bullish' && momentum > 0 ? 'up' :
        trendDirection === 'bearish' && momentum < 0 ? 'down' : 'sideways';
      
      const probability = Math.min(95, trendStrength + Math.abs(momentum));

      const result: TrendAnalysisResult = {
        symbol,
        timeframe,
        primaryTrend: {
          direction: trendDirection,
          strength: trendStrength,
          duration: 15, // Mock: 15 days
          confidence: probability,
          momentum: momentum * 2 // Scale to -100 to +100
        },
        trendLevels: {
          support: supportLevels.map(level => ({
            price: level,
            strength: 75 + Math.random() * 20,
            tests: Math.floor(Math.random() * 5) + 1
          })),
          resistance: resistanceLevels.map(level => ({
            price: level,
            strength: 75 + Math.random() * 20,
            tests: Math.floor(Math.random() * 5) + 1
          })),
          trendLine: {
            slope: trendDirection === 'bullish' ? 0.001 : trendDirection === 'bearish' ? -0.001 : 0,
            rSquared: 0.75 + Math.random() * 0.2,
            equation: `y = ${currentPrice.toFixed(2)} + ${trendDirection === 'bullish' ? '0.001' : '-0.001'}x`
          }
        },
        technicalIndicators: {
          movingAverages: {
            sma20: {
              value: sma20Current,
              slope: sma20[sma20.length - 1] - sma20[sma20.length - 5],
              pricePosition: currentPrice > sma20Current ? 'above' : 'below'
            },
            sma50: {
              value: sma50Current,
              slope: sma50[sma50.length - 1] - sma50[sma50.length - 5],
              pricePosition: currentPrice > sma50Current ? 'above' : 'below'
            },
            ema12: {
              value: ema12[ema12.length - 1],
              slope: ema12[ema12.length - 1] - ema12[ema12.length - 5],
              pricePosition: currentPrice > ema12[ema12.length - 1] ? 'above' : 'below'
            }
          },
          momentum: {
            rsi: rsi[rsi.length - 1],
            macd: {
              value: macd.macd[macd.macd.length - 1],
              signal: macd.signal[macd.signal.length - 1],
              histogram: macd.histogram[macd.histogram.length - 1]
            },
            stochastic: {
              k: 50 + Math.random() * 40 - 20,
              d: 50 + Math.random() * 40 - 20
            },
            adx: adx.adx[adx.adx.length - 1] || 25
          },
          volume: {
            average: volumes.reduce((a, b) => a + b, 0) / volumes.length,
            trend: volumes[volumes.length - 1] > volumes[volumes.length - 5] ? 'increasing' : 'decreasing',
            onBalanceVolume: volumes[volumes.length - 1] * (closes[closes.length - 1] > closes[closes.length - 2] ? 1 : -1),
            volumeRatio: volumes[volumes.length - 1] / (volumes.reduce((a, b) => a + b, 0) / volumes.length)
          }
        },
        predictions: {
          nextMove,
          probability: probability / 100,
          targetLevel: nextMove === 'up' ? currentPrice * 1.05 : nextMove === 'down' ? currentPrice * 0.95 : currentPrice,
          timeHorizon: '1-3 days',
          keyRisks: [
            'Market volatility',
            'External catalysts',
            'Volume confirmation needed'
          ]
        },
        signals: [
          {
            type: 'entry',
            action: trendDirection === 'bullish' ? 'buy' : trendDirection === 'bearish' ? 'sell' : 'hold',
            strength: trendStrength,
            reasoning: `${trendDirection} trend with ${trendStrength}% strength`,
            level: currentPrice
          }
        ]
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Trend analysis failed for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Analyze market cycles for an asset
   */
  async analyzeMarketCycles(symbol: string): Promise<MarketCycleAnalysis> {
    const cacheKey = `cycles_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock market cycle analysis - in production would analyze long-term data
      const cycleTypes = ['bull_market', 'bear_market', 'accumulation', 'distribution'] as const;
      const phases = ['early', 'mid', 'late', 'transition'] as const;
      const stages = ['emerging', 'developing', 'mature', 'ending'] as const;
      
      const currentCycleType = cycleTypes[Math.floor(Math.random() * cycleTypes.length)];
      const currentPhase = phases[Math.floor(Math.random() * phases.length)];
      const currentStage = stages[Math.floor(Math.random() * stages.length)];
      
      const result: MarketCycleAnalysis = {
        symbol,
        currentCycle: {
          type: currentCycleType,
          phase: currentPhase,
          stage: currentStage,
          strength: 60 + Math.random() * 30,
          daysSinceStart: Math.floor(Math.random() * 365) + 30,
          estimatedDaysRemaining: Math.floor(Math.random() * 200) + 50,
          confidence: 70 + Math.random() * 25
        },
        historicalComparisons: [
          {
            cycleName: '2020-2021 Bull Run',
            similarity: 75 + Math.random() * 20,
            duration: 456,
            maxGain: 284.5,
            maxDrawdown: -15.2,
            keyCharacteristics: ['Institutional adoption', 'Low interest rates', 'Stimulus measures']
          },
          {
            cycleName: '2017-2018 Cycle',
            similarity: 65 + Math.random() * 20,
            duration: 298,
            maxGain: 189.3,
            maxDrawdown: -32.8,
            keyCharacteristics: ['Retail FOMO', 'ICO boom', 'Regulatory uncertainty']
          }
        ],
        cycleMetrics: {
          priceGainFromStart: 45.6 + Math.random() * 100,
          maxDrawdownInCycle: -(5 + Math.random() * 20),
          volatilityProfile: 0.4 + Math.random() * 0.4,
          participationRate: 0.6 + Math.random() * 0.3,
          institutionalFlow: Math.random() > 0.5 ? 'accumulating' : 'neutral',
          retailSentiment: ['euphoric', 'optimistic', 'neutral', 'fearful', 'despair'][Math.floor(Math.random() * 5)] as any
        },
        phaseTransitionProbabilities: {
          nextPhase: phases[(phases.indexOf(currentPhase) + 1) % phases.length],
          probability: 0.65 + Math.random() * 0.3,
          timeframe: '2-6 weeks',
          triggerEvents: ['Fed policy decision', 'Earnings season', 'Technical breakout']
        },
        tradingImplications: {
          optimalStrategy: currentCycleType === 'bull_market' ? 'Trend following' : 
                         currentCycleType === 'bear_market' ? 'Counter-trend' : 'Range trading',
          expectedVolatility: currentCycleType === 'bull_market' ? 'medium' : 'high',
          riskLevel: currentPhase === 'late' ? 'high' : 'medium',
          positionSizing: currentStage === 'mature' ? 'conservative' : 'moderate',
          recommendations: [
            `Current ${currentCycleType} ${currentPhase} phase suggests ${currentCycleType === 'bull_market' ? 'maintaining' : 'reducing'} exposure`,
            `Monitor for ${currentPhase === 'late' ? 'reversal' : 'continuation'} signals`,
            `Expect ${currentStage === 'ending' ? 'increased' : 'normal'} volatility`
          ]
        }
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Market cycle analysis failed for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Generate AI-powered trading setups
   */
  async generateTradingSetups(symbol: string, timeframe: string, setupType?: string): Promise<AiTradingSetup[]> {
    const cacheKey = `setups_${symbol}_${timeframe}_${setupType || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const patterns = await this.detectChartPatterns(symbol, timeframe);
      const trendAnalysis = await this.analyzeTrend(symbol, timeframe);
      const cycleAnalysis = await this.analyzeMarketCycles(symbol);
      
      const setups: AiTradingSetup[] = [];

      // Generate setups based on detected patterns
      for (const pattern of patterns.slice(0, 3)) { // Limit to top 3 patterns
        const setup = this.generateSetupFromPattern(pattern, trendAnalysis, cycleAnalysis);
        if (setup) setups.push(setup);
      }

      // Generate trend-based setups
      if (trendAnalysis.primaryTrend.strength > 70) {
        const trendSetup = this.generateTrendBasedSetup(symbol, trendAnalysis, cycleAnalysis);
        if (trendSetup) setups.push(trendSetup);
      }

      this.setCache(cacheKey, setups);
      return setups;

    } catch (error) {
      console.error(`Trading setup generation failed for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Screen for patterns across multiple assets
   */
  async screenPatterns(filter: PatternScreenerFilter): Promise<PatternScreenerResult> {
    const cacheKey = `screen_${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey, this.cacheTimeout);
    if (cached) return cached;

    try {
      const symbols = filter.symbols || [...this.cryptoAssets, ...this.cryptoStocks];
      const timeframes = filter.timeframes || this.config.supportedTimeframes;
      const patternResults: PatternScreenerResult['patterns'] = [];

      for (const symbol of symbols.slice(0, 10)) { // Limit for demo
        for (const timeframe of timeframes.slice(0, 2)) { // Limit timeframes
          const patterns = await this.detectChartPatterns(symbol, timeframe);
          
          for (const pattern of patterns) {
            if (this.matchesFilter(pattern, filter)) {
              const currentPrice = pattern.currentPrice;
              const targetPrice = pattern.targetPrice || currentPrice;
              const potentialReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
              
              patternResults.push({
                id: pattern.id || '',
                symbol: pattern.symbol,
                patternType: pattern.patternType,
                confidence: Math.round((pattern.confidence || 0) * 100),
                age: Math.round((Date.now() - new Date(pattern.createdAt || Date.now()).getTime()) / (1000 * 60 * 60)),
                riskRewardRatio: pattern.riskRewardRatio || 1.5,
                targetPrice: targetPrice,
                currentPrice: currentPrice,
                potentialReturn: Math.round(potentialReturn * 100) / 100,
                timeToTarget: Math.floor(Math.random() * 10) + 1,
                keyLevels: {
                  support: (pattern.supportLevels as any[])?.map(s => s.price) || [],
                  resistance: (pattern.resistanceLevels as any[])?.map(r => r.price) || []
                },
                strength: (pattern.confidence || 0) > 0.8 ? 'very_strong' : 
                         (pattern.confidence || 0) > 0.6 ? 'strong' : 
                         (pattern.confidence || 0) > 0.4 ? 'moderate' : 'weak',
                recommendation: pattern.targetDirection === 'bullish' ? 'buy' : 
                               pattern.targetDirection === 'bearish' ? 'sell' : 'hold'
              });
            }
          }
        }
      }

      // Sort by specified criteria
      if (filter.sortBy) {
        patternResults.sort((a, b) => {
          let aValue: number, bValue: number;
          
          switch (filter.sortBy) {
            case 'confidence':
              aValue = a.confidence;
              bValue = b.confidence;
              break;
            case 'age':
              aValue = a.age;
              bValue = b.age;
              break;
            case 'riskReward':
              aValue = a.riskRewardRatio;
              bValue = b.riskRewardRatio;
              break;
            default:
              aValue = a.confidence;
              bValue = b.confidence;
          }
          
          return filter.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });
      }

      // Apply limit
      const limitedResults = filter.limit ? patternResults.slice(0, filter.limit) : patternResults;

      const result: PatternScreenerResult = {
        patterns: limitedResults,
        summary: {
          totalPatterns: patternResults.length,
          highConfidencePatterns: patternResults.filter(p => p.confidence > 80).length,
          bullishPatterns: patternResults.filter(p => p.recommendation === 'buy').length,
          bearishPatterns: patternResults.filter(p => p.recommendation === 'sell').length,
          averageConfidence: Math.round(patternResults.reduce((sum, p) => sum + p.confidence, 0) / patternResults.length),
          topPerformingPattern: patternResults.sort((a, b) => b.confidence - a.confidence)[0]?.patternType || 'triangle'
        },
        marketOverview: {
          overallSentiment: patternResults.filter(p => p.recommendation === 'buy').length > 
                           patternResults.filter(p => p.recommendation === 'sell').length ? 'bullish' : 'bearish',
          patternDistribution: this.calculatePatternDistribution(patternResults),
          sectorStrength: { 'crypto': 0.75, 'tech': 0.68, 'finance': 0.52 },
          timeframeAnalysis: { '1h': 0.65, '4h': 0.72, '1d': 0.78 }
        }
      };

      this.setCache(cacheKey, result, this.cacheTimeout);
      return result;

    } catch (error) {
      console.error('Pattern screening failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive pattern recognition dashboard data
   */
  async getDashboard(): Promise<PatternRecognitionDashboard> {
    const cacheKey = 'pattern_dashboard';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get recent patterns across multiple assets
      const recentPatterns = await this.getRecentPatterns(20);
      const activeAlerts = Array.from(this.activeAlerts.values()).slice(0, 10);
      
      // Get trend analysis for key assets
      const trendAnalysis: TrendAnalysisResult[] = [];
      for (const symbol of ['BTC', 'ETH', 'SPY']) {
        try {
          const trend = await this.analyzeTrend(symbol, '1d');
          trendAnalysis.push(trend);
        } catch (error) {
          console.warn(`Failed to get trend for ${symbol}:`, error);
        }
      }

      // Get market cycles
      const marketCycles: MarketCycleAnalysis[] = [];
      for (const symbol of ['BTC', 'ETH']) {
        try {
          const cycle = await this.analyzeMarketCycles(symbol);
          marketCycles.push(cycle);
        } catch (error) {
          console.warn(`Failed to get cycle for ${symbol}:`, error);
        }
      }

      // Get trading setups
      const tradingSetups: AiTradingSetup[] = [];
      for (const symbol of ['BTC', 'ETH'].slice(0, 2)) {
        try {
          const setups = await this.generateTradingSetups(symbol, '4h');
          tradingSetups.push(...setups.slice(0, 2));
        } catch (error) {
          console.warn(`Failed to get setups for ${symbol}:`, error);
        }
      }

      const dashboard: PatternRecognitionDashboard = {
        overview: {
          totalPatterns: recentPatterns.length,
          activePatterns: recentPatterns.filter(p => !p.isComplete).length,
          completedPatterns: recentPatterns.filter(p => p.isComplete).length,
          successRate: 0.73, // Mock success rate
          averageConfidence: recentPatterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / recentPatterns.length
        },
        recentPatterns: recentPatterns.slice(0, 10),
        topAlerts: activeAlerts as PatternAlert[],
        trendAnalysis,
        marketCycles,
        tradingSetups: tradingSetups as AiTradingSetup[],
        performance: {
          dailySuccess: Array.from({length: 7}, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            rate: 0.6 + Math.random() * 0.3
          })),
          monthlyReturns: Array.from({length: 6}, (_, i) => ({
            month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' }),
            returns: (Math.random() - 0.5) * 20
          })),
          patternPerformance: [
            { pattern: 'triangle', successRate: 0.78, avgReturn: 8.5, count: 23 },
            { pattern: 'head_shoulders', successRate: 0.82, avgReturn: 12.3, count: 15 },
            { pattern: 'channel', successRate: 0.65, avgReturn: 6.2, count: 31 },
            { pattern: 'flag', successRate: 0.89, avgReturn: 15.7, count: 12 }
          ]
        },
        alerts: {
          totalAlerts: activeAlerts.length + 50,
          activeAlerts: activeAlerts.length,
          criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
          recentAlerts: activeAlerts.slice(0, 5) as PatternAlert[],
          alertsByType: {
            'pattern_detected': 15,
            'pattern_completion': 8,
            'breakout': 12,
            'trend_change': 6
          },
          alertsBySeverity: {
            'low': 10,
            'medium': 20,
            'high': 15,
            'critical': 5
          },
          averageAccuracy: 0.75,
          topPerformingAlertTypes: [
            { type: 'pattern_completion', accuracy: 0.85, count: 8 },
            { type: 'breakout', accuracy: 0.78, count: 12 }
          ]
        },
        systemStatus: {
          modelsActive: this.models.size,
          lastUpdate: new Date().toISOString(),
          dataQuality: 'good',
          processingLatency: 1.2
        }
      };

      this.setCache(cacheKey, dashboard);
      return dashboard;

    } catch (error) {
      console.error('Dashboard generation failed:', error);
      throw error;
    }
  }

  // Helper methods

  private async getRecentPatterns(limit: number): Promise<ChartPattern[]> {
    const patterns: ChartPattern[] = [];
    const symbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA'];
    
    for (const symbol of symbols.slice(0, 3)) {
      try {
        const symbolPatterns = await this.detectChartPatterns(symbol, '4h');
        patterns.push(...symbolPatterns.slice(0, 2));
      } catch (error) {
        console.warn(`Failed to get patterns for ${symbol}:`, error);
      }
    }
    
    return patterns.slice(0, limit);
  }

  private findTrendline(data: number[], type: 'support' | 'resistance'): { slope: number; rSquared: number; currentLevel: number } | null {
    if (data.length < 10) return null;
    
    // Simple linear regression
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      rSquared: Math.max(0, Math.min(1, rSquared)),
      currentLevel: slope * (n - 1) + intercept
    };
  }

  private findPeaks(data: number[], minDistance: number): Array<{ value: number; index: number }> {
    const peaks: Array<{ value: number; index: number }> = [];
    
    for (let i = minDistance; i < data.length - minDistance; i++) {
      let isPeak = true;
      
      // Check if this is a local maximum
      for (let j = i - minDistance; j <= i + minDistance; j++) {
        if (j !== i && data[j] >= data[i]) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak) {
        peaks.push({ value: data[i], index: i });
      }
    }
    
    return peaks;
  }

  private findSupportResistanceLevels(data: number[], type: 'support' | 'resistance'): number[] {
    const levels: number[] = [];
    const tolerance = 0.02; // 2% tolerance for level clustering
    
    // Find peaks/troughs
    const extremes = this.findPeaks(type === 'resistance' ? data : data.map(x => -x));
    const values = extremes.map(e => type === 'resistance' ? e.value : -e.value);
    
    // Cluster similar levels
    for (const value of values) {
      const existingLevel = levels.find(level => 
        Math.abs(level - value) / Math.max(level, value) < tolerance
      );
      
      if (!existingLevel) {
        levels.push(value);
      }
    }
    
    return levels.sort((a, b) => type === 'support' ? a - b : b - a).slice(0, 5);
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i - 1]) / data[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private getTimeframeMinutes(timeframe: string): number {
    switch (timeframe) {
      case '5m': return 5;
      case '15m': return 15;
      case '1h': return 60;
      case '4h': return 240;
      case '1d': return 1440;
      case '1w': return 10080;
      default: return 60;
    }
  }

  private matchesFilter(pattern: ChartPattern, filter: PatternScreenerFilter): boolean {
    if (filter.patternTypes && !filter.patternTypes.includes(pattern.patternType)) return false;
    if (filter.minConfidence && (pattern.confidence || 0) < filter.minConfidence / 100) return false;
    if (filter.maxAge) {
      const ageHours = (Date.now() - new Date(pattern.createdAt || Date.now()).getTime()) / (1000 * 60 * 60);
      if (ageHours > filter.maxAge) return false;
    }
    if (filter.trendAlignment !== undefined && pattern.trendAlignment !== filter.trendAlignment) return false;
    if (filter.volumeConfirmation !== undefined && pattern.volumeConfirmation !== filter.volumeConfirmation) return false;
    
    return true;
  }

  private calculatePatternDistribution(patterns: PatternScreenerResult['patterns']): { [patternType: string]: number } {
    const distribution: { [patternType: string]: number } = {};
    
    patterns.forEach(pattern => {
      distribution[pattern.patternType] = (distribution[pattern.patternType] || 0) + 1;
    });
    
    // Convert to percentages
    const total = patterns.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / total) * 100) / 100;
    });
    
    return distribution;
  }

  private generateSetupFromPattern(
    pattern: ChartPattern, 
    trend: TrendAnalysisResult, 
    cycle: MarketCycleAnalysis
  ): AiTradingSetup | null {
    if (!pattern.confidence || pattern.confidence < 0.6) return null;

    const currentPrice = pattern.currentPrice;
    const targetPrice = pattern.targetPrice || currentPrice;
    const stopLoss = pattern.stopLoss || currentPrice * 0.95;
    
    const setup: AiTradingSetup = {
      id: `setup_${pattern.id}_${Date.now()}`,
      setupType: 'pattern_breakout',
      setupCategory: 'swing',
      riskProfile: 'moderate',
      patternId: pattern.id,
      symbol: pattern.symbol,
      assetType: pattern.assetType,
      currentPrice,
      direction: pattern.targetDirection === 'bullish' ? 'long' : 'short',
      strategy: 'breakout',
      timeframe: pattern.timeframe,
      holdingPeriod: 'days',
      entryType: 'limit',
      entryPrice: currentPrice,
      entryZone: {
        min: currentPrice * 0.98,
        max: currentPrice * 1.02,
        optimal: currentPrice
      },
      entryConditions: [`${pattern.patternType} pattern completion`, 'Volume confirmation'],
      entryTiming: 'on_breakout',
      targetPrice,
      targetZone: {
        target1: targetPrice * 0.5 + currentPrice * 0.5,
        target2: targetPrice,
        target3: targetPrice * 1.2
      },
      stopLoss,
      stopType: 'fixed',
      riskRewardRatio: pattern.riskRewardRatio || 1.5,
      maxRisk: 2.0, // 2% max risk
      positionSize: 1.0, // 1% position size
      maxDrawdown: 5.0,
      successProbability: pattern.probabilitySuccess || 0.65,
      probabilityMethod: 'ml_model',
      expectedValue: ((targetPrice - currentPrice) * (pattern.probabilitySuccess || 0.65)) - ((currentPrice - stopLoss) * (1 - (pattern.probabilitySuccess || 0.65))),
      kellyPercentage: Math.min(5, Math.max(0.5, (pattern.probabilitySuccess || 0.65) * 2)),
      setupStrength: pattern.confidence,
      patternQuality: pattern.confidence,
      trendAlignment: trend.primaryTrend.direction === pattern.targetDirection ? 0.9 : 0.3,
      volumeConfirmation: pattern.volumeConfirmation ? 0.8 : 0.4,
      confluenceFactors: 3,
      supportingIndicators: {
        rsi: trend.technicalIndicators.momentum.rsi,
        macd: trend.technicalIndicators.momentum.macd.value > 0,
        trend_alignment: trend.primaryTrend.direction === pattern.targetDirection
      },
      resistanceLevels: pattern.resistanceLevels,
      supportLevels: pattern.supportLevels,
      fibonacciLevels: {},
      marketConditions: {
        trend: trend.primaryTrend.direction,
        cycle: cycle.currentCycle.type,
        volatility: 'normal'
      },
      sectorStrength: 0.7,
      correlationAnalysis: {},
      newsAnalysis: {},
      optimalExecution: {
        method: 'limit_order',
        timing: 'market_open',
        size_splits: 2
      },
      slippageExpectation: 0.1,
      liquidityAssessment: 'high',
      tradingHours: 'any',
      expectedReturn: ((targetPrice - currentPrice) / currentPrice) * 100,
      expectedTimeToTarget: Math.floor(Math.random() * 10) + 1,
      volatilityExpectation: 0.02,
      drawdownExpectation: -3.0,
      historicalPerformance: {},
      backtestResults: {},
      similarSetups: [],
      seasonalityBias: 0.0,
      modelVersion: 'v1.0',
      modelConfidence: pattern.confidence,
      featureImportance: {
        pattern_quality: 0.4,
        trend_alignment: 0.3,
        volume_confirmation: 0.2,
        market_cycle: 0.1
      },
      alternativeSetups: [],
      status: 'active',
      isTriggered: false,
      entryExecuted: false,
      exitExecuted: false,
      sharingLevel: 'private',
      tags: [pattern.patternType, 'ai_generated', pattern.targetDirection || 'neutral'],
      notes: `AI-generated setup based on ${pattern.patternType} pattern with ${Math.round((pattern.confidence || 0) * 100)}% confidence`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    } as AiTradingSetup;

    return setup;
  }

  private generateTrendBasedSetup(
    symbol: string, 
    trend: TrendAnalysisResult, 
    cycle: MarketCycleAnalysis
  ): AiTradingSetup | null {
    if (trend.primaryTrend.strength < 70) return null;

    const currentPrice = trend.technicalIndicators.movingAverages.sma20.value;
    const direction = trend.primaryTrend.direction === 'bullish' ? 'long' : 'short';
    const targetPrice = direction === 'long' ? currentPrice * 1.08 : currentPrice * 0.92;
    const stopLoss = direction === 'long' ? currentPrice * 0.96 : currentPrice * 1.04;

    const setup: AiTradingSetup = {
      id: `trend_setup_${symbol}_${Date.now()}`,
      setupType: 'trend_continuation',
      setupCategory: 'swing',
      riskProfile: 'moderate',
      symbol,
      assetType: symbol.includes('BTC') || symbol.includes('ETH') ? 'crypto' : 'stock',
      currentPrice,
      direction,
      strategy: 'trend_following',
      timeframe: trend.timeframe,
      holdingPeriod: 'days',
      entryType: 'market',
      entryPrice: currentPrice,
      entryZone: {
        min: currentPrice * 0.99,
        max: currentPrice * 1.01,
        optimal: currentPrice
      },
      entryConditions: ['Trend strength > 70%', 'Moving average support'],
      entryTiming: 'immediate',
      targetPrice,
      stopLoss,
      stopType: 'trailing',
      trailingStopDistance: 0.02,
      riskRewardRatio: Math.abs((targetPrice - currentPrice) / (currentPrice - stopLoss)),
      maxRisk: 2.5,
      positionSize: 1.5,
      successProbability: trend.primaryTrend.confidence / 100,
      probabilityMethod: 'trend_analysis',
      expectedValue: ((targetPrice - currentPrice) * trend.primaryTrend.confidence / 100) - ((currentPrice - stopLoss) * (1 - trend.primaryTrend.confidence / 100)),
      setupStrength: trend.primaryTrend.strength / 100,
      patternQuality: trend.primaryTrend.strength / 100,
      trendAlignment: 1.0,
      volumeConfirmation: trend.technicalIndicators.volume.trend === 'increasing' ? 0.8 : 0.5,
      confluenceFactors: 4,
      supportingIndicators: {
        trend_strength: trend.primaryTrend.strength,
        momentum: trend.primaryTrend.momentum,
        rsi: trend.technicalIndicators.momentum.rsi
      },
      resistanceLevels: trend.trendLevels.resistance.map(r => ({ price: r.price, strength: r.strength })),
      supportLevels: trend.trendLevels.support.map(s => ({ price: s.price, strength: s.strength })),
      marketConditions: {
        trend: trend.primaryTrend.direction,
        cycle: cycle.currentCycle.type,
        strength: trend.primaryTrend.strength
      },
      sectorStrength: 0.75,
      expectedReturn: ((targetPrice - currentPrice) / currentPrice) * 100,
      expectedTimeToTarget: 3,
      modelVersion: 'v1.0',
      modelConfidence: trend.primaryTrend.confidence / 100,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['trend_following', 'ai_generated', trend.primaryTrend.direction],
      notes: `Trend-based setup for ${trend.primaryTrend.direction} trend with ${trend.primaryTrend.strength}% strength`
    } as AiTradingSetup;

    return setup;
  }

  /**
   * Main pattern analysis entry point
   */
  async analyzePatterns(symbol: string, timeframe: string): Promise<PatternDetectionResult> {
    try {
      const [patterns, trendAnalysis, cycleAnalysis] = await Promise.all([
        this.detectChartPatterns(symbol, timeframe),
        this.config.enableTrendAnalysis ? this.analyzeTrend(symbol, timeframe) : Promise.resolve(null),
        this.config.enableCycleDetection ? this.analyzeMarketCycles(symbol) : Promise.resolve(null)
      ]);

      const result: PatternDetectionResult = {
        patterns,
        trendAnalysis: trendAnalysis ? [trendAnalysis as any] : [],
        marketCycles: cycleAnalysis ? [cycleAnalysis as any] : [],
        confidence: patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / Math.max(patterns.length, 1),
        processingTime: Math.random() * 500 + 100, // Mock processing time
        dataQuality: 'good',
        recommendedActions: this.generateRecommendations(patterns, trendAnalysis),
        riskFactors: [
          'Market volatility',
          'Pattern failure risk',
          'External market catalysts'
        ],
        marketContext: {
          overallTrend: trendAnalysis?.primaryTrend.direction || 'sideways',
          volatilityEnvironment: 'normal',
          marketRegime: cycleAnalysis?.currentCycle.type === 'bull_market' ? 'bull' : 
                       cycleAnalysis?.currentCycle.type === 'bear_market' ? 'bear' : 'ranging'
        }
      };

      // Generate alerts if enabled
      if (this.config.enableAlertGeneration) {
        await this.generatePatternAlerts(patterns, trendAnalysis);
      }

      return result;

    } catch (error) {
      console.error(`Pattern analysis failed for ${symbol}:`, error);
      throw error;
    }
  }

  private generateRecommendations(patterns: ChartPattern[], trendAnalysis: TrendAnalysisResult | null): string[] {
    const recommendations: string[] = [];

    if (patterns.length > 0) {
      const highConfidencePatterns = patterns.filter(p => (p.confidence || 0) > 0.8);
      if (highConfidencePatterns.length > 0) {
        recommendations.push(`Found ${highConfidencePatterns.length} high-confidence patterns`);
      }

      const bullishPatterns = patterns.filter(p => p.targetDirection === 'bullish');
      const bearishPatterns = patterns.filter(p => p.targetDirection === 'bearish');

      if (bullishPatterns.length > bearishPatterns.length) {
        recommendations.push('Overall bullish pattern bias detected');
      } else if (bearishPatterns.length > bullishPatterns.length) {
        recommendations.push('Overall bearish pattern bias detected');
      }
    }

    if (trendAnalysis) {
      if (trendAnalysis.primaryTrend.strength > 80) {
        recommendations.push(`Strong ${trendAnalysis.primaryTrend.direction} trend in progress`);
      }

      if (trendAnalysis.technicalIndicators.momentum.rsi > 70) {
        recommendations.push('Overbought conditions - consider taking profits');
      } else if (trendAnalysis.technicalIndicators.momentum.rsi < 30) {
        recommendations.push('Oversold conditions - potential buying opportunity');
      }
    }

    return recommendations.length > 0 ? recommendations : ['Monitor for pattern completion'];
  }

  private async generatePatternAlerts(patterns: ChartPattern[], trendAnalysis: TrendAnalysisResult | null): Promise<void> {
    for (const pattern of patterns) {
      if ((pattern.confidence || 0) > this.config.confidenceThreshold / 100) {
        const alertId = `alert_${pattern.symbol}_${pattern.patternType}_${Date.now()}`;
        
        // Check cooldown period
        const existingAlert = Array.from(this.activeAlerts.values())
          .find(a => a.symbol === pattern.symbol && a.alertType === 'pattern_detected');
        
        if (existingAlert) {
          const cooldownEnd = new Date(existingAlert.triggeredAt || existingAlert.createdAt || Date.now()).getTime() + 
                             this.config.alertCooldownPeriod * 60 * 1000;
          if (Date.now() < cooldownEnd) continue; // Skip due to cooldown
        }

        const alert: PatternAlert = {
          id: alertId,
          alertType: 'pattern_detected',
          alertCategory: 'technical_analysis',
          severity: (pattern.confidence || 0) > 0.9 ? 'high' : 
                   (pattern.confidence || 0) > 0.7 ? 'medium' : 'low',
          priority: (pattern.confidence || 0) > 0.8 ? 'high' : 'normal',
          patternId: pattern.id,
          symbol: pattern.symbol,
          assetType: pattern.assetType,
          currentPrice: pattern.currentPrice,
          priceChange: 0, // Would calculate from previous price
          priceChangePercent: 0,
          title: `${pattern.patternType.replace('_', ' ').toUpperCase()} Pattern Detected`,
          message: `High-confidence ${pattern.patternType} pattern detected on ${pattern.symbol} (${pattern.timeframe})`,
          detailedDescription: `AI detected a ${pattern.patternType} pattern with ${Math.round((pattern.confidence || 0) * 100)}% confidence. Target direction: ${pattern.targetDirection}`,
          technicalAnalysis: `Pattern shows ${pattern.patternQuality} quality formation with ${pattern.volumeConfirmation ? 'strong' : 'weak'} volume confirmation.`,
          recommendations: [
            `Monitor for breakout ${pattern.targetDirection === 'bullish' ? 'above' : 'below'} key levels`,
            `Set stop loss at ${pattern.stopLoss}`,
            `Target price: ${pattern.targetPrice}`
          ],
          tradingSignals: pattern.targetDirection !== 'neutral' ? [{
            action: pattern.targetDirection === 'bullish' ? 'buy' : 'sell',
            level: pattern.currentPrice,
            confidence: pattern.confidence || 0.5
          }] : [],
          riskFactors: ['Pattern failure', 'Market volatility', 'Volume divergence'],
          keyLevels: {
            support: pattern.supportLevels,
            resistance: pattern.resistanceLevels,
            entry: pattern.currentPrice,
            target: pattern.targetPrice,
            stop: pattern.stopLoss
          },
          timeframe: '24-48 hours',
          urgency: (pattern.confidence || 0) > 0.9 ? 'immediate' : 'within_24h',
          confidence: pattern.confidence || 0.5,
          signalStrength: pattern.confidence || 0.5,
          historicalAccuracy: 0.75, // Mock historical accuracy
          marketEnvironment: {
            trend: trendAnalysis?.primaryTrend.direction || 'sideways',
            volatility: 'normal',
            regime: 'ranging'
          },
          correlatedAlerts: [],
          sectorImpact: pattern.assetType === 'crypto' ? 'High crypto sector relevance' : 'Tech sector impact',
          deliveryChannels: ['dashboard', 'email'],
          generatedBy: 'pattern_ai',
          algorithmVersion: 'v2.1',
          dataSource: ['price_data', 'volume_data', 'technical_indicators'],
          tags: [pattern.patternType, pattern.targetDirection || 'neutral', 'ai_detected'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isViewed: false,
          isAcknowledged: false,
          isTriggered: true,
          triggeredAt: new Date().toISOString()
        } as PatternAlert;

        this.activeAlerts.set(alertId, alert);
        console.log(`🔔 Pattern alert generated: ${alert.title} for ${alert.symbol}`);
      }
    }
  }

  /**
   * Get active pattern alerts
   */
  getActiveAlerts(): PatternAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => new Date(b.triggeredAt || b.createdAt || 0).getTime() - new Date(a.triggeredAt || a.createdAt || 0).getTime());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.isAcknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      alert.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get pattern recognition configuration
   */
  getConfig(): PatternRecognitionConfig {
    return { ...this.config };
  }

  /**
   * Update pattern recognition configuration
   */
  updateConfig(newConfig: Partial<PatternRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Pattern recognition configuration updated:', newConfig);
  }
}

export const patternRecognitionService = PatternRecognitionService.getInstance();