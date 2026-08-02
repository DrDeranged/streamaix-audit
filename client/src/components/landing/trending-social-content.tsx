import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionTitle from '@/components/ds/SectionTitle';
import Surface from '@/components/ds/Surface';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare,
  Heart,
  Repeat2,
  Users,
  ExternalLink,
  TrendingUp,
  Flame,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  ArrowUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TrendingCast {
  hash: string;
  text: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    followerCount: number;
  };
  timestamp: string;
  replies: number;
  recasts: number;
  likes: number;
  engagement: number;
  embeds?: Array<{
    url?: string;
    castId?: { fid: number; hash: string };
  }>;
  parentHash?: string;
  isLiked?: boolean;
  isRecasted?: boolean;
}

interface ProminentAccount {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  recent_activity: 'high' | 'medium' | 'low';
  trending_score: number;
}

// X-style Topic Filter Chips
function TrendingTopicsFilter({ selectedTopic, onTopicSelect }: { selectedTopic: string | null; onTopicSelect: (topic: string | null) => void }) {
  const { data: trendsData } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 30 * 1000, // 30 seconds for live updates
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
    retry: 3
  });

  const trends = (trendsData as any)?.topics?.slice(0, 6) || [
    { topic: 'Bitcoin ETF', mentions: 247 },
    { topic: 'DePIN', mentions: 189 },
    { topic: 'L2 scaling', mentions: 156 },
    { topic: 'Base chain', mentions: 134 },
    { topic: 'AI x Crypto', mentions: 89 },
    { topic: 'NFTs', mentions: 67 }
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      <button
        onClick={() => onTopicSelect(null)}
        className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 ${
          selectedTopic === null
            ? 'grad-accent text-primary glow-accent'
            : 'bg-ink-surface text-body hover:bg-ink-raised border border-ink-edge hover:border-accent-core'
        }`}
        data-testid="topic-all"
      >
        All
      </button>
      {trends.map((trend: any, i: number) => (
        <motion.button
          key={trend.topic}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onTopicSelect(trend.topic)}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 relative overflow-hidden group ${
            selectedTopic === trend.topic
              ? 'grad-accent text-primary glow-accent'
              : 'bg-ink-surface text-body hover:bg-ink-raised border border-ink-edge hover:border-accent-core'
          }`}
          data-testid={`topic-${i}`}
        >
          <span className="relative z-10">{trend.topic}</span>
          <span className="ml-2 text-xs text-accent-bright bg-accent-core/20 px-2 py-1 rounded-xl relative z-10">{trend.mentions}</span>
        </motion.button>
      ))}
    </div>
  );
}

