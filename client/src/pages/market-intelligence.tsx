import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3,
  Bell, BellOff, Target, Zap, AlertTriangle, Sparkles,
  ArrowUpRight, ArrowDownRight, Circle, RefreshCw, Filter,
  Wallet, PieChart, LineChart, CandlestickChart, Globe,
  Newspaper, Clock, Eye, EyeOff, ChevronRight, ChevronDown,
  Flame, Droplets, Users, Building2, DollarSign, Percent, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

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

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  assets: string[];
  timestamp: string;
  url?: string;
}

interface PriceAlert {
  id: string;
  asset: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  isActive: boolean;
}

interface PortfolioPosition {
  asset: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

function SignalCard({ signal }: { signal: MarketSignal }) {
  const isPositive = signal.type === 'bullish';
  const isNegative = signal.type === 'bearish';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-sm",
        isPositive && "bg-emerald-500/10 border-emerald-500/30",
        isNegative && "bg-red-500/10 border-red-500/30",
        !isPositive && !isNegative && "bg-slate-800/50 border-slate-700/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isPositive && "bg-emerald-500/20",
            isNegative && "bg-red-500/20",
            !isPositive && !isNegative && "bg-slate-700/50"
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Activity className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{signal.asset}</p>
            <p className="text-xs text-slate-400">${signal.price.toLocaleString()}</p>
          </div>
        </div>
        
        <Badge className={cn(
          "text-[10px]",
          signal.confidence >= 80 && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          signal.confidence >= 60 && signal.confidence < 80 && "bg-amber-500/20 text-amber-400 border-amber-500/30",
          signal.confidence < 60 && "bg-slate-700/50 text-slate-400 border-slate-600/30"
        )}>
          {signal.confidence}% confidence
        </Badge>
      </div>
      
      <p className="text-sm font-medium text-white mb-1">{signal.signal}</p>
      <p className="text-xs text-slate-400 mb-3">{signal.reasoning}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                isPositive && "bg-emerald-500",
                isNegative && "bg-red-500",
                !isPositive && !isNegative && "bg-slate-500"
              )}
              style={{ width: `${signal.strength}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Strength: {signal.strength}%</span>
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(signal.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

function WhaleCard({ movement }: { movement: WhaleMovement }) {
  const typeColors = {
    accumulation: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    distribution: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    transfer: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  };
  
  const colors = typeColors[movement.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-3 rounded-lg border backdrop-blur-sm",
        colors.bg, colors.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets className={cn("w-4 h-4", colors.text)} />
          <span className="font-semibold text-white text-sm">{movement.asset}</span>
          <Badge className={cn("text-[10px]", colors.bg, colors.text, colors.border)}>
            {movement.type}
          </Badge>
        </div>
        <Badge className={cn(
          "text-[10px]",
          movement.significance === 'high' && "bg-red-500/20 text-red-400 border-red-500/30",
          movement.significance === 'medium' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
          movement.significance === 'low' && "bg-slate-700/50 text-slate-400 border-slate-600/30"
        )}>
          {movement.significance}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="text-slate-400">Amount</p>
          <p className="text-white font-medium">{movement.amount.toLocaleString()} {movement.asset}</p>
          <p className="text-slate-500">${movement.amountUsd.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">From → To</p>
          <p className="text-slate-300 font-mono text-[10px]">
            {movement.from.slice(0, 6)}...{movement.from.slice(-4)}
          </p>
          <p className="text-slate-300 font-mono text-[10px]">
            {movement.to.slice(0, 6)}...{movement.to.slice(-4)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SentimentGauge({ data }: { data: SentimentData }) {
  const getColor = (value: number) => {
    if (value >= 70) return 'text-emerald-400';
    if (value >= 50) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getBgColor = (value: number) => {
    if (value >= 70) return 'bg-emerald-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{data.asset}</h4>
        <div className="flex items-center gap-1">
          {data.trend === 'rising' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {data.trend === 'falling' && <TrendingDown className="w-4 h-4 text-red-400" />}
          {data.trend === 'stable' && <Activity className="w-4 h-4 text-slate-400" />}
          <span className={cn(
            "text-xs capitalize",
            data.trend === 'rising' && 'text-emerald-400',
            data.trend === 'falling' && 'text-red-400',
            data.trend === 'stable' && 'text-slate-400'
          )}>
            {data.trend}
          </span>
        </div>
      </div>
      
      <div className="relative h-3 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", getBgColor(data.overall))}
          style={{ width: `${data.overall}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{data.overall}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Social</p>
          <p className={cn("text-sm font-bold", getColor(data.social))}>{data.social}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">News</p>
          <p className={cn("text-sm font-bold", getColor(data.news))}>{data.news}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Technical</p>
          <p className={cn("text-sm font-bold", getColor(data.technical))}>{data.technical}%</p>
        </div>
      </div>
    </Card>
  );
}

