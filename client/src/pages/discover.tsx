import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Repeat2,
  Globe,
  DollarSign,
  BarChart3,
  Flame,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Filter,
  Search,
  Bell,
  Target,
  Users,
  Calendar,
  Newspaper,
  Video,
  RefreshCw,
  Sparkles,
  Brain
} from 'lucide-react';

// Types for market data
interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  category: 'crypto' | 'stock' | 'commodity';
  momentum: 'bullish' | 'bearish' | 'neutral';
}

interface TrendingStory {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceType: 'farcaster' | 'youtube' | 'news' | 'summary';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    score: number;
  };
  metadata: {
    publishedAt: string;
    author: string;
    tags: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    trendingScore: number;
  };
  url?: string;
  thumbnail?: string;
}

interface SectorData {
  name: string;
  performance: number;
  volume: number;
  assets: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: number;
}

export default function Discover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timeFilter, setTimeFilter] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [storyFilter, setStoryFilter] = useState<'all' | 'farcaster' | 'youtube' | 'news'>('all');
  const pageStartTime = useRef<number>(Date.now());

  // Interaction tracking mutation
  const trackInteraction = useMutation({
    mutationFn: async (interactionData: {
      interactionType: string;
      targetType?: string;
      targetId?: string;
      metadata?: any;
    }) => {
      if (!user) return; // Only track for logged-in users
      
      console.log('📡 Sending interaction tracking request:', interactionData);
      
      const response = await apiRequest('/api/interactions/track', {
        method: 'POST',
        body: JSON.stringify(interactionData)
      });
      
      console.log('✅ Interaction tracking response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Interaction tracked successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Failed to track interaction:', error);
    }
  });

  // Helper function to track interactions
  const trackUserInteraction = (
    interactionType: string,
    targetType?: string,
    targetId?: string,
    metadata?: any
  ) => {
    console.log(`🔍 Tracking interaction: ${interactionType} ${targetType}:${targetId}`, { user: !!user, metadata });
    
    if (user) {
      trackInteraction.mutate({
        interactionType,
        targetType,
        targetId,
        metadata
      });
    } else {
      console.warn('❌ User not authenticated - interaction not tracked');
    }
  };

  // Track page view on mount
  useEffect(() => {
    trackUserInteraction('view', 'page', 'discover', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    // Track time spent on page when leaving
    return () => {
      const timeSpent = Date.now() - pageStartTime.current;
      if (timeSpent > 5000) { // Only track if spent more than 5 seconds
        trackUserInteraction('time_spent', 'page', 'discover', {
          duration: timeSpent,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [user]);

  // Track time filter changes
  const handleTimeFilterChange = (period: '1h' | '6h' | '24h' | '7d') => {
    setTimeFilter(period);
    trackUserInteraction('filter_change', 'time_filter', period, {
      previousFilter: timeFilter,
      timestamp: new Date().toISOString()
    });
  };

  // Track sector clicks
  const handleSectorClick = (sectorName: string, sectorData: any) => {
    const newSelectedSector = selectedSector === sectorName ? null : sectorName;
    setSelectedSector(newSelectedSector);
    
    trackUserInteraction(
      newSelectedSector ? 'sector_click' : 'sector_unclick', 
      'sector', 
      sectorName,
      {
        sectorPerformance: sectorData.performance,
        sectorSentiment: sectorData.sentiment,
        sectorTrend: sectorData.trend,
        timestamp: new Date().toISOString()
      }
    );
  };

  // Track story clicks  
  const handleStoryClick = (story: any, action: 'view' | 'tag_click' = 'view') => {
    trackUserInteraction('story_click', 'story', story.id, {
      storyTitle: story.title,
      storySource: story.source,
      storySourceType: story.sourceType,
      storyEngagement: story.engagement,
      storySentiment: story.metadata.sentiment,
      storyTags: story.metadata.tags,
      action,
      selectedSector,
      timestamp: new Date().toISOString()
    });
  };

  // Market data queries
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/overview?timeFilter=${timeFilter}`],
    refetchInterval: 30000, // 30 seconds
  });

  const { data: trendingData } = useQuery({
    queryKey: [`/api/discover/trending?timeFilter=${timeFilter}&storyFilter=${storyFilter}`],
    refetchInterval: 45000, // 45 seconds
  });

  const { data: sectorsData } = useQuery({
    queryKey: [`/api/market/sectors?timeFilter=${timeFilter}`],
    refetchInterval: 60000, // 1 minute
  });

  const { data: socialData } = useQuery({
    queryKey: [`/api/social/trending`],
    refetchInterval: 30000,
  });

  // Phase 1: Market Pulse Data
  const marketMovers: MarketMover[] = (marketData as any)?.movers || [
    // Fallback data while loading
    { symbol: 'BTC', name: 'Bitcoin', price: 67420, change24h: 2.5, changePercent: 3.85, volume: 28000000000, category: 'crypto', momentum: 'bullish' },
    { symbol: 'ETH', name: 'Ethereum', price: 3780, change24h: -1.2, changePercent: -1.82, volume: 15000000000, category: 'crypto', momentum: 'bearish' },
    { symbol: 'MSTR', name: 'MicroStrategy', price: 245.80, change24h: 8.5, changePercent: 3.58, volume: 892000000, category: 'stock', momentum: 'bullish' },
  ];

  const trendingStories: TrendingStory[] = (trendingData as any)?.stories || [];
  const sectors: SectorData[] = (sectorsData as any)?.sectors || [];

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `$${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    return `$${volume.toFixed(0)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Navigation Header */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Discover
              </h1>
              
              {/* Time Filter Pills */}
              <div className="flex gap-2">
                {(['1h', '6h', '24h', '7d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimeFilterChange(period)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      timeFilter === period
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                    data-testid={`time-filter-${period}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button
                onClick={() => setLocation('/dashboard')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-dashboard"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Phase 1: Market Pulse Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Market Pulse
            </h2>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              Live
            </Badge>
          </div>

          {/* Market Movers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketMovers.slice(0, 6).map((mover) => (
              <Card key={mover.symbol} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{mover.symbol}</h3>
                      <p className="text-gray-400 text-sm">{mover.name}</p>
                    </div>
                    <Badge className={`${mover.momentum === 'bullish' ? 'bg-green-500/20 text-green-300' : 
                                     mover.momentum === 'bearish' ? 'bg-red-500/20 text-red-300' : 
                                     'bg-gray-500/20 text-gray-300'} border-0`}>
                      {mover.momentum === 'bullish' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                       mover.momentum === 'bearish' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                       <Activity className="h-3 w-3 mr-1" />}
                      {mover.momentum}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{formatPrice(mover.price)}</span>
                      <span className={`font-medium ${getChangeColor(mover.changePercent)}`}>
                        {mover.changePercent > 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Vol: {formatVolume(mover.volume)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Phase 2: Sector Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Sector Intelligence
            </h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              Real-time Correlations
            </Badge>
          </div>

          {/* Sector Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.slice(0, 6).map((sector) => (
              <Card 
                key={sector.name} 
                className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer ${
                  selectedSector === sector.name ? 'ring-2 ring-blue-400/50 border-blue-400/30' : ''
                }`}
                onClick={() => handleSectorClick(sector.name, sector)}
                data-testid={`sector-card-${sector.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{sector.name}</h3>
                    <div className="flex items-center gap-1">
                      {sector.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-400" /> :
                       sector.trend === 'down' ? <ArrowDown className="h-4 w-4 text-red-400" /> :
                       <Activity className="h-4 w-4 text-gray-400" />}
                      <span className={`text-sm font-medium ${getChangeColor(sector.performance)}`}>
                        {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Assets</span>
                      <span>{sector.assets}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Volume</span>
                      <span>{formatVolume(sector.volume)}</span>
                    </div>
                    
                    {/* Sentiment Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Sentiment</span>
                        <span>{Math.round(sector.sentiment * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            sector.sentiment > 0.6 ? 'bg-green-400' : 
                            sector.sentiment > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${sector.sentiment * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Phase 2: Enhanced Trending Stories Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Content Intelligence
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 ml-2">
                <Brain className="h-3 w-3 mr-1" />
                AI-Ranked
              </Badge>
            </h2>
            
            {/* Enhanced Story Type Filter */}
            <div className="flex gap-2">
              {([
                { key: 'all', label: 'All Sources', icon: Globe },
                { key: 'farcaster', label: 'Social', icon: MessageSquare },
                { key: 'youtube', label: 'Videos', icon: Video },
                { key: 'news', label: 'News', icon: Newspaper }
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStoryFilter(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    storyFilter === key
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  data-testid={`story-filter-${key}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Story Clustering Indicator */}
          {selectedSector && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">Sector Focus: {selectedSector}</h3>
                    <p className="text-gray-300 text-sm">Stories and discussions related to {selectedSector} sector</p>
                  </div>
                  <button
                    onClick={() => setSelectedSector(null)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phase 2: Smart Story Clustering */}
          <div className="space-y-4">
            {trendingStories.length > 0 ? (
              <>
                {/* Story clusters with enhanced ranking */}
                {trendingStories.slice(0, 12).map((story, index) => (
                  <Card 
                    key={story.id} 
                    className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer ${
                      index < 3 ? 'ring-1 ring-orange-400/30' : ''
                    }`}
                    onClick={() => handleStoryClick(story, 'view')}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {story.thumbnail && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={story.thumbnail} 
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Priority indicator for top stories */}
                              {index < 3 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Hot Trend #{index + 1}
                                  </Badge>
                                </div>
                              )}
                              
                              <h3 className="text-white font-semibold text-lg line-clamp-2">{story.title}</h3>
                              <p className="text-gray-300 text-sm mt-1 line-clamp-2">{story.description}</p>
                              
                              {/* Sector correlation indicator */}
                              {selectedSector && story.metadata.tags.some(tag => 
                                tag.toLowerCase().includes(selectedSector.toLowerCase())
                              ) && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 mt-2">
                                  <Target className="h-3 w-3 mr-1" />
                                  {selectedSector} Related
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                                <Star className="h-3 w-3 mr-1" />
                                {story.metadata.trendingScore}
                              </Badge>
                              
                              {/* Sentiment indicator */}
                              <Badge className={`${
                                story.metadata.sentiment === 'positive' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                story.metadata.sentiment === 'negative' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                'bg-gray-500/20 text-gray-300 border-gray-400/30'
                              }`}>
                                {story.metadata.sentiment === 'positive' ? '📈' :
                                 story.metadata.sentiment === 'negative' ? '📉' : '➖'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {story.source}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(story.metadata.publishedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {story.metadata.author}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {story.engagement.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {story.engagement.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {story.engagement.views}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {story.metadata.tags.slice(0, 4).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className={`text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 cursor-pointer ${
                                  selectedSector && tag.toLowerCase().includes(selectedSector.toLowerCase()) ?
                                  'border-blue-400/30 text-blue-300' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering story click
                                  handleStoryClick(story, 'tag_click');
                                  setSelectedSector(tag);
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load more indicator */}
                {trendingStories.length > 12 && (
                  <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-400/20 hover:bg-purple-500/20 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-purple-300">
                        <ChevronRight className="h-4 w-4" />
                        <span>Load {trendingStories.length - 12} more stories</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-300">Loading trending stories...</p>
                  <p className="text-gray-400 text-sm mt-2">Analyzing content intelligence across platforms...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4"
        >
          <Button
            onClick={() => setLocation('/create-summary')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            data-testid="button-create-summary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create AI Summary
          </Button>
          
          <Button
            onClick={() => setLocation('/farcaster-activity')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-social-activity"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Social Activity
          </Button>
          
          <Button
            onClick={() => setLocation('/defi-dashboard')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-defi-dashboard"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            DeFi Analytics
          </Button>
        </motion.div>
      </div>
    </div>
  );
}