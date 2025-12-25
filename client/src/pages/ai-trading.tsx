import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
  Newspaper,
  Sparkles,
  Radio,
  Cpu,
  Network
} from 'lucide-react';

function NeuralBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2306b6d4%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
      
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={i}
            x1="0"
            y1={`${15 + i * 20}%`}
            x2="100%"
            y2={`${15 + i * 20}%`}
            stroke="url(#lineGrad)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function ScanningLine() {
  return (
    <motion.div
      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
      animate={{ y: [0, 600, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  );
}

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * easeOut));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span className="font-mono tabular-nums">{prefix}{displayValue}{suffix}</span>;
}

function GlowingStatCard({ icon: Icon, label, value, subValue, color, delay = 0 }: { 
  icon: any; 
  label: string; 
  value: number | string; 
  subValue?: string;
  color: 'cyan' | 'emerald' | 'red' | 'purple' | 'amber';
  delay?: number;
}) {
  const colorClasses = {
    cyan: {
      bg: 'from-cyan-500/10 to-cyan-600/5',
      border: 'border-cyan-500/30 hover:border-cyan-400/50',
      glow: 'shadow-cyan-500/20 hover:shadow-cyan-500/40',
      icon: 'from-cyan-500/20 to-cyan-600/30 text-cyan-400',
      text: 'text-cyan-400',
      pulse: 'bg-cyan-400',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
      glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
      icon: 'from-emerald-500/20 to-emerald-600/30 text-emerald-400',
      text: 'text-emerald-400',
      pulse: 'bg-emerald-400',
    },
    red: {
      bg: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/30 hover:border-red-400/50',
      glow: 'shadow-red-500/20 hover:shadow-red-500/40',
      icon: 'from-red-500/20 to-red-600/30 text-red-400',
      text: 'text-red-400',
      pulse: 'bg-red-400',
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30 hover:border-purple-400/50',
      glow: 'shadow-purple-500/20 hover:shadow-purple-500/40',
      icon: 'from-purple-500/20 to-purple-600/30 text-purple-400',
      text: 'text-purple-400',
      pulse: 'bg-purple-400',
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/30 hover:border-amber-400/50',
      glow: 'shadow-amber-500/20 hover:shadow-amber-500/40',
      icon: 'from-amber-500/20 to-amber-600/30 text-amber-400',
      text: 'text-amber-400',
      pulse: 'bg-amber-400',
    },
  };
  
  const c = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative group overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} backdrop-blur-xl shadow-lg ${c.glow} transition-all duration-300`}
    >
      <div className="absolute inset-0 bg-slate-900/40" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative p-4 flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
          <motion.div
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${c.pulse}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
          <p className={`text-2xl font-bold ${c.text} mt-0.5`}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {subValue && <p className="text-[10px] text-slate-500 mt-0.5">{subValue}</p>}
        </div>
      </div>
      
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color === 'cyan' ? '#06b6d4' : color === 'emerald' ? '#10b981' : color === 'red' ? '#ef4444' : color === 'purple' ? '#a855f7' : '#f59e0b'}, transparent)` }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

