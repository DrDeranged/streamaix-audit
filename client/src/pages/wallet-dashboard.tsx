import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuthHeaders } from '@/lib/auth';

interface WalletBalance {
  streamTokens: number;
  usdValue: number;
  change24h: number;
  totalEarned: number;
  totalSpent: number;
  pendingRewards: number;
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
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock wallet balance - in real app, this would come from blockchain/smart contracts
  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async (): Promise<WalletBalance> => {
      // Simulate API call to get wallet balance
      return {
        streamTokens: 1247.85,
        usdValue: 3743.55,
        change24h: 5.2,
        totalEarned: 2890.40,
        totalSpent: 1642.55,
        pendingRewards: 156.90,
      };
    },
    enabled: !!user,
  });

  // Mock transaction history
  const { data: transactions = [] } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      return [
        {
          id: '1',
          type: 'reward',
          amount: 45.60,
          description: 'Summary accuracy reward - "Web3 Fundamentals Explained"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          id: '2',
          type: 'bounty_payment',
          amount: -100.00,
          description: 'Bounty created - "AI Ethics Discussion Analysis"',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          id: '3',
          type: 'tip_received',
          amount: 25.00,
          description: 'Tip from @alice_crypto for quality summary',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          fromUser: 'alice_crypto',
        },
        {
          id: '4',
          type: 'reward',
          amount: 32.50,
          description: 'Community engagement reward',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          id: '5',
          type: 'withdrawal',
          amount: -500.00,
          description: 'Withdrawal to external wallet',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        },
      ];
    },
    enabled: !!user,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'reward':
        return <Award className="w-4 h-4 text-green-400" />;
      case 'bounty_payment':
        return <Gift className="w-4 h-4 text-purple-400" />;
      case 'tip_received':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      case 'tip_sent':
        return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Wallet Dashboard</h1>
              <p className="text-slate-300">Manage your STREAM tokens and rewards</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Total Balance</span>
                  <Coins className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    {walletBalance?.streamTokens.toFixed(2)} STREAM
                  </p>
                  <p className="text-slate-300 text-sm">
                    ${walletBalance?.usdValue.toFixed(2)} USD
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
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Total Earned</span>
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-400">
                    {walletBalance?.totalEarned.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm">STREAM tokens</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Pending Rewards</span>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-yellow-400">
                    {walletBalance?.pendingRewards.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm">Being processed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Total Spent</span>
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-400">
                    {walletBalance?.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm">STREAM tokens</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="backdrop-blur-lg bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Wallet Activity</CardTitle>
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
                      <CardTitle className="text-white text-lg">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(tx.type)}
                              <div>
                                <p className="text-white text-sm font-medium">{tx.description}</p>
                                <p className="text-slate-400 text-xs">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} STREAM
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
                      <CardTitle className="text-white text-lg">Top Reward Distributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {rewardDistributions.slice(0, 3).map((distribution) => (
                          <div key={distribution.summaryId} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-medium text-sm">{distribution.summaryTitle}</h4>
                              <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                {distribution.accuracy}% accuracy
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Distributed</span>
                                <span className="text-green-400 font-medium">
                                  {distribution.distributedAmount.toFixed(2)} / {distribution.totalRewards.toFixed(2)} STREAM
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
                    <h3 className="text-white text-lg font-semibold">Transaction History</h3>
                    <Button variant="outline" className="border-white/20 text-white">
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
                                <p className="text-white font-medium">{tx.description}</p>
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
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} STREAM
                              </p>
                              <p className="text-slate-400 text-sm">
                                ${(tx.amount * 3.0).toFixed(2)} USD
                              </p>
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
                    <h3 className="text-white text-lg font-semibold">Reward Distributions</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      Total Distributed: {rewardDistributions.reduce((sum, r) => sum + r.distributedAmount, 0).toFixed(2)} STREAM
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {rewardDistributions.map((distribution) => (
                      <Card key={distribution.summaryId} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold text-lg mb-2">{distribution.summaryTitle}</h4>
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
                                {distribution.distributedAmount.toFixed(2)} STREAM
                              </p>
                              <p className="text-slate-400 text-sm">
                                of {distribution.totalRewards.toFixed(2)} total
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Distribution Progress</span>
                              <span className="text-white">
                                {((distribution.distributedAmount / distribution.totalRewards) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={(distribution.distributedAmount / distribution.totalRewards) * 100} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <Button size="sm" variant="outline" className="border-white/20 text-white">
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