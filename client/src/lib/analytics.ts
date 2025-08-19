// Advanced analytics and monitoring for Web3 transactions and portfolio
export interface TransactionAnalytics {
  txHash: string;
  type: 'SWAP' | 'STAKE' | 'TRANSFER' | 'MINT' | 'BRIDGE' | 'VOTE';
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  gasUsed: string;
  gasPrice: string;
  gasCost: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  tokenSymbol?: string;
  usdValue?: string;
  savings?: string; // How much was saved vs average gas price
}

export interface PerformanceMetrics {
  totalTransactions: number;
  successRate: number;
  averageGasCost: string;
  totalGasSaved: string;
  totalValueTransacted: string;
  mostUsedNetworks: Array<{ chainId: number; count: number; volume: string }>;
  transactionTypes: Array<{ type: TransactionAnalytics['type']; count: number; percentage: number }>;
  dailyActivity: Array<{ date: string; transactions: number; volume: string }>;
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessment: number;
}

export interface RiskFactor {
  category: 'CONCENTRATION' | 'VOLATILITY' | 'LIQUIDITY' | 'SMART_CONTRACT' | 'REGULATORY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  impact: number; // 0-100
  mitigation?: string;
}

export interface YieldOpportunity {
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  minDeposit: string;
  lockupPeriod?: string;
  autoCompounding: boolean;
  verified: boolean;
}

export class AnalyticsEngine {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  // Track transaction for analytics
  async trackTransaction(tx: TransactionAnalytics): Promise<void> {
    // In production, send to analytics backend
    console.log('Transaction tracked:', tx);
    
    // Store locally for demo
    const stored = this.getStoredTransactions();
    stored.push(tx);
    this.storeTransactions(stored.slice(-100)); // Keep last 100 transactions
  }

  // Get comprehensive transaction analytics
  async getTransactionAnalytics(address: string, timeframe: '24h' | '7d' | '30d' | '90d' = '30d'): Promise<PerformanceMetrics> {
    const cacheKey = `analytics_${address}_${timeframe}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Simulate analytics calculation
    const transactions = this.getStoredTransactions().filter(tx => 
      tx.fromAddress.toLowerCase() === address.toLowerCase() ||
      tx.toAddress.toLowerCase() === address.toLowerCase()
    );

    const timeframeDays = this.getTimeframeDays(timeframe);
    const cutoffTime = Date.now() - (timeframeDays * 24 * 60 * 60 * 1000);
    const filteredTxs = transactions.filter(tx => tx.timestamp >= cutoffTime);

    const metrics: PerformanceMetrics = {
      totalTransactions: filteredTxs.length,
      successRate: this.calculateSuccessRate(filteredTxs),
      averageGasCost: this.calculateAverageGasCost(filteredTxs),
      totalGasSaved: this.calculateGasSaved(filteredTxs),
      totalValueTransacted: this.calculateTotalValue(filteredTxs),
      mostUsedNetworks: this.analyzeMostUsedNetworks(filteredTxs),
      transactionTypes: this.analyzeTransactionTypes(filteredTxs),
      dailyActivity: this.generateDailyActivity(filteredTxs, timeframeDays),
    };

    this.setCacheWithExpiry(cacheKey, metrics, 5 * 60 * 1000); // 5 minute cache
    return metrics;
  }

  // Assess portfolio risk
  async assessRisk(address: string, holdings: any[]): Promise<RiskAssessment> {
    const cacheKey = `risk_${address}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Concentration risk
    const concentration = this.assessConcentrationRisk(holdings);
    factors.push(concentration);
    totalScore += concentration.impact;

    // Volatility risk
    const volatility = this.assessVolatilityRisk(holdings);
    factors.push(volatility);
    totalScore += volatility.impact;

    // Liquidity risk
    const liquidity = this.assessLiquidityRisk(holdings);
    factors.push(liquidity);
    totalScore += liquidity.impact;

    // Smart contract risk
    const smartContract = this.assessSmartContractRisk(holdings);
    factors.push(smartContract);
    totalScore += smartContract.impact;

    const averageScore = totalScore / factors.length;
    const overallRisk = this.scoreToRiskLevel(averageScore);

    const assessment: RiskAssessment = {
      overallRisk,
      score: averageScore,
      factors,
      recommendations: this.generateRiskRecommendations(factors),
      lastAssessment: Date.now(),
    };

    this.setCacheWithExpiry(cacheKey, assessment, 30 * 60 * 1000); // 30 minute cache
    return assessment;
  }

