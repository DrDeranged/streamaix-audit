import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Clock, Coins, TrendingUp, Flame, Zap, Loader2, ArrowRight, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Bounty } from "@shared/schema";

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    crypto: "from-green-500 to-teal-500",
    tech: "from-purple-500 to-pink-500",
    business: "from-cyan-500 to-blue-500",
  };
  return colors[category || ""] || "from-purple-500 to-purple-600";
};

const getDifficultyBadge = (difficulty?: string) => {
  const badges: Record<string, { label: string; className: string; icon: JSX.Element }> = {
    easy: { 
      label: "Easy", 
      className: "bg-green-500/20 text-green-300 border-green-400/30",
      icon: <Zap className="w-3 h-3" />
    },
    medium: { 
      label: "Medium", 
      className: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      icon: <TrendingUp className="w-3 h-3" />
    },
    hard: { 
      label: "Hard", 
      className: "bg-red-500/20 text-red-300 border-red-400/30",
      icon: <Flame className="w-3 h-3" />
    },
  };
  return badges[difficulty || "medium"] || badges.medium;
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
  
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return "< 1h left";
};

const getUrgencyColor = (deadline?: Date | string | null) => {
  if (!deadline) return "text-gray-400";
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const hours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hours < 6) return "text-red-400 animate-pulse";
  if (hours < 24) return "text-orange-400";
  if (hours < 72) return "text-yellow-400";
  return "text-gray-400";
};

interface BountyCardProps {
  bounty: Bounty;
  index: number;
}

function BountyCard({ bounty, index }: BountyCardProps) {
  const difficultyBadge = getDifficultyBadge(bounty.difficulty || undefined);
  const rewardColor = getCategoryColor(bounty.category || undefined);
  const urgencyColor = getUrgencyColor(bounty.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Card className="group h-full bg-white dark:bg-slate-900/80 border-gray-200 dark:border-purple-500/40 backdrop-blur-xl hover:border-purple-400 dark:hover:border-fuchsia-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden relative">
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-fuchsia-500/10 transition-all duration-500 pointer-events-none" />
        
        <CardContent className="p-6 flex flex-col h-full relative">
          {/* Header with reward */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  {bounty.createdAt ? formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true }) : "recently"}
                </p>
              </div>
            </div>
            <div className={`bg-gradient-to-r ${rewardColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg`}>
              <Coins className="w-4 h-4" />
              {formatReward(bounty.reward, bounty.tokenType)}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {bounty.title}
          </h3>

          {/* Description */}
          <p className="text-slate-700 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
            {bounty.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={difficultyBadge.className}>
              {difficultyBadge.icon}
              <span className="ml-1">{difficultyBadge.label}</span>
            </Badge>
            
            {bounty.category && (
              <Badge variant="outline" className="border-purple-300 dark:border-purple-400/30 text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/10">
                {bounty.category}
              </Badge>
            )}
          </div>

          {/* Footer with time and action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
            <div className={`flex items-center gap-1 text-sm ${urgencyColor}`}>
              <Clock className="w-4 h-4" />
              {formatTimeLeft(bounty.deadline)}
            </div>
            
            <Link href={`/bounties/${bounty.id}`}>
              <div className="relative group/btn inline-block">
                <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-70 group-hover/btn:opacity-100 blur-[1px] transition-opacity duration-300" />
                <Button
                  size="sm"
                  className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 overflow-hidden px-3"
                  data-testid={`button-view-bounty-${bounty.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                  <span className="relative z-10 font-medium">View</span>
                  <ArrowRight className="w-4 h-4 ml-1 text-purple-500 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function BountyFeed() {
  const { data: bountiesData, isLoading, error } = useQuery<{ bounties: Array<Bounty & { trendingScore?: number }> }>({
    queryKey: ['/api/bounties/trending'],
    queryFn: async () => {
      const response = await fetch('/api/bounties/trending?limit=6');
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: statsData } = useQuery<{
    stats: {
      activeBounties: number;
      totalRewards: number;
      summariesCreated: number;
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
    <section className="py-20 relative overflow-hidden bg-transparent">

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-purple-500/30 to-purple-600/30 rounded-full blur-3xl"
        animate={{
          y: [-20, 40, -20],
          x: [-10, 20, -10],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl"
        animate={{
          y: [-30, 30, -30],
          x: [-20, 10, -20],
          scale: [1.2, 1, 1.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <SectionHeader
            title="Bounty Feed"
            subtitle="Earn STREAM points by completing bounties"
            highlightWord="Bounty"
            badge="Live Bounties"
            badgeIcon={<Target className="w-3 h-3" />}
          />
        </motion.div>

        {/* Stats Bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
              <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeBounties}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Active Bounties</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
              <Coins className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalRewards.toLocaleString()}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Total Rewards</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.summariesCreated}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">Completed</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bounties Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading bounties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Unable to load bounties. Please try again later.</p>
          </div>
        ) : bounties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {bounties.slice(0, 6).map((bounty, index) => (
                <BountyCard key={bounty.id} bounty={bounty} index={index} />
              ))}
            </div>

            {/* View All Button - Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Link href="/bounties">
                <motion.div 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }}
                  className="inline-block relative group"
                >
                  {/* Animated gradient border */}
                  <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-80 group-hover:opacity-100 blur-[2px] animate-gradient-x transition-opacity duration-300" />
                  <Button
                    size="lg"
                    className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 overflow-hidden px-6 py-3"
                    data-testid="button-explore-all-bounties"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative z-10 font-medium">Explore All Bounties</span>
                    <ArrowRight className="w-5 h-5 ml-2 text-purple-500 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No bounties available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to create one!</p>
            <Button
              asChild
              className="mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Link href="/bounties">
                Create Bounty
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
