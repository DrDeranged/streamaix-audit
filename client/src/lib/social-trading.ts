// Social trading and copy trading platform
import { web3Manager, type WalletInfo } from './web3';

export interface TraderProfile {
  address: string;
  ensName?: string;
  avatar?: string;
  displayName: string;
  bio?: string;
  totalReturn: number; // Percentage
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  followersGrowth: number; // 30-day growth
  aum: string; // Assets under management
  verified: boolean;
  performance: PerformanceMetric[];
  topAssets: AssetPosition[];
  riskScore: number; // 1-10
  copyTradingFee: number; // Percentage
}

export interface PerformanceMetric {
  date: string;
  return: number;
  benchmark: number;
}

export interface AssetPosition {
  symbol: string;
  percentage: number;
  return7d: number;
  return30d: number;
}

export interface CopyTradeSettings {
  traderAddress: string;
  allocation: number; // USD amount
  maxSlippage: number;
  stopLoss?: number;
  takeProfit?: number;
  copyNFTs: boolean;
  copyStaking: boolean;
  autoRebalance: boolean;
}

export interface TradeSignal {
  id: string;
  traderAddress: string;
  traderName: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  asset: string;
  amount: string;
  price: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
  performance?: {
    entry: number;
    current: number;
    pnl: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  trader: TraderProfile;
  metric: number;
  change: number;
  timeframe: '24h' | '7d' | '30d' | 'all';
}

export class SocialTradingManager {
  private wallet: WalletInfo | null = null;
  private copyTrades: Map<string, CopyTradeSettings> = new Map();

  constructor() {
    web3Manager.onWalletChange((wallet) => {
      this.wallet = wallet;
    });
  }

  // Get top performing traders
  async getTopTraders(
    category: 'return' | 'sharpe' | 'consistency' | 'followers' = 'return',
    timeframe: '7d' | '30d' | '90d' | 'all' = '30d',
    limit: number = 20
  ): Promise<TraderProfile[]> {
    // Mock data - in production, fetch from social trading API
    const mockTraders: TraderProfile[] = [
      {
        address: '0x742d35Cc6Bf42532e82e94aC2D797F89C2d70c4F',
        ensName: 'defi-master.eth',
        displayName: 'DeFi Master',
        bio: 'Professional DeFi trader with 5+ years experience. Focus on yield farming and LP strategies.',
        totalReturn: 247.5,
        sharpeRatio: 2.34,
        maxDrawdown: -12.3,
        winRate: 78.2,
        totalTrades: 1247,
        followers: 8934,
        followersGrowth: 23.4,
        aum: '2,340,000',
        verified: true,
        performance: this.generatePerformanceHistory(247.5),
        topAssets: [
          { symbol: 'ETH', percentage: 35, return7d: 5.2, return30d: 23.4 },
          { symbol: 'USDC', percentage: 25, return7d: 0.1, return30d: 1.2 },
          { symbol: 'WBTC', percentage: 20, return7d: 3.8, return30d: 18.7 },
          { symbol: 'MATIC', percentage: 20, return7d: 8.9, return30d: 31.2 },
        ],
        riskScore: 6,
        copyTradingFee: 2.5,
      },
      {
        address: '0x891b23C429C55A987B7c4C72D76C07F47D7A2D80',
        ensName: 'nft-whale.eth',
        displayName: 'NFT Whale',
        bio: 'NFT collector and trader. Specialized in blue-chip collections and emerging artists.',
        totalReturn: 189.3,
        sharpeRatio: 1.87,
        maxDrawdown: -18.9,
        winRate: 71.5,
        totalTrades: 892,
        followers: 12456,
        followersGrowth: 45.7,
        aum: '1,890,000',
        verified: true,
        performance: this.generatePerformanceHistory(189.3),
        topAssets: [
          { symbol: 'BAYC', percentage: 40, return7d: 12.3, return30d: 56.7 },
          { symbol: 'AZUKI', percentage: 30, return7d: 8.9, return30d: 34.2 },
          { symbol: 'DOODLES', percentage: 20, return7d: -2.1, return30d: 12.8 },
          { symbol: 'ETH', percentage: 10, return7d: 5.2, return30d: 23.4 },
        ],
        riskScore: 8,
        copyTradingFee: 3.0,
      },
      {
        address: '0x123abc456def789ghi012jkl345mno678pqr901st',
        displayName: 'Yield Farmer Pro',
        bio: 'Conservative yield farming strategies with consistent returns. Risk-averse approach.',
        totalReturn: 67.8,
        sharpeRatio: 3.12,
        maxDrawdown: -5.2,
        winRate: 89.4,
        totalTrades: 234,
        followers: 5678,
        followersGrowth: 12.3,
        aum: '890,000',
        verified: true,
        performance: this.generatePerformanceHistory(67.8),
        topAssets: [
          { symbol: 'USDC', percentage: 50, return7d: 0.1, return30d: 1.2 },
          { symbol: 'DAI', percentage: 30, return7d: 0.1, return30d: 1.1 },
          { symbol: 'USDT', percentage: 20, return7d: 0.0, return30d: 0.8 },
        ],
        riskScore: 3,
        copyTradingFee: 1.5,
      },
    ];

    // Sort by category
    return mockTraders.sort((a, b) => {
      switch (category) {
        case 'return': return b.totalReturn - a.totalReturn;
        case 'sharpe': return b.sharpeRatio - a.sharpeRatio;
        case 'consistency': return a.maxDrawdown - b.maxDrawdown;
        case 'followers': return b.followers - a.followers;
        default: return b.totalReturn - a.totalReturn;
      }
    }).slice(0, limit);
  }

