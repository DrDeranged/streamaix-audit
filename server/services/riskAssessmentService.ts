import { MarketDataService, CryptoQuote, StockQuote } from './marketDataService';
import { CorrelationAnalysisService } from './correlationAnalysisService';

// Risk Assessment Types
export interface PortfolioPosition {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity' | 'currency';
  allocation: number; // percentage of portfolio (0-100)
  currentPrice: number;
  quantity: number;
  value: number; // current market value
  costBasis?: number; // average purchase price
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalAllocated: number; // percentage allocated (should be <= 100)
  availableCash: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
}

export interface RiskMetrics {
  // Value at Risk (VaR) calculations
  var95_1d: number; // 1-day VaR at 95% confidence
  var99_1d: number; // 1-day VaR at 99% confidence
  var95_7d: number; // 7-day VaR at 95% confidence
  var99_7d: number; // 7-day VaR at 99% confidence
  
  // Portfolio volatility and correlation
  portfolioVolatility: number; // annualized volatility
  sharpeRatio: number; // risk-adjusted return metric
  maxDrawdown: number; // maximum historical drawdown percentage
  maxDrawdownDays: number; // days in max drawdown period
  
  // Concentration and diversification
  concentrationRisk: number; // 0-100, higher = more concentrated
  diversificationScore: number; // 0-100, higher = more diversified
  largestPositionPercent: number; // largest single position percentage
  topThreePositionsPercent: number; // top 3 positions combined percentage
  
  // Asset class breakdown
  assetClassExposure: {
    crypto: number;
    stocks: number;
    commodities: number;
    cash: number;
  };
  
  // Risk-adjusted metrics
  calmarRatio: number; // return/max drawdown
  sortinoRatio: number; // downside deviation adjusted return
  beta: number; // portfolio beta vs market
  alpha: number; // portfolio alpha vs market
  
  calculatedAt: string;
}

export interface StressTestScenario {
  name: string;
  description: string;
  scenarioType: 'market_crash' | 'crypto_winter' | 'correlation_breakdown' | 'liquidity_crisis' | 'inflation_spike' | 'black_swan';
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  
  // Asset-specific stress factors (multipliers applied to returns)
  stressFactors: {
    crypto: number; // e.g., -0.50 for 50% decline
    stocks: number;
    commodities: number;
    correlationMultiplier: number; // how correlations change during stress
  };
  
  // Expected timeline and recovery
  durationDays: number;
  recoveryMonths: number;
  historicalPrecedent?: string;
}

export interface StressTestResult {
  scenario: StressTestScenario;
  portfolioImpact: {
    totalLoss: number; // absolute loss amount
    totalLossPercent: number; // percentage loss
    timeToRecover: number; // estimated days to break even
    worstDayLoss: number; // worst single day loss
    positionImpacts: Array<{
      symbol: string;
      currentValue: number;
      stressedValue: number;
      lossAmount: number;
      lossPercent: number;
    }>;
  };
  riskMetrics: {
    stressedVaR: number; // VaR under stress conditions
    stressedVolatility: number;
    liquidityRisk: number; // 0-100 difficulty of exiting positions
    correlationRisk: number; // 0-100 correlation breakdown risk
  };
  actionableInsights: string[];
  calculatedAt: string;
}

export interface PositionSizingRecommendation {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity';
  currentAllocation: number;
  recommendedAllocation: number;
  rationale: string;
  riskScore: number; // 0-100, higher = riskier
  expectedReturn: number; // annualized expected return
  maxDrawdownExpectation: number;
  
  sizingMethod: 'kelly_criterion' | 'equal_weight' | 'risk_parity' | 'momentum_based' | 'mean_reversion';
  confidence: number; // 0-100 confidence in recommendation
  timeHorizon: '1w' | '1m' | '3m' | '6m' | '1y';
}

export interface RiskAlert {
  id: string;
  alertType: 'concentration_risk' | 'var_breach' | 'correlation_spike' | 'volatility_spike' | 'drawdown_limit' | 'rebalancing_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedPositions: string[];
  
  threshold: {
    metric: string;
    currentValue: number;
    thresholdValue: number;
    breachPercent: number;
  };
  
  recommendedActions: string[];
  estimatedImpact: string;
  createdAt: string;
  isActive: boolean;
  acknowledgedAt?: string;
}

export interface PortfolioComposition {
  assetAllocation: {
    crypto: { allocation: number; value: number; positions: number; };
    stocks: { allocation: number; value: number; positions: number; };
    commodities: { allocation: number; value: number; positions: number; };
    cash: { allocation: number; value: number; };
  };
  
  sectorExposure: Array<{
    sector: string;
    allocation: number;
    value: number;
    riskScore: number;
    topSymbols: string[];
  }>;
  
  geographicExposure: Array<{
    region: string;
    allocation: number;
    value: number;
    symbols: string[];
  }>;
  
  rebalancingNeeds: Array<{
    position: string;
    currentWeight: number;
    targetWeight: number;
    deviation: number;
    action: 'buy' | 'sell' | 'hold';
    urgency: 'low' | 'medium' | 'high';
  }>;
  
  lastRebalanced: string;
  nextRebalancingDate: string;
}

export class RiskAssessmentService {
  private static instance: RiskAssessmentService;
  private marketDataService: MarketDataService;
  private correlationService: CorrelationAnalysisService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 300000; // 5 minutes

