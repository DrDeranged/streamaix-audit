import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
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
  Coins,
  Bell,
  RefreshCw,
  Percent,
  MessageSquare,
  Unlock,
  Gift,
  Vote,
  Briefcase,
  ArrowRightLeft,
  Lightbulb,
  AlertTriangle,
  Shield,
  MapPin,
  Twitter,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WidgetSettingsPanel } from "@/components/WidgetSettingsPanel";
import { PageHeader } from "@/components/PageHeader";
import { StatGrid } from "@/components/StatGrid";
import { useWidgetSettings } from "@/contexts/WidgetSettingsContext";

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

interface MarketSignal {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  asset: string;
  price: number;
  change24h: number;
  signal: string;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

interface WhaleMovement {
  id: string;
  type: 'accumulation' | 'distribution' | 'transfer';
  asset: string;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
  timestamp: string;
  significance: 'low' | 'medium' | 'high';
}

interface SentimentData {
  asset: string;
  overall: number;
  social: number;
  news: number;
  technical: number;
  trend: 'rising' | 'falling' | 'stable';
}

function SignalCard({ signal }: { signal: MarketSignal }) {
  const isPositive = signal.type === 'bullish';
  const isNegative = signal.type === 'bearish';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border border-ink-edge bg-ink-surface",
        isPositive && "bg-gain/10 border-gain/30",
        isNegative && "bg-loss/10 border-loss/30",
        !isPositive && !isNegative && "bg-ink-raised border-ink-edge"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-xl",
            isPositive && "bg-gain/20",
            isNegative && "bg-loss/20",
            !isPositive && !isNegative && "bg-ink-raised"
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-gain" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4 text-loss" />
            ) : (
              <Activity className="w-4 h-4 text-secondary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-primary">{signal.asset}</p>
            <p className="text-xs text-secondary">${signal.price?.toLocaleString()}</p>
          </div>
        </div>
        
        <Badge className={cn(
          "text-[10px]",
          signal.confidence >= 80 && "bg-gain/20 text-gain border-gain/30",
          signal.confidence >= 60 && signal.confidence < 80 && "bg-warn/20 text-warn border-warn/30",
          signal.confidence < 60 && "bg-ink-raised text-secondary border-ink-edge"
        )}>
          {signal.confidence}% confidence
        </Badge>
      </div>
      
      <p className="text-sm font-medium text-primary mb-1">{signal.signal}</p>
      <p className="text-xs text-secondary mb-3">{signal.reasoning}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-ink-raised rounded-xl overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                isPositive && "bg-gain",
                isNegative && "bg-loss",
                !isPositive && !isNegative && "bg-secondary"
              )}
              style={{ width: `${signal.strength}%` }}
            />
          </div>
          <span className="text-[10px] text-muted">Strength: {signal.strength}%</span>
        </div>
        <span className="text-[10px] text-muted">
          {new Date(signal.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

function WhaleMovementCard({ movement }: { movement: WhaleMovement }) {
  const typeColors = {
    accumulation: { bg: 'bg-gain/20', text: 'text-gain', border: 'border-gain/30' },
    distribution: { bg: 'bg-loss/20', text: 'text-loss', border: 'border-loss/30' },
    transfer: { bg: 'bg-accent-core/20', text: 'text-accent-bright', border: 'border-accent-core/30' },
  };
  
  const colors = typeColors[movement.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-3 rounded-xl border border-ink-edge bg-ink-surface",
        colors.bg, colors.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplet className={cn("w-4 h-4", colors.text)} />
          <span className="font-semibold text-primary text-sm">{movement.asset}</span>
          <Badge className={cn("text-[10px]", colors.bg, colors.text, colors.border)}>
            {movement.type}
          </Badge>
        </div>
        <Badge className={cn(
          "text-[10px]",
          movement.significance === 'high' && "bg-loss/20 text-loss border-loss/30",
          movement.significance === 'medium' && "bg-warn/20 text-warn border-warn/30",
          movement.significance === 'low' && "bg-ink-raised text-secondary border-ink-edge"
        )}>
          {movement.significance}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="text-secondary">Amount</p>
          <p className="text-primary font-medium">{movement.amount?.toLocaleString()} {movement.asset}</p>
          <p className="text-muted">${movement.amountUsd?.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-secondary">From → To</p>
          <p className="text-body font-mono text-[10px]">
            {movement.from?.slice(0, 6)}...{movement.from?.slice(-4)}
          </p>
          <p className="text-body font-mono text-[10px]">
            {movement.to?.slice(0, 6)}...{movement.to?.slice(-4)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SentimentGauge({ data }: { data: SentimentData }) {
  const getColor = (value: number) => {
    if (value >= 70) return 'text-gain';
    if (value >= 50) return 'text-warn';
    return 'text-loss';
  };
  
  const getBgColor = (value: number) => {
    if (value >= 70) return 'bg-gain';
    if (value >= 50) return 'bg-warn';
    return 'bg-loss';
  };
  
  return (
    <div className="p-4 rounded-xl bg-ink-surface border border-ink-edge">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-primary">{data.asset}</h4>
        <div className="flex items-center gap-1">
          {data.trend === 'rising' && <TrendingUp className="w-4 h-4 text-gain" />}
          {data.trend === 'falling' && <TrendingDown className="w-4 h-4 text-loss" />}
          {data.trend === 'stable' && <Activity className="w-4 h-4 text-secondary" />}
          <span className={cn(
            "text-xs capitalize",
            data.trend === 'rising' && 'text-gain',
            data.trend === 'falling' && 'text-loss',
            data.trend === 'stable' && 'text-secondary'
          )}>
            {data.trend}
          </span>
        </div>
      </div>
      
      <div className="relative h-3 bg-ink-raised rounded-xl mb-4 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", getBgColor(data.overall))}
          style={{ width: `${data.overall}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">{data.overall}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted">Social</p>
          <p className={cn("text-sm font-bold", getColor(data.social))}>{data.social}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted">News</p>
          <p className={cn("text-sm font-bold", getColor(data.news))}>{data.news}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted">Technical</p>
          <p className={cn("text-sm font-bold", getColor(data.technical))}>{data.technical}%</p>
        </div>
      </div>
    </div>
  );
}

function CorrelationHeatmap() {
  const assets = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
  const correlations = [
    [1.00, 0.85, 0.72, 0.68, 0.45],
    [0.85, 1.00, 0.78, 0.65, 0.42],
    [0.72, 0.78, 1.00, 0.58, 0.35],
    [0.68, 0.65, 0.58, 1.00, 0.52],
    [0.45, 0.42, 0.35, 0.52, 1.00],
  ];
  
  const getColor = (value: number) => {
    if (value >= 0.8) return 'bg-gain';
    if (value >= 0.6) return 'bg-gain/70';
    if (value >= 0.4) return 'bg-warn/70';
    if (value >= 0.2) return 'bg-warn/70';
    return 'bg-loss/70';
  };
  
  return (
    <div className="p-4 rounded-xl bg-ink-surface border border-ink-edge">
      <h3 className="font-semibold text-primary mb-4">Asset Correlation Matrix</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-1 pl-12">
            {assets.map(asset => (
              <div key={asset} className="w-10 text-center text-[10px] text-secondary">{asset}</div>
            ))}
          </div>
          {assets.map((asset, i) => (
            <div key={asset} className="flex gap-1 items-center">
              <div className="w-10 text-[10px] text-secondary text-right pr-2">{asset}</div>
              {correlations[i].map((corr, j) => (
                <motion.div
                  key={j}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (i * 5 + j) * 0.02 }}
                  className={cn(
                    "w-10 h-10 rounded flex items-center justify-center text-[10px] font-bold text-primary",
                    getColor(corr)
                  )}
                >
                  {corr.toFixed(2)}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-loss/70" />
           <span className="text-[10px] text-muted">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warn/70" />
           <span className="text-[10px] text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gain" />
           <span className="text-[10px] text-muted">High</span>
        </div>
      </div>
    </div>
  );
}

export default function Discover() {
  const { isVisible } = useWidgetSettings();
  const [pulseExpanded, setPulseExpanded] = useState(false);
  const [macroExpanded, setMacroExpanded] = useState(true);
  const [sectorExpanded, setSectorExpanded] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [signalsExpanded, setSignalsExpanded] = useState(true);
  const [whaleMovementsExpanded, setWhaleMovementsExpanded] = useState(false);
  const [sentimentExpanded, setSentimentExpanded] = useState(false);
  const [correlationExpanded, setCorrelationExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchCrypto(),
        refetchOverview(),
        refetchSignals(),
        refetchGlobal(),
        refetchMovers(),
      ]);
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Prediction Markets Data - with staleTime to cache and reduce refetches
  const { data: marketsData } = useQuery<{ markets: PredictionMarket[] }>({
    queryKey: ['/api/prediction-markets'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/prediction-leagues/leaderboard'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: aiTradesData } = useQuery({
    queryKey: ['/api/prediction-markets/ai-stats'],
    staleTime: 5 * 60 * 1000,
  });

  // New endpoints for enhanced features
  const { data: recentTradesData } = useQuery({
    queryKey: ['/api/prediction-markets/recent-trades'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60000,
  });

  const { data: whalesData } = useQuery({
    queryKey: ['/api/prediction-markets/whales'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: resolvedMarketsData } = useQuery({
    queryKey: ['/api/prediction-markets/resolved'],
    staleTime: 5 * 60 * 1000,
  });

  // Macro Economic Data - stale for 5 min, refetch less often
  const { data: indexFuturesData } = useQuery({
    queryKey: ['/api/macro/index-futures'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: treasuryYieldsData } = useQuery({
    queryKey: ['/api/macro/treasury-yields'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: volatilityIndicesData } = useQuery({
    queryKey: ['/api/macro/volatility-indices'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: preciousMetalsData } = useQuery({
    queryKey: ['/api/macro/precious-metals'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: globalLiquidityData } = useQuery({
    queryKey: ['/api/macro/global-liquidity'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: macroCalendarData } = useQuery({
    queryKey: ['/api/macro/calendar'],
    staleTime: 30 * 60 * 1000, // 30 min - calendar rarely changes
    refetchInterval: 1800000,
  });

  const { data: fedWatchData } = useQuery({
    queryKey: ['/api/macro/fed-watch'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  // Market Data Queries - faster refresh for real-time feel
  const { data: cryptoData, isLoading: cryptoLoading, isError: cryptoError, refetch: refetchCrypto } = useQuery({
    queryKey: ['/api/analytics/live/crypto'],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  const { data: sectorsData } = useQuery({
    queryKey: ['/api/market/sectors'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: marketOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['/api/market/overview'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  const { data: marketNews } = useQuery({
    queryKey: ['/api/market/news'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingContent } = useQuery({
    queryKey: ['/api/discover/trending', contentFilter],
    staleTime: 5 * 60 * 1000,
  });

  const { data: marketRegime } = useQuery({
    queryKey: ['/api/correlation/market-regime'],
    staleTime: 10 * 60 * 1000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['/api/activity'],
    staleTime: 30 * 1000,
    refetchInterval: 60000,
  });

  // Crypto Intelligence Data - with caching
  const { data: fearGreedData } = useQuery({
    queryKey: ['/api/crypto/fear-greed'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: dominanceData } = useQuery({
    queryKey: ['/api/crypto/dominance'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: cryptoMoversData } = useQuery({
    queryKey: ['/api/crypto/movers'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: trendingTokensData } = useQuery({
    queryKey: ['/api/crypto/trending'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: defiTvlData } = useQuery({
    queryKey: ['/api/crypto/defi-tvl'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: gasTrackerData } = useQuery({
    queryKey: ['/api/crypto/gas'],
    staleTime: 60 * 1000,
    refetchInterval: 120000,
  });

  const { data: fundingRatesData } = useQuery({
    queryKey: ['/api/crypto/funding-rates'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: whaleAlertsData } = useQuery({
    queryKey: ['/api/crypto/whale-alerts'],
    staleTime: 2 * 60 * 1000,
    refetchInterval: 180000,
  });

  // Advanced Market Intelligence Data - with caching
  const { data: exchangeReservesData } = useQuery({
    queryKey: ['/api/intel/exchange-reserves'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: stablecoinFlowsData } = useQuery({
    queryKey: ['/api/intel/stablecoin-flows'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: altcoinSeasonData } = useQuery({
    queryKey: ['/api/intel/altcoin-season'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: btcLiquidationsData } = useQuery({
    queryKey: ['/api/intel/liquidations/BTC'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: smartMoneyData } = useQuery({
    queryKey: ['/api/intel/smart-money'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: etfData } = useQuery({
    queryKey: ['/api/intel/etfs'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  const { data: optionsData } = useQuery({
    queryKey: ['/api/intel/options'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  // Market Intelligence Hub Data - with caching
  const { data: marketSignalsData, refetch: refetchSignals } = useQuery<{ signals: MarketSignal[] }>({
    queryKey: ['/api/market-intelligence/signals'],
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });

  const { data: whaleMovementsData } = useQuery<{ movements: WhaleMovement[] }>({
    queryKey: ['/api/market-intelligence/whales'],
    staleTime: 60 * 1000,
    refetchInterval: 120000,
  });

  const { data: marketSentimentData } = useQuery<{ sentiments: SentimentData[] }>({
    queryKey: ['/api/market-intelligence/sentiment'],
    staleTime: 60 * 1000,
    refetchInterval: 120000,
  });

  // CoinGecko Pro Data (Premium market data) - with caching
  const { data: cgTrendingData } = useQuery({
    queryKey: ['/api/market/coingecko/trending'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: cgGlobalData, refetch: refetchGlobal } = useQuery({
    queryKey: ['/api/market/coingecko/global'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 90000, // 90 seconds
  });

  const { data: cgMoversData, refetch: refetchMovers } = useQuery({
    queryKey: ['/api/market/coingecko/movers'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  // Alpha Features Data - with caching
  const { data: derivativesData } = useQuery({
    queryKey: ['/api/market/derivatives'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: onchainData } = useQuery({
    queryKey: ['/api/market/onchain'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: volatilityData } = useQuery({
    queryKey: ['/api/market/volatility'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: categoryData } = useQuery({
    queryKey: ['/api/market/categories'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: aiPredictionsData } = useQuery({
    queryKey: ['/api/market/ai-predictions'],
    staleTime: 30 * 60 * 1000,
    refetchInterval: 1800000,
  });

  const { data: apiUsageData } = useQuery({
    queryKey: ['/api/market/coingecko/usage'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 300000,
  });

  // Tech/AI Stock Data - with caching
  const { data: stockMoversData } = useQuery({
    queryKey: ['/api/stocks/tech-ai-movers'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  // Alpha Intelligence Data - with caching for faster loads
  const { data: narrativesData } = useQuery({
    queryKey: ['/api/alpha/narratives'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: ctAlphaData } = useQuery({
    queryKey: ['/api/alpha/ct-feed'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: tokenUnlocksData } = useQuery({
    queryKey: ['/api/alpha/token-unlocks'],
    staleTime: 60 * 60 * 1000, // 1 hour - unlocks don't change often
    refetchInterval: 3600000,
  });

  const { data: airdropsData } = useQuery({
    queryKey: ['/api/alpha/airdrops'],
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchInterval: 7200000,
  });

  const { data: governanceData } = useQuery({
    queryKey: ['/api/alpha/governance'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: vcWalletsData } = useQuery({
    queryKey: ['/api/alpha/vc-wallets'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: exchangeFlowsData } = useQuery({
    queryKey: ['/api/alpha/exchange-flows'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: dexCexVolumeData } = useQuery({
    queryKey: ['/api/alpha/dex-cex-volume'],
    staleTime: 15 * 60 * 1000,
    refetchInterval: 900000,
  });

  const { data: aiTradeIdeasData } = useQuery({
    queryKey: ['/api/alpha/trade-ideas'],
    staleTime: 60 * 60 * 1000, // 1 hour - AI ideas don't change frequently
    refetchInterval: 3600000,
  });

  const { data: eventImpactsData } = useQuery({
    queryKey: ['/api/alpha/event-impacts'],
    staleTime: 60 * 60 * 1000,
    refetchInterval: 3600000,
  });

  const { data: anomaliesData } = useQuery({
    queryKey: ['/api/alpha/anomalies'],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 600000,
  });

  const { data: conferencesData } = useQuery({
    queryKey: ['/api/alpha/conferences'],
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: 86400000,
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

  // Market Intelligence Hub data
  const marketSignals: MarketSignal[] = marketSignalsData?.signals || [];
  const whaleMovements: WhaleMovement[] = whaleMovementsData?.movements || [];
  const marketSentiments: SentimentData[] = marketSentimentData?.sentiments || [];

  // CoinGecko Pro data
  const cgTrending = (cgTrendingData as any)?.trending || [];
  const cgGlobal = (cgGlobalData as any)?.data || null;
  const cgGainers = (cgMoversData as any)?.gainers || [];
  const cgLosers = (cgMoversData as any)?.losers || [];

  // Alpha features data
  const derivatives = (derivativesData as any)?.data || null;
  const onchain = (onchainData as any)?.data || null;
  const volatility = (volatilityData as any)?.data || null;
  const categories = (categoryData as any)?.data || null;
  const aiPredictions = (aiPredictionsData as any)?.data || null;
  const apiUsage = (apiUsageData as any)?.stats || null;

  // Tech/AI Stock data
  const stockGainers = (stockMoversData as any)?.gainers || [];
  const stockLosers = (stockMoversData as any)?.losers || [];
  const stockTrending = (stockMoversData as any)?.trending || [];

  // Alpha Intelligence data with timestamps for freshness indicators
  const narratives = (narrativesData as any)?.narratives || [];
  const narrativesTimestamp = (narrativesData as any)?.timestamp;
  const ctAlpha = (ctAlphaData as any)?.signals || [];
  const ctAlphaTimestamp = (ctAlphaData as any)?.timestamp;
  const tokenUnlocks = (tokenUnlocksData as any)?.unlocks || [];
  const tokenUnlocksTimestamp = (tokenUnlocksData as any)?.timestamp;
  const airdrops = (airdropsData as any)?.airdrops || [];
  const governance = (governanceData as any)?.proposals || [];
  const vcWallets = (vcWalletsData as any)?.activities || [];
  const vcWalletsTimestamp = (vcWalletsData as any)?.timestamp;
  const exchangeFlows = (exchangeFlowsData as any)?.flows || [];
  const exchangeFlowsTimestamp = (exchangeFlowsData as any)?.timestamp;
  const dexCexVolume = (dexCexVolumeData as any)?.volumes || [];
  const aiTradeIdeas = (aiTradeIdeasData as any)?.ideas || [];
  const aiTradeIdeasTimestamp = (aiTradeIdeasData as any)?.timestamp;
  const eventImpacts = (eventImpactsData as any)?.events || [];
  const anomalies = (anomaliesData as any)?.anomalies || [];
  const anomaliesTimestamp = (anomaliesData as any)?.timestamp;
  const conferences = (conferencesData as any)?.conferences || [];

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
    <div className="min-h-[100dvh] bg-ink-page relative overflow-hidden">
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
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-deep/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-core/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-deep/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 relative z-10">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Radio className="h-3 w-3 animate-pulse text-gain" />
              Live · AI-powered market intelligence
            </span>
          }
          title="Discover"
          subtitle="Real-time signals, narratives, and market intelligence across crypto and traditional finance."
          icon={<Brain className="h-5 w-5" />}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-secondary hover:text-primary hover:bg-ink-raised"
                data-testid="button-refresh-data"
                title="Refresh all data"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
              <WidgetSettingsPanel />
              <Link href="/markets">
                <Button
                  size="sm"
                  className="hover:text-primary border-0"
                  data-testid="button-explore-markets"
                >
                  <Rocket className="w-3.5 h-3.5 mr-1.5" />
                  Markets
                </Button>
              </Link>
            </>
          }
        />
        
        {/* Quick Stats Bar - Index Futures & Macro Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* S&P 500 */}
          {indexFutures[0] && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-secondary">S&P 500</span>
                  <Badge className={`text-xs px-1.5 py-0 ${indexFutures[0].change >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
                    {indexFutures[0].change >= 0 ? '+' : ''}{indexFutures[0].changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-primary">{indexFutures[0].price?.toFixed(0)}</p>
              </div>
            </div>
          )}
          
          {/* Nasdaq */}
          {indexFutures[1] && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-secondary">Nasdaq</span>
                  <Badge className={`text-xs px-1.5 py-0 ${indexFutures[1].change >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
                    {indexFutures[1].change >= 0 ? '+' : ''}{indexFutures[1].changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-primary">{indexFutures[1].price?.toFixed(0)}</p>
              </div>
            </div>
          )}
          
          {/* VIX */}
          {volatilityIndices.vix && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-warn/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-secondary">VIX</span>
                  <Badge className={`text-xs px-1.5 py-0 ${
                    volatilityIndices.vix.level === 'low' ? 'bg-gain/20 text-gain' :
                    volatilityIndices.vix.level === 'moderate' ? 'bg-warn/20 text-warn' :
                    'bg-loss/20 text-loss'
                  }`}>
                    {volatilityIndices.vix.level}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-primary">{volatilityIndices.vix.value?.toFixed(1)}</p>
              </div>
            </div>
          )}
          
          {/* DXY */}
          {volatilityIndices.dxy && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-gain/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-secondary">DXY</span>
                  <Badge className={`text-xs px-1.5 py-0 ${volatilityIndices.dxy.change >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
                    {volatilityIndices.dxy.change >= 0 ? '+' : ''}{volatilityIndices.dxy.changePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-lg font-bold text-primary">{volatilityIndices.dxy.value?.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          {/* 10Y Treasury */}
          {treasuryYields['10Y'] && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-secondary">10Y Yield</span>
                  <Badge className={`text-xs px-1.5 py-0 ${treasuryYields['10Y'].change >= 0 ? 'bg-loss/20 text-loss' : 'bg-gain/20 text-gain'}`}>
                    {treasuryYields['10Y'].change >= 0 ? '+' : ''}{(treasuryYields['10Y'].change * 100)?.toFixed(1)}bp
                  </Badge>
                </div>
                <p className="text-lg font-bold text-primary">{treasuryYields['10Y'].rate?.toFixed(2)}%</p>
              </div>
            </div>
          )}
          
          {/* Active Markets */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-secondary">Markets</span>
                <Target className="w-3 h-3 text-accent-bright" />
              </div>
              <p className="text-lg font-bold text-primary">{activeMarkets.length}</p>
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
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-surface border border-ink-edge hover:border-white/20 transition-all min-w-[150px]"
              >
                <span className="text-xs text-muted w-5">#{idx + 1}</span>
                {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{coin.symbol}</p>
                  <p className="text-xs text-muted">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <span className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h?.toFixed(1)}%
                </span>
              </div>
            ))
          ) : (
            Array.from({ length: 20 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-surface border border-ink-edge min-w-[150px] animate-pulse">
                <span className="text-xs text-muted w-5">#{idx + 1}</span>
                <div className="w-6 h-6 rounded-full bg-ink-raised" />
                <div className="flex-1">
                  <div className="h-4 w-12 bg-ink-raised rounded mb-1" />
                  <div className="h-3 w-16 bg-ink-raised rounded" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global Stats Cards */}
        <section className="space-y-3">
          {cgGlobal && (
            <StatGrid>
              {/* Total Market Cap */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-secondary">Total Market Cap</span>
                    <Globe className="w-4 h-4 text-accent-bright" />
                  </div>
                  <p className="text-2xl font-bold text-primary">${(cgGlobal.totalMarketCap / 1e12).toFixed(2)}T</p>
                  <div className="flex items-center gap-1 mt-1">
                    {cgGlobal.marketCapChange24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-gain" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-loss" />
                    )}
                    <span className={`text-xs ${cgGlobal.marketCapChange24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {cgGlobal.marketCapChange24h >= 0 ? '+' : ''}{cgGlobal.marketCapChange24h.toFixed(2)}% (24h)
                    </span>
                  </div>
                </div>
              </div>

              {/* 24h Volume */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-secondary">24h Volume</span>
                    <Activity className="w-4 h-4 text-accent-bright" />
                  </div>
                  <p className="text-2xl font-bold text-primary">${(cgGlobal.totalVolume24h / 1e9).toFixed(1)}B</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-3 h-3 text-accent-bright" />
                    <span className="text-xs text-secondary">{cgGlobal.activeCryptocurrencies.toLocaleString()} coins</span>
                  </div>
                </div>
              </div>

              {/* BTC Dominance */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-warn/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-secondary">BTC Dominance</span>
                    <Crown className="w-4 h-4 text-warn" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{cgGlobal.btcDominance.toFixed(1)}%</p>
                  <div className="w-full bg-ink-raised/50 rounded-full h-1.5 mt-2">
                    <div 
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${cgGlobal.btcDominance}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ETH Dominance */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-secondary">ETH Dominance</span>
                    <Coins className="w-4 h-4 text-accent-bright" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{cgGlobal.ethDominance.toFixed(1)}%</p>
                  <div className="w-full bg-ink-raised/50 rounded-full h-1.5 mt-2">
                    <div 
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(cgGlobal.ethDominance * 3, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </StatGrid>
          )}

          {/* Tech/AI Stock Movers Grid - only show if we have data */}
          {(stockTrending.length > 0 || stockGainers.length > 0 || stockLosers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Trending Tech/AI Stocks */}
            {stockTrending.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-violet-500/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent-bright" />
                    <span className="text-sm font-medium text-primary">Trending Tech/AI</span>
                  </div>
                  <Badge className="bg-accent-core/10 text-accent-bright border border-violet-500/30 text-xs px-2">Stocks</Badge>
                </div>
                <div className="space-y-2">
                  {stockTrending.slice(0, 6).map((stock: any, idx: number) => (
                    <div key={stock.symbol} className="flex items-center gap-3 p-2 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      <span className="text-xs text-muted w-4">#{idx + 1}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-accent-bright">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{stock.name}</p>
                        <p className="text-xs text-muted">{stock.sector}</p>
                      </div>
                      <Badge className={`text-xs px-1.5 ${stock.changePercent >= 0 ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}`}>
                        {stock.reason}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Stock Gainers */}
            {stockGainers.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-gain/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gain" />
                    <span className="text-sm font-medium text-primary">Stock Gainers</span>
                  </div>
                  <Badge className="bg-gain/10 text-gain border border-gain/30 text-xs px-2">Tech/AI</Badge>
                </div>
                <div className="space-y-2">
                  {stockGainers.slice(0, 6).map((stock: any, idx: number) => (
                    <div key={stock.symbol} className="flex items-center gap-3 p-2 rounded-xl bg-gain/5 hover:bg-gain/10 transition-colors">
                      <span className="text-xs text-muted w-4">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{stock.symbol}</p>
                        <p className="text-xs text-muted">${stock.price.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-bold text-gain">+{stock.changePercent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Stock Losers */}
            {stockLosers.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-loss/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-loss" />
                    <span className="text-sm font-medium text-primary">Stock Losers</span>
                  </div>
                  <Badge className="bg-loss/10 text-loss border border-loss/30 text-xs px-2">Tech/AI</Badge>
                </div>
                <div className="space-y-2">
                  {stockLosers.slice(0, 6).map((stock: any, idx: number) => (
                    <div key={stock.symbol} className="flex items-center gap-3 p-2 rounded-xl bg-loss/5 hover:bg-loss/10 transition-colors">
                      <span className="text-xs text-muted w-4">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{stock.symbol}</p>
                        <p className="text-xs text-muted">${stock.price.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-bold text-loss">{stock.changePercent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
          )}
        </section>

        {/* Alpha Features Grid */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Derivatives Deep Dive */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-indigo-500/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-primary">Derivatives</span>
                  </div>
                  <Badge className={`text-xs px-2 ${
                    derivatives?.fundingRateSummary?.sentiment === 'bullish' ? 'bg-gain/10 text-gain border-gain/30' :
                    derivatives?.fundingRateSummary?.sentiment === 'bearish' ? 'bg-loss/10 text-loss border-loss/30' :
                    'bg-ink-raised/10 text-secondary border-ink-edge/30'
                  }`}>
                    {derivatives?.fundingRateSummary?.sentiment || 'Loading...'}
                  </Badge>
                </div>
                {derivatives && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Total Open Interest</span>
                      <span className="text-sm font-bold text-primary">${(derivatives.totalOpenInterest / 1e9).toFixed(2)}B</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Avg Funding Rate</span>
                      <span className={`text-sm font-bold ${derivatives.fundingRateSummary.avgFunding >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {derivatives.fundingRateSummary.avgFunding >= 0 ? '+' : ''}{derivatives.fundingRateSummary.avgFunding.toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Perpetual Premium</span>
                      <span className={`text-sm font-bold ${derivatives.perpetualPremium >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {derivatives.perpetualPremium >= 0 ? '+' : ''}{derivatives.perpetualPremium.toFixed(3)}%
                      </span>
                    </div>
                    <div className="pt-2 border-t border-ink-divider">
                      <p className="text-xs text-muted">Top Exchanges</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {derivatives.derivativesTickers?.slice(0, 4).map((t: any, i: number) => (
                          <Badge key={i} className="bg-ink-surface text-body text-xs px-1.5">{t.exchange}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* On-Chain Metrics */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-warn/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-warn" />
                    <span className="text-sm font-medium text-primary">On-Chain</span>
                  </div>
                  {onchain?.networkHealth && (
                    <Badge className={`text-xs px-2 ${
                      onchain.networkHealth.score >= 80 ? 'bg-gain/10 text-gain border-gain/30' :
                      onchain.networkHealth.score >= 60 ? 'bg-warn/10 text-warn border-warn/30' :
                      'bg-loss/10 text-loss border-loss/30'
                    }`}>
                      Health: {onchain.networkHealth.score}%
                    </Badge>
                  )}
                </div>
                {onchain && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted mb-1">Bitcoin</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-secondary">NVT</span>
                          <span className="text-primary font-medium">{onchain.btc.nvtRatio.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">MVRV</span>
                          <span className={`font-medium ${onchain.btc.mvrv > 2 ? 'text-loss' : onchain.btc.mvrv < 1 ? 'text-gain' : 'text-primary'}`}>
                            {onchain.btc.mvrv.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Hash Rate</span>
                          <span className="text-primary font-medium">{onchain.btc.hashRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Active Addr</span>
                          <span className="text-primary font-medium">{(onchain.btc.activeAddresses / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-ink-divider">
                      <p className="text-xs text-muted mb-1">Ethereum</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-secondary">NVT</span>
                          <span className="text-primary font-medium">{onchain.eth.nvtRatio.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Staking</span>
                          <span className="text-accent-bright font-medium">{onchain.eth.stakingRatio.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Volatility Index */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-loss/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-loss" />
                    <span className="text-sm font-medium text-primary">Volatility</span>
                  </div>
                  {volatility && (
                    <Badge className={`text-xs px-2 ${
                      volatility.volTrend === 'increasing' ? 'bg-loss/10 text-loss border-loss/30' :
                      'bg-gain/10 text-gain border-gain/30'
                    }`}>
                      {volatility.volTrend === 'increasing' ? 'Rising' : 'Falling'}
                    </Badge>
                  )}
                </div>
                {volatility && (
                  <div className="space-y-3">
                    <div className="text-center py-2">
                      <p className="text-xs text-secondary mb-1">Crypto Vol Index</p>
                      <p className="text-3xl font-bold text-primary">{volatility.marketVolIndex.toFixed(1)}%</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-warn/10">
                        <p className="text-secondary mb-0.5">BTC 30d</p>
                        <p className="text-warn font-bold">{volatility.btcVolatility.realized30d.toFixed(1)}%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-accent-core/10">
                        <p className="text-secondary mb-0.5">ETH 30d</p>
                        <p className="text-accent-bright font-bold">{volatility.ethVolatility.realized30d.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-ink-divider">
                      <p className="text-xs text-muted mb-1">High Vol Assets</p>
                      <div className="flex gap-1">
                        {volatility.highVolAssets.map((a: any, i: number) => (
                          <Badge key={i} className="bg-loss/10 text-loss text-xs px-1.5">
                            {a.symbol} {a.volatility.toFixed(0)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Price Predictions */}
          {aiPredictions && aiPredictions.predictions?.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent-bright" />
                    <span className="text-sm font-medium text-primary">AI Price Predictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 ${
                      aiPredictions.marketOutlook === 'Bullish' ? 'bg-gain/10 text-gain border-gain/30' :
                      aiPredictions.marketOutlook === 'Bearish' ? 'bg-loss/10 text-loss border-loss/30' :
                      'bg-warn/10 text-warn border-warn/30'
                    }`}>
                      {aiPredictions.marketOutlook}
                    </Badge>
                    <Badge className={`text-xs px-2 ${
                      aiPredictions.riskLevel === 'Low' ? 'bg-gain/10 text-gain' :
                      aiPredictions.riskLevel === 'High' ? 'bg-loss/10 text-loss' :
                      'bg-warn/10 text-warn'
                    }`}>
                      Risk: {aiPredictions.riskLevel}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {aiPredictions.predictions.map((p: any) => (
                    <div key={p.symbol} className="p-3 rounded-xl bg-ink-surface border border-ink-divider">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-primary">{p.symbol}</span>
                        <Badge className={`text-xs px-1.5 ${
                          p.trend === 'bullish' ? 'bg-gain/20 text-gain' :
                          p.trend === 'bearish' ? 'bg-loss/20 text-loss' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {p.trend}
                        </Badge>
                      </div>
                      <p className="text-xs text-secondary mb-1">Current: ${p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">24h Range</span>
                          <span className="text-primary">${p.prediction24h.low.toFixed(0)} - ${p.prediction24h.high.toFixed(0)}</span>
                        </div>
                        <div className="w-full h-1 bg-ink-raised/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full "
                            style={{ width: `${p.prediction24h.confidence}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted text-right">{p.prediction24h.confidence}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category/Sector Performance */}
          {categories && categories.categories?.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent-bright" />
                    <span className="text-sm font-medium text-primary">Sector Performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 ${
                      categories.sectorRotation === 'risk-on' ? 'bg-gain/10 text-gain border-gain/30' :
                      categories.sectorRotation === 'risk-off' ? 'bg-loss/10 text-loss border-loss/30' :
                      'bg-ink-raised/10 text-secondary border-ink-edge/30'
                    }`}>
                      {categories.sectorRotation === 'risk-on' ? 'Risk On' : categories.sectorRotation === 'risk-off' ? 'Risk Off' : 'Neutral'}
                    </Badge>
                    {categories.hotSector && (
                      <Badge className="bg-gain/10 text-gain border border-gain/30 text-xs px-2">
                        Hot: {categories.hotSector}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {categories.categories.slice(0, 10).map((cat: any, i: number) => (
                    <div key={i} className="p-2 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      <p className="text-xs font-medium text-primary truncate mb-1">{cat.name}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${cat.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {cat.change24h >= 0 ? '+' : ''}{cat.change24h.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted">${(cat.marketCap / 1e9).toFixed(1)}B</span>
                      </div>
                      <div className="w-full h-0.5 bg-ink-raised/50 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${cat.change24h >= 0 ? 'bg-gain' : 'bg-loss'}`}
                          style={{ width: `${Math.min(Math.abs(cat.change24h) * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Crypto Indicators Grid */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Fear & Greed Index */}
            {isVisible('fear-greed') && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-warn/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-secondary">Fear & Greed</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    fearGreed.value <= 25 ? 'bg-loss/20 text-loss' :
                    fearGreed.value <= 45 ? 'bg-warn/20 text-warn' :
                    fearGreed.value <= 55 ? 'bg-warn/20 text-warn' :
                    fearGreed.value <= 75 ? 'bg-gain/20 text-gain' :
                    'bg-gain/20 text-gain'
                  }`}>
                    {fearGreed.valueClassification}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">{fearGreed.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {fearGreed.trend === 'rising' ? (
                        <TrendingUp className="w-3 h-3 text-gain" />
                      ) : fearGreed.trend === 'falling' ? (
                        <TrendingDown className="w-3 h-3 text-loss" />
                      ) : (
                        <Activity className="w-3 h-3 text-secondary" />
                      )}
                      <span className="text-xs text-muted capitalize">{fearGreed.trend}</span>
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
            )}

            {/* Market Dominance */}
            {isVisible('market-dominance') && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-warn/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-secondary">Market Dominance</span>
                  <Crown className="w-4 h-4 text-warn" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-warn">BTC</span>
                    <span className="text-sm font-bold text-primary">{dominance.btcDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-raised rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${dominance.btcDominance}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent-bright">ETH</span>
                    <span className="text-sm font-bold text-primary">{dominance.ethDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-raised rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${dominance.ethDominance}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent-bright">Alts</span>
                    <span className="text-sm font-bold text-primary">{dominance.altDominance?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-raised rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${dominance.altDominance}%` }} />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Gas Tracker */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-secondary">ETH Gas</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    gasTracker.congestionLevel === 'low' ? 'bg-gain/20 text-gain' :
                    gasTracker.congestionLevel === 'medium' ? 'bg-warn/20 text-warn' :
                    gasTracker.congestionLevel === 'high' ? 'bg-warn/20 text-warn' :
                    'bg-loss/20 text-loss'
                  }`}>
                    {gasTracker.congestionLevel}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-xl bg-ink-surface">
                    <p className="text-xs text-muted">Slow</p>
                    <p className="text-sm font-bold text-gain">{gasTracker.slow > 0 ? gasTracker.slow : '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-ink-surface">
                    <p className="text-xs text-muted">Std</p>
                    <p className="text-sm font-bold text-warn">{gasTracker.standard > 0 ? gasTracker.standard : '—'}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-ink-surface">
                    <p className="text-xs text-muted">Fast</p>
                    <p className="text-sm font-bold text-warn">{gasTracker.fast > 0 ? gasTracker.fast : '—'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted text-center mt-2">gwei</p>
              </div>
            </div>

            {/* Funding Rates */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-secondary">Funding Rates</span>
                  <Badge className={`text-xs px-2 py-0.5 ${
                    fundingRates.sentiment === 'bullish' ? 'bg-gain/20 text-gain' :
                    fundingRates.sentiment === 'bearish' ? 'bg-loss/20 text-loss' :
                    'bg-ink-raised/20 text-secondary'
                  }`}>
                    {fundingRates.sentiment}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-warn">BTC</span>
                    <span className={`text-sm font-bold ${fundingRates.btc?.rate >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {fundingRates.btc?.rate >= 0 ? '+' : ''}{fundingRates.btc?.rate?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent-bright">ETH</span>
                    <span className={`text-sm font-bold ${fundingRates.eth?.rate >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {fundingRates.eth?.rate >= 0 ? '+' : ''}{fundingRates.eth?.rate?.toFixed(4)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted text-center">
                    {fundingRates.sentiment === 'bullish' ? 'Shorts paying longs' : 
                     fundingRates.sentiment === 'bearish' ? 'Longs paying shorts' : 
                     'Neutral funding'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Top Gainers & Losers - Compact */}
          {(isVisible('top-gainers') || isVisible('top-losers')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Top Gainers */}
            {isVisible('top-gainers') && (
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-gain" />
                <h3 className="text-sm font-bold text-primary">Top Gainers (24h)</h3>
              </div>
              <div className="space-y-2">
                {cryptoGainers.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading gainers...</p>
                ) : (
                  cryptoGainers.slice(0, 4).map((coin: any, idx: number) => (
                    <div key={coin.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4">#{idx + 1}</span>
                        {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                        <div>
                          <p className="text-sm font-medium text-primary">{coin.symbol}</p>
                          <p className="text-xs text-muted">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge className="bg-gain/20 text-gain border-0">
                        +{coin.change24h?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* Top Losers */}
            {isVisible('top-losers') && (
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-loss" />
                <h3 className="text-sm font-bold text-primary">Top Losers (24h)</h3>
              </div>
              <div className="space-y-2">
                {cryptoLosers.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading losers...</p>
                ) : (
                  cryptoLosers.slice(0, 4).map((coin: any, idx: number) => (
                    <div key={coin.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4">#{idx + 1}</span>
                        {coin.image && <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />}
                        <div>
                          <p className="text-sm font-medium text-primary">{coin.symbol}</p>
                          <p className="text-xs text-muted">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge className="bg-loss/20 text-loss border-0">
                        {coin.change24h?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}
          </div>
          )}

          {/* Row 3: Trending Tokens & DeFi TVL - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Trending Tokens */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-5 h-5 text-accent-bright" />
                <h3 className="text-sm font-bold text-primary">Trending Tokens</h3>
                <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                  CoinGecko
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trendingTokens.length === 0 ? (
                  <p className="col-span-2 text-sm text-secondary text-center py-4">Loading trending...</p>
                ) : (
                  trendingTokens.slice(0, 6).map((token: any, idx: number) => (
                    <div key={token.id || idx} className="flex items-center gap-2 p-2 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      {token.image && <img src={token.image} alt={token.symbol} className="w-5 h-5 rounded-full" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary truncate">{token.symbol}</p>
                        <p className="text-xs text-muted">#{token.marketCapRank || '-'}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center">
                        <span className="text-xs text-accent-bright">{10 - idx}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DeFi TVL */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-accent-bright" />
                  <h3 className="text-sm font-bold text-primary">DeFi TVL</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {defiTvl.totalTVL > 0 ? `$${(defiTvl.totalTVL / 1e9)?.toFixed(2)}B` : '—'}
                  </p>
                  <p className="text-xs text-muted">Total Locked</p>
                </div>
              </div>
              <div className="space-y-2">
                {defiTvl.topProtocols?.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading protocols...</p>
                ) : (
                  defiTvl.topProtocols?.slice(0, 4).map((protocol: any, idx: number) => (
                    <div key={protocol.name || idx} className="flex items-center justify-between p-2 rounded-xl bg-ink-surface">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted w-4">#{idx + 1}</span>
                        {protocol.logo && <img src={protocol.logo} alt={protocol.name} className="w-5 h-5 rounded-full" />}
                        <div>
                          <p className="text-xs font-medium text-primary">{protocol.name}</p>
                          <p className="text-xs text-muted">{protocol.chain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-primary">${(protocol.tvl / 1e9)?.toFixed(2)}B</p>
                        <p className={`text-xs ${protocol.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
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
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Whale Alerts</h3>
              <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                <Radio className="w-2 h-2 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {whaleAlerts.length === 0 ? (
                <p className="col-span-full text-sm text-secondary text-center py-4">No recent whale activity</p>
              ) : (
                whaleAlerts.slice(0, 6).map((alert: any, idx: number) => (
                  <div key={alert.id || idx} className={`p-3 rounded-xl border ${
                    alert.significance === 'high' ? 'bg-loss/10 border-loss/30' :
                    alert.significance === 'medium' ? 'bg-warn/10 border-warn/30' :
                    'bg-ink-surface border-ink-edge'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${
                        alert.type === 'exchange_deposit' ? 'bg-loss/20 text-loss' :
                        alert.type === 'exchange_withdrawal' ? 'bg-gain/20 text-gain' :
                        'bg-accent-core/20 text-accent-bright'
                      }`}>
                        {alert.type === 'exchange_deposit' ? 'Exchange In' :
                         alert.type === 'exchange_withdrawal' ? 'Exchange Out' :
                         'Transfer'}
                      </Badge>
                      <span className="text-xs text-muted">{timeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-primary">
                        {alert.amount?.toLocaleString()} {alert.coin}
                      </p>
                      <span className="text-xs text-muted">
                        (${(alert.usdValue / 1e6)?.toFixed(1)}M)
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-1">
                      {alert.from} → {alert.to}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Macro Data Section */}
        <section>
          <div
            onClick={() => toggleSection('macro')}
            className="flex items-center gap-2 mb-2 cursor-pointer group py-2 px-3 rounded-xl bg-ink-surface border border-ink-edge hover:border-accent-core/30 transition-all"
            data-testid="toggle-macro-dashboard"
          >
            <Globe className="w-4 h-4 text-accent-bright" />
            <span className="text-sm font-medium text-primary flex-1">Macro Data</span>
            {macroExpanded ? (
              <ChevronDown className="w-4 h-4 text-secondary" />
            ) : (
              <ChevronUp className="w-4 h-4 text-secondary" />
            )}
          </div>

          {macroExpanded && (
            <div className="space-y-3">
              {/* Index Futures Row - Compact */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {indexFutures.map((future: any) => (
                  <div key={future.symbol} className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm hover:border-accent-core/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-secondary">{future.symbol}</span>
                      <Badge className={`text-[10px] px-1.5 ${future.change >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
                        {future.change >= 0 ? '+' : ''}{future.changePercent?.toFixed(2)}%
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">{future.price?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Treasury Yields + VIX/DXY + Fed Watch - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Treasury Yields */}
                <div className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-4 h-4 text-accent-bright" />
                    <h3 className="text-xs font-medium text-primary">Treasury Yields</h3>
                    <Badge className={`ml-auto text-[10px] px-1.5 ${
                      yieldCurveStatus === 'inverted' ? 'bg-loss/20 text-loss' :
                      yieldCurveStatus === 'flat' ? 'bg-warn/20 text-warn' :
                      'bg-gain/20 text-gain'
                    }`}>
                      {yieldCurveStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(treasuryYields).slice(0, 4).map(([term, data]: [string, any]) => (
                      <div key={term} className="text-center p-1.5 rounded bg-ink-surface/50">
                        <p className="text-[10px] text-secondary">{term}</p>
                        <p className="text-xs font-bold text-primary">{data.rate?.toFixed(2)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precious Metals - Gold & Silver */}
                <div className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-warn" />
                    <h3 className="text-xs font-medium text-primary">Precious Metals</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {preciousMetals.gold && (
                      <div className="p-2 rounded-xl bg-ink-surface/50">
                        <p className="text-[10px] text-secondary">Gold (XAU)</p>
                        <p className="text-lg font-bold text-warn">${preciousMetals.gold.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <span className={`text-[10px] ${preciousMetals.gold.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {preciousMetals.gold.change >= 0 ? '+' : ''}{preciousMetals.gold.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {preciousMetals.silver && (
                      <div className="p-2 rounded-xl bg-ink-surface/50">
                        <p className="text-[10px] text-secondary">Silver (XAG)</p>
                        <p className="text-lg font-bold text-body">${preciousMetals.silver.price?.toFixed(2)}</p>
                        <span className={`text-[10px] ${preciousMetals.silver.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {preciousMetals.silver.change >= 0 ? '+' : ''}{preciousMetals.silver.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fed Watch - Compact */}
                <div className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-accent-bright" />
                    <h3 className="text-xs font-medium text-primary">Fed Watch</h3>
                  </div>
                  {fedWatch.nextMeeting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-secondary">Current Rate</span>
                        <span className="text-xs font-bold text-primary">{fedWatch.currentRate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded bg-ink-surface/50 flex justify-between">
                          <span className="text-secondary">Hold</span>
                          <span className="text-primary">{fedWatch.nextMeeting.probabilities?.hold}%</span>
                        </div>
                        <div className="p-1.5 rounded bg-ink-surface/50 flex justify-between">
                          <span className="text-gain">-25bp</span>
                          <span className="text-primary">{fedWatch.nextMeeting.probabilities?.cut25}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Global M2 + Calendar - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Global M2 */}
                <div className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-4 h-4 text-gain" />
                    <h3 className="text-xs font-medium text-primary">Global M2 Liquidity</h3>
                    <Badge className={`ml-auto text-[10px] px-1.5 ${
                      globalM2.global?.trend === 'expanding' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
                    }`}>
                      {globalM2.global?.trend || 'neutral'}
                    </Badge>
                  </div>
                  {globalM2.dataAvailable && globalM2.global ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">${globalM2.global.value?.toFixed(1)}</span>
                        <span className="text-xs text-secondary">Trillion</span>
                        <span className={`text-xs ${globalM2.global.change30d >= 0 ? 'text-gain' : 'text-loss'}`}>
                          +{globalM2.global.change30d}% (30d)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[9px]">
                        <div className="p-1 rounded bg-ink-surface/50 text-center">
                          <span className="text-secondary">US</span>
                          <p className="text-primary font-medium">${globalM2.us?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-ink-surface/50 text-center">
                          <span className="text-secondary">CN</span>
                          <p className="text-primary font-medium">${globalM2.china?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-ink-surface/50 text-center">
                          <span className="text-secondary">EU</span>
                          <p className="text-primary font-medium">${globalM2.eurozone?.value}T</p>
                        </div>
                        <div className="p-1 rounded bg-ink-surface/50 text-center">
                          <span className="text-secondary">JP</span>
                          <p className="text-primary font-medium">${globalM2.japan?.value}T</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">Loading liquidity data...</p>
                  )}
                </div>

                {/* Economic Calendar */}
                <div className="p-3 rounded-xl bg-ink-surface border border-ink-edge backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-warn" />
                    <h3 className="text-xs font-medium text-primary">Economic Calendar</h3>
                    <Badge className="ml-auto text-[10px] px-1.5 bg-warn/20 text-warn">
                      {macroCalendar.filter((e: any) => e.impact === 'high').length} High Impact
                    </Badge>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {macroCalendar.length > 0 ? (
                      macroCalendar.slice(0, 4).map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-ink-surface/30">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            event.impact === 'high' ? 'bg-loss' :
                            event.impact === 'medium' ? 'bg-warn' : 'bg-secondary'
                          }`} />
                          <p className="text-[10px] text-primary truncate flex-1">{event.event}</p>
                          <span className="text-[10px] text-muted">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted text-center py-2">No events scheduled</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ETF & Advanced Data */}
        <section className="space-y-3">
          {/* ETF Dashboard */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Crypto ETF Dashboard</h3>
              <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                Institutional
              </Badge>
            </div>
            
            {/* ETF Tabs */}
            <div className="mb-4 flex gap-2">
              <Badge className="bg-warn/20 text-warn border-warn/30">BTC ETFs</Badge>
              <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30">ETH ETFs</Badge>
            </div>

            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-2">
              {etfs.length === 0 ? (
                <p className="text-center py-4 text-secondary">Loading ETF data...</p>
              ) : (
                etfs.slice(0, 6).map((etf: any, idx: number) => (
                  <div key={etf.ticker || idx} className="p-3 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs px-1.5 py-0.5 ${etf.asset === 'BTC' ? 'bg-warn/20 text-warn' : 'bg-accent-core/20 text-accent-bright'}`}>
                          {etf.asset}
                        </Badge>
                        <span className="font-medium text-primary text-sm">{etf.ticker}</span>
                      </div>
                      <span className={`text-sm font-bold ${etf.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {etf.change24h >= 0 ? '+' : ''}{etf.change24h?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted block">Price</span>
                        <span className="text-primary">${etf.price?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted block">AUM</span>
                        <span className="text-primary">${(etf.aum / 1e9)?.toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-muted block">Flow 24h</span>
                        <span className={etf.flow24h >= 0 ? 'text-gain' : 'text-loss'}>
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
                  <tr className="border-b border-ink-edge">
                    <th className="text-left py-2 text-muted font-medium">ETF</th>
                    <th className="text-right py-2 text-muted font-medium">Price</th>
                    <th className="text-right py-2 text-muted font-medium">24h</th>
                    <th className="text-right py-2 text-muted font-medium">AUM</th>
                    <th className="text-right py-2 text-muted font-medium">Flow 24h</th>
                    <th className="text-right py-2 text-muted font-medium">Holdings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-divider">
                  {etfs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4 text-secondary">Loading ETF data...</td></tr>
                  ) : (
                    etfs.slice(0, 8).map((etf: any, idx: number) => (
                      <tr key={etf.ticker || idx} className="hover:bg-ink-surface transition-colors">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs px-1.5 py-0.5 ${etf.asset === 'BTC' ? 'bg-warn/20 text-warn' : 'bg-accent-core/20 text-accent-bright'}`}>
                              {etf.asset}
                            </Badge>
                            <span className="font-medium text-primary">{etf.ticker}</span>
                          </div>
                        </td>
                        <td className="text-right text-primary">${etf.price?.toFixed(2)}</td>
                        <td className={`text-right ${etf.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {etf.change24h >= 0 ? '+' : ''}{etf.change24h?.toFixed(2)}%
                        </td>
                        <td className="text-right text-primary">${(etf.aum / 1e9)?.toFixed(1)}B</td>
                        <td className={`text-right ${etf.flow24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {etf.flow24h >= 0 ? '+' : ''}${(etf.flow24h / 1e6)?.toFixed(0)}M
                        </td>
                        <td className="text-right text-secondary">{(etf.holdings / 1000)?.toFixed(1)}K</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* ETF Flow Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-ink-edge">
              <div className="text-center p-2 rounded-xl bg-ink-surface">
                <p className="text-xs text-muted">Total BTC ETF AUM</p>
                <p className="text-lg font-bold text-warn">
                  ${(etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.aum || 0), 0) / 1e9).toFixed(1)}B
                </p>
              </div>
              <div className="text-center p-2 rounded-xl bg-ink-surface">
                <p className="text-xs text-muted">BTC 24h Net Flow</p>
                <p className={`text-lg font-bold ${etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                  ${(etfs.filter((e: any) => e.asset === 'BTC').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) / 1e6).toFixed(0)}M
                </p>
              </div>
              <div className="text-center p-2 rounded-xl bg-ink-surface">
                <p className="text-xs text-muted">Total ETH ETF AUM</p>
                <p className="text-lg font-bold text-accent-bright">
                  ${(etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.aum || 0), 0) / 1e9).toFixed(1)}B
                </p>
              </div>
              <div className="text-center p-2 rounded-xl bg-ink-surface">
                <p className="text-xs text-muted">ETH 24h Net Flow</p>
                <p className={`text-lg font-bold ${etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                  ${(etfs.filter((e: any) => e.asset === 'ETH').reduce((sum: number, e: any) => sum + (e.flow24h || 0), 0) / 1e6).toFixed(0)}M
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Exchange Reserves & Stablecoin Flows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Exchange Reserves */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-warn" />
                <h3 className="text-sm font-bold text-primary">Exchange Reserves</h3>
                <Badge className="ml-auto bg-warn/10 text-warn border-warn/30 text-xs">
                  On-Chain
                </Badge>
              </div>
              <div className="space-y-3">
                {exchangeReserves.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading reserves...</p>
                ) : (
                  exchangeReserves.slice(0, 5).map((reserve: any, idx: number) => (
                    <div key={reserve.exchange || idx} className="p-3 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">{reserve.exchange}</span>
                        <Badge className={`text-xs ${
                          reserve.trend === 'accumulating' ? 'bg-gain/20 text-gain' :
                          reserve.trend === 'distributing' ? 'bg-loss/20 text-loss' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {reserve.trend}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-warn">BTC: </span>
                          <span className="text-primary">{(reserve.btcReserve / 1000)?.toFixed(1)}K</span>
                          <span className={`ml-1 ${reserve.btcChange24h < 0 ? 'text-gain' : 'text-loss'}`}>
                            ({reserve.btcChange24h < 0 ? '' : '+'}{reserve.btcChange24h?.toFixed(0)})
                          </span>
                        </div>
                        <div>
                          <span className="text-accent-bright">ETH: </span>
                          <span className="text-primary">{(reserve.ethReserve / 1000000)?.toFixed(2)}M</span>
                          <span className={`ml-1 ${reserve.ethChange24h < 0 ? 'text-gain' : 'text-loss'}`}>
                            ({reserve.ethChange24h < 0 ? '' : '+'}{(reserve.ethChange24h / 1000)?.toFixed(1)}K)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted mt-3 text-center">
                📉 Outflows = Accumulation (Bullish) | 📈 Inflows = Selling Pressure
              </p>
            </div>

            {/* Stablecoin Flows */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign className="w-5 h-5 text-gain" />
                <h3 className="text-sm font-bold text-primary">Stablecoin Flows</h3>
                <Badge className="ml-auto bg-gain/10 text-gain border-gain/30 text-xs">
                  Liquidity
                </Badge>
              </div>
              <div className="space-y-3">
                {stablecoinFlows.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading stablecoin data...</p>
                ) : (
                  stablecoinFlows.map((flow: any, idx: number) => (
                    <div key={flow.coin || idx} className="p-3 rounded-xl bg-ink-surface">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{flow.coin}</span>
                          <Badge className={`text-xs ${
                            flow.marketImpact === 'bullish' ? 'bg-gain/20 text-gain' :
                            flow.marketImpact === 'bearish' ? 'bg-loss/20 text-loss' :
                            'bg-ink-raised/20 text-secondary'
                          }`}>
                            {flow.marketImpact}
                          </Badge>
                        </div>
                        <span className="text-sm text-primary">${(flow.totalSupply / 1e9)?.toFixed(1)}B</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">24h Net Flow:</span>
                        <span className={flow.netFlow >= 0 ? 'text-gain' : 'text-loss'}>
                          {flow.netFlow >= 0 ? '+' : ''}${(flow.netFlow / 1e6)?.toFixed(0)}M
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-ink-raised rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full ${flow.netFlow >= 0 ? 'bg-gain' : 'bg-loss'}`}
                          style={{ width: `${Math.min(Math.abs(flow.netFlow) / 5e8 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted mt-3 text-center">
                🟢 Minting = Fresh buying power | 🔴 Burning = Capital exit
              </p>
            </div>
          </div>

          {/* Row 3: Altcoin Season, Options, Liquidations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Altcoin Season Indicator */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent-bright" />
                <h3 className="text-sm font-bold text-primary">Altcoin Season</h3>
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
                    <span className="text-2xl font-bold text-primary">{altcoinSeason.score}</span>
                    <span className="text-xs text-muted">/100</span>
                  </div>
                </div>
              </div>
              <Badge className={`w-full justify-center py-1.5 ${
                altcoinSeason.season === 'alt' ? 'bg-accent-core/20 text-accent-bright' :
                altcoinSeason.season === 'btc' ? 'bg-warn/20 text-warn' :
                'bg-ink-raised/20 text-secondary'
              }`}>
                {altcoinSeason.season === 'alt' ? '🚀 Altseason' : 
                 altcoinSeason.season === 'btc' ? '₿ Bitcoin Season' : 
                 '⚖️ Neutral Market'}
              </Badge>
              <p className="text-xs text-muted text-center mt-2">{altcoinSeason.description}</p>
            </div>

            {/* Options Put/Call */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-accent-bright" />
                <h3 className="text-sm font-bold text-primary">Options P/C Ratio</h3>
              </div>
              <div className="space-y-4">
                {optionsInfo.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">Loading options...</p>
                ) : (
                  optionsInfo.map((opt: any, idx: number) => (
                    <div key={opt.asset || idx} className="p-3 rounded-xl bg-ink-surface">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${opt.asset === 'BTC' ? 'text-warn' : 'text-accent-bright'}`}>
                          {opt.asset}
                        </span>
                        <Badge className={`text-xs ${
                          opt.sentiment === 'bullish' ? 'bg-gain/20 text-gain' :
                          opt.sentiment === 'bearish' ? 'bg-loss/20 text-loss' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {opt.sentiment}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-primary">{opt.putCallRatio?.toFixed(2)}</span>
                        <p className="text-xs text-muted mt-1">
                          Max Pain: ${opt.maxPainPrice?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                {'<'}0.7 = Bullish | {'>'}1.0 = Bearish
              </p>
            </div>

            {/* Liquidation Risk */}
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-loss" />
                <h3 className="text-sm font-bold text-primary">BTC Liquidations</h3>
              </div>
              <div className="text-center mb-3">
                <p className="text-xs text-muted">Current Price</p>
                <p className="text-xl font-bold text-primary">${btcLiquidations.currentPrice?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                {btcLiquidations.levels?.slice(0, 6).map((level: any, idx: number) => {
                  const isAbove = level.price > btcLiquidations.currentPrice;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-right text-secondary">${(level.price / 1000)?.toFixed(1)}K</span>
                      <div className="flex-1 h-2 bg-ink-raised rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isAbove ? 'bg-loss' : 'bg-gain'}`}
                          style={{ width: `${Math.min((level.totalValue / 5e8) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-muted">${(level.totalValue / 1e6)?.toFixed(0)}M</span>
                    </div>
                  );
                })}
              </div>
              <Badge className={`w-full justify-center mt-3 ${
                btcLiquidations.riskBias === 'long_heavy' ? 'bg-loss/20 text-loss' :
                btcLiquidations.riskBias === 'short_heavy' ? 'bg-gain/20 text-gain' :
                'bg-ink-raised/20 text-secondary'
              }`}>
                {btcLiquidations.riskBias === 'long_heavy' ? 'Heavy Long Exposure' :
                 btcLiquidations.riskBias === 'short_heavy' ? 'Heavy Short Exposure' :
                 'Balanced Positioning'}
              </Badge>
            </div>
          </div>

          {/* Row 4: Smart Money Tracker */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-warn" />
              <h3 className="text-sm font-bold text-primary">Smart Money Tracker</h3>
              <Badge className="ml-auto bg-warn/10 text-warn border-warn/30 text-xs">
                Top Traders
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartMoney.length === 0 ? (
                <p className="col-span-full text-sm text-secondary text-center py-4">Loading smart money data...</p>
              ) : (
                smartMoney.slice(0, 6).map((trader: any, idx: number) => (
                  <div key={trader.traderName || idx} className="p-3 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-warn/30 text-warn' :
                          idx === 1 ? 'bg-secondary/30 text-body' :
                          idx === 2 ? 'bg-warn/30 text-warn' :
                          'bg-ink-raised text-secondary'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-primary">{trader.traderName}</span>
                        {trader.isAiAgent && <Bot className="w-3 h-3 text-accent-bright" />}
                      </div>
                      <Badge className={`text-xs ${trader.winRate >= 60 ? 'bg-gain/20 text-gain' : 'bg-ink-raised/20 text-secondary'}`}>
                        {trader.winRate}% Win
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted">Trades: </span>
                        <span className="text-primary">{trader.recentTrades}</span>
                      </div>
                      <div>
                        <span className="text-muted">Streak: </span>
                        <span className="text-gain">🔥 {trader.streak}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* =====================================================================
            ALPHA INTELLIGENCE HUB - 12 Features
            ===================================================================== */}
        
        {/* Row 1: Narrative Momentum & CT Alpha Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Narrative Momentum Tracker */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Narrative Momentum</h3>
              <div className="ml-auto flex items-center gap-2">
                {narrativesTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(narrativesTimestamp)}
                  </span>
                )}
                <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                  {narratives.length} Active
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {narratives.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading narratives...</p>
              ) : (
                narratives.map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{n.narrative}</span>
                        <Badge className={`text-[10px] px-1.5 ${
                          n.trend === 'rising' ? 'bg-gain/20 text-gain' :
                          n.trend === 'falling' ? 'bg-loss/20 text-loss' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {n.trend === 'rising' ? '↑' : n.trend === 'falling' ? '↓' : '→'} {n.weeklyChange > 0 ? '+' : ''}{n.weeklyChange?.toFixed(1)}%
                        </Badge>
                      </div>
                      <span className="text-xs font-bold text-accent-bright">{n.momentum}%</span>
                    </div>
                    <div className="h-1.5 bg-ink-raised rounded-full overflow-hidden mb-1.5">
                      <div 
                        className={`h-full rounded-full ${
                          n.momentum >= 70 ? '' :
                          n.momentum >= 50 ? '' :
                          ''
                        }`}
                        style={{ width: `${n.momentum}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>Social Buzz: {n.socialBuzz}%</span>
                      <span>Correlation: {(n.priceCorrelation * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {n.topTokens?.slice(0, 4).map((token: string, i: number) => (
                        <Badge key={i} className="text-[9px] px-1 py-0 bg-ink-surface text-secondary">{token}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CT Alpha Feed */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Twitter className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">CT Alpha Feed</h3>
              <div className="ml-auto flex items-center gap-2">
                {ctAlphaTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(ctAlphaTimestamp)}
                  </span>
                )}
                <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                  <Radio className="w-2 h-2 mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {ctAlpha.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading CT signals...</p>
              ) : (
                ctAlpha.map((signal: any, idx: number) => (
                  <div key={signal.id || idx} className={`p-2.5 rounded-xl border transition-colors ${
                    signal.sentiment === 'bullish' ? 'bg-gain/5 border-gain/20 hover:border-gain/40' :
                    signal.sentiment === 'bearish' ? 'bg-loss/5 border-loss/20 hover:border-loss/40' :
                    'bg-ink-surface border-ink-edge hover:border-white/20'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">{signal.influencer}</span>
                        <span className="text-[10px] text-muted">{signal.handle}</span>
                      </div>
                      <Badge className={`text-[10px] ${
                        signal.sentiment === 'bullish' ? 'bg-gain/20 text-gain' :
                        signal.sentiment === 'bearish' ? 'bg-loss/20 text-loss' :
                        'bg-ink-raised/20 text-secondary'
                      }`}>
                        {signal.confidence}%
                      </Badge>
                    </div>
                    <p className="text-xs text-body mb-1.5 line-clamp-2">{signal.signal}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <div className="flex items-center gap-2">
                        {signal.token && <Badge className="bg-ink-raised text-primary px-1.5">{signal.token}</Badge>}
                        <span className="text-secondary">{signal.category}</span>
                      </div>
                      <span>{signal.engagement?.toLocaleString()} engagements</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Token Unlocks & Airdrop Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Token Unlock Calendar */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-loss/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Unlock className="w-4 h-4 text-loss" />
              <h3 className="text-sm font-bold text-primary">Token Unlocks</h3>
              <div className="ml-auto flex items-center gap-2">
                {tokenUnlocksTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(tokenUnlocksTimestamp)}
                  </span>
                )}
                <Badge className="bg-loss/10 text-loss border-loss/30 text-xs">
                  Next 30 Days
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {tokenUnlocks.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading unlocks...</p>
              ) : (
                tokenUnlocks.map((unlock: any, idx: number) => (
                  <div key={unlock.id || idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{unlock.symbol}</span>
                        <Badge className={`text-[10px] px-1.5 ${
                          unlock.priceImpact === 'high' ? 'bg-loss/20 text-loss' :
                          unlock.priceImpact === 'medium' ? 'bg-warn/20 text-warn' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {unlock.priceImpact} impact
                        </Badge>
                      </div>
                      <span className="text-xs text-secondary">
                        {new Date(unlock.unlockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted block">Amount</span>
                        <span className="text-primary">{(unlock.amount / 1e6)?.toFixed(1)}M</span>
                      </div>
                      <div>
                        <span className="text-muted block">Value</span>
                        <span className="text-primary">${(unlock.valueUsd / 1e6)?.toFixed(0)}M</span>
                      </div>
                      <div>
                        <span className="text-muted block">% Supply</span>
                        <span className={unlock.percentOfSupply > 2 ? 'text-loss' : 'text-primary'}>
                          {unlock.percentOfSupply?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className="text-secondary">{unlock.vestingType}</span>
                      <span className={unlock.predictedMove < 0 ? 'text-loss' : 'text-gain'}>
                        Est: {unlock.predictedMove > 0 ? '+' : ''}{unlock.predictedMove?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Airdrop Radar */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Airdrop Radar</h3>
              <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                {airdrops.length} Opportunities
              </Badge>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {airdrops.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading airdrops...</p>
              ) : (
                airdrops.map((airdrop: any, idx: number) => (
                  <div key={airdrop.id || idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{airdrop.project}</span>
                        <Badge className={`text-[10px] px-1.5 ${
                          airdrop.status === 'confirmed' ? 'bg-gain/20 text-gain' :
                          airdrop.status === 'ongoing' ? 'bg-accent-core/20 text-accent-bright' :
                          'bg-warn/20 text-warn'
                        }`}>
                          {airdrop.status}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-accent-bright">{airdrop.estimatedValue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] mb-1.5">
                      <Badge className="bg-ink-raised text-body">{airdrop.chain}</Badge>
                      <Badge className={`${
                        airdrop.difficulty === 'easy' ? 'bg-gain/10 text-gain' :
                        airdrop.difficulty === 'medium' ? 'bg-warn/10 text-warn' :
                        'bg-loss/10 text-loss'
                      }`}>
                        {airdrop.difficulty}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-secondary line-clamp-2">{airdrop.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Governance Pulse & VC Wallet Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Governance Pulse */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Vote className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-primary">Governance Pulse</h3>
              <Badge className="ml-auto bg-accent-core/10 text-indigo-400 border-indigo-500/30 text-xs">
                Active Proposals
              </Badge>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {governance.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading proposals...</p>
              ) : (
                governance.map((proposal: any, idx: number) => (
                  <div key={proposal.id || idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] px-1.5 bg-accent-core/20 text-indigo-400">{proposal.protocol}</Badge>
                        <Badge className={`text-[10px] px-1.5 ${
                          proposal.status === 'active' ? 'bg-gain/20 text-gain' :
                          proposal.status === 'passed' ? 'bg-accent-core/20 text-accent-bright' :
                          proposal.status === 'failed' ? 'bg-loss/20 text-loss' :
                          'bg-ink-raised/20 text-secondary'
                        }`}>
                          {proposal.status}
                        </Badge>
                      </div>
                      <Badge className={`text-[10px] ${
                        proposal.priceImpact === 'high' ? 'bg-warn/20 text-warn' :
                        'bg-ink-raised/20 text-secondary'
                      }`}>
                        {proposal.priceImpact} impact
                      </Badge>
                    </div>
                    <p className="text-xs text-primary mb-2 line-clamp-1">{proposal.title}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gain">For: {((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100 || 0).toFixed(0)}%</span>
                        <span className="text-loss">Against: {((proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst)) * 100 || 0).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-ink-raised rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gain"
                          style={{ width: `${((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100) || 50}%` }}
                        />
                        <div 
                          className="h-full bg-loss"
                          style={{ width: `${((proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst)) * 100) || 50}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>Quorum: {((proposal.votesFor + proposal.votesAgainst) / proposal.quorum * 100).toFixed(0)}%</span>
                        <span>Ends: {new Date(proposal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VC Wallet Tracker */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-warn/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-warn" />
              <h3 className="text-sm font-bold text-primary">VC Wallet Tracker</h3>
              <div className="ml-auto flex items-center gap-2">
                {vcWalletsTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(vcWalletsTimestamp)}
                  </span>
                )}
                <Badge className="bg-warn/10 text-warn border-warn/30 text-xs">
                  On-Chain
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {vcWallets.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading VC activity...</p>
              ) : (
                vcWallets.map((activity: any, idx: number) => (
                  <div key={activity.id || idx} className={`p-2.5 rounded-xl border transition-colors ${
                    activity.action === 'buy' ? 'bg-gain/5 border-gain/20' :
                    activity.action === 'sell' ? 'bg-loss/5 border-loss/20' :
                    'bg-ink-surface border-ink-edge'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{activity.fund}</span>
                        <Badge className={`text-[10px] px-1.5 ${
                          activity.action === 'buy' ? 'bg-gain/20 text-gain' :
                          activity.action === 'sell' ? 'bg-loss/20 text-loss' :
                          'bg-accent-core/20 text-accent-bright'
                        }`}>
                          {activity.action.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge className={`text-[10px] ${
                        activity.significance === 'major' ? 'bg-warn/20 text-warn' :
                        activity.significance === 'notable' ? 'bg-ink-raised/20 text-body' :
                        'bg-ink-raised/20 text-muted'
                      }`}>
                        {activity.significance}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-primary font-medium">{activity.token}</span>
                      <span className="text-secondary">${(activity.valueUsd / 1e6)?.toFixed(2)}M</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted">
                      <span className="font-mono truncate max-w-[120px]">{activity.txHash?.slice(0, 10)}...</span>
                      <span>{new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Exchange Flows & DEX/CEX Volume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Exchange Flows */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Exchange Flows</h3>
              <div className="ml-auto flex items-center gap-2">
                {exchangeFlowsTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(exchangeFlowsTimestamp)}
                  </span>
                )}
                <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                  24h Net
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              {exchangeFlows.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading flows...</p>
              ) : (
                exchangeFlows.slice(0, 5).map((flow: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-primary">{flow.exchange}</span>
                      <Badge className={`text-[10px] ${
                        flow.trend === 'accumulation' ? 'bg-gain/20 text-gain' :
                        flow.trend === 'distribution' ? 'bg-loss/20 text-loss' :
                        'bg-ink-raised/20 text-secondary'
                      }`}>
                        {flow.trend}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-gain block">Inflow</span>
                        <span className="text-primary">${(flow.inflow24h / 1e6)?.toFixed(0)}M</span>
                      </div>
                      <div>
                        <span className="text-loss block">Outflow</span>
                        <span className="text-primary">${(flow.outflow24h / 1e6)?.toFixed(0)}M</span>
                      </div>
                      <div>
                        <span className="text-muted block">Net</span>
                        <span className={flow.netFlow >= 0 ? 'text-gain' : 'text-loss'}>
                          {flow.netFlow >= 0 ? '+' : ''}${(flow.netFlow / 1e6)?.toFixed(0)}M
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-ink-raised rounded-full overflow-hidden mt-2 flex">
                      <div className="h-full bg-gain" style={{ width: `${(flow.inflow24h / (flow.inflow24h + flow.outflow24h)) * 100}%` }} />
                      <div className="h-full bg-loss" style={{ width: `${(flow.outflow24h / (flow.inflow24h + flow.outflow24h)) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DEX vs CEX Volume */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">DEX vs CEX Volume</h3>
              <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                24h
              </Badge>
            </div>
            <div className="space-y-2">
              {dexCexVolume.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading volume data...</p>
              ) : (
                dexCexVolume.slice(0, 5).map((vol: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-primary">{vol.token}</span>
                      <Badge className={`text-[10px] ${vol.dexDominant ? 'bg-accent-core/20 text-accent-bright' : 'bg-accent-core/20 text-accent-bright'}`}>
                        {vol.dexDominant ? 'DEX Leading' : 'CEX Leading'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="text-accent-bright">DEX: {vol.dexPercent?.toFixed(0)}%</span>
                      <span className="text-accent-bright">CEX: {vol.cexPercent?.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-ink-raised rounded-full overflow-hidden flex">
                      <div className="h-full bg-accent-core" style={{ width: `${vol.dexPercent}%` }} />
                      <div className="h-full bg-accent-core" style={{ width: `${vol.cexPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-muted mt-1.5 truncate">{vol.interpretation}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 5: AI Trade Ideas & Event Impact Predictor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Trade Ideas */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">AI Trade Ideas</h3>
              <div className="ml-auto flex items-center gap-2">
                {aiTradeIdeasTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(aiTradeIdeasTimestamp)}
                  </span>
                )}
                <Badge className="bg-accent-core/10 text-accent-bright border-violet-500/30 text-xs">
                  <Brain className="w-2.5 h-2.5 mr-1" />
                  AI
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {aiTradeIdeas.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading trade ideas...</p>
              ) : (
                aiTradeIdeas.map((idea: any, idx: number) => (
                  <div key={idea.id || idx} className={`p-3 rounded-xl border transition-colors ${
                    idea.direction === 'long' ? 'bg-gain/5 border-gain/20' : 'bg-loss/5 border-loss/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{idea.asset}</span>
                        <Badge className={`text-[10px] ${idea.direction === 'long' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
                          {idea.direction.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-ink-raised rounded-full overflow-hidden">
                          <div className="h-full bg-accent-core rounded-full" style={{ width: `${idea.confidence}%` }} />
                        </div>
                        <span className="text-[10px] text-accent-bright">{idea.confidence}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
                      <div>
                        <span className="text-muted block">Entry</span>
                        <span className="text-primary">${idea.entry?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Target</span>
                        <span className="text-gain">${idea.target?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Stop</span>
                        <span className="text-loss">${idea.stopLoss?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted block">R:R</span>
                        <span className="text-accent-bright">{idea.riskReward?.toFixed(1)}:1</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-secondary line-clamp-2">{idea.reasoning}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {idea.signals?.slice(0, 3).map((signal: string, i: number) => (
                        <Badge key={i} className="text-[9px] px-1 py-0 bg-accent-core/10 text-violet-300">{signal}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Impact Predictor */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-warn/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warn" />
              <h3 className="text-sm font-bold text-primary">Event Impact Predictor</h3>
              <Badge className="ml-auto bg-warn/10 text-warn border-warn/30 text-xs">
                AI Analysis
              </Badge>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {eventImpacts.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading events...</p>
              ) : (
                eventImpacts.map((event: any, idx: number) => (
                  <div key={event.id || idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-secondary">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <Badge className="text-[10px] bg-warn/10 text-warn">{event.category}</Badge>
                    </div>
                    <p className="text-sm text-primary mb-2">{event.event}</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted">Predicted Impact</span>
                          <span className={event.predictedImpact >= 0 ? 'text-gain' : 'text-loss'}>
                            {event.predictedImpact >= 0 ? '+' : ''}{event.predictedImpact?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-ink-raised rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${event.predictedImpact >= 0 ? 'bg-gain' : 'bg-loss'}`}
                            style={{ width: `${Math.min(Math.abs(event.predictedImpact) * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-muted block">Confidence</span>
                        <span className="text-xs font-medium text-warn">{event.confidence}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {event.affectedAssets?.slice(0, 4).map((asset: string, i: number) => (
                        <Badge key={i} className="text-[9px] px-1 py-0 bg-ink-surface text-secondary">{asset}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 6: Anomaly Detector & Crypto Conferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anomaly Detector */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-loss/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-loss" />
              <h3 className="text-sm font-bold text-primary">Anomaly Detector</h3>
              <div className="ml-auto flex items-center gap-2">
                {anomaliesTimestamp && (
                  <span className="text-[9px] text-muted flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-gain" />
                    {timeAgo(anomaliesTimestamp)}
                  </span>
                )}
                <Badge className="bg-loss/10 text-loss border-loss/30 text-xs">
                  {anomalies.filter((a: any) => a.severity === 'critical').length} Critical
                </Badge>
              </div>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {anomalies.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No anomalies detected</p>
              ) : (
                anomalies.map((anomaly: any, idx: number) => (
                  <div key={anomaly.id || idx} className={`p-2.5 rounded-xl border transition-colors ${
                    anomaly.severity === 'critical' ? 'bg-loss/10 border-loss/30' :
                    anomaly.severity === 'warning' ? 'bg-warn/10 border-warn/30' :
                    'bg-ink-surface border-ink-edge'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{anomaly.asset}</span>
                        <Badge className={`text-[10px] ${
                          anomaly.severity === 'critical' ? 'bg-loss/20 text-loss' :
                          anomaly.severity === 'warning' ? 'bg-warn/20 text-warn' :
                          'bg-accent-core/20 text-accent-bright'
                        }`}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted">{anomaly.type}</span>
                    </div>
                    <p className="text-xs text-body mb-1.5">{anomaly.description}</p>
                    <div className="p-1.5 rounded bg-ink-surface text-[10px]">
                      <span className="text-muted">💡 </span>
                      <span className="text-secondary">{anomaly.recommendation}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Crypto Conferences */}
          <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 hover:border-accent-core/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-accent-bright" />
              <h3 className="text-sm font-bold text-primary">Crypto Conferences</h3>
              <Badge className="ml-auto bg-accent-core/10 text-accent-bright border-accent-core/30 text-xs">
                Upcoming
              </Badge>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {conferences.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Loading conferences...</p>
              ) : (
                conferences.map((conf: any, idx: number) => (
                  <div key={conf.id || idx} className="p-2.5 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-primary">{conf.name}</span>
                      <Badge className={`text-[10px] ${
                        conf.tier === 'major' ? 'bg-warn/20 text-warn' :
                        conf.tier === 'notable' ? 'bg-accent-core/20 text-accent-bright' :
                        'bg-ink-raised/20 text-secondary'
                      }`}>
                        {conf.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-secondary mb-1.5">
                      <span>{conf.location}</span>
                      <span>•</span>
                      <span>{new Date(conf.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(conf.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] mb-1.5">
                      <span className="text-muted">Expected:</span>
                      <span className="text-primary">{conf.expectedAttendees}</span>
                    </div>
                    {conf.relevantTokens?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {conf.relevantTokens.slice(0, 5).map((token: string, i: number) => (
                          <Badge key={i} className="text-[9px] px-1 py-0 bg-accent-core/10 text-accent-bright">{token}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Three Column Layout: Activity Feed, Whale Tracker, Resolution History */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Real-time Activity Feed */}
          <section className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl border border-gain/20">
                <Activity className="w-5 h-5 text-gain" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-primary">Live Activity</h2>
                <p className="text-xs text-secondary">Real-time platform activity</p>
              </div>
              <Badge className="ml-auto bg-gain/10 text-gain border-gain/30 text-xs">
                <Radio className="w-2 h-2 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-ink-divider">
                  {recentTrades.length === 0 && activities.length === 0 ? (
                    <div className="text-center py-8 text-secondary">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Waiting for activity...</p>
                    </div>
                  ) : (
                    <>
                      {recentTrades.slice(0, 15).map((trade, idx) => (
                        <div key={trade.id || idx} className="p-3 hover:bg-ink-surface transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-xl ${trade.outcome === 'yes' ? 'bg-gain/20' : 'bg-loss/20'}`}>
                              {trade.outcome === 'yes' ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-gain" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-loss" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-primary truncate">
                                  {trade.username}
                                </span>
                                <span className={`text-xs ${trade.outcome === 'yes' ? 'text-gain' : 'text-loss'}`}>
                                  {trade.tradeType === 'buy' ? 'bought' : 'sold'} {trade.outcome?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-secondary line-clamp-1">
                                {trade.marketQuestion?.slice(0, 50)}...
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted">
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
              <div className="p-2 rounded-xl border border-accent-core/20">
                <Anchor className="w-5 h-5 text-accent-bright" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-primary">Whale Tracker</h2>
                <p className="text-xs text-secondary">Top predictor positions</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-ink-divider">
                  {whales.length === 0 ? (
                    <div className="text-center py-8 text-secondary">
                      <Anchor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No whale activity yet</p>
                    </div>
                  ) : (
                    whales.slice(0, 8).map((whale, idx) => (
                      <div key={whale.userId || idx} className="p-3 hover:bg-ink-surface transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? 'text-primary' :
                            idx === 1 ? 'text-primary' :
                            idx === 2 ? 'text-primary' :
                            'bg-ink-raised text-body'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-primary truncate">
                                {whale.username}
                              </span>
                              {whale.isAiAgent && (
                                <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-xs px-1.5">
                                  <Bot className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-secondary">
                              <span>{whale.positionCount} positions</span>
                              <span className="text-gain font-medium">
                                {((whale.totalInvested || 0) / 1000).toFixed(1)}K STREAM
                              </span>
                            </div>
                            {whale.topPositions?.[0] && (
                              <div className="mt-2 p-2 rounded bg-ink-surface/50 text-xs">
                                <p className="text-secondary line-clamp-1 mb-1">
                                  {whale.topPositions[0].marketQuestion?.slice(0, 40)}...
                                </p>
                                <Badge className={`text-xs ${whale.topPositions[0].outcome === 'yes' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>
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
              <div className="p-2 rounded-xl border border-accent-core/20">
                <Check className="w-5 h-5 text-accent-bright" />
              </div>
              <div>
                <h2 className="text-lg font-orbitron font-bold text-primary">Resolution History</h2>
                <p className="text-xs text-secondary">Recently resolved markets</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm overflow-hidden max-h-[400px]">
              <ScrollArea className="h-[380px]">
                <div className="divide-y divide-ink-divider">
                  {resolvedMarkets.length === 0 ? (
                    <div className="text-center py-8 text-secondary">
                      <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No resolved markets yet</p>
                    </div>
                  ) : (
                    resolvedMarkets.slice(0, 10).map((market: any, idx: number) => (
                      <Link key={market.id || idx} href={`/markets/${market.id}`}>
                        <div className="p-3 hover:bg-ink-surface transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-xl ${
                              market.outcome === 'yes' ? 'bg-gain/20' : 
                              market.outcome === 'no' ? 'bg-loss/20' : 'bg-ink-raised/20'
                            }`}>
                              {market.outcome === 'yes' ? (
                                <Check className="w-4 h-4 text-gain" />
                              ) : market.outcome === 'no' ? (
                                <X className="w-4 h-4 text-loss" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-secondary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-primary line-clamp-2 mb-1">
                                {market.question}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge className={`${
                                  market.outcome === 'yes' ? 'bg-gain/20 text-gain border-gain/30' : 
                                  market.outcome === 'no' ? 'bg-loss/20 text-loss border-loss/30' : 
                                  'bg-ink-raised/20 text-secondary border-ink-edge/30'
                                }`}>
                                  Resolved: {market.outcome?.toUpperCase() || 'VOID'}
                                </Badge>
                                <span className="text-muted">
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

        {/* AI Trading Signals Section */}
        <section>
          <div
            onClick={() => setSignalsExpanded(!signalsExpanded)}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl border border-accent-core/20 hover:border-accent-core/40 transition-all backdrop-blur-sm"
            data-testid="toggle-signals"
          >
            <div className="p-2 rounded-xl border border-accent-core/20">
              <Zap className="w-5 h-5 text-accent-bright" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-primary">AI Trading Signals</h2>
              <p className="text-xs text-secondary">Real-time AI-powered market signals</p>
            </div>
            <Badge className="bg-gain/10 text-gain border border-gain/30 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Live
            </Badge>
            {signalsExpanded ? (
              <ChevronDown className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            )}
          </div>

          {signalsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
              {marketSignals.length === 0 ? (
                <div className="col-span-full text-center py-8 text-secondary">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading signals...</p>
                </div>
              ) : (
                marketSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))
              )}
            </div>
          )}
        </section>

        {/* Whale Movements & On-Chain Analytics */}
        <section>
          <div
            onClick={() => setWhaleMovementsExpanded(!whaleMovementsExpanded)}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl border border-accent-core/20 hover:border-accent-core/40 transition-all backdrop-blur-sm"
            data-testid="toggle-whale-movements"
          >
            <div className="p-2 rounded-xl border border-accent-core/20">
              <Droplet className="w-5 h-5 text-accent-bright" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-primary">Whale Tracker</h2>
              <p className="text-xs text-secondary">On-chain movements & accumulation patterns</p>
            </div>
            <Badge className="bg-accent-core/10 text-accent-bright border border-accent-core/30 text-xs">
              {whaleMovements.length} movements
            </Badge>
            {whaleMovementsExpanded ? (
              <ChevronDown className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            )}
          </div>

          {whaleMovementsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              {whaleMovements.length === 0 ? (
                <div className="col-span-full text-center py-8 text-secondary">
                  <Droplet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading whale movements...</p>
                </div>
              ) : (
                whaleMovements.map((movement) => (
                  <WhaleMovementCard key={movement.id} movement={movement} />
                ))
              )}
            </div>
          )}
        </section>

        {/* Market Sentiment Analysis */}
        <section>
          <div
            onClick={() => setSentimentExpanded(!sentimentExpanded)}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl border border-warn/20 hover:border-warn/40 transition-all backdrop-blur-sm"
            data-testid="toggle-sentiment"
          >
            <div className="p-2 rounded-xl border border-warn/20">
              <Gauge className="w-5 h-5 text-warn" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-primary">Sentiment Analysis</h2>
              <p className="text-xs text-secondary">Social, news & technical sentiment scores</p>
            </div>
            {sentimentExpanded ? (
              <ChevronDown className="w-5 h-5 text-secondary group-hover:text-warn transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-secondary group-hover:text-warn transition-colors" />
            )}
          </div>

          {sentimentExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
              {marketSentiments.length === 0 ? (
                <div className="col-span-full text-center py-8 text-secondary">
                  <Gauge className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading sentiment data...</p>
                </div>
              ) : (
                marketSentiments.map((sentiment, idx) => (
                  <SentimentGauge key={idx} data={sentiment} />
                ))
              )}
            </div>
          )}
        </section>

        {/* Correlation Heatmap */}
        <section>
          <div
            onClick={() => setCorrelationExpanded(!correlationExpanded)}
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl border border-gain/20 hover:border-gain/40 transition-all backdrop-blur-sm"
            data-testid="toggle-correlation"
          >
            <div className="p-2 rounded-xl border border-gain/20">
              <Network className="w-5 h-5 text-gain" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-primary">Correlation Heatmap</h2>
              <p className="text-xs text-secondary">Asset correlation matrix for portfolio diversification</p>
            </div>
            {correlationExpanded ? (
              <ChevronDown className="w-5 h-5 text-secondary group-hover:text-gain transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-secondary group-hover:text-gain transition-colors" />
            )}
          </div>

          {correlationExpanded && (
            <div className="pl-2">
              <CorrelationHeatmap />
            </div>
          )}
        </section>

        {/* Trending Markets Heat Map */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl border border-warn/20">
                <Flame className="w-5 h-5 text-warn" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-orbitron font-bold text-primary">Trending Markets</h2>
                <p className="text-xs text-secondary">Highest volume prediction markets</p>
              </div>
            </div>
            <Link href="/markets">
              <Button variant="ghost" size="sm" className="text-secondary hover:text-primary text-xs" data-testid="button-view-all-markets">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trendingMarkets.length === 0 ? (
              <div className="col-span-full text-center py-12 text-secondary">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trending markets yet</p>
              </div>
            ) : (
              trendingMarkets.map((market: PredictionMarket, idx: number) => {
                const yesPercent = market.yesPrice / 100;
                const isHot = idx < 3;
                const heatColor = idx === 0 ? 'border-loss/30' :
                                  idx === 1 ? 'border-warn/30' :
                                  idx === 2 ? 'border-warn/30' :
                                  'border-ink-edge/30';
                
                return (
                  <Link key={market.id} href={`/markets/${market.id}`}>
                    <div className={`relative group cursor-pointer rounded-xl ${heatColor} border backdrop-blur-sm p-4 hover:scale-[1.02] transition-all duration-200`}>
                      {isHot && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="text-primary text-xs px-2 py-0.5 rounded-full shadow-lg">
                            Hot
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs bg-ink-surface border-ink-edge">
                          {market.category}
                        </Badge>
                        <span className="text-xs text-secondary">#{idx + 1}</span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-primary mb-3 line-clamp-2 min-h-[40px]">
                        {market.question}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gain">YES {yesPercent.toFixed(0)}%</span>
                          <span className="text-loss">NO {(100 - yesPercent).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-ink-raised/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ width: `${yesPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-secondary">
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
              <div className="p-2 rounded-xl border border-warn/20">
                <Timer className="w-5 h-5 text-warn" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-orbitron font-bold text-primary">Resolution Watch</h2>
                <p className="text-xs text-secondary">Markets expiring soon</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringMarkets.length === 0 ? (
              <div className="col-span-full text-center py-8 text-secondary">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No markets expiring soon</p>
              </div>
            ) : (
              expiringMarkets.map((market: PredictionMarket) => {
                const deadline = new Date(market.deadline);
                const now = new Date();
                const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const urgencyColor = daysLeft <= 3 ? 'border-loss/30 bg-loss/5' : 
                                     daysLeft <= 7 ? 'border-warn/30 bg-warn/5' : 
                                     'border-warn/30 bg-warn/5';
                
                return (
                  <Link key={market.id} href={`/markets/${market.id}`}>
                    <div className={`p-4 rounded-xl border backdrop-blur-sm ${urgencyColor} hover:scale-[1.02] transition-all cursor-pointer`}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {market.category}
                        </Badge>
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          daysLeft <= 3 ? 'text-loss' : daysLeft <= 7 ? 'text-warn' : 'text-warn'
                        }`}>
                          <Timer className="w-3 h-3" />
                          <Countdown deadline={market.deadline} />
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium text-primary mb-3 line-clamp-2">
                        {market.question}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gain font-medium">
                          YES {((market.yesPrice ?? 5000) > 10000 ? 50 : (market.yesPrice ?? 5000) / 100).toFixed(0)}%
                        </span>
                        <span className="text-secondary">
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
                <div className="p-2 rounded-xl border border-warn/20">
                  <Trophy className="w-5 h-5 text-warn" />
                </div>
                <div>
                  <h2 className="text-lg font-orbitron font-bold text-primary">Top Predictors</h2>
                  <p className="text-xs text-secondary">This week's best performers</p>
                </div>
              </div>
              <Link href="/leagues">
                <Button variant="ghost" size="sm" className="text-secondary hover:text-primary text-xs">
                  Full Rankings <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <Crown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Leaderboard loading...</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-divider">
                  {leaderboard.slice(0, 5).map((user: any, idx: number) => {
                    const isAI = user.isAiAgent;
                    const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                    
                    return (
                      <div key={user.userId || idx} className="flex items-center gap-4 p-4 hover:bg-ink-surface transition-colors">
                        <div className="w-8 text-center font-bold text-lg">
                          {rankIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary text-sm truncate">
                              {user.displayName || user.username || 'Anonymous'}
                            </span>
                            {isAI && (
                              <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-xs px-1.5">
                                <Bot className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-secondary">
                            {user.totalTrades || 0} trades • {((user.winRate || 0) * 100).toFixed(0)}% win rate
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gain">
                            +{((user.totalProfit || 0) / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-secondary">STREAM</p>
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
                <div className="p-2 rounded-xl border border-accent-core/20">
                  <Sparkles className="w-5 h-5 text-accent-bright" />
                </div>
                <div>
                  <h2 className="text-lg font-orbitron font-bold text-primary">AI Market Scout</h2>
                  <p className="text-xs text-secondary">AI-powered opportunities</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-ink-edge bg-ink-surface backdrop-blur-sm p-4 space-y-4">
              {/* AI Confidence Signal */}
              <div className="p-3 rounded-xl border border-accent-core/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-accent-bright" />
                  <span className="text-xs font-medium text-accent-bright">High Confidence Picks</span>
                </div>
                <div className="space-y-2">
                  {activeMarkets
                    .filter((m: PredictionMarket) => m.aiProbability && m.aiProbability > 70)
                    .slice(0, 3)
                    .map((market: PredictionMarket) => (
                      <Link key={market.id} href={`/markets/${market.id}`}>
                        <div className="flex items-center justify-between p-2 rounded bg-ink-surface hover:bg-ink-raised transition-colors cursor-pointer">
                          <span className="text-xs text-primary truncate flex-1 mr-2">
                            {market.question.slice(0, 50)}...
                          </span>
                          <Badge className="bg-gain/20 text-gain border-0 text-xs">
                            {market.aiProbability}%
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  {activeMarkets.filter((m: PredictionMarket) => m.aiProbability && m.aiProbability > 70).length === 0 && (
                    <p className="text-xs text-secondary text-center py-2">No high confidence picks currently</p>
                  )}
                </div>
              </div>
              
              {/* Market Sentiment */}
              <div className="p-3 rounded-xl border border-accent-core/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent-bright" />
                  <span className="text-xs font-medium text-accent-bright">Market Sentiment</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-secondary">Overall Bullish</span>
                  <span className="text-sm font-bold text-gain">62%</span>
                </div>
                <div className="h-2 bg-ink-raised/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
              
              {/* Hot Categories */}
              <div className="p-3 rounded-xl border border-warn/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-warn" />
                  <span className="text-xs font-medium text-warn">Trending Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['crypto', 'defi', 'politics', 'tech'].map((cat) => (
                    <Badge key={cat} variant="outline" className="bg-ink-surface border-ink-edge text-body text-xs capitalize">
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
            className="flex items-center gap-3 mb-4 cursor-pointer group p-4 rounded-xl bg-ink-surface border border-ink-edge hover:bg-ink-raised hover:border-accent-core/30 transition-all backdrop-blur-sm"
            data-testid="toggle-news"
          >
            <div className="p-2 rounded-xl bg-accent-core/10 border border-accent-core/20">
              <Newspaper className="w-5 h-5 text-accent-bright" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-orbitron font-bold text-primary">Market News</h2>
              <p className="text-xs text-secondary">Latest market intelligence</p>
            </div>
            {newsExpanded ? (
              <ChevronDown className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-secondary group-hover:text-accent-bright transition-colors" />
            )}
          </div>

          {newsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              {news.length === 0 ? (
                <div className="col-span-full text-center py-8 text-secondary text-sm">
                  Loading news...
                </div>
              ) : (
                news.slice(0, 6).map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-ink-surface border border-ink-edge hover:border-accent-core/30 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-primary text-sm line-clamp-2 flex-1">
                        {item.title || item.headline}
                      </h4>
                      <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap bg-ink-surface">
                        {item.source}
                      </Badge>
                    </div>
                    {item.summary && (
                      <p className="text-xs text-secondary line-clamp-2 mb-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted">
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
        <div className="mt-8 p-6 rounded-2xl border border-ink-edge backdrop-blur-sm text-center">
          <h3 className="text-lg font-orbitron font-bold text-primary mb-2">
            Ready to make predictions?
          </h3>
          <p className="text-sm text-secondary mb-4">
            Join the AI-powered prediction market revolution
          </p>
          <Link href="/markets">
            <Button className="hover:text-primary border-0 rounded-xl px-6" data-testid="button-start-trading">
              <Rocket className="w-4 h-4 mr-2" />
              Start Trading
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
