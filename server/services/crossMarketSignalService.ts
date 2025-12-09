import { 
  CrossMarketSignal, 
  UnifiedSignalAlert, 
  SignalDashboardData, 
  CrossMarketCorrelationData 
} from '@shared/schema';
import { MarketEventModelingService } from './marketEventModelingService';
import { PatternRecognitionService } from './patternRecognitionService';
import { VolatilityForecastingService } from './volatilityForecastingService';
import { CorrelationAnalysisService } from './correlationAnalysisService';
import { MarketDataService, CryptoQuote, StockQuote } from './marketDataService';
import { RiskAssessmentService } from './riskAssessmentService';
import { onChainAnalyticsService } from './onChainAnalyticsService';

export interface CrossMarketSignalConfig {
  enableRealTimeSignals: boolean;
  enableCrossMarketAlerts: boolean;
  signalConfidenceThreshold: number; // 0-100
  alertSeverityThreshold: 'low' | 'medium' | 'high' | 'critical';
  maxActiveSignals: number;
  signalRefreshInterval: number; // seconds
  weightingScheme: {
    eventModelingWeight: number; // 0-1
    patternRecognitionWeight: number; // 0-1  
    volatilityForecastWeight: number; // 0-1
    correlationAnalysisWeight: number; // 0-1
  };
}

export class CrossMarketSignalService {
  private static instance: CrossMarketSignalService;
  private cache = new Map<string, { data: any; timestamp: number; timeout?: number }>();
  private readonly cacheTimeout = 60000; // 1 minute default cache
  private readonly signalCacheTimeout = 30000; // 30 seconds for signals
  
  // Service dependencies - all Phase 3 AI services
  private marketEventService: MarketEventModelingService;
  private patternRecognitionService: PatternRecognitionService;
  private volatilityForecastingService: VolatilityForecastingService;
  private correlationAnalysisService: CorrelationAnalysisService;
  private marketDataService: MarketDataService;
  private riskAssessmentService: RiskAssessmentService;
  
  // Configuration
  private config: CrossMarketSignalConfig = {
    enableRealTimeSignals: true,
    enableCrossMarketAlerts: true,
    signalConfidenceThreshold: 65,
    alertSeverityThreshold: 'medium',
    maxActiveSignals: 50,
    signalRefreshInterval: 30, // 30 seconds
    weightingScheme: {
      eventModelingWeight: 0.3, // 30% weight for events
      patternRecognitionWeight: 0.25, // 25% weight for patterns
      volatilityForecastWeight: 0.25, // 25% weight for volatility
      correlationAnalysisWeight: 0.2 // 20% weight for correlations
    }
  };
  
  // Active signals and alerts storage
  private activeSignals: Map<string, CrossMarketSignal> = new Map();
  private activeAlerts: Map<string, UnifiedSignalAlert> = new Map();
  