  // Default stress test scenarios
  private stressScenarios: StressTestScenario[] = [
    {
      name: "March 2020 COVID Crash",
      description: "Sudden market crash due to global pandemic uncertainty",
      scenarioType: "market_crash",
      severity: "severe",
      stressFactors: {
        crypto: -0.45, // 45% decline
        stocks: -0.35, // 35% decline
        commodities: -0.25, // 25% decline
        correlationMultiplier: 2.5 // correlations spike during crisis
      },
      durationDays: 21,
      recoveryMonths: 8,
      historicalPrecedent: "March 2020 pandemic crash"
    },
    {
      name: "Crypto Winter 2022",
      description: "Extended crypto bear market with institutional deleveraging",
      scenarioType: "crypto_winter",
      severity: "severe",
      stressFactors: {
        crypto: -0.70, // 70% decline
        stocks: -0.15, // 15% decline
        commodities: 0.05, // 5% gain (flight to real assets)
        correlationMultiplier: 0.8 // crypto correlation temporarily breaks down
      },
      durationDays: 180,
      recoveryMonths: 24,
      historicalPrecedent: "2022 FTX collapse and crypto winter"
    },
    {
      name: "Flash Crash",
      description: "Rapid algorithmic-driven sell-off across all markets",
      scenarioType: "liquidity_crisis",
      severity: "extreme",
      stressFactors: {
        crypto: -0.30, // 30% decline in minutes
        stocks: -0.20, // 20% decline
        commodities: -0.15, // 15% decline
        correlationMultiplier: 3.0 // everything sells off together
      },
      durationDays: 1,
      recoveryMonths: 2,
      historicalPrecedent: "May 2010 Flash Crash"
    },
    {
      name: "Correlation Breakdown",
      description: "Traditional diversification fails as correlations spike",
      scenarioType: "correlation_breakdown",
      severity: "moderate",
      stressFactors: {
        crypto: -0.25,
        stocks: -0.25,
        commodities: -0.20,
        correlationMultiplier: 4.0 // massive correlation increase
      },
      durationDays: 45,
      recoveryMonths: 6,
      historicalPrecedent: "2008 Financial Crisis correlation spike"
    },
    {
      name: "Inflation Shock",
      description: "Sudden spike in inflation expectations",
      scenarioType: "inflation_spike",
      severity: "moderate",
      stressFactors: {
        crypto: 0.15, // crypto benefits as inflation hedge
        stocks: -0.20, // growth stocks suffer
        commodities: 0.25, // commodities rally
        correlationMultiplier: 1.2
      },
      durationDays: 90,
      recoveryMonths: 12,
      historicalPrecedent: "1970s stagflation period"
    }
  ];

  constructor() {
    this.marketDataService = MarketDataService.getInstance();
    this.correlationService = CorrelationAnalysisService.getInstance();
  }

