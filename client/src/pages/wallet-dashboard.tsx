import { useState, useEffect } from 'react';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Users,
  Zap,
  Crown,
  Star,
  Award,
  Clock,
  DollarSign,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuthHeaders } from '@/lib/auth';
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
        const ethBalance = parseFloat(formatBalance(wallet.balance));
        
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center text-gray-900 dark:text-white">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Navigation showBackButton title="Wallet Dashboard" />
        <div className="container mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="text-center text-gray-900 dark:text-white max-w-md">
            <div className="mb-6">
              <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
              <p className="text-gray-300">Connect your Web3 wallet to view your portfolio and manage your assets</p>
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
        return <Award className="w-4 h-4 text-fuchsia-400" />;
      case 'bounty_payment':
        return <Gift className="w-4 h-4 text-purple-400" />;
      case 'tip_received':
        return <ArrowDownLeft className="w-4 h-4 text-cyan-400" />;
      case 'tip_sent':
        return <ArrowUpRight className="w-4 h-4 text-purple-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-fuchsia-400" />;
      default:
        return <Coins className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (type === 'withdrawal') return 'text-red-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation showBackButton title="Wallet Dashboard" />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Connected · {walletBalance?.ensName || formatAddress(wallet?.address || '')}
              {walletBalance?.chainId && <span className="text-muted-foreground">· Chain {walletBalance.chainId}</span>}
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
              <Button size="sm" className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90">
                <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Deposit</span>
              </Button>
              <Button size="sm" variant="outline" className="border-red-400/50 text-red-300 hover:bg-red-500/10">
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
            <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-slate-400 text-xs sm:text-sm">ETH Balance</span>
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    {walletBalance?.ethBalance?.toFixed(4) || '0.0000'} ETH
                  </p>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    ${((walletBalance?.ethBalance || 0) * 3000).toFixed(2)} USD
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-400 text-xs">Native Token</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-slate-400 text-xs sm:text-sm">STREAM Points</span>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    {walletBalance?.streamTokens?.toFixed(2) || '0.00'} STREAM
                  </p>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    ${((walletBalance?.streamTokens || 0) * 3.0).toFixed(2)} USD
                  </p>
                  <div className="flex items-center space-x-1">
                    {walletBalance && walletBalance.change24h > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-xs ${walletBalance && walletBalance.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {walletBalance?.change24h.toFixed(1)}% (24h)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-slate-400 text-xs sm:text-sm">Total Portfolio</span>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    ${walletBalance?.usdValue.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm">Total USD Value</p>
                  <div className="flex items-center space-x-1">
                    {walletBalance && walletBalance.change24h > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-xs ${walletBalance && walletBalance.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {walletBalance?.change24h.toFixed(1)}% (24h)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="backdrop-blur-lg bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-slate-400 text-xs sm:text-sm">Rewards Earned</span>
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    {walletBalance?.totalEarned.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm">STREAM earned</p>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs">
                      {walletBalance?.pendingRewards.toFixed(2)} pending
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="backdrop-blur-lg bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Wallet Activity</CardTitle>
            <CardDescription className="text-slate-300">
              Track your transactions, rewards, and distributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-white/20">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="rewards" className="data-[state=active]:bg-white/20">
                  Reward Distributions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Transactions */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white text-lg">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(tx.type)}
                              <div>
                                <p className="text-gray-900 dark:text-white text-sm font-medium">{tx.description}</p>
                                <p className="text-slate-400 text-xs">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                                {tx.amount > 0 ? '+' : ''}{Math.round(Math.abs(tx.amount)).toLocaleString()} STREAM
                              </p>
                              <Badge className={`text-xs ${
                                tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Reward Distributions */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white text-lg">Top Reward Distributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {rewardDistributions.slice(0, 3).map((distribution) => (
                          <div key={distribution.summaryId} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-gray-900 dark:text-white font-medium text-sm">{distribution.summaryTitle}</h4>
                              <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                {distribution.accuracy}% accuracy
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Distributed</span>
                                <span className="text-green-400 font-medium">
                                  {Math.round(distribution.distributedAmount).toLocaleString()} / {Math.round(distribution.totalRewards).toLocaleString()} STREAM
                                </span>
                              </div>
                              <Progress 
                                value={(distribution.distributedAmount / distribution.totalRewards) * 100} 
                                className="h-1"
                              />
                              <div className="flex justify-between text-xs text-slate-400">
                                <span>{distribution.recipientCount} recipients</span>
                                <span>{new Date(distribution.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Transaction History</h3>
                    <Button variant="outline" className="border-white/20 text-gray-900 dark:text-white">
                      Export CSV
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <Card key={tx.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 rounded-full bg-white/10">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <p className="text-gray-900 dark:text-white font-medium">{tx.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-slate-400 text-sm">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </p>
                                  <Badge className={`text-xs ${
                                    tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {tx.status}
                                  </Badge>
                                </div>
                                {tx.fromUser && (
                                  <p className="text-blue-400 text-sm">From: @{tx.fromUser}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                                {tx.amount > 0 ? '+' : ''}{Math.round(Math.abs(tx.amount)).toLocaleString()} STREAM
                              </p>
                              <p className="text-slate-400 text-sm">
                                ${(tx.amount * 3.0).toFixed(2)} USD
                              </p>
                              {tx.txHash && (
                                <button 
                                  onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                                  className="text-blue-400 text-xs hover:underline flex items-center mt-1"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View on Explorer
                                </button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Reward Distributions</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      Total Distributed: {Math.round(rewardDistributions.reduce((sum, r) => sum + r.distributedAmount, 0)).toLocaleString()} STREAM
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {rewardDistributions.map((distribution) => (
                      <Card key={distribution.summaryId} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{distribution.summaryTitle}</h4>
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
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
                              <p className="text-lg font-bold text-green-400">
                                {Math.round(distribution.distributedAmount).toLocaleString()} STREAM
                              </p>
                              <p className="text-slate-400 text-sm">
                                of {Math.round(distribution.totalRewards).toLocaleString()} total
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Distribution Progress</span>
                              <span className="text-gray-900 dark:text-white">
                                {((distribution.distributedAmount / distribution.totalRewards) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={(distribution.distributedAmount / distribution.totalRewards) * 100} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <Button size="sm" variant="outline" className="border-blue-400/50 bg-blue-500/20 text-gray-900 dark:text-white hover:bg-blue-500/30 hover:border-blue-400">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}