  // Asset universe for cross-market analysis
  private cryptoAssets = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'AAVE'];
  private stockAssets = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NFLX'];
  private cryptoStocks = ['MSTR', 'COIN', 'RIOT', 'MARA', 'CLSK', 'HUT', 'BITF'];
  private commodityAssets = ['GLD', 'SLV', 'USO', 'UNG', 'DBA'];
  private allAssets = [...this.cryptoAssets, ...this.stockAssets, ...this.cryptoStocks, ...this.commodityAssets];

  // Real-time monitoring intervals
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Initialize all Phase 3 AI services
    this.marketEventService = MarketEventModelingService.getInstance();
    this.patternRecognitionService = PatternRecognitionService.getInstance();
    this.volatilityForecastingService = VolatilityForecastingService.getInstance();
    this.correlationAnalysisService = CorrelationAnalysisService.getInstance();
    this.marketDataService = MarketDataService.getInstance();
    this.riskAssessmentService = RiskAssessmentService.getInstance();
    
    console.log('🚀 Cross-Market Signal Service initialized:');
    console.log(`  - Real-time Signals: ${this.config.enableRealTimeSignals ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Cross-market Alerts: ${this.config.enableCrossMarketAlerts ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  - Confidence Threshold: ${this.config.signalConfidenceThreshold}%`);
    console.log(`  - Signal Refresh: ${this.config.signalRefreshInterval}s`);
    console.log(`  - Weighting: Event(${this.config.weightingScheme.eventModelingWeight}) Pattern(${this.config.weightingScheme.patternRecognitionWeight}) Vol(${this.config.weightingScheme.volatilityForecastWeight}) Corr(${this.config.weightingScheme.correlationAnalysisWeight})`);
    
    // Start real-time monitoring if enabled (skip in QUIET_MODE to save API calls)
    if (this.config.enableRealTimeSignals && process.env.QUIET_MODE !== 'true') {
      this.startRealTimeMonitoring();
    } else if (process.env.QUIET_MODE === 'true') {
      console.log('🔇 [Cross-Market Signal] QUIET MODE - background monitoring disabled');
    }
  }

  static getInstance(): CrossMarketSignalService {
    if (!CrossMarketSignalService.instance) {
      CrossMarketSignalService.instance = new CrossMarketSignalService();
    }
    return CrossMarketSignalService.instance;
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
   * Start real-time signal monitoring
   */
  private startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateActiveSignals();
        await this.checkForNewAlerts();
        this.cleanupExpiredSignals();
      } catch (error) {
        console.error('❌ Error in real-time monitoring:', error);
      }
    }, this.config.signalRefreshInterval * 1000);
    
    console.log('🔄 Real-time signal monitoring started');
  }

  /**
   * Generate unified cross-market signals by integrating all Phase 3 AI services
   */
  async generateUnifiedSignals(): Promise<CrossMarketSignal[]> {
    const cacheKey = 'unified_signals';
    const cached = this.getFromCache(cacheKey, this.signalCacheTimeout);
    if (cached) return cached;

    try {
      console.log('🎯 Generating unified cross-market signals...');
      
      // Collect data from all Phase 3 AI services
      const [eventSignals, patternSignals, volatilitySignals, correlationSignals] = await Promise.all([
        this.getEventModelingSignals(),
        this.getPatternRecognitionSignals(),
        this.getVolatilityForecastingSignals(),
        this.getCorrelationAnalysisSignals()
      ]);
      
      // Generate unified signals for each asset
      const unifiedSignals: CrossMarketSignal[] = [];
      
      for (const asset of this.allAssets) {
        const signal = await this.generateAssetSignal(asset, {
          eventSignals,
          patternSignals, 
          volatilitySignals,
          correlationSignals
        });
        
        if (signal && signal.compositeScore.overall >= this.config.signalConfidenceThreshold) {
          unifiedSignals.push(signal);
        }
      }
      
      // Sort by composite score and limit to max active signals
      const sortedSignals = unifiedSignals
        .sort((a, b) => b.compositeScore.overall - a.compositeScore.overall)
        .slice(0, this.config.maxActiveSignals);
      
      // Update active signals cache
      sortedSignals.forEach(signal => {
        this.activeSignals.set(signal.id, signal);
      });
      
      this.setCache(cacheKey, sortedSignals, this.signalCacheTimeout);
      
      console.log(`✅ Generated ${sortedSignals.length} unified signals`);
      return sortedSignals;
      
    } catch (error) {
      console.error('❌ Error generating unified signals:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive signal for a specific asset
   */
  private async generateAssetSignal(
    symbol: string, 
    aiOutputs: any
  ): Promise<CrossMarketSignal | null> {
    try {
      const assetType = this.getAssetType(symbol);
      const currentPrice = await this.getCurrentPrice(symbol);
      
      if (!currentPrice) return null;
      
      // Calculate component scores from each AI service
      const eventScore = this.calculateEventModelingScore(symbol, aiOutputs.eventSignals);
      const patternScore = this.calculatePatternRecognitionScore(symbol, aiOutputs.patternSignals);
      const volatilityScore = this.calculateVolatilityForecastingScore(symbol, aiOutputs.volatilitySignals);
      const correlationScore = this.calculateCorrelationAnalysisScore(symbol, aiOutputs.correlationSignals);
      
      // Calculate weighted composite score
      const weightedAverage = (
        eventScore * this.config.weightingScheme.eventModelingWeight +
        patternScore * this.config.weightingScheme.patternRecognitionWeight +
        volatilityScore * this.config.weightingScheme.volatilityForecastWeight +
        correlationScore * this.config.weightingScheme.correlationAnalysisWeight
      );
      
      // Determine overall signal strength and confidence
      const overallScore = Math.round(weightedAverage);
      const confidence = this.calculateSignalConfidence(eventScore, patternScore, volatilityScore, correlationScore);
      
      if (overallScore < this.config.signalConfidenceThreshold) {
        return null; // Signal not strong enough
      }
      
      // Generate trading recommendations
      const tradingRecommendations = await this.generateTradingRecommendations(
        symbol, overallScore, confidence, aiOutputs
      );
      
      // Generate cross-market relationships
      const marketRelationships = await this.generateMarketRelationships(symbol, aiOutputs.correlationSignals);
      
      // Create comprehensive signal
      const signal: CrossMarketSignal = {
        id: `signal_${symbol}_${Date.now()}`,
        signalType: this.determineSignalType(overallScore, confidence),
        priority: this.determinePriority(overallScore, confidence),
        title: `${symbol} Cross-Market Signal`,
        description: `Unified signal for ${symbol} combining event modeling, pattern recognition, volatility forecasting, and correlation analysis`,
        summary: this.generateSignalSummary(symbol, overallScore, confidence, tradingRecommendations.primaryAction),
        
        compositeScore: {
          overall: overallScore,
          confidence: confidence,
          components: {
            eventModelingScore: eventScore,
            patternRecognitionScore: patternScore,
            volatilityForecastScore: volatilityScore,
            correlationAnalysisScore: correlationScore
          },
          weightedAverage: weightedAverage
        },
        
        affectedAssets: [{
          symbol,
          assetType,
          signalStrength: overallScore,
          direction: this.determineDirection(tradingRecommendations.primaryAction),
          expectedMove: this.calculateExpectedMove(symbol, aiOutputs),
          timeframe: this.determineTimeframe(aiOutputs),
          riskLevel: this.assessRiskLevel(symbol, volatilityScore, correlationScore)
        }],
        
        marketRelationships,
        tradingRecommendations,
        
        algorithmicInsights: {
          eventDrivenFactors: this.extractEventFactors(aiOutputs.eventSignals),
          patternMatchedSignals: this.extractPatternFactors(aiOutputs.patternSignals),
          volatilityPredictions: this.extractVolatilityFactors(aiOutputs.volatilitySignals),
          correlationShifts: this.extractCorrelationFactors(aiOutputs.correlationSignals)
        },
        
        alertConfiguration: this.generateAlertConfiguration(symbol, overallScore),
        
        performanceMetrics: await this.getSignalPerformanceMetrics(symbol),
        
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        createdBy: 'ai_system',
        lastEvaluated: new Date().toISOString(),
        nextEvaluation: new Date(Date.now() + this.config.signalRefreshInterval * 1000).toISOString()
      };
      
      return signal;
      
    } catch (error) {
      console.error(`❌ Error generating signal for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get signals from Market Event Modeling Service
   */
  private async getEventModelingSignals(): Promise<any> {
    try {
      // Get upcoming events and their impact predictions
      const upcomingEvents = await this.marketEventService.getUpcomingEvents();
      const dashboard = await this.marketEventService.getEventModelingDashboard();
      
      return {
        upcomingEvents,
        impactPredictions: dashboard.predictions || [],
        activeAlerts: dashboard.alerts || [],
        strength: this.calculateEventStrength(upcomingEvents, dashboard.predictions || [])
      };
    } catch (error) {
      console.error('❌ Error getting event modeling signals:', error);
      return { strength: 0 };
    }
  }

  /**
   * Get signals from Pattern Recognition Service
   */
  private async getPatternRecognitionSignals(): Promise<any> {
    try {
      const dashboard = await this.patternRecognitionService.getDashboard();
      const trendAnalysis = await this.patternRecognitionService.analyzeTrend('BTC', '4h');
      const tradingSetups = await this.patternRecognitionService.generateTradingSetups('BTC', '4h');
      
      return {
        patterns: dashboard.recentPatterns || [],
        trendAnalysis,
        tradingSetups,
        strength: this.calculatePatternStrength(dashboard.recentPatterns || [], trendAnalysis)
      };
    } catch (error) {
      console.error('❌ Error getting pattern recognition signals:', error);
      return { strength: 0 };
    }
  }

  /**
   * Get signals from Volatility Forecasting Service  
   */
  private async getVolatilityForecastingSignals(): Promise<any> {
    try {
      const volatilityForecasts = await this.volatilityForecastingService.generateVolatilityForecast('BTC');
      const stressIndicators = await this.volatilityForecastingService.getStressIndicators();
      const riskRegime = await this.volatilityForecastingService.analyzeRiskRegime();
      const crisisIndicators = await this.volatilityForecastingService.detectCrisisIndicators();
      
      return {
        volatilityForecasts,
        stressIndicators,
        riskRegime,
        crisisIndicators,
        strength: this.calculateVolatilityStrength([volatilityForecasts], stressIndicators, riskRegime)
      };
    } catch (error) {
      console.error('❌ Error getting volatility forecasting signals:', error);
      return { strength: 0 };
    }
  }

  /**
   * Get signals from Correlation Analysis Service
   */
  private async getCorrelationAnalysisSignals(): Promise<any> {
    try {
      const correlationMatrix = await this.correlationAnalysisService.getCorrelationMatrix();
      const marketRegime = await this.correlationAnalysisService.getMarketRegime();
      const riskSentiment = await this.correlationAnalysisService.getRiskSentimentIndicator();
      
      return {
        correlationMatrix,
        marketRegime,
        riskSentiment,
        strength: this.calculateCorrelationStrength(correlationMatrix, marketRegime)
      };
    } catch (error) {
      console.error('❌ Error getting correlation analysis signals:', error);
      return { strength: 0 };
    }
  }

  /**
   * Calculate individual component scores
   */
  private calculateEventModelingScore(symbol: string, eventSignals: any): number {
    if (!eventSignals || eventSignals.strength === undefined) return 50;
    
    // Convert event strength to 0-100 score
    const baseScore = Math.min(100, Math.max(0, eventSignals.strength * 10));
    
    // Boost score for high-impact events affecting this symbol
    let impactBoost = 0;
    if (eventSignals.impactPredictions) {
      const relevantPredictions = eventSignals.impactPredictions.filter(
        (pred: any) => pred.affectedAssets?.includes(symbol)
      );
      impactBoost = relevantPredictions.length * 5; // +5 per relevant prediction
    }
    
    return Math.min(100, Math.round(baseScore + impactBoost));
  }

  private calculatePatternRecognitionScore(symbol: string, patternSignals: any): number {
    if (!patternSignals || patternSignals.strength === undefined) return 50;
    
    const baseScore = Math.min(100, Math.max(0, patternSignals.strength * 10));
    
    // Boost score for active patterns on this symbol
    let patternBoost = 0;
    if (patternSignals.patterns) {
      const symbolPatterns = patternSignals.patterns.filter(
        (pattern: any) => pattern.symbol === symbol && pattern.status === 'active'
      );
      patternBoost = symbolPatterns.reduce((sum: number, pattern: any) => 
        sum + (pattern.confidence || 0), 0
      ) / Math.max(1, symbolPatterns.length);
    }
    
    return Math.min(100, Math.round((baseScore + patternBoost) / 2));
  }

  private calculateVolatilityForecastingScore(symbol: string, volatilitySignals: any): number {
    if (!volatilitySignals || volatilitySignals.strength === undefined) return 50;
    
    const baseScore = Math.min(100, Math.max(0, volatilitySignals.strength * 10));
    
    // Adjust for stress level and regime
    let volatilityAdjustment = 0;
    if (volatilitySignals.riskRegime) {
      const regime = volatilitySignals.riskRegime.regime;
      switch (regime) {
        case 'crisis': volatilityAdjustment = 20; break;
        case 'risk_off': volatilityAdjustment = 10; break;
        case 'risk_on': volatilityAdjustment = -10; break;
        default: volatilityAdjustment = 0;
      }
    }
    
    return Math.min(100, Math.max(0, Math.round(baseScore + volatilityAdjustment)));
  }

  private calculateCorrelationAnalysisScore(symbol: string, correlationSignals: any): number {
    if (!correlationSignals || correlationSignals.strength === undefined) return 50;
    
    const baseScore = Math.min(100, Math.max(0, correlationSignals.strength * 10));
    
    // Adjust for market regime
    let regimeAdjustment = 0;
    if (correlationSignals.marketRegime) {
      switch (correlationSignals.marketRegime.regime) {
        case 'risk_off': regimeAdjustment = 15; break;
        case 'mixed': regimeAdjustment = 5; break;
        case 'risk_on': regimeAdjustment = -5; break;
        default: regimeAdjustment = 0;
      }
    }
    
    return Math.min(100, Math.max(0, Math.round(baseScore + regimeAdjustment)));
  }

  /**
   * Calculate overall signal confidence based on component agreement
   */
  private calculateSignalConfidence(
    eventScore: number, 
    patternScore: number, 
    volatilityScore: number, 
    correlationScore: number
  ): number {
    const scores = [eventScore, patternScore, volatilityScore, correlationScore];
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate standard deviation to measure agreement
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher agreement (lower std dev) = higher confidence
    const baseConfidence = Math.max(50, 100 - (stdDev * 2));
    
    // Boost confidence for high scores with good agreement
    const scoreBoost = mean > 75 && stdDev < 15 ? 10 : 0;
    
    return Math.min(100, Math.round(baseConfidence + scoreBoost));
  }

  /**
   * Generate comprehensive trading recommendations
   */
  private async generateTradingRecommendations(
    symbol: string,
    overallScore: number,
    confidence: number,
    aiOutputs: any
  ): Promise<CrossMarketSignal['tradingRecommendations']> {
    const currentPrice = await this.getCurrentPrice(symbol);
    
    // If no price available, return conservative recommendations
    if (currentPrice === null) {
      return {
        primaryAction: 'hold',
        positionSizing: {
          recommendedAllocation: 0,
          maxRisk: 0,
          diversificationAdvice: 'No price data available - avoid trading until data is restored'
        },
        entryStrategy: {
          preferredEntry: 0,
          entryRange: { lower: 0, upper: 0 },
          timingAdvice: 'Wait for market data to become available'
        },
        riskManagement: {
          stopLoss: 0,
          takeProfit: 0,
          trailingStop: 0,
          positionAdjustment: 'No position recommended without price data'
        },
        timeHorizon: 'short_term'
      };
    }
    
    // Determine primary action based on score and confidence
    let primaryAction: CrossMarketSignal['tradingRecommendations']['primaryAction'];
    if (overallScore >= 85 && confidence >= 80) {
      primaryAction = 'strong_buy';
    } else if (overallScore >= 70 && confidence >= 65) {
      primaryAction = 'buy';
    } else if (overallScore <= 30 && confidence >= 65) {
      primaryAction = overallScore <= 15 ? 'strong_sell' : 'sell';
    } else if (overallScore >= 60 || confidence < 50) {
      primaryAction = 'hold';
    } else {
      primaryAction = 'hedge';
    }
    
    // Calculate position sizing based on confidence and volatility
    const baseAllocation = this.calculateBaseAllocation(overallScore, confidence);
    const volatilityAdjustment = this.getVolatilityAdjustment(symbol, aiOutputs.volatilitySignals);
    const recommendedAllocation = Math.max(1, Math.min(25, baseAllocation * volatilityAdjustment));
    
    // Generate entry strategy
    const priceRange = this.calculateEntryRange(currentPrice, aiOutputs);
    
    // Generate risk management levels
    const riskManagement = this.calculateRiskManagement(currentPrice, overallScore, confidence);
    
    return {
      primaryAction,
      positionSizing: {
        recommendedAllocation: Math.round(recommendedAllocation * 100) / 100,
        maxRisk: Math.min(5, recommendedAllocation * 0.5),
        diversificationAdvice: this.generateDiversificationAdvice(symbol, overallScore)
      },
      entryStrategy: {
        preferredEntry: currentPrice,
        entryRange: priceRange,
        timingAdvice: this.generateTimingAdvice(confidence, aiOutputs)
      },
      riskManagement,
      timeHorizon: this.determineTimeHorizon(aiOutputs, confidence)
    };
  }

  /**
   * Generate market relationships analysis
   */
  private async generateMarketRelationships(symbol: string, correlationSignals: any): Promise<CrossMarketSignal['marketRelationships']> {
    const relationships: CrossMarketSignal['marketRelationships'] = [];
    
    if (!correlationSignals?.correlationMatrix) return relationships;
    
    // Find strong correlations with other assets
    for (const correlation of correlationSignals.correlationMatrix) {
      if (correlation.asset1 === symbol || correlation.asset2 === symbol) {
        const otherAsset = correlation.asset1 === symbol ? correlation.asset2 : correlation.asset1;
        const strength = Math.abs(correlation.correlation);
        
        if (strength >= 0.5) { // Only include significant relationships
          relationships.push({
            asset1: symbol,
            asset2: otherAsset,
            correlationType: correlation.correlation > 0.8 ? 'direct' : 
                           correlation.correlation < -0.8 ? 'inverse' : 'leading',
            strength,
            breakdownProbability: this.calculateBreakdownProbability(correlation),
            timeDelay: this.estimateTimeDelay(correlation)
          });
        }
      }
    }
    
    return relationships.slice(0, 5); // Limit to top 5 relationships
  }

  /**
   * Generate cross-market alerts based on signal changes
   */
  async generateCrossMarketAlerts(): Promise<UnifiedSignalAlert[]> {
    const cacheKey = 'cross_market_alerts';
    const cached = this.getFromCache(cacheKey, this.signalCacheTimeout);
    if (cached) return cached;
    
    try {
      const alerts: UnifiedSignalAlert[] = [];
      const currentSignals = await this.generateUnifiedSignals();
      
      // Check for new high-priority opportunities
      const highPrioritySignals = currentSignals.filter(
        signal => signal.priority === 'critical' || signal.priority === 'high'
      );
      
      for (const signal of highPrioritySignals) {
        if (this.shouldCreateAlert(signal)) {
          const alert = this.createSignalAlert(signal);
          alerts.push(alert);
          this.activeAlerts.set(alert.id, alert);
        }
      }
      
      // Check for correlation breakdown risks
      const correlationAlerts = await this.checkCorrelationBreakdowns();
      alerts.push(...correlationAlerts);
      
      // Check for regime shift alerts
      const regimeAlerts = await this.checkRegimeShifts();
      alerts.push(...regimeAlerts);
      
      this.setCache(cacheKey, alerts, this.signalCacheTimeout);
      return alerts;
      
    } catch (error) {
      console.error('❌ Error generating cross-market alerts:', error);
      return [];
    }
  }

  /**
   * Get comprehensive signal dashboard data
   */
  async getSignalDashboardData(): Promise<SignalDashboardData> {
    const cacheKey = 'signal_dashboard';
    const cached = this.getFromCache(cacheKey, this.cacheTimeout);
    if (cached) return cached;
    
    try {
      const [signals, alerts, marketData] = await Promise.all([
        this.generateUnifiedSignals(),
        this.generateCrossMarketAlerts(),
        this.getMarketContextData()
      ]);
      
      const dashboardData: SignalDashboardData = {
        overviewMetrics: {
          totalActiveSignals: signals.length,
          highPriorityAlerts: alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length,
          avgConfidenceScore: Math.round(
            signals.reduce((sum, signal) => sum + signal.compositeScore.confidence, 0) / Math.max(1, signals.length)
          ),
          successRateToday: await this.calculateTodaySuccessRate(),
          portfolioImpactScore: await this.calculatePortfolioImpactScore(signals)
        },
        
        topSignals: signals.slice(0, 10), // Top 10 signals by strength
        criticalAlerts: alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').slice(0, 5),
        
        marketStatus: {
          currentRegime: marketData.regime,
          regimeConfidence: marketData.regimeConfidence,
          overallCorrelation: marketData.overallCorrelation,
          stressLevel: marketData.stressLevel,
          volatilityEnvironment: marketData.volatilityEnvironment
        },
        
        performanceSummary: await this.getPerformanceSummary(),
        marketContext: marketData.context,
        lastUpdated: new Date().toISOString()
      };
      
      this.setCache(cacheKey, dashboardData, this.cacheTimeout);
      return dashboardData;
      
    } catch (error) {
      console.error('❌ Error getting signal dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get cross-market correlation analysis data
   */
  async getCrossMarketCorrelationData(): Promise<CrossMarketCorrelationData> {
    const cacheKey = 'cross_market_correlation';
    const cached = this.getFromCache(cacheKey, this.cacheTimeout);
    if (cached) return cached;
    
    try {
      const correlationMatrixResponse = await this.correlationAnalysisService.getCorrelationMatrix();
      const marketRegime = await this.correlationAnalysisService.getMarketRegime();
      
      // Ensure correlationMatrix is an array - fix the critical frontend error
      const correlationMatrix = Array.isArray(correlationMatrixResponse) 
        ? correlationMatrixResponse 
        : (correlationMatrixResponse?.data?.matrix || correlationMatrixResponse?.matrix || []);
      
      const data: CrossMarketCorrelationData = {
        correlationMatrix: correlationMatrix.map((corr: any) => ({
          asset1: corr.assetPair?.asset1 || corr.asset1,
          asset2: corr.assetPair?.asset2 || corr.asset2,
          correlation: corr.correlation || 0,
          strength: corr.strength || 'weak',
          change24h: this.calculateCorrelationChange(corr),
          breakdownRisk: this.calculateBreakdownProbability(corr),
          timeframe: '1d'
        })),
        
        correlationRegime: {
          current: this.classifyCorrelationRegime(correlationMatrix),
          confidence: marketRegime.confidence * 100,
          duration: this.calculateRegimeDuration(marketRegime),
          historicalPercentile: this.calculateHistoricalPercentile(correlationMatrix)
        },
        
        significantChanges: this.identifySignificantChanges(correlationMatrix),
        marketFlows: await this.analyzeMarketFlows(),
        lastUpdated: new Date().toISOString()
      };
      
      this.setCache(cacheKey, data, this.cacheTimeout);
      return data;
      
    } catch (error) {
      console.error('❌ Error getting cross-market correlation data:', error);
      throw error;
    }
  }

  // Helper methods for signal generation and processing
  private getAssetType(symbol: string): 'crypto' | 'stock' | 'commodity' | 'currency' {
    if (this.cryptoAssets.includes(symbol)) return 'crypto';
    if (this.stockAssets.includes(symbol) || this.cryptoStocks.includes(symbol)) return 'stock';
    if (this.commodityAssets.includes(symbol)) return 'commodity';
    return 'currency';
  }

  private async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const assetType = this.getAssetType(symbol);
      if (assetType === 'crypto') {
        const quotes = await this.marketDataService.getCryptoQuotes([symbol]);
        return quotes[0]?.price || null;
      } else {
        // For stocks, try getCryptoStocks but return null if not available
        const cryptoStocks = await this.marketDataService.getCryptoStocks();
        const stockData = cryptoStocks.find(stock => stock.symbol === symbol);
        return stockData?.price || null;
      }
    } catch (error) {
      console.error(`❌ Error getting price for ${symbol}:`, error);
      return null;
    }
  }

  // Removed: Mock stock price dictionary - was returning fake prices

  private determineSignalType(overallScore: number, confidence: number): CrossMarketSignal['signalType'] {
    if (confidence >= 85 && overallScore >= 80) return 'unified_trade_signal';
    if (overallScore >= 70 && confidence >= 70) return 'cross_market_alert';
    if (confidence >= 75) return 'regime_shift_signal';
    if (overallScore >= 60) return 'correlation_break_signal';
    return 'composite_risk_signal';
  }

  private determinePriority(overallScore: number, confidence: number): CrossMarketSignal['priority'] {
    if (overallScore >= 90 && confidence >= 90) return 'critical';
    if (overallScore >= 75 && confidence >= 75) return 'high';
    if (overallScore >= 60 && confidence >= 60) return 'medium';
    return 'low';
  }

  private generateSignalSummary(symbol: string, score: number, confidence: number, action: string): string {
    const direction = action.includes('buy') ? 'bullish' : action.includes('sell') ? 'bearish' : 'neutral';
    return `${direction.toUpperCase()} signal for ${symbol} with ${score}% strength and ${confidence}% confidence. Recommendation: ${action.toUpperCase()}.`;
  }

  private determineDirection(action: CrossMarketSignal['tradingRecommendations']['primaryAction']): 'bullish' | 'bearish' | 'neutral' {
    if (action.includes('buy')) return 'bullish';
    if (action.includes('sell')) return 'bearish';
    return 'neutral';
  }

  private calculateExpectedMove(symbol: string, aiOutputs: any): number {
    // Combine expected moves from different AI services
    let totalMove = 0;
    let count = 0;
    
    // Add pattern-based expected moves
    if (aiOutputs.patternSignals?.patterns) {
      const symbolPatterns = aiOutputs.patternSignals.patterns.filter((p: any) => p.symbol === symbol);
      if (symbolPatterns.length > 0) {
        totalMove += symbolPatterns.reduce((sum: number, p: any) => sum + (p.expectedMove || 0), 0) / symbolPatterns.length;
        count++;
      }
    }
    
    // Add volatility-based expected moves
    if (aiOutputs.volatilitySignals?.volatilityForecasts) {
      const forecast = aiOutputs.volatilitySignals.volatilityForecasts.find((f: any) => f.symbol === symbol);
      if (forecast) {
        totalMove += forecast.predictions?.[0]?.expectedVolatility || 0;
        count++;
      }
    }
    
    // Add event-based expected moves
    if (aiOutputs.eventSignals?.impactPredictions) {
      const predictions = aiOutputs.eventSignals.impactPredictions.filter((p: any) => 
        p.affectedAssets?.includes(symbol)
      );
      if (predictions.length > 0) {
        totalMove += predictions.reduce((sum: number, p: any) => sum + (p.magnitude?.expectedMove || 0), 0) / predictions.length;
        count++;
      }
    }
    
    return count > 0 ? Math.round((totalMove / count) * 100) / 100 : 5.0; // Default 5% if no data
  }

  private determineTimeframe(aiOutputs: any): CrossMarketSignal['affectedAssets'][0]['timeframe'] {
    // Analyze AI outputs to determine optimal timeframe
    if (aiOutputs.patternSignals?.patterns?.some((p: any) => p.timeframe === '1h' || p.timeframe === '4h')) {
      return '4h';
    }
    if (aiOutputs.eventSignals?.upcomingEvents?.some((e: any) => e.timeToEvent < 24 * 60 * 60 * 1000)) {
      return '1d';
    }
    return '1w'; // Default weekly timeframe
  }

  private assessRiskLevel(symbol: string, volatilityScore: number, correlationScore: number): CrossMarketSignal['affectedAssets'][0]['riskLevel'] {
    const avgScore = (volatilityScore + correlationScore) / 2;
    if (avgScore >= 85) return 'extreme';
    if (avgScore >= 70) return 'high';
    if (avgScore >= 50) return 'medium';
    return 'low';
  }

  // Additional helper methods...
  private calculateEventStrength(events: any[], predictions: any[]): number {
    if (!events?.length && !predictions?.length) return 5;
    
    const eventScore = events.reduce((sum, event) => {
      const impact = event.impact === 'critical' ? 10 : event.impact === 'high' ? 7 : event.impact === 'medium' ? 4 : 1;
      return sum + impact;
    }, 0);
    
    const predictionScore = predictions.reduce((sum, pred) => sum + (pred.confidence || 0), 0) / Math.max(1, predictions.length);
    
    return Math.min(10, (eventScore + predictionScore / 10));
  }

  private calculatePatternStrength(patterns: any[], trends: any): number {
    if (!patterns?.length && !trends) return 5;
    
    const patternScore = patterns.reduce((sum, pattern) => sum + (pattern.confidence || 0), 0) / Math.max(1, patterns.length * 10);
    // Handle trends as a single object, not an array
    const trendScore = trends ? (trends.strength || trends.confidence || 0) / 10 : 0;
    
    return Math.min(10, (patternScore + trendScore) * 5);
  }

  private calculateVolatilityStrength(forecasts: any[], indicators: any[], regime: any): number {
    if (!forecasts?.length && !indicators?.length) return 5;
    
    let strength = 5; // baseline
    
    if (regime?.regime === 'crisis') strength += 3;
    else if (regime?.regime === 'risk_off') strength += 2;
    else if (regime?.regime === 'risk_on') strength -= 1;
    
    const avgIndicator = indicators.reduce((sum, ind) => sum + (ind.normalizedValue || 0), 0) / Math.max(1, indicators.length);
    strength += (avgIndicator / 10);
    
    return Math.min(10, Math.max(1, strength));
  }

  private calculateCorrelationStrength(matrix: any[], regime: any): number {
    if (!matrix?.length) return 5;
    
    const avgCorrelation = matrix.reduce((sum, corr) => sum + Math.abs(corr.correlation || 0), 0) / matrix.length;
    let strength = avgCorrelation * 10;
    
    if (regime?.regime === 'risk_off') strength += 2;
    else if (regime?.regime === 'mixed') strength += 1;
    
    return Math.min(10, Math.max(1, strength));
  }

  // More helper methods for alert generation, performance tracking, etc.
  private async updateActiveSignals(): Promise<void> {
    const freshSignals = await this.generateUnifiedSignals();
    
    // Update the active signals map
    this.activeSignals.clear();
    freshSignals.forEach(signal => {
      this.activeSignals.set(signal.id, signal);
    });
  }

  private async checkForNewAlerts(): Promise<void> {
    const newAlerts = await this.generateCrossMarketAlerts();
    
    newAlerts.forEach(alert => {
      if (!this.activeAlerts.has(alert.id)) {
        this.activeAlerts.set(alert.id, alert);
        console.log(`🚨 New alert generated: ${alert.title}`);
      }
    });
  }

  private cleanupExpiredSignals(): void {
    const now = Date.now();
    
    // Remove expired signals
    Array.from(this.activeSignals.entries()).forEach(([id, signal]) => {
      if (new Date(signal.validUntil).getTime() < now) {
        this.activeSignals.delete(id);
      }
    });
    
    // Remove resolved alerts
    Array.from(this.activeAlerts.entries()).forEach(([id, alert]) => {
      if (!alert.isActive || alert.resolvedAt) {
        this.activeAlerts.delete(id);
      }
    });
  }

  // Placeholder methods - these would contain more complex logic in production
  private extractEventFactors(eventSignals: any): any[] { return []; }
  private extractPatternFactors(patternSignals: any): any[] { return []; }
  private extractVolatilityFactors(volatilitySignals: any): any[] { return []; }
  private extractCorrelationFactors(correlationSignals: any): any[] { return []; }
  private generateAlertConfiguration(symbol: string, score: number): any { return { priceAlerts: [], volatilityAlerts: [], correlationAlerts: [] }; }
  private async getSignalPerformanceMetrics(symbol: string): Promise<any> { return { backtestResults: { winRate: 0, averageReturn: 0, sharpeRatio: 0, maxDrawdown: 0, totalTrades: 0 }, predictionAccuracy: { shortTerm: 0, mediumTerm: 0, longTerm: 0 } }; }
  private calculateBaseAllocation(score: number, confidence: number): number { return Math.min(20, (score * confidence) / 500); }
  private getVolatilityAdjustment(symbol: string, volatilitySignals: any): number { return 1.0; }
  private calculateEntryRange(currentPrice: number, aiOutputs: any): any { return { min: currentPrice * 0.98, max: currentPrice * 1.02 }; }
  private calculateRiskManagement(currentPrice: number, score: number, confidence: number): any { return { stopLoss: currentPrice * 0.95, takeProfit: [currentPrice * 1.05, currentPrice * 1.10], maxDrawdown: 10 }; }
  private generateDiversificationAdvice(symbol: string, score: number): string { return "Maintain diversified portfolio"; }
  private generateTimingAdvice(confidence: number, aiOutputs: any): string { return "Enter gradually over 1-2 days"; }
  private determineTimeHorizon(aiOutputs: any, confidence: number): any { return 'swing'; }
  private calculateBreakdownProbability(correlation: any): number { return Math.max(0, 100 - (Math.abs(correlation.correlation) * 100)); }
  private estimateTimeDelay(correlation: any): number { return 0; }
  private shouldCreateAlert(signal: CrossMarketSignal): boolean { return signal.compositeScore.overall >= 80; }
  private createSignalAlert(signal: CrossMarketSignal): UnifiedSignalAlert { 
    return {
      id: `alert_${signal.id}`,
      signalId: signal.id,
      alertType: 'new_opportunity',
      severity: signal.priority === 'critical' ? 'critical' : 'high',
      title: `New ${signal.priority.toUpperCase()} signal: ${signal.title}`,
      message: signal.summary,
      details: signal.description,
      triggerConditions: [],
      affectedAssets: signal.affectedAssets.map(asset => asset.symbol),
      expectedImpact: { direction: signal.affectedAssets[0]?.direction === 'bullish' ? 'positive' : 'negative', magnitude: signal.compositeScore.overall, timeframe: signal.affectedAssets[0]?.timeframe || '1d' },
      urgentActions: [],
      isActive: true,
      triggeredAt: new Date().toISOString(),
      relatedAlerts: [],
      escalationLevel: signal.priority === 'critical' ? 5 : 3,
      requiresAction: true
    };
  }
  private async checkCorrelationBreakdowns(): Promise<UnifiedSignalAlert[]> { return []; }
  private async checkRegimeShifts(): Promise<UnifiedSignalAlert[]> { return []; }
  private async getMarketContextData(): Promise<any> { 
    return {
      regime: 'risk_on',
      regimeConfidence: 75,
      overallCorrelation: 0.6,
      stressLevel: 30,
      volatilityEnvironment: 'normal',
      context: { majorAssetPrices: [], keyIndicators: [] }
    };
  }
  private async calculateTodaySuccessRate(): Promise<number> { return 72; }
  private async calculatePortfolioImpactScore(signals: CrossMarketSignal[]): Promise<number> { return 85; }
  private async getPerformanceSummary(): Promise<any> { 
    return {
      todayPerformance: 2.5,
      weekPerformance: 8.3,
      monthPerformance: 15.7,
      bestPerformingSignal: 'BTC_unified',
      worstPerformingSignal: 'ETH_correlation'
    };
  }
  private calculateCorrelationChange(corr: any): number { return 0; }
  private classifyCorrelationRegime(matrix: any[]): any { return 'normal'; }
  private calculateRegimeDuration(regime: any): number { return 14; }
  private calculateHistoricalPercentile(matrix: any[]): number { return 65; }
  private identifySignificantChanges(matrix: any[]): any[] { return []; }
  private async analyzeMarketFlows(): Promise<any[]> { return []; }

  /**
   * Stop real-time monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Real-time signal monitoring stopped');
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): CrossMarketSignalConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<CrossMarketSignalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Cross-market signal configuration updated');
    
    // Restart monitoring if settings changed
    if (this.config.enableRealTimeSignals && !this.monitoringInterval) {
      this.startRealTimeMonitoring();
    } else if (!this.config.enableRealTimeSignals && this.monitoringInterval) {
      this.stopMonitoring();
    }
  }
}

// Create singleton instance
export const crossMarketSignalService = CrossMarketSignalService.getInstance();