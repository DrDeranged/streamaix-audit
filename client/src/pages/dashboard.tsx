import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import InvestmentJournal from '@/components/InvestmentJournal';
import { FollowButton } from '@/components/avatars/follow-button';
import BountyBoardSection from '@/components/bounty/BountyBoardSection';
import RelatedBountiesWidget from '@/components/bounty/RelatedBountiesWidget';
import ActivePredictionMarkets from '@/components/dashboard/ActivePredictionMarkets';
import HotAvatarTrades from '@/components/dashboard/HotAvatarTrades';
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
  MessageCircle,
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
  Copy,
  Trash2,
  Trophy,
  Bell,
  Settings,
  Compass,
  Search,
  HelpCircle,
  Sparkles,
  PlayCircle,
  UserPlus
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

  // Fetch user's followed avatars
  const { data: followedAvatarsData, isLoading: followedAvatarsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/followed-avatars`],
    enabled: !!user?.id,
  });

  // Fetch user's follow stats (followers/following counts)
  const { data: followStatsData } = useQuery<{ followersCount: number; followingCount: number }>({
    queryKey: ['/api/users', user?.id, 'follow', 'stats'],
    enabled: !!user?.id,
  });

  // Fetch personalized avatar recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/avatars/recommendations', user?.id],
    enabled: !!user?.id,
  });

  // Fetch trending avatars
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/avatars/trending'],
    refetchInterval: 300000, // Refresh every 5 minutes
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
        title: "Unable to save note", 
        description: "Please try again.",
        variant: "destructive" 
      });
    }
  });

  // Delete summary mutation
  const deleteSummaryMutation = useMutation({
    mutationFn: async (summaryId: string) => {
      return apiRequest(`/api/summaries/${summaryId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Summary deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/summaries`] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Unable to delete summary", 
        description: "Please try again.",
        variant: "destructive" 
      });
    }
  });

  const summaries = (summariesData as any)?.summaries || [];
  
  // Sort summaries by creation date (most recent first) and limit to 5
  const recentSummaries = useMemo(() => 
    [...summaries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5), 
    [summaries]
  );
  const bounties = (bountiesData as any)?.bounties || [];
  // Production-ready data handling with safe fallbacks
  const stats: UserStats = (statsData as any) || {
    totalSummaries: 0,
    totalViews: 0,
    totalEarnings: 0,
    rank: 0,
    level: 'Beginner',
    accuracy: 0,
    streak: 0
  };
  const balance = (balanceData as any)?.balance || { 
    streamTokens: 0, 
    usdValue: 0,
    ethBalance: 0,
    btcBalance: 0,
    totalPortfolioValue: 0
  };
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
  const displayStocks = (realTimeStocks?.length > 0 ? realTimeStocks : cryptoStocks) || [];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-16">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        opacity: 0.5
      }}></div>
      

      {/* ENHANCED FINANCIAL NEWS SECTION */}
      <div className="relative z-10 bg-gradient-to-r from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 border-b border-purple-500/10">
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

        {/* Glassmorphism Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Summaries Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-purple-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Summaries</p>
                  <p className="text-white text-xl font-bold">{stats.totalSummaries}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Views Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-blue-500/20 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-blue-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Views</p>
                  <p className="text-white text-xl font-bold">{stats.totalViews}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STREAM Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-emerald-500/20 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Wallet className="h-6 w-6 text-emerald-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">STREAM</p>
                  <p className="text-white text-xl font-bold">{balance.streamTokens.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rank Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-amber-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Rank</p>
                  <p className="text-white text-xl font-bold">{stats.level}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Engagement Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Followers Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-pink-500/20 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-pink-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Followers</p>
                  <p className="text-white text-xl font-bold" data-testid="stat-followers">{followStatsData?.followersCount || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Following Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-violet-500/20 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="h-6 w-6 text-violet-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Following</p>
                  <p className="text-white text-xl font-bold" data-testid="stat-following">{followStatsData?.followingCount || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Followed Avatars Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-cyan-500/20 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-cyan-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Avatars</p>
                  <p className="text-white text-xl font-bold" data-testid="stat-avatars">{(followedAvatarsData as any)?.followedAvatars?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500 opacity-0 group-hover:opacity-60 blur transition-opacity duration-300" />
            <Card className="relative bg-slate-950/40 border border-orange-500/20 backdrop-blur-xl hover:border-orange-500/40 transition-all duration-300 touch-manipulation">
              <CardContent className="p-5">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-orange-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">Streak</p>
                  <p className="text-white text-xl font-bold" data-testid="stat-streak">{stats.streak} days</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 bg-slate-950/60 backdrop-blur-xl border border-purple-500/20 rounded-xl p-1 touch-manipulation">
                  <TabsTrigger value="summaries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-fuchsia-500/30 data-[state=active]:border-purple-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 rounded-lg px-2 sm:px-3 py-3 text-xs font-medium min-h-[44px] text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Summaries</span>
                  </TabsTrigger>
                  <TabsTrigger value="markets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/30 data-[state=active]:to-cyan-500/30 data-[state=active]:border-emerald-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 rounded-lg px-2 sm:px-3 py-3 text-xs font-medium min-h-[44px] text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <TrendingUp className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Markets</span>
                  </TabsTrigger>
                  <TabsTrigger value="avatars" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:border-blue-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 rounded-lg px-2 sm:px-3 py-3 text-xs font-medium min-h-[44px] text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Avatars</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-orange-500/30 data-[state=active]:border-amber-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20 rounded-lg px-2 sm:px-3 py-3 text-xs font-medium min-h-[44px] text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <BookmarkPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="hidden sm:flex data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/30 data-[state=active]:to-emerald-500/30 data-[state=active]:border-green-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/20 rounded-lg px-2 sm:px-3 py-3 text-xs font-medium min-h-[44px] text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <Wallet className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Wallet</span>
                  </TabsTrigger>
                  <TabsTrigger value="bounties" className="hidden lg:flex data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/30 data-[state=active]:to-rose-500/30 data-[state=active]:border-pink-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20 rounded-lg px-3 py-3 text-xs font-medium text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
                    <Target className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Bounties</span>
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="hidden lg:flex data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20 rounded-lg px-3 py-3 text-xs font-medium text-gray-400 data-[state=active]:text-white transition-all duration-300 border border-transparent">
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
                        {recentSummaries.map((summary: Summary, index: number) => (
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

                <TabsContent value="markets" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ActivePredictionMarkets />
                    </div>
                    <div className="lg:col-span-1">
                      <HotAvatarTrades limit={6} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="avatars" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-white text-lg font-bold">
                      Following ({(followedAvatarsData as any)?.followedAvatars?.length || 0})
                    </h2>
                    <Link to="/landing#knowledge-avatars">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-purple-300 bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20"
                        data-testid="button-discover-avatars"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Discover More Avatars
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {followedAvatarsLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                      </div>
                    ) : (followedAvatarsData as any)?.followedAvatars?.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {((followedAvatarsData as any)?.followedAvatars || []).map((followData: any) => (
                          <motion.div
                            key={followData.avatarId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/10 border-white/20 backdrop-blur-lg rounded-lg border p-4 touch-manipulation"
                            data-testid={`followed-avatar-${followData.avatar.handle}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                  {followData.avatar.imageUrl ? (
                                    <img 
                                      src={followData.avatar.imageUrl} 
                                      alt={followData.avatar.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-lg">
                                      {followData.avatar.name?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="text-white font-semibold text-base">
                                      {followData.avatar.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm">@{followData.avatar.handle}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                                      {followData.avatar.expertise}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                  {followData.avatar.bio}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {followData.avatar.followerCount?.toLocaleString() || 0} followers
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Followed {new Date(followData.followedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Link to={`/knowledge-avatars/${followData.avatar.id}`}>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-white bg-white/10 border-white/30 hover:bg-white/20 px-3 py-1.5 text-xs"
                                        data-testid={`button-view-avatar-${followData.avatar.handle}`}
                                      >
                                        View Profile
                                      </Button>
                                    </Link>
                                    <FollowButton
                                      avatarId={followData.avatar.id}
                                      avatarName={followData.avatar.name}
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs px-3 py-1.5"
                                      showIcon={false}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                        <CardContent className="p-8 text-center">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-white text-lg font-semibold mb-2">No Avatars Followed Yet</h3>
                          <p className="text-gray-400 mb-4">
                            Start following knowledge avatars to see their latest insights and thoughts right here.
                          </p>
                          <Link to="/landing#knowledge-avatars">
                            <Button 
                              variant="outline" 
                              className="text-purple-300 bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20"
                              data-testid="button-discover-first-avatars"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Discover Knowledge Avatars
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Personalized Recommendations Section */}
                  {!recommendationsLoading && (recommendationsData as any)?.recommendations?.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white text-lg font-bold flex items-center gap-2">
                          <Zap className="h-5 w-5 text-purple-400" />
                          Recommended For You
                        </h2>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {((recommendationsData as any)?.recommendations || []).slice(0, 4).map((rec: any) => (
                          <motion.div
                            key={rec.avatar.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-purple-950/40 to-blue-950/40 backdrop-blur-lg rounded-lg border border-purple-500/20 p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden">
                                  {rec.avatar.imageUrl ? (
                                    <img src={rec.avatar.imageUrl} alt={rec.avatar.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white font-bold">{rec.avatar.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold text-sm">{rec.avatar.name}</h3>
                                  <p className="text-purple-200/70 text-xs">@{rec.avatar.handle}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                {rec.score}% match
                              </Badge>
                            </div>

                            <div className="space-y-1.5 mb-3">
                              {rec.reasons.slice(0, 2).map((reason: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Star className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-purple-200/80 text-xs">{reason}</p>
                                </div>
                              ))}
                            </div>

                            <FollowButton
                              avatarId={rec.avatar.id}
                              avatarName={rec.avatar.name}
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Avatars Section */}
                  {!trendingLoading && (trendingData as any)?.trending?.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          Trending Now
                        </h2>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {((trendingData as any)?.trending || []).slice(0, 6).map((avatar: any, idx: number) => (
                          <motion.div
                            key={avatar.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gradient-to-br from-green-950/40 to-emerald-950/40 backdrop-blur-lg rounded-lg border border-green-500/20 p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                                  {avatar.imageUrl ? (
                                    <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white font-bold text-sm">{avatar.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-sm truncate">{avatar.name}</h3>
                                <p className="text-green-200/70 text-xs truncate">@{avatar.handle}</p>
                              </div>
                            </div>

                            {avatar.portfolioRoi !== null && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30 text-xs mb-2">
                                {avatar.portfolioRoi > 0 ? '+' : ''}{avatar.portfolioRoi}% ROI
                              </Badge>
                            )}

                            <FollowButton
                              avatarId={avatar.id}
                              avatarName={avatar.name}
                              size="sm"
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-xs"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="summaries" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-white text-lg font-bold">Recent Summaries ({recentSummaries.length})</h2>
                  </div>

                  {summariesLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                    </div>
                  ) : recentSummaries.length > 0 ? (
                    <div className="lg:grid lg:grid-cols-3 lg:gap-6">
                      {/* Summaries Column - 2/3 width on desktop */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Mobile View: Show only 5 most recent summaries */}
                        <div className="lg:hidden space-y-4">
                          {recentSummaries.map((summary: Summary) => (
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
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-white bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur-md transition-all duration-200 font-medium touch-manipulation py-2.5"
                                    data-testid="button-view-full"
                                    onClick={() => setLocation(`/summary/${summary.id}`)}
                                  >
                                    View Full Summary
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={deleteSummaryMutation.isPending}
                                        className="text-red-400 bg-red-500/10 border-red-400/30 hover:bg-red-500/20 backdrop-blur-md transition-all duration-200 touch-manipulation py-2.5 px-3 disabled:opacity-50"
                                        data-testid={`button-delete-summary-${summary.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Delete Summary</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-300">
                                          Are you sure you want to delete "{summary.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => deleteSummaryMutation.mutate(summary.id)}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Show "View All" button if there are more than 5 summaries */}
                          {summaries.length > 5 && (
                            <div className="text-center pt-2">
                              <p className="text-gray-400 text-xs mb-3">
                                Showing 5 of {summaries.length} summaries
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

                        {/* Desktop View: Integrated view with related bounties */}
                        <div className="hidden lg:block space-y-4">
                          {recentSummaries.map((summary: Summary) => (
                            <motion.div
                              key={summary.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white/10 border-white/20 backdrop-blur-lg rounded-lg border p-4"
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
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button 
                                        disabled={deleteSummaryMutation.isPending}
                                        className="hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid={`button-delete-summary-desktop-${summary.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Delete Summary</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-300">
                                          Are you sure you want to delete "{summary.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => deleteSummaryMutation.mutate(summary.id)}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Related Bounties Column - 1/3 width on desktop, hidden on mobile */}
                      <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-4">
                          <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-cyan-400" />
                            Related Bounties
                          </h3>
                          {recentSummaries.length > 0 && (
                            <RelatedBountiesWidget 
                              tags={recentSummaries[0]?.tags || []} 
                              category={recentSummaries[0]?.category} 
                              limit={5}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">No summaries yet. Create your first AI-powered summary!</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-6 mt-6">
                  <InvestmentJournal />
                </TabsContent>

                <TabsContent value="bounties" className="space-y-6 mt-6">
                  <BountyBoardSection />
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
              <Card className="bg-slate-950/40 border border-purple-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {/* Create Summary - Primary Action */}
                  <Link to="/create-summary">
                    <Button 
                      className="w-full h-11 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 hover:text-white backdrop-blur-sm transition-all duration-200 font-medium touch-manipulation text-sm"
                      data-testid="button-create-summary"
                    >
                      <PlayCircle className="h-4 w-4 mr-2 flex-shrink-0 text-purple-400" />
                      Create Summary
                    </Button>
                  </Link>

                  {/* Browse Markets */}
                  <Link to="/markets">
                    <Button 
                      className="w-full h-11 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 hover:text-white backdrop-blur-sm transition-all duration-200 font-medium touch-manipulation text-sm"
                      data-testid="button-browse-markets"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0 text-emerald-400" />
                      Browse Markets
                    </Button>
                  </Link>

                  {/* Find Bounties */}
                  <Link to="/bounties">
                    <Button 
                      className="w-full h-11 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white backdrop-blur-sm transition-all duration-200 font-medium touch-manipulation text-sm"
                      data-testid="button-find-bounties"
                    >
                      <Target className="h-4 w-4 mr-2 flex-shrink-0 text-amber-400" />
                      Find Bounties
                    </Button>
                  </Link>

                  {/* Discover Analytics */}
                  <Link to="/discover">
                    <Button 
                      className="w-full h-11 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 hover:text-white backdrop-blur-sm transition-all duration-200 font-medium touch-manipulation text-sm"
                      data-testid="button-discover"
                    >
                      <Compass className="h-4 w-4 mr-2 flex-shrink-0 text-blue-400" />
                      Discover Analytics
                    </Button>
                  </Link>

                  {/* Explore Avatars */}
                  <Link to="/landing#knowledge-avatars">
                    <Button 
                      className="w-full h-11 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 hover:text-white backdrop-blur-sm transition-all duration-200 font-medium touch-manipulation text-sm"
                      data-testid="button-explore-avatars"
                    >
                      <Users className="h-4 w-4 mr-2 flex-shrink-0 text-pink-400" />
                      Explore Avatars
                    </Button>
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-purple-500/20 my-3" />

                  {/* Add Note */}
                  <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full h-10 bg-white/5 border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200 font-medium touch-manipulation text-sm"
                        data-testid="button-add-note"
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
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

                  {/* Share Profile */}
                  <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full h-10 bg-white/5 border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200 font-medium touch-manipulation text-sm"
                        data-testid="button-share-profile"
                      >
                        <Share className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
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

                  {/* Divider */}
                  <div className="border-t border-purple-500/20 my-3" />

                  {/* Start Tour - Help for new users */}
                  <Button 
                    variant="ghost"
                    className="w-full h-10 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200 font-medium touch-manipulation text-sm"
                    data-testid="button-start-tour"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('triggerOnboardingTour'));
                      toast({ title: "Tour Started!", description: "Follow the guide to learn about StreamAiX features." });
                    }}
                  >
                    <HelpCircle className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    Take a Tour
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