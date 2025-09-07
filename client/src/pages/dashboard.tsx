import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import UserNotesList from '@/components/UserNotesList';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Clock, 
  TrendingUp, 
  Wallet,
  Star,
  Share,
  Bookmark,
  Eye,
  DollarSign,
  Award,
  Zap,
  BarChart3,
  Users,
  Target,
  ArrowLeft,
  Home,
  BookmarkPlus,
  Activity,
  Calendar,
  MessageSquare,
  FileText,
  Hash,
  Code2,
  ArrowUp,
  ArrowDown,
  Newspaper,
  Globe,
  RefreshCw,
  ExternalLink,
  Headphones,
  Video,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  originalUrl: string;
  contentType: string;
  platform: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  accuracy?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  keyInsights?: string[];
  marketInsights?: string[];
  structure?: any;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  creator: string;
  assignee?: string;
  tags?: string[];
  tipPool: number;
  submissions: number;
  createdAt: string;
  dueDate?: string;
}

interface UserStats {
  totalSummaries: number;
  totalViews: number;
  totalEarnings: number;
  rank: number;
  level: string;
  accuracy: number;
  streak: number;
}

interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
}

interface NewsArticle {
  title: string;
  url: string;
  published: string;
  source: string;
}

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  marketCap?: number;
  volume?: number;
}

