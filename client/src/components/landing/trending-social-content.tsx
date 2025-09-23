import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare,
  Heart,
  Repeat2,
  Clock,
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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          selectedTopic === null
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 border border-white/10'
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTopic === trend.topic
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 border border-white/10'
          }`}
          data-testid={`topic-${i}`}
        >
          {trend.topic}
          <span className="ml-2 text-xs opacity-70">{trend.mentions}</span>
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
          <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 animate-pulse">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700/40 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 sm:h-4 bg-slate-700/40 rounded w-1/3" />
                <div className="h-2 sm:h-3 bg-slate-800/30 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-slate-800/30 rounded w-full" />
              <div className="h-3 sm:h-4 bg-slate-800/20 rounded w-4/5" />
              <div className="h-2 sm:h-3 bg-slate-800/10 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl">
        <p className="text-slate-400 mb-4 text-sm sm:text-base">Unable to load conversations</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="border-white/20 text-slate-300 hover:bg-white/10"
          data-testid="retry-feed"
        >
          Try again
        </Button>
      </div>
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
            className="w-full sm:w-auto bg-slate-900/50 border-white/20 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-all"
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
            className="text-slate-400 hover:text-slate-300"
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
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-4">What's happening</h3>
        <TrendingTopicsWidget />
      </div>

      {/* Who to follow */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
        <WhoToFollowWidget />
      </div>
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
        title: "Error",
        description: "Failed to follow user",
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
        title: "Error",
        description: "Failed to like cast",
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
        title: "Error",
        description: "Failed to recast",
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
        title: "Error",
        description: "Failed to post reply",
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
          className="p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          data-testid={`trending-widget-${i}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{trend.topic}</p>
              <p className="text-slate-400 text-sm">{trend.mentions} posts</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
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
          className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors"
          data-testid={`follow-suggestion-${i}`}
        >
          <div className="flex items-center gap-3">
            <img
              src={account.account.pfp_url}
              alt={account.account.display_name}
              className="w-10 h-10 rounded-full border border-white/20"
            />
            <div>
              <p className="text-white font-medium text-sm">{account.account.display_name}</p>
              <p className="text-slate-400 text-xs">@{account.account.username}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-white/20 text-slate-300 hover:bg-white/10"
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
            {followedUsers.has(account.account.fid) ? 'Following' : 'Follow'}
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
      className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:bg-slate-900/70 transition-all cursor-pointer group"
      data-testid={`feed-post-${index}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <img
          src={cast.author.pfpUrl}
          alt={cast.author.displayName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-white font-semibold text-sm sm:text-base truncate">{cast.author.displayName}</h4>
            <span className="text-slate-400 text-xs sm:text-sm truncate">@{cast.author.username}</span>
            <span className="text-slate-500 text-xs sm:text-sm hidden sm:inline">·</span>
            <span className="text-slate-500 text-xs sm:text-sm">{formatTime(cast.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3 sm:mb-4">
        <p className="text-slate-200 leading-relaxed text-sm sm:text-base">{cast.text}</p>
      </div>

      {/* Engagement */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleReply(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className="flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-blue-400 transition-colors"
            data-testid={`reply-button-${cast.hash}`}
            title="Reply to this cast"
            disabled={replyMutation.isPending}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{cast.replies}</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleRecast(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className={`flex items-center gap-1 sm:gap-2 transition-colors ${
              recastedCasts.has(cast.hash) || cast.isRecasted
                ? 'text-green-400' 
                : 'text-slate-400 hover:text-green-400'
            }`}
            data-testid={`recast-button-${cast.hash}`}
            title="Recast this"
            disabled={recastMutation.isPending}
          >
            <Repeat2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{cast.recasts}</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike(cast.hash);
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(50);
              }
            }}
            className={`flex items-center gap-1 sm:gap-2 transition-colors ${
              likedCasts.has(cast.hash) || cast.isLiked
                ? 'text-red-400' 
                : 'text-slate-400 hover:text-red-400'
            }`}
            data-testid={`like-button-${cast.hash}`}
            title="Like this cast"
            disabled={likeMutation.isPending}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{cast.likes}</span>
          </button>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Open original cast in new tab
            const farcasterUrl = `https://warpcast.com/~/conversations/${cast.hash}`;
            window.open(farcasterUrl, '_blank', 'noopener,noreferrer');
          }}
          className="text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100 sm:group-hover:opacity-100"
          data-testid={`external-link-${cast.hash}`}
          title="View on Farcaster"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
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
            className="text-xs px-3 py-1.5 bg-gradient-to-r from-slate-800/50 to-purple-800/30 text-slate-300 hover:from-slate-700/60 hover:to-purple-700/40 cursor-pointer transition-all border border-white/10 backdrop-blur-sm"
            data-testid={`trend-topic-${i}`}
          >
            <span className="text-slate-400 mr-1">#{i + 1}</span>
            {trend.topic}
            <span className="text-slate-500 ml-2 text-[10px]">{trend.mentions}</span>
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
          <div key={i} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/20 animate-pulse">
            <div className="w-6 h-6 bg-muted/40 rounded-full" />
            <div className="h-3 bg-muted/40 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {accounts.slice(0, 8).map((account: any, index: number) => {
        const activityColor = account.recent_activity === 'high' ? 'text-green-500' : 
                            account.recent_activity === 'medium' ? 'text-yellow-500' : 'text-gray-400';
        const isSelected = selectedFid === account.account.fid;
        
        return (
          <motion.button
            key={account.account.fid}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all whitespace-nowrap ${
              isSelected 
                ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                : 'bg-background hover:bg-muted/50'
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
            {account.trending_score > 80 && <Star className="w-3 h-3 text-yellow-500" />}
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
    if (cast.engagement > 100) return { icon: Flame, color: 'text-red-500', label: 'Hot' };
    if (cast.engagement > 50) return { icon: TrendingUp, color: 'text-orange-500', label: 'Trending' };
    if (cast.likes > 10) return { icon: ArrowUp, color: 'text-green-500', label: 'Rising' };
    return null;
  };

  const trendingInfo = getTrendingIndicator(cast);
  const isHighEngagement = cast.engagement > 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3 border-l-2 hover:bg-muted/30 transition-colors cursor-pointer ${
        isHighEngagement ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : 'border-l-transparent'
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
            <span className="text-xs text-muted-foreground">@{cast.author.username}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatTime(cast.timestamp)}</span>
            {trendingInfo && (
              <div className={`flex items-center gap-1 ${trendingInfo.color}`}>
                <trendingInfo.icon className="w-3 h-3" />
                <span className="text-xs font-medium">{trendingInfo.label}</span>
              </div>
            )}
          </div>

          {/* Cast Content - truncated for space efficiency */}
          <p className="text-sm text-foreground mb-2 line-clamp-2 leading-relaxed">
            {cast.text}
          </p>

          {/* Engagement metrics - compact horizontal layout */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
          className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border"
          data-testid={`stat-${label.toLowerCase()}`}
        >
          <Icon className="w-4 h-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
          <div className="text-lg font-bold text-foreground">{value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'following'>('trending');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh mechanism with countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
      setLastUpdate(new Date());
      setNextRefreshIn(30); // Reset countdown
    }, 30000); // Refresh every 30 seconds

    // Countdown timer for next refresh
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return 30; // Reset when reaching 0
        }
        return prev - 1;
      });
    }, 1000); // Update every second

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);
  
  // Fetch trending casts for main feed
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['/api/trending', selectedTopic, refreshCount],
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
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section - X-style */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
            Live Crypto Intelligence
          </h2>
          <p className="text-slate-400 text-sm">Real-time market insights and social sentiment from Web3's top voices</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-ping"></div>
              Live Data
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
              Auto-refresh: 30s
            </Badge>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-4 border-b border-white/10">
          {(['trending', 'for-you', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors capitalize relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
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