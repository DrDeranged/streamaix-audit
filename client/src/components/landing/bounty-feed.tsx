import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import StatValue from "@/components/ds/StatValue";
import { Clock, Coins, TrendingUp, Flame, Zap, Loader2, ArrowRight, Target, Brain, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Bounty } from "@shared/schema";

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    crypto: "bg-gain",
    tech: "bg-accent-core",
    business: "bg-accent-deep",
  };
  return colors[category || ""] || "bg-accent-deep";
};

const getDifficultyBadge = (difficulty?: string) => {
  const badges: Record<string, { label: string; className: string; icon: JSX.Element }> = {
    easy: { 
      label: "Easy", 
      className: "bg-gain/10 text-gain border-gain/30",
      icon: <Zap className="w-3 h-3" />
    },
    medium: { 
      label: "Medium", 
      className: "bg-warn/10 text-warn border-warn/30",
      icon: <TrendingUp className="w-3 h-3" />
    },
    hard: { 
      label: "Hard", 
      className: "bg-loss/10 text-loss border-loss/30",
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
  if (!deadline) return "text-muted";
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const hours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hours < 6) return "text-loss animate-pulse";
  if (hours < 24) return "text-warn";
  if (hours < 72) return "text-warn";
  return "text-muted";
};

interface BountyCardProps {
  bounty: Bounty;
  index: number;
}

function BountyCard({ bounty, index }: BountyCardProps) {
  const difficultyBadge = getDifficultyBadge(bounty.difficulty || undefined);
  const rewardColor = getCategoryColor(bounty.category || undefined);
  const urgencyColor = getUrgencyColor(bounty.deadline);
  const isKnowledgeQuestion = (bounty as any).bountyType === 'knowledge_question';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Surface className={`group h-full transition-all duration-500 overflow-hidden relative hover:bg-ink-raised ${
        isKnowledgeQuestion 
          ? 'border-accent-core/60 hover:border-accent-core' 
          : 'border-ink-edge hover:border-accent-core/70'
      }`}>
        
        {/* Knowledge Question Badge */}
        {isKnowledgeQuestion && (
          <div className="absolute top-0 right-0 bg-accent-core text-primary text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
            <Brain className="w-3 h-3" />
            AI Verified Q&A
          </div>
        )}
        
        <div className="p-6 flex flex-col h-full relative">
          {/* Header with reward */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isKnowledgeQuestion 
                   ? 'bg-accent-core' 
                   : 'bg-accent-deep'
              }`}>
                {isKnowledgeQuestion ? <HelpCircle className="w-5 h-5 text-white" /> : <Target className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className="text-xs text-muted">
                  {bounty.createdAt ? formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true }) : "recently"}
                </p>
              </div>
            </div>
            <div className={`${isKnowledgeQuestion ? 'bg-accent-core' : rewardColor} text-primary px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1`}>
              <Coins className="w-4 h-4" />
              {formatReward(bounty.reward, bounty.tokenType)}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2 group-hover:text-accent-bright transition-colors">
            {bounty.title}
          </h3>

          {/* Description */}
          <p className="text-body text-sm mb-4 line-clamp-2 flex-grow">
            {bounty.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={difficultyBadge.className}>
              {difficultyBadge.icon}
              <span className="ml-1">{difficultyBadge.label}</span>
            </Badge>
            
            {bounty.category && (
              <Badge variant="outline" className="border-accent-core/30 text-accent-bright bg-accent-core/10">
                {bounty.category}
              </Badge>
            )}
          </div>

          {/* Footer with time and action */}
          <div className="flex items-center justify-between pt-4 border-t border-ink-divider">
            <div className={`flex items-center gap-1 text-sm ${urgencyColor}`}>
              <Clock className="w-4 h-4" />
              {formatTimeLeft(bounty.deadline)}
            </div>
            
            <Link href={`/bounties/${bounty.id}`}>
              <div className="relative group/btn inline-block">
                <Button
                  size="sm"
                  className="relative bg-accent-core text-primary hover:bg-accent-deep glow-accent transition-all duration-300 overflow-hidden px-3 rounded-xl"
                  data-testid={`button-view-bounty-${bounty.id}`}
                >
                  <span className="relative z-10 font-medium">View</span>
                  <ArrowRight className="w-4 h-4 ml-1 text-primary group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </Surface>
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
    <section className="pt-20 pb-20 relative overflow-hidden bg-transparent">

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-accent-core/10 rounded-xl blur-3xl"
        animate={{
          y: [-20, 40, -20],
          x: [-10, 20, -10],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-accent-deep/10 rounded-xl blur-3xl"
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
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-accent-core/30 bg-accent-core/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-bright">
              <Target className="w-3 h-3" />
              Live Bounties
            </div>
            <SectionTitle as="h2">Bounty Feed</SectionTitle>
            <p className="text-body">Earn STREAM points by completing bounties</p>
          </div>
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
            <Surface className="flex items-center gap-3 px-6 py-3">
              <Flame className="w-5 h-5 text-warn" />
              <div>
                <StatValue label="Active Bounties" value={stats.activeBounties} />
              </div>
            </Surface>
            
            <Surface className="flex items-center gap-3 px-6 py-3">
              <Coins className="w-5 h-5 text-warn" />
              <div>
                <StatValue label="Total Rewards" value={stats.totalRewards.toLocaleString()} />
              </div>
            </Surface>
            
            <Surface className="flex items-center gap-3 px-6 py-3">
              <TrendingUp className="w-5 h-5 text-gain" />
              <div>
                <StatValue label="Completed" value={stats.summariesCreated} />
              </div>
            </Surface>
          </motion.div>
        )}

        {/* Bounties Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-accent-bright animate-spin mb-4" />
            <p className="text-secondary">Loading bounties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-secondary">Unable to load bounties. Please try again later.</p>
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
                  <Button
                    size="lg"
                    className="relative grad-accent text-primary hover:bg-accent-deep glow-accent transition-all duration-300 overflow-hidden px-6 py-3 rounded-xl"
                    data-testid="button-explore-all-bounties"
                  >
                    <span className="relative z-10 font-medium">Explore All Bounties</span>
                    <ArrowRight className="w-5 h-5 ml-2 text-primary group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-secondary text-lg">No bounties available yet.</p>
            <p className="text-muted text-sm mt-2">Be the first to create one!</p>
            <Button
              asChild
              className="mt-6 grad-accent hover:bg-accent-deep rounded-xl"
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
