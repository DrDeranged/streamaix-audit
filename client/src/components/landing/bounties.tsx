import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Bounty } from "@shared/schema";

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    crypto: "from-green-500 to-teal-500",
    tech: "from-purple-500 to-pink-500",
    business: "from-cyan-500 to-blue-500",
  };
  return colors[category || ""] || "from-indigo-500 to-purple-600";
};

const getDifficultyBadge = (difficulty?: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    easy: { label: "Easy", className: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
    medium: { label: "Medium", className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" },
    hard: { label: "Hard", className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
  };
  return badges[difficulty || "medium"] || badges.medium;
};

const getCategoryBadge = (category?: string) => {
  const badges: Record<string, string> = {
    crypto: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
    tech: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    business: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  };
  return badges[category || ""] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
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

  const bounties = bountiesData?.bounties || [];
  const stats = statsData?.stats;

  return (
    <section id="bounties" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02] pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Summary Bounty Board
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Earn $STREAM tokens by creating valuable summaries and completing bounties
          </p>
        </motion.div>
        
        {bountiesLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No bounties available yet</p>
            <Link href="/bounties">
              <Button className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                Create the first bounty
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {bounties.slice(0, 3).map((bounty, index) => {
              const rewardColor = getCategoryColor(bounty.category || undefined);
              const difficultyBadge = getDifficultyBadge(bounty.difficulty || undefined);
              const categoryBadge = getCategoryBadge(bounty.category || undefined);

              return (
                <motion.div
                  key={bounty.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="premium-card hover-lift h-full border-2">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {bounty.creatorWallet?.slice(2, 4).toUpperCase() || "??"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {bounty.creatorWallet?.slice(0, 6)}...{bounty.creatorWallet?.slice(-4)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {bounty.createdAt ? formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true }) : "recently"}
                            </p>
                          </div>
                        </div>
                        <div className={`bg-gradient-to-r ${rewardColor} text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap`}>
                          {formatReward(bounty.reward, bounty.tokenType)}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                        {bounty.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
                        {bounty.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeLeft(bounty.deadline)}
                        </span>
                        {bounty.tipPool && bounty.tipPool > 0 && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            +{bounty.tipPool} tips
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 mb-4 flex-wrap gap-2">
                        {bounty.category && (
                          <span className={`text-xs px-2 py-1 rounded ${getCategoryBadge(bounty.category || undefined)}`}>
                            {bounty.category}
                          </span>
                        )}
                        {bounty.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyBadge(bounty.difficulty || undefined).className}`}>
                            {getDifficultyBadge(bounty.difficulty || undefined).label}
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/bounties/${bounty.id}`}>
                        <Button 
                          className={`w-full bg-gradient-to-r ${rewardColor} hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300`}
                          data-testid={`button-view-bounty-${bounty.id}`}
                        >
                          View Bounty
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
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
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : stats ? (
            <>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-500">{stats.activeBounties}</div>
                <div className="text-muted-foreground">Active Bounties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  ${(stats.totalRewards / 1000).toFixed(1)}k
                </div>
                <div className="text-muted-foreground">Total Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-500">{stats.summariesCreated}</div>
                <div className="text-muted-foreground">Summaries Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.avgCompletionTime}</div>
                <div className="text-muted-foreground">Avg Completion</div>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