  // Find yield opportunities
  async findYieldOpportunities(tokenSymbol: string, amount: number): Promise<YieldOpportunity[]> {
    const cacheKey = `yield_${tokenSymbol}_${amount}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Mock yield opportunities - in production, fetch from multiple DeFi protocols
    const opportunities: YieldOpportunity[] = [
      {
        protocol: 'Aave',
        token: tokenSymbol,
        apy: 4.25,
        tvl: '$12.4B',
        riskLevel: 'LOW',
        description: 'Supply to Aave lending pool with stable, proven returns',
        minDeposit: '0.01',
        autoCompounding: false,
        verified: true,
      },
      {
        protocol: 'Compound',
        token: tokenSymbol,
        apy: 3.89,
        tvl: '$8.2B',
        riskLevel: 'LOW',
        description: 'Earn interest by supplying to Compound protocol',
        minDeposit: '0.01',
        autoCompounding: true,
        verified: true,
      },
      {
        protocol: 'Yearn Finance',
        token: tokenSymbol,
        apy: 8.45,
        tvl: '$1.8B',
        riskLevel: 'MEDIUM',
        description: 'Automated yield farming strategy with auto-compounding',
        minDeposit: '0.1',
        autoCompounding: true,
        verified: true,
      },
      {
        protocol: 'Curve Finance',
        token: `${tokenSymbol}-USDC`,
        apy: 12.67,
        tvl: '$245M',
        riskLevel: 'MEDIUM',
        description: 'Liquidity provision in stable swap pool with CRV rewards',
        minDeposit: '100',
        lockupPeriod: '0 days',
        autoCompounding: false,
        verified: true,
      },
      {
        protocol: 'Convex Finance',
        token: `${tokenSymbol}-USDC`,
        apy: 15.23,
        tvl: '$89M',
        riskLevel: 'HIGH',
        description: 'Boosted Curve rewards with CVX token incentives',
        minDeposit: '100',
        lockupPeriod: '16 weeks',
        autoCompounding: true,
        verified: true,
      },
    ];

    // Filter based on amount (mock filtering)
    const filtered = opportunities.filter(opp => 
      parseFloat(opp.minDeposit) <= amount
    ).sort((a, b) => b.apy - a.apy);

    this.setCacheWithExpiry(cacheKey, filtered, 15 * 60 * 1000); // 15 minute cache
    return filtered;
  }

  // Generate performance report
  async generatePerformanceReport(address: string): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    charts: any[];
  }> {
    const analytics = await this.getTransactionAnalytics(address, '30d');
    const holdings = []; // Would fetch actual holdings
    const risk = await this.assessRisk(address, holdings);

    const summary = `Over the past 30 days, you've completed ${analytics.totalTransactions} transactions with a ${(analytics.successRate * 100).toFixed(1)}% success rate. Your average gas cost was $${analytics.averageGasCost}, saving you $${analytics.totalGasSaved} compared to network averages.`;

    const insights = [
      `You're most active on ${analytics.mostUsedNetworks[0]?.chainId === 1 ? 'Ethereum' : 'Layer 2'} networks`,
      `${analytics.transactionTypes[0]?.type.toLowerCase()} operations make up ${analytics.transactionTypes[0]?.percentage.toFixed(1)}% of your activity`,
      `Your portfolio risk score is ${risk.score.toFixed(1)}/100 (${risk.overallRisk.toLowerCase()} risk)`,
      `You could potentially earn ${await this.calculatePotentialYield(address)} more annually through optimized yield strategies`,
    ];

    const recommendations = [
      ...risk.recommendations,
      'Consider using gas optimization tools to reduce transaction costs',
      'Diversify across multiple networks to reduce concentration risk',
      'Set up automated DCA strategies for regular investments',
    ];

    return {
      summary,
      insights,
      recommendations,
      charts: [
        { type: 'line', data: analytics.dailyActivity, title: 'Daily Activity' },
        { type: 'pie', data: analytics.transactionTypes, title: 'Transaction Types' },
        { type: 'bar', data: analytics.mostUsedNetworks, title: 'Network Usage' },
      ],
    };
  }

  // Private helper methods
  private getStoredTransactions(): TransactionAnalytics[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('streamaix_transactions');
    return stored ? JSON.parse(stored) : [];
  }

