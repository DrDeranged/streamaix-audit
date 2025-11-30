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
  Cpu,
  Anchor,
  Check,
  X,
  TrendingUpDown,
  Banknote,
  Globe,
  PiggyBank,
  Landmark,
  BarChart2,
  Gauge,
  Coins
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
  outcome?: string;
}

interface Trade {
  id: string;
  marketId: string;
  userId: string;
  outcome: string;
  tradeType: string;
  shares: number;
  price: number;
  streamAmount: number;
  createdAt: string;
  marketQuestion: string;
  marketCategory: string;
  username: string;
}

interface Whale {
  userId: string;
  username: string;
  isAiAgent: boolean;
  totalInvested: number;
  totalShares: number;
  positionCount: number;
  topPositions: any[];
}

export default function Discover() {
  const [pulseExpanded, setPulseExpanded] = useState(false);
  const [macroExpanded, setMacroExpanded] = useState(true);
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

  // New endpoints for enhanced features
  const { data: recentTradesData } = useQuery({
    queryKey: ['/api/prediction-markets/recent-trades'],
    refetchInterval: 60000, // 1 minute
  });

  const { data: whalesData } = useQuery({
    queryKey: ['/api/prediction-markets/whales'],
  });

  const { data: resolvedMarketsData } = useQuery({
    queryKey: ['/api/prediction-markets/resolved'],
  });

  // Macro Economic Data
  const { data: indexFuturesData } = useQuery({
    queryKey: ['/api/macro/index-futures'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: treasuryYieldsData } = useQuery({
    queryKey: ['/api/macro/treasury-yields'],
    refetchInterval: 300000, // 5 minutes
  });

  const { data: volatilityIndicesData } = useQuery({
    queryKey: ['/api/macro/volatility-indices'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: preciousMetalsData } = useQuery({
    queryKey: ['/api/macro/precious-metals'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: globalLiquidityData } = useQuery({
    queryKey: ['/api/macro/global-liquidity'],
    refetchInterval: 300000,
  });

  const { data: macroCalendarData } = useQuery({
    queryKey: ['/api/macro/calendar'],
  });

  const { data: fedWatchData } = useQuery({
    queryKey: ['/api/macro/fed-watch'],
  });

  // Market Data Queries
  const { data: cryptoData, isLoading: cryptoLoading, isError: cryptoError } = useQuery({
    queryKey: ['/api/analytics/live/crypto'],
  });

  const { data: sectorsData } = useQuery({
    queryKey: ['/api/market/sectors'],
  });

  const { data: marketOverview } = useQuery({
    queryKey: ['/api/market/overview'],
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

  const { data: activityData } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000, // 30 seconds
  });

  // Crypto Intelligence Data
  const { data: fearGreedData } = useQuery({
    queryKey: ['/api/crypto/fear-greed'],
    refetchInterval: 300000,
  });

  const { data: dominanceData } = useQuery({
    queryKey: ['/api/crypto/dominance'],
    refetchInterval: 300000,
  });

  const { data: cryptoMoversData } = useQuery({
    queryKey: ['/api/crypto/movers'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: trendingTokensData } = useQuery({
    queryKey: ['/api/crypto/trending'],
    refetchInterval: 300000,
  });

  const { data: defiTvlData } = useQuery({
    queryKey: ['/api/crypto/defi-tvl'],
    refetchInterval: 300000,
  });

  const { data: gasTrackerData } = useQuery({
    queryKey: ['/api/crypto/gas'],
    refetchInterval: 60000, // 1 minute
  });

  const { data: fundingRatesData } = useQuery({
    queryKey: ['/api/crypto/funding-rates'],
    refetchInterval: 300000,
  });

  const { data: whaleAlertsData } = useQuery({
    queryKey: ['/api/crypto/whale-alerts'],
    refetchInterval: 120000, // 2 minutes
  });

  // Advanced Market Intelligence Data
  const { data: exchangeReservesData } = useQuery({
    queryKey: ['/api/intel/exchange-reserves'],
    refetchInterval: 300000,
  });

  const { data: stablecoinFlowsData } = useQuery({
    queryKey: ['/api/intel/stablecoin-flows'],
    refetchInterval: 300000,
  });

  const { data: altcoinSeasonData } = useQuery({
    queryKey: ['/api/intel/altcoin-season'],
    refetchInterval: 300000,
  });

  const { data: btcLiquidationsData } = useQuery({
    queryKey: ['/api/intel/liquidations/BTC'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: smartMoneyData } = useQuery({
    queryKey: ['/api/intel/smart-money'],
    refetchInterval: 300000,
  });

  const { data: etfData } = useQuery({
    queryKey: ['/api/intel/etfs'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: optionsData } = useQuery({
    queryKey: ['/api/intel/options'],
    refetchInterval: 300000,
  });

  // Extract data
  const markets = (marketsData as any)?.markets || [];
  const leaderboard = (leaderboardData as any)?.leaderboard || [];
  const aiStats = (aiTradesData as any) || {};
  const recentTrades: Trade[] = (recentTradesData as any)?.trades || [];
  const whales: Whale[] = (whalesData as any)?.whales || [];
  const resolvedMarkets = (resolvedMarketsData as any)?.markets || [];
  const cryptoAssets = (cryptoData as any)?.assets || [];
  const sectors = (sectorsData as any)?.sectors || [];
  const movers = (marketOverview as any)?.movers || [];
  const news = (marketNews as any)?.news || [];
  const stories = (trendingContent as any)?.stories || [];
  const regime = (marketRegime as any)?.regime || {};
  const activities = (activityData as any)?.activities || [];
  
  // Macro data
  const indexFutures = (indexFuturesData as any)?.futures || [];
  const treasuryYields = (treasuryYieldsData as any)?.yields || {};
  const yieldCurveStatus = (treasuryYieldsData as any)?.yieldCurveStatus || 'unknown';
  const volatilityIndices = (volatilityIndicesData as any)?.indices || {};
  const preciousMetals = (preciousMetalsData as any)?.metals || {};
  const globalM2 = (globalLiquidityData as any)?.globalM2 || {};
  const macroCalendar = (macroCalendarData as any)?.events || [];
  const fedWatch = (fedWatchData as any)?.fedWatch || {};

  // Crypto Intelligence data
  const fearGreed = (fearGreedData as any)?.data || { value: 50, valueClassification: 'Neutral', trend: 'stable' };
  const dominance = (dominanceData as any)?.data || { btcDominance: 52, ethDominance: 17, altDominance: 26, totalMarketCap: 0 };
  const cryptoGainers = (cryptoMoversData as any)?.gainers || [];
  const cryptoLosers = (cryptoMoversData as any)?.losers || [];
  const topByMarketCap = (cryptoMoversData as any)?.topByMarketCap || [];
  const trendingTokens = (trendingTokensData as any)?.tokens || [];
  const defiTvl = (defiTvlData as any)?.data || { totalTVL: 0, topProtocols: [], chainTVL: [] };
  const gasTracker = (gasTrackerData as any)?.data?.ethereum || { slow: 0, standard: 0, fast: 0, congestionLevel: 'low' };
  const fundingRates = (fundingRatesData as any)?.data || { btc: { rate: 0 }, eth: { rate: 0 }, sentiment: 'neutral' };
  const whaleAlerts = (whaleAlertsData as any)?.alerts || [];

  // Advanced Market Intelligence data
  const exchangeReserves = (exchangeReservesData as any)?.reserves || [];
  const stablecoinFlows = (stablecoinFlowsData as any)?.flows || [];
  const altcoinSeason = (altcoinSeasonData as any)?.data || { score: 50, season: 'neutral', description: 'Loading...' };
  const btcLiquidations = (btcLiquidationsData as any)?.data || { levels: [], currentPrice: 0, riskBias: 'balanced' };
  const smartMoney = (smartMoneyData as any)?.traders || [];
  const etfs = (etfData as any)?.etfs || [];
  const optionsInfo = (optionsData as any)?.options || [];

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

  // Time ago helper
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
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
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-5 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                  data-testid="button-back-home"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="relative flex-shrink-0 hidden xs:block sm:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
                  <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent truncate">
                    Discover
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 hidden md:block">
                    AI-Powered Market Intelligence
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium">
                <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-1 sm:mr-1.5 animate-pulse" />
                <span>Live</span>
              </Badge>
              <Link href="/markets">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 rounded-xl h-8 sm:h-9 px-2.5 sm:px-4 text-[10px] sm:text-xs font-medium shadow-lg shadow-purple-500/20"
                  data-testid="button-explore-markets"
                >
                  <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Markets</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 relative z-10">
        
        {/* Quick Stats Bar - Index Futures & Macro Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* S&P 500 */}
          {indexFutures[0] && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">S&P 500</span>
                  <Badge className={`text-xs px-1.5 py-0 ${indexFutures[0].change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {indexFutures[0].change >= 0 ? '+' : ''}{indexFutures[0].changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-white">{indexFutures[0].price?.toFixed(0)}</p>
              </div>
            </div>
          )}
          
          {/* Nasdaq */}
          {indexFutures[1] && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Nasdaq</span>
                  <Badge className={`text-xs px-1.5 py-0 ${indexFutures[1].change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {indexFutures[1].change >= 0 ? '+' : ''}{indexFutures[1].changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-white">{indexFutures[1].price?.toFixed(0)}</p>
              </div>
            </div>
          )}
          
          {/* VIX */}
          {volatilityIndices.vix && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">VIX</span>
                  <Badge className={`text-xs px-1.5 py-0 ${
                    volatilityIndices.vix.level === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                    volatilityIndices.vix.level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {volatilityIndices.vix.level}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-white">{volatilityIndices.vix.value?.toFixed(1)}</p>
              </div>
            </div>
          )}
          
          {/* DXY */}
          {volatilityIndices.dxy && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">DXY</span>
                  <Badge className={`text-xs px-1.5 py-0 ${volatilityIndices.dxy.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {volatilityIndices.dxy.change >= 0 ? '+' : ''}{volatilityIndices.dxy.changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-white">{volatilityIndices.dxy.value?.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          {/* 10Y Treasury */}
          {treasuryYields['10Y'] && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">10Y Yield</span>
                  <Badge className={`text-xs px-1.5 py-0 ${treasuryYields['10Y'].change >= 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {treasuryYields['10Y'].change >= 0 ? '+' : ''}{(treasuryYields['10Y'].change * 100)?.toFixed(1)}bp
                  </Badge>
                </div>
                <p className="text-lg font-bold text-white">{treasuryYields['10Y'].rate?.toFixed(2)}%</p>
              </div>
            </div>
          )}
          
          {/* Active Markets */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-fuchsia-500/30 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Markets</span>
                <Target className="w-3 h-3 text-fuchsia-400" />
              </div>
              <p className="text-lg font-bold text-white">{activeMarkets.length}</p>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TOP 20 CRYPTO BY MARKET CAP - HORIZONTAL SLIDER (NO TITLE) */}
        {/* =================================================================== */}
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {topByMarketCap.length > 0 ? (
            topByMarketCap.map((coin: any, idx: number) => (
              <div 
                key={coin.symbol || idx}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all min-w-[150px]"
              >
                <span className="text-xs text-gray-500 w-5">#{idx + 1}</span>
                {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{coin.symbol}</p>
                  <p className="text-xs text-gray-500">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <span className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h?.toFixed(1)}%
                </span>
              </div>
            ))
          ) : (
            Array.from({ length: 20 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-w-[150px] animate-pulse">
                <span className="text-xs text-gray-500 w-5">#{idx + 1}</span>
                <div className="w-6 h-6 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-12 bg-white/10 rounded mb-1" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* =================================================================== */}
        {/* CRYPTO INTELLIGENCE DASHBOARD */}
        {/* =================================================================== */}
        
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-orbitron font-bold text-white">Crypto Intelligence</h2>
              <p className="text-xs text-gray-400">Real-time market sentiment & analytics</p>
            </div>
          </div>

          {/* Row 1: Fear & Greed, Market Dominance, Gas Tracker, Funding Rates - Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Fear & Greed Index */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-orange-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400">Fear & Greed</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    fearGreed.value <= 25 ? 'bg-red-500/20 text-red-400' :
                    fearGreed.value <= 45 ? 'bg-orange-500/20 text-orange-400' :
                    fearGreed.value <= 55 ? 'bg-yellow-500/20 text-yellow-400' :
                    fearGreed.value <= 75 ? 'bg-lime-500/20 text-lime-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {fearGreed.valueClassification}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{fearGreed.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {fearGreed.trend === 'rising' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : fearGreed.trend === 'falling' ? (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      ) : (
                        <Activity className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500 capitalize">{fearGreed.trend}</span>
                    </div>
                  </div>
                  <div className="w-16 h-16">
                    <div 
                      className="w-full h-full rounded-full border-4"
                      style={{
                        borderColor: `hsl(${fearGreed.value * 1.2}, 70%, 50%)`,
                        background: `conic-gradient(hsl(${fearGreed.value * 1.2}, 70%, 50%) ${fearGreed.value}%, transparent ${fearGreed.value}%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Market Dominance */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400">Market Dominance</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-400">BTC</span>
                    <span className="text-sm font-bold text-white">{dominance.btcDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${dominance.btcDominance}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400">ETH</span>
                    <span className="text-sm font-bold text-white">{dominance.ethDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${dominance.ethDominance}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-400">Alts</span>
                    <span className="text-sm font-bold text-white">{dominance.altDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full" style={{ width: `${dominance.altDominance}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gas Tracker */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400">ETH Gas</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    gasTracker.congestionLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                    gasTracker.congestionLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    gasTracker.congestionLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {gasTracker.congestionLevel}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500">Slow</p>
                    <p className="text-sm font-bold text-emerald-400">{gasTracker.slow > 0 ? gasTracker.slow : '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500">Std</p>
                    <p className="text-sm font-bold text-yellow-400">{gasTracker.standard > 0 ? gasTracker.standard : '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500">Fast</p>
                    <p className="text-sm font-bold text-orange-400">{gasTracker.fast > 0 ? gasTracker.fast : '—'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">gwei</p>
              </div>
            </div>

            {/* Funding Rates */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400">Funding Rates</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    fundingRates.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                    fundingRates.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {fundingRates.sentiment}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-400">BTC</span>
                    <span className={`text-sm font-bold ${fundingRates.btc?.rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fundingRates.btc?.rate >= 0 ? '+' : ''}{fundingRates.btc?.rate?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400">ETH</span>
                    <span className={`text-sm font-bold ${fundingRates.eth?.rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fundingRates.eth?.rate >= 0 ? '+' : ''}{fundingRates.eth?.rate?.toFixed(4)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {fundingRates.sentiment === 'bullish' ? 'Shorts paying longs' : 
                     fundingRates.sentiment === 'bearish' ? 'Longs paying shorts' : 
                     'Neutral funding'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Top Gainers & Losers - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Top Gainers */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Top Gainers (24h)</h3>
              </div>
              <div className="space-y-2">
                {cryptoGainers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading gainers...</p>
                ) : (
                  cryptoGainers.slice(0, 4).map((coin: any, idx: number) => (
                    <div key={coin.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-4">#{idx + 1}</span>
                        {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                        <div>
                          <p className="text-sm font-medium text-white">{coin.symbol}</p>
                          <p className="text-xs text-gray-500">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                        +{coin.change24h?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-white">Top Losers (24h)</h3>
              </div>
              <div className="space-y-2">
                {cryptoLosers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading losers...</p>
                ) : (
                  cryptoLosers.slice(0, 4).map((coin: any, idx: number) => (
                    <div key={coin.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-4">#{idx + 1}</span>
                        {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                        <div>
                          <p className="text-sm font-medium text-white">{coin.symbol}</p>
                          <p className="text-xs text-gray-500">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        {coin.change24h?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Trending Tokens & DeFi TVL - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Trending Tokens */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white">Trending Tokens</h3>
                <Badge className="ml-auto bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 text-xs">
                  CoinGecko
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trendingTokens.length === 0 ? (
                  <p className="col-span-2 text-sm text-gray-400 text-center py-4">Loading trending...</p>
                ) : (
                  trendingTokens.slice(0, 6).map((token: any, idx: number) => (
                    <div key={token.id || idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      {token.image && <img src={token.image} alt={token.symbol} className="w-5 h-5 rounded-full" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{token.symbol}</p>
                        <p className="text-xs text-gray-500">#{token.marketCapRank || '-'}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 flex items-center justify-center">
                        <span className="text-xs text-fuchsia-400">{10 - idx}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DeFi TVL */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">DeFi TVL</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {defiTvl.totalTVL > 0 ? `$${(defiTvl.totalTVL / 1e9)?.toFixed(2)}B` : '—'}
                  </p>
                  <p className="text-xs text-gray-500">Total Locked</p>
                </div>
              </div>
              <div className="space-y-2">
                {defiTvl.topProtocols?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading protocols...</p>
                ) : (
                  defiTvl.topProtocols?.slice(0, 4).map((protocol: any, idx: number) => (
                    <div key={protocol.name || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">#{idx + 1}</span>
                        {protocol.logo && <img src={protocol.logo} alt={protocol.name} className="w-5 h-5 rounded-full" />}
                        <div>
                          <p className="text-xs font-medium text-white">{protocol.name}</p>
                          <p className="text-xs text-gray-500">{protocol.chain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-white">${(protocol.tvl / 1e9)?.toFixed(2)}B</p>
                        <p className={`text-xs ${protocol.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Whale Alerts */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Whale Alerts</h3>
              <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                <Radio className="w-2 h-2 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {whaleAlerts.length === 0 ? (
                <p className="col-span-full text-sm text-gray-400 text-center py-4">No recent whale activity</p>
              ) : (
                whaleAlerts.slice(0, 6).map((alert: any, idx: number) => (
                  <div key={alert.id || idx} className={`p-3 rounded-lg border ${
                    alert.significance === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    alert.significance === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${
                        alert.type === 'exchange_deposit' ? 'bg-red-500/20 text-red-400' :
                        alert.type === 'exchange_withdrawal' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {alert.type === 'exchange_deposit' ? 'Exchange In' :
                         alert.type === 'exchange_withdrawal' ? 'Exchange Out' :
                         'Transfer'}
                      </Badge>
                      <span className="text-xs text-gray-500">{timeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">
                        {alert.amount?.toLocaleString()} {alert.coin}
                      </p>
                      <span className="text-xs text-gray-500">
                        (${(alert.usdValue / 1e6)?.toFixed(1)}M)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {alert.from} → {alert.to}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* MACRO INTELLIGENCE DASHBOARD - Moved higher for better visibility */}
        {/* =================================================================== */}
        
        <section>
          <div
            onClick={() => toggleSection('macro')}
            className="flex items-center gap-2 mb-3 cursor-pointer group p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all backdrop-blur-sm"
            data-testid="toggle-macro-dashboard"
          >
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-white">Macro Intelligence</h2>
              <p className="text-xs text-gray-400">Global liquidity, Fed watch, treasury yields, economic calendar</p>
            </div>
            {macroExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>

          {macroExpanded && (
            <div className="space-y-3">
              {/* Index Futures Row - Compact */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {indexFutures.map((future: any) => (
                  <div key={future.symbol} className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{future.symbol}</span>
                      <Badge className={`text-[10px] px-1.5 ${future.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {future.change >= 0 ? '+' : ''}{future.changePercent?.toFixed(2)}%
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-white">{future.price?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Treasury Yields + VIX/DXY + Fed Watch - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Treasury Yields */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-medium text-white">Treasury Yields</h3>
                    <Badge className={`ml-auto text-[10px] px-1.5 ${
                      yieldCurveStatus === 'inverted' ? 'bg-red-500/20 text-red-400' :
                      yieldCurveStatus === 'flat' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {yieldCurveStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(treasuryYields).slice(0, 4).map(([term, data]: [string, any]) => (
                      <div key={term} className="text-center p-1.5 rounded bg-slate-800/50">
                        <p className="text-[10px] text-gray-400">{term}</p>
                        <p className="text-xs font-bold text-white">{data.rate?.toFixed(2)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precious Metals - Gold & Silver */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-medium text-white">Precious Metals</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {preciousMetals.gold && (
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[10px] text-gray-400">Gold (XAU)</p>
                        <p className="text-lg font-bold text-amber-400">${preciousMetals.gold.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <span className={`text-[10px] ${preciousMetals.gold.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {preciousMetals.gold.change >= 0 ? '+' : ''}{preciousMetals.gold.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {preciousMetals.silver && (
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[10px] text-gray-400">Silver (XAG)</p>
                        <p className="text-lg font-bold text-gray-300">${preciousMetals.silver.price?.toFixed(2)}</p>
                        <span className={`text-[10px] ${preciousMetals.silver.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {preciousMetals.silver.change >= 0 ? '+' : ''}{preciousMetals.silver.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fed Watch - Compact */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-medium text-white">Fed Watch</h3>
                  </div>
                  {fedWatch.nextMeeting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Current Rate</span>
                        <span className="text-xs font-bold text-white">{fedWatch.currentRate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded bg-slate-800/50 flex justify-between">
                          <span className="text-gray-400">Hold</span>
                          <span className="text-white">{fedWatch.nextMeeting.probabilities?.hold}%</span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-800/50 flex justify-between">
                          <span className="text-emerald-400">-25bp</span>
                          <span className="text-white">{fedWatch.nextMeeting.probabilities?.cut25}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Global M2 + Calendar - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Global M2 */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-medium text-white">Global M2 Liquidity</h3>
                    <Badge className={`ml-auto text-[10px] px-1.5 ${
                      globalM2.global?.trend === 'expanding' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {globalM2.global?.trend || 'neutral'}
                    </Badge>
                  </div>
                  {globalM2.dataAvailable && globalM2.global ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">${globalM2.global.value?.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">Trillion</span>
                        <span className={`text-xs ${globalM2.global.change30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          +{globalM2.global.change30d}% (30d)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[9px]">
                        <div className="p-1 rounded bg-slate-800/50 text-center">
                          <span className="text-gray-400">US</span>
                          <p className="text-white font-medium">${globalM2.us?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-slate-800/50 text-center">
                          <span className="text-gray-400">CN</span>
                          <p className="text-white font-medium">${globalM2.china?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-slate-800/50 text-center">
                          <span className="text-gray-400">EU</span>
                          <p className="text-white font-medium">${globalM2.eurozone?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-slate-800/50 text-center">
                          <span className="text-gray-400">JP</span>
                          <p className="text-white font-medium">${globalM2.japan?.value}T</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Loading liquidity data...</p>
                  )}
                </div>

                {/* Economic Calendar */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-medium text-white">Economic Calendar</h3>
                    <Badge className="ml-auto text-[10px] px-1.5 bg-orange-500/20 text-orange-400">
                      {macroCalendar.filter((e: any) => e.impact === 'high').length} High Impact
                    </Badge>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {macroCalendar.length > 0 ? (
                      macroCalendar.slice(0, 4).map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-slate-800/30">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            event.impact === 'high' ? 'bg-red-400' :
                            event.impact === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                          }`} />
                          <p className="text-[10px] text-white truncate flex-1">{event.event}</p>
                          <span className="text-[10px] text-gray-500">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">No events scheduled</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* ADVANCED MARKET INTELLIGENCE */}
        {/* =================================================================== */}
        
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-orbitron font-bold text-white">Advanced Intelligence</h2>
              <p className="text-xs text-gray-400">Institutional-grade market signals</p>
            </div>
          </div>

          {/* Row 1: ETF Dashboard */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Crypto ETF Dashboard</h3>
              <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                Institutional
              </Badge>
            </div>
            
            {/* ETF Tabs */}
            <div className="mb-4 flex gap-2">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">BTC ETFs</Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">ETH ETFs</Badge>
            </div>

            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-2">
              {etfs.length === 0 ? (
                <p className="text-center py-4 text-gray-400">Loading ETF data...</p>
              ) : (
                etfs.slice(0, 6).map((etf: any, idx: number) => (
                  <div key={etf.ticker || idx} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs px-1.5 py-0.5 ${etf.asset === 'BTC' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {etf.asset}
                        </Badge>
                        <span className="font-medium text-white text-sm">{etf.ticker}</span>
                      </div>
                      <span className={`text-sm font-bold ${etf.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {etf.change24h >= 0 ? '+' : ''}{etf.change24h?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">Price</span>
                        <span className="text-white">${etf.price?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">AUM</span>
                        <span className="text-white">${(etf.aum / 1e9)?.toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Flow 24h</span>
                        <span className={etf.flow24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {etf.flow24h >= 0 ? '+' : ''}${(etf.flow24h / 1e6)?.toFixed(0)}M
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-gray-500 font-medium">ETF</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Price</th>
                    <th className="text-right py-2 text-gray-500 font-medium">24h</th>
                    <th className="text-right py-2 text-gray-500 font-medium">AUM</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Flow 24h</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Holdings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {etfs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-400">Loading ETF data...</td></tr>
                  ) : (
                    etfs.slice(0, 8).map((etf: any, idx: number) => (
                      <tr key={etf.ticker || idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs px-1.5 py-0.5 ${etf.asset === 'BTC' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {etf.asset}
                            </Badge>
                            <span className="font-medium text-white">{etf.ticker}</span>
                          </div>
                        </td>
                        <td className="text-right text-white">${etf.price?.toFixed(2)}</td>
                        <td className={`text-right ${etf.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {etf.change24h >= 0 ? '+' : ''}{etf.change24h?.toFixed(2)}%
                        </td>
                        <td className="text-right text-white">${(etf.aum / 1e9)?.toFixed(1)}B</td>
                        <td className={`text-right ${etf.flow24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {etf.flow24h >= 0 ? '+' : ''}${(etf.flow24h / 1e6)?.toFixed(0)}M
                        </td>
                        <td className="text-right text-gray-400">{(etf.holdings / 1000)?.toFixed(1)}K</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* ETF Flow Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500">Total BTC ETF AUM</p>
                <p className="text-lg font-bold text-orange-400">
                  ${(etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.aum || 0), 0) / 1e9).toFixed(1)}B
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500">BTC 24h Net Flow</p>
                <p className={`text-lg font-bold ${etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${(etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) / 1e6).toFixed(0)}M
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500">Total ETH ETF AUM</p>
                <p className="text-lg font-bold text-blue-400">
                  ${(etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.aum || 0), 0) / 1e9).toFixed(1)}B
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500">ETH 24h Net Flow</p>
                <p className={`text-lg font-bold ${etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${(etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) / 1e6).toFixed(0)}M
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Exchange Reserves & Stablecoin Flows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Exchange Reserves */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Exchange Reserves</h3>
                <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                  On-Chain
                </Badge>
              </div>
              <div className="space-y-3">
                {exchangeReserves.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading reserves...</p>
                ) : (
                  exchangeReserves.slice(0, 5).map((reserve: any, idx: number) => (
                    <div key={reserve.exchange || idx} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{reserve.exchange}</span>
                        <Badge className={`text-xs ${
                          reserve.trend === 'accumulating' ? 'bg-emerald-500/20 text-emerald-400' :
                          reserve.trend === 'distributing' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {reserve.trend}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-orange-400">BTC: </span>
                          <span className="text-white">{(reserve.btcReserve / 1000)?.toFixed(1)}K</span>
                          <span className={`ml-1 ${reserve.btcChange24h < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({reserve.btcChange24h < 0 ? '' : '+'}{reserve.btcChange24h?.toFixed(0)})
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-400">ETH: </span>
                          <span className="text-white">{(reserve.ethReserve / 1000000)?.toFixed(2)}M</span>
                          <span className={`ml-1 ${reserve.ethChange24h < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({reserve.ethChange24h < 0 ? '' : '+'}{(reserve.ethChange24h / 1000)?.toFixed(1)}K)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                📉 Outflows = Accumulation (Bullish) | 📈 Inflows = Selling Pressure
              </p>
            </div>

            {/* Stablecoin Flows */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Stablecoin Flows</h3>
                <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                  Liquidity
                </Badge>
              </div>
              <div className="space-y-3">
                {stablecoinFlows.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading stablecoin data...</p>
                ) : (
                  stablecoinFlows.map((flow: any, idx: number) => (
                    <div key={flow.coin || idx} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{flow.coin}</span>
                          <Badge className={`text-xs ${
                            flow.marketImpact === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                            flow.marketImpact === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {flow.marketImpact}
                          </Badge>
                        </div>
                        <span className="text-sm text-white">${(flow.totalSupply / 1e9)?.toFixed(1)}B</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">24h Net Flow:</span>
                        <span className={flow.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {flow.netFlow >= 0 ? '+' : ''}${(flow.netFlow / 1e6)?.toFixed(0)}M
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full ${flow.netFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(flow.netFlow) / 5e8 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                🟢 Minting = Fresh buying power | 🔴 Burning = Capital exit
              </p>
            </div>
          </div>

          {/* Row 3: Altcoin Season, Options, Liquidations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Altcoin Season Indicator */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white">Altcoin Season</h3>
              </div>
              <div className="text-center mb-4">
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle 
                      cx="48" cy="48" r="40" fill="none" 
                      stroke={altcoinSeason.season === 'alt' ? '#a855f7' : altcoinSeason.season === 'btc' ? '#f97316' : '#6b7280'}
                      strokeWidth="8"
                      strokeDasharray={`${(altcoinSeason.score / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-white">{altcoinSeason.score}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                </div>
              </div>
              <Badge className={`w-full justify-center py-1.5 ${
                altcoinSeason.season === 'alt' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                altcoinSeason.season === 'btc' ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {altcoinSeason.season === 'alt' ? '🚀 Altseason' : 
                 altcoinSeason.season === 'btc' ? '₿ Bitcoin Season' : 
                 '⚖️ Neutral Market'}
              </Badge>
              <p className="text-xs text-gray-500 text-center mt-2">{altcoinSeason.description}</p>
            </div>

            {/* Options Put/Call */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Options P/C Ratio</h3>
              </div>
              <div className="space-y-4">
                {optionsInfo.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading options...</p>
                ) : (
                  optionsInfo.map((opt: any, idx: number) => (
                    <div key={opt.asset || idx} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${opt.asset === 'BTC' ? 'text-orange-400' : 'text-blue-400'}`}>
                          {opt.asset}
                        </span>
                        <Badge className={`text-xs ${
                          opt.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                          opt.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {opt.sentiment}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-white">{opt.putCallRatio?.toFixed(2)}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          Max Pain: ${opt.maxPainPrice?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {'<'}0.7 = Bullish | {'>'}1.0 = Bearish
              </p>
            </div>

            {/* Liquidation Risk */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-white">BTC Liquidations</h3>
              </div>
              <div className="text-center mb-3">
                <p className="text-xs text-gray-500">Current Price</p>
                <p className="text-xl font-bold text-white">${btcLiquidations.currentPrice?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                {btcLiquidations.levels?.slice(0, 6).map((level: any, idx: number) => {
                  const isAbove = level.price > btcLiquidations.currentPrice;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-right text-gray-400">${(level.price / 1000)?.toFixed(1)}K</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isAbove ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((level.totalValue / 5e8) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-gray-500">${(level.totalValue / 1e6)?.toFixed(0)}M</span>
                    </div>
                  );
                })}
              </div>
              <Badge className={`w-full justify-center mt-3 ${
                btcLiquidations.riskBias === 'long_heavy' ? 'bg-red-500/20 text-red-400' :
                btcLiquidations.riskBias === 'short_heavy' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {btcLiquidations.riskBias === 'long_heavy' ? 'Heavy Long Exposure' :
                 btcLiquidations.riskBias === 'short_heavy' ? 'Heavy Short Exposure' :
                 'Balanced Positioning'}
              </Badge>
            </div>
          </div>

          {/* Row 4: Smart Money Tracker */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Smart Money Tracker</h3>
              <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                Top Traders
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartMoney.length === 0 ? (
                <p className="col-span-full text-sm text-gray-400 text-center py-4">Loading smart money data...</p>
              ) : (
                smartMoney.slice(0, 6).map((trader: any, idx: number) => (
                  <div key={trader.traderName || idx} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-500/30 text-amber-400' :
                          idx === 1 ? 'bg-gray-400/30 text-gray-300' :
                          idx === 2 ? 'bg-orange-700/30 text-orange-400' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-white">{trader.traderName}</span>
                        {trader.isAiAgent && <Bot className="w-3 h-3 text-purple-400" />}
                      </div>
                      <Badge className={`text-xs ${trader.winRate >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {trader.winRate}% Win
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Trades: </span>
                        <span className="text-white">{trader.recentTrades}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Streak: </span>
                        <span className="text-emerald-400">🔥 {trader.streak}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Three Column Layout: Activity Feed, Whale Tracker, Resolution History */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Real-time Activity Feed */}
          <section className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-white">Live Activity</h2>
                <p className="text-xs text-gray-400">Real-time platform activity</p>
              </div>
              <Badge className="ml-auto bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                <Radio className="w-2 h-2 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-white/5">
                  {recentTrades.length === 0 && activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Waiting for activity...</p>
                    </div>
                  ) : (
                    <>
                      {recentTrades.slice(0, 15).map((trade, idx) => (
                        <div key={trade.id || idx} className="p-3 hover:bg-white/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${trade.outcome === 'yes' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                              {trade.outcome === 'yes' ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-white truncate">
                                  {trade.username}
                                </span>
                                <span className={`text-xs ${trade.outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {trade.tradeType === 'buy' ? 'bought' : 'sold'} {trade.outcome?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {trade.marketQuestion?.slice(0, 50)}...
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>{trade.streamAmount} STREAM</span>
                                <span>•</span>
                                <span>{timeAgo(trade.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </section>

          {/* Whale Tracker */}
          <section className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                <Anchor className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-white">Whale Tracker</h2>
                <p className="text-xs text-gray-400">Top predictor positions</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-white/5">
                  {whales.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Anchor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No whale activity yet</p>
                    </div>
                  ) : (
                    whales.slice(0, 8).map((whale, idx) => (
                      <div key={whale.userId || idx} className="p-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                            idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                            idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                            'bg-slate-700 text-gray-300'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white truncate">
                                {whale.username}
                              </span>
                              {whale.isAiAgent && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs px-1.5">
                                  <Bot className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>{whale.positionCount} positions</span>
                              <span className="text-emerald-400 font-medium">
                                {((whale.totalInvested || 0) / 1000).toFixed(1)}K STREAM
                              </span>
                            </div>
                            {whale.topPositions?.[0] && (
                              <div className="mt-2 p-2 rounded bg-slate-800/50 text-xs">
                                <p className="text-gray-400 line-clamp-1 mb-1">
                                  {whale.topPositions[0].marketQuestion?.slice(0, 40)}...
                                </p>
                                <Badge className={`text-xs ${whale.topPositions[0].outcome === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {whale.topPositions[0].outcome?.toUpperCase()} • {whale.topPositions[0].shares} shares
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </section>

          {/* Resolution History */}
          <section className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/20">
                <Check className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-white">Resolution History</h2>
                <p className="text-xs text-gray-400">Recently resolved markets</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-white/5">
                  {resolvedMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No resolved markets yet</p>
                    </div>
                  ) : (
                    resolvedMarkets.slice(0, 10).map((market: any, idx: number) => (
                      <Link key={market.id || idx} href={`/markets/${market.id}`}>
                        <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              market.outcome === 'yes' ? 'bg-emerald-500/20' : 
                              market.outcome === 'no' ? 'bg-red-500/20' : 'bg-gray-500/20'
                            }`}>
                              {market.outcome === 'yes' ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : market.outcome === 'no' ? (
                                <X className="w-4 h-4 text-red-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white line-clamp-2 mb-1">
                                {market.question}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge className={`${
                                  market.outcome === 'yes' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                                  market.outcome === 'no' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                  Resolved: {market.outcome?.toUpperCase() || 'VOID'}
                                </Badge>
                                <span className="text-gray-500">
                                  {market.totalTrades} trades
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </section>
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
                const yesPercent = market.yesPrice / 100;
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
                            Hot
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
                          YES {(market.yesPrice / 100).toFixed(0)}%
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