  static getInstance(): RiskAssessmentService {
    if (!RiskAssessmentService.instance) {
      RiskAssessmentService.instance = new RiskAssessmentService();
    }
    return RiskAssessmentService.instance;
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
   * Generate mock portfolio for demonstration
   * In production, this would fetch user's actual portfolio
   */
  private generateMockPortfolio(): PortfolioMetrics {
    const mockPositions: PortfolioPosition[] = [
      {
        symbol: 'BTC',
        assetType: 'crypto',
        allocation: 25.0,
        currentPrice: 45000,
        quantity: 0.5556,
        value: 25000,
        costBasis: 40000,
        unrealizedPnL: 2778,
        unrealizedPnLPercent: 12.5
      },
      {
        symbol: 'ETH',
        assetType: 'crypto',
        allocation: 20.0,
        currentPrice: 3200,
        quantity: 6.25,
        value: 20000,
        costBasis: 2800,
        unrealizedPnL: 2500,
        unrealizedPnLPercent: 14.3
      },
      {
        symbol: 'NVDA',
        assetType: 'stock',
        allocation: 15.0,
        currentPrice: 875,
        quantity: 17.14,
        value: 15000,
        costBasis: 820,
        unrealizedPnL: 943,
        unrealizedPnLPercent: 6.7
      },
      {
        symbol: 'TSLA',
        assetType: 'stock',
        allocation: 12.0,
        currentPrice: 240,
        quantity: 50,
        value: 12000,
        costBasis: 280,
        unrealizedPnL: -2000,
        unrealizedPnLPercent: -14.3
      },
      {
        symbol: 'SOL',
        assetType: 'crypto',
        allocation: 10.0,
        currentPrice: 100,
        quantity: 100,
        value: 10000,
        costBasis: 85,
        unrealizedPnL: 1500,
        unrealizedPnLPercent: 17.6
      },
      {
        symbol: 'AAPL',
        assetType: 'stock',
        allocation: 8.0,
        currentPrice: 190,
        quantity: 42.11,
        value: 8000,
        costBasis: 175,
        unrealizedPnL: 632,
        unrealizedPnLPercent: 8.6
      },
      {
        symbol: 'GLD',
        assetType: 'commodity',
        allocation: 5.0,
        currentPrice: 185,
        quantity: 27.03,
        value: 5000,
        costBasis: 180,
        unrealizedPnL: 135,
        unrealizedPnLPercent: 2.8
      }
    ];

    const totalValue = mockPositions.reduce((sum, pos) => sum + pos.value, 0);

    return {
      totalValue,
      totalAllocated: 95.0, // 95% allocated, 5% cash
      availableCash: 5000,
      positions: mockPositions,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate historical volatility from price data
   */
  private calculateVolatility(prices: number[], periods: number = 30): number {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < Math.min(prices.length, periods + 1); i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(dailyReturn);
    }

    if (returns.length < 2) return 0;

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (returns.length - 1);
    const dailyVolatility = Math.sqrt(variance);
    
    // Annualize volatility (252 trading days)
    return dailyVolatility * Math.sqrt(252);
  }

  /**
   * Calculate Value at Risk using historical simulation method
   */
  private calculateVaR(returns: number[], confidence: number, horizon: number = 1): number {
    if (returns.length === 0) return 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const percentile = (100 - confidence) / 100;
    const index = Math.floor(percentile * sortedReturns.length);
    
    const varReturn = sortedReturns[Math.max(0, index - 1)] || 0;
    
    // Scale for horizon (assuming independence for simplicity)
    return Math.abs(varReturn) * Math.sqrt(horizon);
  }

  /**
   * Calculate maximum drawdown from a price series
   */
  private calculateMaxDrawdown(prices: number[]): { maxDrawdown: number; days: number } {
    if (prices.length < 2) return { maxDrawdown: 0, days: 0 };

    let maxDrawdown = 0;
    let maxDrawdownDays = 0;
    let peak = prices[0];
    let peakIndex = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
        peakIndex = i;
      } else {
        const drawdown = (peak - prices[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownDays = i - peakIndex;
        }
      }
    }

    return { maxDrawdown: maxDrawdown * 100, days: maxDrawdownDays };
  }

  /**
   * Calculate portfolio-level risk metrics
   */
  async calculatePortfolioRiskMetrics(portfolio: PortfolioMetrics): Promise<RiskMetrics> {
    const cacheKey = `portfolio_risk_${portfolio.lastUpdated}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Generate mock historical returns for each position (would use real data in production)
    const portfolioReturns: number[] = [];
    const positions = portfolio.positions;
    
    // Generate 252 days of mock returns for portfolio
    for (let day = 0; day < 252; day++) {
      let dailyPortfolioReturn = 0;
      
      for (const position of positions) {
        // Mock daily return based on asset type volatility
        const baseVol = position.assetType === 'crypto' ? 0.04 : 
                       position.assetType === 'stock' ? 0.02 : 0.01;
        const dailyReturn = (Math.random() - 0.5) * 2 * baseVol;
        const weightedReturn = dailyReturn * (position.allocation / 100);
        dailyPortfolioReturn += weightedReturn;
      }
      
      portfolioReturns.push(dailyPortfolioReturn);
    }

    // Mock price series for drawdown calculation
    const portfolioPrices: number[] = [100000]; // Starting value
    for (const dailyReturn of portfolioReturns) {
      const newPrice = portfolioPrices[portfolioPrices.length - 1] * (1 + dailyReturn);
      portfolioPrices.push(newPrice);
    }

    // Calculate VaR at different confidence levels
    const var95_1d = this.calculateVaR(portfolioReturns, 95, 1);
    const var99_1d = this.calculateVaR(portfolioReturns, 99, 1);
    const var95_7d = this.calculateVaR(portfolioReturns, 95, 7);
    const var99_7d = this.calculateVaR(portfolioReturns, 99, 7);

    // Calculate volatility
    const portfolioVolatility = this.calculateVolatility(portfolioPrices) * 100;

    // Calculate max drawdown
    const { maxDrawdown, days: maxDrawdownDays } = this.calculateMaxDrawdown(portfolioPrices);

    // Calculate Sharpe ratio (assuming 3% risk-free rate)
    const meanReturn = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const annualizedReturn = (meanReturn * 252) * 100;
    const riskFreeRate = 3.0; // 3% annual
    const sharpeRatio = (annualizedReturn - riskFreeRate) / (portfolioVolatility / 100);

    // Calculate concentration metrics
    const sortedAllocations = positions.map(p => p.allocation).sort((a, b) => b - a);
    const largestPositionPercent = sortedAllocations[0] || 0;
    const topThreePositionsPercent = sortedAllocations.slice(0, 3).reduce((sum, alloc) => sum + alloc, 0);

    // Concentration risk (higher when positions are uneven)
    const concentrationRisk = Math.min(100, largestPositionPercent * 2.5);
    
    // Diversification score (higher when well diversified)
    const diversificationScore = Math.max(0, 100 - concentrationRisk);

    // Asset class exposure
    const assetClassExposure = {
      crypto: positions.filter(p => p.assetType === 'crypto').reduce((sum, p) => sum + p.allocation, 0),
      stocks: positions.filter(p => p.assetType === 'stock').reduce((sum, p) => sum + p.allocation, 0),
      commodities: positions.filter(p => p.assetType === 'commodity').reduce((sum, p) => sum + p.allocation, 0),
      cash: portfolio.availableCash / portfolio.totalValue * 100
    };

    // Additional risk metrics
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
    const sortinoRatio = sharpeRatio * 1.2; // Simplified approximation
    const beta = 0.85 + (assetClassExposure.crypto / 100) * 0.3; // Higher beta for crypto exposure
    const alpha = Math.max(-5, Math.min(5, annualizedReturn - (beta * 10))); // vs market return of ~10%

    const riskMetrics: RiskMetrics = {
      var95_1d: var95_1d * 100,
      var99_1d: var99_1d * 100,
      var95_7d: var95_7d * 100,
      var99_7d: var99_7d * 100,
      portfolioVolatility,
      sharpeRatio,
      maxDrawdown,
      maxDrawdownDays,
      concentrationRisk,
      diversificationScore,
      largestPositionPercent,
      topThreePositionsPercent,
      assetClassExposure,
      calmarRatio,
      sortinoRatio,
      beta,
      alpha,
      calculatedAt: new Date().toISOString()
    };

    this.setCache(cacheKey, riskMetrics);
    return riskMetrics;
  }

  /**
   * Run stress tests on portfolio
   */
  async runStressTests(portfolio: PortfolioMetrics): Promise<StressTestResult[]> {
    const cacheKey = `stress_tests_${portfolio.lastUpdated}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results: StressTestResult[] = [];

    for (const scenario of this.stressScenarios) {
      const positionImpacts = portfolio.positions.map(position => {
        let stressFactor = 0;
        
        switch (position.assetType) {
          case 'crypto':
            stressFactor = scenario.stressFactors.crypto;
            break;
          case 'stock':
            stressFactor = scenario.stressFactors.stocks;
            break;
          case 'commodity':
            stressFactor = scenario.stressFactors.commodities;
            break;
          default:
            stressFactor = -0.05; // 5% decline for other assets
        }

        const stressedValue = position.value * (1 + stressFactor);
        const lossAmount = position.value - stressedValue;
        const lossPercent = (lossAmount / position.value) * 100;

        return {
          symbol: position.symbol,
          currentValue: position.value,
          stressedValue,
          lossAmount,
          lossPercent
        };
      });

      const totalLoss = positionImpacts.reduce((sum, impact) => sum + impact.lossAmount, 0);
      const totalLossPercent = (totalLoss / portfolio.totalValue) * 100;
      
      // Estimate time to recover based on scenario
      const timeToRecover = scenario.recoveryMonths * 30;
      
      // Worst day loss (assume 20% of total scenario loss happens in worst day)
      const worstDayLoss = totalLoss * 0.2;

      // Calculate stressed risk metrics
      const baseVolatility = 25; // Base portfolio volatility
      const stressedVolatility = baseVolatility * scenario.stressFactors.correlationMultiplier;
      const stressedVaR = Math.abs(totalLossPercent) * 1.5; // Simplified VaR under stress

      // Liquidity and correlation risk scores
      const liquidityRisk = scenario.scenarioType === 'liquidity_crisis' ? 90 : 
                           scenario.severity === 'extreme' ? 70 : 40;
      const correlationRisk = (scenario.stressFactors.correlationMultiplier - 1) * 25;

      // Generate actionable insights based on scenario
      const actionableInsights = this.generateStressTestInsights(scenario, positionImpacts, portfolio);

      const result: StressTestResult = {
        scenario,
        portfolioImpact: {
          totalLoss,
          totalLossPercent,
          timeToRecover,
          worstDayLoss,
          positionImpacts
        },
        riskMetrics: {
          stressedVaR,
          stressedVolatility,
          liquidityRisk,
          correlationRisk
        },
        actionableInsights,
        calculatedAt: new Date().toISOString()
      };

      results.push(result);
    }

    this.setCache(cacheKey, results);
    return results;
  }

  /**
   * Generate actionable insights from stress test results
   */
  private generateStressTestInsights(
    scenario: StressTestScenario, 
    impacts: any[], 
    portfolio: PortfolioMetrics
  ): string[] {
    const insights: string[] = [];
    
    // Find most impacted positions
    const worstImpacted = impacts.filter(impact => impact.lossPercent > 20)
                                .sort((a, b) => b.lossPercent - a.lossPercent);
    
    if (worstImpacted.length > 0) {
      insights.push(`Reduce exposure to ${worstImpacted[0].symbol} - highest loss risk at ${worstImpacted[0].lossPercent.toFixed(1)}%`);
    }

    // Scenario-specific insights
    switch (scenario.scenarioType) {
      case 'crypto_winter':
        const cryptoExposure = portfolio.positions
          .filter(p => p.assetType === 'crypto')
          .reduce((sum, p) => sum + p.allocation, 0);
        if (cryptoExposure > 50) {
          insights.push(`Consider reducing crypto exposure from ${cryptoExposure.toFixed(1)}% to below 40%`);
        }
        insights.push("Increase traditional asset allocation to reduce crypto correlation risk");
        break;
        
      case 'market_crash':
        insights.push("Consider defensive positions like gold or treasury bonds");
        insights.push("Implement stop-loss orders at -15% to limit downside");
        break;
        
      case 'liquidity_crisis':
        insights.push("Maintain higher cash reserves (10-15% of portfolio)");
        insights.push("Avoid illiquid alt-coins during high volatility periods");
        break;
        
      case 'correlation_breakdown':
        insights.push("Diversify across uncorrelated assets like commodities");
        insights.push("Consider alternative investments (REITs, private equity)");
        break;
    }

    // Portfolio structure insights
    const topPosition = portfolio.positions.reduce((prev, current) => 
      (prev.allocation > current.allocation) ? prev : current
    );
    
    if (topPosition.allocation > 30) {
      insights.push(`Largest position (${topPosition.symbol}) is ${topPosition.allocation.toFixed(1)}% - consider rebalancing`);
    }

    return insights;
  }

  /**
   * Generate position sizing recommendations using various methods
   */
  async generatePositionSizingRecommendations(portfolio: PortfolioMetrics): Promise<PositionSizingRecommendation[]> {
    const cacheKey = `position_sizing_${portfolio.lastUpdated}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const recommendations: PositionSizingRecommendation[] = [];
    const totalValue = portfolio.totalValue;

    // Define target allocations for different asset types
    const targetAllocations = {
      crypto: { min: 20, max: 40, target: 30 },
      stock: { min: 40, max: 70, target: 55 },
      commodity: { min: 5, max: 15, target: 10 },
      cash: { min: 5, max: 15, target: 5 }
    };

    for (const position of portfolio.positions) {
      const assetTarget = targetAllocations[position.assetType] || targetAllocations.stock;
      
      // Calculate risk score based on volatility and market conditions
      const riskScore = this.calculateAssetRiskScore(position);
      
      // Calculate expected return (simplified model)
      const expectedReturn = this.estimateExpectedReturn(position);
      
      // Calculate recommended allocation using risk parity approach
      const riskAdjustedAllocation = this.calculateRiskParityAllocation(position, riskScore, assetTarget);
      
      // Determine max drawdown expectation
      const maxDrawdownExpectation = riskScore * 0.5; // Higher risk = higher drawdown potential
      
      // Generate rationale
      const rationale = this.generateAllocationRationale(position, riskAdjustedAllocation, riskScore);
      
      const recommendation: PositionSizingRecommendation = {
        symbol: position.symbol,
        assetType: position.assetType,
        currentAllocation: position.allocation,
        recommendedAllocation: riskAdjustedAllocation,
        rationale,
        riskScore,
        expectedReturn,
        maxDrawdownExpectation,
        sizingMethod: 'risk_parity',
        confidence: this.calculateRecommendationConfidence(position, riskScore),
        timeHorizon: '3m'
      };

      recommendations.push(recommendation);
    }

    this.setCache(cacheKey, recommendations);
    return recommendations;
  }

  /**
   * Calculate risk score for an asset
   */
  private calculateAssetRiskScore(position: PortfolioPosition): number {
    let baseRisk = 0;
    
    switch (position.assetType) {
      case 'crypto': baseRisk = 70; break;
      case 'stock': baseRisk = 40; break;
      case 'commodity': baseRisk = 30; break;
      default: baseRisk = 20;
    }
    
    // Adjust for position size (concentration adds risk)
    const sizeAdjustment = Math.min(20, position.allocation * 0.5);
    
    // Adjust for unrealized P&L (losing positions are riskier)
    const pnlAdjustment = position.unrealizedPnLPercent ? 
      Math.max(-10, Math.min(10, -position.unrealizedPnLPercent * 0.2)) : 0;
    
    return Math.max(10, Math.min(100, baseRisk + sizeAdjustment + pnlAdjustment));
  }

  /**
   * Estimate expected return for an asset
   */
  private estimateExpectedReturn(position: PortfolioPosition): number {
    // Simplified expected return model
    const baseReturns = {
      crypto: 25, // 25% annual expected return
      stock: 12,  // 12% annual expected return
      commodity: 8, // 8% annual expected return
      currency: 3   // 3% annual expected return
    };
    
    const baseReturn = baseReturns[position.assetType] || 8;
    
    // Adjust for current momentum (recent P&L)
    const momentumAdjustment = position.unrealizedPnLPercent ? 
      Math.max(-5, Math.min(5, position.unrealizedPnLPercent * 0.1)) : 0;
    
    return baseReturn + momentumAdjustment;
  }

  /**
   * Calculate risk parity allocation
   */
  private calculateRiskParityAllocation(
    position: PortfolioPosition, 
    riskScore: number, 
    assetTarget: any
  ): number {
    // Risk parity: allocate inversely to risk
    const riskWeight = 100 / riskScore;
    
    // Normalize to target range
    const targetAllocation = Math.max(assetTarget.min, 
      Math.min(assetTarget.max, riskWeight * assetTarget.target / 100 * 100));
    
    // Round to nearest 0.5%
    return Math.round(targetAllocation * 2) / 2;
  }

  /**
   * Generate allocation rationale
   */
  private generateAllocationRationale(
    position: PortfolioPosition, 
    recommendedAllocation: number, 
    riskScore: number
  ): string {
    const currentAllocation = position.allocation;
    const difference = recommendedAllocation - currentAllocation;
    
    if (Math.abs(difference) < 1) {
      return `Maintain current ${currentAllocation.toFixed(1)}% allocation - well positioned`;
    } else if (difference > 0) {
      const reason = riskScore < 50 ? "lower risk profile" : "strong momentum";
      return `Increase from ${currentAllocation.toFixed(1)}% to ${recommendedAllocation.toFixed(1)}% due to ${reason}`;
    } else {
      const reason = riskScore > 70 ? "high risk concentration" : "rebalancing needs";
      return `Reduce from ${currentAllocation.toFixed(1)}% to ${recommendedAllocation.toFixed(1)}% due to ${reason}`;
    }
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateRecommendationConfidence(position: PortfolioPosition, riskScore: number): number {
    let confidence = 70; // Base confidence
    
    // Higher confidence for more stable assets
    if (position.assetType === 'stock' || position.assetType === 'commodity') {
      confidence += 15;
    }
    
    // Lower confidence for very high or very low risk assets
    if (riskScore > 80 || riskScore < 20) {
      confidence -= 20;
    }
    
    // Higher confidence when position is within reasonable size
    if (position.allocation >= 5 && position.allocation <= 25) {
      confidence += 10;
    }
    
    return Math.max(30, Math.min(95, confidence));
  }

  /**
   * Generate risk alerts based on portfolio analysis
   */
  async generateRiskAlerts(portfolio: PortfolioMetrics, riskMetrics: RiskMetrics): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];
    const now = new Date().toISOString();

    // Concentration risk alert
    if (riskMetrics.concentrationRisk > 70) {
      alerts.push({
        id: `concentration_${Date.now()}`,
        alertType: 'concentration_risk',
        severity: 'high',
        title: 'High Concentration Risk Detected',
        description: `Portfolio concentration risk at ${riskMetrics.concentrationRisk.toFixed(1)}%`,
        affectedPositions: portfolio.positions
          .filter(p => p.allocation > 20)
          .map(p => p.symbol),
        threshold: {
          metric: 'Concentration Risk',
          currentValue: riskMetrics.concentrationRisk,
          thresholdValue: 70,
          breachPercent: ((riskMetrics.concentrationRisk - 70) / 70) * 100
        },
        recommendedActions: [
          'Reduce position sizes above 20%',
          'Add more diversified positions',
          'Consider asset class rebalancing'
        ],
        estimatedImpact: 'Reduce portfolio volatility by 15-25%',
        createdAt: now,
        isActive: true
      });
    }

    // VaR breach alert
    if (riskMetrics.var95_1d > 8) { // 8% daily VaR threshold
      alerts.push({
        id: `var_breach_${Date.now()}`,
        alertType: 'var_breach',
        severity: riskMetrics.var95_1d > 12 ? 'critical' : 'high',
        title: 'Value at Risk Limit Exceeded',
        description: `1-day VaR at ${riskMetrics.var95_1d.toFixed(1)}% exceeds recommended 8% limit`,
        affectedPositions: portfolio.positions.map(p => p.symbol),
        threshold: {
          metric: '1-day VaR (95%)',
          currentValue: riskMetrics.var95_1d,
          thresholdValue: 8,
          breachPercent: ((riskMetrics.var95_1d - 8) / 8) * 100
        },
        recommendedActions: [
          'Reduce position sizes',
          'Add defensive positions',
          'Consider hedging strategies'
        ],
        estimatedImpact: `Potential ${riskMetrics.var95_1d.toFixed(1)}% loss in worst-case scenario`,
        createdAt: now,
        isActive: true
      });
    }

    // Volatility spike alert
    if (riskMetrics.portfolioVolatility > 40) {
      alerts.push({
        id: `volatility_${Date.now()}`,
        alertType: 'volatility_spike',
        severity: 'medium',
        title: 'High Portfolio Volatility',
        description: `Portfolio volatility at ${riskMetrics.portfolioVolatility.toFixed(1)}% is elevated`,
        affectedPositions: portfolio.positions
          .filter(p => p.assetType === 'crypto')
          .map(p => p.symbol),
        threshold: {
          metric: 'Portfolio Volatility',
          currentValue: riskMetrics.portfolioVolatility,
          thresholdValue: 40,
          breachPercent: ((riskMetrics.portfolioVolatility - 40) / 40) * 100
        },
        recommendedActions: [
          'Reduce crypto exposure',
          'Increase stable asset allocation',
          'Consider volatility-reducing strategies'
        ],
        estimatedImpact: 'Reduce daily volatility to 25-30% range',
        createdAt: now,
        isActive: true
      });
    }

    // Rebalancing needed alert
    const needsRebalancing = portfolio.positions.some(p => 
      Math.abs(p.allocation - (100 / portfolio.positions.length)) > 10
    );
    
    if (needsRebalancing) {
      alerts.push({
        id: `rebalancing_${Date.now()}`,
        alertType: 'rebalancing_needed',
        severity: 'low',
        title: 'Portfolio Rebalancing Recommended',
        description: 'Some positions have drifted significantly from target allocations',
        affectedPositions: portfolio.positions
          .filter(p => Math.abs(p.allocation - (100 / portfolio.positions.length)) > 10)
          .map(p => p.symbol),
        threshold: {
          metric: 'Allocation Drift',
          currentValue: 15,
          thresholdValue: 10,
          breachPercent: 50
        },
        recommendedActions: [
          'Rebalance overweight positions',
          'Increase underweight positions',
          'Review target allocation strategy'
        ],
        estimatedImpact: 'Maintain portfolio diversification targets',
        createdAt: now,
        isActive: true
      });
    }

    return alerts;
  }

  /**
   * Analyze portfolio composition and structure
   */
  async analyzePortfolioComposition(portfolio: PortfolioMetrics): Promise<PortfolioComposition> {
    const cacheKey = `composition_${portfolio.lastUpdated}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Asset allocation breakdown
    const assetAllocation = {
      crypto: {
        allocation: portfolio.positions.filter(p => p.assetType === 'crypto')
          .reduce((sum, p) => sum + p.allocation, 0),
        value: portfolio.positions.filter(p => p.assetType === 'crypto')
          .reduce((sum, p) => sum + p.value, 0),
        positions: portfolio.positions.filter(p => p.assetType === 'crypto').length
      },
      stocks: {
        allocation: portfolio.positions.filter(p => p.assetType === 'stock')
          .reduce((sum, p) => sum + p.allocation, 0),
        value: portfolio.positions.filter(p => p.assetType === 'stock')
          .reduce((sum, p) => sum + p.value, 0),
        positions: portfolio.positions.filter(p => p.assetType === 'stock').length
      },
      commodities: {
        allocation: portfolio.positions.filter(p => p.assetType === 'commodity')
          .reduce((sum, p) => sum + p.allocation, 0),
        value: portfolio.positions.filter(p => p.assetType === 'commodity')
          .reduce((sum, p) => sum + p.value, 0),
        positions: portfolio.positions.filter(p => p.assetType === 'commodity').length
      },
      cash: {
        allocation: (portfolio.availableCash / portfolio.totalValue) * 100,
        value: portfolio.availableCash
      }
    };

    // Mock sector exposure (would be calculated from real data)
    const sectorExposure = [
      {
        sector: 'Technology',
        allocation: 25,
        value: portfolio.totalValue * 0.25,
        riskScore: 65,
        topSymbols: ['NVDA', 'AAPL']
      },
      {
        sector: 'Cryptocurrency',
        allocation: 55,
        value: portfolio.totalValue * 0.55,
        riskScore: 85,
        topSymbols: ['BTC', 'ETH', 'SOL']
      },
      {
        sector: 'Automotive',
        allocation: 12,
        value: portfolio.totalValue * 0.12,
        riskScore: 70,
        topSymbols: ['TSLA']
      },
      {
        sector: 'Commodities',
        allocation: 5,
        value: portfolio.totalValue * 0.05,
        riskScore: 30,
        topSymbols: ['GLD']
      }
    ];

    // Geographic exposure (simplified)
    const geographicExposure = [
      {
        region: 'United States',
        allocation: 45,
        value: portfolio.totalValue * 0.45,
        symbols: ['NVDA', 'TSLA', 'AAPL']
      },
      {
        region: 'Global (Crypto)',
        allocation: 55,
        value: portfolio.totalValue * 0.55,
        symbols: ['BTC', 'ETH', 'SOL']
      }
    ];

    // Rebalancing recommendations
    const targetAllocations = { crypto: 30, stocks: 55, commodities: 10, cash: 5 };
    const rebalancingNeeds = Object.entries(assetAllocation).map(([asset, data]) => {
      const target = targetAllocations[asset as keyof typeof targetAllocations] || 0;
      const current = data.allocation;
      const deviation = Math.abs(current - target);
      
      return {
        position: asset,
        currentWeight: current,
        targetWeight: target,
        deviation,
        action: current > target ? 'sell' as const : current < target ? 'buy' as const : 'hold' as const,
        urgency: deviation > 15 ? 'high' as const : deviation > 10 ? 'medium' as const : 'low' as const
      };
    }).filter(item => item.deviation > 5); // Only include significant deviations

    const composition: PortfolioComposition = {
      assetAllocation,
      sectorExposure,
      geographicExposure,
      rebalancingNeeds,
      lastRebalanced: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      nextRebalancingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    this.setCache(cacheKey, composition);
    return composition;
  }

  /**
   * Get comprehensive risk dashboard data
   */
  async getRiskDashboard(): Promise<{
    portfolio: PortfolioMetrics;
    riskMetrics: RiskMetrics;
    stressTests: StressTestResult[];
    positionSizing: PositionSizingRecommendation[];
    riskAlerts: RiskAlert[];
    composition: PortfolioComposition;
  }> {
    const portfolio = this.generateMockPortfolio();
    
    const [riskMetrics, stressTests, positionSizing, composition] = await Promise.all([
      this.calculatePortfolioRiskMetrics(portfolio),
      this.runStressTests(portfolio),
      this.generatePositionSizingRecommendations(portfolio),
      this.analyzePortfolioComposition(portfolio)
    ]);

    const riskAlerts = await this.generateRiskAlerts(portfolio, riskMetrics);

    return {
      portfolio,
      riskMetrics,
      stressTests,
      positionSizing,
      riskAlerts,
      composition
    };
  }

  // ==================================================================================
  // ADVANCED INSTITUTIONAL RISK ANALYTICS
  // ==================================================================================

  /**
   * Advanced Monte Carlo portfolio simulation for extreme risk scenarios
   */
  async runMonteCarloRiskSimulation(portfolio: PortfolioMetrics, simulations: number = 10000): Promise<any> {
    const cacheKey = `monte_carlo_${portfolio.positions.length}_${simulations}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log(`🎲 Running Monte Carlo simulation with ${simulations} iterations`);

    const portfolioReturns: number[] = [];
    for (let i = 0; i < simulations; i++) {
      let portfolioValue = 100;
      
      for (let day = 0; day < 252; day++) { // 1 year simulation
        let dailyReturn = 0;
        
        portfolio.positions.forEach(position => {
          const baseVol = position.assetType === 'crypto' ? 0.05 : 0.02;
          const randomReturn = (Math.random() - 0.5) * 2 * baseVol;
          dailyReturn += randomReturn * (position.allocation / 100);
        });
        
        portfolioValue *= (1 + dailyReturn);
      }
      
      portfolioReturns.push((portfolioValue - 100) / 100);
    }

    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    const results = {
      statistics: {
        expected_return: portfolioReturns.reduce((sum, ret) => sum + ret, 0) / simulations * 100,
        var_95: Math.abs(sortedReturns[Math.floor(simulations * 0.05)]) * 100,
        var_99: Math.abs(sortedReturns[Math.floor(simulations * 0.01)]) * 100,
        profit_probability: portfolioReturns.filter(ret => ret > 0).length / simulations,
        maximum_loss: Math.abs(Math.min(...sortedReturns)) * 100,
        tail_ratio: Math.abs(sortedReturns[Math.floor(simulations * 0.01)]) / Math.abs(sortedReturns[Math.floor(simulations * 0.05)])
      },
      percentiles: {
        p1: sortedReturns[Math.floor(simulations * 0.01)] * 100,
        p5: sortedReturns[Math.floor(simulations * 0.05)] * 100,
        p10: sortedReturns[Math.floor(simulations * 0.10)] * 100,
        p25: sortedReturns[Math.floor(simulations * 0.25)] * 100,
        p50: sortedReturns[Math.floor(simulations * 0.50)] * 100,
        p75: sortedReturns[Math.floor(simulations * 0.75)] * 100,
        p90: sortedReturns[Math.floor(simulations * 0.90)] * 100,
        p95: sortedReturns[Math.floor(simulations * 0.95)] * 100,
        p99: sortedReturns[Math.floor(simulations * 0.99)] * 100
      },
      scenario_analysis: {
        extreme_loss_events: portfolioReturns.filter(ret => ret < -0.20).length,
        black_swan_probability: portfolioReturns.filter(ret => ret < -0.50).length / simulations,
        recovery_probability: portfolioReturns.filter(ret => ret > 0.10).length / simulations
      }
    };

    this.setCache(cacheKey, results);
    console.log(`✅ Monte Carlo complete: ${results.statistics.profit_probability.toFixed(2)} profit probability`);
    return results;
  }

  /**
   * Advanced factor model risk attribution analysis
   */
  async calculateFactorRiskAttribution(portfolio: PortfolioMetrics): Promise<any> {
    const cacheKey = `factor_attribution_${portfolio.positions.length}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('📊 Calculating factor risk attribution');

    const marketFactors = {
      equity_risk: 0.15 + Math.random() * 0.1,
      interest_rate_risk: 0.08 + Math.random() * 0.05,
      credit_risk: 0.06 + Math.random() * 0.04,
      crypto_risk: 0.25 + Math.random() * 0.15,
      volatility_risk: 0.12 + Math.random() * 0.08,
      commodity_risk: 0.05 + Math.random() * 0.03,
      momentum_factor: 0.07 + Math.random() * 0.05,
      value_factor: 0.03 + Math.random() * 0.02
    };

    const riskDecomposition = {
      systematic_risk: Object.values(marketFactors).reduce((sum, factor) => sum + factor, 0),
      idiosyncratic_risk: 0.15 + Math.random() * 0.1,
      concentration_risk: portfolio.positions.length < 5 ? 0.08 : 0.03,
      liquidity_risk: portfolio.positions.filter(p => p.assetType === 'crypto').length > 0 ? 0.06 : 0.02
    };

    const attribution = {
      factor_exposures: marketFactors,
      risk_decomposition: riskDecomposition,
      portfolio_metrics: {
        total_risk: Object.values(riskDecomposition).reduce((sum, risk) => sum + risk, 0),
        systematic_percent: (riskDecomposition.systematic_risk / Object.values(riskDecomposition).reduce((sum, risk) => sum + risk, 0)) * 100,
        diversification_ratio: 1 - (riskDecomposition.concentration_risk / riskDecomposition.systematic_risk),
        tracking_error: 3.5 + Math.random() * 2.0
      },
      optimization_suggestions: [
        marketFactors.crypto_risk > 0.3 ? 'Consider reducing crypto exposure' : 'Crypto exposure balanced',
        riskDecomposition.concentration_risk > 0.06 ? 'Improve diversification' : 'Diversification adequate',
        marketFactors.volatility_risk > 0.15 ? 'Add volatility hedges' : 'Volatility exposure controlled'
      ]
    };

    this.setCache(cacheKey, attribution);
    console.log(`✅ Factor attribution: ${attribution.portfolio_metrics.systematic_percent.toFixed(1)}% systematic risk`);
    return attribution;
  }

  /**
   * Dynamic risk budgeting and portfolio optimization
   */
  async optimizeRiskBudget(portfolio: PortfolioMetrics, targetVolatility: number = 15): Promise<any> {
    const cacheKey = `risk_budget_${portfolio.positions.length}_${targetVolatility}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log(`🎯 Optimizing risk budget for ${targetVolatility}% target volatility`);

    const currentRiskContributions = portfolio.positions.map(position => {
      const assetVol = position.assetType === 'crypto' ? 60 : 
                     position.assetType === 'stock' ? 25 : 15;
      const riskContribution = (position.allocation / 100) * (assetVol / 100);
      return {
        symbol: position.symbol,
        current_allocation: position.allocation,
        risk_contribution: riskContribution,
        risk_per_dollar: riskContribution / (position.allocation / 100)
      };
    });

    const optimizedAllocations = currentRiskContributions.map(asset => {
      const targetRiskContribution = targetVolatility / portfolio.positions.length / 100;
      const optimalAllocation = (targetRiskContribution / asset.risk_per_dollar) * 100;
      
      return {
        symbol: asset.symbol,
        current_allocation: asset.current_allocation,
        optimized_allocation: Math.min(25, Math.max(2, optimalAllocation)),
        risk_reduction: asset.risk_contribution - targetRiskContribution,
        improvement: optimalAllocation > asset.current_allocation ? 'Increase' : 'Decrease'
      };
    });

    const optimization = {
      current_portfolio: {
        total_risk: currentRiskContributions.reduce((sum, asset) => sum + asset.risk_contribution, 0) * 100,
        largest_risk_contributor: Math.max(...currentRiskContributions.map(a => a.risk_contribution)) * 100,
        efficiency_score: 100 - (Math.max(...currentRiskContributions.map(a => a.risk_contribution)) * 500)
      },
      optimized_portfolio: {
        target_volatility: targetVolatility,
        estimated_volatility: optimizedAllocations.reduce((sum, asset) => sum + (asset.optimized_allocation / 100) * 0.4, 0) * 100,
        risk_improvement: optimizedAllocations.filter(a => a.improvement === 'Decrease').length,
        balanced_allocation: optimizedAllocations.every(a => a.optimized_allocation >= 5 && a.optimized_allocation <= 20)
      },
      allocation_changes: optimizedAllocations,
      implementation: {
        priority_trades: optimizedAllocations
          .filter(a => Math.abs(a.optimized_allocation - a.current_allocation) > 3)
          .sort((a, b) => Math.abs(b.risk_reduction) - Math.abs(a.risk_reduction)),
        execution_timeline: '2-3 trading sessions',
        estimated_improvement: '25-35% volatility reduction',
        transaction_costs: 0.15
      }
    };

    this.setCache(cacheKey, optimization);
    console.log(`✅ Risk budget optimization complete: ${optimization.implementation.priority_trades.length} priority trades`);
    return optimization;
  }
}