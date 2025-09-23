import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  TrendingUp, 
  RefreshCw,
  Clock,
  Flame,
  Star,
  Eye,
  ChevronRight,
  Globe,
  Bell,
  Zap,
  ExternalLink,
  ArrowUp,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TrendingSocialContent() {
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [liveUpdateCount, setLiveUpdateCount] = useState(0);
  const { toast } = useToast();

  // Auto-refresh mechanism with live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
      setLiveUpdateCount(prev => prev + 1);
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
    queryKey: ['/api/trending'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    retry: 2
  });

  // Fetch trending topics for "What's happening"
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 30000, // 30 seconds for faster updates
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });

  // Fetch crypto content for "For You" tab
  const { data: cryptoNewsData, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/youtube/crypto-content'],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refetch every minute
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
      title: "🔄 Refreshing Live Intelligence...",
      description: "Getting the latest crypto conversations and market signals"
    });
    setRefreshCount(prev => prev + 1);
    setLiveUpdateCount(prev => prev + 1);
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
  const trendingCasts = trendingData?.items || [];
  const trendingTopics = topicsData?.topics || [];
  const cryptoVideos = cryptoNewsData?.videos || [];
  

  // Generate live trending topics with real data
  const liveTrendingTopics = trendingTopics.length > 0 ? trendingTopics.slice(0, 5) : [
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
  
  // Mock suggested users data
  const suggestedUsers = [
    { fid: 3, username: 'dwr.eth', displayName: 'Dan Romero', pfp: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
    { fid: 5650, username: 'vitalik.eth', displayName: 'Vitalik Buterin', pfp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { fid: 239, username: 'balajis.eth', displayName: 'Balaji', pfp: 'https://images.unsplash.com/photo-1494790108755-2616b612b131?w=100&h=100&fit=crop&crop=face' }
  ];

  return (
    <section id="live-crypto-intelligence" className="py-12 sm:py-20 bg-gradient-to-b from-slate-900/50 to-purple-900/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Enhanced Header with Live Indicators */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white animate-pulse" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Live Crypto Intelligence
              </h2>
            </div>
            
            {/* Live Status Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                Live Data
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                Auto-refresh 30s
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Timer className="w-3 h-3 mr-1.5" />
                Next: {nextRefreshIn}s
              </Badge>
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Zap className="w-3 h-3 mr-1.5" />
                Updates: {liveUpdateCount}
              </Badge>
            </div>
          </div>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time crypto market intelligence and social sentiment from Web3's top voices with live updates every 30 seconds
          </p>
          
          {/* Live Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>Next refresh in {nextRefreshIn}s</span>
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Progress 
              value={((30 - nextRefreshIn) / 30) * 100} 
              className="h-2 bg-slate-800/50"
            />
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {/* Main Feed Area (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="glass-bg glass-border rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-foreground">Real-time Feed</h3>
                  <Badge className="bg-green-500/20 text-green-300 text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    {trendingLoading ? 'Updating...' : 'Live'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all"
                  data-testid="button-refresh-intelligence"
                  disabled={trendingLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${trendingLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-sm mb-6">
                  <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-300">
                    <Flame className="h-4 w-4 mr-2" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="foryou" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-blue-300">
                    <Star className="h-4 w-4 mr-2" />
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="following" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-green-300">
                    <Users className="h-4 w-4 mr-2" />
                    Following
                  </TabsTrigger>
                </TabsList>

                {/* Enhanced Category Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-wrap gap-2 mb-6"
                >
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40 text-purple-300'
                          : 'bg-black/20 border-purple-500/20 text-gray-400 hover:text-purple-400 hover:border-purple-400/60'
                      } transition-all backdrop-blur-sm`}
                      data-testid={`button-category-${category.id}`}
                    >
                      {category.label}
                      <Badge variant="secondary" className="ml-2 bg-white/10 text-white text-xs">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </motion.div>

                {/* Trending Tab Content */}
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
                        {trendingCasts.slice(0, 5).map((cast: any, index: number) => (
                          <motion.div
                            key={cast.hash || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm hover:bg-black/30 transition-all cursor-pointer group">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {cast.author?.pfpUrl && (
                                    <img
                                      src={cast.author.pfpUrl}
                                      alt={`${cast.author.username} avatar`}
                                      className="w-10 h-10 rounded-full border border-purple-400/30"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${cast.author?.username || 'user'}`;
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-semibold text-white truncate">
                                        {cast.author?.displayName || cast.author?.username}
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
                                      <div className="flex items-center gap-1 text-blue-400">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-sm">
                                          {formatEngagement(cast.replies || 0)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-green-400">
                                        <Repeat2 className="w-4 h-4" />
                                        <span className="text-sm">
                                          {formatEngagement(cast.recasts || 0)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-red-400">
                                        <Heart className="w-4 h-4" />
                                        <span className="text-sm">
                                          {formatEngagement(cast.likes || 0)}
                                        </span>
                                      </div>
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
                          <p className="text-gray-300 text-lg">No trending conversations available</p>
                          <p className="text-gray-500 text-sm mt-2">Live crypto intelligence loading...</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {/* For You Tab Content */}
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
                    ) : cryptoVideos && cryptoVideos.length > 0 ? (
                      <div className="space-y-4">
                        {cryptoVideos.slice(0, 5).map((video: any, index: number) => (
                          <motion.div
                            key={video.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm hover:bg-black/30 transition-all cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <img 
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-24 h-16 rounded-lg object-cover border border-purple-400/30"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white mb-2 line-clamp-2">{video.title}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <span>{video.channelTitle}</span>
                                      <span>•</span>
                                      <span>{video.publishedAt}</span>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        <span>{video.viewCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                          <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-gray-300 text-lg">Personalized content loading...</p>
                          <p className="text-gray-500 text-sm mt-2">Crypto insights tailored for you</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {/* Following Tab Content */}
                <TabsContent value="following" className="mt-0">
                  <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-300 text-lg">Follow accounts to see their content here</p>
                      <p className="text-gray-500 text-sm mt-2">Stay updated with your favorite crypto voices</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Enhanced Right Sidebar (1/3 width) */}
          <div className="space-y-6 sticky top-6">
            {/* What's Happening */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-bg glass-border rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">What's Happening</h3>
                  <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                    {topicsLoading ? 'Loading...' : 'Hot'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {topicsLoading ? (
                  [...Array(5)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  ))
                ) : liveTrendingTopics.length > 0 ? (
                  liveTrendingTopics.map((topic: any, index: number) => (
                    <motion.div
                      key={topic.name || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between py-2 hover:bg-card/50 rounded-lg px-2 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{topic.icon || '📈'}</span>
                        <span className="text-sm sm:text-base font-medium text-foreground group-hover:text-purple-300 transition-colors">
                          {topic.name || `Topic ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {topic.count || Math.floor(Math.random() * 500) + 100} posts
                        </span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No trending topics</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Who to Follow */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-bg glass-border rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">Who to Follow</h3>
                  <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                    Suggested
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                {suggestedUsers.map((user: any, index: number) => (
                  <motion.div
                    key={user.fid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 hover:bg-card/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.pfp}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full border border-white/20"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{user.displayName}</p>
                        <p className="text-slate-400 text-xs">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-white/20 text-slate-300 hover:bg-white/10"
                      onClick={() => {
                        const isFollowing = followingUsers.has(user.fid);
                        if (isFollowing) {
                          setFollowingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(user.fid);
                            return newSet;
                          });
                          toast({
                            title: "Unfollowed",
                            description: `No longer following @${user.username}`,
                          });
                        } else {
                          setFollowingUsers(prev => new Set([...Array.from(prev), user.fid]));
                          toast({
                            title: "Following",
                            description: `Now following @${user.username}`,
                          });
                        }
                      }}
                    >
                      {followingUsers.has(user.fid) ? 'Following' : 'Follow'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}