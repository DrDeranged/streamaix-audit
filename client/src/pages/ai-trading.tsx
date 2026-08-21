import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, ColorType, LineSeries, AreaSeries, Time } from 'lightweight-charts';
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
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { ReasoningFeed } from '@/components/prediction/ReasoningFeed';
import { SignalsWidget } from '@/components/signals/SignalsWidget';
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
      <div className="absolute inset-0 bg-ink-page" />
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(6,182,212,0.03) 2px, transparent 2px)', backgroundSize: '50px 50px' }} />
      
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent-core/30"
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
      className="absolute inset-x-0 h-[2px] bg-accent-core/30"
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

function GlowingStatCard({ icon: Icon, label, value, subValue, color, delay = 0, isLoading = false }: { 
  icon: any; 
  label: string; 
  value: number | string; 
  subValue?: string;
  color: 'cyan' | 'emerald' | 'red' | 'purple' | 'amber';
  delay?: number;
  isLoading?: boolean;
}) {
  const colorClasses = {
    cyan: {
      bg: ' ',
      border: 'border-accent-core/30 hover:border-accent-core/50',
      glow: 'shadow-accent-core/20 hover:shadow-accent-core/40',
      icon: '  text-accent-bright',
      text: 'text-accent-bright',
      pulse: 'bg-accent-core',
    },
    emerald: {
      bg: ' ',
      border: 'border-gain/30 hover:border-gain/50',
      glow: 'shadow-gain/20 hover:shadow-gain/40',
      icon: '  text-gain',
      text: 'text-gain',
      pulse: 'bg-gain',
    },
    red: {
      bg: ' ',
      border: 'border-loss/30 hover:border-loss/50',
      glow: 'shadow-loss/20 hover:shadow-loss/40',
      icon: '  text-loss',
      text: 'text-loss',
      pulse: 'bg-loss',
    },
    purple: {
      bg: ' ',
      border: 'border-accent-core/30 hover:border-accent-core/50',
      glow: 'shadow-accent-core/20 hover:shadow-accent-core/40',
      icon: '  text-accent-bright',
      text: 'text-accent-bright',
      pulse: 'bg-accent-bright',
    },
    amber: {
      bg: ' ',
      border: 'border-warn/30 hover:border-warn/50',
      glow: 'shadow-warn/20 hover:shadow-warn/40',
      icon: '  text-warn',
      text: 'text-warn',
      pulse: 'bg-warn',
    },
  };
  
  const c = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative group overflow-hidden rounded-xl border border-ink-edge bg-ink-surface transition-all duration-300"
    >
      <div className="absolute inset-0 bg-ink-page/40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-ink-edge" />
      
      <div className="relative p-4 flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-xl bg-ink-raised flex items-center justify-center text-accent-bright">
          <Icon className="w-6 h-6" />
          <motion.div
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${c.pulse}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-bold text-primary tabular mt-0.5">
            {isLoading
              ? <span className="text-muted animate-pulse">—</span>
              : typeof value === 'number'
                ? <AnimatedCounter value={value} />
                : value}
          </p>
          {subValue && <p className="text-[10px] text-muted mt-0.5">{subValue}</p>}
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
          ? 'bg-accent-core text-primary glow-accent' 
          : 'bg-ink-raised text-secondary hover:text-primary border border-ink-edge'
      }`}
      data-testid={dataTestId}
    >
      {active && (
        <motion.div
          className="absolute inset-0 bg-accent-bright/10"
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
    if (value >= 80) return 'text-gain';
    if (value >= 70) return 'text-accent-bright';
    if (value >= 60) return 'text-warn';
    return 'text-loss';
  };

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted" />
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
    if (signal === 'oversold') return 'bg-gain';
    if (signal === 'overbought') return 'bg-loss';
    return 'bg-accent-core';
  };
  
  const position = (value / 100) * 100;
  
  return (
    <div className="relative h-6     rounded-full overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] text-secondary">
        <span>30</span><span>50</span><span>70</span>
      </div>
      <motion.div className={`absolute top-1 w-4 h-4 ${getColor()} rounded-full shadow-lg`} style={{ left: `calc(${position}% - 8px)` }} initial={{ scale: 0 }} animate={{ scale: 1 }} />
    </div>
  );
}

function FearGreedMeter({ value, classification }: { value: number; classification: string }) {
  const getColor = () => {
    if (value < 25) return ' ';
    if (value < 45) return ' ';
    if (value < 55) return ' ';
    if (value < 75) return ' ';
    return ' ';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-secondary">Fear & Greed</span>
        <span className={`text-xs font-bold ${value < 45 ? 'text-loss' : value > 55 ? 'text-gain' : 'text-warn'}`}>{classification}</span>
      </div>
      <div className="relative h-3 bg-ink-raised rounded-full overflow-hidden">
        <div className={`h-full  ${getColor()} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary drop-shadow-md">{value}</span>
        </div>
      </div>
    </div>
  );
}

function ConfluenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-secondary">{label}</span>
        <span className={`font-medium ${value > 60 ? 'text-gain' : value < 40 ? 'text-loss' : 'text-warn'}`}>{value}%</span>
      </div>
      <div className="h-2 bg-ink-raised rounded-full overflow-hidden">
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
    if (val >= 0.7) return 'bg-gain';
    if (val >= 0.4) return 'bg-accent-core';
    if (val >= 0) return 'bg-warn';
    return 'bg-loss';
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
          <div key={i} className="text-center text-xs sm:text-sm text-secondary font-medium py-2 truncate">{a}</div>
        ))}
        {assets.map((asset, i) => (
          <>
            <div key={`label-${i}`} className="text-xs sm:text-sm text-secondary font-medium py-3 truncate">{asset}</div>
            {correlations[i].map((corr, j) => (
              <div 
                key={`${i}-${j}`} 
                className={`flex items-center justify-center ${getColor(corr)} bg-opacity-30 rounded-xl py-3 sm:py-4 transition-all hover:bg-opacity-50 cursor-pointer`}
              >
                <span className="text-xs sm:text-sm text-primary font-medium">{corr.toFixed(2)}</span>
              </div>
            ))}
          </>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-secondary">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gain bg-opacity-30" /> High (0.7+)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-accent-core bg-opacity-30" /> Medium (0.4-0.7)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-warn bg-opacity-30" /> Low (0-0.4)</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-loss bg-opacity-30" /> Negative</div>
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
    <DialogContent className="bg-ink-page border-ink-edge">
      <DialogHeader>
        <DialogTitle className="text-primary flex items-center gap-2">
          <BellPlus className="w-5 h-5 text-warn" />
          Set Price Alert - {signal.asset.symbol}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">${signal.currentPrice.toFixed(2)}</p>
          <p className="text-xs text-secondary">Current Price</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant={condition === 'above' ? 'default' : 'outline'} 
            className={condition === 'above' ? 'bg-gain' : ''}
            onClick={() => setCondition('above')}
          >
            <ArrowUpRight className="w-4 h-4 mr-1" /> Above
          </Button>
          <Button 
            variant={condition === 'below' ? 'default' : 'outline'} 
            className={condition === 'below' ? 'bg-loss' : ''}
            onClick={() => setCondition('below')}
          >
            <ArrowDownRight className="w-4 h-4 mr-1" /> Below
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-secondary">Alert Price</Label>
          <Input 
            type="number" 
            value={alertPrice} 
            onChange={(e) => setAlertPrice(Number(e.target.value))}
            className="bg-ink-raised border-ink-edge"
          />
        </div>

        <Button className="w-full bg-warn hover:bg-warn" onClick={createAlert}>
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
      <Surface className="overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px]    " />
        <div className="pb-2">
          <SectionTitle as="h3" className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent-core/20 flex items-center justify-center">
              <Newspaper className="w-3.5 h-3.5 text-accent-bright" />
            </div>
            <span>AI-Scored News</span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-bright ml-auto"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </SectionTitle>
        </div>
        <div className="space-y-2">
          {newsItems.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-2.5 bg-ink-raised/60 rounded-xl border border-ink-edge hover:border-ink-edge transition-all group cursor-pointer"
            >
              <motion.div 
                className={`w-2.5 h-2.5 rounded-full mt-1 ${
                  item.sentiment === 'positive' ? 'bg-gain' : 
                  item.sentiment === 'negative' ? 'bg-loss' : 'bg-ink-raised'
                }`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-body group-hover:text-primary transition-colors truncate">{item.title}</p>
                <p className="text-[10px] text-muted mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Surface>
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
      <Surface className="overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px]    " />
        <div className="pb-2">
          <SectionTitle as="h3" className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-warn/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-warn" />
            </div>
            <span>Whale Alerts</span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-warn ml-auto"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </SectionTitle>
        </div>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-2.5 bg-ink-raised/60 rounded-xl border border-ink-edge hover:border-ink-edge transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  alert.direction === 'out' ? 'bg-gain/20' : 'bg-loss/20'
                }`}>
                  {alert.direction === 'out' ? (
                    <ArrowUpRight className="w-4 h-4 text-gain" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-loss" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-primary font-medium font-mono">{alert.amount}</p>
                  <p className="text-[10px] text-muted">{alert.direction === 'out' ? 'Withdrawn from' : 'Deposited to'} {alert.exchange}</p>
                </div>
              </div>
              <span className="text-[10px] text-secondary font-mono">{alert.time}</span>
            </motion.div>
          ))}
        </div>
      </Surface>
    </motion.div>
  );
}

function SignalCard({ signal, onWatchlistToggle, isWatchlisted }: { signal: TradingSignal; onWatchlistToggle: () => void; isWatchlisted: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const getDirectionIcon = () => {
    if (signal.direction === 'bullish') return <ArrowUpRight className="w-5 h-5 text-gain" />;
    if (signal.direction === 'bearish') return <ArrowDownRight className="w-5 h-5 text-loss" />;
    return <Minus className="w-5 h-5 text-secondary" />;
  };

  const getDirectionColor = () => {
    if (signal.direction === 'bullish') return '  border-gain/30';
    if (signal.direction === 'bearish') return '  border-loss/30';
    return '  border-ink-edge';
  };

  const getSignalTypeBadge = () => {
    const colors: Record<string, string> = {
      'breakout': 'bg-gain/20 text-gain border-gain/30',
      'bounce': 'bg-accent-core/20 text-accent-bright border-accent-core/30',
      'flush': 'bg-loss/20 text-loss border-loss/30',
      'consolidation': 'bg-ink-raised text-secondary border-ink-edge',
      'trend_continuation': 'bg-accent-core/20 text-accent-bright border-accent-core/30',
      'reversal': 'bg-warn/20 text-warn border-warn/30',
      'accumulation': 'bg-accent-core/20 text-accent-bright border-accent-core/30',
      'distribution': 'bg-warn/20 text-warn border-warn/30',
    };
    return colors[signal.signalType] || colors['consolidation'];
  };

  const getPriorityBadge = () => {
    const colors: Record<string, string> = {
      'high': 'bg-loss/20 text-loss border-loss/30',
      'medium': 'bg-warn/20 text-warn border-warn/30',
      'low': 'bg-ink-raised text-secondary border-ink-edge',
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
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-xl border  ${getDirectionColor()} backdrop-blur-xl`}>
      <div className="absolute inset-0 bg-ink-page/60" />
      
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${signal.asset.type === 'crypto' ? '  ' : '  '}`}>
              {signal.asset.type === 'crypto' ? <Coins className="w-6 h-6 text-warn" /> : <Building2 className="w-6 h-6 text-accent-bright" />}
            </div>
            <div>
              <h3 className="font-bold text-primary text-lg flex items-center gap-2">
                {signal.asset.symbol}
                {getDirectionIcon()}
                <Badge className={`${getPriorityBadge()} text-[10px] ml-1`}>{signal.alertPriority.toUpperCase()}</Badge>
              </h3>
              <p className="text-sm text-secondary">{signal.asset.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onWatchlistToggle} className="h-8 w-8 p-0" data-testid={`btn-watchlist-${signal.asset.symbol}`}>
              {isWatchlisted ? <Star className="w-4 h-4 text-warn fill-warn" /> : <StarOff className="w-4 h-4 text-secondary" />}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`btn-alert-${signal.asset.symbol}`}>
                  <BellPlus className="w-4 h-4 text-secondary" />
                </Button>
              </DialogTrigger>
              <PriceAlertDialog signal={signal} />
            </Dialog>
            <ConfidenceRing value={signal.confidence} size={48} />
          </div>
        </div>

        <MiniChart symbol={signal.asset.symbol} currentPrice={signal.currentPrice} priceChange24h={signal.priceChange24h} />

        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="bg-ink-raised rounded-xl p-2 text-center">
            <p className="text-[10px] text-secondary mb-0.5">Price</p>
            <p className="text-base font-bold text-primary">{formatPrice(signal.currentPrice)}</p>
            <p className={`text-[10px] font-medium ${signal.priceChange24h >= 0 ? 'text-gain' : 'text-loss'}`}>
              {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
            </p>
          </div>
          <div className="bg-ink-raised rounded-xl p-2 text-center">
            <p className="text-[10px] text-secondary mb-0.5">7D</p>
            <p className={`text-base font-bold ${(signal.priceChange7d || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
              {(signal.priceChange7d || 0) >= 0 ? '+' : ''}{(signal.priceChange7d || 0).toFixed(2)}%
            </p>
          </div>
          <div className="bg-ink-raised rounded-xl p-2 text-center">
            <p className="text-[10px] text-secondary mb-0.5">Volume</p>
            <p className="text-base font-bold text-primary">{formatLargeNumber(signal.volume24h || 0)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`${getSignalTypeBadge()} text-xs`}>{signal.signalType.replace('_', ' ').toUpperCase()}</Badge>
          <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-xs">{signal.marketRegime?.type?.replace('_', ' ').toUpperCase() || 'RANGING'}</Badge>
          <Badge className="bg-ink-raised text-body border-ink-edge text-xs">{signal.timeframe}</Badge>
        </div>

        <div className="bg-ink-raised/60 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-body flex items-center gap-1"><Signal className="w-3 h-3" /> Confluence</span>
            <span className={`text-lg font-bold ${signal.confluence?.overall > 60 ? 'text-gain' : signal.confluence?.overall < 40 ? 'text-loss' : 'text-warn'}`}>{signal.confluence?.overall || 50}/100</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ConfluenceBar label="Tech" value={signal.confluence?.technical || 50} color="bg-accent-core" />
            <ConfluenceBar label="Chain" value={signal.confluence?.onChain || 50} color="bg-accent-core" />
            <ConfluenceBar label="Sent" value={signal.confluence?.sentiment || 50} color="bg-warn" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gain/10 border border-gain/20 rounded-xl p-2 text-center">
            <p className="text-[10px] text-gain uppercase font-medium">Entry</p>
            <p className="text-xs font-bold text-primary">{formatPrice(signal.entry.low)}</p>
          </div>
          <div className="bg-loss/10 border border-loss/20 rounded-xl p-2 text-center">
            <p className="text-[10px] text-loss uppercase font-medium">Stop</p>
            <p className="text-xs font-bold text-primary">{formatPrice(signal.stopLoss)}</p>
          </div>
          <div className="bg-accent-core/10 border border-accent-core/20 rounded-xl p-2 text-center">
            <p className="text-[10px] text-accent-bright uppercase font-medium">R:R</p>
            <p className="text-xs font-bold text-primary">{signal.riskReward}</p>
          </div>
        </div>

        <Button variant="ghost" className="w-full text-secondary hover:text-primary hover:bg-ink-raised" onClick={() => setExpanded(!expanded)} data-testid={`btn-expand-${signal.asset.symbol}`}>
          {expanded ? 'Hide Details' : 'Show Details'}
          {expanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 space-y-4 border-t border-ink-edge mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-ink-raised border border-ink-edge w-full grid grid-cols-4">
                    <TabsTrigger value="overview" className="text-[10px] data-[state=active]:bg-accent-core/20">AI</TabsTrigger>
                    <TabsTrigger value="technical" className="text-[10px] data-[state=active]:bg-accent-core/30">Tech</TabsTrigger>
                    <TabsTrigger value="onchain" className="text-[10px] data-[state=active]:bg-gain/30">Chain</TabsTrigger>
                    <TabsTrigger value="sentiment" className="text-[10px] data-[state=active]:bg-warn/30">Sent</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-secondary uppercase font-medium mb-2 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Analysis</p>
                      <p className="text-sm text-body bg-ink-raised/60 rounded-xl p-3">{signal.reasoning}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary uppercase font-medium mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Targets</p>
                      <div className="space-y-2">
                        {signal.targets.map((target, i) => (
                          <div key={i} className="flex items-center justify-between bg-ink-raised/60 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-accent-bright font-medium">{target.label}</span>
                              <span className="text-[10px] text-muted">({target.probability}%)</span>
                            </div>
                            <span className="text-sm font-bold text-primary">{formatPrice(target.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="mt-3 space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-secondary flex items-center gap-1"><Gauge className="w-3 h-3" /> RSI</span>
                        <Badge className={`text-[10px] ${ti?.rsiSignal === 'oversold' ? 'bg-gain/20 text-gain' : ti?.rsiSignal === 'overbought' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                          {ti?.rsiSignal?.toUpperCase()} ({ti?.rsi?.toFixed(1)})
                        </Badge>
                      </div>
                      <RSIGauge value={ti?.rsi || 50} signal={ti?.rsiSignal || 'neutral'} />
                    </div>
                    <div className="bg-ink-raised/60 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-secondary">MACD</span>
                        <Badge className={`text-[10px] ${ti?.macd?.trend === 'bullish' ? 'bg-gain/20 text-gain' : ti?.macd?.trend === 'bearish' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                          {ti?.macd?.trend?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div><p className="text-muted">Value</p><p className="text-primary">{ti?.macd?.value?.toFixed(3)}</p></div>
                        <div><p className="text-muted">Signal</p><p className="text-primary">{ti?.macd?.signal?.toFixed(3)}</p></div>
                        <div><p className="text-muted">Hist</p><p className={`${(ti?.macd?.histogram || 0) > 0 ? 'text-gain' : 'text-loss'}`}>{ti?.macd?.histogram?.toFixed(3)}</p></div>
                      </div>
                    </div>
                    <div className="bg-ink-raised/60 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-secondary">Moving Averages</span>
                        {ti?.movingAverages?.goldenCross && <Badge className="bg-gain/20 text-gain text-[9px]">GOLDEN CROSS</Badge>}
                        {ti?.movingAverages?.deathCross && <Badge className="bg-loss/20 text-loss text-[9px]">DEATH CROSS</Badge>}
                      </div>
                      <div className="space-y-1">
                        {[{ label: 'SMA 20', value: ti?.movingAverages?.sma20, pos: ti?.movingAverages?.priceVsSma20 },
                          { label: 'SMA 50', value: ti?.movingAverages?.sma50, pos: ti?.movingAverages?.priceVsSma50 },
                          { label: 'SMA 200', value: ti?.movingAverages?.sma200, pos: ti?.movingAverages?.priceVsSma200 }
                        ].map((ma, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px]">
                            <span className="text-muted">{ma.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-primary">{formatPrice(ma.value || 0)}</span>
                              <Badge className={`text-[8px] ${ma.pos === 'above' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}>{ma.pos?.toUpperCase()}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="onchain" className="mt-3 space-y-3">
                    {signal.asset.type === 'stock' ? (
                      <div className="text-center py-8 text-muted">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">On-chain data N/A for stocks</p>
                      </div>
                    ) : onChain ? (
                      <>
                        <div className="bg-ink-raised/60 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-secondary flex items-center gap-1"><Flame className="w-3 h-3" /> Whales</span>
                            <Badge className={`text-[10px] ${onChain.whaleActivity.signal === 'accumulating' ? 'bg-gain/20 text-gain' : onChain.whaleActivity.signal === 'distributing' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                              {onChain.whaleActivity.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div><p className="text-[10px] text-muted">Net Flow</p><p className={`font-medium ${onChain.whaleActivity.netFlow24h > 0 ? 'text-gain' : 'text-loss'}`}>{formatLargeNumber(Math.abs(onChain.whaleActivity.netFlow24h))}</p></div>
                            <div><p className="text-[10px] text-muted">Large Txs</p><p className="text-primary font-medium">{onChain.whaleActivity.largeTransactions}</p></div>
                          </div>
                        </div>
                        <div className="bg-ink-raised/60 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-secondary">Exchange Flow</span>
                            <Badge className={`text-[10px] ${onChain.exchangeFlows.signal === 'bullish' ? 'bg-gain/20 text-gain' : onChain.exchangeFlows.signal === 'bearish' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                              {onChain.exchangeFlows.signal.toUpperCase()}
                            </Badge>
                          </div>
                          <p className={`text-lg font-bold text-center ${onChain.exchangeFlows.netFlow24h < 0 ? 'text-gain' : 'text-loss'}`}>
                            {onChain.exchangeFlows.netFlow24h < 0 ? 'Net Outflow' : 'Net Inflow'}
                          </p>
                        </div>
                        <div className="bg-ink-raised/60 rounded-xl p-3 text-center">
                          <span className="text-xs text-secondary">Funding Rate</span>
                          <p className={`text-xl font-bold ${onChain.fundingRate.current > 0 ? 'text-gain' : 'text-loss'}`}>
                            {(onChain.fundingRate.current * 100).toFixed(4)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted"><Activity className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Loading...</p></div>
                    )}
                  </TabsContent>

                  <TabsContent value="sentiment" className="mt-3 space-y-3">
                    <div className="bg-ink-raised/60 rounded-xl p-3">
                      <FearGreedMeter value={sentiment?.fearGreedIndex?.value || 50} classification={sentiment?.fearGreedIndex?.classification || 'Neutral'} />
                    </div>
                    <div className="bg-ink-raised/60 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-secondary">Social</span>
                        <Badge className={`text-[10px] ${sentiment?.socialSentiment?.trend === 'rising' ? 'bg-gain/20 text-gain' : sentiment?.socialSentiment?.trend === 'falling' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                          {sentiment?.socialSentiment?.trend?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className={`text-xl font-bold ${(sentiment?.socialSentiment?.score || 50) > 60 ? 'text-gain' : (sentiment?.socialSentiment?.score || 50) < 40 ? 'text-loss' : 'text-warn'}`}>
                            {sentiment?.socialSentiment?.score?.toFixed(0) || 50}
                          </p>
                          <p className="text-[10px] text-muted">Score</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-primary">{(sentiment?.socialSentiment?.mentions24h || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted">Mentions</p>
                        </div>
                      </div>
                    </div>
                    {signal.confluence?.factors && (
                      <div className="bg-ink-raised/60 rounded-xl p-3">
                        <p className="text-xs text-secondary mb-2">Confluence Factors</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.confluence.factors.slice(0, 6).map((f, i) => (
                            <Badge key={i} className={`text-[9px] ${f.impact === 'bullish' ? 'bg-gain/20 text-gain' : f.impact === 'bearish' ? 'bg-loss/20 text-loss' : 'bg-ink-raised text-secondary'}`}>
                              {f.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                </Tabs>

                <p className="text-[10px] text-muted text-center">{new Date(signal.generatedAt).toLocaleString()}</p>
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
  const watchlistIsDefault = (signalsData as any)?.isDefault === true;
  const hasResults = cryptoResults.length > 0 || stockResults.length > 0;

  return (
    <div className="space-y-6">
      <Surface className="overflow-hidden">
        <div className="pb-3">
          <SectionTitle as="h3" className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-bright" />
            My Custom Watchlist
            <Badge variant="secondary" className="ml-2 bg-accent-core/20 text-accent-bright">{watchlistItems.length}/5</Badge>
          </SectionTitle>
          <p className="text-sm text-secondary">Add up to 5 stocks or crypto for personalized AI analysis with full confluence scoring</p>
        </div>
        <div>
          <div className="relative mb-4">
            <Input
              placeholder="Search for stocks (TSLA, AAPL) or crypto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-ink-page/50 border-ink-edge pl-10"
              data-testid="input-asset-search"
            />
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary animate-spin" />}

            {hasResults && (
              <div className="absolute left-0 right-0 top-full z-50 bg-ink-page border border-ink-edge rounded-xl shadow-xl mt-1 max-h-80 overflow-y-auto">
              {stockResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-accent-core/20 text-xs text-accent-bright font-medium flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Stocks
                  </div>
                  {stockResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => addStockMutation.mutate(result)}
                      disabled={addStockMutation.isPending || watchlistItems.length >= 5 || watchlistItems.some(w => w.symbol === result.symbol)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-ink-raised text-left disabled:opacity-50"
                      data-testid={`btn-add-stock-${result.symbol}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-accent-core/20 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-accent-bright" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{result.symbol}</p>
                        <p className="text-xs text-secondary">{result.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{result.exchange}</Badge>
                    </button>
                  ))}
                </>
              )}
              {cryptoResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-warn/20 text-xs text-warn font-medium flex items-center gap-2">
                    <Coins className="w-3 h-3" /> Crypto
                  </div>
                  {cryptoResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => addCryptoMutation.mutate(result)}
                      disabled={addCryptoMutation.isPending || watchlistItems.length >= 5 || watchlistItems.some(w => w.symbol.toLowerCase() === result.symbol.toLowerCase())}
                      className="w-full flex items-center gap-3 p-3 hover:bg-ink-raised text-left disabled:opacity-50"
                      data-testid={`btn-add-crypto-${result.symbol}`}
                    >
                      <img src={result.thumb} alt={result.symbol} className="w-6 h-6 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{result.symbol}</p>
                        <p className="text-xs text-secondary">{result.name}</p>
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
            <div className="text-center py-8 text-secondary">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assets in your watchlist yet</p>
              <p className="text-sm mt-1">Search and add any cryptocurrency above</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {watchlistItems.map((item) => (
                <Badge key={item.id} className="bg-ink-raised text-primary px-3 py-1 flex items-center gap-2">
                  {item.symbol}
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="hover:text-loss"
                    data-testid={`btn-remove-${item.symbol}`}
                  >
                    <StarOff className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Surface>

      {signalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (<div key={i} className="h-96 bg-ink-raised/60 rounded-xl animate-pulse" />))}
        </div>
      ) : watchlistSignals.length > 0 ? (
        <div className="space-y-4">
          {watchlistIsDefault && (
            <div
              className="flex items-start gap-3 rounded-xl border border-accent-core/30 bg-accent-core/10 px-4 py-3"
              data-testid="banner-starter-watchlist"
            >
              <Sparkles className="w-4 h-4 text-accent-bright mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent-bright">Starter watchlist</p>
                <p className="text-xs text-secondary mt-0.5">
                  These are our top-picked assets. Search and add your own to replace them.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchlistSignals.map((signal) => (
              <SignalCard 
                key={signal.asset.symbol} 
                signal={signal} 
                isWatchlisted={!watchlistIsDefault}
                onWatchlistToggle={() => {
                  const item = watchlistItems.find(w => w.symbol === signal.asset.symbol);
                  if (item) removeMutation.mutate(item.id);
                }}
              />
            ))}
          </div>
        </div>
      ) : watchlistItems.length > 0 ? (
        <Surface>
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-muted mx-auto mb-3 animate-spin" />
            <p className="text-secondary">Generating AI analysis for your assets...</p>
            <Button onClick={() => refetchSignals()} className="mt-4" variant="outline" data-testid="btn-retry-signals">
              Retry
            </Button>
          </div>
        </Surface>
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
  
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery<{ success: boolean; signals: TradingSignal[] }>({
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
    <div className="min-h-[100dvh] bg-ink-page relative overflow-hidden">
      <NeuralBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow={
              <span className="inline-flex items-center gap-2">
                Multi-factor confluence
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gain/30 bg-gain/15 px-2 py-0.5 text-gain">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" /> LIVE
                </span>
              </span>
            }
            title="AI Trading Intelligence"
            subtitle="Real-time signals, confluence scoring, and actionable AI-driven trade ideas."
            icon={<Brain className="h-5 w-5" />}
            actions={
              <>
                <div className="flex items-center gap-2 rounded-xl border border-ink-edge bg-ink-raised px-3 py-2">
                  <Radio className="w-4 h-4 text-accent-bright" />
                  <span className="text-xs text-secondary font-medium">Auto</span>
                  <Switch checked={liveMode} onCheckedChange={setLiveMode} data-testid="switch-live-mode" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(signals)}
                  data-testid="btn-export-csv"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="   border border-accent-core/30 text-accent-bright hover:text-primary"
                  data-testid="btn-refresh-signals"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </>
            }
          />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <GlowingStatCard icon={Network} label="Active Signals" value={signals.length} subValue="Real-time analysis" color="cyan" delay={0} isLoading={isLoading} />
          <GlowingStatCard icon={TrendingUp} label="Bullish" value={bullishCount} subValue="Buy signals" color="emerald" delay={0.1} isLoading={isLoading} />
          <GlowingStatCard icon={TrendingDown} label="Bearish" value={bearishCount} subValue="Sell signals" color="red" delay={0.2} isLoading={isLoading} />
          <GlowingStatCard icon={Cpu} label="Confluence" value={`${avgConfluence}%`} subValue="Multi-factor score" color="purple" delay={0.3} isLoading={isLoading} />
          <GlowingStatCard icon={Zap} label="High Priority" value={highPriorityCount} subValue="Urgent alerts" color="amber" delay={0.4} isLoading={isLoading} />
        </div>

        <div className="flex gap-2 mb-8 p-1 bg-ink-raised/60 backdrop-blur-xl rounded-xl border border-ink-edge">
          <PremiumNavButton 
            active={mainView === 'signals'} 
            onClick={() => setMainView('signals')} 
            icon={BarChart3} 
            label="Signals"
            color=" "
            dataTestId="btn-view-signals"
          />
          <PremiumNavButton 
            active={mainView === 'mywatchlist'} 
            onClick={() => setMainView('mywatchlist')} 
            icon={Star} 
            label="My Watchlist"
            color=" "
            dataTestId="btn-view-mywatchlist"
          />
          <PremiumNavButton 
            active={mainView === 'analytics'} 
            onClick={() => setMainView('analytics')} 
            icon={PieChart} 
            label="Analytics"
            color=" "
            dataTestId="btn-view-analytics"
          />
          <PremiumNavButton 
            active={mainView === 'correlation'} 
            onClick={() => setMainView('correlation')} 
            icon={BarChart2} 
            label="Correlation"
            color=" "
            dataTestId="btn-view-correlation"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-xl border border-warn/20     backdrop-blur-xl mb-8"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%223%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-warn/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warn" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-warn font-semibold">Risk Disclaimer</p>
              <p className="text-xs text-warn/70 mt-0.5">AI signals are for informational purposes only. Always DYOR and never invest more than you can afford to lose.</p>
            </div>
            <Sparkles className="w-5 h-5 text-warn/50" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <ReasoningFeed />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <SignalsWidget />
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
                  <TabsList className="bg-ink-raised/60 backdrop-blur-xl border border-ink-edge rounded-xl inline-flex w-auto min-w-full md:min-w-0 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-accent-core data-[state=active]:text-white rounded-xl flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-all">
                      <span className="flex items-center gap-1.5">All <Badge variant="secondary" className="bg-ink-raised text-xs">{signals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="crypto" className="data-[state=active]:bg-accent-core data-[state=active]:text-white rounded-xl flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-crypto">
                      <span className="flex items-center gap-1.5"><Coins className="w-3 h-3 sm:w-4 sm:h-4" />Crypto <Badge variant="secondary" className="bg-warn/20 text-warn text-xs">{cryptoSignals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="stocks" className="data-[state=active]:bg-accent-core data-[state=active]:text-white rounded-xl flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-stocks">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 sm:w-4 sm:h-4" />Stocks <Badge variant="secondary" className="bg-accent-core/20 text-accent-bright text-xs">{stockSignals.length}</Badge></span>
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="data-[state=active]:bg-accent-core data-[state=active]:text-white rounded-xl flex-shrink-0 text-xs sm:text-sm transition-all" data-testid="tab-watchlist">
                      <span className="flex items-center gap-1.5"><Star className="w-3 h-3 sm:w-4 sm:h-4" />Favorites <Badge variant="secondary" className="bg-accent-core/20 text-accent-bright text-xs">{watchlist.size}</Badge></span>
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
                        <div key={i} className="h-96    rounded-xl animate-pulse border border-ink-edge overflow-hidden relative">
                          <div className="absolute inset-0">
                            <motion.div
                              className="absolute inset-x-0 h-full    "
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
                      <Surface className="overflow-hidden">
                        <div className="p-16 text-center relative">
                          <div className="absolute inset-0    " />
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Brain className="w-16 h-16 text-muted mx-auto mb-6" />
                          </motion.div>
                          <p className="text-lg text-body font-medium mb-2">
                            {activeTab === 'watchlist' ? 'No favorites yet' : 'No signals available'}
                          </p>
                          <p className="text-sm text-muted">
                            {activeTab === 'watchlist' ? 'Star assets from the signals to track them here' : 'Click refresh to fetch the latest AI analysis'}
                          </p>
                          {dataUpdatedAt > 0 && (
                            <p className="text-xs text-muted/60 mt-3" data-testid="last-analyzed-ts">
                              Last analyzed: {new Date(dataUpdatedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </Surface>
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
            <Surface className="overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px]    " />
              <div>
                <SectionTitle as="h3" className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-core/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-accent-bright" />
                  </div>
                  Signal Distribution
                </SectionTitle>
              </div>
              <div>
                <div className="space-y-4">
                  {['breakout', 'bounce', 'trend_continuation', 'reversal', 'consolidation'].map((type, i) => {
                    const count = signals.filter(s => s.signalType === type).length;
                    const pct = signals.length > 0 ? (count / signals.length) * 100 : 0;
                    const colors = [' ', ' ', ' ', ' ', ' '];
                    return (
                      <motion.div 
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-body capitalize font-medium">{type.replace('_', ' ')}</span>
                          <span className="text-primary font-mono">{count} <span className="text-muted">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-2 bg-ink-raised rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full  ${colors[i]} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Surface>

            <Surface className="overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px]    " />
              <div>
                <SectionTitle as="h3" className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-core/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-accent-bright" />
                  </div>
                  Performance Metrics
                </SectionTitle>
              </div>
              <div>
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
                      className={`text-center p-4    rounded-xl border border-${metric.color}-500/20`}
                    >
                      <p className={`text-2xl font-bold text-${metric.color}-400 font-mono`}>{metric.value}</p>
                      <p className="text-xs text-secondary mt-1">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-3 rounded-xl bg-ink-raised/60 border border-ink-edge text-center">
                  <p className="text-xs text-muted flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" /> Historical performance tracking coming soon
                  </p>
                </div>
              </div>
            </Surface>
          </motion.div>
        )}

        {mainView === 'mywatchlist' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MyWatchlistSection />
          </motion.div>
        )}

        {mainView === 'correlation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Surface className="overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px]    " />
              <div>
                <SectionTitle as="h3" className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-warn/20 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-warn" />
                  </div>
                  Asset Correlation Heatmap
                  <Badge variant="outline" className="ml-2 text-xs border-warn/30 text-warn">30-Day</Badge>
                </SectionTitle>
              </div>
              <div>
                <CorrelationHeatmap signals={signals} />
                <div className="mt-6 p-3 rounded-xl bg-ink-raised/60 border border-ink-edge text-center">
                  <p className="text-xs text-muted">Correlation coefficients based on 30-day price movements</p>
                </div>
              </div>
            </Surface>
          </motion.div>
        )}

        <div className="mt-12 text-center text-xs text-muted space-y-1">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-core animate-pulse" />
            Signals refresh every 30s (live mode) | 15min cache TTL | Multi-factor confluence
          </p>
          <p>Data: CoinGecko, Finnhub, Alternative.me | AI-Powered Analysis</p>
        </div>
      </div>
    </div>
  );
}