// Main Feed Component - X-style
function DiscoverFeed({ casts, isLoading, error, activeTab, selectedTopic }: {
  casts: TrendingCast[];
  isLoading: boolean;
  error: any;
  activeTab: string;
  selectedTopic: string | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const initialCount = 6; // Show 6 posts initially for better mobile performance
  const displayedCasts = showAll ? casts : casts.slice(0, initialCount);

  // Reset showAll when tab or topic changes to maintain space efficiency
  useEffect(() => {
    setShowAll(false);
  }, [activeTab, selectedTopic]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Surface key={i} className="p-5 sm:p-7 animate-pulse relative overflow-hidden">
            <div className="flex gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-ink-raised rounded-full border-2 border-ink-edge" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-ink-raised rounded-xl w-1/3" />
                <div className="h-3 bg-ink-raised rounded-xl w-1/4" />
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="h-4 bg-ink-raised rounded-xl w-full" />
              <div className="h-4 bg-ink-raised rounded-xl w-4/5" />
              <div className="h-3 bg-ink-raised rounded-xl w-2/3" />
            </div>
          </Surface>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Surface className="text-center py-12 sm:py-16 relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-loss/10 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-loss" />
          </div>
          <p className="text-body mb-6 text-base font-medium">Unable to load conversations</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="lg"
            className="border-ink-edge text-body hover:bg-ink-raised hover:border-accent-core hover:scale-105 transition-all duration-300 px-6 py-3 rounded-xl font-bold"
            data-testid="retry-feed"
          >
            Try again
          </Button>
        </div>
      </Surface>
    );
  }

  if (!casts || casts.length === 0) {
    return (
      <Surface className="text-center py-12 sm:py-20 relative overflow-hidden">
        <div className="relative z-10 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 bg-accent-core/10 rounded-full flex items-center justify-center border-2 border-ink-edge"
          >
            <TrendingUp className="w-10 h-10 text-accent-bright" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-bold mb-3 text-primary">
            No Conversations Yet
          </h3>
          <p className="text-secondary mb-4 text-sm sm:text-base max-w-md mx-auto">
            The crypto conversation space is temporarily quiet. Check back soon for the latest discussions and insights.
          </p>
          <p className="text-muted text-xs sm:text-sm mb-6">
            Social feeds are being refreshed. This happens when API sources are temporarily unavailable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
               className="border-accent-core/30 text-accent-bright hover:bg-accent-core/10 hover:border-accent-core hover:scale-105 transition-all duration-300 px-6 py-2 rounded-xl font-medium"
              data-testid="refresh-feed"
            >
              Refresh Feed
            </Button>
            <a href="/features" className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1">
              Explore Features <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {displayedCasts.map((cast, index) => (
        <FeedPostCard key={cast.hash} cast={cast} index={index} />
      ))}
      
      {/* Show More Button */}
      {casts.length > initialCount && !showAll && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <Button
            onClick={() => setShowAll(true)}
            variant="outline"
            className="w-full sm:w-auto bg-ink-surface dark:bg-ink-surface backdrop-blur-md border-ink-edge dark:border-accent-core/40 text-primary dark:text-body hover:bg-ink-raised dark:hover:bg-ink-raised hover:text-accent-bright dark:hover:text-primary hover:border-accent-core/60 hover:scale-105 transition-all duration-300 px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20"
            data-testid="show-more-posts"
          >
            Show {casts.length - initialCount} more posts
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
      
      {/* Show Less Button */}
      {showAll && casts.length > initialCount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <Button
            onClick={() => setShowAll(false)}
            variant="ghost"
            size="sm"
            className="text-secondary dark:text-secondary hover:text-primary dark:hover:text-body hover:bg-ink-raised dark:hover:bg-ink-raised px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
            data-testid="show-less-posts"
          >
            Show less
            <ChevronUp className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// X-style Right Rail
function DiscoverRightRail() {
  return (
    <div className="space-y-6 sticky top-6">
      {/* Trending Topics */}
      <Surface className="p-5 hover:bg-ink-raised transition-all duration-500 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
             <TrendingUp className="w-5 h-5 text-accent-bright" />
             <SectionTitle as="h3">What's happening</SectionTitle>
          </div>
          <TrendingTopicsWidget />
        </div>
      </Surface>

      {/* Who to follow */}
      <Surface className="p-5 hover:bg-ink-raised transition-all duration-500 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-accent-bright" />
            <SectionTitle as="h3">Who to follow</SectionTitle>
          </div>
          <WhoToFollowWidget />
        </div>
      </Surface>
    </div>
  );
}

// Social Action Hooks
function useSocialMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const followMutation = useMutation({
    mutationFn: async ({ fid, username }: { fid: number; username: string }) => {
      return await apiRequest('/api/social/follow', {
        method: 'POST',
        body: JSON.stringify({ fid, username }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onMutate: async ({ fid }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/top-accounts'] });
      const previousData = queryClient.getQueryData(['/api/top-accounts']);
      
      // Optimistically update follow status in accounts list
      queryClient.setQueryData(['/api/top-accounts'], (old: any) => {
        if (!old?.accounts) return old;
        return {
          ...old,
          accounts: old.accounts.map((account: any) => 
            account.account.fid === fid 
              ? { ...account, isFollowed: true }
              : account
          )
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['/api/top-accounts'], context?.previousData);
      toast({
        title: "Unable to follow",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/top-accounts'] });
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Successfully followed user",
      });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ castHash }: { castHash: string }) => {
      return await apiRequest('/api/social/like', {
        method: 'POST',
        body: JSON.stringify({ castHash }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onMutate: async ({ castHash }) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/trending'] });
      
      // Snapshot all matching queries correctly
      const previousQueries = queryClient.getQueriesData({ queryKey: ['/api/trending'] });
      
      // Optimistically update all trending queries with different topics
      queryClient.setQueriesData({ queryKey: ['/api/trending'] }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) => 
            item.hash === castHash 
              ? { ...item, likes: item.likes + 1, isLiked: true }
              : item
          )
        };
      });
      
      // Return a context object with the snapshotted queries
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Restore each query individually with correct rollback pattern
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({
        title: "Unable to like",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
    },
    onSuccess: () => {
      toast({
        title: "Liked!",
        description: "Cast liked successfully",
      });
    }
  });

  const recastMutation = useMutation({
    mutationFn: async ({ castHash }: { castHash: string }) => {
      return await apiRequest('/api/social/recast', {
        method: 'POST',
        body: JSON.stringify({ castHash }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onMutate: async ({ castHash }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/trending'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['/api/trending'] });
      
      // Optimistically update recast count and state
      queryClient.setQueriesData({ queryKey: ['/api/trending'] }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) => 
            item.hash === castHash 
              ? { ...item, recasts: item.recasts + 1, isRecasted: true }
              : item
          )
        };
      });
      
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({
        title: "Unable to recast",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
    },
    onSuccess: () => {
      toast({
        title: "Recasted!",
        description: "Successfully recasted",
      });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ castHash, replyText }: { castHash: string; replyText: string }) => {
      return await apiRequest('/api/social/reply', {
        method: 'POST',
        body: JSON.stringify({ castHash, replyText }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onMutate: async ({ castHash }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/trending'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['/api/trending'] });
      
      // Optimistically update reply count
      queryClient.setQueriesData({ queryKey: ['/api/trending'] }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) => 
            item.hash === castHash 
              ? { ...item, replies: item.replies + 1 }
              : item
          )
        };
      });
      
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({
        title: "Unable to post reply",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
    },
    onSuccess: () => {
      toast({
        title: "Reply sent!",
        description: "Your reply was posted successfully",
      });
    }
  });

  return { followMutation, likeMutation, recastMutation, replyMutation };
}

// Right Rail Widgets
function TrendingTopicsWidget() {
  const { data: trendsData } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 30 * 1000, // 30 seconds for live updates
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
    retry: 3
  });

  const trends = (trendsData as any)?.topics?.slice(0, 5) || [
    { topic: 'Bitcoin ETF', mentions: 247 },
    { topic: 'DePIN', mentions: 189 },
    { topic: 'L2 scaling', mentions: 156 },
    { topic: 'Base chain', mentions: 134 },
    { topic: 'AI x Crypto', mentions: 89 }
  ];

  return (
    <div className="space-y-3">
      {trends.map((trend: any, i: number) => (
        <motion.div
          key={trend.topic}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 hover:bg-ink-raised rounded-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-ink-edge group"
          data-testid={`trending-widget-${i}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-primary dark:text-primary font-bold text-base group-hover:text-accent-bright dark:group-hover:text-accent-bright transition-colors">{trend.topic}</p>
              <p className="text-secondary dark:text-secondary text-sm mt-1">{trend.mentions} posts • Trending</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gain rounded-full animate-pulse" />
              <TrendingUp className="w-5 h-5 text-accent-bright group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WhoToFollowWidget() {
  const { followMutation } = useSocialMutations();
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());
  
  const fallbackAccounts = [
    { account: { fid: 3, username: 'dwr.eth', display_name: 'Dan Romero', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/99ecb9fe-d38b-4d97-af33-a8a8c2e89100/original' }, recent_activity: 'high', trending_score: 95 },
    { account: { fid: 2, username: 'v', display_name: 'Vitalik', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bd9c8b63-5b8f-4aa8-8495-0334306b92c2/original' }, recent_activity: 'high', trending_score: 98 },
    { account: { fid: 239, username: 'linda', display_name: 'Linda Xie', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/68b4b09e-58e3-4e39-9074-fe6b49a51c34/original' }, recent_activity: 'medium', trending_score: 87 }
  ];

  const handleFollow = async (fid: number, username: string) => {
    // Optimistic update
    setFollowedUsers(prev => new Set([...prev, fid]));
    
    try {
      await followMutation.mutateAsync({ fid, username });
    } catch (error) {
      // Rollback optimistic update on error
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(fid);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {fallbackAccounts.map((account: any, i: number) => (
        <motion.div
          key={account.account.fid}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between p-4 hover:bg-ink-raised rounded-xl transition-all duration-300 border border-transparent hover:border-ink-edge group"
          data-testid={`follow-suggestion-${i}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={account.account.pfp_url}
                alt={account.account.display_name}
                className="w-12 h-12 rounded-full border-2 border-ink-edge group-hover:border-accent-core transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gain rounded-full border-2 border-ink-surface" />
            </div>
            <div>
              <p className="text-primary font-bold text-sm group-hover:text-accent-bright transition-colors">{account.account.display_name}</p>
              <p className="text-secondary text-xs mt-0.5">@{account.account.username}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-accent-core/30 text-accent-bright hover:bg-accent-core/20 hover:border-accent-core hover:text-primary transition-all duration-300 hover:scale-105"
            data-testid={`follow-button-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFollow(account.account.fid, account.account.username);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            title={`Follow @${account.account.username}`}
            disabled={followMutation.isPending}
          >
{Array.from(followedUsers).includes(account.account.fid) ? 'Following' : 'Follow'}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// X-style Feed Post Card
function FeedPostCard({ cast, index }: { cast: TrendingCast; index: number }) {
  const { likeMutation, recastMutation, replyMutation } = useSocialMutations();
  const [likedCasts, setLikedCasts] = useState<Set<string>>(new Set());
  const [recastedCasts, setRecastedCasts] = useState<Set<string>>(new Set());

  const handleLike = async (castHash: string) => {
    setLikedCasts(prev => new Set([...prev, castHash]));
    try {
      await likeMutation.mutateAsync({ castHash });
    } catch (error) {
      setLikedCasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(castHash);
        return newSet;
      });
    }
  };

  const handleRecast = async (castHash: string) => {
    setRecastedCasts(prev => new Set([...prev, castHash]));
    try {
      await recastMutation.mutateAsync({ castHash });
    } catch (error) {
      setRecastedCasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(castHash);
        return newSet;
      });
    }
  };

  const handleReply = async (castHash: string) => {
    const replyText = prompt("Enter your reply:");
    if (replyText && replyText.trim()) {
      try {
        await replyMutation.mutateAsync({ castHash, replyText: replyText.trim() });
      } catch (error) {
        // Error handled by mutation onError
      }
    }
  };
  const formatTime = (timestamp: string) => {
    const now = Date.now();
    const castTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - castTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-ink-surface dark:bg-ink-surface backdrop-blur-xl border border-accent-core/30 rounded-xl p-5 sm:p-7 hover:bg-ink-raised dark:hover:bg-ink-raised hover:border-accent-core/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 cursor-pointer group relative overflow-hidden"
      data-testid={`feed-post-${index}`}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-ink-raised   dark:  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
      {/* Header */}
      <div className="flex items-start gap-4 sm:gap-5 mb-4 sm:mb-5 relative z-10">
        <div className="relative">
          <img
            src={cast.author.pfpUrl}
            alt={cast.author.displayName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-ink-edge dark:border-ink-edge shadow-lg ring-2 ring-purple-500/20 transition-all duration-300 group-hover:ring-purple-500/40 group-hover:scale-105"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ink-raised   rounded-full border-2 border-white dark:border-ink-surface animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="text-primary dark:text-primary font-bold text-base sm:text-lg truncate">{cast.author.displayName}</h4>
            <span className="text-secondary dark:text-secondary text-sm sm:text-base font-medium truncate">@{cast.author.username}</span>
            <span className="text-secondary dark:text-muted text-sm hidden sm:inline">·</span>
            <span className="text-secondary dark:text-secondary text-sm bg-ink-raised dark:bg-ink-raised px-2 py-1 rounded-full border border-ink-edge dark:border-ink-edge">{formatTime(cast.timestamp)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-secondary dark:text-secondary">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{(cast.author.followerCount || 0).toLocaleString()} followers</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-warn" />
              <span className="text-warn font-medium">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-5 sm:mb-6 relative z-10">
        <p className="text-primary dark:text-body leading-relaxed text-base sm:text-lg font-light tracking-wide">{cast.text}</p>
        {cast.embeds && cast.embeds.length > 0 && (
          <div className="mt-4 p-3 bg-ink-raised   dark: dark: rounded-xl border border-accent-core/30 dark:border-accent-core/20">
            <div className="flex items-center gap-2 text-accent-bright dark:text-accent-bright text-sm">
              <ExternalLink className="w-4 h-4" />
              <span>Contains {cast.embeds.length} embedded link{cast.embeds.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Engagement */}
      <div className="flex items-center justify-between pt-4 border-t border-gradient-    relative z-10">
        <div className="flex items-center gap-6 sm:gap-8">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleReply(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className="flex items-center gap-2 text-secondary dark:text-secondary hover:text-accent-bright dark:hover:text-accent-bright hover:bg-accent-core/10 px-3 py-2 rounded-full transition-all duration-300 hover:scale-105"
            data-testid={`reply-button-${cast.hash}`}
            title="Reply to this cast"
            disabled={replyMutation.isPending}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{cast.replies}</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleRecast(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 rounded-full hover:scale-105 ${
Array.from(recastedCasts).includes(cast.hash) || cast.isRecasted
                ? 'text-gain dark:text-gain bg-gain/10' 
                : 'text-secondary dark:text-secondary hover:text-gain dark:hover:text-gain hover:bg-gain/10'
            }`}
            data-testid={`recast-button-${cast.hash}`}
            title="Recast this"
            disabled={recastMutation.isPending}
          >
            <Repeat2 className="w-4 h-4" />
            <span className="text-sm font-medium">{cast.recasts}</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 rounded-full hover:scale-105 ${
Array.from(likedCasts).includes(cast.hash) || cast.isLiked
                ? 'text-loss dark:text-loss bg-red-500/10' 
                : 'text-secondary dark:text-secondary hover:text-loss dark:hover:text-loss hover:bg-red-500/10'
            }`}
            data-testid={`like-button-${cast.hash}`}
            title="Like this cast"
            disabled={likeMutation.isPending}
          >
            <Heart className={`w-4 h-4 ${Array.from(likedCasts).includes(cast.hash) || cast.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{cast.likes}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-secondary dark:text-secondary bg-ink-raised dark:bg-ink-raised px-2 py-1 rounded-full border border-ink-edge dark:border-ink-edge">
            {cast.engagement} views
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const farcasterUrl = `https://warpcast.com/~/conversations/${cast.hash}`;
              window.open(farcasterUrl, '_blank', 'noopener,noreferrer');
            }}
            className="text-secondary dark:text-secondary hover:text-primary dark:hover:text-primary hover:bg-ink-raised dark:hover:bg-ink-surface/10 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 sm:opacity-100 hover:scale-110"
            data-testid={`external-link-${cast.hash}`}
            title="View on Farcaster"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// Compact Trending Topics Section (Legacy - keeping for backward compatibility)
function TrendingTopics() {
  const { data: trendsData } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 30 * 1000, // 30 seconds for live updates
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
    retry: 3
  });

  const trends = (trendsData as any)?.topics?.slice(0, 4) || [
    { topic: 'Bitcoin ETF', mentions: 247 },
    { topic: 'DePIN', mentions: 189 },
    { topic: 'L2 scaling', mentions: 156 },
    { topic: 'Base chain', mentions: 134 }
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {trends.map((trend: any, i: number) => (
        <motion.div
          key={trend.topic}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Badge 
            variant="secondary" 
            className="text-xs px-3 py-1.5 bg-ink-raised text-secondary hover:bg-ink-surface cursor-pointer transition-all border border-ink-edge backdrop-blur-sm"
            data-testid={`trend-topic-${i}`}
          >
            <span className="text-secondary mr-1">#{i + 1}</span>
            {trend.topic}
            <span className="text-muted ml-2 text-[10px]">{trend.mentions}</span>
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

// Compact Prominent Accounts Rail
function ProminentAccountsRail() {
  const [selectedFid, setSelectedFid] = useState<number | null>(null);
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['/api/top-accounts'],
    staleTime: 60 * 1000, // 1 minute for live account updates
    refetchInterval: 90 * 1000, // Refresh every 90 seconds
    retry: 3
  });

  // Fallback accounts for when API fails to ensure prominent figures are always shown
  const fallbackAccounts = [
    { account: { fid: 3, username: 'dwr.eth', display_name: 'Dan Romero', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/99ecb9fe-d38b-4d97-af33-a8a8c2e89100/original' }, recent_activity: 'high', trending_score: 95 },
    { account: { fid: 2, username: 'v', display_name: 'Vitalik', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bd9c8b63-5b8f-4aa8-8495-0334306b92c2/original' }, recent_activity: 'high', trending_score: 98 },
    { account: { fid: 239, username: 'linda', display_name: 'Linda Xie', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/68b4b09e-58e3-4e39-9074-fe6b49a51c34/original' }, recent_activity: 'medium', trending_score: 87 },
    { account: { fid: 451, username: 'jessepollak', display_name: 'Jesse Pollak', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/99ecb9fe-d38b-4d97-af33-a8a8c2e89100/original' }, recent_activity: 'high', trending_score: 91 },
    { account: { fid: 193, username: 'elonmusk', display_name: 'Balaji', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bd9c8b63-5b8f-4aa8-8495-0334306b92c2/original' }, recent_activity: 'medium', trending_score: 89 },
    { account: { fid: 6806, username: 'aave.eth', display_name: 'Aave Labs', pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/68b4b09e-58e3-4e39-9074-fe6b49a51c34/original' }, recent_activity: 'medium', trending_score: 83 }
  ];

  const accounts = (accountsData as any)?.accounts?.length > 0 ? (accountsData as any).accounts : fallbackAccounts;

  if (isLoading) {
    return (
      <div className="flex gap-2 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-ink-raised animate-pulse">
            <div className="w-6 h-6 bg-ink-raised rounded-full" />
            <div className="h-3 bg-ink-raised rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {accounts.slice(0, 8).map((account: any, index: number) => {
        const activityColor = account.recent_activity === 'high' ? 'text-gain' : 
                            account.recent_activity === 'medium' ? 'text-warn' : 'text-muted';
        const isSelected = selectedFid === account.account.fid;
        
        return (
          <motion.button
            key={account.account.fid}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-all whitespace-nowrap ${
              isSelected 
                ? 'bg-accent-core/10 dark:bg-accent-core/10 border-accent-core dark:border-accent-deep' 
                : 'bg-ink-surface hover:bg-ink-raised'
            }`}
            onClick={() => setSelectedFid(isSelected ? null : account.account.fid)}
            data-testid={`account-pill-${account.account.fid}`}
          >
            <img
              src={account.account.pfp_url}
              alt={account.account.display_name}
              className="w-6 h-6 rounded-full border"
            />
            <span className="text-sm font-medium">
              {account.account.display_name || account.account.username}
            </span>
            <div className={`w-2 h-2 rounded-full ${activityColor}`} />
            {account.trending_score > 80 && <Star className="w-3 h-3 text-warn" />}
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact Cast Item for landing page alpha maximization
function CompactCastItem({ cast, index }: { cast: TrendingCast; index: number }) {
  const formatTime = (timestamp: string) => {
    const now = Date.now();
    const castTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - castTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTrendingIndicator = (cast: TrendingCast) => {
    if (cast.engagement > 100) return { icon: Flame, color: 'text-loss', label: 'Hot' };
    if (cast.engagement > 50) return { icon: TrendingUp, color: 'text-warn', label: 'Trending' };
    if (cast.likes > 10) return { icon: ArrowUp, color: 'text-gain', label: 'Rising' };
    return null;
  };

  const trendingInfo = getTrendingIndicator(cast);
  const isHighEngagement = cast.engagement > 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3 border-l-2 hover:bg-ink-raised transition-colors cursor-pointer ${
        isHighEngagement ? 'border-l-warn bg-warn/10 dark:bg-warn/10' : 'border-l-transparent'
      }`}
      data-testid={`compact-cast-${cast.hash}`}
    >
      <div className="flex gap-3">
        {/* Author Avatar - smaller for space efficiency */}
        <img
          src={cast.author.pfpUrl}
          alt={cast.author.displayName}
          className="w-8 h-8 rounded-full flex-shrink-0 border"
        />
        
        <div className="flex-1 min-w-0">
          {/* Header - author info and trending indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{cast.author.displayName}</span>
            <span className="text-xs text-muted">@{cast.author.username}</span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">{formatTime(cast.timestamp)}</span>
            {trendingInfo && (
              <div className={`flex items-center gap-1 ${trendingInfo.color}`}>
                <trendingInfo.icon className="w-3 h-3" />
                <span className="text-xs font-medium">{trendingInfo.label}</span>
              </div>
            )}
          </div>

          {/* Cast Content - truncated for space efficiency */}
          <p className="text-sm text-body mb-2 line-clamp-2 leading-relaxed">
            {cast.text}
          </p>

          {/* Engagement metrics - compact horizontal layout */}
          <div className="flex items-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{formatCount(cast.replies)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat2 className="w-3 h-3" />
              <span>{formatCount(cast.recasts)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{formatCount(cast.likes)}</span>
            </div>
            {cast.embeds && cast.embeds.length > 0 && (
              <div className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span>{cast.embeds.length}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatCount(cast.engagement)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Quick Stats Summary for Alpha Information
function QuickStats() {
  const { data: statsData } = useQuery({
    queryKey: ['/api/crypto-stats'],
    staleTime: 60 * 1000, // 1 minute for live crypto stats
    refetchInterval: 75 * 1000, // Refresh every 75 seconds
    retry: 3
  });

  const stats = (statsData as any)?.stats || {
    activeCommunities: 142,
    topInfluencers: 89,
    dailyConversations: 2847,
    trendingTopics: 12
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {Object.entries({
        'Communities': { value: stats.activeCommunities, icon: Users },
        'Influencers': { value: stats.topInfluencers, icon: Star },
        'Conversations': { value: stats.dailyConversations, icon: MessageSquare },
        'Topics': { value: stats.trendingTopics, icon: TrendingUp }
      }).map(([label, { value, icon: Icon }], i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="text-center p-3 bg-ink-raised   dark: dark: rounded-xl border"
          data-testid={`stat-${label.toLowerCase()}`}
        >
          <Icon className="w-4 h-4 mx-auto mb-1 text-accent-bright dark:text-accent-bright" />
          <div className="text-lg font-bold text-body">{value.toLocaleString()}</div>
          <div className="text-xs text-muted">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'following'>('trending');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Fetch trending casts for main feed
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['/api/trending', selectedTopic],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '12' });
      if (selectedTopic) params.append('topic', selectedTopic);
      return fetch(`/api/trending?${params}`).then(res => res.json());
    },
    staleTime: 30 * 1000, // 30 seconds for live content updates
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
    retry: 3
  });

  const allCasts = trendingData?.items || [];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-transparent">
      {/* Header Section - X-style */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <SectionTitle as="h1">
            Discover
          </SectionTitle>
          <p className="mt-2 text-secondary">Stay updated with the latest in crypto conversations</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-4 border-b border-ink-edge dark:border-ink-edge">
          {(['trending', 'for-you', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors capitalize relative ${
                activeTab === tab
                  ? 'text-primary dark:text-primary'
                  : 'text-secondary dark:text-secondary hover:text-primary dark:hover:text-secondary'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-raised  "
                />
              )}
            </button>
          ))}
        </div>

        {/* Topic Filter Chips */}
        <TrendingTopicsFilter selectedTopic={selectedTopic} onTopicSelect={setSelectedTopic} />
      </div>

      {/* Two-Column Layout - Mobile Optimized */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 order-1">
          <DiscoverFeed 
            casts={allCasts} 
            isLoading={isLoading} 
            error={error} 
            activeTab={activeTab}
            selectedTopic={selectedTopic}
          />
        </div>

        {/* Right Rail - Hidden on mobile to save space */}
        <div className="lg:col-span-1 hidden lg:block order-2">
          <DiscoverRightRail />
        </div>
      </div>
    </section>
  );
}