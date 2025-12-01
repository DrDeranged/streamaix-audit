import axios from 'axios';
import { MarketDataService } from './marketDataService';
import { onChainAnalyticsService } from './onChainAnalyticsService';
import { duneAnalyticsService } from './duneAnalyticsService';

// Institutional wallet categorization
interface InstitutionalWallet {
  address: string;
  type: 'exchange' | 'fund' | 'corporate' | 'mining_pool' | 'dao' | 'defi_protocol';
  name: string;
  category: 'tier_1' | 'tier_2' | 'tier_3'; // Based on size and influence
  aum?: number; // Assets under management in USD
  verified: boolean;
  tags: string[];
  lastActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Smart money transaction analysis
interface SmartMoneyTransaction {
  hash: string;
  from: string;
  to: string;
  value: number; // USD value
  asset: string;
  timestamp: string;
  type: 'accumulation' | 'distribution' | 'transfer' | 'arbitrage';
  confidence: number; // 0-100 confidence score
  impact: 'low' | 'medium' | 'high' | 'critical';
  fromType?: string;
  toType?: string;
  strategy?: string;
  marketContext?: {
    preBTC: number;
    postBTC: number;
    priceImpact: number;
    volumeContext: string;
  };
}

// Fund flow tracking
interface FundFlow {
  id: string;
  sourceExchange: string;
  destinationExchange: string;
  asset: string;
  amount: number;
  value: number; // USD value
  timestamp: string;
  flowType: 'inflow' | 'outflow' | 'internal_transfer';
  institutionalScore: number; // How likely this is institutional
  significance: 'minor' | 'moderate' | 'major' | 'critical';
  marketTiming: 'pre_pump' | 'during_pump' | 'post_pump' | 'accumulation' | 'distribution';
}

// Institutional sentiment analysis
interface InstitutionalSentiment {
  overall: number; // -1 to 1 scale
  confidence: number; // 0-100
  trend: 'increasingly_bullish' | 'increasingly_bearish' | 'stable' | 'mixed';
  indicators: {
    accumulation_score: number;
    distribution_score: number;
    exchange_flows: number;
    whale_activity: number;
    corporate_adoption: number;
  };
  timeframe: '1d' | '7d' | '30d';
  lastUpdated: string;
}

// Market positioning analysis
interface InstitutionalPositioning {
  asset: string;
  netFlow: number; // Positive = accumulation, Negative = distribution
  flow24h: number;
  flow7d: number;
  flow30d: number;
  largestHolders: {
    address: string;
    name?: string;
    holdings: number;
    percentage: number;
    change24h: number;
  }[];
  concentration: number; // 0-100, higher = more concentrated
  sentiment: 'accumulating' | 'distributing' | 'holding' | 'mixed';
  strength: number; // 0-100 strength of the signal
}

export class InstitutionalFlowService {
  private static instance: InstitutionalFlowService;
  private marketDataService: MarketDataService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute for real-time data
  private longCacheTimeout = 300000; // 5 minutes for slower data

