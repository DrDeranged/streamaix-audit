import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageSquare,
  Heart,
  Repeat2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  X
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

interface AccountWithHighlight {
  account: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
  };
  highlightCast: TrendingCast | null;
}

function StoriesRail() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFid, setSelectedFid] = useState<number | null>(null);

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['/api/top-accounts'],
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const accounts = (accountsData as any)?.accounts || [];

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full mx-auto mb-2 animate-pulse" />
              <div className="h-3 bg-muted/40 rounded w-12 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 relative">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('left')}
            className="opacity-60 hover:opacity-100 h-8 w-8 p-0"
            data-testid="button-stories-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('right')}
            className="opacity-60 hover:opacity-100 h-8 w-8 p-0"
            data-testid="button-stories-right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {selectedFid && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFid(null)}
            className="text-muted-foreground hover:text-foreground text-sm"
            data-testid="button-clear-filter"
          >
            Show all
          </Button>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {accounts.map((item: AccountWithHighlight, index: number) => (
          <motion.div
            key={item.account.fid}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => setSelectedFid(selectedFid === item.account.fid ? null : item.account.fid)}
            data-testid={`story-account-${item.account.fid}`}
          >
            <div className="text-center">
              <div className={`relative w-16 h-16 mx-auto mb-3 rounded-full p-[2px] transition-all duration-300 ${
                selectedFid === item.account.fid 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                  : item.highlightCast 
                    ? 'bg-gradient-to-r from-green-400/60 to-blue-400/60 group-hover:from-green-400 group-hover:to-blue-400' 
                    : 'bg-gradient-to-r from-muted/40 to-muted/60 group-hover:from-muted/60 group-hover:to-muted/80'
              }`}>
                <img
                  src={item.account.pfp_url}
                  alt={item.account.display_name}
                  className="w-full h-full rounded-full object-cover"
                />
                {item.highlightCast && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <p className={`text-xs font-medium transition-colors ${
                selectedFid === item.account.fid ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {item.account.username.length > 8 ? `${item.account.username.slice(0, 8)}...` : item.account.username}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CastItem({ cast, onExpandThread }: { 
  cast: TrendingCast; 
  onExpandThread: (hash: string) => void;
}) {
  const formatTime = (timestamp: string) => {
    const now = Date.now();
    const castTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - castTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 bg-card/60 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300">
        <div className="space-y-4">
          {/* Author Info */}
          <div className="flex items-start gap-3">
            <img
              src={cast.author.pfpUrl}
              alt={cast.author.displayName}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{cast.author.displayName}</span>
                <span className="text-muted-foreground text-sm">@{cast.author.username}</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(cast.timestamp)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" />
                {formatFollowerCount(cast.author.followerCount)} followers
              </div>
            </div>
          </div>

          {/* Cast Content */}
          <div className="space-y-3">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {cast.text}
            </p>
            
            {/* Embeds */}
            {cast.embeds && cast.embeds.length > 0 && (
              <div className="space-y-2">
                {cast.embeds.map((embed, i) => (
                  <div key={i}>
                    {embed.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(embed.url, '_blank')}
                        className="h-8 text-xs"
                        data-testid={`link-embed-${i}`}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Link
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engagement */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button 
                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                onClick={() => onExpandThread(cast.hash)}
                data-testid={`button-replies-${cast.hash}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{cast.replies}</span>
              </button>
              <div className="flex items-center gap-1">
                <Repeat2 className="w-4 h-4" />
                <span>{cast.recasts}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{cast.likes}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ConversationThread({ hash, onClose }: { hash: string; onClose: () => void }) {
  const { data: threadData, isLoading } = useQuery({
    queryKey: ['/api/threads', hash],
    enabled: !!hash,
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/30 mt-4">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-muted/40 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/40 rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    );
  }

  const thread = threadData as any;
  const replies = thread?.replies || [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/30 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation ({replies.length} replies)
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            data-testid="button-close-thread"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {replies.length > 0 ? (
          <div className="space-y-4">
            {replies.slice(0, 5).map((reply: TrendingCast, i: number) => (
              <div key={reply.hash} className="flex gap-3">
                <img
                  src={reply.author.pfpUrl}
                  alt={reply.author.displayName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{reply.author.displayName}</span>
                    <span className="text-muted-foreground text-xs">@{reply.author.username}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{reply.text}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {reply.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3 h-3" />
                      {reply.recasts}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {replies.length > 5 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  +{replies.length - 5} more replies
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No replies yet</p>
        )}
      </Card>
    </motion.div>
  );
}

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [selectedFid, setSelectedFid] = useState<number | null>(null);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Fetch trending casts with infinite scroll
  const {
    data: trendingData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['/api/trending', selectedFid],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: '10',
        ...(selectedFid && { fid: selectedFid.toString() })
      });
      return fetch(`/api/trending?${params}`).then(res => res.json());
    },
    getNextPageParam: (lastPage, pages) => {
      const totalLoaded = pages.reduce((acc, page) => acc + (page.items?.length || 0), 0);
      return totalLoaded < 50 ? pages.length : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Intersection observer for infinite scroll
  const lastCastRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allCasts = trendingData?.pages.flatMap(page => page.items || []) || [];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Minimal header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-medium text-foreground mb-2">
            Crypto Conversations
          </h2>
          <p className="text-muted-foreground">
            What's happening in crypto right now
          </p>
        </motion.div>
      </div>

      {/* Stories Rail */}
      <StoriesRail />

      {/* Main Feed */}
      <div className="space-y-4">
        {isLoading && allCasts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 bg-card/40 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-muted/40 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted/40 rounded w-1/3 animate-pulse" />
                      <div className="h-4 bg-muted/30 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/30 rounded animate-pulse" />
                    <div className="h-4 bg-muted/20 rounded w-5/6 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center bg-card/40 backdrop-blur-sm">
            <p className="text-muted-foreground mb-4">
              Unable to load conversations right now
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              data-testid="button-retry-feed"
            >
              Try again
            </Button>
          </Card>
        ) : (
          <>
            {allCasts.map((cast, index) => (
              <div key={cast.hash}>
                <div ref={index === allCasts.length - 1 ? lastCastRef : null}>
                  <CastItem 
                    cast={cast} 
                    onExpandThread={(hash) => 
                      setExpandedThread(expandedThread === hash ? null : hash)
                    }
                  />
                </div>
                
                {/* Expanded Thread */}
                <AnimatePresence>
                  {expandedThread === cast.hash && (
                    <ConversationThread 
                      hash={cast.hash} 
                      onClose={() => setExpandedThread(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <Card className="p-6 text-center bg-card/40 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading more conversations...
                </div>
              </Card>
            )}

            {/* End of feed */}
            {!hasNextPage && allCasts.length > 0 && (
              <div className="text-center py-8">
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  You're all caught up
                </Badge>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}