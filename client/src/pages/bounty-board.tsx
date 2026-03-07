import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trophy, DollarSign, CheckCircle, Clock, Filter, TrendingUp, Flame, AlertCircle, Home, LayoutDashboard, Bot, Rss, Users, Heart, MessageCircle, Gift, Star, Award, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/hooks/useWeb3';
import type { Bounty } from '@shared/schema';

// Format numbers with commas
const formatNumber = (num: number | string | undefined): string => {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
};

import BountyCard from '@/components/bounty/BountyCard';
import CompletedBountyCard from '@/components/bounty/CompletedBountyCard';
import CreateBountyModal from '@/components/bounty/CreateBountyModal';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import AIAgentsAtWork from '@/components/AIAgentsAtWork';

export default function BountyBoard() {
  const { wallet, isConnected } = useWeb3();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Fetch active bounties (open, claimed, in_progress)
  const { data: activeBountiesData, isLoading: activeLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties', 'active', categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'open,claimed,in_progress');
      params.append('limit', '50');
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await fetch(`/api/bounties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch completed bounties
  const { data: completedBountiesData, isLoading: completedLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties', 'completed', categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'completed');
      params.append('limit', '50');
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await fetch(`/api/bounties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch my bounties (created by or assigned to current user)
  const { data: myBountiesData, isLoading: myBountiesLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties', 'my', wallet?.address, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/bounties?creatorWallet=${wallet?.address || ''}&userId=${user?.id || ''}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
    enabled: !!(wallet?.address || user?.id),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch stats
  const { data: statsData } = useQuery<{
    stats: {
      activeBounties: number;
      totalRewards: number;
      summariesCreated: number;
      avgCompletionTime: string;
    };
  }>({
    queryKey: ['/api/bounties/stats'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Fetch trending bounties
  const { data: trendingData } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties/trending'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/trending?limit=6');
      if (!response.ok) throw new Error('Failed to fetch trending bounties');
      return response.json();
    },
  });

  // Fetch hot bounties
  const { data: hotData } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties/hot'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/hot?limit=3');
      if (!response.ok) throw new Error('Failed to fetch hot bounties');
      return response.json();
    },
  });

  // Fetch urgent bounties
  const { data: urgentData } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties/urgent'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/urgent?limit=3');
      if (!response.ok) throw new Error('Failed to fetch urgent bounties');
      return response.json();
    },
  });

  const activeBounties = activeBountiesData?.bounties || [];
  const completedBounties = completedBountiesData?.bounties || [];
  const myBounties = myBountiesData?.bounties || [];
  const stats = statsData?.stats;
  const trendingBounties = trendingData?.bounties || [];
  const hotBounties = hotData?.bounties || [];
  const urgentBounties = urgentData?.bounties || [];
  
  const bountiesLoading = activeTab === 'active' ? activeLoading : activeTab === 'completed' ? completedLoading : myBountiesLoading;
  const currentBounties = activeTab === 'active' ? activeBounties : activeTab === 'completed' ? completedBounties : myBounties;

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          {/* Navigation Buttons */}
          <div className="flex gap-3 mb-6">
            <Link href="/#bounties">
              <Button
                variant="outline"
                className="border-purple-500/30 hover:border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300"
              data-testid="button-back-dashboard"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
              data-testid="button-following-feed"
            >
              <Link href="/following">
                <Rss className="w-4 h-4 mr-2" />
                Your Feed
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mb-2">
                Bounty Board
              </h1>
              <p className="text-gray-400">
                Earn STREAM by creating summaries from videos and podcasts
              </p>
            </div>

            <Button
              size="lg"
              data-testid="button-create-bounty"
              onClick={() => {
                if (!isConnected) {
                  setWalletModalOpen(true);
                } else {
                  setCreateModalOpen(true);
                }
              }}
              className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Bounty
            </Button>

            {/* Wallet Connection Modal */}
            <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
              <DialogContent className="max-w-lg">
                <WalletConnector>
                  <p className="text-sm">
                    Connect your wallet to create bounties
                  </p>
                </WalletConnector>
              </DialogContent>
            </Dialog>

            {/* Create Bounty Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <CreateBountyModal onSuccess={() => setCreateModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {!isConnected && (
            <div className="mb-6">
              <WalletConnector>
                <p className="text-sm">
                  Connect your wallet to create or claim bounties
                </p>
              </WalletConnector>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-fade-in">
          <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Bounties</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-active-bounties">
                  {stats?.activeBounties || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-fuchsia-500/10">
                <DollarSign className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rewards</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-total-rewards">
                  {stats?.totalRewards ? `${stats.totalRewards.toLocaleString()} STREAM` : '0 STREAM'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Summaries Created</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-summaries-created">
                  {stats?.summariesCreated || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Completion</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-avg-completion">
                  {stats?.avgCompletionTime || '24h'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Agents at Work Section */}
        <div className="mb-12 animate-fade-in">
          <AIAgentsAtWork />
        </div>

        {/* Trending Section */}
        {(trendingBounties.length > 0 || hotBounties.length > 0 || urgentBounties.length > 0) && (
          <div className="mb-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trending */}
              {trendingBounties.length > 0 && (
                <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-300">Trending</h3>
                    <Badge variant="outline" className="ml-auto border-purple-500/50 text-purple-400 text-xs">
                      {trendingBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {trendingBounties.slice(0, 3).map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 hover:bg-white/90 dark:hover:bg-slate-900/80 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-purple-500/20"
                          data-testid={`trending-bounty-${bounty.id}`}
                        >
                          <p className="text-sm font-medium text-white truncate">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-gray-400">{bounty.category || 'General'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Hot */}
              {hotBounties.length > 0 && (
                <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-fuchsia-400" />
                    <h3 className="text-lg font-semibold text-fuchsia-300">Hot</h3>
                    <Badge variant="outline" className="ml-auto border-fuchsia-500/50 text-fuchsia-400 text-xs">
                      {hotBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {hotBounties.map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 hover:bg-white/90 dark:hover:bg-slate-900/80 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-purple-500/20"
                          data-testid={`hot-bounty-${bounty.id}`}
                        >
                          <p className="text-sm font-medium text-white truncate">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-gray-400">{bounty.category || 'General'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Urgent */}
              {urgentBounties.length > 0 && (
                <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-purple-500/40 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Urgent</h3>
                    <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-400 text-xs">
                      {urgentBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {urgentBounties.map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 hover:bg-white/90 dark:hover:bg-slate-900/80 hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-purple-500/20"
                          data-testid={`urgent-bounty-${bounty.id}`}
                        >
                          <p className="text-sm font-medium text-white truncate">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-gray-400">{bounty.deadline ? `${Math.ceil((new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60))}h left` : ''}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-900/50 border border-purple-500/30 h-auto p-1">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
                data-testid="tab-active-bounties"
              >
                <Zap className="w-4 h-4 mr-2" />
                Active
                <Badge className="ml-2 bg-purple-500/30 text-purple-300 text-xs">
                  {activeBounties.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                data-testid="tab-completed-bounties"
              >
                <Award className="w-4 h-4 mr-2" />
                Completed
                <Badge className="ml-2 bg-green-500/30 text-green-300 text-xs">
                  {completedBounties.length}
                </Badge>
              </TabsTrigger>
              {(wallet?.address || user?.id) && (
                <TabsTrigger 
                  value="my" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                  data-testid="tab-my-bounties"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  My Bounties
                  <Badge className="ml-2 bg-cyan-500/30 text-cyan-300 text-xs">
                    {myBounties.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-purple-500/30" data-testid="select-category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Bounties Tab */}
          <TabsContent value="active" className="mt-0">
            {activeLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card
                    key={i}
                    className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20 backdrop-blur-sm h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : activeBounties.length === 0 ? (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Bounties</h3>
                <p className="text-gray-400 mb-6">
                  Be the first to create a bounty and start earning!
                </p>
                {isConnected && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="button-create-first-bounty"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Bounty
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeBounties.map((bounty) => (
                  <div key={bounty.id} className="animate-fade-in">
                    <BountyCard bounty={bounty} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Bounties Tab */}
          <TabsContent value="completed" className="mt-0">
            {completedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card
                    key={i}
                    className="bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/20 backdrop-blur-sm h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : completedBounties.length === 0 ? (
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/30 backdrop-blur-sm p-12 text-center">
                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Completed Bounties Yet</h3>
                <p className="text-gray-400 mb-6">
                  Completed bounties will appear here with likes, comments, and tips.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBounties.map((bounty) => (
                  <div key={bounty.id} className="animate-fade-in">
                    <CompletedBountyCard bounty={bounty} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Bounties Tab */}
          <TabsContent value="my" className="mt-0">
            {myBountiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="bg-gradient-to-br from-cyan-900/20 to-blue-800/10 border-cyan-500/20 backdrop-blur-sm h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : myBounties.length === 0 ? (
              <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-800/10 border-cyan-500/30 backdrop-blur-sm p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Bounties Yet</h3>
                <p className="text-gray-400 mb-6">
                  Create your first bounty or claim one to get started!
                </p>
                {isConnected && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="button-create-my-bounty"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Bounty
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBounties.map((bounty) => (
                  <div key={bounty.id} className="animate-fade-in">
                    {bounty.status === 'completed' ? (
                      <CompletedBountyCard bounty={bounty} />
                    ) : (
                      <BountyCard bounty={bounty} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
