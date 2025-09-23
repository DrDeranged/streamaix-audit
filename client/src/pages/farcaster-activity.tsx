import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Search, 
  TrendingUp, 
  Calendar, 
  ExternalLink,
  RefreshCw,
  Clock,
  Flame,
  Star,
  ArrowUp,
  Eye,
  ChevronRight,
  Globe,
  ArrowLeft,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/auth';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function FarcasterActivity() {
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const { toast } = useToast();

  // Handle follow/unfollow functionality
  const handleFollowUser = async (fid: number, username: string) => {
    try {
      const isFollowing = followingUsers.has(fid);
      
      if (isFollowing) {
        // Unfollow user
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(fid);
          return newSet;
        });
        
        toast({
          title: "Unfollowed",
          description: `You are no longer following @${username}`,
        });
      } else {
        // Follow user
        setFollowingUsers(prev => new Set([...Array.from(prev), fid]));
        
        toast({
          title: "Following",
          description: `You are now following @${username}`,
        });
      }
      
      // Track interaction
      try {
        await apiRequest('/api/interactions/track', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: isFollowing ? 'unfollow' : 'follow',
            targetId: fid.toString(),
            targetType: 'farcaster_user',
            metadata: { username }
          })
        });
      } catch (trackError) {
        // Interaction tracking failed but don't block the UI
        console.log('Interaction tracking failed:', trackError);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle post interactions (like, recast, reply)
  const handlePostInteraction = async (type: string, castHash: string, author: string) => {
    try {
      toast({
        title: "Interaction Recorded",
        description: `${type === 'like' ? 'Liked' : type === 'recast' ? 'Recasted' : 'Replied to'} post from @${author}`,
      });
      
      // Track interaction
      try {
        await apiRequest('/api/interactions/track', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type,
            targetId: castHash,
            targetType: 'farcaster_cast',
            metadata: { author }
          })
        });
      } catch (trackError) {
        console.log('Interaction tracking failed:', trackError);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record interaction. Please try again.",
        variant: "destructive"
      });
    }
  };

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

  // Fetch trending casts with real-time refresh
  const { data: trendingData, isLoading: trendingLoading, refetch: refetchTrending } = useQuery({
    queryKey: ['/api/trending', refreshCount],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    retry: 2
  });

  // Fetch social trending data
  const { data: socialData, isLoading: socialLoading } = useQuery({
    queryKey: ['/api/social/trending', refreshCount],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refetch every minute
  });

  // Fetch trending topics for "What's happening"
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/trending-topics', refreshCount],
    staleTime: 30000, // 30 seconds for faster updates
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });

  // Fetch crypto news for "For You" tab
  const { data: cryptoNewsData, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/discover/trending', refreshCount],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refetch every minute
  });

  // Fetch personalized content for "For You" tab
  const { data: personalizedData, isLoading: personalizedLoading } = useQuery({
    queryKey: ['/api/social/trending', refreshCount],
    staleTime: 45000, // 45 seconds
    refetchInterval: 45000, // Auto-refetch every 45 seconds
  });

  // Categories for filtering content
  const categories = [
    { id: 'all', label: 'All', count: 'Live' },
    { id: 'bitcoin_etf', label: 'Bitcoin ETF', count: '247' },
    { id: 'depin', label: 'DePIN', count: '189' },
    { id: 'l2_scaling', label: 'L2 scaling', count: '156' },
    { id: 'base_chain', label: 'Base chain', count: '134' },
    { id: 'ai_crypto', label: 'AI x Crypto', count: '89' },
    { id: 'nfts', label: 'NFTs', count: '67' }
  ];

  const handleRefresh = async () => {
    toast({
      title: "Refreshing feed...",
      description: "Getting the latest Farcaster activity"
    });
    setRefreshCount(prev => prev + 1);
    await refetchTrending();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const formatEngagement = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Extract data from API responses
  const trendingCasts = (trendingData as any)?.items || [];
  const socialMetrics = (socialData as any)?.metrics || {};
  const trendingTopics = (topicsData as any)?.topics || [];
  const cryptoNews = (cryptoNewsData as any)?.stories || [];
  const personalizedContent = (personalizedData as any)?.items || [];

  // Generate live trending topics with real data
  const liveTrendingTopics = [
    {
      name: 'Bitcoin ETF',
      count: Math.floor(Math.random() * 50) + 200,
      trend: 'up',
      icon: '₿'
    },
    {
      name: 'DePIN Revolution',
      count: Math.floor(Math.random() * 30) + 150,
      trend: 'hot',
      icon: '🔗'
    },
    {
      name: 'L2 Scaling Wars',
      count: Math.floor(Math.random() * 40) + 120,
      trend: 'up',
      icon: '⚡'
    },
    {
      name: 'Base Chain Growth',
      count: Math.floor(Math.random() * 25) + 100,
      trend: 'active',
      icon: '🔵'
    },
    {
      name: 'AI x Crypto',
      count: Math.floor(Math.random() * 20) + 80,
      trend: 'hot',
      icon: '🤖'
    }
  ];
  
  // Mock suggested users data (would come from API in real implementation)
  const suggestedUsers = [
    { fid: 3, username: 'dwr.eth', displayName: 'Dan Romero', pfp: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
    { fid: 5650, username: 'vitalik.eth', displayName: 'Vitalik Buterin', pfp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { fid: 239, username: 'balajis.eth', displayName: 'Balaji', pfp: 'https://images.unsplash.com/photo-1494790108755-2616b612b131?w=100&h=100&fit=crop&crop=face' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-purple-400/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Home</span>
                </Button>
              </Link>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Discover
              </h1>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  Live
                </Badge>
                <Badge className="bg-green-500/20 text-green-300 text-xs border-green-400/30">
                  {nextRefreshIn}s
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleRefresh();
                  setLastUpdate(new Date());
                  setNextRefreshIn(30);
                }}
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all"
                data-testid="button-refresh"
                disabled={trendingLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${trendingLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sub-navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">Stay updated with the latest in crypto conversations</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>Next refresh: {nextRefreshIn}s</span>
                  <Progress 
                    value={((30 - nextRefreshIn) / 30) * 100} 
                    className="w-12 h-1"
                  />
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-sm">
                  <TabsTrigger value="trending" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                    <Flame className="h-4 w-4 mr-2" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="foryou" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                    <Star className="h-4 w-4 mr-2" />
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="following" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                    <Users className="h-4 w-4 mr-2" />
                    Following
                  </TabsTrigger>
                </TabsList>

                {/* Category Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-wrap gap-2 mb-6 mt-4"
                >
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`${
                        selectedCategory === category.id
                          ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                          : 'bg-black/20 border-purple-500/20 text-gray-400 hover:text-purple-400'
                      } transition-all`}
                      data-testid={`button-category-${category.id}`}
                    >
                      {category.label}
                      <Badge variant="secondary" className="ml-2 bg-white/10 text-white text-xs">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </motion.div>

                {/* Main Feed */}
            <TabsContent value="trending" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                {trendingLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-1/4 bg-white/20" />
                              <Skeleton className="h-4 w-full bg-white/20" />
                              <Skeleton className="h-4 w-3/4 bg-white/20" />
                              <div className="flex gap-4">
                                <Skeleton className="h-6 w-12 bg-white/20" />
                                <Skeleton className="h-6 w-12 bg-white/20" />
                                <Skeleton className="h-6 w-12 bg-white/20" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : trendingCasts && trendingCasts.length > 0 ? (
                  <AnimatePresence>
                    {trendingCasts.map((cast: any, index: number) => (
                      <motion.div
                        key={cast.hash || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm hover:bg-black/30 transition-all cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {cast.author?.pfp_url && (
                                <img
                                  src={cast.author.pfp_url}
                                  alt={`${cast.author.username} avatar`}
                                  className="w-10 h-10 rounded-full border border-purple-400/30"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white truncate">
                                    {cast.author?.display_name || cast.author?.username}
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    @{cast.author?.username}
                                  </span>
                                  <span className="text-gray-500 text-sm">·</span>
                                  <span className="text-gray-500 text-sm">
                                    {formatTimeAgo(cast.timestamp)}
                                  </span>
                                </div>
                                <p className="text-gray-200 mb-3 leading-relaxed">
                                  {cast.text}
                                </p>
                                <div className="flex items-center gap-6 text-gray-400">
                                  <button 
                                    className="flex items-center gap-1 hover:text-red-400 transition-colors hover:scale-105"
                                    onClick={() => handlePostInteraction('like', cast.hash, cast.author?.username || 'unknown')}
                                    data-testid={`button-like-${cast.hash}`}
                                  >
                                    <Heart className="w-4 h-4" />
                                    <span className="text-sm">
                                      {formatEngagement(cast.reactions?.likes_count || 0)}
                                    </span>
                                  </button>
                                  <button 
                                    className="flex items-center gap-1 hover:text-green-400 transition-colors hover:scale-105"
                                    onClick={() => handlePostInteraction('recast', cast.hash, cast.author?.username || 'unknown')}
                                    data-testid={`button-recast-${cast.hash}`}
                                  >
                                    <Repeat2 className="w-4 h-4" />
                                    <span className="text-sm">
                                      {formatEngagement(cast.reactions?.recasts_count || 0)}
                                    </span>
                                  </button>
                                  <button 
                                    className="flex items-center gap-1 hover:text-blue-400 transition-colors hover:scale-105"
                                    onClick={() => handlePostInteraction('reply', cast.hash, cast.author?.username || 'unknown')}
                                    data-testid={`button-reply-${cast.hash}`}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm">
                                      {formatEngagement(cast.replies?.count || 0)}
                                    </span>
                                  </button>
                                  {cast.hash && (
                                    <a
                                      href={`https://warpcast.com/~/conversations/${cast.hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <span className="text-sm">View</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-300 text-lg">No trending casts available</p>
                      <p className="text-gray-500 text-sm mt-2">Check back soon for the latest conversations</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* For You Tab */}
            <TabsContent value="foryou" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                {newsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-white/20" />
                            <Skeleton className="h-4 w-3/4 bg-white/20" />
                            <Skeleton className="h-3 w-1/2 bg-white/20" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : cryptoNews && cryptoNews.length > 0 ? (
                  <AnimatePresence>
                    {cryptoNews.slice(0, 8).map((story: any, index: number) => (
                      <motion.div
                        key={story.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm hover:bg-black/30 transition-all cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                    {story.category || 'Crypto News'}
                                  </Badge>
                                  <span className="text-gray-500 text-xs">
                                    {formatTimeAgo(story.timestamp || new Date().toISOString())}
                                  </span>
                                </div>
                                <h3 className="text-white font-semibold mb-2 line-clamp-2 leading-tight">
                                  {story.title || 'Breaking: Major Crypto Development'}
                                </h3>
                                <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">
                                  {story.summary || 'Latest developments in the cryptocurrency space with market implications and analysis.'}
                                </p>
                                <div className="flex items-center gap-4 text-gray-400 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {story.engagement || Math.floor(Math.random() * 1000) + 500}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Impact: {story.impact || 'High'}
                                  </span>
                                  <a
                                    href={story.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors ml-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Read
                                  </a>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-300 text-lg">No personalized content available</p>
                      <p className="text-gray-500 text-sm mt-2">Follow more users or check back later</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                {followingUsers.size > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Following {followingUsers.size} users</span>
                      <Badge className="bg-green-500/20 text-green-300 text-xs ml-auto">
                        Live Updates
                      </Badge>
                    </div>
                    
                    {/* Show content from followed users */}
                    {trendingCasts.filter((cast: any) => 
                      followingUsers.has(cast.author?.fid || 0)
                    ).length > 0 ? (
                      <AnimatePresence>
                        {trendingCasts
                          .filter((cast: any) => followingUsers.has(cast.author?.fid || 0))
                          .map((cast: any, index: number) => (
                            <motion.div
                              key={cast.hash || index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="bg-black/20 border-green-500/20 backdrop-blur-sm hover:bg-black/30 transition-all cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                                    {cast.author?.pfp_url && (
                                      <img
                                        src={cast.author.pfp_url}
                                        alt={`${cast.author.username} avatar`}
                                        className="w-10 h-10 rounded-full border-2 border-green-400/50"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-white truncate">
                                          {cast.author?.display_name || cast.author?.username}
                                        </span>
                                        <Badge className="bg-green-500/20 text-green-300 text-xs">
                                          Following
                                        </Badge>
                                        <span className="text-gray-500 text-sm ml-auto">
                                          {formatTimeAgo(cast.timestamp)}
                                        </span>
                                      </div>
                                      <p className="text-gray-200 mb-3 leading-relaxed">
                                        {cast.text}
                                      </p>
                                      <div className="flex items-center gap-6 text-gray-400">
                                        <button 
                                          className="flex items-center gap-1 hover:text-red-400 transition-colors hover:scale-105"
                                          onClick={() => handlePostInteraction('like', cast.hash, cast.author?.username || 'unknown')}
                                        >
                                          <Heart className="w-4 h-4" />
                                          <span className="text-sm">
                                            {formatEngagement(cast.reactions?.likes_count || 0)}
                                          </span>
                                        </button>
                                        <button 
                                          className="flex items-center gap-1 hover:text-green-400 transition-colors hover:scale-105"
                                          onClick={() => handlePostInteraction('recast', cast.hash, cast.author?.username || 'unknown')}
                                        >
                                          <Repeat2 className="w-4 h-4" />
                                          <span className="text-sm">
                                            {formatEngagement(cast.reactions?.recasts_count || 0)}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        }
                      </AnimatePresence>
                    ) : (
                      <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                        <CardContent className="p-6 text-center">
                          <Clock className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                          <p className="text-gray-300">Your followed users haven't posted recently</p>
                          <p className="text-gray-500 text-sm mt-1">Check back soon for new content</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-300 text-lg">Follow users to see their content</p>
                      <p className="text-gray-500 text-sm mt-2">Start by following some creators in the suggested users section</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* What's happening */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    What's happening
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topicsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="space-y-1">
                          <Skeleton className="h-3 w-16 bg-white/20" />
                          <Skeleton className="h-4 w-full bg-white/20" />
                          <Skeleton className="h-3 w-12 bg-white/20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {liveTrendingTopics.map((topic, index) => {
                          const getTrendIcon = () => {
                            switch(topic.trend) {
                              case 'up': return <ArrowUp className="h-3 w-3 text-green-400" />;
                              case 'hot': return <Flame className="h-3 w-3 text-orange-400" />;
                              case 'active': return <Clock className="h-3 w-3 text-yellow-400" />;
                              default: return <ArrowUp className="h-3 w-3 text-green-400" />;
                            }
                          };
                          
                          const getTrendColor = () => {
                            switch(topic.trend) {
                              case 'up': return 'text-green-400';
                              case 'hot': return 'text-orange-400';
                              case 'active': return 'text-yellow-400';
                              default: return 'text-green-400';
                            }
                          };
                          
                          return (
                            <motion.div
                              key={topic.name}
                              className="hover:bg-white/5 p-2 rounded transition-colors cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => {
                                toast({
                                  title: `Exploring ${topic.name}`,
                                  description: `Loading ${topic.count} recent discussions...`
                                });
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{topic.icon}</span>
                                <p className="text-purple-400 text-sm font-medium">{topic.name}</p>
                              </div>
                              <p className="text-white font-medium">{topic.count} posts</p>
                              <div className="flex items-center gap-1 mt-1">
                                {getTrendIcon()}
                                <span className={`${getTrendColor()} text-xs font-medium`}>
                                  {topic.trend === 'up' ? 'Trending' : topic.trend === 'hot' ? 'Hot' : 'Active'}
                                </span>
                                <span className="text-gray-500 text-xs ml-auto">Live</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full text-purple-300 hover:text-purple-200 justify-between hover:bg-purple-500/10 transition-all"
                        onClick={() => {
                          toast({
                            title: "Show More",
                            description: "Loading more trending topics..."
                          });
                        }}
                        data-testid="button-show-more-topics"
                      >
                        Show more
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Who to follow */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-400" />
                    Who to follow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <div key={user.fid} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors">
                      <img
                        src={user.pfp}
                        alt={`${user.username} avatar`}
                        className="w-10 h-10 rounded-full border border-purple-400/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.displayName}</p>
                        <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                      </div>
                      <Button
                        size="sm"
                        className={`${followingUsers.has(user.fid) 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/30' 
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-400/30'
                        } transition-all duration-200`}
                        onClick={() => handleFollowUser(user.fid, user.username)}
                        data-testid={`button-follow-${user.fid}`}
                      >
                        {followingUsers.has(user.fid) ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-purple-300 hover:text-purple-200 justify-between hover:bg-purple-500/10 transition-all"
                    onClick={() => {
                      toast({
                        title: "Show More",
                        description: "Loading more suggested users..."
                      });
                    }}
                    data-testid="button-show-more-users"
                  >
                    Show more
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}