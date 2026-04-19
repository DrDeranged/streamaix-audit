import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import {
  Wallet, Plus, TrendingUp, TrendingDown, PieChart, BarChart3,
  RefreshCw, Settings, Brain, AlertTriangle, Target, Zap,
  DollarSign, Bitcoin, LineChart, Activity, Shield, ChevronRight,
  Sparkles, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Clock,
  Building2, Coins, Banknote, Landmark, Package, MoreHorizontal,
  ChevronDown, X, Check, Edit2, Trash2, Calculator, Lightbulb, Search,
  Layers, TrendingUp as Gain, BarChart2, Percent, Lock, Bell,
  Gauge, Crosshair, Radio, Scale, CircleDot, Flame, Briefcase,
  Calendar, Receipt, FileText, Star, ChevronUp, ArrowRight, History, CheckCircle,
  BookMarked, ShoppingCart, Wifi, WifiOff, MessageCircle, Send, Link2, Unlink, Bot
} from 'lucide-react';
import { useWebSocketPrices, type PriceUpdate } from '@/hooks/use-websocket-prices';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
  healthScore?: number;
  riskLevel?: string;
  diversificationScore?: number;
  lastSyncedAt?: string;
}

interface PortfolioAsset {
  id: string;
  assetType: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceLastUpdated?: string;
  allocationPercent: number;
  accountName?: string;
  color?: string;
}

interface AIAnalysis {
  healthScore: number;
  riskLevel: string;
  diversificationScore: number;
  recommendations: Array<{ type: string; message: string; priority: string; action?: string }>;
  allocation: Record<string, number>;
  totalValue: number;
}

interface WatchlistItemType {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  addedPrice: number;
  currentPrice: number | null;
  priceChange24h: number | null;
  priceChangeSinceAdded: number | null;
  logoUrl?: string | null;
  notes?: string | null;
  createdAt?: string;
}

interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  snapshotDate: string;
}

const assetTypeIcons: Record<string, any> = {
  crypto: Bitcoin,
  stock: TrendingUp,
  etf: BarChart3,
  bond: Shield,
  retirement: Landmark,
  cash: Banknote,
  stablecoin: Coins,
  real_estate: Building2,
  commodity: Package,
  other: Wallet,
};

const assetTypeColors: Record<string, string> = {
  crypto: 'from-orange-500 to-amber-500',
  stock: 'from-blue-500 to-cyan-500',
  etf: 'from-purple-500 to-fuchsia-500',
  bond: 'from-green-500 to-emerald-500',
  retirement: 'from-indigo-500 to-violet-500',
  cash: 'from-gray-500 to-slate-500',
  stablecoin: 'from-teal-500 to-cyan-500',
  real_estate: 'from-rose-500 to-pink-500',
  commodity: 'from-yellow-500 to-amber-500',
  other: 'from-slate-500 to-gray-500',
};

const riskLevelColors: Record<string, string> = {
  conservative: 'text-green-400 bg-green-500/20',
  moderate: 'text-blue-400 bg-blue-500/20',
  moderately_aggressive: 'text-amber-400 bg-amber-500/20',
  aggressive: 'text-orange-400 bg-orange-500/20',
  extreme: 'text-red-400 bg-red-500/20',
};

function CollapsibleSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  children, 
  defaultOpen = true,
  badge 
}: { 
  title: string; 
  icon: any; 
  iconColor: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="surface-2 overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/40 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", iconColor)} />
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {badge}
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6">
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function QuickStatCard({ 
  label, 
  value, 
  subtext, 
  trend, 
  icon: Icon, 
  iconColor,
  bgGradient 
}: { 
  label: string; 
  value: string; 
  subtext?: string; 
  trend?: 'up' | 'down' | 'neutral'; 
  icon: any; 
  iconColor: string;
  bgGradient?: string;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 border transition-all hover:scale-[1.02]",
      bgGradient || "surface-1"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          {subtext && (
            <p className={cn("text-xs mt-1", 
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 'text-gray-500'
            )}>{subtext}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg surface-1")}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>
    </div>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="56" cy="56" r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">Health</span>
      </div>
    </div>
  );
}

// Consistent colors for each asset type across all charts and legends
const assetTypeChartColors: Record<string, string> = {
  stock: '#3b82f6',      // Blue
  crypto: '#f59e0b',     // Orange/Amber
  cash: '#6b7280',       // Gray
  retirement: '#8b5cf6', // Purple
  etf: '#06b6d4',        // Cyan
  bond: '#10b981',       // Green
  real_estate: '#ec4899', // Pink
  commodity: '#eab308',  // Yellow
  stablecoin: '#6b7280', // Gray (same as cash)
  other: '#9ca3af',      // Light gray
};

const AllocationChart = memo(function AllocationChart({ allocation }: { allocation: Record<string, number> }) {
  const entries = Object.entries(allocation).filter(([_, v]) => v > 0);
  let cumulativeRotation = 0;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {entries.map(([type, percent]) => {
          const sliceAngle = (percent / 100) * 360;
          const startAngle = cumulativeRotation;
          cumulativeRotation += sliceAngle;

          // Use consistent color per asset type
          const color = assetTypeChartColors[type] || assetTypeChartColors.other;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + sliceAngle) * Math.PI) / 180;

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArc = sliceAngle > 180 ? 1 : 0;

          return (
            <path
              key={type}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="0.5"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="#0f172a" />
      </svg>
    </div>
  );
});

const Sparkline = memo(function Sparkline({ priceChange7d }: { priceChange7d: number }) {
  const data = useMemo(() => {
    const change = priceChange7d || 0;
    const points = 7;
    const result = [];
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const value = 100 + (change * progress) + (Math.random() - 0.5) * Math.abs(change) * 0.3;
      result.push({ value });
    }
    return result;
  }, [priceChange7d]);
  
  const isPositive = (priceChange7d || 0) >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  
  return (
    <div className="w-16 h-6" data-testid="sparkline-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGrad-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sparkGrad-${isPositive ? 'up' : 'down'})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

const NetWorthChart = memo(function NetWorthChart({ portfolioId }: { portfolioId: string }) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');
  
  const { data: historyData, isLoading } = useQuery<{ success: boolean; snapshots: PortfolioSnapshot[] }>({
    queryKey: ['/api/portfolios', portfolioId, 'history'],
    enabled: !!portfolioId,
  });
  
  const chartData = useMemo(() => {
    const snapshots = historyData?.snapshots || [];
    if (snapshots.length === 0) return [];
    
    const now = new Date();
    const daysMap: Record<string, number> = { '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[timeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return snapshots
      .filter(s => new Date(s.snapshotDate) >= cutoff)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .map(s => ({
        date: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s.totalValue,
        costBasis: s.totalCostBasis,
      }));
  }, [historyData, timeRange]);
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
        <div className="text-center">
          <LineChart className="w-8 h-8 mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-400">Not enough data for chart</p>
        </div>
      </div>
    );
  }
  
  return (
    <div data-testid="net-worth-chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-xs text-gray-400">Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground" />
            <span className="text-xs text-gray-400">Cost Basis</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(['30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-7 px-2 text-xs",
                timeRange === range ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
              )}
              data-testid={`button-range-${range}`}
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={formatValue}
              width={50}
            />
            <RechartsTooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
            />
            <Area
              type="monotone"
              dataKey="costBasis"
              stroke="#64748b"
              strokeWidth={1}
              fill="none"
              dot={false}
              name="Cost Basis"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              name="Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

function WatchlistItemRow({ 
  item, 
  onRemove, 
  onBuy 
}: { 
  item: WatchlistItemType; 
  onRemove: (id: string) => void;
  onBuy: (item: WatchlistItemType) => void;
}) {
  const Icon = assetTypeIcons[item.assetType] || Wallet;
  const colorGradient = assetTypeColors[item.assetType] || assetTypeColors.other;
  const priceChange = item.priceChangeSinceAdded || 0;
  const isPositive = priceChange >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between p-3 surface-1 surface-interactive rounded-lg group"
      data-testid={`watchlist-item-${item.symbol}`}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br", colorGradient)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">{item.symbol}</span>
            <span className="text-[10px] text-gray-500 uppercase">{item.assetType}</span>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-[120px]">{item.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-medium text-white text-sm">
            ${(item.currentPrice || item.addedPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={cn("flex items-center justify-end gap-0.5 text-xs", isPositive ? 'text-green-400' : 'text-red-400')}>
            {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            <span>{isPositive ? '+' : ''}{priceChange.toFixed(1)}% since added</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBuy(item)}
            className="h-7 px-2 text-green-400 hover:bg-green-500/20"
            data-testid={`button-buy-${item.symbol}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="h-7 px-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20"
            data-testid={`button-remove-${item.symbol}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function AddToWatchlistDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoResults, setCryptoResults] = useState<any[]>([]);
  const [stockResults, setStockResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setCryptoResults([]);
      setStockResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [cryptoRes, stockRes] = await Promise.all([
          fetch(`/api/crypto/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json()).catch(() => ({ coins: [] })),
          fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json()).catch(() => ({ results: [] })),
        ]);
        setCryptoResults(cryptoRes.coins || []);
        setStockResults(stockRes.results || []);
      } catch (error) {
        console.error('Search failed:', error);
      }
      setIsSearching(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const addMutation = useMutation({
    mutationFn: async (data: { symbol: string; name: string; assetType: string; addedPrice: number; logoUrl?: string }) => {
      return apiRequest('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({ title: 'Added to Watchlist', description: 'Asset is now being tracked' });
      setOpen(false);
      setSearchQuery('');
      setCryptoResults([]);
      setStockResults([]);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    },
  });
  
  const handleSelect = async (result: any, type: 'crypto' | 'stock') => {
    let price = 0;
    try {
      if (type === 'crypto') {
        const res = await fetch(`/api/crypto/${result.id}/price`).then(r => r.json());
        price = res.price || 0;
      } else {
        const res = await fetch(`/api/stocks/${result.symbol}/quote`).then(r => r.json());
        price = res.price || 0;
      }
    } catch {}
    
    addMutation.mutate({
      symbol: result.symbol.toUpperCase(),
      name: result.name,
      assetType: type,
      addedPrice: price,
      logoUrl: result.thumb || undefined,
    });
  };
  
  const hasResults = cryptoResults.length > 0 || stockResults.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400" data-testid="add-watchlist-button">
          <BookMarked className="w-4 h-4 mr-2" />
          Add to Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent className="surface-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add to Watchlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search stocks or crypto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              data-testid="input-watchlist-search"
              autoFocus
            />
            {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
          </div>
          
          {!searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Track assets without buying</p>
            </div>
          )}
          
          {hasResults && (
            <div className="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              {stockResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-muted text-xs text-muted-foreground font-medium flex items-center gap-2 border-b border-border">
                    <Building2 className="w-3 h-3" /> Stocks
                  </div>
                  {stockResults.slice(0, 5).map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => handleSelect(result, 'stock')}
                      disabled={addMutation.isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 text-left border-b border-border last:border-b-0 transition-colors disabled:opacity-50"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{result.symbol}</p>
                        <p className="text-xs text-gray-500 truncate">{result.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {cryptoResults.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-muted text-xs text-muted-foreground font-medium flex items-center gap-2 border-b border-border">
                    <Bitcoin className="w-3 h-3" /> Crypto
                  </div>
                  {cryptoResults.slice(0, 5).map((result: any) => (
                    <button
                      key={result.id || result.symbol}
                      onClick={() => handleSelect(result, 'crypto')}
                      disabled={addMutation.isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 text-left border-b border-border last:border-b-0 transition-colors disabled:opacity-50"
                    >
                      {result.thumb ? (
                        <img src={result.thumb} alt={result.symbol} className="w-9 h-9 rounded-lg" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Bitcoin className="w-4 h-4 text-orange-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{result.symbol.toUpperCase()}</p>
                        <p className="text-xs text-gray-500 truncate">{result.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
          
          {searchQuery.length >= 2 && !hasResults && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No results for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BotTradingTab() {
  const { data: myStakes, isLoading: stakesLoading } = useQuery<any[]>({
    queryKey: ['/api/bot-trading/my-stakes'],
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/bot-trading/stats'],
    refetchInterval: 60000,
  });

  const [, navigate] = useLocation();

  if (stakesLoading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Loading bot stakes...</p>
      </div>
    );
  }

  const stakes = myStakes || [];
  const totalStaked = stakes.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
  const totalPnL = stakes.reduce((sum: number, s: any) => sum + Number(s.currentValue || s.amount || 0) - Number(s.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="surface-1 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 mb-1">Total Staked</p>
          <p className="text-base font-bold text-white numeric">{totalStaked.toLocaleString()} <span className="text-xs text-gray-400">STREAM</span></p>
        </div>
        <div className="surface-1 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 mb-1">Active Bots</p>
          <p className="text-base font-bold text-cyan-400">{stakes.filter((s: any) => s.status === 'active').length}</p>
        </div>
        <div className="surface-1 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 mb-1">Est. P&L</p>
          <p className={`text-base font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)}
          </p>
        </div>
      </div>

      {stakes.length === 0 ? (
        <div className="py-6 text-center">
          <Bot className="w-10 h-10 text-cyan-400/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No Bot Stakes Yet</h3>
          <p className="text-xs text-gray-400 mb-4">Stake STREAM points on AI trading bots to earn simulated returns.</p>
          <Button
            size="sm"
            onClick={() => navigate('/bot-trading')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
          >
            <Bot className="w-3 h-3 mr-1" />
            Browse Bots
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {stakes.map((stake: any) => {
            const pnl = Number(stake.currentValue || stake.amount || 0) - Number(stake.amount || 0);
            const pnlPct = Number(stake.amount) > 0 ? (pnl / Number(stake.amount)) * 100 : 0;
            return (
              <div
                key={stake.id}
                className="flex items-center justify-between p-3 surface-1 surface-interactive rounded-lg hover:border-neon-cyan/50 cursor-pointer"
                onClick={() => navigate('/bot-trading')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stake.botAvatar || '🤖'}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{stake.botName || 'Trading Bot'}</p>
                    <p className="text-[11px] text-gray-400 numeric">{Number(stake.amount).toLocaleString()} STREAM staked</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                  </p>
                  <p className={`text-[11px] ${pnlPct >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => navigate('/bot-trading')}
          >
            View All Bots
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function WatchlistTab({ portfolioId, onBuyFromWatchlist }: { portfolioId: string; onBuyFromWatchlist: (item: WatchlistItemType) => void }) {
  const { toast } = useToast();
  
  const { data: watchlistData, isLoading, refetch } = useQuery<{ items: WatchlistItemType[] }>({
    queryKey: ['/api/watchlist'],
  });
  
  const watchlistItems = watchlistData?.items || [];
  
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/watchlist/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({ title: 'Removed from watchlist' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
    },
  });
  
  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (watchlistItems.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center max-w-sm mx-auto">
          <motion.div 
            className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 flex items-center justify-center"
          >
            <BookMarked className="w-10 h-10 text-amber-400" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">Track Assets to Watch</h3>
          <p className="text-gray-400 text-sm mb-6">
            Add stocks and crypto to your watchlist to track their prices without buying them.
          </p>
          <AddToWatchlistDialog onSuccess={() => refetch()} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddToWatchlistDialog onSuccess={() => refetch()} />
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {watchlistItems.map((item) => (
            <WatchlistItemRow
              key={item.id}
              item={item}
              onRemove={(id) => removeMutation.mutate(id)}
              onBuy={onBuyFromWatchlist}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TopMovers = memo(function TopMovers({ assets, showValues }: { assets: PortfolioAsset[]; showValues: boolean }) {
  const sortedByChange = useMemo(() => [...assets].sort((a, b) => 
    Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0)
  ), [assets]);
  const gainers = useMemo(() => sortedByChange.filter(a => (a.priceChange24h || 0) > 0).slice(0, 3), [sortedByChange]);
  const losers = useMemo(() => sortedByChange.filter(a => (a.priceChange24h || 0) < 0).slice(0, 3), [sortedByChange]);

  if (assets.length === 0) {
    return (
      <div className="text-center py-6">
        <Activity className="w-8 h-8 mx-auto text-gray-600 mb-2" />
        <p className="text-sm text-gray-400">Add assets to see top movers</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Top Gainers
        </h4>
        <div className="space-y-2">
          {gainers.length > 0 ? gainers.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
              <span className="text-sm font-medium text-white">{asset.symbol}</span>
              <span className="text-xs text-green-400">+{(asset.priceChange24h || 0).toFixed(2)}%</span>
            </div>
          )) : (
            <p className="text-xs text-gray-500 py-2">No gainers today</p>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" /> Top Losers
        </h4>
        <div className="space-y-2">
          {losers.length > 0 ? losers.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
              <span className="text-sm font-medium text-white">{asset.symbol}</span>
              <span className="text-xs text-red-400">{(asset.priceChange24h || 0).toFixed(2)}%</span>
            </div>
          )) : (
            <p className="text-xs text-gray-500 py-2">No losers today</p>
          )}
        </div>
      </div>
    </div>
  );
});

interface PortfolioGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  goalType: string;
  priority?: string;
  status?: string;
}

interface NewsItem {
  symbol: string;
  title: string;
  source: string;
  time: string;
  sentiment: string;
  url?: string;
}

interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  transactionType: 'buy' | 'sell' | 'transfer' | 'dividend';
  quantity: number;
  price: number;
  total: number;
  fees: number;
  transactionDate: string;
  notes?: string;
}

interface DividendInfo {
  symbol: string;
  name: string;
  nextDividendDate: string;
  dividendAmount: number;
  frequency: 'quarterly' | 'monthly' | 'annual';
  yield: number;
}

const DIVIDEND_DATA: Record<string, Omit<DividendInfo, 'symbol' | 'name'>> = {
  AAPL: { nextDividendDate: '2025-02-14', dividendAmount: 0.25, frequency: 'quarterly', yield: 0.48 },
  MSFT: { nextDividendDate: '2025-03-13', dividendAmount: 0.83, frequency: 'quarterly', yield: 0.72 },
  JNJ: { nextDividendDate: '2025-03-11', dividendAmount: 1.24, frequency: 'quarterly', yield: 3.0 },
  KO: { nextDividendDate: '2025-04-01', dividendAmount: 0.485, frequency: 'quarterly', yield: 2.85 },
  PG: { nextDividendDate: '2025-02-18', dividendAmount: 1.0065, frequency: 'quarterly', yield: 2.36 },
  XOM: { nextDividendDate: '2025-03-10', dividendAmount: 0.99, frequency: 'quarterly', yield: 3.3 },
  JPM: { nextDividendDate: '2025-04-05', dividendAmount: 1.25, frequency: 'quarterly', yield: 2.1 },
  VZ: { nextDividendDate: '2025-02-03', dividendAmount: 0.6775, frequency: 'quarterly', yield: 6.4 },
  T: { nextDividendDate: '2025-02-03', dividendAmount: 0.2775, frequency: 'quarterly', yield: 4.9 },
  PEP: { nextDividendDate: '2025-03-28', dividendAmount: 1.355, frequency: 'quarterly', yield: 2.8 },
  MCD: { nextDividendDate: '2025-03-17', dividendAmount: 1.77, frequency: 'quarterly', yield: 2.2 },
  HD: { nextDividendDate: '2025-03-20', dividendAmount: 2.25, frequency: 'quarterly', yield: 2.1 },
  CVX: { nextDividendDate: '2025-03-10', dividendAmount: 1.63, frequency: 'quarterly', yield: 4.2 },
  MRK: { nextDividendDate: '2025-04-07', dividendAmount: 0.77, frequency: 'quarterly', yield: 2.8 },
  ABBV: { nextDividendDate: '2025-02-14', dividendAmount: 1.55, frequency: 'quarterly', yield: 3.5 },
  VYM: { nextDividendDate: '2025-03-25', dividendAmount: 0.85, frequency: 'quarterly', yield: 2.6 },
  SCHD: { nextDividendDate: '2025-03-27', dividendAmount: 0.63, frequency: 'quarterly', yield: 3.4 },
  VIG: { nextDividendDate: '2025-03-26', dividendAmount: 0.78, frequency: 'quarterly', yield: 1.7 },
};

const BenchmarkComparisonChart = memo(function BenchmarkComparisonChart({ portfolioId, assets }: { portfolioId: string; assets: PortfolioAsset[] }) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'YTD'>('30d');
  
  const { data: historyData, isLoading } = useQuery<{ success: boolean; snapshots: PortfolioSnapshot[] }>({
    queryKey: ['/api/portfolios', portfolioId, 'history'],
    enabled: !!portfolioId,
    staleTime: 300000, // 5 minutes
  });
  
  const chartData = useMemo(() => {
    const snapshots = historyData?.snapshots || [];
    if (snapshots.length === 0) return [];
    
    const now = new Date();
    let cutoff: Date;
    let days: number;
    
    if (timeRange === 'YTD') {
      cutoff = new Date(now.getFullYear(), 0, 1);
      days = Math.floor((now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      days = timeRange === '30d' ? 30 : 90;
      cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    
    const filteredSnapshots = snapshots
      .filter(s => new Date(s.snapshotDate) >= cutoff)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    
    if (filteredSnapshots.length === 0) return [];
    
    const baseValue = filteredSnapshots[0].totalValue;
    const sp500YtdReturn = 19.7;
    const dailySpReturn = sp500YtdReturn / 365;
    
    return filteredSnapshots.map((s, index) => {
      const portfolioReturn = baseValue > 0 ? ((s.totalValue - baseValue) / baseValue) * 100 : 0;
      const daysFromStart = index;
      const spReturn = dailySpReturn * daysFromStart;
      
      return {
        date: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolio: Number(portfolioReturn.toFixed(2)),
        sp500: Number(spReturn.toFixed(2)),
      };
    });
  }, [historyData, timeRange]);
  
  const latestData = chartData[chartData.length - 1];
  const portfolioReturn = latestData?.portfolio || 0;
  const spReturn = latestData?.sp500 || 0;
  
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (chartData.length < 2 || assets.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
        <div className="text-center">
          <LineChart className="w-8 h-8 mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-400">Not enough history for benchmark comparison</p>
          <p className="text-xs text-gray-500 mt-1">Add more assets and check back in a few days</p>
        </div>
      </div>
    );
  }
  
  return (
    <div data-testid="benchmark-comparison-chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-xs text-gray-400">Portfolio</span>
            <span className={cn("text-xs font-medium", portfolioReturn >= 0 ? 'text-green-400' : 'text-red-400')}>
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-500" />
            <span className="text-xs text-gray-400">S&P 500</span>
            <span className="text-xs font-medium text-amber-400">+{spReturn.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(['30d', '90d', 'YTD'] as const).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-7 px-2 text-xs",
                timeRange === range ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
              )}
              data-testid={`button-benchmark-${range}`}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <RechartsTooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: number, name: string) => [
                `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, 
                name === 'portfolio' ? 'Portfolio' : 'S&P 500'
              ]}
            />
            <Line
              type="monotone"
              dataKey="sp500"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="sp500"
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              name="portfolio"
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
      <div className={cn(
        "mt-3 p-2 rounded-lg text-center text-xs",
        portfolioReturn >= spReturn ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
      )}>
        {portfolioReturn >= spReturn 
          ? `📈 Outperforming S&P 500 by ${(portfolioReturn - spReturn).toFixed(1)}%`
          : `📉 Underperforming S&P 500 by ${(spReturn - portfolioReturn).toFixed(1)}%`}
      </div>
    </div>
  );
});

function TransactionHistoryDialog({ portfolioId, open, onOpenChange }: { portfolioId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { data: transactionsData, isLoading } = useQuery<{ success: boolean; transactions: PortfolioTransaction[] }>({
    queryKey: ['/api/portfolios', portfolioId, 'transactions'],
    enabled: !!portfolioId && open,
  });
  
  const transactions = transactionsData?.transactions || [];
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.transactionType === filterType)
      .filter(t => !filterSymbol || t.symbol.toLowerCase().includes(filterSymbol.toLowerCase()))
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [transactions, filterType, filterSymbol]);
  
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const uniqueSymbols = Array.from(new Set(transactions.map(t => t.symbol)));
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-400 bg-green-500/20';
      case 'sell': return 'text-red-400 bg-red-500/20';
      case 'dividend': return 'text-amber-400 bg-amber-500/20';
      case 'transfer': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-2 sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Transaction History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="surface-2">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="dividend">Dividend</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Filter by symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="pl-10"
              data-testid="input-filter-symbol"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-3 surface-1 rounded-lg animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No transactions found</p>
              <p className="text-xs text-gray-500 mt-1">Transactions will appear here when you add trades</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 surface-1 surface-interactive rounded-lg"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs uppercase", getTypeColor(tx.transactionType))}>
                        {tx.transactionType}
                      </Badge>
                      <span className="font-medium text-white">{tx.symbol}</span>
                      <span className="text-xs text-gray-500">{tx.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(tx.transactionDate).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">Quantity</span>
                      <span className="text-white">{tx.quantity.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Price</span>
                      <span className="text-white">${tx.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Total</span>
                      <span className={cn("font-medium", tx.transactionType === 'sell' || tx.transactionType === 'dividend' ? 'text-green-400' : 'text-white')}>
                        {tx.transactionType === 'sell' || tx.transactionType === 'dividend' ? '+' : '-'}${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Fees</span>
                      <span className="text-gray-400">${tx.fees.toFixed(2)}</span>
                    </div>
                  </div>
                  {tx.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{tx.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-border text-muted-foreground"
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-border text-muted-foreground"
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DividendCalendar({ assets }: { assets: PortfolioAsset[] }) {
  const dividendEligibleAssets = assets.filter(a => 
    ['stock', 'etf'].includes(a.assetType) && DIVIDEND_DATA[a.symbol.toUpperCase()]
  );
  
  const upcomingDividends = useMemo(() => {
    const now = new Date();
    const dividends: Array<DividendInfo & { estimatedPayment: number; sharesOwned: number }> = [];
    
    dividendEligibleAssets.forEach(asset => {
      const divData = DIVIDEND_DATA[asset.symbol.toUpperCase()];
      if (divData) {
        let nextDate = new Date(divData.nextDividendDate);
        while (nextDate < now) {
          const daysToAdd = divData.frequency === 'quarterly' ? 91 : divData.frequency === 'monthly' ? 30 : 365;
          nextDate = new Date(nextDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        }
        
        dividends.push({
          symbol: asset.symbol.toUpperCase(),
          name: asset.name,
          nextDividendDate: nextDate.toISOString().split('T')[0],
          dividendAmount: divData.dividendAmount,
          frequency: divData.frequency,
          yield: divData.yield,
          estimatedPayment: asset.quantity * divData.dividendAmount,
          sharesOwned: asset.quantity,
        });
      }
    });
    
    return dividends.sort((a, b) => 
      new Date(a.nextDividendDate).getTime() - new Date(b.nextDividendDate).getTime()
    );
  }, [dividendEligibleAssets]);
  
  const annualDividendIncome = useMemo(() => {
    return upcomingDividends.reduce((sum, div) => {
      const multiplier = div.frequency === 'quarterly' ? 4 : div.frequency === 'monthly' ? 12 : 1;
      return sum + (div.estimatedPayment * multiplier);
    }, 0);
  }, [upcomingDividends]);
  
  if (dividendEligibleAssets.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-8 h-8 mx-auto text-gray-600 mb-2" />
        <p className="text-sm text-gray-400">No dividend-paying stocks in portfolio</p>
        <p className="text-xs text-gray-500 mt-1">Add stocks like AAPL, MSFT, or dividend ETFs</p>
      </div>
    );
  }
  
  const nextThreeDividends = upcomingDividends.slice(0, 3);
  
  return (
    <div className="space-y-4" data-testid="dividend-calendar">
      <div className="p-3 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Est. Annual Dividend Income</span>
          <Badge className="text-[10px] bg-green-500/20 text-green-400">Projected</Badge>
        </div>
        <p className="text-xl font-bold text-green-400">${annualDividendIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-[10px] text-gray-500 mt-1">${(annualDividendIncome / 12).toFixed(2)}/month avg</p>
      </div>
      
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          Upcoming Dividends
        </h4>
        <div className="space-y-2">
          {nextThreeDividends.map((div, idx) => {
            const daysUntil = Math.ceil((new Date(div.nextDividendDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div 
                key={div.symbol} 
                className="p-3 surface-1 surface-interactive rounded-lg hover:border-neon-purple/50"
                data-testid={`dividend-${div.symbol}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{div.symbol}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {div.yield.toFixed(1)}% yield
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    daysUntil <= 7 ? 'text-green-400' : daysUntil <= 30 ? 'text-amber-400' : 'text-gray-400'
                  )}>
                    {daysUntil <= 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-gray-500">
                    {new Date(div.nextDividendDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-green-400 font-medium">
                    +${div.estimatedPayment.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {div.sharesOwned.toLocaleString()} shares × ${div.dividendAmount.toFixed(4)}/share
                </p>
              </div>
            );
          })}
        </div>
        {upcomingDividends.length > 3 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{upcomingDividends.length - 3} more dividend payments scheduled
          </p>
        )}
      </div>
    </div>
  );
}

function PerformanceSummary({ portfolio, assets, portfolioId }: { portfolio: Portfolio | null | undefined; assets: PortfolioAsset[]; portfolioId?: string }) {
  const totalPnl = portfolio?.totalPnl || 0;
  const totalPnlPercent = portfolio?.totalPnlPercent || 0;
  const isPositive = totalPnl >= 0;
  
  const sortedByChange = [...assets].sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0));
  const topGainer = sortedByChange[0];
  const topLoser = sortedByChange[sortedByChange.length - 1];
  
  const { data: historyData } = useQuery<{ success: boolean; snapshots: PortfolioSnapshot[] }>({
    queryKey: ['/api/portfolios', portfolioId, 'history'],
    enabled: !!portfolioId && assets.length > 0,
  });
  
  const periodReturns = useMemo(() => {
    const snapshots = historyData?.snapshots || [];
    const currentValue = portfolio?.totalValue || 0;
    const costBasis = portfolio?.totalCostBasis || 0;
    
    const getReturnForDays = (days: number): number => {
      if (currentValue === 0) return 0;
      
      // If no historical snapshots, fall back to total PnL
      if (snapshots.length === 0) {
        return costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
      }
      
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      
      // Snapshots are ordered newest first (desc), so find the first one older than target
      const olderSnapshots = snapshots.filter(s => new Date(s.snapshotDate) <= targetDate);
      const closestSnapshot = olderSnapshots.length > 0 ? olderSnapshots[0] : null;
      
      // If no snapshot exists for that period, use the oldest available or cost basis
      if (!closestSnapshot) {
        const oldestSnapshot = snapshots[snapshots.length - 1];
        if (oldestSnapshot && new Date(oldestSnapshot.snapshotDate) > targetDate) {
          // Snapshot is newer than target, use cost basis instead
          return costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
        }
        return oldestSnapshot && oldestSnapshot.totalValue > 0 
          ? ((currentValue - oldestSnapshot.totalValue) / oldestSnapshot.totalValue) * 100 
          : 0;
      }
      
      if (closestSnapshot.totalValue === 0) return 0;
      return ((currentValue - closestSnapshot.totalValue) / closestSnapshot.totalValue) * 100;
    };
    
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const daysThisYear = Math.floor((Date.now() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      { label: '1D', value: getReturnForDays(1) },
      { label: '1W', value: getReturnForDays(7) },
      { label: '1M', value: getReturnForDays(30) },
      { label: '3M', value: getReturnForDays(90) },
      { label: 'YTD', value: getReturnForDays(daysThisYear) },
      { label: 'ALL', value: totalPnlPercent },
    ];
  }, [historyData, portfolio?.totalValue, portfolio?.totalCostBasis, totalPnlPercent]);

  if (assets.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-lg">
        <div className="text-center">
          <History className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Add assets to see performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {periodReturns.map((period) => (
          <div 
            key={period.label}
            className="p-3 surface-1 rounded-lg text-center"
          >
            <span className="text-[10px] text-gray-500 block mb-1">{period.label}</span>
            <span className={cn("text-sm font-bold", period.value >= 0 ? 'text-green-400' : 'text-red-400')}>
              {period.value >= 0 ? '+' : ''}{period.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Best Performer</span>
          </div>
          {topGainer ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{topGainer.symbol}</span>
              <span className="text-sm font-bold text-green-400">
                +{Math.max(0, topGainer.priceChange24h || 0).toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">--</p>
          )}
        </div>
        
        <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Worst Performer</span>
          </div>
          {topLoser && (topLoser.priceChange24h || 0) < 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{topLoser.symbol}</span>
              <span className="text-sm font-bold text-red-400">
                {(topLoser.priceChange24h || 0).toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">--</span>
              <span className="text-xs text-gray-500">No losers</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 surface-1 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <div className="text-right">
            <span className={cn("text-lg font-bold", isPositive ? 'text-green-400' : 'text-red-400')}>
              {isPositive ? '+' : ''}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={cn("text-xs ml-2", isPositive ? 'text-green-400/70' : 'text-red-400/70')}>
              ({isPositive ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalTracker({ currentValue }: { currentValue: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalType, setNewGoalType] = useState('net_worth');
  const { toast } = useToast();
  
  const { data: goalsData, isLoading, refetch } = useQuery<{ success: boolean; goals: PortfolioGoal[] }>({
    queryKey: ['/api/portfolio-goals'],
  });
  
  const goals = goalsData?.goals || [];
  
  const createGoalMutation = useMutation({
    mutationFn: async (data: { name: string; targetAmount: number; deadline?: string; goalType: string }) => {
      return apiRequest('/api/portfolio-goals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Goal created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-goals'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create goal', description: error.message, variant: 'destructive' });
    },
  });
  
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return apiRequest(`/api/portfolio-goals/${goalId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: 'Goal deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-goals'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete goal', description: error.message, variant: 'destructive' });
    },
  });
  
  const resetForm = () => {
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDeadline('');
    setNewGoalType('net_worth');
  };
  
  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalTarget) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    createGoalMutation.mutate({
      name: newGoalName,
      targetAmount: parseFloat(newGoalTarget),
      deadline: newGoalDeadline || undefined,
      goalType: newGoalType,
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="p-3 surface-1 rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.length === 0 ? (
        <div className="text-center py-4">
          <Target className="w-6 h-6 mx-auto text-gray-600 mb-2" />
          <p className="text-xs text-gray-500">No goals set yet</p>
        </div>
      ) : (
        goals.map((goal) => {
          const progress = Math.min(100, (currentValue / goal.targetAmount) * 100);
          const daysLeft = goal.deadline ? Math.max(0, Math.floor((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
          return (
            <div key={goal.id} className="p-3 surface-1 rounded-lg group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{goal.name}</span>
                <div className="flex items-center gap-2">
                  {daysLeft !== null && <span className="text-xs text-gray-500">{daysLeft}d left</span>}
                  <button 
                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                    data-testid={`delete-goal-${goal.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
                <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between mt-2 text-[11px] sm:text-[10px] text-gray-500">
                <span>${currentValue.toLocaleString()}</span>
                <span>Goal: ${goal.targetAmount.toLocaleString()}</span>
              </div>
            </div>
          );
        })
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-xs text-purple-400 hover:text-purple-300" data-testid="add-goal-button">
            <Plus className="w-3 h-3 mr-1" /> Add Goal
          </Button>
        </DialogTrigger>
        <DialogContent className="surface-2 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300 text-sm">Goal Name *</Label>
              <Input
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g., Financial Freedom"
                className="mt-1"
                data-testid="goal-name-input"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Target Amount *</Label>
              <Input
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="100000"
                className="mt-1"
                data-testid="goal-target-input"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Deadline (Optional)</Label>
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="mt-1"
                data-testid="goal-deadline-input"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Goal Type</Label>
              <Select value={newGoalType} onValueChange={setNewGoalType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="surface-2">
                  <SelectItem value="net_worth">Net Worth Target</SelectItem>
                  <SelectItem value="savings">Savings Goal</SelectItem>
                  <SelectItem value="investment_return">Investment Return</SelectItem>
                  <SelectItem value="asset_target">Asset Target</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleCreateGoal} 
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-500"
              disabled={createGoalMutation.isPending}
              data-testid="create-goal-button"
            >
              {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CorrelationMatrix({ assets, portfolioId }: { assets: PortfolioAsset[]; portfolioId?: string }) {
  const { data: correlationData, isLoading } = useQuery<{ success: boolean; correlations: Record<string, Record<string, number>> }>({
    queryKey: ['/api/portfolios', portfolioId, 'correlations'],
    enabled: !!portfolioId && assets.length >= 2,
  });
  
  if (assets.length < 2) {
    return (
      <div className="text-center py-4">
        <PieChart className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add 2+ assets to see correlations</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <RefreshCw className="w-6 h-6 mx-auto text-gray-600 mb-2 animate-spin" />
        <p className="text-xs text-gray-500">Loading correlations...</p>
      </div>
    );
  }

  const topAssets = assets.slice(0, 5);
  const correlations = correlationData?.correlations || {};

  const getCorrelationColor = (val: number) => {
    if (val >= 0.8) return 'bg-red-500/60 text-white';
    if (val >= 0.5) return 'bg-orange-500/40 text-white';
    if (val >= 0.2) return 'bg-yellow-500/30 text-white';
    if (val >= -0.2) return 'bg-gray-500/30 text-gray-300';
    if (val >= -0.5) return 'bg-cyan-500/30 text-white';
    return 'bg-blue-500/40 text-white';
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full text-xs min-w-[280px]">
        <thead>
          <tr>
            <th className="p-1.5"></th>
            {topAssets.map(a => (
              <th key={a.symbol} className="p-1.5 text-gray-400 font-medium text-[11px]">{a.symbol}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topAssets.map(a => (
            <tr key={a.symbol}>
              <td className="p-1.5 text-gray-400 font-medium text-[11px]">{a.symbol}</td>
              {topAssets.map(b => {
                const corrValue = correlations[a.symbol]?.[b.symbol] ?? (a.symbol === b.symbol ? 1 : 0.5);
                return (
                  <td key={b.symbol} className="p-1.5">
                    <div className={cn(
                      "w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[11px] sm:text-[10px] font-medium",
                      getCorrelationColor(corrValue)
                    )}>
                      {corrValue.toFixed(1)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] sm:text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/60"></div> High
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-500/30"></div> Low
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500/40"></div> Negative
        </span>
      </div>
    </div>
  );
}

function IncomeTracker({ assets }: { assets: PortfolioAsset[] }) {
  const dividendAssets = assets.filter(a => 
    ['stock', 'etf', 'retirement'].includes(a.assetType)
  );

  const estimatedAnnualDividends = dividendAssets.reduce((sum, a) => {
    const yieldRate = a.assetType === 'etf' ? 0.025 : a.assetType === 'stock' ? 0.02 : 0.015;
    return sum + (a.currentValue || 0) * yieldRate;
  }, 0);

  const stakingAssets = assets.filter(a => a.assetType === 'crypto');
  const estimatedStakingRewards = stakingAssets.reduce((sum, a) => {
    const stakingRate = ['ETH', 'SOL', 'ADA', 'DOT'].includes(a.symbol) ? 0.05 : 0.02;
    return sum + (a.currentValue || 0) * stakingRate;
  }, 0);

  const totalPassiveIncome = estimatedAnnualDividends + estimatedStakingRewards;

  if (assets.length === 0) {
    return (
      <div className="text-center py-4">
        <DollarSign className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add assets to estimate passive income</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Est. Annual Passive Income</span>
          <Badge className="text-[10px] bg-green-500/20 text-green-400">Projected</Badge>
        </div>
        <p className="text-xl font-bold text-green-400">${totalPassiveIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className="text-[11px] sm:text-[10px] text-gray-500 mt-1">${(totalPassiveIncome / 12).toFixed(0)}/month</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 surface-1 rounded-lg">
          <span className="text-[11px] sm:text-[10px] text-gray-400">Dividends</span>
          <p className="text-sm font-medium text-white">${estimatedAnnualDividends.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-2 surface-1 rounded-lg">
          <span className="text-[11px] sm:text-[10px] text-gray-400">Staking Rewards</span>
          <p className="text-sm font-medium text-white">${estimatedStakingRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      <div className="text-[11px] sm:text-[10px] text-gray-500 text-center">
        Based on avg yields: Stocks ~2%, ETFs ~2.5%, Staking ~5%
      </div>
    </div>
  );
}

const NewsAggregator = memo(function NewsAggregator({ assets }: { assets: PortfolioAsset[] }) {
  const symbols = useMemo(() => assets.map(a => a.symbol).join(','), [assets]);
  
  const { data: newsData, isLoading, error } = useQuery<{ success: boolean; news: NewsItem[] }>({
    queryKey: ['/api/portfolio-news', { symbols }],
    enabled: assets.length > 0,
    staleTime: 600000, // 10 minutes - news doesn't change frequently
    refetchOnWindowFocus: false,
  });
  
  const newsItems = newsData?.news || [];

  if (assets.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add assets to see relevant news</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-2.5 surface-1 rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error || newsItems.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">No relevant news found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {newsItems.slice(0, 4).map((item, i) => (
        <div 
          key={i} 
          className="p-2.5 surface-1 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer group"
          onClick={() => item.url && window.open(item.url, '_blank')}
        >
          <div className="flex items-start gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
              item.sentiment === 'bullish' ? 'bg-green-400' : item.sentiment === 'bearish' ? 'bg-red-400' : 'bg-gray-400'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[11px] sm:text-[9px] px-1.5 py-0.5 text-muted-foreground border-border">{item.symbol}</Badge>
                <span className="text-[11px] sm:text-[10px] text-gray-500">{item.source} • {item.time}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="w-full text-xs text-purple-400 hover:text-purple-300">
        View All News <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
});

const stockSectors: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', META: 'Technology', NVDA: 'Technology', AMD: 'Technology', INTC: 'Technology', TSM: 'Technology', AVGO: 'Technology', ORCL: 'Technology', CRM: 'Technology',
  AMZN: 'Consumer Discretionary', TSLA: 'Consumer Discretionary', HD: 'Consumer Discretionary', MCD: 'Consumer Discretionary', NKE: 'Consumer Discretionary', SBUX: 'Consumer Discretionary',
  JPM: 'Financials', BAC: 'Financials', WFC: 'Financials', GS: 'Financials', MS: 'Financials', V: 'Financials', MA: 'Financials', AXP: 'Financials',
  JNJ: 'Healthcare', PFE: 'Healthcare', UNH: 'Healthcare', MRK: 'Healthcare', ABBV: 'Healthcare', LLY: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy',
  PG: 'Consumer Staples', KO: 'Consumer Staples', PEP: 'Consumer Staples', WMT: 'Consumer Staples', COST: 'Consumer Staples',
  DIS: 'Communication Services', NFLX: 'Communication Services', T: 'Communication Services', VZ: 'Communication Services',
  BA: 'Industrials', CAT: 'Industrials', UPS: 'Industrials', HON: 'Industrials',
  VTI: 'Broad Market ETF', VOO: 'S&P 500 ETF', SPY: 'S&P 500 ETF', QQQ: 'Tech ETF', IWM: 'Small Cap ETF',
  BTC: 'Cryptocurrency', ETH: 'Cryptocurrency', SOL: 'Cryptocurrency', DOGE: 'Cryptocurrency', XRP: 'Cryptocurrency',
};

const sectorColors: Record<string, string> = {
  'Technology': '#3b82f6',
  'Financials': '#22c55e',
  'Healthcare': '#ef4444',
  'Energy': '#f59e0b',
  'Consumer Discretionary': '#8b5cf6',
  'Consumer Staples': '#06b6d4',
  'Communication Services': '#ec4899',
  'Industrials': '#84cc16',
  'Broad Market ETF': '#6366f1',
  'S&P 500 ETF': '#0ea5e9',
  'Tech ETF': '#a855f7',
  'Small Cap ETF': '#14b8a6',
  'Cryptocurrency': '#f97316',
  'Other Stocks': '#64748b',
  'ETF': '#9333ea',
  'Other': '#94a3b8',
};

const SectorBreakdownChart = memo(function SectorBreakdownChart({ assets }: { assets: PortfolioAsset[] }) {
  const sectorData = useMemo(() => {
    const sectorTotals: Record<string, number> = {};
    let total = 0;
    
    assets.forEach(asset => {
      let sector = stockSectors[asset.symbol.toUpperCase()];
      if (!sector) {
        if (asset.assetType === 'crypto') sector = 'Cryptocurrency';
        else if (asset.assetType === 'etf') sector = 'ETF';
        else if (asset.assetType === 'stock') sector = 'Other Stocks';
        else sector = 'Other';
      }
      sectorTotals[sector] = (sectorTotals[sector] || 0) + (asset.currentValue || 0);
      total += asset.currentValue || 0;
    });
    
    return Object.entries(sectorTotals)
      .map(([sector, value]) => ({
        sector,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: sectorColors[sector] || sectorColors.Other,
      }))
      .filter(s => s.percent > 0)
      .sort((a, b) => b.percent - a.percent);
  }, [assets]);

  if (assets.length === 0 || sectorData.length === 0) {
    return (
      <div className="text-center py-6">
        <PieChart className="w-8 h-8 mx-auto text-gray-600 mb-2" />
        <p className="text-sm text-gray-400">Add assets to see sector breakdown</p>
      </div>
    );
  }

  let cumulativeRotation = 0;

  return (
    <div data-testid="sector-breakdown-chart">
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {sectorData.map((item) => {
              const sliceAngle = (item.percent / 100) * 360;
              const startAngle = cumulativeRotation;
              cumulativeRotation += sliceAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = ((startAngle + sliceAngle) * Math.PI) / 180;

              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);

              const largeArc = sliceAngle > 180 ? 1 : 0;

              return (
                <path
                  key={item.sector}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="0.5"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="#0f172a" />
          </svg>
        </div>
      </div>
      <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
        {sectorData.slice(0, 8).map((item) => (
          <div key={item.sector} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-accent/40 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-300">{item.sector}</span>
            </div>
            <span className="text-xs text-white font-medium">{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

interface ConnectedAccount {
  id: string;
  name: string;
  type: 'brokerage' | 'crypto' | 'bank';
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

const demoConnectedAccounts: ConnectedAccount[] = [
  { id: '1', name: 'Robinhood', type: 'brokerage', status: 'connected', lastSync: '2 hours ago' },
  { id: '2', name: 'Fidelity', type: 'brokerage', status: 'connected', lastSync: '1 day ago' },
  { id: '3', name: 'Coinbase', type: 'crypto', status: 'connected', lastSync: '30 mins ago' },
  { id: '4', name: 'Schwab', type: 'brokerage', status: 'disconnected' },
];

function ConnectedAccountsSection() {
  const { toast } = useToast();
  
  const getAccountIcon = (type: ConnectedAccount['type']) => {
    switch (type) {
      case 'crypto': return Bitcoin;
      case 'bank': return Landmark;
      default: return Building2;
    }
  };
  
  return (
    <div data-testid="connected-accounts-section">
      <div className="space-y-2">
        {demoConnectedAccounts.map((account) => {
          const Icon = getAccountIcon(account.type);
          const isConnected = account.status === 'connected';
          
          return (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 surface-1 rounded-lg"
              data-testid={`connected-account-${account.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isConnected ? "bg-green-500/10" : "bg-gray-500/10"
                )}>
                  <Icon className={cn("w-4 h-4", isConnected ? "text-green-400" : "text-gray-500")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{account.name}</p>
                  {account.lastSync && (
                    <p className="text-[10px] text-gray-500">Synced {account.lastSync}</p>
                  )}
                </div>
              </div>
              <Badge className={cn(
                "text-[10px]",
                isConnected ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}>
                {isConnected ? <Link2 className="w-2.5 h-2.5 mr-1" /> : <Unlink className="w-2.5 h-2.5 mr-1" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          );
        })}
      </div>
      <Button
        variant="outline"
        className="w-full mt-3 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs h-8"
        onClick={() => toast({ title: 'Coming Soon', description: 'Plaid integration for automatic account syncing' })}
        data-testid="button-connect-new-account"
      >
        <Plus className="w-3 h-3 mr-1.5" />
        Connect New Account
      </Button>
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AIAdvisorChat({ portfolioId, totalValue, assets, allocation }: { 
  portfolioId: string; 
  totalValue: number; 
  assets: PortfolioAsset[];
  allocation: Record<string, number>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const suggestedQuestions = [
    "How can I reduce risk?",
    "Should I rebalance?",
    "Tax saving opportunities?",
    "Best sectors to invest in?",
  ];
  
  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await apiRequest('/api/portfolio/advisor-chat', {
        method: 'POST',
        body: JSON.stringify({
          portfolioId,
          question,
          context: { totalValue, assets: assets.slice(0, 10), allocation }
        }),
      });
      
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.response || response.message || "I apologize, but I couldn't generate a response. Please try again."
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again later or contact support if the issue persists."
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };
  
  return (
    <Card className="bg-gradient-to-r from-slate-900 via-purple-900/10 to-slate-900 border-purple-500/30" data-testid="ai-advisor-chat">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white text-sm">AI Financial Advisor</h3>
              <p className="text-[10px] text-gray-500">Ask questions about your portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30 text-purple-300 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              AI
            </Badge>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <div className="h-[200px] overflow-y-auto mb-3 space-y-2 surface-1 rounded-lg p-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-3">Ask me anything about your portfolio</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-6 px-2 border-border text-muted-foreground hover:text-foreground hover:border-neon-purple/60"
                        onClick={() => sendMessage(q)}
                        data-testid={`suggested-question-${i}`}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-2 rounded-lg text-xs",
                    msg.role === 'user' 
                      ? "bg-purple-500/20 text-purple-100 ml-8" 
                      : "bg-muted text-foreground mr-8"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-muted text-muted-foreground p-2 rounded-lg text-xs mr-8 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about your portfolio..."
                className="text-xs h-9"
                disabled={isLoading}
                data-testid="input-advisor-chat"
              />
              <Button
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 h-9 px-3"
                data-testid="button-send-advisor"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface AssetNewsItem {
  title: string;
  source: string;
  time: string;
  sentiment?: string;
  url?: string;
}

const AssetNewsFeed = memo(function AssetNewsFeed({ assets }: { assets: PortfolioAsset[] }) {
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(new Set());
  
  const uniqueSymbols = useMemo(() => 
    Array.from(new Set(assets.map(a => a.symbol))).slice(0, 6), 
    [assets]
  );
  
  const toggleSymbol = (symbol: string) => {
    setExpandedSymbols(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add assets to see relevant news</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="asset-news-feed">
      {uniqueSymbols.map((symbol) => (
        <AssetNewsSection 
          key={symbol} 
          symbol={symbol} 
          isExpanded={expandedSymbols.has(symbol)}
          onToggle={() => toggleSymbol(symbol)}
        />
      ))}
    </div>
  );
});

function AssetNewsSection({ symbol, isExpanded, onToggle }: { symbol: string; isExpanded: boolean; onToggle: () => void }) {
  const { data: newsData, isLoading } = useQuery<{ success: boolean; news: AssetNewsItem[] }>({
    queryKey: ['/api/portfolio/news', symbol],
    enabled: isExpanded,
    staleTime: 600000,
  });
  
  const newsItems = newsData?.news || [];
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger 
        className="w-full p-2 surface-1 rounded-lg flex items-center justify-between hover:bg-accent/40 transition-colors"
        data-testid={`news-toggle-${symbol}`}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground border-border">{symbol}</Badge>
          <span className="text-xs text-gray-400">News</span>
        </div>
        <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1 pl-2">
          {isLoading ? (
            <div className="p-2 text-[10px] text-gray-500 flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading news...
            </div>
          ) : newsItems.length === 0 ? (
            <p className="p-2 text-[10px] text-gray-500">No recent news</p>
          ) : (
            <>
              {newsItems.slice(0, 3).map((item, i) => (
                <div 
                  key={i}
                  className="p-2 surface-1 surface-interactive rounded cursor-pointer"
                  onClick={() => item.url && window.open(item.url, '_blank')}
                >
                  <p className="text-[11px] text-gray-300 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500">{item.source}</span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500">{item.time}</span>
                    {item.sentiment && (
                      <Badge className={cn(
                        "text-[9px] px-1 py-0",
                        item.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                        item.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      )}>
                        {item.sentiment}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-purple-400 hover:text-purple-300 h-6">
                View More <ArrowRight className="w-2.5 h-2.5 ml-1" />
              </Button>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  thumb?: string;
  exchange?: string;
  marketCapRank?: number;
  id?: string;
}

function AddAssetDialog({ portfolioId, onSuccess }: { portfolioId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'manual' | 'cash' | 'retirement'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cryptoResults, setCryptoResults] = useState<SearchResult[]>([]);
  const [stockResults, setStockResults] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [assetType, setAssetType] = useState('crypto');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [accountName, setAccountName] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionFrequency, setContributionFrequency] = useState('monthly');
  const { toast } = useToast();

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

  const addAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/portfolios/${portfolioId}/assets`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Asset added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios', portfolioId] });
      onSuccess();
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add asset', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setSymbol('');
    setName('');
    setQuantity('');
    setAvgCost('');
    setAccountName('');
    setSelectedAsset(null);
    setSearchQuery('');
    setCryptoResults([]);
    setStockResults([]);
    setMode('search');
    setGrowthRate('');
    setContributionAmount('');
    setContributionFrequency('monthly');
  };

  const handleSelectAsset = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setSymbol(asset.symbol.toUpperCase());
    setName(asset.name);
    setAssetType(asset.type);
    setSearchQuery('');
    setCryptoResults([]);
    setStockResults([]);
  };

  const handleSubmit = () => {
    if (!symbol || !name || !quantity) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    addAssetMutation.mutate({
      assetType,
      symbol,
      name,
      quantity: parseFloat(quantity),
      averageCostBasis: avgCost ? parseFloat(avgCost) : 0,
      accountName,
    });
  };

  const hasResults = cryptoResults.length > 0 || stockResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400" data-testid="add-asset-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="surface-2 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Add Asset</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => { 
          setMode(v as any); 
          if (v !== mode) { 
            setSelectedAsset(null); 
            setSearchQuery(''); 
            setCryptoResults([]); 
            setStockResults([]); 
            // Set appropriate default assetType for each tab
            if (v === 'cash') {
              setAssetType('cash');
              setSymbol('USD');
              setName('US Dollar');
            } else if (v === 'retirement') {
              setAssetType('401k');
              setSymbol('RET');
              setName('');
            } else if (v === 'manual') {
              setAssetType('crypto');
            } else {
              setAssetType('crypto');
            }
          } 
        }} className="w-full">
          <TabsList className="w-full bg-transparent border-b border-border p-0 h-auto rounded-none gap-0">
            <TabsTrigger value="search" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-white text-gray-500 py-3 bg-transparent data-[state=active]:bg-transparent hover:text-gray-300 transition-colors">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-white text-gray-500 py-3 bg-transparent data-[state=active]:bg-transparent hover:text-gray-300 transition-colors">
              <Banknote className="w-4 h-4 mr-2" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="retirement" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-white text-gray-500 py-3 bg-transparent data-[state=active]:bg-transparent hover:text-gray-300 transition-colors">
              <Landmark className="w-4 h-4 mr-2" />
              Retirement
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-white text-gray-500 py-3 bg-transparent data-[state=active]:bg-transparent hover:text-gray-300 transition-colors">
              <Edit2 className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            {!selectedAsset ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Type to search stocks or crypto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                    data-testid="input-asset-search"
                    autoFocus
                  />
                  {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
                </div>

                {!searchQuery && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Search for stocks like AAPL, TSLA</p>
                    <p className="text-sm">or crypto like BTC, ETH</p>
                  </div>
                )}

                {hasResults && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {stockResults.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-muted text-xs text-muted-foreground font-medium flex items-center gap-2 border-b border-border">
                          <Building2 className="w-3 h-3" /> Stocks
                        </div>
                        {stockResults.slice(0, 5).map((result) => (
                          <button
                            key={result.symbol}
                            onClick={() => handleSelectAsset({ ...result, type: 'stock' })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 text-left border-b border-border last:border-b-0 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{result.symbol}</p>
                              <p className="text-xs text-gray-500 truncate">{result.name}</p>
                            </div>
                            <span className="text-xs text-gray-500">{result.exchange}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {cryptoResults.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-muted text-xs text-muted-foreground font-medium flex items-center gap-2 border-b border-border">
                          <Bitcoin className="w-3 h-3" /> Crypto
                        </div>
                        {cryptoResults.slice(0, 5).map((result: any) => (
                          <button
                            key={result.id || result.symbol}
                            onClick={() => handleSelectAsset({ symbol: result.symbol, name: result.name, type: 'crypto', thumb: result.thumb })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 text-left border-b border-border last:border-b-0 transition-colors"
                          >
                            {result.thumb ? (
                              <img src={result.thumb} alt={result.symbol} className="w-9 h-9 rounded-lg" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Bitcoin className="w-4 h-4 text-orange-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{result.symbol.toUpperCase()}</p>
                              <p className="text-xs text-gray-500 truncate">{result.name}</p>
                            </div>
                            {result.marketCapRank && <span className="text-xs text-gray-500">#{result.marketCapRank}</span>}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {searchQuery.length >= 2 && !hasResults && !isSearching && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different symbol or name</p>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="cash" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-sm">Type</Label>
                <Select value={assetType} onValueChange={(v) => { setAssetType(v); setSymbol(v === 'cash' ? 'USD' : v === 'stablecoin' ? 'USDC' : 'BANK'); setName(v === 'cash' ? 'US Dollar' : v === 'stablecoin' ? 'USD Coin' : 'Bank Account'); }}>
                  <SelectTrigger className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="surface-2">
                    <SelectItem value="cash">Cash (USD)</SelectItem>
                    <SelectItem value="stablecoin">Stablecoin (USDC/USDT)</SelectItem>
                    <SelectItem value="other">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Amount ($)</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setAvgCost('1'); }}
                  placeholder="10,000"
                  className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account Name (optional)</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Chase Checking, Coinbase"
                  className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button
                onClick={() => {
                  if (!quantity) { toast({ title: 'Enter an amount', variant: 'destructive' }); return; }
                  const finalSymbol = assetType === 'cash' ? 'USD' : assetType === 'stablecoin' ? 'USDC' : 'BANK';
                  const finalName = assetType === 'cash' ? 'US Dollar' : assetType === 'stablecoin' ? 'USD Coin' : 'Bank Account';
                  addAssetMutation.mutate({
                    assetType: assetType === 'other' ? 'cash' : assetType,
                    symbol: finalSymbol,
                    name: accountName || finalName,
                    quantity: parseFloat(quantity),
                    averageCostBasis: 1,
                    accountName: accountName || finalName,
                  });
                }}
                disabled={addAssetMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium"
              >
                {addAssetMutation.isPending ? 'Adding...' : 'Add Cash Balance'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="retirement" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-sm">Account Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="surface-2">
                    <SelectItem value="401k">401(k)</SelectItem>
                    <SelectItem value="ira">Traditional IRA</SelectItem>
                    <SelectItem value="roth_ira">Roth IRA</SelectItem>
                    <SelectItem value="403b">403(b)</SelectItem>
                    <SelectItem value="pension">Pension</SelectItem>
                    <SelectItem value="sep_ira">SEP IRA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account Name</Label>
                <Input 
                  value={accountName} 
                  onChange={(e) => { setAccountName(e.target.value); setName(e.target.value); setSymbol('RET'); }}
                  placeholder="e.g., Fidelity 401k, Vanguard IRA" 
                  className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" 
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Current Balance ($)</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => { setQuantity(e.target.value); setAvgCost('1'); }}
                  placeholder="50,000" 
                  className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" 
                />
              </div>
              <div className="p-3 surface-1 rounded-lg">
                <Label className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Automatic Growth Settings
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-500 text-xs">Annual Growth Rate (%)</Label>
                    <Input 
                      type="number" 
                      value={growthRate} 
                      onChange={(e) => setGrowthRate(e.target.value)}
                      placeholder="7" 
                      className="h-10 mt-1 focus-visible:ring-2 focus-visible:ring-ring" 
                    />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Contribution ($)</Label>
                    <Input 
                      type="number" 
                      value={contributionAmount} 
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="500" 
                      className="h-10 mt-1 focus-visible:ring-2 focus-visible:ring-ring" 
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-gray-500 text-xs">Contribution Frequency</Label>
                  <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="surface-2">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!quantity || !accountName) { toast({ title: 'Enter balance and account name', variant: 'destructive' }); return; }
                  addAssetMutation.mutate({
                    assetType: 'retirement',
                    symbol: assetType.toUpperCase(),
                    name: accountName,
                    quantity: parseFloat(quantity),
                    averageCostBasis: 1,
                    accountName,
                    annualGrowthRate: growthRate ? parseFloat(growthRate) : undefined,
                    contributionAmount: contributionAmount ? parseFloat(contributionAmount) : undefined,
                    contributionFrequency: contributionFrequency || undefined,
                  });
                }}
                disabled={addAssetMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium"
              >
                {addAssetMutation.isPending ? 'Adding...' : 'Add Retirement Account'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-sm">Asset Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="surface-2">
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="commodity">Commodity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-sm">Symbol</Label>
                  <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="BTC" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitcoin" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-sm">Quantity</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Avg Cost ($)</Label>
                  <Input type="number" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="0.00" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account (optional)</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Coinbase, Fidelity..." className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <Button onClick={handleSubmit} disabled={addAssetMutation.isPending} className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium">
                {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
              </Button>
            </div>
          </TabsContent>

          {selectedAsset && mode === 'search' && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 p-3 surface-1 rounded-lg">
                {selectedAsset.thumb ? (
                  <img src={selectedAsset.thumb} alt={selectedAsset.symbol} className="w-10 h-10 rounded-lg" />
                ) : (
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedAsset.type === 'crypto' ? 'bg-orange-500/10' : 'bg-blue-500/10')}>
                    {selectedAsset.type === 'crypto' ? <Bitcoin className="w-5 h-5 text-orange-400" /> : <Building2 className="w-5 h-5 text-blue-400" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">{selectedAsset.symbol.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{selectedAsset.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedAsset(null); setSymbol(''); setName(''); }} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-sm">Quantity</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Avg Cost ($)</Label>
                  <Input type="number" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="0.00" className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account (optional)</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Coinbase, Fidelity..." className="h-11 mt-1.5 focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <Button onClick={handleSubmit} disabled={addAssetMutation.isPending} className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium">
                {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
              </Button>
            </div>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const AssetRow = memo(function AssetRow({ asset, portfolioId, showValues = true, isRecentlyUpdated = false, onRefresh }: { asset: PortfolioAsset; portfolioId: string; showValues?: boolean; isRecentlyUpdated?: boolean; onRefresh?: () => void }) {
  const Icon = assetTypeIcons[asset.assetType] || Wallet;
  const colorGradient = assetTypeColors[asset.assetType] || assetTypeColors.other;
  
  // Cash and stablecoins should never show price changes
  const isCashLike = asset.assetType === 'cash' || asset.assetType === 'stablecoin';
  const priceChange = isCashLike ? 0 : (asset.priceChange24h || 0);
  const is24hPositive = priceChange >= 0;
  
  // For retirement accounts, don't show % PnL (it's not meaningful for contribution-based accounts)
  const isRetirement = asset.assetType === 'retirement';
  const isPnlPositive = (asset.unrealizedPnlPercent || 0) >= 0;
  const showSparkline = !isCashLike && !isRetirement;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 surface-1 rounded-lg border hover:border-border hover:bg-accent/40 transition-colors cursor-pointer group relative",
        isRecentlyUpdated ? 'border-green-500/40' : 'border-border/30'
      )}
    >
      {isRecentlyUpdated && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.5 }}
          className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-green-500"
        />
      )}
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br relative", colorGradient)}>
          <Icon className="w-4 h-4 text-white" />
          {isRecentlyUpdated && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">{asset.symbol}</span>
            <span className="text-[11px] sm:text-[10px] text-gray-500 uppercase">{asset.assetType}</span>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-[120px]">{asset.name}</p>
        </div>
        {showSparkline && (
          <div className="hidden sm:block">
            <Sparkline priceChange7d={asset.priceChange7d || 0} />
          </div>
        )}
      </div>
      <div className="text-right">
        <motion.p 
          animate={{ color: isRecentlyUpdated ? '#22c55e' : '#ffffff' }}
          transition={{ duration: 0.5 }}
          className="font-medium text-sm"
        >
          {showValues ? `$${asset.currentValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
        </motion.p>
        <div className="flex items-center justify-end gap-2">
          {!isCashLike && (
            <div className={cn("flex items-center gap-0.5 text-xs", is24hPositive ? 'text-green-400' : 'text-red-400')}>
              {is24hPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              <span>{is24hPositive ? '+' : ''}{priceChange.toFixed(1)}%</span>
            </div>
          )}
          {!isCashLike && !isRetirement && asset.unrealizedPnlPercent !== null && (
            <span className={cn("text-[10px] px-1 py-0.5 rounded", isPnlPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
              PnL {isPnlPositive ? '+' : ''}{(asset.unrealizedPnlPercent || 0).toFixed(0)}%
            </span>
          )}
          {isCashLike && (
            <span className="text-[10px] text-gray-500">Cash</span>
          )}
          {isRetirement && asset.unrealizedPnl !== null && (
            <span className={cn("text-[10px] px-1 py-0.5 rounded", isPnlPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
              {isPnlPositive ? '+' : ''}${Math.abs(asset.unrealizedPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
      <EditAssetDialog asset={asset} portfolioId={portfolioId} onSuccess={onRefresh || (() => {})} />
    </div>
  );
});

function EditAssetDialog({ asset, portfolioId, onSuccess }: { asset: PortfolioAsset; portfolioId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(asset.quantity.toString());
  const [avgCost, setAvgCost] = useState(asset.averageCostBasis?.toString() || '');
  const [accountName, setAccountName] = useState(asset.accountName || '');
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/portfolios/${portfolioId}/assets/${asset.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Asset updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios', portfolioId] });
      onSuccess();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update asset', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/portfolios/${portfolioId}/assets/${asset.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: 'Asset removed from portfolio' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios', portfolioId] });
      onSuccess();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete asset', description: error.message, variant: 'destructive' });
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/portfolios/${portfolioId}/assets/${asset.id}/recalculate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    onSuccess: (data: any) => {
      toast({ title: 'Price recalculated', description: data.message || 'Asset price and chart updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios', portfolioId] });
      onSuccess();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to recalculate price', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({
      quantity: parseFloat(quantity),
      averageCostBasis: avgCost ? parseFloat(avgCost) : undefined,
      accountName: accountName || undefined,
    });
  };

  const isCashLike = asset.assetType === 'cash' || asset.assetType === 'stablecoin';
  const Icon = assetTypeIcons[asset.assetType] || Wallet;
  const colorGradient = assetTypeColors[asset.assetType] || assetTypeColors.other;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          data-testid={`edit-asset-${asset.symbol}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="surface-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", colorGradient)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            Edit {asset.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 surface-1 rounded-lg">
            <div>
              <p className="font-medium text-white">{asset.symbol}</p>
              <p className="text-sm text-gray-400">{asset.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Price</p>
              <p className="font-medium text-white">${asset.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-sm">Quantity</Label>
              <Input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder="0.00" 
                className="h-11 mt-1.5" 
              />
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Avg Cost ($)</Label>
              <Input 
                type="number" 
                value={avgCost} 
                onChange={(e) => setAvgCost(e.target.value)} 
                placeholder="0.00" 
                className="h-11 mt-1.5"
                disabled={isCashLike}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-gray-400 text-sm">Account (optional)</Label>
            <Input 
              value={accountName} 
              onChange={(e) => setAccountName(e.target.value)} 
              placeholder="Coinbase, Fidelity..." 
              className="h-11 mt-1.5" 
            />
          </div>

          <div className="p-3 surface-1 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Value</span>
              <span className="text-white font-medium">
                ${(parseFloat(quantity || '0') * (asset.currentPrice || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            {!isCashLike && avgCost && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Est. PnL</span>
                <span className={cn("font-medium", 
                  (parseFloat(quantity || '0') * (asset.currentPrice || 0)) - (parseFloat(quantity || '0') * parseFloat(avgCost || '0')) >= 0 
                    ? 'text-green-400' : 'text-red-400'
                )}>
                  ${((parseFloat(quantity || '0') * (asset.currentPrice || 0)) - (parseFloat(quantity || '0') * parseFloat(avgCost || '0'))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            {/* Recalculate button - useful for fixing glitched prices */}
            {!isCashLike && (
              <Button 
                variant="outline" 
                onClick={() => recalculateMutation.mutate()} 
                disabled={recalculateMutation.isPending}
                className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              >
                {recalculateMutation.isPending ? 'Recalculating...' : <><RefreshCw className="w-4 h-4 mr-2" /> Fix Price & Chart</>}
              </Button>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => deleteMutation.mutate()} 
                disabled={deleteMutation.isPending}
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                data-testid={`delete-asset-${asset.symbol}`}
              >
                {deleteMutation.isPending ? 'Removing...' : <><Trash2 className="w-4 h-4 mr-2" /> Remove</>}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={updateMutation.isPending} 
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                data-testid={`save-asset-${asset.symbol}`}
              >
                {updateMutation.isPending ? 'Saving...' : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortfolioDashboard() {
  const [, navigate] = useLocation();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showRebalanceDialog, setShowRebalanceDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [showStressTestDialog, setShowStressTestDialog] = useState(false);
  const [showTransactionHistoryDialog, setShowTransactionHistoryDialog] = useState(false);
  
  const [alertSymbol, setAlertSymbol] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  
  const [customScenario, setCustomScenario] = useState<Record<string, number>>({
    crypto: 30,
    stock: 20,
    etf: 15,
    bond: 5,
    retirement: 10,
    cash: 0,
    stablecoin: 1,
    real_estate: 10,
    commodity: 15,
    other: 15,
  });
  
  const [targetAllocations, setTargetAllocations] = useState<Record<string, number>>({});
  
  const { toast } = useToast();

  const { data: portfoliosData, isLoading: portfoliosLoading } = useQuery<{ portfolios: Portfolio[] }>({
    queryKey: ['/api/portfolios'],
    refetchInterval: 180000, // 3 minutes - reduced for performance
    staleTime: 120000, // 2 minutes
  });

  const portfolios = portfoliosData?.portfolios || [];
  const activePortfolioId = selectedPortfolioId || portfolios[0]?.id;

  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery<{ portfolio: Portfolio; assets: PortfolioAsset[]; insights: any[] }>({
    queryKey: ['/api/portfolios', activePortfolioId],
    enabled: !!activePortfolioId,
    refetchInterval: 180000, // 3 minutes - reduced for performance
    staleTime: 120000, // 2 minutes
  });

  const { data: analysisData, refetch: refetchAnalysis } = useQuery<{ analysis: AIAnalysis }>({
    queryKey: ['/api/portfolios', activePortfolioId, 'ai-analysis'],
    enabled: !!activePortfolioId,
    refetchInterval: 600000, // 10 minutes - AI analysis is expensive
    staleTime: 300000, // 5 minutes
  });

  // Fetch portfolio analytics (Sharpe, Alpha, Beta, etc.)
  const { data: analyticsData, refetch: refetchAnalytics } = useQuery<{ analytics: {
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    alpha: number;
    ytdReturn: number;
    spReturn: number;
    outperformance: number;
    portfolioVolatility: number;
    diversificationScore: number;
  } }>({
    queryKey: ['/api/portfolios', activePortfolioId, 'analytics'],
    enabled: !!activePortfolioId,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000, // 5 minutes
  });

  // Fetch AI Trade Signals
  const { data: tradeSignalsData } = useQuery<{ signals: Array<{
    type: string;
    symbol: string;
    action: string;
    confidence: number;
    reason: string;
    targetPrice?: number;
    stopLoss?: number;
  }> }>({
    queryKey: ['/api/market/trade-signals'],
    enabled: !!activePortfolioId,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000, // 5 minutes
  });

  const analytics = analyticsData?.analytics;
  const tradeSignals = tradeSignalsData?.signals || [];

  // Fetch tax analytics with real long-term/short-term calculations
  const { data: taxData } = useQuery<{ taxAnalytics: {
    longTermAssetCount: number;
    shortTermAssetCount: number;
    longTermGains: number;
    longTermLosses: number;
    shortTermGains: number;
    shortTermLosses: number;
    totalEstTax: number;
    taxLossHarvestingOpportunities: Array<{
      symbol: string;
      name: string;
      loss: number;
      lossPercent: number;
      potentialTaxSavings: number;
      isLongTerm: boolean;
    }>;
  } }>({
    queryKey: ['/api/portfolios', activePortfolioId, 'tax-analytics'],
    enabled: !!activePortfolioId,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000, // 5 minutes
  });

  const taxAnalytics = taxData?.taxAnalytics;

  // Fetch price alerts
  const { data: alertsData, refetch: refetchAlerts } = useQuery<{ alerts: Array<{
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    alertType: string;
    targetPrice: number | null;
    currentPriceAtCreation: number;
    isActive: boolean;
    isTriggered: boolean;
    createdAt: string;
  }> }>({
    queryKey: ['/api/price-alerts'],
  });

  const priceAlerts = alertsData?.alerts || [];

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (data: { symbol: string; name: string; assetType: string; alertType: string; targetPrice: number; currentPriceAtCreation: number; portfolioId?: string }) => {
      return apiRequest('/api/price-alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-alerts'] });
      toast({ title: 'Alert Created!', description: 'You will be notified when the price target is reached' });
      setShowAlertDialog(false);
      setAlertSymbol('');
      setAlertTargetPrice('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create alert', description: error.message, variant: 'destructive' });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest(`/api/price-alerts/${alertId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-alerts'] });
      toast({ title: 'Alert deleted' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/portfolios/${activePortfolioId}/sync`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: 'Portfolio synced successfully' });
      refetchPortfolio();
      refetchAnalysis();
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({ name: 'My Portfolio' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      toast({ title: 'Portfolio created successfully!', description: 'Start adding your assets now.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create portfolio', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    },
  });

  const portfolio = portfolioData?.portfolio;
  const rawAssets = portfolioData?.assets || [];
  const insights = portfolioData?.insights || [];
  const analysis = analysisData?.analysis;
  
  // WebSocket price updates integration
  // Only subscribe to price updates for tradable assets (crypto, stock, etf, bond, commodity)
  // Skip cash, stablecoin, and retirement as they have static/user-defined values
  const assetSymbols = useMemo(() => {
    const skipTypes = ['cash', 'stablecoin', 'retirement'];
    return rawAssets
      .filter(a => !skipTypes.includes(a.assetType))
      .map(a => a.symbol);
  }, [rawAssets]);
  const { isConnected: wsConnected, connectionStatus, prices: livePrices, recentUpdates } = useWebSocketPrices(assetSymbols);
  
  // Merge live prices with asset data
  // Skip WebSocket price updates for cash, stablecoin, and retirement assets
  // These should maintain their static values (cash = $1, retirement = fixed dollar amount)
  const assets = useMemo(() => {
    const skipPriceUpdateTypes = ['cash', 'stablecoin', 'retirement'];
    
    return rawAssets.map(asset => {
      // Don't apply live price updates to cash-like assets
      if (skipPriceUpdateTypes.includes(asset.assetType)) {
        return asset;
      }
      
      const livePrice = livePrices.get(asset.symbol.toUpperCase());
      if (livePrice && livePrice.price > 0) {
        const newCurrentPrice = livePrice.price;
        const newCurrentValue = newCurrentPrice * asset.quantity;
        const newUnrealizedPnl = newCurrentValue - asset.totalCostBasis;
        const newUnrealizedPnlPercent = asset.totalCostBasis > 0 ? (newUnrealizedPnl / asset.totalCostBasis) * 100 : 0;
        return {
          ...asset,
          currentPrice: newCurrentPrice,
          currentValue: newCurrentValue,
          unrealizedPnl: newUnrealizedPnl,
          unrealizedPnlPercent: newUnrealizedPnlPercent,
          priceChange24h: livePrice.priceChange24h,
          priceLastUpdated: new Date(livePrice.timestamp).toISOString(),
        };
      }
      return asset;
    });
  }, [rawAssets, livePrices]);

  // Fetch portfolio events (Fed meetings, token unlocks, earnings)
  const symbolsString = assets.map(a => a.symbol).join(',');
  const { data: eventsData } = useQuery<{ events: Array<{
    id: string;
    date: string;
    title: string;
    type: 'earnings' | 'fed' | 'unlock' | 'halving' | 'network';
    symbol?: string;
    description?: string;
  }> }>({
    queryKey: ['/api/portfolio-events', symbolsString],
    enabled: assets.length > 0,
    staleTime: 1800000, // 30 minutes - events are fairly static
    refetchOnWindowFocus: false,
  });

  const portfolioEvents = eventsData?.events || [];
  
  // Auto-sync prices when portfolio loads and has assets
  useEffect(() => {
    if (activePortfolioId && rawAssets.length > 0 && !syncMutation.isPending) {
      // Check if last sync was more than 5 minutes ago
      const lastUpdated = rawAssets[0]?.priceLastUpdated;
      const needsSync = !lastUpdated || (Date.now() - new Date(lastUpdated).getTime() > 300000);
      if (needsSync) {
        syncMutation.mutate();
      }
    }
  }, [activePortfolioId, rawAssets.length]);
  
  // Calculate total PnL for header display
  const totalPnl = assets.reduce((sum, a) => sum + (a.unrealizedPnl || 0), 0);
  const totalPnlPercent = portfolio?.totalValue ? (totalPnl / (portfolio.totalValue - totalPnl)) * 100 : 0;
  const isPnlPositive = totalPnl >= 0;

  if (portfoliosLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-8 px-3 sm:px-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
                <Briefcase className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Portfolio Command Center
                </h1>
                <p className="text-sm text-gray-500">Unified asset management with AI intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Live connection status indicator */}
              {assets.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
                          connectionStatus === 'connected' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : connectionStatus === 'connecting'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        )}
                        data-testid="live-connection-status"
                      >
                        {connectionStatus === 'connected' ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            <span className="hidden sm:inline">LIVE</span>
                            <Wifi className="w-3 h-3 sm:hidden" />
                          </>
                        ) : connectionStatus === 'connecting' ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span className="hidden sm:inline">Connecting...</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3" />
                            <span className="hidden sm:inline">Offline</span>
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {connectionStatus === 'connected' 
                          ? 'Real-time price updates active' 
                          : connectionStatus === 'connecting'
                          ? 'Establishing connection...'
                          : 'Prices update on manual sync'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Total PnL indicator */}
              {assets.length > 0 && showValues && (
                <div className={cn("px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5", isPnlPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                  {isPnlPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{isPnlPositive ? '+' : ''}{totalPnlPercent.toFixed(1)}%</span>
                  <span className="text-xs opacity-70 ml-1 hidden sm:inline">${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/40 min-w-[44px] min-h-[44px]"
              >
                {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <div className="flex flex-col items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || !activePortfolioId}
                  className="border-border text-foreground hover:bg-accent/40 min-h-[44px]"
                  data-testid="sync-portfolio-button"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
                  <span className="hidden sm:inline">{syncMutation.isPending ? 'Syncing...' : 'Sync Prices'}</span>
                  <span className="sm:hidden">{syncMutation.isPending ? '...' : 'Sync'}</span>
                </Button>
                {assets[0]?.priceLastUpdated && (
                  <span className="text-[11px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">
                    Updated {new Date(assets[0].priceLastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              {activePortfolioId && (
                <AddAssetDialog portfolioId={activePortfolioId} onSuccess={() => refetchPortfolio()} />
              )}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-4" />

          {portfolios.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="surface-2 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Portfolio</h2>
                  <p className="text-gray-400">Track all your assets in one place with AI-powered insights.</p>
                </div>

                <Button
                  onClick={() => createPortfolioMutation.mutate()}
                  disabled={createPortfolioMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-6 rounded-xl"
                  data-testid="create-portfolio-button"
                >
                  {createPortfolioMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Portfolio
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/60">
                  {[
                    { icon: PieChart, label: 'Track All Assets', desc: 'Crypto, stocks, cash' },
                    { icon: Brain, label: 'AI Health Score', desc: 'Smart analysis' },
                    { icon: Shield, label: 'Private & Secure', desc: 'Your data stays safe' }
                  ].map((feature) => (
                    <div key={feature.label} className="text-center">
                      <feature.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm font-medium text-white">{feature.label}</p>
                      <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <>
              {portfolios.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {portfolios.map((p) => (
                    <Button
                      key={p.id}
                      variant={p.id === activePortfolioId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPortfolioId(p.id)}
                      className={p.id === activePortfolioId
                        ? 'bg-purple-500 text-white'
                        : 'border-border text-muted-foreground'
                      }
                    >
                      {p.name}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => createPortfolioMutation.mutate()}
                    className="text-purple-400"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Premium Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Total Value Card - Primary */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/30 border-purple-500/20 p-5 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-gray-400 text-sm font-medium">Net Worth</span>
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {showValues ? `$${(portfolio?.totalValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••••'}
                    </p>
                    <div className={cn("flex items-center gap-1.5 text-sm mt-2 font-medium", (portfolio?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                      <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded", (portfolio?.totalPnl || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10')}>
                        {(portfolio?.totalPnl || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{(portfolio?.totalPnlPercent || 0).toFixed(2)}%</span>
                      </div>
                      <span className="text-gray-500">
                        {showValues ? `${(portfolio?.totalPnl || 0) >= 0 ? '+' : ''}$${(portfolio?.totalPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Cost Basis Card */}
                <Card className="surface-2 surface-interactive p-5 hover:border-neon-cyan/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-gray-400 text-sm font-medium">Invested</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {showValues ? `$${(portfolio?.totalCostBasis || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••••'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Total cost basis</p>
                </Card>

                {/* Assets Count Card */}
                <Card className="surface-2 surface-interactive p-5 hover:border-emerald-500/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Layers className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-gray-400 text-sm font-medium">Holdings</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{assets.length}</p>
                  <p className="text-xs text-gray-500 mt-2">Positions tracked</p>
                </Card>

                {/* AI Health Score Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-amber-900/20 border-amber-500/20 p-5 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Brain className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-gray-400 text-sm font-medium">AI Score</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-white">{analysis?.healthScore || portfolio?.healthScore || '--'}</p>
                      <span className="text-gray-500 text-sm">/100</span>
                    </div>
                    <Badge className={cn("mt-2 text-xs", riskLevelColors[analysis?.riskLevel || portfolio?.riskLevel || ''] || 'text-gray-400 bg-gray-500/20')}>
                      {(analysis?.riskLevel || portfolio?.riskLevel || 'Analyzing...').replace('_', ' ')}
                    </Badge>
                  </div>
                </Card>
              </div>

              {/* Quick Actions Bar */}
              <Card className="surface-1 p-3 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        syncMutation.mutate();
                        refetchPortfolio();
                        refetchAnalysis();
                        refetchAnalytics();
                      }}
                      disabled={syncMutation.isPending}
                      className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                      data-testid="button-refresh"
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
                      {syncMutation.isPending ? 'Syncing...' : 'Refresh'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAlertDialog(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/40 hidden sm:flex"
                      data-testid="button-set-alert"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Set Alert
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRebalanceDialog(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/40 hidden sm:flex"
                      data-testid="button-rebalance"
                    >
                      <Scale className="w-4 h-4 mr-2" />
                      Rebalance
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTaxDialog(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/40 hidden md:flex"
                      data-testid="button-tax-loss"
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      Tax Loss
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTransactionHistoryDialog(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/40 hidden lg:flex"
                      data-testid="button-transaction-history"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Transactions
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                      <Radio className="w-3 h-3 mr-1 text-green-400" />
                      Live
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {assets[0]?.priceLastUpdated 
                        ? `Updated ${new Date(assets[0].priceLastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Updated just now'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Net Worth Historical Chart */}
              {activePortfolioId && assets.length > 0 && (
                <Card className="surface-2 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-purple-400" />
                      Net Worth History
                    </h2>
                  </div>
                  <NetWorthChart portfolioId={activePortfolioId} />
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="surface-2 p-6">
                    <Tabs defaultValue="holdings" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-transparent border-none p-0 h-auto">
                          <TabsTrigger 
                            value="holdings" 
                            className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-500 px-0 mr-4"
                            data-testid="tab-holdings"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Holdings
                            <Badge variant="outline" className="ml-2 text-muted-foreground border-border text-xs">
                              {assets.length}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="watchlist" 
                            className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-500 px-0"
                            data-testid="tab-watchlist"
                          >
                            <BookMarked className="w-4 h-4 mr-2" />
                            Watchlist
                          </TabsTrigger>
                          <TabsTrigger 
                            value="bot-trading" 
                            className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-500 px-0 ml-4"
                            data-testid="tab-bot-trading"
                          >
                            <Bot className="w-4 h-4 mr-2" />
                            Bot Trading
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                          {assets.length > 0 && (
                            <AddAssetDialog portfolioId={activePortfolioId!} onSuccess={() => refetchPortfolio()} />
                          )}
                        </div>
                      </div>
                      
                      <TabsContent value="holdings" className="mt-0">
                        {assets.length === 0 ? (
                          <div className="py-8">
                            <div className="text-center max-w-sm mx-auto">
                              <motion.div 
                                className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-amber-500/20 flex items-center justify-center relative"
                                animate={{ 
                                  boxShadow: ['0 0 20px rgba(168,85,247,0.2)', '0 0 40px rgba(34,211,238,0.3)', '0 0 20px rgba(168,85,247,0.2)']
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <Layers className="w-10 h-10 text-purple-400" />
                                <motion.div 
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </motion.div>
                              <h3 className="text-xl font-bold text-white mb-2">Add Your First Asset</h3>
                              <p className="text-gray-400 text-sm mb-6">
                                Track crypto, stocks, ETFs, retirement accounts, and cash in one unified dashboard with AI-powered insights.
                              </p>
                              <div className="grid grid-cols-3 gap-3 mb-6">
                                {[
                                  { icon: Bitcoin, label: 'Crypto', color: 'text-orange-400' },
                                  { icon: TrendingUp, label: 'Stocks', color: 'text-blue-400' },
                                  { icon: Landmark, label: 'Retirement', color: 'text-purple-400' }
                                ].map((item) => (
                                  <div key={item.label} className="p-3 surface-1 rounded-lg">
                                    <item.icon className={cn("w-5 h-5 mx-auto mb-1", item.color)} />
                                    <span className="text-[11px] sm:text-[10px] text-gray-400">{item.label}</span>
                                  </div>
                                ))}
                              </div>
                              <AddAssetDialog portfolioId={activePortfolioId!} onSuccess={() => refetchPortfolio()} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {assets.map((asset) => (
                              <AssetRow 
                                key={asset.id} 
                                asset={asset} 
                                portfolioId={activePortfolioId!} 
                                showValues={showValues} 
                                isRecentlyUpdated={recentUpdates.has(asset.symbol.toUpperCase())}
                                onRefresh={() => refetchPortfolio()}
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="watchlist" className="mt-0">
                        <WatchlistTab portfolioId={activePortfolioId!} onBuyFromWatchlist={(item) => {
                          setAlertSymbol(item.symbol);
                        }} />
                      </TabsContent>

                      <TabsContent value="bot-trading" className="mt-0">
                        <BotTradingTab />
                      </TabsContent>
                    </Tabs>
                  </Card>

                  {/* Performance Summary */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-green-400" />
                        Performance
                      </h2>
                    </div>
                    <PerformanceSummary portfolio={portfolio} assets={assets} portfolioId={activePortfolioId} />
                  </Card>

                  {/* Risk & Metrics Panel */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-cyan-400" />
                        Risk Metrics
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Volatility</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {assets.length > 0 ? 'Medium' : '--'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crosshair className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-gray-400">Concentration</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {assets.length > 0 ? `${assets.length > 1 ? Math.round(100 / assets.length) : 100}%` : '--'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-gray-400">Diversification</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {analysis?.diversificationScore || portfolio?.diversificationScore || '--'}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* AI Trade Signals */}
                  <Card className="surface-2 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-cyan-400" />
                          AI Trade Signals
                        </h2>
                        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">Alpha</Badge>
                      </div>
                      {tradeSignals.length > 0 ? (
                        <div className="space-y-3">
                          {tradeSignals.slice(0, 3).map((signal, index) => (
                            <div key={index} className="p-3 surface-1 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                                    signal.action === 'BUY' ? 'bg-green-500/20 text-green-400' :
                                    signal.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                                    signal.action === 'HOLD' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  )}>
                                    {signal.action}
                                  </span>
                                  <span className="font-medium text-white text-sm">{signal.symbol}</span>
                                </div>
                                <span className="text-xs text-gray-400">{signal.confidence}% conf.</span>
                              </div>
                              <p className="text-xs text-gray-400">{signal.reason}</p>
                              {(signal.targetPrice || signal.stopLoss) && (
                                <div className="flex gap-3 mt-2 text-[10px]">
                                  {signal.targetPrice && (
                                    <span className="text-green-400">Target: ${signal.targetPrice.toLocaleString()}</span>
                                  )}
                                  {signal.stopLoss && (
                                    <span className="text-red-400">Stop: ${signal.stopLoss.toLocaleString()}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Zap className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                          <p className="text-sm text-gray-400">Add assets to receive personalized trade signals</p>
                        </div>
                      )}
                    </Card>

                  {/* Top Movers */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Top Movers (24h)
                      </h2>
                    </div>
                    <TopMovers assets={assets} showValues={showValues} />
                  </Card>

                  {/* Correlation Matrix */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-cyan-400" />
                        Asset Correlations
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">30D</Badge>
                    </div>
                    <CorrelationMatrix assets={assets} portfolioId={activePortfolioId} />
                  </Card>

                  {/* Sector Breakdown */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-400" />
                        Sector Breakdown
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">By Industry</Badge>
                    </div>
                    <SectorBreakdownChart assets={assets} />
                  </Card>

                  {/* AI Insights Feed */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        AI Insights
                      </h2>
                      <Button variant="ghost" size="sm" className="text-purple-400 text-xs">
                        View All
                      </Button>
                    </div>
                    {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.recommendations.slice(0, 3).map((rec, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-3 rounded-lg border transition-colors cursor-pointer hover:border-purple-500/30",
                              rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20' :
                              rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                              'surface-1'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-1.5 rounded-md mt-0.5",
                                rec.priority === 'high' ? 'bg-red-500/10' :
                                rec.priority === 'medium' ? 'bg-amber-500/10' :
                                'bg-muted'
                              )}>
                                {rec.priority === 'high' ? (
                                  <Flame className="w-3.5 h-3.5 text-red-400" />
                                ) : rec.priority === 'medium' ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Lightbulb className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm leading-snug">{rec.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[11px] sm:text-[10px] text-muted-foreground border-border px-1.5 py-0">
                                    {rec.type}
                                  </Badge>
                                  {rec.action && (
                                    <span className="text-xs text-purple-400 hover:text-purple-300">
                                      {rec.action} →
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <p className="text-sm text-gray-400">Add assets to receive AI-powered insights</p>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* AI Health Analysis */}
                  <Card className="surface-2 p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      Portfolio Health
                    </h2>
                    <div className="flex justify-center mb-5">
                      <HealthScoreRing score={analysis?.healthScore || portfolio?.healthScore || 0} />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Diversification</span>
                          <span className="text-white font-medium">{analysis?.diversificationScore || portfolio?.diversificationScore || 0}%</span>
                        </div>
                        <Progress value={analysis?.diversificationScore || portfolio?.diversificationScore || 0} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between p-3 surface-1 rounded-lg">
                        <span className="text-sm text-gray-400">Risk Profile</span>
                        <Badge className={cn("text-xs", riskLevelColors[analysis?.riskLevel || portfolio?.riskLevel || ''] || 'text-gray-400 bg-gray-500/20')}>
                          {(analysis?.riskLevel || portfolio?.riskLevel || 'Unknown').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Connected Accounts */}
                  <Card className="surface-2 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        Connected Accounts
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Demo</Badge>
                    </div>
                    <ConnectedAccountsSection />
                  </Card>

                  {/* Asset Allocation */}
                  <Card className="surface-2 p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                      <PieChart className="w-5 h-5 text-cyan-400" />
                      Allocation
                    </h2>
                    {analysis?.allocation && Object.keys(analysis.allocation).length > 0 ? (
                      <>
                        <div className="flex justify-center mb-4">
                          <AllocationChart allocation={analysis.allocation} />
                        </div>
                        <div className="space-y-2">
                          {Object.entries(analysis.allocation).map(([type, percent]) => {
                            // Use same colors as the chart for consistency
                            const chartColor = assetTypeChartColors[type] || assetTypeChartColors.other;
                            return (
                              <div key={type} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/40 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColor }} />
                                  <span className="text-sm text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                                </div>
                                <span className="text-sm text-white font-medium">{percent.toFixed(1)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <PieChart className="w-5 h-5 text-cyan-400" />
                        </div>
                        <p className="text-sm text-gray-400">Add assets to see allocation</p>
                      </div>
                    )}
                  </Card>

                  {/* Stress Test / Scenario Simulator */}
                  <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-900/20 border-red-500/20 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">Stress Test</h3>
                        <p className="text-xs text-gray-500">What if markets crash?</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      {(() => {
                        const assetTypes = Array.from(new Set(assets.map(a => a.assetType)));
                        const impactByType = assetTypes.map(type => {
                          const typeAssets = assets.filter(a => a.assetType === type);
                          const typeValue = typeAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
                          const dropPercent = customScenario[type] || 20;
                          const impact = typeValue * (dropPercent / 100);
                          return { type, typeValue, dropPercent, impact };
                        }).filter(t => t.typeValue > 0);
                        
                        const totalImpact = impactByType.reduce((sum, t) => sum + t.impact, 0);
                        
                        return (
                          <>
                            {impactByType.slice(0, 3).map((t) => (
                              <div key={t.type} className="flex justify-between items-center p-2 surface-1 rounded-lg">
                                <span className="text-xs text-gray-400 capitalize">If {t.type} drops {t.dropPercent}%</span>
                                <span className="text-xs font-medium text-red-400">
                                  {showValues ? `-$${Math.round(t.impact).toLocaleString()}` : '••••'}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                              <span className="text-xs text-gray-300 font-medium">Total Custom Scenario Impact</span>
                              <span className="text-xs font-bold text-red-400">
                                {showValues ? `-$${Math.round(totalImpact).toLocaleString()}` : '••••'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs h-8"
                      onClick={() => setShowStressTestDialog(true)}
                      data-testid="button-custom-scenario"
                    >
                      <Calculator className="w-3 h-3 mr-1.5" />
                      Custom Scenario
                    </Button>
                  </Card>

                  {/* Event Calendar */}
                  <Card className="surface-2 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Upcoming Events
                      </h3>
                      {portfolioEvents.length > 0 && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                          {portfolioEvents.length} events
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {portfolioEvents.length > 0 ? (
                        portfolioEvents.slice(0, 5).map((event) => {
                          const eventDate = new Date(event.date);
                          const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const eventColors: Record<string, { bg: string; border: string; text: string }> = {
                            earnings: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
                            fed: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
                            unlock: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400' },
                            halving: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400' },
                            network: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                          };
                          const colors = eventColors[event.type] || eventColors.fed;
                          
                          return (
                            <div key={event.id} className={cn("p-3 rounded-lg border", colors.bg, colors.border)}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-xs font-medium capitalize", colors.text)}>
                                  {event.type === 'fed' ? 'Fed Meeting' : event.type === 'unlock' ? 'Token Unlock' : event.type}
                                </span>
                                <span className="text-[11px] sm:text-[10px] text-gray-500">{formattedDate}</span>
                              </div>
                              <p className="text-xs text-gray-300">{event.title}</p>
                              {event.description && (
                                <p className="text-[10px] text-gray-500 mt-0.5">{event.description}</p>
                              )}
                            </div>
                          );
                        })
                      ) : assets.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">Add assets to see relevant events</p>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-4">No upcoming events for your holdings</p>
                      )}
                    </div>
                  </Card>

                  {/* Goal Tracker */}
                  <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/20 border-purple-500/20 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        Goals
                      </h3>
                    </div>
                    <GoalTracker currentValue={portfolio?.totalValue || 0} />
                  </Card>

                  {/* Income Tracker */}
                  <Card className="surface-2 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4 text-green-400" />
                        Passive Income
                      </h3>
                    </div>
                    <IncomeTracker assets={assets} />
                  </Card>

                  {/* News Feed */}
                  <Card className="surface-2 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Latest News
                      </h3>
                      <Badge variant="outline" className="text-[11px] sm:text-[9px] text-muted-foreground border-border">Live</Badge>
                    </div>
                    <NewsAggregator assets={assets} />
                  </Card>

                  {/* Per-Asset News Feed */}
                  <Card className="surface-2 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        News by Asset
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Per Symbol</Badge>
                    </div>
                    <AssetNewsFeed assets={assets} />
                  </Card>
                </div>
              </div>

              {/* Section Divider */}
              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-wider">Advanced Analytics</span>
                </div>
              </div>

              {/* Alpha Section - Full Width Panels */}
              <div className="mt-6 space-y-6">
                {/* AI Financial Advisor Panel */}
                <Card className="bg-gradient-to-r from-slate-900 via-purple-900/10 to-slate-900 border-purple-500/30 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/25">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">AI Financial Advisor</h2>
                        <p className="text-xs text-gray-500">Personalized recommendations based on your portfolio</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30 text-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Live Analysis
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Top Recommendation - Dynamic based on portfolio state */}
                    <div className="md:col-span-2 p-4 surface-1 rounded-xl">
                      <div className="flex items-start gap-3">
                        {(() => {
                          const sortedByAlloc = [...assets].sort((a, b) => (b.allocationPercent || 0) - (a.allocationPercent || 0));
                          const topAsset = sortedByAlloc[0];
                          const losers = assets.filter(a => (a.unrealizedPnlPercent || 0) < -10);
                          const bigWinners = assets.filter(a => (a.unrealizedPnlPercent || 0) > 30);
                          const cryptoAlloc = assets.filter(a => a.assetType === 'crypto').reduce((s, a) => s + (a.allocationPercent || 0), 0);
                          const cashAlloc = assets.filter(a => a.assetType === 'cash').reduce((s, a) => s + (a.allocationPercent || 0), 0);
                          const diversificationScore = analytics?.diversificationScore || analysis?.diversificationScore || 0;
                          
                          if (assets.length === 0) {
                            return (
                              <>
                                <div className="p-2 rounded-lg bg-blue-500/20 mt-0.5">
                                  <Target className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white mb-1">Get Started</h4>
                                  <p className="text-sm text-gray-400 mb-3">
                                    Add your first assets to receive personalized AI-powered financial advice tailored to your goals.
                                  </p>
                                </div>
                              </>
                            );
                          }
                          
                          if (taxAnalytics?.taxLossHarvestingOpportunities && taxAnalytics.taxLossHarvestingOpportunities.length >= 2) {
                            const topLoss = taxAnalytics.taxLossHarvestingOpportunities[0];
                            return (
                              <>
                                <div className="p-2 rounded-lg bg-amber-500/20 mt-0.5">
                                  <Receipt className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white mb-1">Tax-Loss Harvesting Opportunity</h4>
                                  <p className="text-sm text-gray-400 mb-3">
                                    {showValues 
                                      ? `You have ${taxAnalytics.taxLossHarvestingOpportunities.length} positions with unrealized losses. Selling ${topLoss.symbol} could save ~$${topLoss.potentialTaxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} in taxes this year.`
                                      : `You have ${taxAnalytics.taxLossHarvestingOpportunities.length} positions with unrealized losses that could be harvested for tax savings.`}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => setShowTaxDialog(true)}
                                      className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 h-7 text-xs"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      View Tax Details
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          }
                          
                          if (topAsset && (topAsset.allocationPercent || 0) > 35) {
                            return (
                              <>
                                <div className="p-2 rounded-lg bg-red-500/20 mt-0.5">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white mb-1">Concentration Risk Alert</h4>
                                  <p className="text-sm text-gray-400 mb-3">
                                    {showValues 
                                      ? `Your ${topAsset.symbol} position represents ${(topAsset.allocationPercent || 0).toFixed(0)}% of your portfolio. Consider rebalancing to reduce single-asset risk.`
                                      : `Your largest position may be overweighted. Consider rebalancing to reduce single-asset risk.`}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => setShowRebalanceDialog(true)}
                                      className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 h-7 text-xs"
                                    >
                                      <Scale className="w-3 h-3 mr-1" />
                                      Rebalance
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          }
                          
                          if (bigWinners.length > 0) {
                            const topWinner = bigWinners.sort((a, b) => (b.unrealizedPnlPercent || 0) - (a.unrealizedPnlPercent || 0))[0];
                            return (
                              <>
                                <div className="p-2 rounded-lg bg-green-500/20 mt-0.5">
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white mb-1">Consider Taking Profits</h4>
                                  <p className="text-sm text-gray-400 mb-3">
                                    {showValues 
                                      ? `${topWinner.symbol} is up ${(topWinner.unrealizedPnlPercent || 0).toFixed(0)}% (+$${(topWinner.unrealizedPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}). Consider selling a portion to lock in gains.`
                                      : `${topWinner.symbol} is up ${(topWinner.unrealizedPnlPercent || 0).toFixed(0)}%. Consider selling a portion to lock in gains.`}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => setShowStrategyDialog(true)}
                                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 h-7 text-xs"
                                    >
                                      <ArrowUpRight className="w-3 h-3 mr-1" />
                                      View Strategy
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          }
                          
                          if (cryptoAlloc > 50) {
                            return (
                              <>
                                <div className="p-2 rounded-lg bg-purple-500/20 mt-0.5">
                                  <Gauge className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white mb-1">High Crypto Exposure</h4>
                                  <p className="text-sm text-gray-400 mb-3">
                                    {cryptoAlloc.toFixed(0)}% of your portfolio is in crypto. Consider diversifying with stocks or ETFs for a more balanced risk profile.
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => setShowRebalanceDialog(true)}
                                      className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 h-7 text-xs"
                                    >
                                      <Scale className="w-3 h-3 mr-1" />
                                      Rebalance
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          }
                          
                          return (
                            <>
                              <div className="p-2 rounded-lg bg-green-500/20 mt-0.5">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white mb-1">Portfolio Looking Healthy</h4>
                                <p className="text-sm text-gray-400 mb-3">
                                  Your portfolio is well-diversified with balanced allocations. Keep monitoring for market opportunities.
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setShowGoalsDialog(true)}
                                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30 h-7 text-xs"
                                  >
                                    <Target className="w-3 h-3 mr-1" />
                                    Set Goals
                                  </Button>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowTaxDialog(true)}
                        className="w-full p-3 surface-1 surface-interactive rounded-lg hover:border-neon-amber/50 text-left group"
                        data-testid="button-tax-harvest"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-white">Tax-Loss Harvest</span>
                        </div>
                        <p className="text-[11px] sm:text-[10px] text-gray-500 group-hover:text-gray-400">
                          {assets.filter(a => (a.unrealizedPnl || 0) < 0).length} assets with losses
                        </p>
                      </button>
                      <button 
                        onClick={() => setShowRebalanceDialog(true)}
                        className="w-full p-3 surface-1 surface-interactive rounded-lg hover:border-neon-cyan/50 text-left group"
                        data-testid="button-auto-rebalance"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Scale className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-medium text-white">Auto-Rebalance</span>
                        </div>
                        <p className="text-[11px] sm:text-[10px] text-gray-500 group-hover:text-gray-400">Optimize allocation targets</p>
                      </button>
                      <button 
                        onClick={() => setShowGoalsDialog(true)}
                        className="w-full p-3 surface-1 surface-interactive rounded-lg hover:border-neon-purple/50 text-left group"
                        data-testid="button-set-goals"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-medium text-white">Set Goals</span>
                        </div>
                        <p className="text-[10px] text-gray-500 group-hover:text-gray-400">Track your targets</p>
                      </button>
                    </div>
                  </div>
                </Card>

                {/* AI Advisor Chat */}
                <AIAdvisorChat 
                  portfolioId={activePortfolioId || ''} 
                  totalValue={portfolio?.totalValue || 0}
                  assets={assets}
                  allocation={analysis?.allocation || {}}
                />

                {/* Portfolio Analytics + Tax Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Portfolio Analytics */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Portfolio Analytics
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">vs. S&P 500</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-gray-400">Sharpe Ratio</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {assets.length > 0 ? (analytics?.sharpeRatio?.toFixed(2) || '0.00') : '--'}
                        </p>
                        <p className={cn("text-[10px]", (analytics?.sharpeRatio || 0) >= 1 ? 'text-green-400' : (analytics?.sharpeRatio || 0) >= 0.5 ? 'text-amber-400' : 'text-red-400')}>
                          {(analytics?.sharpeRatio || 0) >= 1 ? 'Above average' : (analytics?.sharpeRatio || 0) >= 0.5 ? 'Average' : 'Below average'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-gray-400">Max Drawdown</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {assets.length > 0 ? `${analytics?.maxDrawdown?.toFixed(1) || '0'}%` : '--'}
                        </p>
                        <p className={cn("text-[10px]", Math.abs(analytics?.maxDrawdown || 0) > 25 ? 'text-red-400' : Math.abs(analytics?.maxDrawdown || 0) > 15 ? 'text-amber-400' : 'text-green-400')}>
                          {Math.abs(analytics?.maxDrawdown || 0) > 25 ? 'High risk' : Math.abs(analytics?.maxDrawdown || 0) > 15 ? 'Moderate risk' : 'Low risk'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-gray-400">Beta</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {assets.length > 0 ? (analytics?.beta?.toFixed(2) || '1.00') : '--'}
                        </p>
                        <p className={cn("text-[10px]", (analytics?.beta || 1) > 1.2 ? 'text-red-400' : (analytics?.beta || 1) > 0.8 ? 'text-gray-500' : 'text-green-400')}>
                          {(analytics?.beta || 1) > 1.2 ? 'Higher volatility' : (analytics?.beta || 1) > 0.8 ? 'Market-neutral' : 'Lower volatility'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crosshair className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-gray-400">Alpha</span>
                        </div>
                        <p className={cn("text-xl font-bold", (analytics?.alpha || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {assets.length > 0 ? `${(analytics?.alpha || 0) >= 0 ? '+' : ''}${analytics?.alpha?.toFixed(1) || '0'}%` : '--'}
                        </p>
                        <p className={cn("text-[10px]", (analytics?.alpha || 0) > 0 ? 'text-green-400' : 'text-red-400')}>
                          {(analytics?.alpha || 0) > 0 ? 'Outperforming' : 'Underperforming'}
                        </p>
                      </div>
                    </div>
                    <div className={cn("mt-4 p-3 border rounded-lg", 
                      (analytics?.outperformance || 0) >= 0 
                        ? 'bg-gradient-to-r from-green-500/5 to-transparent border-green-500/20' 
                        : 'bg-gradient-to-r from-red-500/5 to-transparent border-red-500/20'
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">YTD Performance vs S&P 500</p>
                          <p className={cn("text-lg font-bold", (analytics?.outperformance || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {showValues && assets.length > 0 
                              ? `${(analytics?.outperformance || 0) >= 0 ? '+' : ''}${analytics?.outperformance?.toFixed(1) || '0'}% ${(analytics?.outperformance || 0) >= 0 ? 'outperformance' : 'underperformance'}` 
                              : assets.length > 0 ? '••••' : '--'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Your return: {showValues && assets.length > 0 ? `${(analytics?.ytdReturn || 0) >= 0 ? '+' : ''}${analytics?.ytdReturn?.toFixed(1) || '0'}%` : assets.length > 0 ? '••••' : '--'}</p>
                          <p className="text-xs text-gray-500">S&P 500: +{analytics?.spReturn || 19.7}%</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Tax Dashboard */}
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-400" />
                        Tax Dashboard
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">2024 Tax Year</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 surface-1 rounded-lg">
                        <span className="text-xs text-gray-400">Unrealized Gains</span>
                        <p className={cn("text-xl font-bold", (portfolio?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {showValues ? `${(portfolio?.totalPnl || 0) >= 0 ? '+' : ''}$${Math.abs(portfolio?.totalPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
                        </p>
                      </div>
                      <div className="p-3 surface-1 rounded-lg">
                        <span className="text-xs text-gray-400">Est. Tax Liability</span>
                        <p className="text-xl font-bold text-amber-400">
                          {showValues ? `$${Math.round(taxAnalytics?.totalEstTax || (portfolio?.totalPnl || 0) * 0.20).toLocaleString()}` : '••••'}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {taxAnalytics ? `15% long-term • 32% short-term` : '~20% blended rate'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 surface-1 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs text-gray-400">Long-term holdings (1yr+)</span>
                        </div>
                        <span className="text-xs font-medium text-white">
                          {taxAnalytics ? `${taxAnalytics.longTermAssetCount} assets` : assets.length > 0 ? '--' : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 surface-1 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs text-gray-400">Short-term holdings</span>
                        </div>
                        <span className="text-xs font-medium text-white">
                          {taxAnalytics ? `${taxAnalytics.shortTermAssetCount} assets` : assets.length > 0 ? '--' : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-gray-400">Tax-loss harvesting opportunity</span>
                        </div>
                        <span className="text-xs font-medium text-red-400">
                          {taxAnalytics?.taxLossHarvestingOpportunities?.length || assets.filter(a => (a.unrealizedPnl || 0) < 0).length} assets
                        </span>
                      </div>
                      {taxAnalytics?.taxLossHarvestingOpportunities && taxAnalytics.taxLossHarvestingOpportunities.length > 0 && (
                        <div className="mt-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                          <p className="text-[10px] text-gray-400 mb-1.5">Top loss harvest candidates:</p>
                          <div className="space-y-1">
                            {taxAnalytics.taxLossHarvestingOpportunities.slice(0, 2).map((op, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-white">{op.symbol}</span>
                                <span className="text-[10px] text-red-400">${Math.abs(op.loss).toLocaleString()} loss → ~${op.potentialTaxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} savings</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTaxDialog(true)}
                      className="w-full mt-4 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-8"
                      data-testid="button-generate-tax-report"
                    >
                      <FileText className="w-3 h-3 mr-1.5" />
                      View Tax Details
                    </Button>
                  </Card>
                </div>

                {/* Benchmark Comparison Chart */}
                {activePortfolioId && (
                  <Card className="surface-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        Portfolio vs Benchmark
                      </h2>
                    </div>
                    <BenchmarkComparisonChart portfolioId={activePortfolioId} assets={assets} />
                  </Card>
                )}

                {/* Dividend Calendar */}
                <Card className="surface-2 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-400" />
                      Dividend Calendar
                    </h2>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Upcoming</Badge>
                  </div>
                  <DividendCalendar assets={assets} />
                </Card>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Transaction History Dialog */}
      {activePortfolioId && (
        <TransactionHistoryDialog 
          portfolioId={activePortfolioId} 
          open={showTransactionHistoryDialog} 
          onOpenChange={setShowTransactionHistoryDialog} 
        />
      )}

      {/* Price Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="surface-2 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              Price Alerts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 surface-1 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">Create New Alert</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400 text-xs">Select Asset</Label>
                  <Select value={alertSymbol} onValueChange={setAlertSymbol}>
                    <SelectTrigger className="mt-1" data-testid="select-alert-asset">
                      <SelectValue placeholder="Choose asset" />
                    </SelectTrigger>
                    <SelectContent className="surface-2">
                      {assets.map(a => (
                        <SelectItem key={a.id} value={a.symbol} className="hover:bg-accent/40">
                          {a.symbol} - {a.name} (${a.currentPrice?.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Alert When Price</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={alertType} onValueChange={(v) => setAlertType(v as 'above' | 'below')}>
                      <SelectTrigger className="w-28" data-testid="select-alert-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="surface-2">
                        <SelectItem value="above" className="text-white">Goes above</SelectItem>
                        <SelectItem value="below" className="text-white">Goes below</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Target price" 
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      className="" 
                      data-testid="input-alert-price"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const selectedAsset = assets.find(a => a.symbol === alertSymbol);
                    if (!selectedAsset || !alertTargetPrice) {
                      toast({ title: 'Please select an asset and enter a target price', variant: 'destructive' });
                      return;
                    }
                    createAlertMutation.mutate({
                      symbol: selectedAsset.symbol,
                      name: selectedAsset.name,
                      assetType: selectedAsset.assetType,
                      alertType: alertType,
                      targetPrice: parseFloat(alertTargetPrice),
                      currentPriceAtCreation: selectedAsset.currentPrice,
                      portfolioId: activePortfolioId,
                    });
                  }}
                  disabled={createAlertMutation.isPending || !alertSymbol || !alertTargetPrice}
                  className="w-full bg-purple-600 hover:bg-purple-500"
                  data-testid="button-create-alert"
                >
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </div>
            </div>
            
            {priceAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center justify-between">
                  <span>Active Alerts ({priceAlerts.filter(a => a.isActive && !a.isTriggered).length})</span>
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {priceAlerts.filter(a => a.isActive).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 surface-1 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{alert.symbol}</span>
                          <Badge variant="outline" className={cn("text-[10px]", 
                            alert.alertType === 'above' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                          )}>
                            {alert.alertType === 'above' ? '↑ Above' : '↓ Below'}
                          </Badge>
                          {alert.isTriggered && (
                            <Badge className="text-[10px] bg-amber-500/20 text-amber-400">Triggered</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Target: ${alert.targetPrice?.toLocaleString()} (was ${alert.currentPriceAtCreation?.toLocaleString()})
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        disabled={deleteAlertMutation.isPending}
                        data-testid={`button-delete-alert-${alert.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rebalance Dialog */}
      <Dialog open={showRebalanceDialog} onOpenChange={(open) => {
        setShowRebalanceDialog(open);
        if (open && Object.keys(targetAllocations).length === 0) {
          const assetTypes = Array.from(new Set(assets.map(a => a.assetType)));
          const equalAlloc = 100 / assetTypes.length;
          const initialTargets: Record<string, number> = {};
          assetTypes.forEach(type => { initialTargets[type] = Math.round(equalAlloc); });
          setTargetAllocations(initialTargets);
        }
      }}>
        <DialogContent className="surface-2 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              Portfolio Rebalancing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 surface-1 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">Set Target Allocations by Asset Type</h4>
              <div className="space-y-2">
                {Array.from(new Set(assets.map(a => a.assetType))).map(type => {
                  const currentAlloc = assets.filter(a => a.assetType === type).reduce((sum, a) => sum + (a.allocationPercent || 0), 0);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 capitalize flex-1 min-w-[80px]">{type}</span>
                      <span className="text-xs text-gray-500 w-16">Now: {currentAlloc.toFixed(1)}%</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={targetAllocations[type] || 0}
                          onChange={(e) => setTargetAllocations(prev => ({ ...prev, [type]: parseFloat(e.target.value) || 0 }))}
                          className="w-16 h-8 text-center "" text-sm"
                          data-testid={`input-target-${type}`}
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border/60 flex justify-between text-xs">
                  <span className="text-gray-400">Total:</span>
                  <span className={cn("font-medium", Object.values(targetAllocations).reduce((a, b) => a + b, 0) === 100 ? 'text-green-400' : 'text-amber-400')}>
                    {Object.values(targetAllocations).reduce((a, b) => a + b, 0).toFixed(0)}%
                    {Object.values(targetAllocations).reduce((a, b) => a + b, 0) !== 100 && ' (should be 100%)'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-white mb-2">Suggested Trades</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {(() => {
                  const totalValue = portfolio?.totalValue || 0;
                  const trades: Array<{ symbol: string; type: string; action: 'buy' | 'sell'; amountPercent: number; amountDollars: number; shares: number }> = [];
                  
                  assets.forEach(asset => {
                    const currentAlloc = asset.allocationPercent || 0;
                    const assetTypeTotal = assets.filter(a => a.assetType === asset.assetType).reduce((s, a) => s + (a.allocationPercent || 0), 0);
                    const targetTotal = targetAllocations[asset.assetType] || 0;
                    
                    if (assetTypeTotal === 0) return;
                    
                    const assetShareOfType = currentAlloc / assetTypeTotal;
                    const newTargetForAsset = targetTotal * assetShareOfType;
                    const diff = newTargetForAsset - currentAlloc;
                    
                    if (Math.abs(diff) > 1) {
                      const dollarAmount = (Math.abs(diff) / 100) * totalValue;
                      const shares = asset.currentPrice ? dollarAmount / asset.currentPrice : 0;
                      trades.push({
                        symbol: asset.symbol,
                        type: asset.assetType,
                        action: diff > 0 ? 'buy' : 'sell',
                        amountPercent: Math.abs(diff),
                        amountDollars: dollarAmount,
                        shares,
                      });
                    }
                  });
                  
                  trades.sort((a, b) => b.amountDollars - a.amountDollars);
                  
                  if (trades.length === 0) {
                    return (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        Portfolio is balanced according to your targets
                      </div>
                    );
                  }
                  
                  return trades.map((trade, i) => (
                    <div key={i} className={cn("p-3 rounded-lg border", 
                      trade.action === 'buy' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px]", 
                            trade.action === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          )}>
                            {trade.action.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-white">{trade.symbol}</span>
                        </div>
                        <span className={cn("text-sm font-medium", trade.action === 'buy' ? 'text-green-400' : 'text-red-400')}>
                          ${trade.amountDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {trade.action === 'buy' ? 'Buy' : 'Sell'} ~{trade.shares.toFixed(4)} units ({trade.amountPercent.toFixed(1)}% of portfolio)
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <Button 
              onClick={() => {
                const trades = assets.map(asset => {
                  const currentAlloc = asset.allocationPercent || 0;
                  const targetTotal = targetAllocations[asset.assetType] || 0;
                  const assetTypeTotal = assets.filter(a => a.assetType === asset.assetType).reduce((s, a) => s + (a.allocationPercent || 0), 0);
                  if (assetTypeTotal === 0) return null;
                  const assetShareOfType = currentAlloc / assetTypeTotal;
                  const diff = (targetTotal * assetShareOfType) - currentAlloc;
                  if (Math.abs(diff) > 1) {
                    return `${diff > 0 ? 'BUY' : 'SELL'} ${asset.symbol}: $${Math.round((Math.abs(diff) / 100) * (portfolio?.totalValue || 0)).toLocaleString()}`;
                  }
                  return null;
                }).filter(Boolean);
                
                toast({ 
                  title: 'Rebalancing Plan Generated', 
                  description: trades.length > 0 ? trades.slice(0, 3).join(', ') + (trades.length > 3 ? ` and ${trades.length - 3} more` : '') : 'No trades needed'
                });
                setShowRebalanceDialog(false);
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500"
              data-testid="button-apply-rebalance"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Generate Rebalancing Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax Analytics Dialog */}
      <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
        <DialogContent className="surface-2 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              Tax Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 surface-1 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400">Long-term (15% rate)</span>
                </div>
                <p className="text-lg font-bold text-green-400">{taxAnalytics?.longTermAssetCount || 0} assets</p>
                <p className="text-xs text-gray-500">
                  {taxAnalytics?.longTermGains ? `+$${taxAnalytics.longTermGains.toLocaleString(undefined, { maximumFractionDigits: 0 })} gains` : 'No gains'}
                </p>
              </div>
              <div className="p-3 surface-1 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-400">Short-term (32% rate)</span>
                </div>
                <p className="text-lg font-bold text-amber-400">{taxAnalytics?.shortTermAssetCount || 0} assets</p>
                <p className="text-xs text-gray-500">
                  {taxAnalytics?.shortTermGains ? `+$${taxAnalytics.shortTermGains.toLocaleString(undefined, { maximumFractionDigits: 0 })} gains` : 'No gains'}
                </p>
              </div>
            </div>
            
            {/* Estimated Tax */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Estimated Tax Liability (if sold today)</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ${Math.round(taxAnalytics?.totalEstTax || 0).toLocaleString()}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-amber-500/50" />
              </div>
            </div>

            {/* Tax-Loss Harvesting */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Tax-Loss Harvesting Opportunities
              </h4>
              {taxAnalytics?.taxLossHarvestingOpportunities && taxAnalytics.taxLossHarvestingOpportunities.length > 0 ? (
                <div className="space-y-2">
                  {taxAnalytics.taxLossHarvestingOpportunities.map((op, i) => (
                    <div key={i} className="flex items-center justify-between p-3 surface-1 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <span className="font-medium text-white">{op.symbol}</span>
                          <p className="text-xs text-gray-500">{op.isLongTerm ? 'Long-term' : 'Short-term'} holding</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-400">
                          -${Math.abs(op.loss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-green-400">
                          ~${op.potentialTaxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} savings
                        </p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    Selling these positions could offset capital gains and reduce your tax bill.
                  </p>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground surface-1 rounded-lg">
                  No positions with significant losses to harvest
                </p>
              )}
            </div>
            
            <Button 
              onClick={() => {
                toast({ title: 'Tax Report Generated', description: 'Check your email for the detailed report' });
                setShowTaxDialog(false);
              }}
              className="w-full bg-amber-600 hover:bg-amber-500"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Full Tax Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategy Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent className="surface-2 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Strategy Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {analysis?.recommendations && analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((rec, i) => (
                <div key={i} className={cn("p-4 rounded-lg border", 
                  rec.priority === 'high' ? 'bg-red-500/10 border-red-500/30' : 
                  rec.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/30' : 
                  'surface-1'
                )}>
                  <div className="flex items-start gap-3">
                    <Lightbulb className={cn("w-4 h-4 mt-0.5",
                      rec.priority === 'high' ? 'text-red-400' : 
                      rec.priority === 'medium' ? 'text-amber-400' : 'text-green-400'
                    )} />
                    <div>
                      <p className="text-sm text-white">{rec.message}</p>
                      {rec.action && (
                        <Button size="sm" variant="ghost" className="mt-2 h-6 text-xs text-purple-400">
                          {rec.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No recommendations yet. Add more assets to get AI insights.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals Dialog */}
      <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
        <DialogContent className="surface-2 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Set Portfolio Goals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400 text-sm">Target Portfolio Value</Label>
              <Input placeholder="e.g. $100,000" className="mt-1.5 """ />
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Target Date</Label>
              <Input type="date" className="mt-1.5 """ />
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Monthly Contribution</Label>
              <Input placeholder="e.g. $500/month" className="mt-1.5 """ />
            </div>
            <Button 
              onClick={() => {
                toast({ title: 'Goal Created!', description: 'Track your progress on the dashboard' });
                setShowGoalsDialog(false);
              }}
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              Save Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Stress Test Dialog */}
      <Dialog open={showStressTestDialog} onOpenChange={setShowStressTestDialog}>
        <DialogContent className="surface-2 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Custom Stress Test Scenario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-400">
              Set a hypothetical market crash percentage for each asset type to see the potential impact on your portfolio.
            </p>
            
            <div className="space-y-3">
              {Object.entries(customScenario).map(([type, dropPercent]) => {
                const typeAssets = assets.filter(a => a.assetType === type);
                const typeValue = typeAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
                const impact = typeValue * (dropPercent / 100);
                
                if (typeValue === 0 && !['crypto', 'stock', 'etf', 'bond'].includes(type)) return null;
                
                return (
                  <div key={type} className="p-3 surface-1 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">{type.replace('_', ' ')}</span>
                      {typeValue > 0 && (
                        <span className="text-xs text-gray-500">
                          Current: ${typeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={dropPercent}
                        onChange={(e) => setCustomScenario(prev => ({ ...prev, [type]: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-red-500"
                        data-testid={`slider-drop-${type}`}
                      />
                      <div className="flex items-center gap-1 w-16">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={dropPercent}
                          onChange={(e) => setCustomScenario(prev => ({ ...prev, [type]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-12 h-7 text-center "" text-xs p-1"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    {typeValue > 0 && impact > 0 && (
                      <p className="text-xs text-red-400 mt-2">
                        Impact: -${impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Total Portfolio Impact</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              {(() => {
                const totalImpact = Object.entries(customScenario).reduce((total, [type, dropPercent]) => {
                  const typeValue = assets.filter(a => a.assetType === type).reduce((sum, a) => sum + (a.currentValue || 0), 0);
                  return total + (typeValue * (dropPercent / 100));
                }, 0);
                const portfolioValue = portfolio?.totalValue || 0;
                const impactPercent = portfolioValue > 0 ? (totalImpact / portfolioValue) * 100 : 0;
                const remainingValue = portfolioValue - totalImpact;
                
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Loss Amount</p>
                      <p className="text-lg font-bold text-red-400">
                        {showValues ? `-$${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Loss %</p>
                      <p className="text-lg font-bold text-red-400">
                        -{impactPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Remaining</p>
                      <p className="text-lg font-bold text-white">
                        {showValues ? `$${remainingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setCustomScenario({
                  crypto: 30,
                  stock: 20,
                  etf: 15,
                  bond: 5,
                  retirement: 10,
                  cash: 0,
                  stablecoin: 1,
                  real_estate: 10,
                  commodity: 15,
                  other: 15,
                })}
                className="flex-1 border-border text-muted-foreground hover:bg-accent/40"
                data-testid="button-reset-scenario"
              >
                Reset to Default
              </Button>
              <Button 
                onClick={() => {
                  toast({ title: 'Scenario Saved', description: 'Your custom stress test scenario has been applied' });
                  setShowStressTestDialog(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500"
                data-testid="button-apply-scenario"
              >
                Apply Scenario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
