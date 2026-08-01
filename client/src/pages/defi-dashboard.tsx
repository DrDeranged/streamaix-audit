import { useState } from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw,
  ExternalLink,
  Shield,
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
      <div className="min-h-[100dvh] bg-ink-page">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Surface className="rounded-xl p-0">
            <CardContent className="p-8 text-center">
               <PieChart className="mx-auto mb-4 h-16 w-16 text-accent-bright" />
               <SectionTitle as="h2" className="mb-2">Authentication Required</SectionTitle>
               <p className="mb-6 text-body">Please sign in to access DeFi features.</p>
               <Button className="grad-accent glow-accent rounded-xl text-primary">
                Sign In
              </Button>
            </CardContent>
          </Surface>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="DeFi · yield positions"
            title="DeFi Dashboard"
            icon={<PieChart className="h-5 w-5" />}
            subtitle="Manage your DeFi positions and earn yield."
            actions={
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                 className="min-h-[44px] rounded-xl border border-ink-edge text-primary hover:bg-ink-raised"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            }
          />
        </motion.div>

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
             <Surface className="border-warn/30 bg-warn/10">
              <CardContent className="p-6 text-center">
                <Shield className="mx-auto mb-4 h-12 w-12 text-warn" />
                <SectionTitle as="h3" className="mb-2">Connect Wallet Required</SectionTitle>
                <p className="mb-4 text-warn">
                  Please connect your Web3 wallet to access DeFi features and smart contracts.
                </p>
                <Button className="rounded-xl bg-warn text-ink-page hover:bg-warn/80">
                  Connect Wallet
                </Button>
              </CardContent>
             </Surface>
          </motion.div>
        )}

        {/* Protocol Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
           <Surface>
            <CardHeader className="pb-2">
              <SectionTitle as="h3" className="text-sm font-medium">Total Value Locked</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                   <StatValue label="TVL" value={defiData.totalValueLocked} delta={12.5} />
                   <p className="flex items-center text-sm text-gain">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5%
                  </p>
                </div>
                 <Lock className="h-8 w-8 text-accent-bright" />
              </div>
            </CardContent>
           </Surface>

           <Surface>
            <CardHeader className="pb-2">
              <SectionTitle as="h3" className="text-sm font-medium">24h Volume</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                   <StatValue label="24h volume" value={defiData.dailyVolume} delta={8.3} />
                   <p className="flex items-center text-sm text-gain">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8.3%
                  </p>
                </div>
                 <BarChart3 className="h-8 w-8 text-accent-bright" />
              </div>
            </CardContent>
           </Surface>

           <Surface>
            <CardHeader className="pb-2">
              <SectionTitle as="h3" className="text-sm font-medium">Your STREAM Balance</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                   <p className="tabular font-display text-xl text-primary sm:text-2xl">{streamBalance}</p>
                   <p className="text-sm text-secondary">STREAM</p>
                </div>
                 <Coins className="h-8 w-8 text-accent-bright" />
              </div>
            </CardContent>
           </Surface>

           <Surface>
            <CardHeader className="pb-2">
              <SectionTitle as="h3" className="text-sm font-medium">Staked Tokens</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                   <p className="tabular font-display text-xl text-primary sm:text-2xl">{stakingInfo.stakedAmount}</p>
                   <p className="text-sm text-accent-bright">APR: {stakingInfo.apr}%</p>
                </div>
                 <Zap className="h-8 w-8 text-warn" />
              </div>
            </CardContent>
           </Surface>
        </motion.div>

        {/* Main DeFi Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Tabs defaultValue="staking" className="space-y-6">
            <TabsList className="rounded-xl border border-ink-edge bg-ink-surface">
              <TabsTrigger value="staking" className="text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white">
                <Zap className="h-4 w-4 mr-2" />
                Staking
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white">
                <PieChart className="h-4 w-4 mr-2" />
                Liquidity
              </TabsTrigger>
              <TabsTrigger value="yield" className="text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Yield Farming
              </TabsTrigger>
              <TabsTrigger value="transfer" className="text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-white">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* Staking Tab */}
            <TabsContent value="staking" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Surface>
                  <CardHeader>
                    <SectionTitle as="h3" className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Stake STREAM
                    </SectionTitle>
                    <p className="text-sm text-secondary">
                      Earn {stakingInfo.apr}% APR by staking your STREAM points
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-primary">Amount to Stake</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="rounded-xl border border-ink-edge bg-ink-raised text-primary"
                        disabled={!isConnected || !isContractSupported}
                      />
                      <p className="mt-1 text-sm text-secondary">
                        Available: {streamBalance} STREAM
                      </p>
                    </div>
                    <Button
                      onClick={handleStake}
                      disabled={!stakeAmount || isLoading || !isConnected}
                      className="grad-accent glow-accent w-full rounded-xl text-primary"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Stake Tokens
                    </Button>
                  </CardContent>
                </Surface>

                <Surface>
                  <CardHeader>
                    <SectionTitle as="h3" className="flex items-center gap-2">
                      <Unlock className="h-5 w-5" />
                      Unstake STREAM
                    </SectionTitle>
                    <p className="text-sm text-secondary">
                      Unstake your tokens and claim pending rewards
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-primary">Amount to Unstake</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="rounded-xl border border-ink-edge bg-ink-raised text-primary"
                        disabled={!isConnected || !isContractSupported}
                      />
                      <p className="mt-1 text-sm text-secondary">
                        Staked: {stakingInfo.stakedAmount} STREAM
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUnstake}
                        disabled={!unstakeAmount || isLoading || !isConnected}
                        variant="outline"
                        className="flex-1 rounded-xl border border-ink-edge text-primary hover:bg-ink-raised"
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Unstake
                      </Button>
                      <Button
                        onClick={handleClaimRewards}
                        disabled={isLoading || !isConnected || stakingInfo.pendingRewards === '0.0000'}
                        className="grad-accent glow-accent flex-1 rounded-xl text-primary"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim ({stakingInfo.pendingRewards})
                      </Button>
                    </div>
                  </CardContent>
                </Surface>
              </div>

              {/* Staking Stats */}
              <Surface>
                <CardHeader>
                  <SectionTitle>Staking Statistics</SectionTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="tabular font-display text-xl text-primary sm:text-2xl">{stakingInfo.totalStaked}</p>
                      <p className="text-sm text-secondary">Total Staked</p>
                    </div>
                    <div className="text-center">
                      <p className="tabular font-display text-xl text-gain sm:text-2xl">{stakingInfo.apr}%</p>
                      <p className="text-sm text-secondary">Current APR</p>
                    </div>
                    <div className="text-center">
                      <p className="tabular font-display text-xl text-accent-bright sm:text-2xl">{stakingInfo.stakedAmount}</p>
                      <p className="text-sm text-secondary">Your Staked</p>
                    </div>
                    <div className="text-center">
                      <p className="tabular font-display text-xl text-warn sm:text-2xl">{stakingInfo.pendingRewards}</p>
                      <p className="text-sm text-secondary">Pending Rewards</p>
                    </div>
                  </div>
                </CardContent>
              </Surface>
            </TabsContent>

            {/* Liquidity Tab */}
            <TabsContent value="liquidity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {defiData.liquidityPools.map((pool, index) => (
                  <Surface key={pool.pair}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <SectionTitle as="h3">{pool.pair}</SectionTitle>
                        <Badge className="border border-gain/30 bg-gain/10 text-gain">
                          {pool.apr} APR
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-sm text-muted">TVL</p>
                           <p className="tabular font-semibold text-primary">{pool.tvl}</p>
                        </div>
                        <div>
                           <p className="text-sm text-muted">24h Volume</p>
                           <p className="tabular font-semibold text-primary">{pool.volume24h}</p>
                        </div>
                        <div>
                           <p className="text-sm text-muted">Your Liquidity</p>
                           <p className="tabular font-semibold text-accent-bright">{pool.userLiquidity}</p>
                        </div>
                        <div>
                           <p className="text-sm text-muted">Pool Share</p>
                           <p className="tabular font-semibold text-accent-bright">{pool.userShare}</p>
                        </div>
                      </div>
                      <Button 
                         className="grad-accent glow-accent w-full rounded-xl text-primary"
                        disabled={!isConnected}
                      >
                        Add Liquidity
                      </Button>
                    </CardContent>
                  </Surface>
                ))}
              </div>
            </TabsContent>

            {/* Yield Farming Tab */}
            <TabsContent value="yield" className="space-y-6">
              <div className="space-y-4">
                {defiData.yieldFarms.map((farm, index) => (
                  <Surface key={farm.pool}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-deep">
                            <Coins className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary">{farm.pool}</h3>
                            <p className="text-sm text-secondary">APY: {farm.apy}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                               <p className="text-sm text-muted">Total Staked</p>
                               <p className="tabular font-semibold text-primary">{farm.totalStaked}</p>
                            </div>
                            <div>
                               <p className="text-sm text-muted">Your Staked</p>
                               <p className="tabular font-semibold text-accent-bright">{farm.userStaked}</p>
                            </div>
                            <div>
                               <p className="text-sm text-muted">Pending</p>
                               <p className="tabular font-semibold text-warn">{farm.pendingRewards}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Surface>
                ))}
              </div>
            </TabsContent>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-6">
              <Surface className="mx-auto max-w-md">
                <CardHeader>
                  <SectionTitle>Transfer STREAM Points</SectionTitle>
                  <p className="text-sm text-secondary">Send points to another address</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-primary">Recipient Address</Label>
                    <Input
                      placeholder="0x..."
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      className="rounded-xl border border-ink-edge bg-ink-raised text-primary"
                      disabled={!isConnected}
                    />
                  </div>
                  <div>
                    <Label className="text-primary">Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="rounded-xl border border-ink-edge bg-ink-raised text-primary"
                      disabled={!isConnected}
                    />
                    <p className="mt-1 text-sm text-secondary">
                      Available: {streamBalance} STREAM
                    </p>
                  </div>
                  <Button
                    onClick={handleTransfer}
                    disabled={!transferAmount || !transferAddress || isLoading || !isConnected}
                    className="grad-accent glow-accent w-full rounded-xl text-primary"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Transfer Tokens
                  </Button>
                </CardContent>
              </Surface>
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
            <Surface>
              <CardHeader>
                <SectionTitle>Network Information</SectionTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted">Network</p>
                    <p className="font-semibold text-primary">{networkInfo?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Wallet</p>
                    <p className="font-semibold text-primary">{wallet ? formatAddress(wallet.address) : 'Not connected'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Contract Support</p>
                    <Badge className={isContractSupported ? 'border border-gain/30 bg-gain/10 text-gain' : 'border border-loss/30 bg-loss/10 text-loss'}>
                      {isContractSupported ? 'Supported' : 'Unsupported'}
                    </Badge>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border border-ink-edge text-primary hover:bg-ink-raised"
                      onClick={() => window.open(networkInfo?.blockExplorer, '_blank')}
                      disabled={!networkInfo}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Explorer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Surface>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <Surface className="border border-loss/30 bg-loss/10">
              <CardContent className="p-4">
                <p className="text-sm text-loss">{error}</p>
              </CardContent>
            </Surface>
          </motion.div>
        )}
      </div>
    </div>
  );
}