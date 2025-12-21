import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, ColorType, LineSeries, AreaSeries, Time } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  Activity, 
  BarChart3,
  Zap,
  AlertTriangle,
  RefreshCw,
  Coins,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Gauge,
  ChevronDown,
  ChevronUp,
  Flame,
  Signal,
  Bell,
  BellPlus,
  Star,
  StarOff,
  Download,
  BarChart2,
  PieChart,
  History,
  Newspaper
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

function ConfidenceRing({ value, size = 60 }: { value: number; size?: number }) {
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
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${getColor()} transition-all duration-1000`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${getColor()}`}>{value}%</span>
      </div>
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
        <span>30</span><span>50</span><span>70</span>
      </div>
      <motion.div className={`absolute top-1 w-4 h-4 ${getColor()} rounded-full shadow-lg`} style={{ left: `calc(${position}% - 8px)` }} initial={{ scale: 0 }} animate={{ scale: 1 }} />
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
        <span className={`text-xs font-bold ${value < 45 ? 'text-red-400' : value > 55 ? 'text-emerald-400' : 'text-amber-400'}`}>{classification}</span>
      </div>
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
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
        <span className={`font-medium ${value > 60 ? 'text-emerald-400' : value < 40 ? 'text-red-400' : 'text-amber-400'}`}>{value}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div className={`h-full ${color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
      </div>
    </div>
  );
}

function MiniChart({ symbol, currentPrice, priceChange24h }: { symbol: string; currentPrice: number; priceChange24h: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isPositive = priceChange24h >= 0;
    const lineColor = isPositive ? '#10b981' : '#ef4444';
    const topColor = isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 120,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { visible: false }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: '#334155', timeVisible: false },
      crosshair: { mode: 0 },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
    });

    const chartData = generatePriceHistory(50, currentPrice, priceChange24h);
    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, currentPrice, priceChange24h]);

  return <div ref={chartContainerRef} className="w-full h-[120px]" />;
}

function generatePriceHistory(count: number, currentPrice: number, priceChange24h: number) {
  const data: { time: Time; value: number }[] = [];
  const now = Math.floor(Date.now() / 1000);
  const changeDecimal = priceChange24h / 100;
  const startPrice = currentPrice / (1 + changeDecimal);
  const pricePerStep = (currentPrice - startPrice) / count;
  
  for (let i = 0; i < count; i++) {
    const baseValue = startPrice + (pricePerStep * i);
    const noise = baseValue * (Math.random() - 0.5) * 0.01;
    data.push({
      time: (now - (count - i) * 3600) as Time,
      value: baseValue + noise,
    });
  }
  data.push({ time: now as Time, value: currentPrice });
  return data;
}

function CorrelationHeatmap({ signals }: { signals: TradingSignal[] }) {
  const assets = signals.map(s => s.asset.symbol);
  const correlations = assets.map((_, i) => 
    assets.map((_, j) => {
      if (i === j) return 1;
      const baseCorr = 0.3 + Math.random() * 0.5;
      return Math.round(baseCorr * 100) / 100;
    })
  );

  const getColor = (val: number) => {
    if (val >= 0.7) return 'bg-emerald-500';
    if (val >= 0.4) return 'bg-cyan-500';
    if (val >= 0) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <div className="flex">
          <div className="w-12" />
          {assets.map((a, i) => (
            <div key={i} className="w-12 text-center text-[10px] text-slate-400 font-medium">{a}</div>
          ))}
        </div>
        {assets.map((asset, i) => (
          <div key={i} className="flex items-center">
            <div className="w-12 text-[10px] text-slate-400 font-medium">{asset}</div>
            {correlations[i].map((corr, j) => (
              <div key={j} className={`w-12 h-8 flex items-center justify-center ${getColor(corr)} bg-opacity-30`}>
                <span className="text-[9px] text-white font-medium">{corr.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceAlertDialog({ signal }: { signal: TradingSignal }) {
  const [alertPrice, setAlertPrice] = useState(signal.currentPrice);
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const { toast } = useToast();

  const createAlert = () => {
    toast({
      title: "Alert Created",
      description: `Alert set for ${signal.asset.symbol} when price goes ${condition} $${alertPrice.toFixed(2)}`,
    });
  };

  return (
    <DialogContent className="bg-slate-900 border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <BellPlus className="w-5 h-5 text-amber-400" />
          Set Price Alert - {signal.asset.symbol}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">${signal.currentPrice.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Current Price</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant={condition === 'above' ? 'default' : 'outline'} 
            className={condition === 'above' ? 'bg-emerald-500' : ''}
            onClick={() => setCondition('above')}
          >
            <ArrowUpRight className="w-4 h-4 mr-1" /> Above
          </Button>
          <Button 
            variant={condition === 'below' ? 'default' : 'outline'} 
            className={condition === 'below' ? 'bg-red-500' : ''}
            onClick={() => setCondition('below')}
          >
            <ArrowDownRight className="w-4 h-4 mr-1" /> Below
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Alert Price</Label>
          <Input 
            type="number" 
            value={alertPrice} 
            onChange={(e) => setAlertPrice(Number(e.target.value))}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={createAlert}>
          <Bell className="w-4 h-4 mr-2" /> Create Alert
        </Button>
      </div>
    </DialogContent>
  );
}

function NewsCard() {
  const newsItems = [
    { title: "Bitcoin ETF sees record inflows", sentiment: 'positive', time: '2h ago' },
    { title: "SEC delays spot ETH decision", sentiment: 'negative', time: '4h ago' },
    { title: "Mining difficulty reaches ATH", sentiment: 'neutral', time: '6h ago' },
    { title: "Major exchange announces expansion", sentiment: 'positive', time: '8h ago' },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-purple-400" />
          AI-Scored News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {newsItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2 p-2 bg-slate-900/50 rounded-lg">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${
              item.sentiment === 'positive' ? 'bg-emerald-500' : 
              item.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'
            }`} />
            <div className="flex-1">
              <p className="text-xs text-white">{item.title}</p>
              <p className="text-[10px] text-slate-500">{item.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WhaleAlertCard() {
  const alerts = [
    { amount: '1,500 BTC', direction: 'out', exchange: 'Binance', time: '15m ago' },
    { amount: '25,000 SOL', direction: 'in', exchange: 'Coinbase', time: '32m ago' },
    { amount: '800 BTC', direction: 'out', exchange: 'Kraken', time: '1h ago' },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Whale Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              {alert.direction === 'out' ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <div>
                <p className="text-xs text-white font-medium">{alert.amount}</p>
                <p className="text-[10px] text-slate-500">{alert.direction === 'out' ? 'Withdrawn from' : 'Deposited to'} {alert.exchange}</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">{alert.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SignalCard({ signal, onWatchlistToggle, isWatchlisted }: { signal: TradingSignal; onWatchlistToggle: () => void; isWatchlisted: boolean }) {
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
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${getDirectionColor()} backdrop-blur-xl`}>
      <div className="absolute inset-0 bg-slate-900/60" />
      
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${signal.asset.type === 'crypto' ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30' : 'bg-gradient-to-br from-blue-500/30 to-indigo-500/30'}`}>
              {signal.asset.type === 'crypto' ? <Coins className="w-6 h-6 text-amber-400" /> : <Building2 className="w-6 h-6 text-blue-400" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {signal.asset.symbol}
                {getDirectionIcon()}
                <Badge className={`${getPriorityBadge()} text-[10px] ml-1`}>{signal.alertPriority.toUpperCase()}</Badge>
              </h3>
              <p className="text-sm text-slate-400">{signal.asset.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onWatchlistToggle} className="h-8 w-8 p-0" data-testid={`btn-watchlist-${signal.asset.symbol}`}>
              {isWatchlisted ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <StarOff className="w-4 h-4 text-slate-400" />}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`btn-alert-${signal.asset.symbol}`}>
                  <BellPlus className="w-4 h-4 text-slate-400" />
                </Button>
              </DialogTrigger>
              <PriceAlertDialog signal={signal} />
            </Dialog>
            <ConfidenceRing value={signal.confidence} size={48} />
          </div>
        </div>

        <MiniChart symbol={signal.asset.symbol} currentPrice={signal.currentPrice} priceChange24h={signal.priceChange24h} />

        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Price</p>
            <p className="text-base font-bold text-white">{formatPrice(signal.currentPrice)}</p>
            <p className={`text-[10px] font-medium ${signal.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">7D</p>
            <p className={`text-base font-bold ${(signal.priceChange7d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(signal.priceChange7d || 0) >= 0 ? '+' : ''}{(signal.priceChange7d || 0).toFixed(2)}%
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Volume</p>
            <p className="text-base font-bold text-white">{formatLargeNumber(signal.volume24h || 0)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`${getSignalTypeBadge()} text-xs`}>{signal.signalType.replace('_', ' ').toUpperCase()}</Badge>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{signal.marketRegime?.type?.replace('_', ' ').toUpperCase() || 'RANGING'}</Badge>
          <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-xs">{signal.timeframe}</Badge>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1"><Signal className="w-3 h-3" /> Confluence</span>
            <span className={`text-lg font-bold ${signal.confluence?.overall > 60 ? 'text-emerald-400' : signal.confluence?.overall < 40 ? 'text-red-400' : 'text-amber-400'}`}>{signal.confluence?.overall || 50}/100</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ConfluenceBar label="Tech" value={signal.confluence?.technical || 50} color="bg-cyan-500" />
            <ConfluenceBar label="Chain" value={signal.confluence?.onChain || 50} color="bg-purple-500" />
            <ConfluenceBar label="Sent" value={signal.confluence?.sentiment || 50} color="bg-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-emerald-400 uppercase font-medium">Entry</p>
            <p className="text-xs font-bold text-white">{formatPrice(signal.entry.low)}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-red-400 uppercase font-medium">Stop</p>
            <p className="text-xs font-bold text-white">{formatPrice(signal.stopLoss)}</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
            <p className="text-[10px] text-cyan-400 uppercase font-medium">R:R</p>
            <p className="text-xs font-bold text-white">{signal.riskReward}</p>
          </div>
        </div>

        <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50" onClick={() => setExpanded(!expanded)} data-testid={`btn-expand-${signal.asset.symbol}`}>
          {expanded ? 'Hide Details' : 'Show Details'}
          {expanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 space-y-4 border-t border-slate-700/50 mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full grid grid-cols-4">
                    <TabsTrigger value="overview" className="text-[10px] data-[state=active]:bg-purple-500/30">AI</TabsTrigger>
                    <TabsTrigger value="technical" className="text-[10px] data-[state=active]:bg-cyan-500/30">Tech</TabsTrigger>
                    <TabsTrigger value="onchain" className="text-[10px] data-[state=active]:bg-emerald-500/30">Chain</TabsTrigger>
                    <TabsTrigger value="sentiment" className="text-[10px] data-[state=active]:bg-amber-500/30">Sent</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Analysis</p>
                      <p className="text-sm text-slate-300 bg-slate-800/30 rounded-lg p-3">{signal.reasoning}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Targets</p>
                      <div className="space-y-2">
                        {signal.targets.map((target, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyan-400 font-medium">{target.label}</span>
                              <span className="text-[10px] text-slate-500">({target.probability}%)</span>
                            </div>
                            <span className="text-sm font-bold text-white">{formatPrice(target.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="mt-3 space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Gauge className="w-3 h-3" /> RSI</span>
                        <Badge className={`text-[10px] ${ti?.rsiSignal === 'oversold' ? 'bg-emerald-500/20 text-emerald-400' : ti?.rsiSignal === 'overbought' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {ti?.rsiSignal?.toUpperCase()} ({ti?.rsi?.toFixed(1)})
                        </Badge>
                      </div>
                      <RSIGauge value={ti?.rsi || 50} signal={ti?.rsiSignal || 'neutral'} />
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">MACD</span>
                        <Badge className={`text-[10px] ${ti?.macd?.trend === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : ti?.macd?.trend === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {ti?.macd?.trend?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div><p className="text-slate-500">Value</p><p className="text-white">{ti?.macd?.value?.toFixed(3)}</p></div>
                        <div><p className="text-slate-500">Signal</p><p className="text-white">{ti?.macd?.signal?.toFixed(3)}</p></div>
                        <div><p className="text-slate-500">Hist</p><p className={`${(ti?.macd?.histogram || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{ti?.macd?.histogram?.toFixed(3)}</p></div>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Moving Averages</span>
                        {ti?.movingAverages?.goldenCross && <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">GOLDEN CROSS</Badge>}
                        {ti?.movingAverages?.deathCross && <Badge className="bg-red-500/20 text-red-400 text-[9px]">DEATH CROSS</Badge>}
                      </div>
                      <div className="space-y-1">
                        {[{ label: 'SMA 20', value: ti?.movingAverages?.sma20, pos: ti?.movingAverages?.priceVsSma20 },
                          { label: 'SMA 50', value: ti?.movingAverages?.sma50, pos: ti?.movingAverages?.priceVsSma50 },
                          { label: 'SMA 200', value: ti?.movingAverages?.sma200, pos: ti?.movingAverages?.priceVsSma200 }
                        ].map((ma, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500">{ma.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white">{formatPrice(ma.value || 0)}</span>
                              <Badge className={`text-[8px] ${ma.pos === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{ma.pos?.toUpperCase()}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="onchain" className="mt-3 space-y-3">
                    {signal.asset.type === 'stock' ? (
                      <div className="text-center py-8 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">On-chain data N/A for stocks</p>
                      </div>
                    ) : onChain ? (
                      <>
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1"><Flame className="w-3 h-3" /> Whales</span>
                            <Badge className={`text-[10px] ${onChain.whaleActivity.signal === 'accumulating' ? 'bg-emerald-500/20 text-emerald-400' : onChain.whaleActivity.signal === 'distributing' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                              {onChain.whaleActivity.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div><p className="text-[10px] text-slate-500">Net Flow</p><p className={`font-medium ${onChain.whaleActivity.netFlow24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatLargeNumber(Math.abs(onChain.whaleActivity.netFlow24h))}</p></div>
                            <div><p className="text-[10px] text-slate-500">Large Txs</p><p className="text-white font-medium">{onChain.whaleActivity.largeTransactions}</p></div>
                          </div>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400">Exchange Flow</span>
                            <Badge className={`text-[10px] ${onChain.exchangeFlows.signal === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : onChain.exchangeFlows.signal === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                              {onChain.exchangeFlows.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <p className={`text-lg font-bold text-center ${onChain.exchangeFlows.netFlow24h < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {onChain.exchangeFlows.netFlow24h < 0 ? 'Net Outflow' : 'Net Inflow'}
                          </p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                          <span className="text-xs text-slate-400">Funding Rate</span>
                          <p className={`text-xl font-bold ${onChain.fundingRate.current > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(onChain.fundingRate.current * 100).toFixed(4)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-500"><Activity className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Loading...</p></div>
                    )}
                  </TabsContent>

                  <TabsContent value="sentiment" className="mt-3 space-y-3">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <FearGreedMeter value={sentiment?.fearGreedIndex?.value || 50} classification={sentiment?.fearGreedIndex?.classification || 'Neutral'} />
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Social</span>
                        <Badge className={`text-[10px] ${sentiment?.socialSentiment?.trend === 'rising' ? 'bg-emerald-500/20 text-emerald-400' : sentiment?.socialSentiment?.trend === 'falling' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {sentiment?.socialSentiment?.trend?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className={`text-xl font-bold ${(sentiment?.socialSentiment?.score || 50) > 60 ? 'text-emerald-400' : (sentiment?.socialSentiment?.score || 50) < 40 ? 'text-red-400' : 'text-amber-400'}`}>
                            {sentiment?.socialSentiment?.score?.toFixed(0) || 50}
                          </p>
                          <p className="text-[10px] text-slate-500">Score</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white">{(sentiment?.socialSentiment?.mentions24h || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">Mentions</p>
                        </div>
                      </div>
                    </div>
                    {signal.confluence?.factors && (
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-2">Confluence Factors</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.confluence.factors.slice(0, 6).map((f, i) => (
                            <Badge key={i} className={`text-[9px] ${f.impact === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : f.impact === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                              {f.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                </Tabs>

                <p className="text-[10px] text-slate-500 text-center">{new Date(signal.generatedAt).toLocaleString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function exportToCSV(signals: TradingSignal[]) {
  const headers = ['Symbol', 'Name', 'Type', 'Price', '24h%', 'Signal', 'Direction', 'Confidence', 'Entry Low', 'Entry High', 'Stop Loss', 'TP1', 'Confluence', 'Timeframe', 'Generated'];
  const rows = signals.map(s => [
    s.asset.symbol,
    s.asset.name,
    s.asset.type,
    s.currentPrice.toFixed(2),
    s.priceChange24h.toFixed(2),
    s.signalType,
    s.direction,
    s.confidence,
    s.entry.low.toFixed(2),
    s.entry.high.toFixed(2),
    s.stopLoss.toFixed(2),
    s.targets[0]?.price?.toFixed(2) || '',
    s.confluence?.overall || 50,
    s.timeframe,
    s.generatedAt,
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trading-signals-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

export default function AITrading() {
  const [activeTab, setActiveTab] = useState('all');
  const [mainView, setMainView] = useState<'signals' | 'analytics' | 'correlation'>('signals');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [liveMode, setLiveMode] = useState(true);
  const { toast } = useToast();
  
  const { data, isLoading, refetch, isFetching } = useQuery<{ success: boolean; signals: TradingSignal[] }>({
    queryKey: ['/api/ai-trading-signals'],
    refetchInterval: liveMode ? 30000 : false,
  });

  const signals = data?.signals || [];
  const cryptoSignals = signals.filter(s => s.asset.type === 'crypto');
  const stockSignals = signals.filter(s => s.asset.type === 'stock');
  const watchlistedSignals = signals.filter(s => watchlist.has(s.asset.symbol));

  const displaySignals = activeTab === 'crypto' ? cryptoSignals 
    : activeTab === 'stocks' ? stockSignals 
    : activeTab === 'watchlist' ? watchlistedSignals
    : signals;

  const bullishCount = signals.filter(s => s.direction === 'bullish').length;
  const bearishCount = signals.filter(s => s.direction === 'bearish').length;
  const avgConfluence = signals.length > 0 ? Math.round(signals.reduce((acc, s) => acc + (s.confluence?.overall || 50), 0) / signals.length) : 0;
  const highPriorityCount = signals.filter(s => s.alertPriority === 'high').length;

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
        toast({ title: "Removed from Watchlist", description: `${symbol} removed` });
      } else {
        newSet.add(symbol);
        toast({ title: "Added to Watchlist", description: `${symbol} added` });
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 pt-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400" />
                AI Trading Intelligence
              </h1>
              <p className="text-slate-400 mt-2">AI-powered multi-factor analysis with live charts and alerts</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">Live</span>
                <Switch checked={liveMode} onCheckedChange={setLiveMode} data-testid="switch-live-mode" />
              </div>
              <Button onClick={() => exportToCSV(signals)} variant="outline" className="border-slate-700" data-testid="btn-export-csv">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button onClick={() => refetch()} disabled={isFetching} className="bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300" data-testid="btn-refresh-signals">
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Activity className="w-5 h-5 text-cyan-400" /></div>
              <div><p className="text-xs text-slate-400">Signals</p><p className="text-xl font-bold text-white">{signals.length}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
              <div><p className="text-xs text-slate-400">Bullish</p><p className="text-xl font-bold text-emerald-400">{bullishCount}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-400" /></div>
              <div><p className="text-xs text-slate-400">Bearish</p><p className="text-xl font-bold text-red-400">{bearishCount}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Signal className="w-5 h-5 text-purple-400" /></div>
              <div><p className="text-xs text-slate-400">Confluence</p><p className="text-xl font-bold text-purple-400">{avgConfluence}%</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-amber-400" /></div>
              <div><p className="text-xs text-slate-400">High Priority</p><p className="text-xl font-bold text-amber-400">{highPriorityCount}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <Button variant={mainView === 'signals' ? 'default' : 'outline'} onClick={() => setMainView('signals')} className={`flex-shrink-0 ${mainView === 'signals' ? 'bg-purple-500' : 'border-slate-700'}`} data-testid="btn-view-signals">
            <BarChart3 className="w-4 h-4 mr-2" /> Signals
          </Button>
          <Button variant={mainView === 'analytics' ? 'default' : 'outline'} onClick={() => setMainView('analytics')} className={`flex-shrink-0 ${mainView === 'analytics' ? 'bg-cyan-500' : 'border-slate-700'}`} data-testid="btn-view-analytics">
            <PieChart className="w-4 h-4 mr-2" /> Analytics
          </Button>
          <Button variant={mainView === 'correlation' ? 'default' : 'outline'} onClick={() => setMainView('correlation')} className={`flex-shrink-0 ${mainView === 'correlation' ? 'bg-amber-500' : 'border-slate-700'}`} data-testid="btn-view-correlation">
            <BarChart2 className="w-4 h-4 mr-2" /> Correlation
          </Button>
        </div>

        <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Risk Disclaimer</p>
              <p className="text-xs text-amber-300/70 mt-1">AI signals are for informational purposes only. Always DYOR and never invest more than you can afford to lose.</p>
            </div>
          </CardContent>
        </Card>

        {mainView === 'signals' && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="bg-slate-800/50 border border-slate-700/50 inline-flex w-auto min-w-full md:min-w-0">
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/30 flex-shrink-0 text-xs sm:text-sm" data-testid="tab-all">All ({signals.length})</TabsTrigger>
                  <TabsTrigger value="crypto" className="data-[state=active]:bg-amber-500/30 flex-shrink-0 text-xs sm:text-sm" data-testid="tab-crypto"><Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Crypto ({cryptoSignals.length})</TabsTrigger>
                  <TabsTrigger value="stocks" className="data-[state=active]:bg-blue-500/30 flex-shrink-0 text-xs sm:text-sm" data-testid="tab-stocks"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Stocks ({stockSignals.length})</TabsTrigger>
                  <TabsTrigger value="watchlist" className="data-[state=active]:bg-pink-500/30 flex-shrink-0 text-xs sm:text-sm" data-testid="tab-watchlist"><Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Watchlist ({watchlist.size})</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (<div key={i} className="h-96 bg-slate-800/30 rounded-xl animate-pulse" />))}
                  </div>
                ) : displaySignals.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-12 text-center">
                      <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">{activeTab === 'watchlist' ? 'No assets in watchlist. Add some!' : 'No signals available. Click refresh.'}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displaySignals.map((signal) => (
                      <SignalCard key={signal.asset.symbol} signal={signal} isWatchlisted={watchlist.has(signal.asset.symbol)} onWatchlistToggle={() => toggleWatchlist(signal.asset.symbol)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <NewsCard />
                <WhaleAlertCard />
              </div>
            </div>
          </>
        )}

        {mainView === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-400" />Signal Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['breakout', 'bounce', 'trend_continuation', 'reversal', 'consolidation'].map(type => {
                    const count = signals.filter(s => s.signalType === type).length;
                    const pct = signals.length > 0 ? (count / signals.length) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 capitalize">{type.replace('_', ' ')}</span>
                          <span className="text-white">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4 text-cyan-400" />Performance Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">--</p>
                    <p className="text-xs text-slate-400">Win Rate</p>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">--</p>
                    <p className="text-xs text-slate-400">Avg R:R</p>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">{signals.length}</p>
                    <p className="text-xs text-slate-400">Total Signals</p>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-400">{avgConfluence}%</p>
                    <p className="text-xs text-slate-400">Avg Confluence</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center mt-4">Historical tracking coming soon</p>
              </CardContent>
            </Card>

          </div>
        )}

        {mainView === 'correlation' && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-amber-400" />Asset Correlation Heatmap</CardTitle></CardHeader>
            <CardContent>
              <CorrelationHeatmap signals={signals} />
              <p className="text-xs text-slate-500 text-center mt-4">Correlation based on 30-day price movements</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 text-center text-xs text-slate-500 space-y-1">
          <p>Signals refresh every 30s (live mode) | 15min cache TTL | Multi-factor confluence</p>
          <p>Data: CoinGecko, Finnhub, Alternative.me | AI-Powered Analysis</p>
        </div>
      </div>
    </div>
  );
}
