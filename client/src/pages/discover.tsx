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
import CountdownTimer from '@/components/CountdownTimer';
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
  const timeFilter = '24h'; // Fixed to 24h only
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [storyFilter, setStoryFilter] = useState<'all' | 'farcaster' | 'youtube' | 'news'>('all');
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const pageStartTime = useRef<number>(Date.now());

  // Predictive analytics queries
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/analytics/recommendations'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: marketAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/analytics/market-alerts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: sectorPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/analytics/sector-trends', selectedSector || 'DeFi'],
    enabled: !!selectedSector,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  // Federal Reserve monitoring queries
  const { data: fedCommunications, isLoading: fedCommLoading } = useQuery({
    queryKey: ['/api/fed/communications'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: fedAnalytics, isLoading: fedAnalyticsLoading } = useQuery({
    queryKey: ['/api/fed/analytics'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  const { data: fedPolicyAlerts, isLoading: fedAlertsLoading } = useQuery({
    queryKey: ['/api/fed/policy-alerts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: fedCalendar, isLoading: fedCalendarLoading } = useQuery({
    queryKey: ['/api/fed/calendar'],
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });

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
    
    // Try to track interaction, but don't block functionality if it fails
    if (user) {
      try {
        trackInteraction.mutate({
          interactionType,
          targetType,
          targetId,
          metadata
        });
      } catch (error) {
        console.warn('⚠️ Failed to track interaction, continuing anyway:', error);
      }
    } else {
      console.log('ℹ️ User not authenticated - interaction logged locally only');
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
  // Removed time filter handler - now using fixed 24h period

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

  // Economic Calendar data queries
  const { data: economicCalendarData } = useQuery({
    queryKey: ['/api/market/economic-calendar?timeRange=30d&onlyUpcoming=true'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: highImpactEvents } = useQuery({
    queryKey: ['/api/market/high-impact-events'],
    refetchInterval: 120000, // 2 minutes
  });

  // On-chain Analytics queries
  const { data: whaleMovements, isLoading: whalesLoading } = useQuery({
    queryKey: ['/api/onchain/whale-movements?symbols=BTC,ETH,USDT,USDC&minAmount=1000000'],
    refetchInterval: 60000, // 1 minute for real-time whale data
  });

  const { data: exchangeFlows, isLoading: exchangeFlowsLoading } = useQuery({
    queryKey: ['/api/onchain/exchange-flows?exchanges=Binance,Coinbase,Kraken,OKX'],
    refetchInterval: 90000, // 1.5 minutes
  });

  const { data: networkMetrics, isLoading: networkLoading } = useQuery({
    queryKey: ['/api/onchain/network-metrics?networks=ethereum,bitcoin,binance_smart_chain'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: onChainAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/onchain/alerts?severity=all&limit=10'],
    refetchInterval: 30000, // 30 seconds for alerts
  });

  const { data: defiMetrics, isLoading: defiLoading } = useQuery({
    queryKey: ['/api/onchain/defi-metrics?protocols=Uniswap,Aave,Compound,MakerDAO'],
    refetchInterval: 180000, // 3 minutes
  });

  // Correlation Analysis queries
  const [correlationTimeframe, setCorrelationTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: correlationMatrix, isLoading: correlationLoading } = useQuery({
    queryKey: [`/api/correlation/matrix?timeframe=${correlationTimeframe}`],
    refetchInterval: 300000, // 5 minutes - correlations change slowly
    retry: 1
  });

  const { data: marketRegime, isLoading: regimeLoading } = useQuery({
    queryKey: ['/api/correlation/market-regime'],
    refetchInterval: 180000, // 3 minutes
    retry: 1
  });

  const { data: riskSentiment, isLoading: riskSentimentLoading } = useQuery({
    queryKey: [`/api/correlation/risk-sentiment?timeframe=${correlationTimeframe === '90d' ? '30d' : '7d'}`],
    refetchInterval: 120000, // 2 minutes
    retry: 1
  });

  const { data: correlationSummary, isLoading: correlationSummaryLoading } = useQuery({
    queryKey: [`/api/correlation/summary?timeframe=${correlationTimeframe}`],
    refetchInterval: 240000, // 4 minutes
    retry: 1
  });

  // Phase 1: Market Pulse Data
  // Enhanced market movers with priority levels and risk assessment
  const rawMarketMovers: MarketMover[] = (marketData as any)?.movers || [
    // Robust fallback data with priority levels
    { symbol: 'BTC', name: 'Bitcoin', price: 67420, change24h: 2.5, changePercent: 3.85, volume: 28000000000, category: 'crypto', momentum: 'bullish' },
    { symbol: 'ETH', name: 'Ethereum', price: 3780, change24h: -1.2, changePercent: -1.82, volume: 15000000000, category: 'crypto', momentum: 'bearish' },
    { symbol: 'MSTR', name: 'MicroStrategy', price: 245.80, change24h: 8.5, changePercent: 3.58, volume: 892000000, category: 'stock', momentum: 'bullish' },
    { symbol: 'SOL', name: 'Solana', price: 240.72, change24h: 3.2, changePercent: 1.42, volume: 4200000000, category: 'crypto', momentum: 'neutral' },
    { symbol: 'TSLA', name: 'Tesla', price: 426.07, change24h: 9.1, changePercent: 2.21, volume: 456000000, category: 'stock', momentum: 'bullish' },
    { symbol: 'HUT', name: 'Hut 8 Mining', price: 36.24, change24h: -1.8, changePercent: -3.05, volume: 89000000, category: 'stock', momentum: 'bearish' }
  ];

  const marketMovers = rawMarketMovers.map((mover: any, index: number) => ({
    ...mover,
    priority: Math.abs(mover.changePercent) > 5 ? 'critical' : Math.abs(mover.changePercent) > 2 ? 'high' : 'medium',
    urgencyScore: Math.abs(mover.changePercent) * 10,
    volatilityRisk: Math.abs(mover.changePercent) > 10 ? 'extreme' : Math.abs(mover.changePercent) > 5 ? 'high' : 'moderate',
    rank: index + 1
  }));

  // Enhanced trending stories with priority levels and AI ranking
  const rawTrendingStories: TrendingStory[] = (trendingData as any)?.stories || [
    // Fallback content when API returns empty due to rate limits
    {
      id: 'fallback-1',
      title: 'Bitcoin Hits New All-Time High as Institutional Adoption Accelerates',
      description: 'Major corporations continue to add Bitcoin to their treasury reserves, driving unprecedented price discovery.',
      source: 'CryptoNews',
      sourceType: 'news' as const,
      engagement: { likes: 1240, comments: 180, shares: 95, views: 15600, score: 8.7 },
      metadata: {
        publishedAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        author: 'Financial Analysis Team',
        tags: ['Bitcoin', 'Institutional', 'DeFi'],
        sentiment: 'positive' as const,
        trendingScore: 95
      },
      url: '#',
      thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop'
    },
    {
      id: 'fallback-2', 
      title: 'Layer 2 Solutions See Record Trading Volume This Week',
      description: 'Ethereum Layer 2 networks process over $2B in daily volume, showcasing scalability improvements.',
      source: 'DeFi Pulse',
      sourceType: 'news' as const,
      engagement: { likes: 890, comments: 120, shares: 65, views: 11200, score: 7.8 },
      metadata: {
        publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        author: 'Layer2 Research',
        tags: ['Layer2', 'Ethereum', 'Scaling'],
        sentiment: 'positive' as const,
        trendingScore: 88
      },
      url: '#'
    },
    {
      id: 'fallback-3',
      title: 'Gaming Tokens Rally as Metaverse Adoption Grows',
      description: 'Play-to-earn gaming platforms see surge in user activity and token values.',
      source: 'GameFi Weekly',
      sourceType: 'news' as const,
      engagement: { likes: 560, comments: 78, shares: 42, views: 8900, score: 6.9 },
      metadata: {
        publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        author: 'Gaming Analyst',
        tags: ['Gaming', 'Metaverse', 'NFT'],
        sentiment: 'positive' as const,
        trendingScore: 78
      },
      url: '#'
    }
  ];

  const trendingStories = rawTrendingStories.map((story: any, index: number) => ({
    ...story,
    priority: index < 3 ? 'critical' : index < 8 ? 'high' : index < 15 ? 'medium' : 'low',
    urgencyScore: Math.max(0, 100 - index * 5),
    relevanceScore: story.engagement?.score || 0,
    aiRank: index + 1,
    freshness: new Date().getTime() - new Date(story.metadata.publishedAt).getTime() < 3600000 ? 'fresh' : 'recent'
  }));
  const sectors: SectorData[] = (sectorsData as any)?.sectors || [
    // Robust fallback sector data with priority levels
    { 
      name: 'DeFi', 
      performance: +8.33, 
      assets: 245, 
      volume: 4830000000, 
      sentiment: 0.78, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 85
    },
    { 
      name: 'Layer 1', 
      performance: +5.21, 
      assets: 89, 
      volume: 5400000000, 
      sentiment: 0.71, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 82
    },
    { 
      name: 'Layer 2', 
      performance: +9.81, 
      assets: 156, 
      volume: 2680000000, 
      sentiment: 0.84, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 90
    },
    { 
      name: 'Gaming', 
      performance: -2.45, 
      assets: 67, 
      volume: 890000000, 
      sentiment: 0.45, 
      trend: 'down' as const,
      priority: 'medium',
      urgencyScore: 35
    },
    { 
      name: 'AI & Data', 
      performance: +12.67, 
      assets: 23, 
      volume: 1200000000, 
      sentiment: 0.92, 
      trend: 'up' as const,
      priority: 'critical',
      urgencyScore: 95
    },
    { 
      name: 'Memecoins', 
      performance: -8.55, 
      assets: 45, 
      volume: 670000000, 
      sentiment: 0.28, 
      trend: 'down' as const,
      priority: 'low',
      urgencyScore: 15
    }
  ];

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
              
              {/* Fixed to 24h display - no time filter buttons */}
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                24h View
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className={`border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all ${
                  showInsights ? 'bg-purple-500/20 border-purple-400' : ''
                }`}
                data-testid="button-toggle-insights"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
                {showInsights && <span className="ml-1 text-xs">⌄</span>}
                {!showInsights && <span className="ml-1 text-xs">⌃</span>}
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

      {/* Smart Insights Panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-sm border-b border-purple-500/20"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Personalized Recommendations */}
                <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      For You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendationsLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    ) : (recommendations as any)?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-300 hover:text-white transition-colors cursor-pointer">
                        <div className="font-medium text-white">{rec.title}</div>
                        <div className="text-gray-400 truncate">{rec.description}</div>
                        <div className="flex gap-1 mt-1">
                          {rec.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) || (
                      <div className="text-xs text-gray-400">
                        {user ? 'Building your recommendations...' : 'Sign in for personalized content'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Market Alerts */}
                <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-orange-300 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Smart Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertsLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ) : (marketAlerts as any)?.alerts?.slice(0, 3).map((alert: any, idx: number) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-400' :
                            alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                          }`}></div>
                          <span className="text-white font-medium">{alert.title}</span>
                        </div>
                        <div className="text-gray-400 truncate ml-4">{alert.message}</div>
                        {alert.probability && (
                          <div className="text-xs text-cyan-400 ml-4 mt-1">
                            {Math.round(alert.probability * 100)}% confidence
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-xs text-gray-400">No alerts at this time</div>
                    )}
                  </CardContent>
                </Card>

                {/* Sector Predictions */}
                <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSector ? (
                      <>
                        {predictionsLoading ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-3 bg-gray-700 rounded"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        ) : (sectorPredictions as any)?.predictions ? (
                          <div className="space-y-2">
                            <div className="text-xs">
                              <div className="text-white font-medium">{selectedSector} Outlook</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`text-lg font-bold ${
                                  (sectorPredictions as any)?.predictions?.prediction > 0 ? 'text-green-400' :
                                  (sectorPredictions as any)?.predictions?.prediction < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {(sectorPredictions as any)?.predictions?.prediction > 0 ? '+' : ''}
                                  {((sectorPredictions as any)?.predictions?.prediction * 100)?.toFixed(1) || '0.0'}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  {Math.round(((sectorPredictions as any)?.predictions?.confidence || 0) * 100)}% confidence
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {(sectorPredictions as any)?.predictions?.reasoning?.slice(0, 2).map((reason: string, idx: number) => (
                                <div key={idx} className="text-xs text-gray-400">• {reason}</div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Generating predictions...</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">Select a sector to see predictions</div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Phase 1: Market Pulse Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Market Pulse
            </h2>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              Live
            </Badge>
          </div>

          {/* Market Movers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {marketMovers.slice(0, 6).map((mover) => (
              <Card key={mover.symbol} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{mover.symbol}</h3>
                      <p className="text-gray-400 text-sm">{mover.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`${mover.momentum === 'bullish' ? 'bg-green-500/20 text-green-300' : 
                                       mover.momentum === 'bearish' ? 'bg-red-500/20 text-red-300' : 
                                       'bg-gray-500/20 text-gray-300'} border-0 text-xs`}>
                        {mover.momentum === 'bullish' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                         mover.momentum === 'bearish' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                         <Activity className="h-3 w-3 mr-1" />}
                        {mover.momentum}
                      </Badge>
                      <Badge className={`text-xs border-0 ${
                        (mover as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        (mover as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        (mover as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {(mover as any).priority === 'critical' ? '🚨' :
                         (mover as any).priority === 'high' ? '⚡' :
                         (mover as any).priority === 'medium' ? '📊' : '📈'}
                        {(mover as any).priority || 'low'}
                      </Badge>
                    </div>
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
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Sector Intelligence
            </h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              Real-time Correlations
            </Badge>
          </div>

          {/* Sector Performance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sectors.slice(0, 6).map((sector) => (
              <Card 
                key={sector.name} 
                className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer ${
                  selectedSector === sector.name ? 'ring-2 ring-blue-400/50 border-blue-400/30' : ''
                }`}
                onClick={() => handleSectorClick(sector.name, sector)}
                data-testid={`sector-card-${sector.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white font-semibold">{sector.name}</h3>
                      <Badge className={`text-xs border-0 w-fit ${
                        (sector as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        (sector as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        (sector as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {(sector as any).priority === 'critical' ? '🚨' :
                         (sector as any).priority === 'high' ? '⚡' :
                         (sector as any).priority === 'medium' ? '📊' : '📈'}
                        {(sector as any).priority || 'low'} Priority
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {sector.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-400" /> :
                         sector.trend === 'down' ? <ArrowDown className="h-4 w-4 text-red-400" /> :
                         <Activity className="h-4 w-4 text-gray-400" />}
                        <span className={`text-sm font-medium ${getChangeColor(sector.performance)}`}>
                          {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                        </span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                        Score: {(sector as any).urgencyScore || Math.round(Math.abs(sector.performance) * 10)}
                      </Badge>
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

        {/* On-Chain Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              On-Chain Analytics
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                🐋 Whale Activity
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                🏦 Exchange Flows
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                ⚡ Network Health
              </Badge>
            </div>
          </div>

          {/* On-Chain Alerts Banner */}
          {!alertsLoading && onChainAlerts?.alerts?.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-900/20 via-red-900/20 to-orange-900/20 border-orange-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-orange-300 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Live On-Chain Alerts
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    {onChainAlerts.alerts.filter((alert: any) => alert.severity === 'critical').length} Critical
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onChainAlerts.alerts.slice(0, 6).map((alert: any) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-black/30 rounded-lg p-4 border ${
                        alert.severity === 'critical' ? 'border-red-500/40' :
                        alert.severity === 'high' ? 'border-orange-500/40' :
                        'border-yellow-500/40'
                      }`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{alert.title}</h4>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">{alert.description}</p>
                        </div>
                        <Badge className={`text-xs ml-2 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-red-500/30 text-red-200' :
                          alert.severity === 'high' ? 'bg-orange-500/30 text-orange-200' :
                          'bg-yellow-500/30 text-yellow-200'
                        }`}>
                          {alert.severity === 'critical' ? '🚨' :
                           alert.severity === 'high' ? '⚡' : '⚠️'}
                          {alert.severity}
                        </Badge>
                      </div>
                      
                      {alert.amount_usd && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white font-medium">
                            {alert.amount_usd >= 1e9 ? `$${(alert.amount_usd / 1e9).toFixed(1)}B` :
                             alert.amount_usd >= 1e6 ? `$${(alert.amount_usd / 1e6).toFixed(1)}M` :
                             `$${(alert.amount_usd / 1e3).toFixed(1)}K`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        <span>{alert.token_symbol || 'Multiple'}</span>
                        <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main On-Chain Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Whale Movements */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  🐋 Whale Movements
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                    >$1M Transactions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {whalesLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-600 rounded w-24"></div>
                            <div className="h-3 bg-gray-700 rounded w-32"></div>
                          </div>
                          <div className="h-6 bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : whaleMovements?.whaleMovements?.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {whaleMovements.whaleMovements.slice(0, 8).map((whale: any) => (
                      <motion.div 
                        key={whale.transaction_hash || whale.hash}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                        data-testid={`whale-movement-${whale.transaction_hash || whale.hash}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              whale.whale_tier === 'mega' ? 'bg-red-400' :
                              whale.whale_tier === 'large' ? 'bg-orange-400' :
                              'bg-yellow-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-sm">
                                  {whale.token_symbol || 'ETH'}
                                </span>
                                <Badge className={`text-xs ${
                                  whale.transaction_type === 'buy' ? 'bg-green-500/20 text-green-300' :
                                  whale.transaction_type === 'sell' ? 'bg-red-500/20 text-red-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {whale.transaction_type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-400 font-mono">
                                {whale.whale_address ? `${whale.whale_address.slice(0, 6)}...${whale.whale_address.slice(-4)}` :
                                 whale.from ? `${whale.from.slice(0, 6)}...${whale.from.slice(-4)}` : 'Unknown'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-white font-bold text-sm">
                              {whale.amount_usd || whale.valueUsd ? 
                                `$${((whale.amount_usd || whale.valueUsd) / 1e6).toFixed(1)}M` : 
                                'Unknown'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {whale.timestamp ? new Date(whale.timestamp).toLocaleTimeString() : 'Recent'}
                            </div>
                          </div>
                        </div>
                        
                        {whale.exchange && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Exchange: {whale.exchange}</span>
                            {whale.gas_used && <span>Gas: {whale.gas_used} gwei</span>}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No whale movements detected</p>
                    <p className="text-xs">Monitoring transactions >$1M</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-green-300 flex items-center gap-2">
                  ⚡ Network Health
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {networkLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                        <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : networkMetrics?.networkStatus?.length > 0 ? (
                  <div className="space-y-4">
                    {networkMetrics.networkStatus.map((network: any) => (
                      <motion.div 
                        key={network.network}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 rounded-lg p-3"
                        data-testid={`network-${network.network.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold text-sm">{network.network}</h4>
                          <Badge className={`text-xs ${
                            network.congestionLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                            network.congestionLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {network.congestionLevel === 'low' ? '🟢' :
                             network.congestionLevel === 'medium' ? '🟡' : '🔴'}
                            {network.congestionLevel}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-gray-400">
                            <span>Gas (Fast):</span>
                            <span className="text-white">{network.gasPrice?.fast || 'N/A'} gwei</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Block Time:</span>
                            <span className="text-white">{network.blockTime || 'N/A'}s</span>
                          </div>
                          {network.tps_current && (
                            <div className="flex justify-between text-gray-400">
                              <span>TPS:</span>
                              <span className="text-white">{network.tps_current}</span>
                            </div>
                          )}
                        </div>

                        {/* Gas Price Bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                (network.gasPrice?.fast || 0) > 100 ? 'bg-red-400' :
                                (network.gasPrice?.fast || 0) > 50 ? 'bg-yellow-400' :
                                'bg-green-400'
                              }`}
                              style={{ 
                                width: `${Math.min(100, ((network.gasPrice?.fast || 0) / 150) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Globe className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Network data loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Exchange Flows */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                🏦 Exchange Flows
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                  24h Activity
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exchangeFlowsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-20 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : exchangeFlows?.exchangeFlows?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exchangeFlows.exchangeFlows.map((flow: any) => (
                    <motion.div 
                      key={flow.exchange_name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                      data-testid={`exchange-flow-${flow.exchange_name.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">{flow.exchange_name}</h4>
                        <Badge className={`text-xs ${
                          flow.net_flow_24h > 0 ? 'bg-green-500/20 text-green-300' :
                          flow.net_flow_24h < 0 ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {flow.net_flow_24h > 0 ? '📈 Inflow' :
                           flow.net_flow_24h < 0 ? '📉 Outflow' : '➡️ Neutral'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Net Flow:</span>
                          <span className={`font-medium ${
                            flow.net_flow_24h > 0 ? 'text-green-300' :
                            flow.net_flow_24h < 0 ? 'text-red-300' : 'text-white'
                          }`}>
                            {flow.net_flow_24h >= 1e6 ? `$${(Math.abs(flow.net_flow_24h) / 1e6).toFixed(1)}M` :
                             flow.net_flow_24h >= 1e3 ? `$${(Math.abs(flow.net_flow_24h) / 1e3).toFixed(1)}K` :
                             `$${Math.abs(flow.net_flow_24h || 0).toFixed(0)}`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-gray-400">
                          <span>Large TXs:</span>
                          <span className="text-white">{flow.large_transactions || 0}</span>
                        </div>

                        {flow.flow_change_percentage !== 0 && (
                          <div className="flex justify-between text-gray-400">
                            <span>24h Change:</span>
                            <span className={`${
                              flow.flow_change_percentage > 0 ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {flow.flow_change_percentage > 0 ? '+' : ''}{flow.flow_change_percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No exchange flow data available</p>
                  <p className="text-xs">Monitoring major exchanges</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Economic Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Economic Calendar
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 ml-2">
                <Bell className="h-3 w-3 mr-1" />
                Live Events
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                🔥 High Impact
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs">
                ⚡ Medium Impact
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                📊 Low Impact
              </Badge>
            </div>
          </div>

          {/* High Impact Events Row */}
          {(highImpactEvents as any)?.events?.length > 0 && (
            <Card className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border-red-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  High-Impact Events
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    Market Moving
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(highImpactEvents as any)?.events?.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{event.title}</h4>
                          <p className="text-gray-300 text-xs mt-1">{event.description}</p>
                        </div>
                        <Badge className="bg-red-500/30 text-red-200 text-xs ml-2 flex-shrink-0">
                          {event.impact.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Countdown Timer */}
                      <CountdownTimer 
                        targetDate={event.scheduledDate} 
                        isCompleted={event.isCompleted}
                        className="mb-3"
                      />
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.country}
                          </span>
                          <span>•</span>
                          <span>{event.source}</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Target className="h-3 w-3" />
                          <span>{event.marketRelevance}%</span>
                        </div>
                      </div>
                      
                      {event.relatedSymbols && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {event.relatedSymbols.slice(0, 3).map((symbol: string) => (
                            <Badge key={symbol} variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                              {symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Economic Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <Card className="lg:col-span-2 bg-black/40 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming Events
                  <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 ml-2">
                    Next 30 Days
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {(economicCalendarData as any)?.events?.length > 0 ? (
                  (economicCalendarData as any).events.slice(0, 8).map((event: any) => (
                    <div 
                      key={event.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5 ${
                        event.impact === 'high' ? 'border-red-500/30 bg-red-500/5' :
                        event.impact === 'medium' ? 'border-orange-500/30 bg-orange-500/5' :
                        'border-blue-500/30 bg-blue-500/5'
                      }`}
                      onClick={() => trackUserInteraction('economic_event_click', 'event', event.id, {
                        eventType: event.eventType,
                        impact: event.impact,
                        timeToEvent: event.timeToEvent
                      })}
                      data-testid={`economic-event-${event.id}`}
                    >
                      {/* Impact Indicator */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        event.impact === 'high' ? 'bg-red-400' :
                        event.impact === 'medium' ? 'bg-orange-400' :
                        'bg-blue-400'
                      }`}></div>
                      
                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{event.country}</span>
                              <span>•</span>
                              <span>{event.category.replace('_', ' ')}</span>
                              {event.forecast && (
                                <>
                                  <span>•</span>
                                  <span className="text-cyan-400">Est: {event.forecast}{event.unit || ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Mini Countdown */}
                          <CountdownTimer 
                            targetDate={event.scheduledDate} 
                            isCompleted={event.isCompleted}
                            compact={true}
                            className="ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Loading economic events...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Categories */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Event Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: 'fomc', label: 'FOMC Meetings', icon: '🏛️', count: 2 },
                  { type: 'cpi', label: 'Inflation Data', icon: '📊', count: 1 },
                  { type: 'employment', label: 'Employment', icon: '👥', count: 1 },
                  { type: 'gdp', label: 'GDP Reports', icon: '💰', count: 1 },
                  { type: 'earnings', label: 'Earnings', icon: '📈', count: 3 }
                ].map((category) => (
                  <div 
                    key={category.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => trackUserInteraction('category_filter', 'economic_category', category.type)}
                    data-testid={`economic-category-${category.type}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="text-white font-medium text-sm">{category.label}</div>
                        <div className="text-gray-400 text-xs">{category.count} upcoming</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Correlation Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              Cross-Asset Correlation Analysis
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Live Correlations
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setCorrelationTimeframe(timeframe)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      correlationTimeframe === timeframe
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    data-testid={`timeframe-${timeframe}`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                📊 Matrix View
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs">
                🎯 Regime Detection
              </Badge>
            </div>
          </div>

          {/* Market Regime & Risk Sentiment Banner */}
          {(!regimeLoading && marketRegime?.data) && (
            <Card className={`bg-gradient-to-r backdrop-blur-sm ${
              marketRegime.data.regime === 'risk_on' 
                ? 'from-green-900/20 via-emerald-900/20 to-green-900/20 border-green-500/30'
                : marketRegime.data.regime === 'risk_off'
                ? 'from-red-900/20 via-rose-900/20 to-red-900/20 border-red-500/30'
                : marketRegime.data.regime === 'decoupled'
                ? 'from-purple-900/20 via-indigo-900/20 to-purple-900/20 border-purple-500/30'
                : 'from-yellow-900/20 via-amber-900/20 to-yellow-900/20 border-yellow-500/30'
            }`}>
              <CardHeader className="pb-4">
                <CardTitle className={`flex items-center gap-2 ${
                  marketRegime.data.regime === 'risk_on' ? 'text-green-300'
                  : marketRegime.data.regime === 'risk_off' ? 'text-red-300'
                  : marketRegime.data.regime === 'decoupled' ? 'text-purple-300'
                  : 'text-yellow-300'
                }`}>
                  <Target className="h-4 w-4" />
                  Market Regime: {marketRegime.data.regime.replace('_', '-').toUpperCase()}
                  <Badge className={`ml-2 ${
                    marketRegime.data.confidence > 0.8 ? 'bg-green-500/30 text-green-200 border-green-400/50'
                    : marketRegime.data.confidence > 0.6 ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50'
                    : 'bg-red-500/30 text-red-200 border-red-400/50'
                  }`}>
                    {Math.round(marketRegime.data.confidence * 100)}% Confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Regime Description */}
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {marketRegime.data.description}
                    </p>
                    
                    {/* Key Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Crypto-Stock Correlation</div>
                        <div className="text-sm font-medium text-white">
                          {(marketRegime.data.characteristics.cryptoTradStockCorr * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Risk Sentiment</div>
                        <div className="text-sm font-medium text-white">
                          {marketRegime.data.characteristics.riskSentiment > 0 ? '+' : ''}{(marketRegime.data.characteristics.riskSentiment * 100).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actionable Insights */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">💡 Actionable Insights</h4>
                    <div className="space-y-2">
                      {marketRegime.data.actionableInsights.slice(0, 3).map((insight: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correlation Matrix & Risk Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Correlation Heatmap */}
            <Card className="lg:col-span-2 bg-black/40 border-indigo-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-indigo-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Correlation Heatmap ({correlationTimeframe})
                  <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 ml-2">
                    Cross-Asset Matrix
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {correlationLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                    <p>Loading correlation matrix...</p>
                  </div>
                ) : correlationMatrix?.success && correlationMatrix.data ? (
                  <div className="space-y-4">
                    {/* Top Correlations Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {correlationMatrix.data.matrix
                        .sort((a: any, b: any) => Math.abs(b.correlation) - Math.abs(a.correlation))
                        .slice(0, 3)
                        .map((pair: any) => (
                          <div key={`${pair.asset1}-${pair.asset2}`} className="bg-black/30 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400 mb-1">{pair.asset1} × {pair.asset2}</div>
                            <div className={`text-sm font-medium ${
                              pair.correlation > 0.5 ? 'text-green-400' 
                              : pair.correlation < -0.5 ? 'text-red-400' 
                              : 'text-yellow-400'
                            }`}>
                              {pair.correlation > 0 ? '+' : ''}{(pair.correlation * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{pair.strength}</div>
                          </div>
                        ))}
                    </div>

                    {/* Simplified Correlation Grid */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {correlationMatrix.data.assets.slice(0, 8).map((asset1: any) => (
                        <div key={asset1.symbol} className="grid grid-cols-9 gap-1 items-center">
                          <div className="text-xs font-medium text-white w-12 truncate">
                            {asset1.symbol}
                          </div>
                          {correlationMatrix.data.assets.slice(0, 8).map((asset2: any) => {
                            if (asset1.symbol === asset2.symbol) {
                              return <div key={asset2.symbol} className="w-6 h-6 bg-white/20 rounded text-xs flex items-center justify-center text-white">1</div>;
                            }
                            
                            const correlation = correlationMatrix.data.matrix.find((pair: any) => 
                              (pair.asset1 === asset1.symbol && pair.asset2 === asset2.symbol) ||
                              (pair.asset1 === asset2.symbol && pair.asset2 === asset1.symbol)
                            );
                            
                            const corrValue = correlation?.correlation || 0;
                            const intensity = Math.abs(corrValue);
                            
                            return (
                              <div 
                                key={asset2.symbol} 
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white text-[10px] font-medium ${
                                  corrValue > 0.5 ? 'bg-green-500' 
                                  : corrValue > 0.2 ? 'bg-green-500/60'
                                  : corrValue < -0.5 ? 'bg-red-500'
                                  : corrValue < -0.2 ? 'bg-red-500/60'
                                  : 'bg-gray-500/40'
                                }`}
                                style={{ opacity: Math.max(0.3, intensity) }}
                                title={`${asset1.symbol} × ${asset2.symbol}: ${(corrValue * 100).toFixed(1)}%`}
                              >
                                {Math.round(corrValue * 10)}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No correlation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Sentiment Indicator */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Risk Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskSentimentLoading ? (
                  <div className="text-center py-6 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p className="text-xs">Loading sentiment...</p>
                  </div>
                ) : riskSentiment?.success && riskSentiment.data ? (
                  <>
                    {/* Sentiment Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{
                        color: riskSentiment.data.score > 40 ? '#10b981' 
                             : riskSentiment.data.score > 0 ? '#f59e0b'
                             : riskSentiment.data.score > -40 ? '#f97316'
                             : '#ef4444'
                      }}>
                        {riskSentiment.data.score > 0 ? '+' : ''}{riskSentiment.data.score}
                      </div>
                      <div className="text-xs text-gray-400 capitalize mb-2">
                        {riskSentiment.data.sentiment.replace('_', ' ')}
                      </div>
                      
                      {/* Sentiment Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.abs(riskSentiment.data.score)}%`,
                            backgroundColor: riskSentiment.data.score > 0 ? '#10b981' : '#ef4444',
                            marginLeft: riskSentiment.data.score < 0 ? `${100 - Math.abs(riskSentiment.data.score)}%` : '0'
                          }}
                        />
                      </div>
                    </div>

                    {/* Components Breakdown */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-white mb-2">Component Analysis</div>
                      {[
                        { label: 'Crypto-Traditional', value: riskSentiment.data.components.cryptoTraditionalCorr },
                        { label: 'Volatility Spreads', value: riskSentiment.data.components.volatilitySpreads },
                        { label: 'Safe Haven Demand', value: riskSentiment.data.components.safeHavenDemand },
                        { label: 'Momentum Alignment', value: riskSentiment.data.components.momentumAlignment }
                      ].map((component) => (
                        <div key={component.label} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{component.label}</span>
                          <span className={`font-medium ${
                            component.value > 20 ? 'text-green-400' 
                            : component.value > 0 ? 'text-yellow-400'
                            : component.value > -20 ? 'text-orange-400'
                            : 'text-red-400'
                          }`}>
                            {component.value > 0 ? '+' : ''}{component.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Signals */}
                    {riskSentiment.data.signals.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-white">Active Signals</div>
                        <div className="space-y-1">
                          {riskSentiment.data.signals.slice(0, 3).map((signal: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-gray-300">
                              <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                              <span>{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No sentiment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Federal Reserve Communication Monitoring Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              🏛️ Federal Reserve Monitor
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Policy Insights
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                📈 Sentiment Analysis
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
                🗣️ Communications
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                ⚠️ Policy Alerts
              </Badge>
            </div>
          </div>

          {/* Fed Policy Alerts Banner */}
          {!fedAlertsLoading && fedPolicyAlerts?.success && fedPolicyAlerts.alerts?.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-blue-900/20 border-blue-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Fed Policy Alerts
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    {fedPolicyAlerts.alerts.filter((alert: any) => alert.severity === 'high' || alert.severity === 'critical').length} High Priority
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fedPolicyAlerts.alerts.slice(0, 4).map((alert: any) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-black/30 rounded-lg p-4 border ${
                        alert.severity === 'critical' ? 'border-red-500/40' :
                        alert.severity === 'high' ? 'border-orange-500/40' :
                        'border-blue-500/40'
                      }`}
                      onClick={() => trackUserInteraction('fed_alert_click', 'alert', alert.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`text-xs ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                          alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {alert.alertType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.dateCreated).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">{alert.title}</h4>
                      <p className="text-gray-300 text-xs line-clamp-2">{alert.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-400">by {alert.officialName}</span>
                        <div className="flex gap-1">
                          {alert.expectedImpact.stocks === 'bullish' && <span className="text-green-400">📈</span>}
                          {alert.expectedImpact.stocks === 'bearish' && <span className="text-red-400">📉</span>}
                          {alert.expectedImpact.bonds === 'bullish' && <span className="text-blue-400">🏦</span>}
                          {alert.expectedImpact.dollar === 'bullish' && <span className="text-green-400">💵</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Fed Monitoring Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Fed Communications */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  🗣️ Recent Communications
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    Sentiment Analysis
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fedCommLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : fedCommunications?.success ? (
                  <div className="space-y-4">
                    {fedCommunications.communications.slice(0, 5).map((comm: any) => (
                      <motion.div 
                        key={comm.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors cursor-pointer"
                        onClick={() => trackUserInteraction('fed_communication_click', 'communication', comm.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              comm.sentiment.stance === 'hawkish' ? 'bg-red-500/20 text-red-300' :
                              comm.sentiment.stance === 'dovish' ? 'bg-green-500/20 text-green-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {comm.sentiment.stance === 'hawkish' ? '🦅 Hawkish' :
                               comm.sentiment.stance === 'dovish' ? '🕊️ Dovish' :
                               '⚖️ Neutral'}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                              {comm.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {comm.isHighImpact && (
                              <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                                <Flame className="h-3 w-3 mr-1" />
                                High Impact
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(comm.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="text-white font-medium mb-2 text-sm">{comm.title}</h4>
                        <p className="text-gray-300 text-xs line-clamp-2 mb-3">{comm.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">by {comm.officialName}</span>
                            <div className="flex items-center gap-1">
                              {comm.keyTopics.slice(0, 2).map((topic: string) => (
                                <Badge key={topic} className="bg-purple-500/20 text-purple-300 text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              Market Relevance: {comm.marketRelevance}%
                            </span>
                            <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  comm.marketRelevance >= 80 ? 'bg-red-400' :
                                  comm.marketRelevance >= 60 ? 'bg-orange-400' :
                                  'bg-blue-400'
                                }`}
                                style={{ width: `${comm.marketRelevance}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Fed communications will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fed Analytics Summary & Calendar */}
            <div className="space-y-6">
              
              {/* Fed Analytics Summary */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    📊 Policy Insights
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      30D Trend
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fedAnalyticsLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : fedAnalytics?.success ? (
                    <div className="space-y-4">
                      {/* Sentiment Trend */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Overall Sentiment</span>
                          <Badge className={`text-xs ${
                            fedAnalytics.summary.sentimentTrend.direction === 'increasingly_hawkish' ? 'bg-red-500/20 text-red-300' :
                            fedAnalytics.summary.sentimentTrend.direction === 'increasingly_dovish' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {fedAnalytics.summary.sentimentTrend.direction.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              fedAnalytics.summary.sentimentTrend.direction === 'increasingly_hawkish' ? 'bg-red-400' :
                              fedAnalytics.summary.sentimentTrend.direction === 'increasingly_dovish' ? 'bg-green-400' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${fedAnalytics.summary.sentimentTrend.strength}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Dovish</span>
                          <span>Neutral</span>
                          <span>Hawkish</span>
                        </div>
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-300">{fedAnalytics.summary.totalCommunications}</div>
                          <div className="text-xs text-gray-400">Communications</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-2xl font-bold text-orange-300">{fedAnalytics.summary.highImpactCommunications}</div>
                          <div className="text-xs text-gray-400">High Impact</div>
                        </div>
                      </div>

                      {/* Market Implications */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Market Implications</h4>
                        <div className="space-y-1">
                          {fedAnalytics.summary.marketImplications.shortTerm.slice(0, 2).map((implication: string, index: number) => (
                            <div key={index} className="text-xs text-gray-300 flex items-start gap-2">
                              <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{implication}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs">Analytics loading...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Fed Events */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-purple-300 flex items-center gap-2">
                    📅 Upcoming Events
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      Calendar
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fedCalendarLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-gray-700 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : fedCalendar?.success ? (
                    <div className="space-y-3">
                      {fedCalendar.events.slice(0, 3).map((event: any) => (
                        <motion.div 
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black/20 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                              {event.eventType.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(event.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-white font-medium text-sm mb-1">{event.title}</h4>
                          {event.officialName && (
                            <p className="text-gray-300 text-xs">Speaker: {event.officialName}</p>
                          )}
                          <div className="mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-400" />
                              <span className="text-xs text-gray-400">
                                Market Relevance: {event.marketRelevance}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs">No upcoming events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Phase 2: Enhanced Trending Stories Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Content Intelligence
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 ml-2">
                <Brain className="h-3 w-3 mr-1" />
                AI-Ranked
              </Badge>
            </h2>
            
            {/* Enhanced Story Type Filter */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All Sources', icon: Globe },
                { key: 'farcaster', label: 'Social', icon: MessageSquare },
                { key: 'youtube', label: 'Videos', icon: Video },
                { key: 'news', label: 'News', icon: Newspaper }
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStoryFilter(key)}
                  className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
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
                    onClick={() => {
                      setSelectedSector(null);
                      trackUserInteraction('sector_unclick', 'sector', selectedSector);
                    }}
                    className="ml-auto text-gray-400 hover:text-white transition-colors"
                    data-testid="button-clear-sector"
                  >
                    ×
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phase 2: Smart Story Clustering */}
          <div className="space-y-4">
            {/* Always show content - no more infinite loading */}
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
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {story.thumbnail && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
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
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {index < 3 && (
                                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Hot Trend #{index + 1}
                                  </Badge>
                                )}
                                <Badge className={`text-xs border-0 ${
                                  (story as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                  (story as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                  (story as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {(story as any).priority === 'critical' ? '🔥' :
                                   (story as any).priority === 'high' ? '⚡' :
                                   (story as any).priority === 'medium' ? '📈' : '📊'}
                                  {(story as any).priority || 'low'} Priority
                                </Badge>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  AI Rank #{(story as any).aiRank || index + 1}
                                </Badge>
                              </div>
                              
                              <h3 className="text-white font-semibold text-base sm:text-lg line-clamp-2">{story.title}</h3>
                              <p className="text-gray-300 text-xs sm:text-sm mt-1 line-clamp-2">{story.description}</p>
                              
                              {/* Sector correlation indicator */}
                              {selectedSector && story.metadata.tags.some((tag: string) => 
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
                            {story.metadata.tags.slice(0, 4).map((tag: string) => (
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