  private storeTransactions(transactions: TransactionAnalytics[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('streamaix_transactions', JSON.stringify(transactions));
  }

  private calculateSuccessRate(transactions: TransactionAnalytics[]): number {
    if (transactions.length === 0) return 1;
    const successful = transactions.filter(tx => tx.status === 'CONFIRMED').length;
    return successful / transactions.length;
  }

  private calculateAverageGasCost(transactions: TransactionAnalytics[]): string {
    if (transactions.length === 0) return '0.00';
    const total = transactions.reduce((sum, tx) => sum + parseFloat(tx.gasCost), 0);
    return (total / transactions.length).toFixed(2);
  }

  private calculateGasSaved(transactions: TransactionAnalytics[]): string {
    // Mock calculation - would compare against network averages
    return transactions.reduce((sum, tx) => sum + parseFloat(tx.savings || '0'), 0).toFixed(2);
  }

  private calculateTotalValue(transactions: TransactionAnalytics[]): string {
    const total = transactions.reduce((sum, tx) => sum + parseFloat(tx.usdValue || '0'), 0);
    return total.toFixed(2);
  }

  private analyzeMostUsedNetworks(transactions: TransactionAnalytics[]): Array<{ chainId: number; count: number; volume: string }> {
    const networks = new Map<number, { count: number; volume: number }>();
    
    transactions.forEach(tx => {
      const chainId = 1; // Mock - would extract from actual transaction
      const existing = networks.get(chainId) || { count: 0, volume: 0 };
      networks.set(chainId, {
        count: existing.count + 1,
        volume: existing.volume + parseFloat(tx.usdValue || '0'),
      });
    });

    return Array.from(networks.entries())
      .map(([chainId, data]) => ({
        chainId,
        count: data.count,
        volume: data.volume.toFixed(2),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzeTransactionTypes(transactions: TransactionAnalytics[]): Array<{ type: TransactionAnalytics['type']; count: number; percentage: number }> {
    const types = new Map<TransactionAnalytics['type'], number>();
    
    transactions.forEach(tx => {
      types.set(tx.type, (types.get(tx.type) || 0) + 1);
    });

    return Array.from(types.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / transactions.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private generateDailyActivity(transactions: TransactionAnalytics[], days: number): Array<{ date: string; transactions: number; volume: string }> {
    const daily = new Map<string, { transactions: number; volume: number }>();
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      daily.set(dateStr, { transactions: 0, volume: 0 });
    }

    // Fill with actual data
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      const existing = daily.get(date);
      if (existing) {
        existing.transactions++;
        existing.volume += parseFloat(tx.usdValue || '0');
      }
    });

    return Array.from(daily.entries())
      .map(([date, data]) => ({
        date,
        transactions: data.transactions,
        volume: data.volume.toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private assessConcentrationRisk(holdings: any[]): RiskFactor {
    // Mock assessment - would analyze actual holdings concentration
    return {
      category: 'CONCENTRATION',
      severity: 'MEDIUM',
      description: 'Portfolio is concentrated in top 3 assets (78% of total value)',
      impact: 45,
      mitigation: 'Consider diversifying across more assets and protocols',
    };
  }

  private assessVolatilityRisk(holdings: any[]): RiskFactor {
    return {
      category: 'VOLATILITY',
      severity: 'HIGH',
      description: 'High exposure to volatile assets with 90-day volatility > 60%',
      impact: 70,
      mitigation: 'Add stablecoins or lower-volatility assets to reduce overall risk',
    };
  }

  private assessLiquidityRisk(holdings: any[]): RiskFactor {
    return {
      category: 'LIQUIDITY',
      severity: 'LOW',
      description: 'All major holdings have sufficient liquidity for large trades',
      impact: 20,
    };
  }

  private assessSmartContractRisk(holdings: any[]): RiskFactor {
    return {
      category: 'SMART_CONTRACT',
      severity: 'MEDIUM',
      description: 'Some positions in unaudited or newer protocols',
      impact: 35,
      mitigation: 'Stick to well-audited protocols with proven track records',
    };
  }

  private scoreToRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 25) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 75) return 'HIGH';
    return 'CRITICAL';
  }

  private generateRiskRecommendations(factors: RiskFactor[]): string[] {
    return factors
      .filter(f => f.mitigation)
      .map(f => f.mitigation!)
      .slice(0, 5); // Top 5 recommendations
  }

  private async calculatePotentialYield(address: string): Promise<string> {
    // Mock calculation
    return '2,450';
  }

  private getTimeframeDays(timeframe: '24h' | '7d' | '30d' | '90d'): number {
    switch (timeframe) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheWithExpiry(key: string, value: any, ttl: number): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }
}

export const analyticsEngine = new AnalyticsEngine();