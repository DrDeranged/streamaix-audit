import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Brain, 
  Activity, 
  BarChart3,
  Clock,
  Zap,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Coins,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Gauge,
  Waves,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  Flame,
  Snowflake,
  Signal,
  Scale,
  LineChart,
  CircleDot,
  TrendingUpIcon
} from 'lucide-react';

interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'oversold' | 'neutral' | 'overbought';
  macd: { value: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' | 'neutral' };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    priceVsSma20: 'above' | 'below';
    priceVsSma50: 'above' | 'below';
    priceVsSma200: 'above' | 'below';
    goldenCross: boolean;
    deathCross: boolean;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    position: string;
  };
  atr: number;
  atrPercent: number;
}

interface OnChainMetrics {
  whaleActivity: {
    netFlow24h: number;
    largeTransactions: number;
    signal: 'accumulating' | 'distributing' | 'neutral';
  };
  exchangeFlows: {
    netFlow24h: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  fundingRate: {
    current: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  openInterest: {
    value: number;
    change24h: number;
    signal: string;
  };
}

interface SentimentData {
  fearGreedIndex: {
    value: number;
    classification: string;
  };
  socialSentiment: {
    score: number;
    mentions24h: number;
    trend: string;
  };
  newsSentiment: {
    score: number;
    positiveCount: number;
    negativeCount: number;
  };
}

interface MarketRegime {
  type: string;
  strength: number;
  description: string;
}

interface ConfluenceScore {
  overall: number;
  technical: number;
  onChain: number;
  sentiment: number;
  factors: { name: string; impact: 'bullish' | 'bearish' | 'neutral'; weight: number }[];
}

interface TradingSignal {
  asset: {
    symbol: string;
    name: string;
    type: 'crypto' | 'stock';
  };
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h: number;
  marketCap: number;
  signalType: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: { low: number; high: number };
  stopLoss: number;
  targets: { price: number; label: string; probability: number }[];
  riskReward: string;
  timeframe: string;
  reasoning: string;
  keyLevels: { support: number[]; resistance: number[] };
  volumeAnalysis: string;
  technicalIndicators: TechnicalIndicators;
  onChainMetrics: OnChainMetrics | null;
  sentiment: SentimentData;
  marketRegime: MarketRegime;
  confluence: ConfluenceScore;
  tradeManagement: {
    positionSizeRecommendation: string;
    riskPerTrade: number;
    scalingStrategy: string;
    invalidationLevel: number;
  };
  alertPriority: 'high' | 'medium' | 'low';
  generatedAt: string;
}

function ConfidenceRing({ value, size = 60, label }: { value: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = () => {
    if (value >= 80) return 'text-emerald-400';
    if (value >= 70) return 'text-cyan-400';
    if (value >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size + (label ? 20 : 0) }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ height: size }}>
        <span className={`text-sm font-bold ${getColor()}`}>{value}%</span>
      </div>
      {label && <span className="text-[10px] text-slate-400 mt-1">{label}</span>}
    </div>
  );
}

function RSIGauge({ value, signal }: { value: number; signal: string }) {
  const getColor = () => {
    if (signal === 'oversold') return 'bg-emerald-500';
    if (signal === 'overbought') return 'bg-red-500';
    return 'bg-cyan-500';
  };
  
  const position = (value / 100) * 100;
  
  return (
    <div className="relative h-6 bg-gradient-to-r from-emerald-500/30 via-slate-700/50 to-red-500/30 rounded-full overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] text-slate-400">
        <span>30</span>
        <span>50</span>
        <span>70</span>
      </div>
      <motion.div 
        className={`absolute top-1 w-4 h-4 ${getColor()} rounded-full shadow-lg`}
        style={{ left: `calc(${position}% - 8px)` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      />
    </div>
  );
}

function FearGreedMeter({ value, classification }: { value: number; classification: string }) {
  const getColor = () => {
    if (value < 25) return 'from-red-500 to-orange-500';
    if (value < 45) return 'from-orange-500 to-amber-500';
    if (value < 55) return 'from-amber-500 to-yellow-500';
    if (value < 75) return 'from-yellow-500 to-lime-500';
    return 'from-lime-500 to-emerald-500';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">Fear & Greed</span>
        <span className={`text-xs font-bold ${value < 45 ? 'text-red-400' : value > 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {classification}
        </span>
      </div>
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white drop-shadow-md">{value}</span>
        </div>
      </div>
    </div>
  );
}

function ConfluenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-medium ${value > 60 ? 'text-emerald-400' : value < 40 ? 'text-red-400' : 'text-amber-400'}`}>
          {value}%
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const getDirectionIcon = () => {
    if (signal.direction === 'bullish') return <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
    if (signal.direction === 'bearish') return <ArrowDownRight className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getDirectionColor = () => {
    if (signal.direction === 'bullish') return 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30';
    if (signal.direction === 'bearish') return 'from-red-500/20 to-orange-500/20 border-red-500/30';
    return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
  };

  const getSignalTypeBadge = () => {
    const colors: Record<string, string> = {
      'breakout': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'bounce': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'flush': 'bg-red-500/20 text-red-400 border-red-500/30',
      'consolidation': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      'trend_continuation': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'reversal': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'accumulation': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'distribution': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[signal.signalType] || colors['consolidation'];
  };

  const getPriorityBadge = () => {
    const colors: Record<string, string> = {
      'high': 'bg-red-500/20 text-red-400 border-red-500/30',
      'medium': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[signal.alertPriority] || colors['low'];
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const ti = signal.technicalIndicators;
  const onChain = signal.onChainMetrics;
  const sentiment = signal.sentiment;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${getDirectionColor()} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-slate-900/60" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              signal.asset.type === 'crypto' 
                ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30' 
                : 'bg-gradient-to-br from-blue-500/30 to-indigo-500/30'
            }`}>
              {signal.asset.type === 'crypto' ? (
                <Coins className="w-6 h-6 text-amber-400" />
              ) : (
                <Building2 className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {signal.asset.symbol}
                {getDirectionIcon()}
                <Badge className={`${getPriorityBadge()} text-[10px] ml-1`}>
                  {signal.alertPriority.toUpperCase()}
                </Badge>
              </h3>
              <p className="text-sm text-slate-400">{signal.asset.name}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <ConfidenceRing value={signal.confidence} size={56} />
            <span className="text-[10px] text-slate-500">Confidence</span>
          </div>
        </div>

        {/* Price & Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Price</p>
            <p className="text-base font-bold text-white">{formatPrice(signal.currentPrice)}</p>
            <p className={`text-[10px] font-medium ${signal.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">7D Change</p>
            <p className={`text-base font-bold ${signal.priceChange7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.priceChange7d >= 0 ? '+' : ''}{signal.priceChange7d?.toFixed(2) || '0'}%
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Volume</p>
            <p className="text-base font-bold text-white">{formatLargeNumber(signal.volume24h || 0)}</p>
          </div>
        </div>

        {/* Signal Type & Regime */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`${getSignalTypeBadge()} text-xs`}>
            {signal.signalType.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
            {signal.marketRegime?.type?.replace('_', ' ').toUpperCase() || 'RANGING'}
          </Badge>
          <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-xs">
            {signal.timeframe}
          </Badge>
        </div>

        {/* Confluence Score Overview */}
        <div className="bg-slate-800/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <Signal className="w-3 h-3" /> Confluence Score
            </span>
            <span className={`text-lg font-bold ${
              signal.confluence?.overall > 60 ? 'text-emerald-400' : 
              signal.confluence?.overall < 40 ? 'text-red-400' : 'text-amber-400'
            }`}>
              {signal.confluence?.overall || 50}/100
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ConfluenceBar label="Technical" value={signal.confluence?.technical || 50} color="bg-cyan-500" />
            <ConfluenceBar label="On-Chain" value={signal.confluence?.onChain || 50} color="bg-purple-500" />
            <ConfluenceBar label="Sentiment" value={signal.confluence?.sentiment || 50} color="bg-amber-500" />
          </div>
        </div>

        {/* Trade Levels */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-emerald-400 uppercase font-medium">Entry Zone</p>
            <p className="text-xs font-bold text-white">
              {formatPrice(signal.entry.low)} - {formatPrice(signal.entry.high)}
            </p>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-red-400 uppercase font-medium">Stop Loss</p>
            <p className="text-xs font-bold text-white">{formatPrice(signal.stopLoss)}</p>
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-cyan-400 uppercase font-medium">R:R Ratio</p>
            <p className="text-xs font-bold text-white">{signal.riskReward}</p>
          </div>
        </div>

        {/* Expand Button */}
        <Button 
          variant="ghost" 
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
          onClick={() => setExpanded(!expanded)}
          data-testid={`btn-expand-${signal.asset.symbol}`}
        >
          {expanded ? 'Hide Advanced Analysis' : 'Show Advanced Analysis'}
          {expanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 border-t border-slate-700/50 mt-4">
                {/* Tabs for different analyses */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full grid grid-cols-4">
                    <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-purple-500/30">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="text-xs data-[state=active]:bg-cyan-500/30">
                      Technical
                    </TabsTrigger>
                    <TabsTrigger value="onchain" className="text-xs data-[state=active]:bg-emerald-500/30">
                      On-Chain
                    </TabsTrigger>
                    <TabsTrigger value="sentiment" className="text-xs data-[state=active]:bg-amber-500/30">
                      Sentiment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-3 space-y-3">
                    {/* AI Analysis */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> GPT-4o Analysis
                      </p>
                      <p className="text-sm text-slate-300 bg-slate-800/30 rounded-lg p-3">
                        {signal.reasoning}
                      </p>
                    </div>

                    {/* Take Profit Targets */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Take Profit Targets
                      </p>
                      <div className="space-y-2">
                        {signal.targets.map((target, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyan-400 font-medium">{target.label}</span>
                              <span className="text-[10px] text-slate-500">({target.probability}% prob)</span>
                            </div>
                            <span className="text-sm font-bold text-white">{formatPrice(target.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trade Management */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Trade Management
                      </p>
                      <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Position Size</span>
                          <span className="text-xs text-white font-medium">{signal.tradeManagement?.positionSizeRecommendation || 'Moderate (2-3%)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Risk Per Trade</span>
                          <span className="text-xs text-white font-medium">{signal.tradeManagement?.riskPerTrade || 2}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Invalidation</span>
                          <span className="text-xs text-red-400 font-medium">{formatPrice(signal.tradeManagement?.invalidationLevel || signal.stopLoss * 0.95)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
                          {signal.tradeManagement?.scalingStrategy || 'Scale in 50% at entry, 50% on pullback'}
                        </p>
                      </div>
                    </div>

                    {/* Key Levels */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-medium mb-2">Support Levels</p>
                        <div className="bg-emerald-500/10 rounded-lg p-2 space-y-1">
                          {(signal.keyLevels?.support || [ti?.bollingerBands?.lower, ti?.movingAverages?.sma50]).map((level, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-[10px] text-emerald-400">S{i + 1}</span>
                              <span className="text-xs text-white font-medium">{formatPrice(level)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-medium mb-2">Resistance Levels</p>
                        <div className="bg-red-500/10 rounded-lg p-2 space-y-1">
                          {(signal.keyLevels?.resistance || [ti?.bollingerBands?.upper, ti?.movingAverages?.sma20 * 1.05]).map((level, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-[10px] text-red-400">R{i + 1}</span>
                              <span className="text-xs text-white font-medium">{formatPrice(level)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="mt-3 space-y-3">
                    {/* RSI */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Gauge className="w-3 h-3" /> RSI (14)
                        </span>
                        <Badge className={`text-[10px] ${
                          ti?.rsiSignal === 'oversold' ? 'bg-emerald-500/20 text-emerald-400' :
                          ti?.rsiSignal === 'overbought' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {ti?.rsiSignal?.toUpperCase() || 'NEUTRAL'} ({ti?.rsi?.toFixed(1) || 50})
                        </Badge>
                      </div>
                      <RSIGauge value={ti?.rsi || 50} signal={ti?.rsiSignal || 'neutral'} />
                    </div>

                    {/* MACD */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <LineChart className="w-3 h-3" /> MACD
                        </span>
                        <Badge className={`text-[10px] ${
                          ti?.macd?.trend === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                          ti?.macd?.trend === 'bearish' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {ti?.macd?.trend?.toUpperCase() || 'NEUTRAL'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500">Value</p>
                          <p className="text-xs font-medium text-white">{ti?.macd?.value?.toFixed(4) || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Signal</p>
                          <p className="text-xs font-medium text-white">{ti?.macd?.signal?.toFixed(4) || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Histogram</p>
                          <p className={`text-xs font-medium ${(ti?.macd?.histogram || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {ti?.macd?.histogram?.toFixed(4) || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Moving Averages */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Moving Averages</span>
                        {ti?.movingAverages?.goldenCross && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">GOLDEN CROSS</Badge>
                        )}
                        {ti?.movingAverages?.deathCross && (
                          <Badge className="bg-red-500/20 text-red-400 text-[10px]">DEATH CROSS</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">SMA 20</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white">{formatPrice(ti?.movingAverages?.sma20 || 0)}</span>
                            <Badge className={`text-[9px] ${ti?.movingAverages?.priceVsSma20 === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {ti?.movingAverages?.priceVsSma20?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">SMA 50</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white">{formatPrice(ti?.movingAverages?.sma50 || 0)}</span>
                            <Badge className={`text-[9px] ${ti?.movingAverages?.priceVsSma50 === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {ti?.movingAverages?.priceVsSma50?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">SMA 200</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white">{formatPrice(ti?.movingAverages?.sma200 || 0)}</span>
                            <Badge className={`text-[9px] ${ti?.movingAverages?.priceVsSma200 === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {ti?.movingAverages?.priceVsSma200?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bollinger Bands */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Waves className="w-3 h-3" /> Bollinger Bands
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Bandwidth: {ti?.bollingerBands?.bandwidth?.toFixed(2) || 0}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-red-500/10 rounded p-1">
                          <p className="text-[10px] text-red-400">Upper</p>
                          <p className="text-xs font-medium text-white">{formatPrice(ti?.bollingerBands?.upper || 0)}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded p-1">
                          <p className="text-[10px] text-slate-400">Middle</p>
                          <p className="text-xs font-medium text-white">{formatPrice(ti?.bollingerBands?.middle || 0)}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded p-1">
                          <p className="text-[10px] text-emerald-400">Lower</p>
                          <p className="text-xs font-medium text-white">{formatPrice(ti?.bollingerBands?.lower || 0)}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-slate-500 mt-2">
                        Position: {ti?.bollingerBands?.position?.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>

                    {/* ATR */}
                    <div className="flex justify-between items-center bg-slate-800/30 rounded-lg p-3">
                      <span className="text-xs text-slate-400">ATR (Volatility)</span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatPrice(ti?.atr || 0)}</p>
                        <p className="text-[10px] text-slate-500">{ti?.atrPercent?.toFixed(2) || 0}% of price</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="onchain" className="mt-3 space-y-3">
                    {signal.asset.type === 'stock' ? (
                      <div className="text-center py-8 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">On-chain metrics not available for stocks</p>
                      </div>
                    ) : onChain ? (
                      <>
                        {/* Whale Activity */}
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Whale Activity
                            </span>
                            <Badge className={`text-[10px] ${
                              onChain.whaleActivity.signal === 'accumulating' ? 'bg-emerald-500/20 text-emerald-400' :
                              onChain.whaleActivity.signal === 'distributing' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {onChain.whaleActivity.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-slate-500">Net Flow 24h</p>
                              <p className={`text-sm font-medium ${onChain.whaleActivity.netFlow24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatLargeNumber(Math.abs(onChain.whaleActivity.netFlow24h))}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-slate-500">Large Txs</p>
                              <p className="text-sm font-medium text-white">{onChain.whaleActivity.largeTransactions}</p>
                            </div>
                          </div>
                        </div>

                        {/* Exchange Flows */}
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Exchange Flows
                            </span>
                            <Badge className={`text-[10px] ${
                              onChain.exchangeFlows.signal === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                              onChain.exchangeFlows.signal === 'bearish' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {onChain.exchangeFlows.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500">Net Flow</p>
                            <p className={`text-lg font-bold ${onChain.exchangeFlows.netFlow24h < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {onChain.exchangeFlows.netFlow24h < 0 ? 'Outflow' : 'Inflow'}
                            </p>
                            <p className="text-xs text-slate-400">{formatLargeNumber(Math.abs(onChain.exchangeFlows.netFlow24h))}</p>
                          </div>
                        </div>

                        {/* Funding Rate */}
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400">Funding Rate</span>
                            <Badge className={`text-[10px] ${
                              onChain.fundingRate.signal === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                              onChain.fundingRate.signal === 'bearish' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {onChain.fundingRate.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${onChain.fundingRate.current > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(onChain.fundingRate.current * 100).toFixed(4)}%
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {onChain.fundingRate.current > 0 ? 'Longs pay shorts' : 'Shorts pay longs'}
                            </p>
                          </div>
                        </div>

                        {/* Open Interest */}
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400">Open Interest</span>
                            <Badge className={`text-[10px] ${
                              onChain.openInterest.change24h > 5 ? 'bg-emerald-500/20 text-emerald-400' :
                              onChain.openInterest.change24h < -5 ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {onChain.openInterest.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                              <p className="text-[10px] text-slate-500">Total OI</p>
                              <p className="text-sm font-medium text-white">{formatLargeNumber(onChain.openInterest.value)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-slate-500">24h Change</p>
                              <p className={`text-sm font-medium ${onChain.openInterest.change24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {onChain.openInterest.change24h > 0 ? '+' : ''}{onChain.openInterest.change24h.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">On-chain data loading...</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sentiment" className="mt-3 space-y-3">
                    {/* Fear & Greed */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <FearGreedMeter 
                        value={sentiment?.fearGreedIndex?.value || 50} 
                        classification={sentiment?.fearGreedIndex?.classification || 'Neutral'} 
                      />
                    </div>

                    {/* Social Sentiment */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Social Sentiment</span>
                        <Badge className={`text-[10px] ${
                          sentiment?.socialSentiment?.trend === 'rising' ? 'bg-emerald-500/20 text-emerald-400' :
                          sentiment?.socialSentiment?.trend === 'falling' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {sentiment?.socialSentiment?.trend?.toUpperCase() || 'STABLE'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            (sentiment?.socialSentiment?.score || 50) > 60 ? 'text-emerald-400' : 
                            (sentiment?.socialSentiment?.score || 50) < 40 ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {sentiment?.socialSentiment?.score?.toFixed(0) || 50}
                          </p>
                          <p className="text-[10px] text-slate-500">Sentiment Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">
                            {(sentiment?.socialSentiment?.mentions24h || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500">24h Mentions</p>
                        </div>
                      </div>
                    </div>

                    {/* News Sentiment */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">News Sentiment</span>
                        <span className={`text-sm font-bold ${
                          (sentiment?.newsSentiment?.score || 50) > 60 ? 'text-emerald-400' : 
                          (sentiment?.newsSentiment?.score || 50) < 40 ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {sentiment?.newsSentiment?.score?.toFixed(0) || 50}/100
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center bg-emerald-500/10 rounded p-2">
                          <p className="text-lg font-bold text-emerald-400">{sentiment?.newsSentiment?.positiveCount || 0}</p>
                          <p className="text-[10px] text-emerald-400/70">Positive</p>
                        </div>
                        <div className="text-center bg-slate-700/50 rounded p-2">
                          <p className="text-lg font-bold text-slate-300">
                            {(20 - (sentiment?.newsSentiment?.positiveCount || 0) - (sentiment?.newsSentiment?.negativeCount || 0)) || 0}
                          </p>
                          <p className="text-[10px] text-slate-500">Neutral</p>
                        </div>
                        <div className="text-center bg-red-500/10 rounded p-2">
                          <p className="text-lg font-bold text-red-400">{sentiment?.newsSentiment?.negativeCount || 0}</p>
                          <p className="text-[10px] text-red-400/70">Negative</p>
                        </div>
                      </div>
                    </div>

                    {/* Market Regime */}
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Market Regime</span>
                        <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                          {signal.marketRegime?.type?.replace('_', ' ').toUpperCase() || 'RANGING'}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-500">Strength</span>
                          <span className="text-white">{signal.marketRegime?.strength || 50}%</span>
                        </div>
                        <Progress value={signal.marketRegime?.strength || 50} className="h-2" />
                      </div>
                      <p className="text-[10px] text-slate-400">{signal.marketRegime?.description || 'Market conditions are neutral'}</p>
                    </div>

                    {/* Confluence Factors */}
                    {signal.confluence?.factors && signal.confluence.factors.length > 0 && (
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-2">Confluence Factors</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.confluence.factors.slice(0, 8).map((factor, i) => (
                            <Badge 
                              key={i} 
                              className={`text-[9px] ${
                                factor.impact === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                                factor.impact === 'bearish' ? 'bg-red-500/20 text-red-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}
                            >
                              {factor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <p className="text-[10px] text-slate-500 text-center">
                  Powered by GPT-4o | Generated: {new Date(signal.generatedAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AITrading() {
  const [activeTab, setActiveTab] = useState('all');
  
  const { data, isLoading, refetch, isFetching } = useQuery<{ success: boolean; signals: TradingSignal[] }>({
    queryKey: ['/api/ai-trading-signals'],
    refetchInterval: 60000,
  });

  const signals = data?.signals || [];
  const cryptoSignals = signals.filter(s => s.asset.type === 'crypto');
  const stockSignals = signals.filter(s => s.asset.type === 'stock');

  const displaySignals = activeTab === 'crypto' ? cryptoSignals 
    : activeTab === 'stocks' ? stockSignals 
    : signals;

  const bullishCount = signals.filter(s => s.direction === 'bullish').length;
  const bearishCount = signals.filter(s => s.direction === 'bearish').length;
  const avgConfidence = signals.length > 0 
    ? Math.round(signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length)
    : 0;
  const avgConfluence = signals.length > 0
    ? Math.round(signals.reduce((acc, s) => acc + (s.confluence?.overall || 50), 0) / signals.length)
    : 0;
  const highPriorityCount = signals.filter(s => s.alertPriority === 'high').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400" />
                AI Trading Intelligence
              </h1>
              <p className="text-slate-400 mt-2">
                GPT-4o powered multi-factor analysis with technical, on-chain & sentiment confluence
              </p>
            </div>
            
            <Button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300"
              data-testid="btn-refresh-signals"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh Signals
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Signals</p>
                <p className="text-xl font-bold text-white">{signals.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Bullish</p>
                <p className="text-xl font-bold text-emerald-400">{bullishCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Bearish</p>
                <p className="text-xl font-bold text-red-400">{bearishCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Signal className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Confluence</p>
                <p className="text-xl font-bold text-purple-400">{avgConfluence}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">High Priority</p>
                <p className="text-xl font-bold text-amber-400">{highPriorityCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Disclaimer */}
        <Card className="bg-amber-500/10 border-amber-500/30 mb-8">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Risk Disclaimer</p>
              <p className="text-xs text-amber-300/70 mt-1">
                AI-generated signals are for informational purposes only. Technical indicators, on-chain data, and sentiment analysis provide confluence but cannot predict the future. Always do your own research and never invest more than you can afford to lose.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/30" data-testid="tab-all">
              All ({signals.length})
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-amber-500/30" data-testid="tab-crypto">
              <Coins className="w-4 h-4 mr-1" />
              Crypto ({cryptoSignals.length})
            </TabsTrigger>
            <TabsTrigger value="stocks" className="data-[state=active]:bg-blue-500/30" data-testid="tab-stocks">
              <Building2 className="w-4 h-4 mr-1" />
              Mining Stocks ({stockSignals.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Signal Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-slate-800/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displaySignals.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No signals available. Click refresh to generate new signals.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displaySignals.map((signal) => (
              <SignalCard key={signal.asset.symbol} signal={signal} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-500 space-y-1">
          <p>Signals refreshed every 15 minutes | Multi-factor confluence scoring</p>
          <p>Data Sources: CoinGecko, Finnhub, Alternative.me | Analysis: GPT-4o</p>
          <p className="text-purple-400">Technical Indicators: RSI, MACD, Bollinger Bands, Moving Averages, ATR</p>
          <p className="text-cyan-400">On-Chain: Whale Activity, Exchange Flows, Funding Rates, Open Interest</p>
          <p className="text-amber-400">Sentiment: Fear & Greed Index, Social Sentiment, News Analysis</p>
        </div>
      </div>
    </div>
  );
}
