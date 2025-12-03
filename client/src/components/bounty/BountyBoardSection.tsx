import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trophy, DollarSign, CheckCircle, Clock, Filter, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { formatTokenAmount } from '@/lib/contracts';
import type { Bounty } from '@shared/schema';
import BountyCard from './BountyCard';
import CreateBountyModal from './CreateBountyModal';

export default function BountyBoardSection() {
  const { isConnected } = useWeb3();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch bounties (limit to 6 for dashboard view)
  const { data: bountiesData, isLoading: bountiesLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '6');
      if (statusFilter !== 'all') params.append('status', statusFilter);
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
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold mb-1">Bounty Board</h2>
          <p className="text-gray-400 text-sm">Earn $STREAM by creating summaries</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                disabled={!isConnected}
                data-testid="button-create-bounty-dashboard"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <CreateBountyModal onSuccess={() => setCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>

          <Link href="/bounties">
            <Button variant="outline" className="border-cyan-500/50 hover:bg-cyan-500/10">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/5 border-cyan-500/30 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-lg font-bold text-white">{stats?.activeBounties || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-purple-500/30 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Rewards</p>
              <p className="text-lg font-bold text-white">
                {stats?.totalRewards ? stats.totalRewards.toLocaleString() : '0'} STREAM
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-blue-500/30 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-lg font-bold text-white">{stats?.summariesCreated || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-cyan-500/30 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-gray-400">Avg Time</p>
              <p className="text-lg font-bold text-white">{stats?.avgCompletionTime || '24h'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Warning */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white/5 border-cyan-500/30" data-testid="select-status-filter-dashboard">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
            {bounties.length} shown
          </Badge>
        </div>

        {!isConnected && (
          <div className="text-sm text-yellow-400 flex items-center gap-2">
            <span>⚠️</span>
            Connect wallet to create/claim bounties
          </div>
        )}
      </div>

      {/* Bounties Grid */}
      {bountiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="bg-white/5 border-cyan-500/20 backdrop-blur-sm h-64 animate-pulse"
            />
          ))}
        </div>
      ) : bounties.length === 0 ? (
        <Card className="bg-white/5 border-cyan-500/30 backdrop-blur-sm p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No Bounties Found</h3>
          <p className="text-gray-400 text-sm mb-4">
            Be the first to create a bounty!
          </p>
          {isConnected && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bounty
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bounties.map((bounty, index) => (
            <motion.div
              key={bounty.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BountyCard bounty={bounty} />
            </motion.div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {bounties.length > 0 && (
        <div className="text-center pt-2">
          <Link href="/bounties">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
              View All Bounties →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
