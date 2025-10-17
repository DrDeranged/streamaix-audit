import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/ui/navigation';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { 
  Coins, 
  TrendingUp, 
  Zap, 
  Lock,
  Unlock,
  Gift,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Shield,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeFiDashboard() {
  const { isAuthenticated } = useAuth();
  const { wallet, isConnected, formatAddress, getNetworkInfo } = useWeb3();
  const {
    streamBalance,
    stakingInfo,
    transferTokens,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    loadContractData,
    isLoading,
    error,
    isContractSupported,
  } = useContracts();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');

  const networkInfo = wallet ? getNetworkInfo(wallet.chainId) : null;

  // Mock additional DeFi data for demonstration
  const [defiData] = useState({
    totalValueLocked: '$2,456,789',
    dailyVolume: '$845,321',
    totalUsers: '12,847',
    liquidityPools: [
      {
        pair: 'STREAM/ETH',
        tvl: '$456,789',
        apr: '24.5%',
        volume24h: '$89,456',
        userLiquidity: '1,245 STREAM',
        userShare: '0.27%',
      },
      {
        pair: 'STREAM/USDC',
        tvl: '$312,456',
        apr: '18.7%',
        volume24h: '$67,234',
        userLiquidity: '890 STREAM',
        userShare: '0.28%',
      },
    ],
    yieldFarms: [
      {
        pool: 'STREAM Staking',
        apy: stakingInfo.apr + '%',
        totalStaked: stakingInfo.totalStaked + ' STREAM',
        userStaked: stakingInfo.stakedAmount + ' STREAM',
        pendingRewards: stakingInfo.pendingRewards + ' STREAM',
      },
      {
        pool: 'STREAM-ETH LP',
        apy: '32.1%',
        totalStaked: '$1,234,567',
        userStaked: '$5,432',
        pendingRewards: '12.34 STREAM',
      },
    ],
  });

  const handleStake = async () => {
    if (!stakeAmount) return;
    await stakeTokens(stakeAmount);
    setStakeAmount('');
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    await unstakeTokens(unstakeAmount);
    setUnstakeAmount('');
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress) return;
    await transferTokens(transferAddress, transferAmount);
    setTransferAmount('');
    setTransferAddress('');
  };

  const handleClaimRewards = async () => {
    await claimRewards();
  };

  const handleRefresh = () => {
    loadContractData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <PieChart className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
              <p className="text-gray-300 mb-6">Please sign in to access DeFi features.</p>
              <Button className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">DeFi Dashboard</h1>
              <p className="text-gray-400">Manage your DeFi positions and earn yield</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Wallet Required</h3>
                <p className="text-yellow-300 mb-4">
                  Please connect your Web3 wallet to access DeFi features and smart contracts.
                </p>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Protocol Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Total Value Locked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">{defiData.totalValueLocked}</p>
                  <p className="text-fuchsia-400 text-sm flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5%
                  </p>
                </div>
                <Lock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">24h Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">{defiData.dailyVolume}</p>
                  <p className="text-fuchsia-400 text-sm flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8.3%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Your STREAM Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{streamBalance}</p>
                  <p className="text-gray-400 text-sm">STREAM</p>
                </div>
                <Coins className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Staked Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stakingInfo.stakedAmount}</p>
                  <p className="text-purple-400 text-sm">APR: {stakingInfo.apr}%</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main DeFi Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Tabs defaultValue="staking" className="space-y-6">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="staking" className="text-gray-900 dark:text-white data-[state=active]:bg-purple-600">
                <Zap className="h-4 w-4 mr-2" />
                Staking
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="text-gray-900 dark:text-white data-[state=active]:bg-purple-600">
                <PieChart className="h-4 w-4 mr-2" />
                Liquidity
              </TabsTrigger>
              <TabsTrigger value="yield" className="text-gray-900 dark:text-white data-[state=active]:bg-purple-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Yield Farming
              </TabsTrigger>
              <TabsTrigger value="transfer" className="text-gray-900 dark:text-white data-[state=active]:bg-purple-600">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* Staking Tab */}
            <TabsContent value="staking" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Stake STREAM
                    </CardTitle>
                    <p className="text-gray-400 text-sm">
                      Earn {stakingInfo.apr}% APR by staking your STREAM tokens
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-900 dark:text-white">Amount to Stake</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white"
                        disabled={!isConnected || !isContractSupported}
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        Available: {streamBalance} STREAM
                      </p>
                    </div>
                    <Button
                      onClick={handleStake}
                      disabled={!stakeAmount || isLoading || !isConnected}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Stake Tokens
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                      <Unlock className="h-5 w-5" />
                      Unstake STREAM
                    </CardTitle>
                    <p className="text-gray-400 text-sm">
                      Unstake your tokens and claim pending rewards
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-900 dark:text-white">Amount to Unstake</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="bg-white/10 border-white/20 text-gray-900 dark:text-white"
                        disabled={!isConnected || !isContractSupported}
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        Staked: {stakingInfo.stakedAmount} STREAM
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUnstake}
                        disabled={!unstakeAmount || isLoading || !isConnected}
                        variant="outline"
                        className="flex-1 border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Unstake
                      </Button>
                      <Button
                        onClick={handleClaimRewards}
                        disabled={isLoading || !isConnected || stakingInfo.pendingRewards === '0.0000'}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim ({stakingInfo.pendingRewards})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Staking Stats */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Staking Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stakingInfo.totalStaked}</p>
                      <p className="text-gray-400 text-sm">Total Staked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{stakingInfo.apr}%</p>
                      <p className="text-gray-400 text-sm">Current APR</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{stakingInfo.stakedAmount}</p>
                      <p className="text-gray-400 text-sm">Your Staked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{stakingInfo.pendingRewards}</p>
                      <p className="text-gray-400 text-sm">Pending Rewards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Liquidity Tab */}
            <TabsContent value="liquidity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {defiData.liquidityPools.map((pool, index) => (
                  <Card key={pool.pair} className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-900 dark:text-white">{pool.pair}</CardTitle>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {pool.apr} APR
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">TVL</p>
                          <p className="text-gray-900 dark:text-white font-semibold">{pool.tvl}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">24h Volume</p>
                          <p className="text-gray-900 dark:text-white font-semibold">{pool.volume24h}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Your Liquidity</p>
                          <p className="text-purple-400 font-semibold">{pool.userLiquidity}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Pool Share</p>
                          <p className="text-blue-400 font-semibold">{pool.userShare}</p>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        disabled={!isConnected}
                      >
                        Add Liquidity
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Yield Farming Tab */}
            <TabsContent value="yield" className="space-y-6">
              <div className="space-y-4">
                {defiData.yieldFarms.map((farm, index) => (
                  <Card key={farm.pool} className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <Coins className="h-6 w-6 text-gray-900 dark:text-white" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-semibold">{farm.pool}</h3>
                            <p className="text-gray-400 text-sm">APY: {farm.apy}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-gray-400 text-sm">Total Staked</p>
                              <p className="text-gray-900 dark:text-white font-semibold">{farm.totalStaked}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Your Staked</p>
                              <p className="text-purple-400 font-semibold">{farm.userStaked}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Pending</p>
                              <p className="text-yellow-400 font-semibold">{farm.pendingRewards}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Transfer STREAM Tokens</CardTitle>
                  <p className="text-gray-400 text-sm">Send tokens to another address</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-white">Recipient Address</Label>
                    <Input
                      placeholder="0x..."
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      className="bg-white/10 border-white/20 text-gray-900 dark:text-white"
                      disabled={!isConnected}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900 dark:text-white">Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="bg-white/10 border-white/20 text-gray-900 dark:text-white"
                      disabled={!isConnected}
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Available: {streamBalance} STREAM
                    </p>
                  </div>
                  <Button
                    onClick={handleTransfer}
                    disabled={!transferAmount || !transferAddress || isLoading || !isConnected}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Transfer Tokens
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Network Status */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Network Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Network</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{networkInfo?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wallet</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{wallet ? formatAddress(wallet.address) : 'Not connected'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Contract Support</p>
                    <Badge className={isContractSupported ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                      {isContractSupported ? 'Supported' : 'Unsupported'}
                    </Badge>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      onClick={() => window.open(networkInfo?.blockExplorer, '_blank')}
                      disabled={!networkInfo}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Explorer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}