interface RealTimeStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  momentum?: 'up' | 'down' | 'neutral';
  basePrice?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Real-time stock data state
  const [realTimeStocks, setRealTimeStocks] = useState<RealTimeStockData[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user summaries
  const { data: summariesData, isLoading: summariesLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/summaries`],
    enabled: !!user?.id,
  });

  // Fetch user bounties
  const { data: bountiesData, isLoading: bountiesLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/bounties`],
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });

  // Fetch wallet balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['/api/wallet/balance'],
    enabled: !!user?.id,
  });

  // Supplemental market data (expanded for scrollable sections)
  const { data: cryptoData } = useQuery({
    queryKey: ['/api/market/crypto/BTC,ETH,SOL,BNB,XRP,ADA,AVAX,DOT,MATIC,LINK,LTC,BCH,UNI,ATOM,FTT,ALGO,XLM,VET,ICP,FIL,HBAR,ETC,XMR,EOS,BSV'],
    refetchInterval: 300000, // Every 5 minutes
  });

  const { data: newsData } = useQuery({
    queryKey: ['/api/market/news'],
    refetchInterval: 300000, // Every 5 minutes
  });

  const { data: stocksData } = useQuery({
    queryKey: ['/api/market/stocks/crypto'],
    refetchInterval: 300000, // Every 5 minutes
  });

  const summaries = (summariesData as any)?.summaries || [];
  const bounties = (bountiesData as any)?.bounties || [];
  const stats: UserStats = (statsData as any) || {
    totalSummaries: 0,
    totalViews: 0,
    totalEarnings: 0,
    rank: 0,
    level: 'Rising Creator',
    accuracy: 0,
    streak: 0
  };
  const balance = (balanceData as any)?.balance || { streamTokens: 0, usdValue: 0 };
  const cryptoQuotes = (cryptoData as any)?.quotes || [];
  const newsArticles = (newsData as any)?.articles || [];
  const cryptoStocks = (stocksData as any)?.stocks || [];

  // WebSocket connection for real-time stock updates
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('📡 WebSocket connected for real-time stock updates');
        setIsWebSocketConnected(true);
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'stockUpdate' && message.data?.stocks) {
            setRealTimeStocks(message.data.stocks);
            // Also update the React Query cache
            queryClient.setQueryData(['/api/market/stocks/crypto'], message.data);
          }
        } catch (error) {
          console.error('📡 Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('📡 WebSocket disconnected');
        setIsWebSocketConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('📡 Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('📡 WebSocket error:', error);
        setIsWebSocketConnected(false);
      };
    } catch (error) {
      console.error('📡 Failed to establish WebSocket connection:', error);
    }
  }, [queryClient]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Use real-time stocks if available, otherwise fall back to cached data
  const displayStocks = realTimeStocks.length > 0 ? realTimeStocks : cryptoStocks;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? ArrowUp : change < 0 ? ArrowDown : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        opacity: 0.5
      }}></div>
      
      {/* ENHANCED CRYPTO TICKER - Darker, more visible, continuous */}
      <div className="relative z-20 bg-gradient-to-r from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="overflow-hidden py-3">
          <motion.div 
            className="flex space-x-12 text-sm opacity-95"
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 120, 
              ease: "linear" 
            }}
            style={{ width: "400%" }}
          >
            {cryptoQuotes.length > 0 ? (
              [...cryptoQuotes, ...cryptoQuotes, ...cryptoQuotes, ...cryptoQuotes].map((quote: CryptoQuote, index: number) => {
                const ChangeIcon = getChangeIcon(quote.percentChange24h);
                return (
                  <div key={index} className="flex items-center space-x-3 text-white whitespace-nowrap">
                    <span className="font-bold text-orange-300">{quote.symbol}</span>
                    <span className="font-semibold">{formatPrice(quote.price)}</span>
                    <span className={`flex items-center font-medium ${getChangeColor(quote.percentChange24h)}`}>
                      {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
                      {quote.percentChange24h.toFixed(1)}%
                    </span>
                  </div>
                );
              })
            ) : (
              // Fallback placeholder while loading
              [...Array(25)].map((_, index) => (
                <div key={index} className="flex items-center space-x-3 text-white whitespace-nowrap">
                  <span className="font-bold text-orange-300/60">●●●</span>
                  <span className="font-medium text-gray-300">Loading crypto data...</span>
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* ENHANCED FINANCIAL NEWS SECTION */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900/40 via-blue-900/20 to-slate-900/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-blue-400" />
              <h3 className="text-white text-sm font-medium">Today's Financial News</h3>
            </div>
            <div className="flex gap-1">
              <button 
                className="text-white/50 hover:text-white p-1 rounded transition-colors"
                onClick={() => {
                  const container = document.querySelector('.news-scroll-container');
                  container?.scrollBy({ left: -300, behavior: 'smooth' });
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                className="text-white/50 hover:text-white p-1 rounded transition-colors"
                onClick={() => {
                  const container = document.querySelector('.news-scroll-container');
                  container?.scrollBy({ left: 300, behavior: 'smooth' });
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-visible news-scroll-container">
            <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
              {newsArticles.slice(0, 15).map((article: NewsArticle, index: number) => {
                // Use full headline text to maximize content
                const headline = article.title;
                
                return (
                  <div
                    key={index}
                    className="min-w-[240px] max-w-[240px] bg-white/5 rounded-lg p-2.5 border border-white/10 backdrop-blur-sm hover:bg-white/10 cursor-pointer transition-all hover:scale-[1.02]"
                    onClick={() => window.open(article.url, '_blank')}
                    data-testid={`news-article-${index}`}
                  >
                    <h4 className="text-white text-xs font-semibold line-clamp-4 leading-tight">
                      {headline}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pt-4"
        >
          <div className="flex items-center gap-6 mb-4 sm:mb-0">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
              data-testid="button-back-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-3">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-300 text-lg">
                Manage your AI summaries and track your progress
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Summaries</p>
                  <p className="text-white text-2xl font-bold">{stats.totalSummaries}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-white text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">STREAM Tokens</p>
                  <p className="text-white text-2xl font-bold">{balance.streamTokens.toFixed(2)}</p>
                </div>
                <Wallet className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Creator Rank</p>
                  <p className="text-white text-lg font-bold">{stats.level}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MAIN CONTENT AREA - 3/4 width */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="summaries" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/20">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/30">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="summaries" className="data-[state=active]:bg-purple-500/30">
                    My Summaries
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-purple-500/30">
                    My Notes
                  </TabsTrigger>
                  <TabsTrigger value="bounties" className="data-[state=active]:bg-purple-500/30">
                    Bounties
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="data-[state=active]:bg-purple-500/30">
                    Wallet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {summaries.slice(0, 5).map((summary: Summary, index: number) => (
                          <div key={summary.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{summary.title}</h4>
                                <p className="text-gray-400 text-sm">{summary.platform}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(summary.processingStatus)}>
                              {summary.processingStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summaries" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white text-xl font-bold">My Summaries ({summaries.length})</h2>
                    <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30">
                      <Plus className="h-4 w-4 mr-2" />
                      New Summary
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {summariesLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                      </div>
                    ) : summaries.length > 0 ? (
                      summaries.map((summary: Summary) => (
                        <motion.div
                          key={summary.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white/10 border-white/20 backdrop-blur-lg rounded-lg border p-6 cursor-pointer"
                          data-testid={`summary-${summary.id}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-white text-lg font-semibold mb-2">{summary.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Globe className="h-4 w-4" />
                                  {summary.platform}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(summary.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(summary.processingStatus)}>
                                {summary.processingStatus}
                              </Badge>
                              <Button variant="outline" size="sm" className="text-white border-white/20">
                                View Full
                              </Button>
                            </div>
                          </div>

                          {summary.accuracy && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-300">AI Accuracy</span>
                                <span className="text-white">{summary.accuracy}%</span>
                              </div>
                              <Progress value={summary.accuracy} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {summary.tags?.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-gray-500/20 text-gray-300">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <button className="hover:text-white transition-colors">
                                <Bookmark className="h-4 w-4" />
                              </button>
                              <button className="hover:text-white transition-colors">
                                <Share className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-8 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-300">No summaries yet. Create your first AI-powered summary!</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-6 mt-6">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BookmarkPlus className="h-5 w-5" />
                        My Personal Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserNotesList title="" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bounties" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white text-xl font-bold">Active Bounties</h2>
                    <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30">
                      <Target className="h-4 w-4 mr-2" />
                      Create Bounty
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {bountiesLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto" />
                      </div>
                    ) : bounties.length > 0 ? (
                      bounties.map((bounty: Bounty) => (
                        <Card key={bounty.id} className="bg-white/10 border-white/20 backdrop-blur-lg">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-white text-lg font-semibold mb-2">{bounty.title}</h3>
                                <p className="text-gray-300 text-sm mb-3">{bounty.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {bounty.reward} STREAM
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {bounty.submissions} submissions
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className={getStatusColor(bounty.status)}>
                                {bounty.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-8 text-center">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-300">No active bounties. Create one to incentivize content creation!</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="wallet" className="space-y-6 mt-6">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallet Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Current Balance</p>
                        <p className="text-white text-4xl font-bold">{balance.streamTokens.toFixed(2)} STREAM</p>
                        <p className="text-gray-400 text-lg">≈ ${balance.usdValue.toFixed(2)} USD</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30">
                          <Plus className="h-4 w-4 mr-2" />
                          Deposit
                        </Button>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* SUPPLEMENTAL SIDEBAR - 1/4 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Crypto Stocks - Vertical Ticker */}
            {displayStocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Live Crypto Stocks
                      {isWebSocketConnected && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live data" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5 hover:scrollbar-thumb-white/30">
                    {displayStocks.slice(0, 25).map((stock: any, index: number) => {
                      // Handle both old format (percentChange24h) and new format (changePercent)
                      const changePercent = stock.changePercent ?? stock.percentChange24h ?? 0;
                      
                      return (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-white/5 transition-colors"
                          data-testid={`sidebar-stock-${stock.symbol}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-medium">{stock.symbol}</span>
                            <span className="text-gray-400 truncate">{formatPrice(stock.price)}</span>
                          </div>
                          <span className={`font-medium whitespace-nowrap ${getChangeColor(changePercent)}`}>
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 transition-all duration-200"
                    size="sm"
                    onClick={() => setLocation('/process')}
                    data-testid="button-process-content"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Process Content
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                    size="sm"
                    data-testid="button-add-note"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                    size="sm"
                    data-testid="button-share-profile"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share Profile
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