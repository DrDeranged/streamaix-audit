import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Minus
} from 'lucide-react';

interface TradingSignal {
  asset: {
    symbol: string;
    name: string;
    type: 'crypto' | 'stock';
  };
  currentPrice: number;
  priceChange24h: number;
  signalType: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: { low: number; high: number };
  stopLoss: number;
  targets: { price: number; label: string }[];
  riskReward: string;
  timeframe: string;
  reasoning: string;
  keyLevels: { support: number; resistance: number };
  volumeAnalysis: string;
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
    <div className="relative" style={{ width: size, height: size }}>
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${getColor()}`}>{value}%</span>
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const [expanded, setExpanded] = useState(false);
  
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
    };
    return colors[signal.signalType] || colors['consolidation'];
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${getDirectionColor()} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-slate-900/60" />
      
      <div className="relative p-4">
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
              </h3>
              <p className="text-sm text-slate-400">{signal.asset.name}</p>
            </div>
          </div>
          
          <ConfidenceRing value={signal.confidence} size={56} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Current Price</p>
            <p className="text-lg font-bold text-white">{formatPrice(signal.currentPrice)}</p>
            <p className={`text-xs font-medium ${signal.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}% (24h)
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Signal Type</p>
            <Badge className={`${getSignalTypeBadge()} text-xs`}>
              {signal.signalType.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-xs text-slate-500 mt-1">{signal.timeframe} timeframe</p>
          </div>
        </div>

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

        <Button 
          variant="ghost" 
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
          onClick={() => setExpanded(!expanded)}
          data-testid={`btn-expand-${signal.asset.symbol}`}
        >
          {expanded ? 'Hide Details' : 'Show Details'}
          <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 border-t border-slate-700/50 mt-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Take Profit Targets
                  </p>
                  <div className="space-y-2">
                    {signal.targets.map((target, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                        <span className="text-xs text-cyan-400 font-medium">{target.label}</span>
                        <span className="text-sm font-bold text-white">{formatPrice(target.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI Analysis
                  </p>
                  <p className="text-sm text-slate-300 bg-slate-800/30 rounded-lg p-3">
                    {signal.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium mb-2">Key Levels</p>
                    <div className="bg-slate-800/30 rounded-lg p-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-emerald-400">Support</span>
                        <span className="text-xs text-white font-medium">{formatPrice(signal.keyLevels.support)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-red-400">Resistance</span>
                        <span className="text-xs text-white font-medium">{formatPrice(signal.keyLevels.resistance)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium mb-2">Volume</p>
                    <p className="text-xs text-slate-300 bg-slate-800/30 rounded-lg p-2">
                      {signal.volumeAnalysis}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                  Generated: {new Date(signal.generatedAt).toLocaleString()}
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
                AI Trading Signals
              </h1>
              <p className="text-slate-400 mt-2">
                AI-powered trade setups for crypto and Bitcoin mining stocks
              </p>
            </div>
            
            <Button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300"
              data-testid="btn-refresh-signals"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Signals</p>
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
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Confidence</p>
                <p className="text-xl font-bold text-purple-400">{avgConfidence}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-amber-500/10 border-amber-500/30 mb-8">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Risk Disclaimer</p>
              <p className="text-xs text-amber-300/70 mt-1">
                AI-generated signals are for informational purposes only. Always do your own research and never invest more than you can afford to lose. Past performance does not guarantee future results.
              </p>
            </div>
          </CardContent>
        </Card>

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
              Stocks ({stockSignals.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-800/30 rounded-xl animate-pulse" />
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

        <div className="mt-12 text-center text-xs text-slate-500">
          <p>Signals are refreshed every 15 minutes. Data sources: CoinGecko, Finnhub</p>
          <p className="mt-1">Analysis powered by GPT-4o-mini</p>
        </div>
      </div>
    </div>
  );
}