  // Start copy trading a specific trader
  async startCopyTrading(settings: CopyTradeSettings): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    // Validate settings
    if (settings.allocation < 100) {
      throw new Error('Minimum allocation is $100');
    }

    if (settings.maxSlippage > 5) {
      throw new Error('Maximum slippage cannot exceed 5%');
    }

    // Store copy trade settings
    this.copyTrades.set(settings.traderAddress, settings);

    // In production, this would interact with copy trading smart contracts
    console.log('Copy trading started:', settings);

    return `copy_trade_${Date.now()}`;
  }

  // Stop copy trading
  async stopCopyTrading(traderAddress: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    this.copyTrades.delete(traderAddress);
    
    // In production, would execute smart contract to stop copying
    console.log('Copy trading stopped for:', traderAddress);
  }

  // Get active copy trades for current user
  async getActiveCopyTrades(): Promise<Array<CopyTradeSettings & { performance: any }>> {
    if (!this.wallet) return [];

    const activeTrades = Array.from(this.copyTrades.values());
    
    // Add performance data
    return activeTrades.map(trade => ({
      ...trade,
      performance: {
        totalReturn: 12.34,
        dailyReturn: 0.45,
        pnl: '+$234.56',
        duration: '14 days',
      }
    }));
  }

  // Get recent trade signals from followed traders
  async getTradeSignals(limit: number = 50): Promise<TradeSignal[]> {
    // Mock signals - in production, fetch from social trading feed
    const signals: TradeSignal[] = [
      {
        id: 'signal_001',
        traderAddress: '0x742d35Cc6Bf42532e82e94aC2D797F89C2d70c4F',
        traderName: 'DeFi Master',
        action: 'BUY',
        asset: 'MATIC',
        amount: '5000',
        price: '0.89',
        confidence: 85,
        reasoning: 'Strong technical setup with upcoming Polygon zkEVM launch. RSI oversold.',
        timestamp: Date.now() - (2 * 60 * 60 * 1000),
        performance: {
          entry: 0.89,
          current: 0.92,
          pnl: 3.37,
        }
      },
      {
        id: 'signal_002',
        traderAddress: '0x891b23C429C55A987B7c4C72D76C07F47D7A2D80',
        traderName: 'NFT Whale',
        action: 'SELL',
        asset: 'DOODLES',
        amount: '2',
        price: '4.2 ETH',
        confidence: 78,
        reasoning: 'Taking profits after 40% run. Market showing signs of fatigue.',
        timestamp: Date.now() - (4 * 60 * 60 * 1000),
        performance: {
          entry: 3.8,
          current: 4.1,
          pnl: 7.89,
        }
      },
      {
        id: 'signal_003',
        traderAddress: '0x123abc456def789ghi012jkl345mno678pqr901st',
        traderName: 'Yield Farmer Pro',
        action: 'BUY',
        asset: 'stETH',
        amount: '10',
        price: '1645.32',
        confidence: 92,
        reasoning: 'Ethereum staking yields attractive. Low risk, steady returns.',
        timestamp: Date.now() - (6 * 60 * 60 * 1000),
        performance: {
          entry: 1645.32,
          current: 1652.18,
          pnl: 0.42,
        }
      },
    ];

    return signals.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  // Get leaderboard for different metrics
  async getLeaderboard(
    metric: 'return' | 'sharpe' | 'followers' | 'aum',
    timeframe: '24h' | '7d' | '30d' | 'all' = '30d'
  ): Promise<LeaderboardEntry[]> {
    const traders = await this.getTopTraders(metric === 'return' ? 'return' : 'sharpe', '30d');
    
    return traders.map((trader, index) => ({
      rank: index + 1,
      trader,
      metric: metric === 'return' ? trader.totalReturn :
              metric === 'sharpe' ? trader.sharpeRatio :
              metric === 'followers' ? trader.followers :
              parseFloat(trader.aum.replace(/,/g, '')),
      change: Math.random() * 10 - 5, // Mock change
      timeframe,
    }));
  }

  // Follow a trader (for signals, not copy trading)
  async followTrader(traderAddress: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    // In production, store follow relationship
    console.log('Following trader:', traderAddress);
  }

  // Unfollow a trader
  async unfollowTrader(traderAddress: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    console.log('Unfollowing trader:', traderAddress);
  }

  // Get trader detailed profile
  async getTraderProfile(address: string): Promise<TraderProfile | null> {
    const traders = await this.getTopTraders();
    return traders.find(trader => trader.address.toLowerCase() === address.toLowerCase()) || null;
  }

  // Share a trade or strategy
  async shareStrategy(
    title: string,
    description: string,
    assets: string[],
    reasoning: string
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const strategy = {
      id: `strategy_${Date.now()}`,
      author: this.wallet.address,
      title,
      description,
      assets,
      reasoning,
      timestamp: Date.now(),
    };

    console.log('Strategy shared:', strategy);
    return strategy.id;
  }

  // Get social trading analytics
  async getSocialAnalytics(address: string): Promise<{
    followersCount: number;
    followingCount: number;
    copiedTradesCount: number;
    totalFeesEarned: string;
    reputation: number;
    signalsAccuracy: number;
  }> {
    return {
      followersCount: 234,
      followingCount: 45,
      copiedTradesCount: 12,
      totalFeesEarned: '1,234.56',
      reputation: 87,
      signalsAccuracy: 73.2,
    };
  }

  // Private helper methods
  private generatePerformanceHistory(totalReturn: number): PerformanceMetric[] {
    const days = 90;
    const history: PerformanceMetric[] = [];
    let currentReturn = 0;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dailyReturn = (Math.random() - 0.5) * 4; // -2% to +2% daily
      currentReturn += dailyReturn;
      
      // Ensure we end up at the target total return
      if (i === 0) {
        currentReturn = totalReturn;
      }
      
      history.push({
        date: date.toISOString().split('T')[0],
        return: currentReturn,
        benchmark: currentReturn * 0.7, // Mock benchmark (70% of performance)
      });
    }
    
    return history;
  }
}

export const socialTradingManager = new SocialTradingManager();