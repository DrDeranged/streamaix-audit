// Advanced DeFi strategies and automated portfolio management
import { Contract, parseEther, formatEther } from 'ethers';
import { web3Manager, type WalletInfo } from './web3';

export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  protocols: string[];
  assets: string[];
  apy: number;
  tvl: string;
  riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'EXPERIMENTAL';
  complexity: 'SIMPLE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  minDeposit: string;
  lockupPeriod?: string;
  autoCompounding: boolean;
  impermanentLossRisk: boolean;
  smartContractRisk: number; // 1-10
  steps: StrategyStep[];
}

export interface StrategyStep {
  order: number;
  action: 'DEPOSIT' | 'STAKE' | 'PROVIDE_LIQUIDITY' | 'LEND' | 'FARM' | 'COMPOUND';
  protocol: string;
  asset: string;
  percentage: number;
  description: string;
  gasEstimate: string;
}

export interface PortfolioRebalanceConfig {
  triggers: RebalanceTrigger[];
  maxDeviation: number; // percentage
  rebalanceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_TRIGGER';
  gasLimit: string;
  slippageTolerance: number;
  minTradeSize: string;
}

export interface RebalanceTrigger {
  type: 'DEVIATION' | 'TIME' | 'MARKET_CONDITION' | 'PROFIT_TAKING';
  threshold: number;
  condition: string;
  action: 'REBALANCE' | 'TAKE_PROFIT' | 'STOP_LOSS';
}

export interface AutomatedStrategy {
  id: string;
  name: string;
  userId: string;
  config: PortfolioRebalanceConfig;
  targetAllocation: AllocationTarget[];
  currentAllocation: AllocationCurrent[];
  performance: StrategyPerformance;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  lastRebalance: number;
  nextRebalance: number;
}

export interface AllocationTarget {
  asset: string;
  protocol: string;
  percentage: number;
  strategy: string;
}

export interface AllocationCurrent {
  asset: string;
  protocol: string;
  amount: string;
  value: string;
  percentage: number;
  apy: number;
}

export interface StrategyPerformance {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  totalFees: string;
  gasSpent: string;
  compoundCount: number;
  rebalanceCount: number;
}

