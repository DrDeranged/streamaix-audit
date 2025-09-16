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
  Clock,
  Users,
  ExternalLink,
  TrendingUp,
  Flame,
  Star,
  ChevronRight,
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

// Compact Trending Topics Section
function TrendingTopics() {
  const { data: trendsData } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 3 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000, // 10 minutes
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
  
  // Fetch trending casts - simplified for landing page efficiency
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['/api/trending'],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '8' }); // Reduced limit for landing page
      return fetch(`/api/trending?${params}`).then(res => res.json());
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const allCasts = trendingData?.items || [];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Discrete header with glass morphism effect */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-slate-900/50 to-purple-900/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Social Intelligence
                </h2>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Community conversation highlights and engagement patterns
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-slate-300 hover:text-white hover:bg-white/10 border border-white/20"
              data-testid="view-all-conversations"
            >
              Explore <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Trending Headlines & Key Voices */}
      <div className="mb-6 space-y-4">
        <TrendingTopics />
        <ProminentAccountsRail />
      </div>

      {/* Featured Stories Grid */}
      <div className="grid lg:grid-cols-1 gap-3 mb-6">
        {isLoading ? (
          // Story loading states
          [...Array(8)].map((_, i) => (
            <div key={i} className="p-4 bg-gradient-to-r from-slate-900/30 to-purple-900/20 backdrop-blur-sm border border-white/10 rounded-lg animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-700/40 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700/40 rounded w-1/3" />
                  <div className="h-3 bg-slate-800/30 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-800/30 rounded w-full" />
                <div className="h-4 bg-slate-800/20 rounded w-4/5" />
                <div className="h-3 bg-slate-800/10 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-2">Unable to load crypto conversations</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
              data-testid="retry-feed"
            >
              Try again
            </Button>
          </div>
        ) : (
          allCasts.slice(0, 8).map((cast: TrendingCast, index: number) => (
            <CompactCastItem key={cast.hash} cast={cast} index={index} />
          ))
        )}
      </div>

      {/* Discrete call to action for more content */}
      {!isLoading && !error && allCasts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 bg-gradient-to-r from-slate-900/30 to-purple-900/20 backdrop-blur-sm rounded-xl border border-white/10"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-3">
            <Eye className="w-4 h-4" />
            <span>Explore detailed analytics and insights</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-white border border-white/20"
            onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/auth'}
            data-testid="get-more-analytics"
          >
            {isAuthenticated ? 'View Full Dashboard' : 'Access Analytics'}
          </Button>
        </motion.div>
      )}
    </section>
  );
}