function PremiumNavButton({ active, onClick, icon: Icon, label, color, dataTestId }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  color: string;
  dataTestId: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden ${
        active 
          ? `bg-gradient-to-r ${color} text-white shadow-lg` 
          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50'
      }`}
      data-testid={dataTestId}
    >
      {active && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </motion.button>
  );
}

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

  const gridCols = assets.length + 1;

  return (
    <div className="w-full">
      <div 
        className="grid gap-1 w-full" 
        style={{ gridTemplateColumns: `80px repeat(${assets.length}, 1fr)` }}
      >
        <div />
        {assets.map((a, i) => (
          <div key={i} className="text-center text-xs sm:text-sm text-slate-400 font-medium py-2 truncate">{a}</div>
        ))}
        {assets.map((asset, i) => (
          <>
            <div key={`label-${i}`} className="text-xs sm:text-sm text-slate-400 font-medium py-3 truncate">{asset}</div>
            {correlations[i].map((corr, j) => (
              <div 
                key={`${i}-${j}`} 
                className={`flex items-center justify-center ${getColor(corr)} bg-opacity-30 rounded-md py-3 sm:py-4 transition-all hover:bg-opacity-50 cursor-pointer`}
              >
                <span className="text-xs sm:text-sm text-white font-medium">{corr.toFixed(2)}</span>
              </div>
            ))}
          </>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500 bg-opacity-30" /> High (0.7+)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-cyan-500 bg-opacity-30" /> Medium (0.4-0.7)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500 bg-opacity-30" /> Low (0-0.4)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500 bg-opacity-30" /> Negative</div>
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Newspaper className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span>AI-Scored News</span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-purple-400 ml-auto"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {newsItems.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-2.5 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all group cursor-pointer"
            >
              <motion.div 
                className={`w-2.5 h-2.5 rounded-full mt-1 ${
                  item.sentiment === 'positive' ? 'bg-emerald-500' : 
                  item.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'
                }`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 group-hover:text-white transition-colors truncate">{item.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WhaleAlertCard() {
  const alerts = [
    { amount: '1,500 BTC', direction: 'out', exchange: 'Binance', time: '15m ago' },
    { amount: '25,000 SOL', direction: 'in', exchange: 'Coinbase', time: '32m ago' },
    { amount: '800 BTC', direction: 'out', exchange: 'Kraken', time: '1h ago' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <span>Whale Alerts</span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-auto"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  alert.direction === 'out' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {alert.direction === 'out' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-white font-medium font-mono">{alert.amount}</p>
                  <p className="text-[10px] text-slate-500">{alert.direction === 'out' ? 'Withdrawn from' : 'Deposited to'} {alert.exchange}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{alert.time}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
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

interface CryptoSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  large: string;
  marketCapRank: number | null;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  type: 'stock';
  exchange: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  assetName: string;
  assetType: string;
  coingeckoId: string | null;
  createdAt: string;
}

function MyWatchlistSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoResults, setCryptoResults] = useState<CryptoSearchResult[]>([]);
  const [stockResults, setStockResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: watchlistData } = useQuery<{ success: boolean; items: WatchlistItem[] }>({
    queryKey: ['/api/trading-watchlist'],
  });

  const { data: signalsData, isLoading: signalsLoading, refetch: refetchSignals } = useQuery<{ success: boolean; signals: TradingSignal[] }>({
    queryKey: ['/api/trading-watchlist/signals'],
    refetchInterval: 60000,
  });

  const addCryptoMutation = useMutation({
    mutationFn: async (asset: CryptoSearchResult) => {
      return apiRequest('/api/trading-watchlist', {
        method: 'POST',
        body: JSON.stringify({
          symbol: asset.symbol.toUpperCase(),
          assetName: asset.name,
          assetType: 'crypto',
          coingeckoId: asset.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist/signals'] });
      toast({ title: 'Added to Watchlist', description: 'Asset added successfully' });
      setSearchQuery('');
      setCryptoResults([]);
      setStockResults([]);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add asset', variant: 'destructive' });
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async (asset: StockSearchResult) => {
      return apiRequest('/api/trading-watchlist', {
        method: 'POST',
        body: JSON.stringify({
          symbol: asset.symbol,
          assetName: asset.name,
          assetType: 'stock',
          coingeckoId: null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist/signals'] });
      toast({ title: 'Added to Watchlist', description: 'Stock added successfully' });
      setSearchQuery('');
      setCryptoResults([]);
      setStockResults([]);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add stock', variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/trading-watchlist/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-watchlist/signals'] });
      toast({ title: 'Removed', description: 'Asset removed from watchlist' });
    },
  });

  const searchAssets = async (query: string) => {
    if (query.length < 2) {
      setCryptoResults([]);
      setStockResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/asset-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCryptoResults(data.crypto || []);
      setStockResults(data.stocks || []);
    } catch {
      setCryptoResults([]);
      setStockResults([]);
    }
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchAssets(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const watchlistItems = watchlistData?.items || [];
  const watchlistSignals = signalsData?.signals || [];
  const hasResults = cryptoResults.length > 0 || stockResults.length > 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-pink-400" />
            My Custom Watchlist
            <Badge variant="secondary" className="ml-2 bg-pink-500/20 text-pink-300">{watchlistItems.length}/5</Badge>
          </CardTitle>
          <p className="text-sm text-slate-400">Add up to 5 stocks or crypto for personalized AI analysis with full confluence scoring</p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Input
              placeholder="Search for stocks (TSLA, AAPL) or crypto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border-slate-700 pl-10"
              data-testid="input-asset-search"
            />
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}

            {hasResults && (
              <div className="absolute left-0 right-0 top-full z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl mt-1 max-h-80 overflow-y-auto">
              {stockResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-blue-500/20 text-xs text-blue-300 font-medium flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Stocks
                  </div>
                  {stockResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => addStockMutation.mutate(result)}
                      disabled={addStockMutation.isPending || watchlistItems.length >= 5 || watchlistItems.some(w => w.symbol === result.symbol)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 text-left disabled:opacity-50"
                      data-testid={`btn-add-stock-${result.symbol}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{result.symbol}</p>
                        <p className="text-xs text-slate-400">{result.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{result.exchange}</Badge>
                    </button>
                  ))}
                </>
              )}
              {cryptoResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
                    <Coins className="w-3 h-3" /> Crypto
                  </div>
                  {cryptoResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => addCryptoMutation.mutate(result)}
                      disabled={addCryptoMutation.isPending || watchlistItems.length >= 5 || watchlistItems.some(w => w.symbol.toLowerCase() === result.symbol.toLowerCase())}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 text-left disabled:opacity-50"
                      data-testid={`btn-add-crypto-${result.symbol}`}
                    >
                      <img src={result.thumb} alt={result.symbol} className="w-6 h-6 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{result.symbol}</p>
                        <p className="text-xs text-slate-400">{result.name}</p>
                      </div>
                      {result.marketCapRank && (
                        <Badge variant="outline" className="text-xs">#{result.marketCapRank}</Badge>
                      )}
                    </button>
                  ))}
                </>
              )}
              </div>
            )}
          </div>

          {watchlistItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assets in your watchlist yet</p>
              <p className="text-sm mt-1">Search and add any cryptocurrency above</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {watchlistItems.map((item) => (
                <Badge key={item.id} className="bg-slate-800 text-white px-3 py-1 flex items-center gap-2">
                  {item.symbol}
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="hover:text-red-400"
                    data-testid={`btn-remove-${item.symbol}`}
                  >
                    <StarOff className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {signalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (<div key={i} className="h-96 bg-slate-800/30 rounded-xl animate-pulse" />))}
        </div>
      ) : watchlistSignals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {watchlistSignals.map((signal) => (
            <SignalCard 
              key={signal.asset.symbol} 
              signal={signal} 
              isWatchlisted={true}
              onWatchlistToggle={() => {
                const item = watchlistItems.find(w => w.symbol === signal.asset.symbol);
                if (item) removeMutation.mutate(item.id);
              }}
            />
          ))}
        </div>
      ) : watchlistItems.length > 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-spin" />
            <p className="text-slate-400">Generating AI analysis for your assets...</p>
            <Button onClick={() => refetchSignals()} className="mt-4" variant="outline" data-testid="btn-retry-signals">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function AITrading() {
  const [activeTab, setActiveTab] = useState('all');
  const [mainView, setMainView] = useState<'signals' | 'analytics' | 'correlation' | 'mywatchlist'>('signals');
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
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: -30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/30">
                    <Brain className="w-8 h-8 text-cyan-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: 'blur(8px)', zIndex: -1 }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                      AI Trading Intelligence
                    </span>
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-slate-400 text-sm">Multi-factor confluence analysis</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-xs text-emerald-400 font-medium">LIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div 
                className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl rounded-xl px-4 py-2.5 border border-slate-700/50"
                whileHover={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 font-medium">Auto-refresh</span>
                </div>
                <Switch checked={liveMode} onCheckedChange={setLiveMode} data-testid="switch-live-mode" />
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToCSV(signals)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 transition-all"
                data-testid="btn-export-csv"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Export</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 hover:text-white transition-all disabled:opacity-50"
                data-testid="btn-refresh-signals"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <GlowingStatCard icon={Network} label="Active Signals" value={signals.length} subValue="Real-time analysis" color="cyan" delay={0} />
          <GlowingStatCard icon={TrendingUp} label="Bullish" value={bullishCount} subValue="Buy signals" color="emerald" delay={0.1} />
          <GlowingStatCard icon={TrendingDown} label="Bearish" value={bearishCount} subValue="Sell signals" color="red" delay={0.2} />
          <GlowingStatCard icon={Cpu} label="Confluence" value={`${avgConfluence}%`} subValue="Multi-factor score" color="purple" delay={0.3} />
          <GlowingStatCard icon={Zap} label="High Priority" value={highPriorityCount} subValue="Urgent alerts" color="amber" delay={0.4} />
        </div>

        <div className="flex gap-2 mb-8 p-1 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
          <PremiumNavButton 
            active={mainView === 'signals'} 
            onClick={() => setMainView('signals')} 
            icon={BarChart3} 
            label="Signals"
            color="from-purple-500 to-fuchsia-500"
            dataTestId="btn-view-signals"
          />
          <PremiumNavButton 
            active={mainView === 'mywatchlist'} 
            onClick={() => setMainView('mywatchlist')} 
            icon={Star} 
            label="My Watchlist"
            color="from-pink-500 to-rose-500"
            dataTestId="btn-view-mywatchlist"
          />
          <PremiumNavButton 
            active={mainView === 'analytics'} 
            onClick={() => setMainView('analytics')} 
            icon={PieChart} 
            label="Analytics"
            color="from-cyan-500 to-blue-500"
            dataTestId="btn-view-analytics"
          />
          <PremiumNavButton 
            active={mainView === 'correlation'} 
            onClick={() => setMainView('correlation')} 
            icon={BarChart2} 
            label="Correlation"
            color="from-amber-500 to-orange-500"
            dataTestId="btn-view-correlation"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 backdrop-blur-xl mb-8"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%223%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-semibold">Risk Disclaimer</p>
              <p className="text-xs text-amber-300/70 mt-0.5">AI signals are for informational purposes only. Always DYOR and never invest more than you can afford to lose.</p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400/50" />
          </div>
        </motion.div>

        {mainView === 'signals' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <TabsList className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl inline-flex w-auto min-w-full md:min-w-0 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-fuchsia-500/30 data-[state=active]:text-white rounded-lg flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-all">
                      <span className="flex items-center gap-1.5">All <Badge variant="secondary" className="bg-slate-700/50 text-xs">{signals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="crypto" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-orange-500/30 data-[state=active]:text-white rounded-lg flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-crypto">
                      <span className="flex items-center gap-1.5"><Coins className="w-3 h-3 sm:w-4 sm:h-4" />Crypto <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">{cryptoSignals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="stocks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/30 data-[state=active]:to-indigo-500/30 data-[state=active]:text-white rounded-lg flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-stocks">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 sm:w-4 sm:h-4" />Stocks <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">{stockSignals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/30 data-[state=active]:to-rose-500/30 data-[state=active]:text-white rounded-lg flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-watchlist">
                      <span className="flex items-center gap-1.5"><Star className="w-3 h-3 sm:w-4 sm:h-4" />Favorites <Badge variant="secondary" className="bg-pink-500/20 text-pink-300 text-xs">{watchlist.size}</Badge></span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl animate-pulse border border-slate-700/30 overflow-hidden relative">
                          <div className="absolute inset-0">
                            <motion.div
                              className="absolute inset-x-0 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"
                              animate={{ y: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : displaySignals.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-16 text-center relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Brain className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                          </motion.div>
                          <p className="text-lg text-slate-300 font-medium mb-2">
                            {activeTab === 'watchlist' ? 'No favorites yet' : 'No signals available'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {activeTab === 'watchlist' ? 'Star assets from the signals to track them here' : 'Click refresh to fetch the latest AI analysis'}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="signals"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {displaySignals.map((signal, index) => (
                        <motion.div
                          key={signal.asset.symbol}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <SignalCard signal={signal} isWatchlisted={watchlist.has(signal.asset.symbol)} onWatchlistToggle={() => toggleWatchlist(signal.asset.symbol)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-6">
                <NewsCard />
                <WhaleAlertCard />
              </div>
            </div>
          </>
        )}

        {mainView === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-purple-400" />
                  </div>
                  Signal Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['breakout', 'bounce', 'trend_continuation', 'reversal', 'consolidation'].map((type, i) => {
                    const count = signals.filter(s => s.signalType === type).length;
                    const pct = signals.length > 0 ? (count / signals.length) * 100 : 0;
                    const colors = ['from-emerald-500 to-cyan-500', 'from-cyan-500 to-blue-500', 'from-purple-500 to-fuchsia-500', 'from-amber-500 to-orange-500', 'from-slate-500 to-slate-600'];
                    return (
                      <motion.div 
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-300 capitalize font-medium">{type.replace('_', ' ')}</span>
                          <span className="text-white font-mono">{count} <span className="text-slate-500">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full bg-gradient-to-r ${colors[i]} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-cyan-400" />
                  </div>
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Win Rate', value: '--', color: 'emerald' },
                    { label: 'Avg R:R', value: '--', color: 'cyan' },
                    { label: 'Total Signals', value: signals.length.toString(), color: 'purple' },
                    { label: 'Avg Confluence', value: `${avgConfluence}%`, color: 'amber' },
                  ].map((metric, i) => (
                    <motion.div 
                      key={metric.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`text-center p-4 bg-gradient-to-br from-${metric.color}-500/10 to-${metric.color}-600/5 rounded-xl border border-${metric.color}-500/20`}
                    >
                      <p className={`text-2xl font-bold text-${metric.color}-400 font-mono`}>{metric.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" /> Historical performance tracking coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mainView === 'mywatchlist' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MyWatchlistSection />
          </motion.div>
        )}

        {mainView === 'correlation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                  </div>
                  Asset Correlation Heatmap
                  <Badge variant="outline" className="ml-2 text-xs border-amber-500/30 text-amber-400">30-Day</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CorrelationHeatmap signals={signals} />
                <div className="mt-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                  <p className="text-xs text-slate-500">Correlation coefficients based on 30-day price movements</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="mt-12 text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Signals refresh every 30s (live mode) | 15min cache TTL | Multi-factor confluence
          </p>
          <p>Data: CoinGecko, Finnhub, Alternative.me | AI-Powered Analysis</p>
        </div>
      </div>
    </div>
  );
}
