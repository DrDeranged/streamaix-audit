import { useState } from 'react';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Users,
  Star,
  Award,
  Clock,
  DollarSign,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/navigation';
import { PageHeader } from '@/components/PageHeader';

interface WalletBalance {
  streamTokens: number;
  usdValue: number;
  change24h: number;
  totalEarned: number;
  totalSpent: number;
  pendingRewards: number;
  ethBalance?: number;
  walletAddress?: string;
  chainId?: number;
  ensName?: string;
}

interface Transaction {
  id: string;
  type: 'reward' | 'bounty_payment' | 'tip_received' | 'tip_sent' | 'withdrawal';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  fromUser?: string;
  toUser?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
}

interface RewardDistribution {
  summaryId: string;
  summaryTitle: string;
  totalRewards: number;
  distributedAmount: number;
  recipientCount: number;
  accuracy: number;
  createdAt: string;
}

export default function WalletDashboard() {
  const { user } = useAuth();
  const { wallet, isConnected, formatBalance, formatAddress } = useWeb3();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [realTimeBalance, setRealTimeBalance] = useState<string | null>(null);

  // Real wallet balance from connected Web3 wallet
  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', wallet?.address],
    queryFn: async (): Promise<WalletBalance> => {
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      
      try {
        // Get real ETH balance
        const ethBalance = parseFloat(formatBalance(wallet.balance || '0'));
        
        // Mock token data - in production, this would fetch real token balances
        const streamTokens = 1247.85; // This would be fetched from smart contract
        const ethToUsd = 3000; // This would be fetched from price API
        
        return {
          streamTokens,
          usdValue: (ethBalance * ethToUsd) + (streamTokens * 3.0),
          change24h: 5.2,
          totalEarned: 2890.40,
          totalSpent: 1642.55,
          pendingRewards: 156.90,
          ethBalance,
          walletAddress: wallet.address,
          chainId: wallet.chainId,
          ensName: wallet.ensName,
        };
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        throw error;
      }
    },
    enabled: !!wallet && isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real transaction history from wallet and platform
  const { data: transactions = [] } = useQuery({
    queryKey: ['wallet-transactions', wallet?.address],
    queryFn: async (): Promise<Transaction[]> => {
      if (!wallet) return [];
      
      try {
        // In production, this would fetch real blockchain transactions
        // For now, mix mock platform transactions with wallet info
        const platformTransactions = [
          {
            id: `tx_${wallet.address.slice(-8)}_1`,
            type: 'reward' as const,
            amount: 45.60,
            description: 'Summary accuracy reward - "Web3 Fundamentals Explained"',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'completed' as const,
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          },
          {
            id: `tx_${wallet.address.slice(-8)}_2`,
            type: 'bounty_payment' as const,
            amount: -100.00,
            description: 'Bounty created - "AI Ethics Discussion Analysis"',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            status: 'completed' as const,
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          },
          {
            id: `tx_${wallet.address.slice(-8)}_3`,
            type: 'tip_received' as const,
            amount: 25.00,
            description: 'Tip from @alice_crypto for quality summary',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            status: 'completed' as const,
            fromUser: 'alice_crypto',
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          },
        ];
        
        return platformTransactions;
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
      }
    },
    enabled: !!wallet && isConnected,
    refetchInterval: 60000, // Refetch every minute
  });

  // Mock reward distributions
  const { data: rewardDistributions = [] } = useQuery({
    queryKey: ['reward-distributions', user?.id],
    queryFn: async (): Promise<RewardDistribution[]> => {
      return [
        {
          summaryId: '1',
          summaryTitle: 'Web3 Fundamentals Explained',
          totalRewards: 200.00,
          distributedAmount: 180.50,
          recipientCount: 12,
          accuracy: 94,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          summaryId: '2',
          summaryTitle: 'DeFi Protocols Deep Dive',
          totalRewards: 150.00,
          distributedAmount: 150.00,
          recipientCount: 8,
          accuracy: 91,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          summaryId: '3',
          summaryTitle: 'NFT Market Analysis 2024',
          totalRewards: 300.00,
          distributedAmount: 275.75,
          recipientCount: 18,
          accuracy: 96,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-center text-primary">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-ink-page">
        <Navigation showBackButton title="Wallet Dashboard" />
        <div className="container mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="text-center text-primary max-w-md">
            <div className="mb-6">
              <Wallet className="w-16 h-16 mx-auto text-muted mb-4" />
              <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
              <p className="text-body">Connect your Web3 wallet to view your portfolio and manage your assets</p>
            </div>
            <WalletConnector />
          </div>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'reward':
        return <Award className="w-4 h-4 text-accent-bright" />;
      case 'bounty_payment':
        return <Gift className="w-4 h-4 text-accent-bright" />;
      case 'tip_received':
        return <ArrowDownLeft className="w-4 h-4 text-accent-bright" />;
      case 'tip_sent':
        return <ArrowUpRight className="w-4 h-4 text-accent-bright" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-accent-bright" />;
      default:
        return <Coins className="w-4 h-4 text-muted" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-gain';
    if (type === 'withdrawal') return 'text-loss';
    return 'text-warn';
  };

  return (
    <div className="min-h-screen bg-ink-page">
      <Navigation showBackButton title="Wallet Dashboard" />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-gain" />
              Connected · {walletBalance?.ensName || formatAddress(wallet?.address || '')}
              {walletBalance?.chainId && <span className="text-muted">· Chain {walletBalance.chainId}</span>}
            </span>
          }
          title="Wallet Dashboard"
          subtitle="Balances, transactions, and on-chain activity for your connected wallet."
          icon={<Wallet className="h-5 w-5" />}
          className="mb-6 sm:mb-8"
          actions={
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://etherscan.io/address/${wallet?.address}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Explorer</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (wallet?.address) navigator.clipboard.writeText(wallet.address);
                }}
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button size="sm" className="grad-accent glow-accent text-primary hover:bg-accent-deep">
                <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Deposit</span>
              </Button>
              <Button size="sm" variant="outline" className="border-loss/50 text-loss hover:bg-loss/10">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Withdraw</span>
              </Button>
            </>
          }
        />

        {/* Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Surface className="p-0">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-muted text-xs sm:text-sm">ETH Balance</span>
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
                </div>
                <div className="space-y-1">
                  <p className="tabular text-lg sm:text-2xl font-bold text-primary">
                    {walletBalance?.ethBalance?.toFixed(4) || '0.0000'} ETH
                  </p>
                  <p className="tabular text-body text-xs sm:text-sm">
                    ${((walletBalance?.ethBalance || 0) * 3000).toFixed(2)} USD
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-accent-core rounded-full"></div>
                    <span className="text-accent-bright text-xs">Native Token</span>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Surface className="p-0">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-muted text-xs sm:text-sm">STREAM Points</span>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
                </div>
                <div className="space-y-1">
                  <p className="tabular text-lg sm:text-2xl font-bold text-primary">
                    {walletBalance?.streamTokens?.toFixed(2) || '0.00'} STREAM
                  </p>
                  <p className="tabular text-body text-xs sm:text-sm">
                    ${((walletBalance?.streamTokens || 0) * 3.0).toFixed(2)} USD
                  </p>
                  <div className="flex items-center space-x-1">
                    {walletBalance && walletBalance.change24h > 0 ? (
                      <TrendingUp className="w-3 h-3 text-gain" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-loss" />
                    )}
                    <span className={`tabular text-xs ${walletBalance && walletBalance.change24h > 0 ? 'text-gain' : 'text-loss'}`}>
                      {walletBalance ? `${walletBalance.change24h >= 0 ? '+' : ''}${walletBalance.change24h.toFixed(2)}%` : '0.00%'} (24h)
                    </span>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Surface className="p-0">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-muted text-xs sm:text-sm">Total Portfolio</span>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
                </div>
                <div className="space-y-1">
                  <p className="tabular text-lg sm:text-2xl font-bold text-primary">
                    ${walletBalance?.usdValue.toFixed(2)}
                  </p>
                  <p className="text-secondary text-xs sm:text-sm">Total USD Value</p>
                  <div className="flex items-center space-x-1">
                    {walletBalance && walletBalance.change24h > 0 ? (
                      <TrendingUp className="w-3 h-3 text-gain" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-loss" />
                    )}
                    <span className={`tabular text-xs ${walletBalance && walletBalance.change24h > 0 ? 'text-gain' : 'text-loss'}`}>
                      {walletBalance ? `${walletBalance.change24h >= 0 ? '+' : ''}${walletBalance.change24h.toFixed(2)}%` : '0.00%'} (24h)
                    </span>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Surface className="p-0">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-muted text-xs sm:text-sm">Rewards Earned</span>
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent-bright" />
                </div>
                <div className="space-y-1">
                  <p className="tabular text-lg sm:text-2xl font-bold text-primary">
                    {walletBalance?.totalEarned.toFixed(2)}
                  </p>
                  <p className="text-secondary text-xs sm:text-sm">STREAM earned</p>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-warn" />
                    <span className="text-warn text-xs">
                      {walletBalance?.pendingRewards.toFixed(2)} pending
                    </span>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>
        </div>

        {/* Main Content */}
        <Surface className="p-4 sm:p-6">
          <div className="mb-4">
            <SectionTitle as="h2">Wallet Activity</SectionTitle>
            <p className="text-secondary">
              Track your transactions, rewards, and distributions
            </p>
          </div>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3 bg-ink-raised">
                <TabsTrigger value="overview" className="data-[state=active]:bg-accent-core data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-accent-core data-[state=active]:text-white">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="rewards" className="data-[state=active]:bg-accent-core data-[state=active]:text-white">
                  Reward Distributions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Transactions */}
                  <Surface variant="raised" className="p-4">
                    <SectionTitle as="h3">Recent Transactions</SectionTitle>
                    <div className="mt-4">
                      <div className="space-y-4">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-surface border border-ink-divider">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(tx.type)}
                              <div>
                                <p className="text-primary text-sm font-medium">{tx.description}</p>
                                <p className="text-muted text-xs">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                                {tx.amount > 0 ? '+' : ''}{Math.round(Math.abs(tx.amount)).toLocaleString()} STREAM
                              </p>
                              <Badge className={`text-xs ${
                                 tx.status === 'completed' ? 'bg-gain/20 text-gain' :
                                 tx.status === 'pending' ? 'bg-warn/20 text-warn' :
                                 'bg-loss/20 text-loss'
                              }`}>
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Surface>

                  {/* Top Reward Distributions */}
                  <Surface variant="raised" className="p-4">
                    <SectionTitle as="h3">Top Reward Distributions</SectionTitle>
                    <div className="mt-4">
                      <div className="space-y-4">
                        {rewardDistributions.slice(0, 3).map((distribution) => (
                          <div key={distribution.summaryId} className="p-3 rounded-xl bg-ink-surface border border-ink-divider">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-primary font-medium text-sm">{distribution.summaryTitle}</h4>
                              <Badge className="bg-accent-core/20 text-accent-bright text-xs">
                                {distribution.accuracy}% accuracy
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted">Distributed</span>
                                <span className="text-gain font-medium">
                                  {Math.round(distribution.distributedAmount).toLocaleString()} / {Math.round(distribution.totalRewards).toLocaleString()} STREAM
                                </span>
                              </div>
                              <Progress 
                                value={(distribution.distributedAmount / distribution.totalRewards) * 100} 
                                className="h-1"
                              />
                              <div className="flex justify-between text-xs text-muted">
                                <span>{distribution.recipientCount} recipients</span>
                                <span>{new Date(distribution.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Surface>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <SectionTitle as="h3">Transaction History</SectionTitle>
                    <Button variant="outline" className="border-ink-edge text-body">
                      Export CSV
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <Surface key={tx.id} variant="raised" className="p-4 hover:bg-ink-surface transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 rounded-xl bg-ink-surface">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <p className="text-primary font-medium">{tx.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-muted text-sm">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </p>
                                  <Badge className={`text-xs ${
                                     tx.status === 'completed' ? 'bg-gain/20 text-gain' :
                                     tx.status === 'pending' ? 'bg-warn/20 text-warn' :
                                     'bg-loss/20 text-loss'
                                  }`}>
                                    {tx.status}
                                  </Badge>
                                </div>
                                {tx.fromUser && (
                                  <p className="text-accent-bright text-sm">From: @{tx.fromUser}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                                {tx.amount > 0 ? '+' : ''}{Math.round(Math.abs(tx.amount)).toLocaleString()} STREAM
                              </p>
                              <p className="text-secondary text-sm">
                                ${(tx.amount * 3.0).toFixed(2)} USD
                              </p>
                              {tx.txHash && (
                                <button 
                                  onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                                   className="text-accent-bright text-xs hover:underline flex items-center mt-1"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View on Explorer
                                </button>
                              )}
                            </div>
                          </div>
                      </Surface>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <SectionTitle as="h3">Reward Distributions</SectionTitle>
                    <Badge className="bg-warn/20 text-warn">
                      Total Distributed: {Math.round(rewardDistributions.reduce((sum, r) => sum + r.distributedAmount, 0)).toLocaleString()} STREAM
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {rewardDistributions.map((distribution) => (
                      <Surface key={distribution.summaryId} variant="raised" className="p-6 hover:bg-ink-surface transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-primary font-semibold text-lg mb-2">{distribution.summaryTitle}</h4>
                              <div className="flex items-center space-x-4 text-sm text-secondary">
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {distribution.recipientCount} recipients
                                </span>
                                <span className="flex items-center">
                                  <Star className="w-4 h-4 mr-1" />
                                  {distribution.accuracy}% accuracy
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(distribution.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="tabular text-lg font-bold text-gain">
                                {Math.round(distribution.distributedAmount).toLocaleString()} STREAM
                              </p>
                              <p className="text-secondary text-sm">
                                of {Math.round(distribution.totalRewards).toLocaleString()} total
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted">Distribution Progress</span>
                              <span className="tabular text-primary">
                                {((distribution.distributedAmount / distribution.totalRewards) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={(distribution.distributedAmount / distribution.totalRewards) * 100} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <Button size="sm" variant="outline" className="border-accent-core/50 bg-accent-core/20 text-primary hover:bg-accent-core/30 hover:border-accent-core">
                              View Details
                            </Button>
                          </div>
                      </Surface>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </Surface>
      </div>
    </div>
  );
}