function NewsCard({ news }: { news: NewsItem }) {
  const sentimentColors = {
    positive: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: TrendingUp },
    negative: { bg: 'bg-red-500/10', text: 'text-red-400', icon: TrendingDown },
    neutral: { bg: 'bg-slate-700/50', text: 'text-slate-400', icon: Activity },
  };
  
  const colors = sentimentColors[news.sentiment];
  const Icon = colors.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-purple-500/30 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg flex-shrink-0", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">{news.title}</h4>
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{news.summary}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{news.source}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-slate-500">
                {new Date(news.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex gap-1">
              {news.assets.slice(0, 3).map(asset => (
                <Badge key={asset} className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {asset}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PortfolioCard({ position }: { position: PortfolioPosition }) {
  const isPositive = position.pnl >= 0;
  
  return (
    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{position.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-medium text-white text-sm">{position.asset}</p>
            <p className="text-[10px] text-slate-500">{position.amount.toFixed(4)} {position.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">${(position.amount * position.currentPrice).toLocaleString()}</p>
          <p className={cn(
            "text-xs font-medium",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}>
            {isPositive ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress value={position.allocation} className="h-1 flex-1" />
        <span className="text-[10px] text-slate-500">{position.allocation.toFixed(1)}%</span>
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
    if (value >= 0.8) return 'bg-emerald-500';
    if (value >= 0.6) return 'bg-emerald-600/70';
    if (value >= 0.4) return 'bg-amber-500/70';
    if (value >= 0.2) return 'bg-orange-500/70';
    return 'bg-red-500/70';
  };
  
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700/30">
      <h3 className="font-semibold text-white mb-4">Asset Correlation Matrix</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-1 pl-12">
            {assets.map(asset => (
              <div key={asset} className="w-10 text-center text-[10px] text-slate-400">{asset}</div>
            ))}
          </div>
          {assets.map((asset, i) => (
            <div key={asset} className="flex gap-1 items-center">
              <div className="w-10 text-[10px] text-slate-400 text-right pr-2">{asset}</div>
              {correlations[i].map((corr, j) => (
                <motion.div
                  key={j}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (i * 5 + j) * 0.02 }}
                  className={cn(
                    "w-10 h-10 rounded flex items-center justify-center text-[10px] font-bold text-white",
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
          <div className="w-3 h-3 rounded bg-red-500/70" />
          <span className="text-[10px] text-slate-500">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/70" />
          <span className="text-[10px] text-slate-500">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-[10px] text-slate-500">High</span>
        </div>
      </div>
    </Card>
  );
}

function PriceAlertManager() {
  const { toast } = useToast();
  const [newAlert, setNewAlert] = useState({ asset: '', price: '', condition: 'above' as const });
  
  const alerts: PriceAlert[] = [
    { id: '1', asset: 'BTC', targetPrice: 100000, condition: 'above', currentPrice: 97500, isActive: true },
    { id: '2', asset: 'ETH', targetPrice: 3000, condition: 'below', currentPrice: 3580, isActive: true },
    { id: '3', asset: 'SOL', targetPrice: 300, condition: 'above', currentPrice: 245, isActive: false },
  ];
  
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          Price Alerts
        </h3>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
          {alerts.filter(a => a.isActive).length} active
        </Badge>
      </div>
      
      <div className="space-y-2 mb-4">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className={cn(
              "p-3 rounded-lg border flex items-center justify-between",
              alert.isActive 
                ? "bg-slate-800/50 border-slate-700/30" 
                : "bg-slate-900/30 border-slate-800/30 opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-1.5 rounded-lg",
                alert.condition === 'above' ? "bg-emerald-500/20" : "bg-red-500/20"
              )}>
                {alert.condition === 'above' ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{alert.asset}</p>
                <p className="text-[10px] text-slate-500">
                  {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Current</p>
                <p className="text-sm text-white">${alert.currentPrice.toLocaleString()}</p>
              </div>
              <Switch checked={alert.isActive} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 rounded-lg bg-slate-800/30 border border-dashed border-slate-700/50">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Asset (BTC, ETH...)" 
            className="h-8 text-xs bg-slate-900/50 border-slate-700/50"
            value={newAlert.asset}
            onChange={e => setNewAlert(prev => ({ ...prev, asset: e.target.value }))}
          />
          <Input 
            placeholder="Price" 
            type="number"
            className="h-8 text-xs bg-slate-900/50 border-slate-700/50 w-24"
            value={newAlert.price}
            onChange={e => setNewAlert(prev => ({ ...prev, price: e.target.value }))}
          />
          <Button 
            size="sm" 
            className="h-8 bg-purple-600 hover:bg-purple-500"
            onClick={() => {
              toast({ title: "Alert created", description: `${newAlert.asset} at $${newAlert.price}` });
              setNewAlert({ asset: '', price: '', condition: 'above' });
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function MarketIntelligencePage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('signals');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: signalsData, isLoading: signalsLoading } = useQuery<{ signals: MarketSignal[] }>({
    queryKey: ['/api/market-intelligence/signals'],
    refetchInterval: autoRefresh ? 30000 : false,
  });
  
  const { data: whalesData } = useQuery<{ movements: WhaleMovement[] }>({
    queryKey: ['/api/market-intelligence/whales'],
    refetchInterval: autoRefresh ? 60000 : false,
  });
  
  const { data: sentimentData } = useQuery<{ sentiments: SentimentData[] }>({
    queryKey: ['/api/market-intelligence/sentiment'],
    refetchInterval: autoRefresh ? 60000 : false,
  });
  
  const { data: newsData } = useQuery<{ news: NewsItem[] }>({
    queryKey: ['/api/market-intelligence/news'],
    refetchInterval: autoRefresh ? 120000 : false,
  });
  
  const mockSignals: MarketSignal[] = [
    {
      id: '1',
      type: 'bullish',
      strength: 85,
      asset: 'Bitcoin',
      price: 97500,
      change24h: 3.2,
      signal: 'Strong Buy Signal',
      reasoning: 'RSI oversold bounce combined with bullish MACD crossover on 4H timeframe',
      confidence: 82,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'bearish',
      strength: 65,
      asset: 'Ethereum',
      price: 3580,
      change24h: -1.8,
      signal: 'Short-term Weakness',
      reasoning: 'Breaking below 50-day MA with declining volume, watch $3400 support',
      confidence: 71,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'bullish',
      strength: 78,
      asset: 'Solana',
      price: 245,
      change24h: 5.4,
      signal: 'Momentum Building',
      reasoning: 'Breaking out of consolidation with strong volume confirmation',
      confidence: 76,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
  
  const mockWhales: WhaleMovement[] = [
    {
      id: '1',
      type: 'accumulation',
      asset: 'BTC',
      amount: 1250,
      amountUsd: 121875000,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      timestamp: new Date().toISOString(),
      significance: 'high',
    },
    {
      id: '2',
      type: 'transfer',
      asset: 'ETH',
      amount: 15000,
      amountUsd: 53700000,
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x9876543210fedcba9876543210fedcba98765432',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      significance: 'medium',
    },
    {
      id: '3',
      type: 'distribution',
      asset: 'SOL',
      amount: 250000,
      amountUsd: 61250000,
      from: '0xfedcba9876543210fedcba9876543210fedcba98',
      to: '0x5432109876fedcba5432109876fedcba54321098',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      significance: 'high',
    },
  ];
  
  const mockSentiments: SentimentData[] = [
    { asset: 'Bitcoin', overall: 72, social: 78, news: 68, technical: 70, trend: 'rising' },
    { asset: 'Ethereum', overall: 58, social: 55, news: 62, technical: 57, trend: 'falling' },
    { asset: 'Solana', overall: 81, social: 85, news: 79, technical: 78, trend: 'rising' },
    { asset: 'BNB', overall: 65, social: 60, news: 68, technical: 67, trend: 'stable' },
  ];
  
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Bitcoin ETF Inflows Hit Record High as Institutional Demand Surges',
      source: 'CoinDesk',
      summary: 'BlackRock and Fidelity lead massive inflow week with over $2.4B in new investments',
      sentiment: 'positive',
      assets: ['BTC'],
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Ethereum Foundation Announces Major Protocol Upgrade Timeline',
      source: 'The Block',
      summary: 'Pectra upgrade scheduled for Q1 2025, promising improved scalability',
      sentiment: 'positive',
      assets: ['ETH'],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'SEC Commissioner Signals Crypto-Friendly Regulatory Shift',
      source: 'Bloomberg',
      summary: 'New leadership expected to take more accommodative stance on digital assets',
      sentiment: 'positive',
      assets: ['BTC', 'ETH', 'SOL'],
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
  
  const mockPortfolio: PortfolioPosition[] = [
    { asset: 'Bitcoin', symbol: 'BTC', amount: 0.5, avgPrice: 65000, currentPrice: 97500, pnl: 16250, pnlPercent: 50, allocation: 48.2 },
    { asset: 'Ethereum', symbol: 'ETH', amount: 5, avgPrice: 2800, currentPrice: 3580, pnl: 3900, pnlPercent: 27.9, allocation: 25.5 },
    { asset: 'Solana', symbol: 'SOL', amount: 50, avgPrice: 150, currentPrice: 245, pnl: 4750, pnlPercent: 63.3, allocation: 18.3 },
    { asset: 'Chainlink', symbol: 'LINK', amount: 200, avgPrice: 12, currentPrice: 19.5, pnl: 1500, pnlPercent: 62.5, allocation: 8.0 },
  ];
  
  const signals = signalsData?.signals || mockSignals;
  const whales = whalesData?.movements || mockWhales;
  const sentiments = sentimentData?.sentiments || mockSentiments;
  const news = newsData?.news || mockNews;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 font-orbitron">
                Market Intelligence
              </h1>
              <p className="text-sm text-slate-400">AI-powered insights & real-time analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Auto-refresh</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Bullish Signals</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-orbitron">
              {signals.filter(s => s.type === 'bullish').length}
            </p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-900/30 to-slate-900/50 border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Bearish Signals</span>
            </div>
            <p className="text-2xl font-bold text-red-400 font-orbitron">
              {signals.filter(s => s.type === 'bearish').length}
            </p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-cyan-900/30 to-slate-900/50 border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Whale Moves</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400 font-orbitron">{whales.length}</p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-slate-900/50 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Avg Sentiment</span>
            </div>
            <p className="text-2xl font-bold text-purple-400 font-orbitron">
              {Math.round(sentiments.reduce((a, b) => a + b.overall, 0) / sentiments.length)}%
            </p>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full bg-slate-900/50 border border-purple-500/20 p-1 h-auto flex-wrap">
            <TabsTrigger value="signals" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
              <Zap className="w-4 h-4 mr-1.5" />
              Signals
            </TabsTrigger>
            <TabsTrigger value="whales" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
              <Droplets className="w-4 h-4 mr-1.5" />
              Whales
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
              <Activity className="w-4 h-4 mr-1.5" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
              <Wallet className="w-4 h-4 mr-1.5" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
              <Newspaper className="w-4 h-4 mr-1.5" />
              News
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="whales" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whales.map(movement => (
                <WhaleCard key={movement.id} movement={movement} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sentiments.map(data => (
                <SentimentGauge key={data.asset} data={data} />
              ))}
            </div>
            <CorrelationHeatmap />
          </TabsContent>
          
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-4 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 border-emerald-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400">Total Portfolio Value</p>
                      <p className="text-3xl font-bold text-white font-orbitron">
                        ${mockPortfolio.reduce((a, p) => a + p.amount * p.currentPrice, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total P&L</p>
                      <p className="text-2xl font-bold text-emerald-400 font-orbitron">
                        +${mockPortfolio.reduce((a, p) => a + p.pnl, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <div className="space-y-2">
                  {mockPortfolio.map(position => (
                    <PortfolioCard key={position.symbol} position={position} />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <PriceAlertManager />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="news" className="space-y-4">
            {news.map(item => (
              <NewsCard key={item.id} news={item} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}