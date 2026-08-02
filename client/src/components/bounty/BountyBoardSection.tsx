import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trophy, DollarSign, CheckCircle, Clock, Filter, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
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
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
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
          <SectionTitle as="h2">Bounty Board</SectionTitle>
          <p className="text-secondary text-sm">Earn $STREAM by creating summaries</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                className="grad-accent glow-accent text-primary hover:bg-accent-deep"
                disabled={!isConnected}
                data-testid="button-create-bounty-dashboard"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-ink-edge bg-ink-surface">
              <CreateBountyModal onSuccess={() => setCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>

          <Link href="/bounties">
            <Button variant="outline" className="border-accent-core/50 text-accent-bright hover:bg-ink-raised">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Surface className="p-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-bright" />
            <div>
              <StatValue label="Active" value={stats?.activeBounties || 0} />
            </div>
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent-bright" />
            <div>
              <StatValue
                label="Rewards"
                value={`${stats?.totalRewards ? stats.totalRewards.toLocaleString() : '0'} STREAM`}
              />
            </div>
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gain" />
            <div>
              <StatValue label="Completed" value={stats?.summariesCreated || 0} />
            </div>
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent-bright" />
            <div>
              <StatValue label="Avg Time" value={stats?.avgCompletionTime || '24h'} />
            </div>
          </div>
        </Surface>
      </div>

      {/* Filter & Warning */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] rounded-xl bg-ink-surface border-ink-edge text-body" data-testid="select-status-filter-dashboard">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="rounded-xl border-accent-core/50 text-accent-bright">
            {bounties.length} shown
          </Badge>
        </div>

        {!isConnected && (
          <div className="text-sm text-warn flex items-center gap-2">
            <span>⚠️</span>
            Connect wallet to create/claim bounties
          </div>
        )}
      </div>

      {/* Bounties Grid */}
      {bountiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Surface
              key={i}
              className="h-64 animate-pulse border-ink-edge bg-ink-surface"
            />
          ))}
        </div>
      ) : bounties.length === 0 ? (
        <Surface className="p-8 text-center">
          <Trophy className="w-12 h-12 text-muted mx-auto mb-3" />
          <SectionTitle as="h3" className="mb-2">No Bounties Found</SectionTitle>
          <p className="text-secondary text-sm mb-4">
            Be the first to create a bounty!
          </p>
          {isConnected && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="grad-accent glow-accent text-primary hover:bg-accent-deep"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bounty
            </Button>
          )}
        </Surface>
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
              <Button variant="ghost" className="text-accent-bright hover:text-primary hover:bg-ink-raised">
              View All Bounties →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