export interface DCAStrategy {
  id: string;
  asset: string;
  amount: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  totalBudget: string;
  remainingBudget: string;
  averagePrice: string;
  totalPurchased: string;
  nextExecution: number;
  slippageTolerance: number;
  gasOptimization: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export class AdvancedDeFiManager {
  private wallet: WalletInfo | null = null;
  private activeStrategies: Map<string, AutomatedStrategy> = new Map();
  private dcaStrategies: Map<string, DCAStrategy> = new Map();

  constructor() {
    web3Manager.onWalletChange((wallet) => {
      this.wallet = wallet;
    });
  }

  // Get curated yield strategies
  async getYieldStrategies(riskLevel?: YieldStrategy['riskLevel']): Promise<YieldStrategy[]> {
    const strategies: YieldStrategy[] = [
      {
        id: 'strategy_stable_farm',
        name: 'Stable Coin Farming',
        description: 'Low-risk stable coin yield farming across multiple protocols',
        protocols: ['Aave', 'Compound', 'Curve'],
        assets: ['USDC', 'USDT', 'DAI'],
        apy: 8.5,
        tvl: '145M',
        riskLevel: 'CONSERVATIVE',
        complexity: 'SIMPLE',
        minDeposit: '1000',
        autoCompounding: true,
        impermanentLossRisk: false,
        smartContractRisk: 3,
        steps: [
          {
            order: 1,
            action: 'DEPOSIT',
            protocol: 'Curve',
            asset: 'USDC-USDT-DAI',
            percentage: 60,
            description: 'Provide liquidity to 3pool',
            gasEstimate: '0.015',
          },
          {
            order: 2,
            action: 'STAKE',
            protocol: 'Convex',
            asset: '3CRV',
            percentage: 100,
            description: 'Stake LP tokens for boosted rewards',
            gasEstimate: '0.012',
          },
        ],
      },
      {
        id: 'strategy_eth_yield',
        name: 'ETH Staking & LSD Strategy',
        description: 'Maximize ETH yield through staking and liquid staking derivatives',
        protocols: ['Lido', 'Rocket Pool', 'Frax'],
        assets: ['ETH', 'stETH', 'rETH'],
        apy: 12.8,
        tvl: '2.1B',
        riskLevel: 'MODERATE',
        complexity: 'INTERMEDIATE',
        minDeposit: '1',
        lockupPeriod: 'No lockup',
        autoCompounding: true,
        impermanentLossRisk: false,
        smartContractRisk: 4,
        steps: [
          {
            order: 1,
            action: 'STAKE',
            protocol: 'Lido',
            asset: 'ETH',
            percentage: 50,
            description: 'Stake ETH for stETH',
            gasEstimate: '0.02',
          },
          {
            order: 2,
            action: 'PROVIDE_LIQUIDITY',
            protocol: 'Curve',
            asset: 'stETH-ETH',
            percentage: 50,
            description: 'Provide liquidity to stETH/ETH pool',
            gasEstimate: '0.025',
          },
        ],
      },
      {
        id: 'strategy_defi_index',
        name: 'DeFi Blue Chip Index',
        description: 'Diversified exposure to top DeFi protocols with auto-rebalancing',
        protocols: ['Uniswap', 'Aave', 'Compound', 'MakerDAO'],
        assets: ['UNI', 'AAVE', 'COMP', 'MKR'],
        apy: 18.3,
        tvl: '89M',
        riskLevel: 'AGGRESSIVE',
        complexity: 'ADVANCED',
        minDeposit: '5000',
        autoCompounding: true,
        impermanentLossRisk: true,
        smartContractRisk: 6,
        steps: [
          {
            order: 1,
            action: 'DEPOSIT',
            protocol: 'Balancer',
            asset: 'DeFi-Index',
            percentage: 100,
            description: 'Invest in weighted DeFi index pool',
            gasEstimate: '0.03',
          },
        ],
      },
      {
        id: 'strategy_arb_farming',
        name: 'Arbitrum Ecosystem Farming',
        description: 'High-yield farming on Arbitrum with ARB incentives',
        protocols: ['GMX', 'Radiant', 'Camelot'],
        assets: ['ARB', 'GMX', 'RDNT'],
        apy: 35.7,
        tvl: '67M',
        riskLevel: 'EXPERIMENTAL',
        complexity: 'EXPERT',
        minDeposit: '2000',
        lockupPeriod: '30 days',
        autoCompounding: false,
        impermanentLossRisk: true,
        smartContractRisk: 8,
        steps: [
          {
            order: 1,
            action: 'PROVIDE_LIQUIDITY',
            protocol: 'Camelot',
            asset: 'ARB-ETH',
            percentage: 40,
            description: 'Provide ARB/ETH liquidity',
            gasEstimate: '0.008',
          },
          {
            order: 2,
            action: 'FARM',
            protocol: 'Camelot',
            asset: 'ARB-ETH-LP',
            percentage: 100,
            description: 'Farm LP tokens for rewards',
            gasEstimate: '0.006',
          },
        ],
      },
    ];

    return riskLevel 
      ? strategies.filter(s => s.riskLevel === riskLevel)
      : strategies.sort((a, b) => b.apy - a.apy);
  }

  // Deploy automated strategy
  async deployStrategy(strategyId: string, amount: string, config: PortfolioRebalanceConfig): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const strategy = (await this.getYieldStrategies()).find(s => s.id === strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const automatedStrategy: AutomatedStrategy = {
      id: `auto_${Date.now()}`,
      name: strategy.name,
      userId: this.wallet.address,
      config,
      targetAllocation: strategy.steps.map(step => ({
        asset: step.asset,
        protocol: step.protocol,
        percentage: step.percentage,
        strategy: step.action,
      })),
      currentAllocation: [],
      performance: {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        totalFees: '0',
        gasSpent: '0',
        compoundCount: 0,
        rebalanceCount: 0,
      },
      status: 'ACTIVE',
      lastRebalance: Date.now(),
      nextRebalance: this.calculateNextRebalance(config.rebalanceFrequency),
    };

    this.activeStrategies.set(automatedStrategy.id, automatedStrategy);

    // Execute initial deployment
    for (const step of strategy.steps) {
      await this.executeStrategyStep(step, amount);
    }

    return automatedStrategy.id;
  }

  // Create DCA strategy
  async createDCAStrategy(
    asset: string,
    amount: string,
    frequency: DCAStrategy['frequency'],
    totalBudget: string,
    slippageTolerance: number = 1
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const dcaStrategy: DCAStrategy = {
      id: `dca_${Date.now()}`,
      asset,
      amount,
      frequency,
      totalBudget,
      remainingBudget: totalBudget,
      averagePrice: '0',
      totalPurchased: '0',
      nextExecution: this.calculateNextDCAExecution(frequency),
      slippageTolerance,
      gasOptimization: true,
      status: 'ACTIVE',
    };

    this.dcaStrategies.set(dcaStrategy.id, dcaStrategy);
    return dcaStrategy.id;
  }

  // Execute portfolio rebalancing
  async rebalancePortfolio(strategyId: string): Promise<string[]> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const strategy = this.activeStrategies.get(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const rebalanceTxs: string[] = [];
    
    // Calculate current vs target allocation
    const deviations = this.calculateAllocationDeviations(strategy);
    
    // Execute rebalancing trades
    for (const deviation of deviations) {
      if (Math.abs(deviation.deviation) > strategy.config.maxDeviation) {
        const txHash = await this.executeRebalanceTrade(deviation);
        rebalanceTxs.push(txHash);
      }
    }

    // Update strategy stats
    strategy.lastRebalance = Date.now();
    strategy.nextRebalance = this.calculateNextRebalance(strategy.config.rebalanceFrequency);
    strategy.performance.rebalanceCount++;

    return rebalanceTxs;
  }

  // Auto-compound yields
  async autoCompound(strategyId: string): Promise<string[]> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const strategy = this.activeStrategies.get(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const compoundTxs: string[] = [];

    // Harvest rewards from each protocol
    for (const allocation of strategy.currentAllocation) {
      const txHash = await this.harvestAndReinvest(allocation);
      compoundTxs.push(txHash);
    }

    strategy.performance.compoundCount++;
    return compoundTxs;
  }

  // Get strategy performance analytics
  async getStrategyAnalytics(strategyId: string): Promise<{
    performance: StrategyPerformance;
    allocation: AllocationCurrent[];
    recentActivity: Array<{ type: string; timestamp: number; details: string }>;
    recommendations: string[];
  }> {
    const strategy = this.activeStrategies.get(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // Mock recent activity
    const recentActivity = [
      {
        type: 'REBALANCE',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        details: 'Portfolio rebalanced, +2.3% efficiency'
      },
      {
        type: 'COMPOUND',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        details: 'Rewards compounded, +$234.56'
      },
      {
        type: 'OPTIMIZATION',
        timestamp: Date.now() - 12 * 60 * 60 * 1000,
        details: 'Gas optimization saved $15.80'
      },
    ];

    const recommendations = [
      'Consider increasing allocation to stable yield strategies',
      'Current gas costs are 15% above optimal, schedule rebalancing for off-peak hours',
      'New yield opportunity available in Arbitrum ecosystem (+8.5% APY)',
    ];

    return {
      performance: strategy.performance,
      allocation: strategy.currentAllocation,
      recentActivity,
      recommendations,
    };
  }

  // Monitor and execute DCA purchases
  async executeDCAPurchase(dcaId: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const dca = this.dcaStrategies.get(dcaId);
    if (!dca || dca.status !== 'ACTIVE') {
      throw new Error('DCA strategy not found or inactive');
    }

    // Check if purchase amount exceeds remaining budget
    if (parseFloat(dca.amount) > parseFloat(dca.remainingBudget)) {
      dca.status = 'COMPLETED';
      throw new Error('DCA strategy completed - insufficient remaining budget');
    }

    // Execute purchase with slippage protection
    const txHash = await this.executePurchase(dca.asset, dca.amount, dca.slippageTolerance);

    // Update DCA metrics
    const currentPrice = await this.getCurrentPrice(dca.asset);
    const newTotalPurchased = parseFloat(dca.totalPurchased) + parseFloat(dca.amount) / currentPrice;
    const newRemainingBudget = parseFloat(dca.remainingBudget) - parseFloat(dca.amount);
    
    // Calculate new average price
    const totalSpent = parseFloat(dca.totalBudget) - newRemainingBudget;
    dca.averagePrice = (totalSpent / newTotalPurchased).toString();
    dca.totalPurchased = newTotalPurchased.toString();
    dca.remainingBudget = newRemainingBudget.toString();
    dca.nextExecution = this.calculateNextDCAExecution(dca.frequency);

    return txHash;
  }

  // Get all active strategies
  async getActiveStrategies(): Promise<AutomatedStrategy[]> {
    return Array.from(this.activeStrategies.values());
  }

  // Get all DCA strategies
  async getDCAStrategies(): Promise<DCAStrategy[]> {
    return Array.from(this.dcaStrategies.values());
  }

  // Risk assessment for strategies
  assessStrategyRisk(strategy: YieldStrategy): {
    overallRisk: number;
    factors: Array<{ factor: string; risk: number; description: string }>;
    recommendation: string;
  } {
    const factors = [
      {
        factor: 'Smart Contract Risk',
        risk: strategy.smartContractRisk * 10,
        description: 'Risk from smart contract vulnerabilities'
      },
      {
        factor: 'Impermanent Loss',
        risk: strategy.impermanentLossRisk ? 40 : 0,
        description: 'Risk from providing liquidity'
      },
      {
        factor: 'Protocol Risk',
        risk: strategy.protocols.length > 2 ? 30 : 15,
        description: 'Risk from multiple protocol dependencies'
      },
      {
        factor: 'Complexity Risk',
        risk: strategy.complexity === 'EXPERT' ? 25 : strategy.complexity === 'ADVANCED' ? 15 : 5,
        description: 'Risk from strategy complexity'
      },
    ];

    const overallRisk = factors.reduce((sum, f) => sum + f.risk, 0) / factors.length;
    
    let recommendation = 'SUITABLE';
    if (overallRisk > 60) recommendation = 'HIGH_RISK';
    else if (overallRisk > 40) recommendation = 'MODERATE_RISK';
    else if (overallRisk < 20) recommendation = 'LOW_RISK';

    return { overallRisk, factors, recommendation };
  }

  // Private helper methods
  private async executeStrategyStep(step: StrategyStep, amount: string): Promise<string> {
    // Mock execution - in production, interact with actual protocols
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
    console.log(`Executing ${step.action} on ${step.protocol}:`, step);
    return mockTxHash;
  }

  private calculateAllocationDeviations(strategy: AutomatedStrategy): Array<{
    asset: string;
    current: number;
    target: number;
    deviation: number;
  }> {
    return strategy.targetAllocation.map(target => {
      const current = strategy.currentAllocation.find(c => c.asset === target.asset);
      const currentPercentage = current ? current.percentage : 0;
      return {
        asset: target.asset,
        current: currentPercentage,
        target: target.percentage,
        deviation: currentPercentage - target.percentage,
      };
    });
  }

  private async executeRebalanceTrade(deviation: { asset: string; deviation: number }): Promise<string> {
    // Mock rebalance trade
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
    console.log(`Rebalancing ${deviation.asset} by ${deviation.deviation}%`);
    return mockTxHash;
  }

  private async harvestAndReinvest(allocation: AllocationCurrent): Promise<string> {
    // Mock harvest and reinvest
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
    console.log(`Harvesting and reinvesting ${allocation.asset} on ${allocation.protocol}`);
    return mockTxHash;
  }

  private async executePurchase(asset: string, amount: string, slippage: number): Promise<string> {
    // Mock DCA purchase
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
    console.log(`DCA purchase: ${amount} USD of ${asset} with ${slippage}% slippage`);
    return mockTxHash;
  }

  private async getCurrentPrice(asset: string): Promise<number> {
    // Mock price - in production, fetch from price feeds
    const prices: { [key: string]: number } = {
      'ETH': 1650,
      'BTC': 26800,
      'USDC': 1,
      'MATIC': 0.89,
    };
    return prices[asset] || 1;
  }

  private calculateNextRebalance(frequency: PortfolioRebalanceConfig['rebalanceFrequency']): number {
    const now = Date.now();
    switch (frequency) {
      case 'DAILY': return now + 24 * 60 * 60 * 1000;
      case 'WEEKLY': return now + 7 * 24 * 60 * 60 * 1000;
      case 'MONTHLY': return now + 30 * 24 * 60 * 60 * 1000;
      default: return now + 24 * 60 * 60 * 1000;
    }
  }

  private calculateNextDCAExecution(frequency: DCAStrategy['frequency']): number {
    const now = Date.now();
    switch (frequency) {
      case 'DAILY': return now + 24 * 60 * 60 * 1000;
      case 'WEEKLY': return now + 7 * 24 * 60 * 60 * 1000;
      case 'BIWEEKLY': return now + 14 * 24 * 60 * 60 * 1000;
      case 'MONTHLY': return now + 30 * 24 * 60 * 60 * 1000;
      default: return now + 7 * 24 * 60 * 60 * 1000;
    }
  }
}

export const advancedDeFiManager = new AdvancedDeFiManager();