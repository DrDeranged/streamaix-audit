import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trophy, DollarSign, CheckCircle, Clock, Filter, TrendingUp, Flame, AlertCircle, LayoutDashboard, Rss, Award, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
    <div className="min-h-[100dvh] bg-ink-page">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          {/* Navigation Buttons */}
          <div className="flex gap-3 mb-6">
            <Link href="/#bounties">
              <Button
                variant="outline"
                className="rounded-xl border border-ink-edge bg-ink-surface text-secondary hover:border-accent-core/50 hover:bg-ink-raised"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border border-ink-edge bg-ink-surface text-secondary hover:border-accent-core/50 hover:bg-ink-raised"
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
              className="rounded-xl border border-ink-edge bg-ink-surface text-secondary hover:border-accent-core/50 hover:bg-ink-raised"
              data-testid="button-following-feed"
            >
              <Link href="/following">
                <Rss className="w-4 h-4 mr-2" />
                Your Feed
              </Link>
            </Button>
          </div>

          <PageHeader
            eyebrow="Earn · Open bounties"
            title="Bounty Board"
            icon={<Trophy className="h-5 w-5" />}
            subtitle="Earn STREAM by creating summaries from videos and podcasts."
            className="mb-4"
            actions={
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
                 variant="gradient-glow"
                 className="min-h-[44px] rounded-xl grad-accent glow-accent"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Bounty
              </Button>
            }
          />

          {/* Wallet Connection Modal */}
          <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
             <DialogContent className="max-w-lg rounded-2xl border-ink-edge bg-ink-surface">
              <WalletConnector>
                <p className="text-sm">
                  Connect your wallet to create bounties
                </p>
              </WalletConnector>
            </DialogContent>
          </Dialog>

          {/* Create Bounty Modal */}
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-ink-edge bg-ink-surface">
              <CreateBountyModal onSuccess={() => setCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>

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
           <Surface className="p-6">
            <div className="flex items-center gap-3">
               <div className="rounded-xl bg-accent-core/10 p-3">
                 <Trophy className="w-6 h-6 text-accent-bright" />
              </div>
              <div>
                 <StatValue label="Active Bounties" value={stats?.activeBounties || 0} data-testid="stat-active-bounties" />
              </div>
            </div>
           </Surface>

           <Surface className="p-6">
            <div className="flex items-center gap-3">
               <div className="rounded-xl bg-accent-core/10 p-3">
                 <DollarSign className="w-6 h-6 text-accent-bright" />
              </div>
              <div>
                 <StatValue label="Total Rewards" value={stats?.totalRewards ? `${stats.totalRewards.toLocaleString()} STREAM` : '0 STREAM'} data-testid="stat-total-rewards" />
              </div>
            </div>
           </Surface>

           <Surface className="p-6">
            <div className="flex items-center gap-3">
               <div className="rounded-xl bg-accent-core/10 p-3">
                 <CheckCircle className="w-6 h-6 text-gain" />
              </div>
              <div>
                 <StatValue label="Summaries Created" value={stats?.summariesCreated || 0} data-testid="stat-summaries-created" />
              </div>
            </div>
           </Surface>

           <Surface className="p-6">
            <div className="flex items-center gap-3">
               <div className="rounded-xl bg-accent-core/10 p-3">
                 <Clock className="w-6 h-6 text-accent-bright" />
              </div>
              <div>
                 <StatValue label="Avg Completion" value={stats?.avgCompletionTime || '24h'} data-testid="stat-avg-completion" />
              </div>
            </div>
           </Surface>
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
                <Surface className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-accent-bright" />
                    <h3 className="text-lg font-semibold text-primary">Trending</h3>
                    <Badge variant="outline" className="ml-auto border-accent-core/50 text-accent-bright text-xs">
                      {trendingBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {trendingBounties.slice(0, 3).map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="rounded-xl border border-ink-edge bg-ink-raised p-3"
                          data-testid={`trending-bounty-${bounty.id}`}
                        >
                          <p className="truncate text-sm font-medium text-primary">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-accent-bright">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-secondary">{bounty.category || 'General'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Surface>
              )}

              {/* Hot */}
              {hotBounties.length > 0 && (
                <Surface className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-warn" />
                    <h3 className="text-lg font-semibold text-primary">Hot</h3>
                    <Badge variant="outline" className="ml-auto border-warn/50 text-warn text-xs">
                      {hotBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {hotBounties.map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="rounded-xl border border-ink-edge bg-ink-raised p-3"
                          data-testid={`hot-bounty-${bounty.id}`}
                        >
                          <p className="truncate text-sm font-medium text-primary">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-accent-bright">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-secondary">{bounty.category || 'General'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Surface>
              )}

              {/* Urgent */}
              {urgentBounties.length > 0 && (
                <Surface className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-warn" />
                    <h3 className="text-lg font-semibold text-primary">Urgent</h3>
                    <Badge variant="outline" className="ml-auto border-warn/50 text-warn text-xs">
                      {urgentBounties.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {urgentBounties.map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <div
                          className="rounded-xl border border-ink-edge bg-ink-raised p-3"
                          data-testid={`urgent-bounty-${bounty.id}`}
                        >
                          <p className="truncate text-sm font-medium text-primary">{bounty.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-accent-bright">{formatNumber(bounty.reward)} {bounty.tokenType || 'STREAM'}</span>
                            <span className="text-xs text-secondary">{bounty.deadline ? `${Math.ceil((new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60))}h left` : ''}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Surface>
              )}
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
             <TabsList className="h-auto rounded-xl border border-ink-edge bg-ink-surface p-1">
              <TabsTrigger 
                value="active" 
                 className="data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                data-testid="tab-active-bounties"
              >
                <Zap className="w-4 h-4 mr-2" />
                Active
                 <Badge className="ml-2 bg-accent-core/20 text-accent-bright text-xs">
                  {activeBounties.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                 className="data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                data-testid="tab-completed-bounties"
              >
                <Award className="w-4 h-4 mr-2" />
                Completed
                 <Badge className="ml-2 bg-gain/15 text-gain text-xs">
                  {completedBounties.length}
                </Badge>
              </TabsTrigger>
              {(wallet?.address || user?.id) && (
                <TabsTrigger 
                  value="my" 
                   className="data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                  data-testid="tab-my-bounties"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  My Bounties
                   <Badge className="ml-2 bg-accent-core/20 text-accent-bright text-xs">
                    {myBounties.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="w-[180px] rounded-xl border-ink-edge bg-ink-surface" data-testid="select-category-filter">
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
                  <Surface
                    key={i}
                    className="h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : activeBounties.length === 0 ? (
               <Surface className="p-12 text-center">
                 <Trophy className="mx-auto mb-4 h-16 w-16 text-muted" />
                 <SectionTitle as="h3" className="mb-2 text-xl">No Active Bounties</SectionTitle>
                 <p className="mb-6 text-secondary">
                  Be the first to create a bounty and start earning!
                </p>
                {isConnected && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                     className="rounded-xl grad-accent glow-accent transition-transform duration-300 hover:scale-105"
                    data-testid="button-create-first-bounty"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Bounty
                  </Button>
                )}
               </Surface>
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
                  <Surface
                    key={i}
                    className="h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : completedBounties.length === 0 ? (
               <Surface className="p-12 text-center">
                 <Award className="mx-auto mb-4 h-16 w-16 text-muted" />
                 <SectionTitle as="h3" className="mb-2 text-xl">No Completed Bounties Yet</SectionTitle>
                 <p className="mb-6 text-secondary">
                  Completed bounties will appear here with likes, comments, and tips.
                </p>
               </Surface>
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
                  <Surface
                    key={i}
                    className="h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : myBounties.length === 0 ? (
               <Surface className="p-12 text-center">
                 <Trophy className="mx-auto mb-4 h-16 w-16 text-muted" />
                 <SectionTitle as="h3" className="mb-2 text-xl">No Bounties Yet</SectionTitle>
                 <p className="mb-6 text-secondary">
                  Create your first bounty or claim one to get started!
                </p>
                {isConnected && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                     className="rounded-xl grad-accent glow-accent transition-transform duration-300 hover:scale-105"
                    data-testid="button-create-my-bounty"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Bounty
                  </Button>
                )}
               </Surface>
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