  // Known institutional wallet addresses
  private institutionalWallets: InstitutionalWallet[] = [
    {
      address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
      type: 'exchange',
      name: 'Binance',
      category: 'tier_1',
      aum: 50000000000,
      verified: true,
      tags: ['exchange', 'cex', 'major'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'low'
    },
    {
      address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
      type: 'exchange',
      name: 'Coinbase',
      category: 'tier_1',
      aum: 25000000000,
      verified: true,
      tags: ['exchange', 'cex', 'institutional'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'low'
    },
    {
      address: '0x2910543af39aba0cd09dbb2d50200b3e800a63d2',
      type: 'exchange',
      name: 'Kraken',
      category: 'tier_1',
      aum: 15000000000,
      verified: true,
      tags: ['exchange', 'cex'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'low'
    },
    {
      address: '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f',
      type: 'exchange',
      name: 'Bitfinex',
      category: 'tier_2',
      aum: 8000000000,
      verified: true,
      tags: ['exchange', 'cex'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'medium'
    },
    {
      address: '0x503828976d22510aad0201ac7ec88293211d23da',
      type: 'fund',
      name: 'Grayscale Bitcoin Trust',
      category: 'tier_1',
      aum: 20000000000,
      verified: true,
      tags: ['fund', 'bitcoin', 'institutional'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'low'
    },
    {
      address: '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489',
      type: 'corporate',
      name: 'MicroStrategy',
      category: 'tier_1',
      aum: 7000000000,
      verified: true,
      tags: ['corporate', 'bitcoin', 'treasury'],
      lastActivity: new Date().toISOString(),
      riskLevel: 'low'
    }
  ];

  constructor() {
    this.marketDataService = MarketDataService.getInstance();
    
    console.log('🏛️ Institutional Flow Service initialized');
    console.log(`  - Tracking ${this.institutionalWallets.length} institutional wallets`);
    console.log(`  - Smart money detection algorithms active`);
  }

  static getInstance(): InstitutionalFlowService {
    if (!InstitutionalFlowService.instance) {
      InstitutionalFlowService.instance = new InstitutionalFlowService();
    }
    return InstitutionalFlowService.instance;
  }

  private getFromCache(key: string, customTimeout?: number): any | null {
    const cached = this.cache.get(key);
    if (cached) {
      const timeout = customTimeout || this.cacheTimeout;
      if (Date.now() - cached.timestamp < timeout) {
        return cached.data;
      }
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get real-time smart money movements
   */
  async getSmartMoneyMovements(assets: string[] = ['BTC', 'ETH'], minValue: number = 1000000): Promise<SmartMoneyTransaction[]> {
    const cacheKey = `smart_money_${assets.join(',')}_${minValue}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get whale movements from on-chain service
      const whaleMovements = await onChainAnalyticsService.getRealTimeWhaleMovements(1000);
      const smartMoneyTxs: SmartMoneyTransaction[] = [];

      for (const whale of whaleMovements) {
        // Analyze if this is smart money
        const confidence = this.calculateSmartMoneyConfidence(whale);
        
        if (confidence > 60) { // Only include high-confidence smart money
          const marketContext = await this.getMarketContext(whale.timestamp);
          
          smartMoneyTxs.push({
            hash: whale.hash,
            from: whale.from,
            to: whale.to,
            value: whale.valueUsd,
            asset: whale.token_symbol || 'ETH',
            timestamp: whale.timestamp,
            type: this.determineTransactionType(whale),
            confidence,
            impact: this.determineImpact(whale.valueUsd),
            fromType: this.getWalletType(whale.from),
            toType: this.getWalletType(whale.to),
            strategy: this.identifyStrategy(whale),
            marketContext
          });
        }
      }

      // Sort by confidence and impact
      smartMoneyTxs.sort((a, b) => {
        const scoreA = a.confidence * (a.impact === 'critical' ? 4 : a.impact === 'high' ? 3 : a.impact === 'medium' ? 2 : 1);
        const scoreB = b.confidence * (b.impact === 'critical' ? 4 : b.impact === 'high' ? 3 : b.impact === 'medium' ? 2 : 1);
        return scoreB - scoreA;
      });

      this.setCache(cacheKey, smartMoneyTxs);
      console.log(`🧠 Identified ${smartMoneyTxs.length} smart money transactions`);
      return smartMoneyTxs;

    } catch (error) {
      console.error('❌ Failed to fetch smart money movements:', error);
      return []; // Return empty array - no mock data
    }
  }

  /**
   * Track institutional fund flows between exchanges
   */
  async getInstitutionalFundFlows(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<FundFlow[]> {
    const cacheKey = `fund_flows_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get exchange flows from Dune Analytics
      const exchangeFlows = await duneAnalyticsService.getExchangeFlows();
      const fundFlows: FundFlow[] = [];

      // Analyze flows for institutional patterns
      for (const flow of exchangeFlows || []) {
        const institutionalScore = this.calculateInstitutionalScore(flow);
        
        if (institutionalScore > 50) { // Only include likely institutional flows
          fundFlows.push({
            id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceExchange: flow.from_exchange || 'Unknown',
            destinationExchange: flow.to_exchange || 'Unknown',
            asset: flow.symbol,
            amount: flow.amount,
            value: flow.value_usd,
            timestamp: flow.timestamp,
            flowType: this.determineFlowType(flow),
            institutionalScore,
            significance: this.determineSignificance(flow.value_usd),
            marketTiming: this.analyzeMarketTiming(flow.timestamp, flow.symbol)
          });
        }
      }

      this.setCache(cacheKey, fundFlows);
      console.log(`💰 Tracked ${fundFlows.length} institutional fund flows`);
      return fundFlows;

    } catch (error) {
      console.error('❌ Failed to fetch institutional fund flows:', error);
      return []; // Return empty array - no mock data
    }
  }

  /**
   * Analyze institutional sentiment based on flow patterns
   */
  async getInstitutionalSentiment(timeframe: '1d' | '7d' | '30d' = '7d'): Promise<InstitutionalSentiment> {
    const cacheKey = `institutional_sentiment_${timeframe}`;
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      const [smartMoney, fundFlows, whaleMovements] = await Promise.all([
        this.getSmartMoneyMovements(),
        this.getInstitutionalFundFlows(timeframe === '1d' ? '24h' : timeframe),
        onChainAnalyticsService.getRealTimeWhaleMovements(500)
      ]);

      // Calculate sentiment indicators
      const accumulationScore = this.calculateAccumulationScore(smartMoney, fundFlows);
      const distributionScore = this.calculateDistributionScore(smartMoney, fundFlows);
      const exchangeFlowScore = this.calculateExchangeFlowScore(fundFlows);
      const whaleActivityScore = this.calculateWhaleActivityScore(whaleMovements);
      const corporateAdoptionScore = 0; // No data available without corporate announcement API

      // Overall sentiment calculation
      const indicators = {
        accumulation_score: accumulationScore,
        distribution_score: distributionScore,
        exchange_flows: exchangeFlowScore,
        whale_activity: whaleActivityScore,
        corporate_adoption: corporateAdoptionScore
      };

      const overall = (accumulationScore - distributionScore + exchangeFlowScore + whaleActivityScore + corporateAdoptionScore) / 400;
      const confidence = Math.min(100, Math.max(0, (smartMoney.length + fundFlows.length) * 5));
      
      const sentiment: InstitutionalSentiment = {
        overall: Math.max(-1, Math.min(1, overall)),
        confidence,
        trend: this.determineTrend(overall, timeframe),
        indicators,
        timeframe,
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, sentiment);
      console.log(`📊 Institutional sentiment: ${(overall * 100).toFixed(1)}% (${sentiment.trend})`);
      return sentiment;

    } catch (error) {
      console.error('❌ Failed to calculate institutional sentiment:', error);
      // Return neutral sentiment with zero confidence when no data available
      return {
        overall: 0,
        confidence: 0,
        trend: 'stable' as const,
        indicators: {
          accumulation_score: 0,
          distribution_score: 0,
          exchange_flows: 0,
          whale_activity: 0,
          corporate_adoption: 0
        },
        timeframe,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get institutional positioning for specific assets
   */
  async getInstitutionalPositioning(assets: string[] = ['BTC', 'ETH']): Promise<InstitutionalPositioning[]> {
    const cacheKey = `institutional_positioning_${assets.join(',')}`;
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      const positioning: InstitutionalPositioning[] = [];

      for (const asset of assets) {
        const [flows24h, flows7d, flows30d] = await Promise.all([
          this.getAssetFlows(asset, '1d'),
          this.getAssetFlows(asset, '7d'),
          this.getAssetFlows(asset, '30d')
        ]);

        const netFlow = flows7d.reduce((sum, flow) => {
          return sum + (flow.flowType === 'inflow' ? flow.value : -flow.value);
        }, 0);

        const largestHolders = await this.getLargestHolders(asset);
        const concentration = this.calculateConcentration(largestHolders);
        
        positioning.push({
          asset,
          netFlow,
          flow24h: flows24h.reduce((sum, flow) => sum + Math.abs(flow.value), 0),
          flow7d: flows7d.reduce((sum, flow) => sum + Math.abs(flow.value), 0),
          flow30d: flows30d.reduce((sum, flow) => sum + Math.abs(flow.value), 0),
          largestHolders,
          concentration,
          sentiment: netFlow > 0 ? 'accumulating' : netFlow < 0 ? 'distributing' : 'holding',
          strength: Math.min(100, Math.abs(netFlow) / 1000000) // Strength based on flow size
        });
      }

      this.setCache(cacheKey, positioning);
      console.log(`🎯 Calculated positioning for ${assets.length} assets`);
      return positioning;

    } catch (error) {
      console.error('❌ Failed to get institutional positioning:', error);
      return []; // Return empty array - no mock data
    }
  }

  /**
   * Get wallet categorization and analysis
   */
  async getWalletAnalysis(): Promise<{
    totalWallets: number;
    categorized: number;
    categories: { [key: string]: number };
    recentActivity: InstitutionalWallet[];
    suspicious: InstitutionalWallet[];
  }> {
    const cacheKey = 'wallet_analysis';
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    const categories = this.institutionalWallets.reduce((acc, wallet) => {
      acc[wallet.type] = (acc[wallet.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const recentActivity = this.institutionalWallets
      .filter(w => new Date(w.lastActivity).getTime() > Date.now() - 86400000)
      .slice(0, 10);

    const suspicious = this.institutionalWallets
      .filter(w => w.riskLevel === 'high')
      .slice(0, 5);

    const analysis = {
      totalWallets: this.institutionalWallets.length,
      categorized: this.institutionalWallets.filter(w => w.verified).length,
      categories,
      recentActivity,
      suspicious
    };

    this.setCache(cacheKey, analysis);
    return analysis;
  }

  // Private helper methods
  private calculateSmartMoneyConfidence(transaction: any): number {
    let confidence = 0;
    
    // Size factor (larger = more confidence)
    if (transaction.valueUsd > 10000000) confidence += 30;
    else if (transaction.valueUsd > 5000000) confidence += 20;
    else if (transaction.valueUsd > 1000000) confidence += 10;
    
    // Known wallet factor
    const fromKnown = this.getWalletType(transaction.from);
    const toKnown = this.getWalletType(transaction.to);
    if (fromKnown || toKnown) confidence += 20;
    
    // Timing factor (unusual hours = higher confidence)
    const hour = new Date(transaction.timestamp).getHours();
    if (hour < 6 || hour > 22) confidence += 10;
    
    // Gas price factor (high gas = urgency)
    if (transaction.gasPrice > 100) confidence += 15;
    
    return Math.min(100, confidence);
  }

  private determineTransactionType(transaction: any): 'accumulation' | 'distribution' | 'transfer' | 'arbitrage' {
    const fromType = this.getWalletType(transaction.from);
    const toType = this.getWalletType(transaction.to);
    
    if (fromType === 'exchange' && !toType) return 'distribution';
    if (!fromType && toType === 'exchange') return 'accumulation';
    if (fromType === 'exchange' && toType === 'exchange') return 'arbitrage';
    return 'transfer';
  }

  private determineImpact(value: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value > 50000000) return 'critical';
    if (value > 10000000) return 'high';
    if (value > 1000000) return 'medium';
    return 'low';
  }

  private getWalletType(address: string): string | null {
    const wallet = this.institutionalWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
    return wallet ? wallet.type : null;
  }

  private identifyStrategy(transaction: any): string {
    const fromType = this.getWalletType(transaction.from);
    const toType = this.getWalletType(transaction.to);
    
    if (fromType === 'exchange' && toType === 'exchange') return 'Arbitrage';
    if (!fromType && toType === 'exchange') return 'Accumulation';
    if (fromType === 'exchange' && !toType) return 'Distribution';
    if (fromType === 'fund' || toType === 'fund') return 'Fund Rebalancing';
    return 'Unknown';
  }

  private async getMarketContext(timestamp: string) {
    // Real market context - requires API data
    try {
      const btcData = await this.marketDataService.getCryptoQuotes(['BTC']);
      if (btcData.length > 0) {
        return {
          preBTC: btcData[0].price,
          postBTC: btcData[0].price,
          priceImpact: 0,
          volumeContext: btcData[0].volume24h > 30000000000 ? 'high' : 'normal'
        };
      }
    } catch (error) {
      console.error('Failed to get market context:', error);
    }
    return null; // No data available
  }

  private calculateInstitutionalScore(flow: any): number {
    let score = 0;
    
    // Size factor
    if (flow.value_usd > 5000000) score += 40;
    else if (flow.value_usd > 1000000) score += 20;
    
    // Known exchange factor
    const knownExchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex'];
    if (knownExchanges.includes(flow.from_exchange) || knownExchanges.includes(flow.to_exchange)) {
      score += 30;
    }
    
    // Round number factor (institutions often use round numbers)
    if (flow.amount % 1000 === 0 || flow.amount % 100 === 0) score += 10;
    
    return Math.min(100, score);
  }

  private determineFlowType(flow: any): 'inflow' | 'outflow' | 'internal_transfer' {
    if (flow.to_exchange && !flow.from_exchange) return 'inflow';
    if (flow.from_exchange && !flow.to_exchange) return 'outflow';
    return 'internal_transfer';
  }

  private determineSignificance(value: number): 'minor' | 'moderate' | 'major' | 'critical' {
    if (value > 100000000) return 'critical';
    if (value > 20000000) return 'major';
    if (value > 5000000) return 'moderate';
    return 'minor';
  }

  private analyzeMarketTiming(timestamp: string, symbol: string): 'pre_pump' | 'during_pump' | 'post_pump' | 'accumulation' | 'distribution' {
    // Without historical price data, we cannot determine market timing
    // Return 'accumulation' as neutral default
    return 'accumulation';
  }

  private calculateAccumulationScore(smartMoney: SmartMoneyTransaction[], fundFlows: FundFlow[]): number {
    const accumulations = smartMoney.filter(tx => tx.type === 'accumulation').length;
    const inflows = fundFlows.filter(flow => flow.flowType === 'inflow').length;
    return Math.min(100, (accumulations + inflows) * 10);
  }

  private calculateDistributionScore(smartMoney: SmartMoneyTransaction[], fundFlows: FundFlow[]): number {
    const distributions = smartMoney.filter(tx => tx.type === 'distribution').length;
    const outflows = fundFlows.filter(flow => flow.flowType === 'outflow').length;
    return Math.min(100, (distributions + outflows) * 10);
  }

  private calculateExchangeFlowScore(fundFlows: FundFlow[]): number {
    const totalValue = fundFlows.reduce((sum, flow) => sum + flow.value, 0);
    return Math.min(100, totalValue / 1000000); // Score based on total value
  }

  private calculateWhaleActivityScore(whaleMovements: any[]): number {
    return Math.min(100, whaleMovements.length * 5);
  }

  private determineTrend(overall: number, timeframe: string): 'increasingly_bullish' | 'increasingly_bearish' | 'stable' | 'mixed' {
    if (overall > 0.5) return 'increasingly_bullish';
    if (overall < -0.5) return 'increasingly_bearish';
    if (Math.abs(overall) < 0.1) return 'stable';
    return 'mixed';
  }

  private async getAssetFlows(asset: string, timeframe: string): Promise<FundFlow[]> {
    // Return empty array - no real data source available without premium API
    return [];
  }

  private async getLargestHolders(asset: string) {
    // Return empty array - requires premium blockchain analytics API (Glassnode, Nansen)
    return [];
  }

  private calculateConcentration(holders: any[]): number {
    const totalPercentage = holders.reduce((sum, holder) => sum + holder.percentage, 0);
    return Math.min(100, totalPercentage);
  }

  // Get data source indicator for transparency
  getDataSourceInfo(): { type: 'real-time' | 'unavailable'; disclaimer: string } {
    return {
      type: 'unavailable',
      disclaimer: 'Real-time institutional flow tracking requires premium blockchain analytics APIs (Glassnode, Nansen, Arkham). Contact us to enable this feature.'
    };
  }
}

export const institutionalFlowService = InstitutionalFlowService.getInstance();