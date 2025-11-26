import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiErrorCard, ApiLoadingCard } from "@/components/ApiErrorFallback";
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  AlertCircle,
  Zap,
  Target,
  Waves,
  Radio,
  ChevronDown,
  ChevronUp,
  Calendar,
  Newspaper,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUpIcon,
  Building,
  LineChart,
  Flame,
  Users,
  Droplet,
  Scale,
  CircleDollarSign,
  Wallet,
  Link as LinkIcon,
  Home,
  Crown,
  Trophy,
  Medal,
  Sparkles,
  Eye,
  Timer,
  Rocket,
  Star,
  ChevronRight,
  ExternalLink,
  Bot,
  Network,
  Cpu
} from "lucide-react";

interface PredictionMarket {
  id: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalTrades: number;
  deadline: string;
  category: string;
  aiProbability?: number;
  status: string;
  tags?: string[];
}

export default function Discover() {
  const [pulseExpanded, setPulseExpanded] = useState(false);
  const [macroExpanded, setMacroExpanded] = useState(false);
  const [sectorExpanded, setSectorExpanded] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Prediction Markets Data
  const { data: marketsData } = useQuery<{ markets: PredictionMarket[] }>({
    queryKey: ['/api/prediction-markets'],
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/prediction-leagues/leaderboard'],
  });

  const { data: aiTradesData } = useQuery({
    queryKey: ['/api/prediction-markets/ai-stats'],
  });

  // Market Data Queries
  const { data: cryptoData, isLoading: cryptoLoading, isError: cryptoError } = useQuery({
    queryKey: ['/api/analytics/live/crypto'],
  });

  const { data: stocksData, isLoading: stocksLoading, isError: stocksError } = useQuery({
    queryKey: ['/api/analytics/live/stocks'],
  });

  const { data: sectorsData } = useQuery({
    queryKey: ['/api/market/sectors'],
  });

  const { data: marketOverview } = useQuery({
    queryKey: ['/api/market/overview'],
  });

  const { data: economicCalendar } = useQuery({
    queryKey: ['/api/market/economic-calendar'],
  });

  const { data: marketNews } = useQuery({
    queryKey: ['/api/market/news'],
  });

  const { data: trendingContent } = useQuery({
    queryKey: ['/api/discover/trending', contentFilter],
  });

  const { data: marketRegime } = useQuery({
    queryKey: ['/api/correlation/market-regime'],
  });

  const { data: riskSentiment } = useQuery({
    queryKey: ['/api/correlation/risk-sentiment'],
  });

  // Extract data
  const markets = (marketsData as any)?.markets || [];
  const leaderboard = (leaderboardData as any)?.leaderboard || [];
  const aiStats = (aiTradesData as any) || {};
  const cryptoAssets = (cryptoData as any)?.assets || [];
  const stockAssets = (stocksData as any)?.assets || [];
  const sectors = (sectorsData as any)?.sectors || [];
  const movers = (marketOverview as any)?.movers || [];
  const events = (economicCalendar as any)?.events || [];
  const news = (marketNews as any)?.news || [];
  const stories = (trendingContent as any)?.stories || [];
  const regime = (marketRegime as any)?.regime || {};
  const sentiment = (riskSentiment as any)?.sentiment || {};

  // Process markets data
  const activeMarkets = markets.filter((m: PredictionMarket) => m.status === 'active');
  const trendingMarkets = [...activeMarkets]
    .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
    .slice(0, 8);
  
  const expiringMarkets = activeMarkets
    .filter((m: PredictionMarket) => {
      const deadline = new Date(m.deadline);
      const now = new Date();
      const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil <= 14 && daysUntil > 0;
    })
    .sort((a: PredictionMarket, b: PredictionMarket) => 
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )
    .slice(0, 6);

  // Mock advanced metrics
  const fearGreedIndex = 65;
  const btcDominance = 42.3;
  const ethDominance = 18.7;
  const gasPrice = 15;

  const toggleSection = (section: string) => {
    switch(section) {
      case 'pulse': setPulseExpanded(!pulseExpanded); break;
      case 'macro': setMacroExpanded(!macroExpanded); break;
      case 'sector': setSectorExpanded(!sectorExpanded); break;
      case 'news': setNewsExpanded(!newsExpanded); break;
      case 'content': setContentExpanded(!contentExpanded); break;
      case 'metrics': setMetricsExpanded(!metricsExpanded); break;
    }
  };

  // Countdown component
  const Countdown = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
      const updateCountdown = () => {
        const now = new Date();
        const end = new Date(deadline);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expired');
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }, [deadline]);
    
    return <span>{timeLeft}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`,
        }} />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="rgba(139,92,246,0.3)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
        </svg>
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl h-10 w-10 p-0"
                  data-testid="button-back-home"
                >
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                    Discover
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                    AI-Powered Market Intelligence
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium">
                <Radio className="w-2.5 h-2.5 mr-1.5 animate-pulse" />
                <span>Live</span>
              </Badge>
              <Link href="/markets">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 rounded-xl h-9 px-4 text-xs font-medium shadow-lg shadow-purple-500/20"
                  data-testid="button-explore-markets"
                >
                  <Rocket className="w-3.5 h-3.5 mr-1.5" />
                  Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Active Markets</p>
                  <p className="text-xl font-bold text-white">{activeMarkets.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">AI Agents</p>
                  <p className="text-xl font-bold text-white">{aiStats.activeAgents || 100}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Volume</p>
                  <p className="text-xl font-bold text-white">
                    {((aiStats.totalVolume || 0) / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fear & Greed</p>
                  <p className="text-xl font-bold text-white">{fearGreedIndex}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Markets Heat Map */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-orbitron font-bold text-white">Trending Markets</h2>
                <p className="text-xs text-gray-400">Highest volume prediction markets</p>
              </div>
            </div>
            <Link href="/markets">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs" data-testid="button-view-all-markets">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trendingMarkets.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trending markets yet</p>
              </div>
            ) : (
              trendingMarkets.map((market: PredictionMarket, idx: number) => {
                const yesPercent = market.yesPrice / 10000;
                const isHot = idx < 3;
                const heatColor = idx === 0 ? 'from-red-500/20 to-orange-500/20 border-red-500/30' :
                                  idx === 1 ? 'from-orange-500/20 to-amber-500/20 border-orange-500/30' :
                                  idx === 2 ? 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' :
                                  'from-slate-800/50 to-slate-700/50 border-slate-700/30';
                
                return (
                  <Link key={market.id} href={`/markets/${market.id}`}>
                    <div className={`relative group cursor-pointer rounded-xl bg-gradient-to-br ${heatColor} border backdrop-blur-sm p-4 hover:scale-[1.02] transition-all duration-200`}>
                      {isHot && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
                            🔥 Hot
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                          {market.category}
                        </Badge>
                        <span className="text-xs text-gray-400">#{idx + 1}</span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-white mb-3 line-clamp-2 min-h-[40px]">
                        {market.question}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400">YES {yesPercent.toFixed(0)}%</span>
                          <span className="text-red-400">NO {(100 - yesPercent).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${yesPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{market.totalTrades} trades</span>
                          <span>{((market.totalVolume || 0) / 1000).toFixed(1)}K vol</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Resolution Watch - Expiring Soon */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
                <Timer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-orbitron font-bold text-white">Resolution Watch</h2>
                <p className="text-xs text-gray-400">Markets expiring soon</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringMarkets.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No markets expiring soon</p>
              </div>
            ) : (
              expiringMarkets.map((market: PredictionMarket) => {
                const deadline = new Date(market.deadline);
                const now = new Date();
                const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const urgencyColor = daysLeft <= 3 ? 'border-red-500/30 bg-red-500/5' : 
                                     daysLeft <= 7 ? 'border-amber-500/30 bg-amber-500/5' : 
                                     'border-yellow-500/30 bg-yellow-500/5';
                
                return (
                  <Link key={market.id} href={`/markets/${market.id}`}>
                    <div className={`p-4 rounded-xl border backdrop-blur-sm ${urgencyColor} hover:scale-[1.02] transition-all cursor-pointer`}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {market.category}
                        </Badge>
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-yellow-400'
                        }`}>
                          <Timer className="w-3 h-3" />
                          <Countdown deadline={market.deadline} />
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium text-white mb-3 line-clamp-2">
                        {market.question}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-medium">
                          YES {(market.yesPrice / 10000).toFixed(0)}%
                        </span>
                        <span className="text-gray-400">
                          {market.totalTrades} trades
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Two Column Layout: Leaderboard + AI Scout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Predictors Leaderboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-orbitron font-bold text-white">Top Predictors</h2>
                  <p className="text-xs text-gray-400">This week's best performers</p>
                </div>
              </div>
              <Link href="/leagues">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">
                  Full Rankings <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Crown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Leaderboard loading...</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {leaderboard.slice(0, 5).map((user: any, idx: number) => {
                    const isAI = user.isAiAgent;
                    const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                    
                    return (
                      <div key={user.userId || idx} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                        <div className="w-8 text-center font-bold text-lg">
                          {rankIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm truncate">
                              {user.displayName || user.username || 'Anonymous'}
                            </span>
                            {isAI && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs px-1.5">
                                <Bot className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {user.totalTrades || 0} trades • {((user.winRate || 0) * 100).toFixed(0)}% win rate
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">
                            +{((user.totalProfit || 0) / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-gray-400">STREAM</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* AI Market Scout */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/20">
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <h2 className="text-lg font-orbitron font-bold text-white">AI Market Scout</h2>
                  <p className="text-xs text-gray-400">AI-powered opportunities</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4">
              {/* AI Confidence Signal */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">High Confidence Picks</span>
                </div>
                <div className="space-y-2">
                  {activeMarkets
                    .filter((m: PredictionMarket) => m.aiProbability && m.aiProbability > 70)
                    .slice(0, 3)
                    .map((market: PredictionMarket) => (
                      <Link key={market.id} href={`/markets/${market.id}`}>
                        <div className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <span className="text-xs text-white truncate flex-1 mr-2">
                            {market.question.slice(0, 50)}...
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                            {market.aiProbability}%
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  {activeMarkets.filter((m: PredictionMarket) => m.aiProbability && m.aiProbability > 70).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No high confidence picks currently</p>
                  )}
                </div>
              </div>
              
              {/* Market Sentiment */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Market Sentiment</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Overall Bullish</span>
                  <span className="text-sm font-bold text-emerald-400">62%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
              
              {/* Hot Categories */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Trending Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['crypto', 'defi', 'politics', 'tech'].map((cat) => (
                    <Badge key={cat} variant="outline" className="bg-white/5 border-white/10 text-gray-300 text-xs capitalize">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Market Pulse Section */}
        <section>
          <div
            onClick={() => toggleSection('pulse')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-market-pulse"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Market Pulse</h2>
              <p className="text-xs text-gray-400">Live crypto & stock data</p>
            </div>
            {pulseExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
            )}
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
              <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>

          {pulseExpanded && (
            <div className="space-y-4 pl-2">
              {/* Top Movers */}
              {movers.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Top Movers (24h)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {movers.slice(0, 6).map((asset: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white text-sm truncate">{asset.symbol}</h3>
                          {asset.changePercent >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="text-lg font-bold text-white mb-0.5">
                          ${typeof asset.price === 'number' ? asset.price.toFixed(asset.price > 1000 ? 0 : 2) : '0.00'}
                        </div>
                        <div className={`text-xs font-medium ${asset.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crypto */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Crypto</h3>
                {cryptoLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded mb-2" />
                        <div className="h-6 bg-slate-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : cryptoError || cryptoAssets.length === 0 ? (
                  <ApiErrorCard 
                    title="Crypto Data Unavailable"
                    description="API rate limit reached"
                    compact
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cryptoAssets.slice(0, 6).map((asset: any) => (
                      <div 
                        key={asset.symbol}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-all backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white text-sm truncate">{asset.symbol}</h3>
                        </div>
                        <div className="text-lg font-bold text-white mb-0.5">
                          ${typeof asset.price === 'number' ? asset.price.toFixed(asset.price > 1000 ? 0 : 2) : '0.00'}
                        </div>
                        <div className={`text-xs font-medium ${(asset.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(asset.changePercent || 0) >= 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Advanced Market Metrics */}
        <section>
          <div
            onClick={() => toggleSection('metrics')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-advanced-metrics"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Advanced Metrics</h2>
              <p className="text-xs text-gray-400">Market intelligence indicators</p>
            </div>
            {metricsExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
            )}
          </div>

          {metricsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-2">
              {/* Fear & Greed Index */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-medium text-white">Fear & Greed</h3>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{fearGreedIndex}</div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      fearGreedIndex > 75 ? 'bg-emerald-500' : 
                      fearGreedIndex > 50 ? 'bg-yellow-500' : 
                      fearGreedIndex > 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fearGreedIndex}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {fearGreedIndex > 75 ? 'Extreme Greed' : 
                   fearGreedIndex > 50 ? 'Greed' : 
                   fearGreedIndex > 25 ? 'Fear' : 'Extreme Fear'}
                </p>
              </div>

              {/* Crypto Dominance */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CircleDollarSign className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-medium text-white">Dominance</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">BTC</span>
                      <span className="text-white font-medium">{btcDominance}%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${btcDominance}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">ETH</span>
                      <span className="text-white font-medium">{ethDominance}%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ethDominance}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gas Tracker */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Droplet className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-medium text-white">Gas Tracker</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-white">{gasPrice}</span>
                  <span className="text-xs text-gray-400">Gwei</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-700/30 text-center">
                    <div className="text-gray-400">Low</div>
                    <div className="text-white font-semibold">{gasPrice - 5}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30 text-center">
                    <div className="text-gray-400">Avg</div>
                    <div className="text-white font-semibold">{gasPrice}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-700/30 text-center">
                    <div className="text-gray-400">High</div>
                    <div className="text-white font-semibold">{gasPrice + 10}</div>
                  </div>
                </div>
              </div>

              {/* Market Regime */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-medium text-white">Market Regime</h3>
                </div>
                {regime.currentRegime ? (
                  <div className="space-y-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-sm px-3 py-1">
                      {regime.currentRegime}
                    </Badge>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-white">{((regime.confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">No regime data</div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Market News Section */}
        <section>
          <div
            onClick={() => toggleSection('news')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-news"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Newspaper className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Market News</h2>
              <p className="text-xs text-gray-400">Latest market intelligence</p>
            </div>
            {newsExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>

          {newsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              {news.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                  Loading news...
                </div>
              ) : (
                news.slice(0, 6).map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white text-sm line-clamp-2 flex-1">
                        {item.title || item.headline}
                      </h4>
                      <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap bg-white/5">
                        {item.source}
                      </Badge>
                    </div>
                    {item.summary && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.date || 'Recent'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Sector Intelligence */}
        <section>
          <div
            onClick={() => toggleSection('sector')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-sector-intelligence"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Network className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Sector Intelligence</h2>
              <p className="text-xs text-gray-400">Industry performance breakdown</p>
            </div>
            {sectorExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            )}
          </div>

          {sectorExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
              {sectors.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                  Loading sector data...
                </div>
              ) : (
                sectors.map((sector: any) => (
                  <div 
                    key={sector.name}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{sector.name}</h3>
                        <p className="text-xs text-gray-500">{sector.assets} Assets</p>
                      </div>
                      <Badge 
                        className={`text-xs ${(sector.performance || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                      >
                        {(sector.performance || 0) >= 0 ? '↗' : '↘'} {Math.abs(sector.performance || 0).toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Volume</span>
                        <span className="text-white font-medium">
                          ${((sector.volume || 0) / 1e9).toFixed(2)}B
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Sentiment</span>
                        <span className="text-white font-medium">
                          {((sector.sentiment || 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                          style={{ width: `${(sector.sentiment || 0.5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Macro Economic Dashboard */}
        <section>
          <div
            onClick={() => toggleSection('macro')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-macro-dashboard"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Economic Calendar</h2>
              <p className="text-xs text-gray-400">Upcoming events & markets</p>
            </div>
            {macroExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
            )}
          </div>

          {macroExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-2">
              {/* Economic Events */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Upcoming Events
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No upcoming events</p>
                  ) : (
                    events.slice(0, 6).map((event: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-800/30 text-xs">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-white">{event.title}</span>
                          <Badge variant="outline" className="text-xs">{event.impact}</Badge>
                        </div>
                        <p className="text-gray-400">{event.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Event-Linked Markets */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Related Markets
                </h3>
                <div className="space-y-2">
                  {activeMarkets
                    .filter((m: PredictionMarket) => 
                      m.category === 'macro' || 
                      m.tags?.some((t: string) => t.toLowerCase().includes('fed') || t.toLowerCase().includes('rate'))
                    )
                    .slice(0, 4)
                    .map((market: PredictionMarket) => (
                      <Link key={market.id} href={`/markets/${market.id}`}>
                        <div className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <p className="text-xs text-white font-medium line-clamp-1 mb-1">
                            {market.question}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-400">
                              YES {(market.yesPrice / 10000).toFixed(0)}%
                            </span>
                            <span className="text-gray-400">
                              {market.totalTrades} trades
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  {activeMarkets.filter((m: PredictionMarket) => m.category === 'macro').length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No macro-linked markets</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Content Intelligence */}
        <section>
          <div
            onClick={() => toggleSection('content')}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all backdrop-blur-sm"
            data-testid="toggle-content-intelligence"
          >
            <div className="p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
              <Cpu className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Content Intelligence</h2>
              <p className="text-xs text-gray-400">AI-curated insights</p>
            </div>
            {contentExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-400 transition-colors" />
            )}
          </div>

          {contentExpanded && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Tabs value={contentFilter} onValueChange={setContentFilter} className="mb-4">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-all">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="twitter" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-social">
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-videos">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="news" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-news">
                    News
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {stories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No content available
                  </div>
                ) : (
                  stories.slice(0, 6).map((story: any) => (
                    <div 
                      key={story.id}
                      className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all border border-slate-700/30 hover:border-purple-500/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm line-clamp-2 flex-1">
                          {story.title}
                        </h4>
                        <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap">
                          {story.source}
                        </Badge>
                      </div>
                      {story.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {story.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-cyan-600/20 border border-white/10 backdrop-blur-sm text-center">
          <h3 className="text-lg font-orbitron font-bold text-white mb-2">
            Ready to make predictions?
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Join the AI-powered prediction market revolution
          </p>
          <Link href="/markets">
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 rounded-xl px-6" data-testid="button-start-trading">
              <Rocket className="w-4 h-4 mr-2" />
              Start Trading
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
