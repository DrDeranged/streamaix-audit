import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  ChevronRight,
  Copy
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
  const { toast } = useToast();
  
  // State for note dialog
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  
  // State for share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
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

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          summaryId: null, // General note not tied to specific summary
          isPrivate: true
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: "Note created successfully!" });
      setNoteDialogOpen(false);
      setNoteTitle('');
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create note", 
        description: error.message,
        variant: "destructive" 
      });
    }
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
            className="flex space-x-8 sm:space-x-12 text-xs sm:text-sm opacity-95"
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
                  <div key={index} className="flex items-center space-x-2 sm:space-x-3 text-white whitespace-nowrap">
                    <span className="font-bold text-orange-300 text-xs sm:text-sm">{quote.symbol}</span>
                    <span className="font-semibold text-xs sm:text-sm">{formatPrice(quote.price)}</span>
                    <span className={`flex items-center font-medium text-xs sm:text-sm ${getChangeColor(quote.percentChange24h)}`}>
                      {ChangeIcon && <ChangeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />}
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
        {/* Mobile-Optimized Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-2"
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-3 py-2"
                data-testid="button-back-home"
              >
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
              <div className="text-right">
                <div className="text-xs text-gray-400">Level: {stats.level}</div>
                <div className="text-sm font-semibold text-green-400">{balance.streamTokens.toFixed(0)} STREAM</div>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Manage your AI summaries and track your progress
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mobile-Optimized Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg touch-manipulation">
            <CardContent className="p-4">
              <div className="text-center">
                <BarChart3 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Summaries</p>
                <p className="text-white text-lg font-bold">{stats.totalSummaries}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg touch-manipulation">
            <CardContent className="p-4">
              <div className="text-center">
                <Eye className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Views</p>
                <p className="text-white text-lg font-bold">{stats.totalViews}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg touch-manipulation">
            <CardContent className="p-4">
              <div className="text-center">
                <Wallet className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">STREAM</p>
                <p className="text-white text-lg font-bold">{balance.streamTokens.toFixed(0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg touch-manipulation">
            <CardContent className="p-4">
              <div className="text-center">
                <Award className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Rank</p>
                <p className="text-white text-sm font-bold">{stats.level.split(' ')[0]}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile-First Main Content Layout */}
        <div className="space-y-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
          {/* MAIN CONTENT AREA - Full width on mobile, 3/4 on desktop */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="summaries" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-white/5 border border-white/20 touch-manipulation">
                  <TabsTrigger value="summaries" className="data-[state=active]:bg-purple-500/30 px-3 py-3 text-xs font-medium">
                    <FileText className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Summaries</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-purple-500/30 px-3 py-3 text-xs font-medium">
                    <BookmarkPlus className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="data-[state=active]:bg-purple-500/30 px-3 py-3 text-xs font-medium">
                    <Wallet className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Wallet</span>
                  </TabsTrigger>
                  <TabsTrigger value="bounties" className="hidden lg:flex data-[state=active]:bg-purple-500/30 px-3 py-3 text-xs font-medium">
                    <Target className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Bounties</span>
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="hidden lg:flex data-[state=active]:bg-purple-500/30 px-3 py-3 text-xs font-medium">
                    <Activity className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Overview</span>
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

                <TabsContent value="summaries" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-white text-lg font-bold">My Summaries ({summaries.length})</h2>
                    <Button 
                      className="w-full sm:w-auto bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 touch-manipulation py-3"
                      onClick={() => setLocation('/create-summary')}
                      data-testid="button-new-summary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Summary
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {summariesLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                      </div>
                    ) : summaries.length > 0 ? (
                      <>
                        {/* Mobile View: Show only 3 most recent summaries */}
                        <div className="lg:hidden space-y-4">
                          {summaries.slice(0, 3).map((summary: Summary) => (
                            <motion.div
                              key={summary.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white/10 border-white/20 backdrop-blur-lg rounded-lg border p-4 touch-manipulation"
                              data-testid={`summary-${summary.id}`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white text-base font-semibold mb-2 line-clamp-2">{summary.title}</h3>
                                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {summary.platform}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(summary.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={`${getStatusColor(summary.processingStatus)} text-xs`}>
                                    {summary.processingStatus}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-white bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur-md transition-all duration-200 font-medium touch-manipulation py-2.5"
                                  data-testid="button-view-full"
                                  onClick={() => setLocation(`/summary/${summary.id}`)}
                                >
                                  View Full Summary
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Show "View All" button if there are more than 3 summaries */}
                          {summaries.length > 3 && (
                            <div className="text-center pt-2">
                              <p className="text-gray-400 text-xs mb-3">
                                Showing 3 of {summaries.length} summaries
                              </p>
                              <Button 
                                variant="outline"
                                className="w-full text-purple-300 bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20 touch-manipulation py-3"
                                onClick={() => {
                                  // For now, we'll just show a toast - could implement a full list modal later
                                  toast({ 
                                    title: "View All Summaries", 
                                    description: `You have ${summaries.length} total summaries. Use desktop view to see them all, or we can implement a full list view!`
                                  });
                                }}
                                data-testid="button-view-all-summaries"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View All {summaries.length} Summaries
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Desktop View: Show all summaries */}
                        <div className="hidden lg:block space-y-4">
                          {summaries.map((summary: Summary) => (
                            <motion.div
                              key={summary.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white/10 border-white/20 backdrop-blur-lg rounded-lg border p-4 touch-manipulation"
                              data-testid={`summary-${summary.id}`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white text-base font-semibold mb-2 line-clamp-2">{summary.title}</h3>
                                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {summary.platform}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(summary.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={`${getStatusColor(summary.processingStatus)} text-xs`}>
                                    {summary.processingStatus}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-white bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur-md transition-all duration-200 font-medium touch-manipulation py-2.5"
                                  data-testid="button-view-full"
                                  onClick={() => setLocation(`/summary/${summary.id}`)}
                                >
                                  View Full Summary
                                </Button>
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
                          ))}
                        </div>
                      </>
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
                        <Button 
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30"
                          onClick={() => {
                            toast({ 
                              title: "Deposit Feature", 
                              description: "Wallet deposit functionality coming soon! Connect your Web3 wallet to start."
                            });
                          }}
                          data-testid="button-deposit"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Deposit
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-white bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur-md transition-all duration-200 font-medium"
                          data-testid="button-withdraw"
                          onClick={() => {
                            toast({ 
                              title: "Withdraw Feature", 
                              description: "Wallet withdrawal functionality coming soon! Connect your Web3 wallet to start."
                            });
                          }}
                        >
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

          {/* MOBILE-FIRST SIDEBAR - Bottom on mobile, side on desktop */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions - Priority on Mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-purple-600/80 hover:bg-purple-500 text-white border-2 border-purple-400 shadow-lg transition-all duration-200 font-semibold touch-manipulation py-3"
                    onClick={() => setLocation('/create-summary')}
                    data-testid="button-process-content"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Process Content
                  </Button>
                  <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-blue-600/80 hover:bg-blue-500 text-white border-2 border-blue-400 shadow-lg transition-all duration-200 font-semibold touch-manipulation py-3"
                        data-testid="button-add-note"
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Create New Note</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="note-title">Title</Label>
                          <Input
                            id="note-title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Enter note title..."
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-content">Content</Label>
                          <Textarea
                            id="note-content"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Write your note here..."
                            className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              if (noteTitle.trim() && noteContent.trim()) {
                                createNoteMutation.mutate();
                              } else {
                                toast({ title: "Please fill in both title and content", variant: "destructive" });
                              }
                            }}
                            disabled={createNoteMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                          </Button>
                          <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-green-600/80 hover:bg-green-500 text-white border-2 border-green-400 shadow-lg transition-all duration-200 font-semibold touch-manipulation py-3"
                        data-testid="button-share-profile"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Share Your Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Profile URL</Label>
                          <div className="flex gap-2">
                            <Input
                              value={`${window.location.origin}/users/${user?.id}`}
                              readOnly
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/users/${user?.id}`);
                                toast({ title: "Profile URL copied to clipboard!" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my StreamAiX profile: ${window.location.origin}/users/${user?.id}`, '_blank')}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Share on Twitter
                          </Button>
                          <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Crypto Stocks - Horizontal scroll on mobile */}
            {displayStocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:block"
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Live Crypto Stocks
                      {isWebSocketConnected && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live data" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="lg:space-y-1 lg:max-h-96 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5 hover:scrollbar-thumb-white/30">
                    {/* Mobile: Horizontal scroll */}
                    <div className="lg:hidden overflow-x-auto pb-2">
                      <div className="flex space-x-3" style={{ width: 'max-content' }}>
                        {displayStocks.slice(0, 15).map((stock: any) => {
                          const changePercent = stock.changePercent ?? stock.percentChange24h ?? 0;
                          return (
                            <div
                              key={stock.symbol}
                              className="min-w-[120px] bg-white/5 rounded-lg p-3 border border-white/10"
                              data-testid={`mobile-stock-${stock.symbol}`}
                            >
                              <div className="text-center">
                                <div className="text-white font-medium text-sm">{stock.symbol}</div>
                                <div className="text-gray-400 text-xs">{formatPrice(stock.price)}</div>
                                <div className={`font-medium text-xs ${getChangeColor(changePercent)}`}>
                                  {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Desktop: Vertical list */}
                    <div className="hidden lg:block">
                      {displayStocks.slice(0, 25).map((stock: any, index: number) => {
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}