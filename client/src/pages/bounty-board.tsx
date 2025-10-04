import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trophy, DollarSign, CheckCircle, Clock, Filter } from 'lucide-react';
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
import { useWeb3 } from '@/hooks/useWeb3';
import { formatTokenAmount } from '@/lib/contracts';
import type { Bounty } from '@shared/schema';

// Import components we'll create next
import BountyCard from '@/components/bounty/BountyCard';
import CreateBountyModal from '@/components/bounty/CreateBountyModal';

export default function BountyBoard() {
  const { isConnected } = useWeb3();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch bounties
  const { data: bountiesData, isLoading: bountiesLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties', statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await fetch(`/api/bounties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
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
  });

  const bounties = bountiesData?.bounties || [];
  const stats = statsData?.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 mb-2">
                Bounty Board
              </h1>
              <p className="text-gray-400">
                Earn $STREAM by creating summaries from videos and podcasts
              </p>
            </div>

            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  data-testid="button-create-bounty"
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  disabled={!isConnected}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Bounty
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <CreateBountyModal onSuccess={() => setCreateModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {!isConnected && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                Connect your wallet to create or claim bounties
              </p>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Bounties</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-active-bounties">
                  {stats?.activeBounties || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rewards</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-total-rewards">
                  {stats?.totalRewards ? `${formatTokenAmount(stats.totalRewards.toString())} $STREAM` : '0 $STREAM'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Summaries Created</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-summaries-created">
                  {stats?.summariesCreated || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Completion</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-avg-completion">
                  {stats?.avgCompletionTime || '24h'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Filters:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-900/50 border-cyan-500/30" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-slate-900/50 border-purple-500/30" data-testid="select-category-filter">
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

          <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-400">
            {bounties.length} bounties
          </Badge>
        </motion.div>

        {/* Bounties Grid */}
        {bountiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-sm h-64 animate-pulse"
              />
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Bounties Found</h3>
            <p className="text-gray-400 mb-6">
              Be the first to create a bounty and start earning!
            </p>
            {isConnected && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                data-testid="button-create-first-bounty"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Bounty
              </Button>
            )}
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bounties.map((bounty, index) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <BountyCard bounty={bounty} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
