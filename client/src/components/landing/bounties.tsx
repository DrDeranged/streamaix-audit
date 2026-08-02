import { Button } from "@/components/ui/button";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Bounty } from "@shared/schema";

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    crypto: "bg-gain text-primary",
    tech: "bg-accent-core text-primary",
    business: "bg-accent-deep text-primary",
  };
  return colors[category || ""] || "bg-accent-deep text-primary";
};

const getDifficultyBadge = (difficulty?: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    easy: { label: "Easy", className: "bg-gain/10 text-gain border border-gain/30" },
    medium: { label: "Medium", className: "bg-warn/10 text-warn border border-warn/30" },
    hard: { label: "Hard", className: "bg-loss/10 text-loss border border-loss/30" },
  };
  return badges[difficulty || "medium"] || badges.medium;
};

const getCategoryBadge = (category?: string) => {
  const badges: Record<string, string> = {
    crypto: "bg-accent-core/10 text-accent-bright border border-accent-core/30",
    tech: "bg-accent-core/10 text-accent-bright border border-accent-core/30",
    business: "bg-accent-deep/20 text-accent-bright border border-accent-core/30",
  };
  return badges[category || ""] || "bg-ink-raised text-secondary border border-ink-edge";
};

const formatReward = (reward: number, tokenType?: string) => {
  const displayToken = tokenType || "STREAM";
  if (displayToken === "ETH") {
    return `${(reward / 1e18).toFixed(4)} ETH`;
  } else if (displayToken === "USDC") {
    return `${reward} USDC`;
  } else {
    return `${reward} $STREAM`;
  }
};

const formatTimeLeft = (deadline?: Date | string | null) => {
  if (!deadline) return "No deadline";
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  if (diffMs < 0) return "Expired";
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  return "< 1 hour left";
};

export function Bounties() {
  const { data: bountiesData, isLoading: bountiesLoading } = useQuery<{ bounties: Bounty[] }>({
    queryKey: ['/api/bounties/trending'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/trending?limit=3');
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{
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

  // Filter out expired bounties on the frontend as a safety fallback
  const now = new Date();
  const bounties = (bountiesData?.bounties || []).filter(bounty => {
    if (!bounty.deadline) return true; // No deadline = still active
    const deadline = typeof bounty.deadline === 'string' ? new Date(bounty.deadline) : bounty.deadline;
    return deadline > now;
  });
  const stats = statsData?.stats;

  return (
    <section id="bounties" className="relative overflow-hidden bg-ink-page py-24">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#232B45 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SectionTitle eyebrow="Earn from the ledger" className="text-2xl sm:text-3xl">
            Summary Bounty Board
          </SectionTitle>
          <p className="mt-3 text-sm text-secondary">Earn STREAM points by creating valuable summaries</p>
        </motion.div>
        
        {bountiesLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-accent-bright" />
            <p className="animate-pulse text-secondary">Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-secondary">No bounties available yet</p>
            <Link href="/bounties">
              <Button className="grad-accent glow-accent mt-4 rounded-xl text-primary">
                Create the first bounty
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {bounties.slice(0, 3).map((bounty, index) => {
              const rewardColor = getCategoryColor(bounty.category || undefined);

              return (
                <motion.div
                  key={bounty.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Surface className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-core text-primary font-bold">
                            {bounty.creatorWallet?.slice(2, 4).toUpperCase() || "??"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">
                              {bounty.creatorWallet?.slice(0, 6)}...{bounty.creatorWallet?.slice(-4)}
                            </p>
                            <p className="text-xs text-muted">
                              {bounty.createdAt ? formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true }) : "recently"}
                            </p>
                          </div>
                        </div>
                        <div className={`rounded-xl px-3 py-1 text-sm font-bold tabular whitespace-nowrap ${rewardColor}`}>
                          {formatReward(bounty.reward, bounty.tokenType)}
                        </div>
                      </div>
                      
                      <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-primary">
                        {bounty.title}
                      </h3>
                      
                      <p className="mb-4 line-clamp-2 flex-grow text-sm text-body">
                        {bounty.description}
                      </p>
                      
                      <div className="mb-4 flex items-center justify-between text-sm text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeLeft(bounty.deadline)}
                        </span>
                        {bounty.tipPool && bounty.tipPool > 0 && (
                            <span className="flex items-center gap-1 text-gain">
                            <TrendingUp className="w-4 h-4" />
                            +{bounty.tipPool} tips
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 mb-4 flex-wrap gap-2">
                        {bounty.category && (
                          <span className={`rounded-xl px-2 py-1 text-xs ${getCategoryBadge(bounty.category || undefined)}`}>
                            {bounty.category}
                          </span>
                        )}
                        {bounty.difficulty && (
                          <span className={`rounded-xl px-2 py-1 text-xs ${getDifficultyBadge(bounty.difficulty || undefined).className}`}>
                            {getDifficultyBadge(bounty.difficulty || undefined).label}
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/bounties/${bounty.id}`}>
                        <Button 
                          className="grad-accent glow-accent w-full rounded-xl font-semibold text-primary transition-transform duration-300 hover:-translate-y-0.5"
                          data-testid={`button-view-bounty-${bounty.id}`}
                        >
                          View Bounty
                        </Button>
                      </Link>
                  </Surface>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Stats Section */}
        <motion.div 
          className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {statsLoading ? (
            <div className="col-span-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent-bright" />
            </div>
          ) : stats ? (
            <>
              <div className="text-center">
                <div className="tabular font-display text-3xl font-bold text-primary">{stats.activeBounties}</div>
                <div className="text-secondary">Active Bounties</div>
              </div>
              <div className="text-center">
                <div className="tabular font-display text-3xl font-bold text-primary">
                  ${(stats.totalRewards / 1000).toFixed(1)}k
                </div>
                <div className="text-secondary">Total Rewards</div>
              </div>
              <div className="text-center">
                <div className="tabular font-display text-3xl font-bold text-primary">{stats.summariesCreated}</div>
                <div className="text-secondary">Summaries Created</div>
              </div>
              <div className="text-center">
                <div className="tabular font-display text-3xl font-bold text-gain">{stats.avgCompletionTime}</div>
                <div className="text-secondary">Avg Completion</div>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
