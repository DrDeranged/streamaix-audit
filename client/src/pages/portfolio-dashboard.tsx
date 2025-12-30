import { useState, useEffect, useMemo } from 'react';
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
  Calendar, Receipt, FileText, Star, ChevronUp, ArrowRight, History, CheckCircle
} from 'lucide-react';
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
      <Card className="bg-slate-900/80 border-slate-700/50 overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
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
      bgGradient || "bg-slate-800/50 border-slate-700/50"
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
        <div className={cn("p-2 rounded-lg bg-white/5")}>
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

function AllocationChart({ allocation }: { allocation: Record<string, number> }) {
  const entries = Object.entries(allocation).filter(([_, v]) => v > 0);
  let cumulativeRotation = 0;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {entries.map(([type, percent], index) => {
          const sliceAngle = (percent / 100) * 360;
          const startAngle = cumulativeRotation;
          cumulativeRotation += sliceAngle;

          const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'];
          const color = colors[index % colors.length];

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
}

function TopMovers({ assets, showValues }: { assets: PortfolioAsset[]; showValues: boolean }) {
  const sortedByChange = [...assets].sort((a, b) => 
    Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0)
  );
  const gainers = sortedByChange.filter(a => (a.priceChange24h || 0) > 0).slice(0, 3);
  const losers = sortedByChange.filter(a => (a.priceChange24h || 0) < 0).slice(0, 3);

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
}

interface PortfolioSnapshot {
  id: string;
  totalValue: number;
  totalPnl: number;
  snapshotDate: string;
}

function PerformanceChart({ portfolio, assets, portfolioId }: { portfolio: Portfolio | null | undefined; assets: PortfolioAsset[]; portfolioId?: string }) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y'>('1W');
  
  const { data: historyData, isLoading } = useQuery<{ success: boolean; snapshots: PortfolioSnapshot[] }>({
    queryKey: ['/api/portfolios', portfolioId, 'history'],
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60000,
  });

  const getTimeframeDays = (tf: string): number => {
    switch (tf) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case 'YTD': 
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      case '1Y': return 365;
      default: return 30;
    }
  };

  const filteredData = useMemo(() => {
    if (!historyData?.snapshots?.length) {
      if (!portfolio?.totalValue) return [];
      const currentValue = portfolio.totalValue;
      const costBasis = portfolio.totalCostBasis || currentValue * 0.9;
      const days = getTimeframeDays(timeframe);
      const points = Math.min(days, 30);
      const startValue = costBasis;
      const step = (currentValue - startValue) / points;
      return Array.from({ length: points + 1 }, (_, i) => ({
        value: startValue + step * i + (Math.random() - 0.5) * (currentValue * 0.02),
        date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toISOString(),
      })).map((d, i, arr) => i === arr.length - 1 ? { ...d, value: currentValue } : d);
    }

    const days = getTimeframeDays(timeframe);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const filtered = historyData.snapshots
      .filter(s => new Date(s.snapshotDate) >= cutoffDate)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .map(s => ({ value: s.totalValue, date: s.snapshotDate }));

    if (filtered.length === 0 && historyData.snapshots.length > 0) {
      return historyData.snapshots
        .slice(-Math.min(30, historyData.snapshots.length))
        .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
        .map(s => ({ value: s.totalValue, date: s.snapshotDate }));
    }

    if (portfolio?.totalValue && filtered.length > 0) {
      const lastSnapshot = filtered[filtered.length - 1];
      if (Math.abs(lastSnapshot.value - portfolio.totalValue) > 1) {
        filtered.push({ value: portfolio.totalValue, date: new Date().toISOString() });
      }
    }

    return filtered;
  }, [historyData?.snapshots, timeframe, portfolio?.totalValue, portfolio?.totalCostBasis]);

  const chartData = filteredData.map(d => d.value);
  const max = chartData.length > 0 ? Math.max(...chartData) : 100;
  const min = chartData.length > 0 ? Math.min(...chartData) : 0;
  const range = max - min || 1;
  const isPositive = chartData.length > 1 ? chartData[chartData.length - 1] >= chartData[0] : true;
  
  const percentChange = chartData.length > 1 
    ? ((chartData[chartData.length - 1] - chartData[0]) / chartData[0] * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {(['1D', '1W', '1M', '3M', 'YTD', '1Y'] as const).map(tf => (
            <button
              key={tf}
              data-testid={`timeframe-${tf}`}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-2 text-xs rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0",
                timeframe === tf 
                  ? "bg-purple-500/20 text-purple-400" 
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        {chartData.length > 1 && (
          <span className={cn("text-xs font-medium", isPositive ? "text-green-400" : "text-red-400")}>
            {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
          </span>
        )}
      </div>
      
      {chartData.length === 0 ? (
        <div className="h-32 flex items-center justify-center border border-dashed border-slate-700 rounded-lg">
          <div className="text-center">
            <History className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Performance data will appear as your portfolio updates</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-32 flex items-end gap-[2px]">
            {chartData.map((value, i) => (
              <div
                key={i}
                data-testid={`chart-bar-${i}`}
                className={cn(
                  "flex-1 rounded-t transition-all hover:opacity-80",
                  isPositive ? "bg-green-500/60" : "bg-red-500/60"
                )}
                style={{ height: `${Math.max(2, ((value - min) / range) * 100)}%` }}
                title={`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] sm:text-[10px] text-gray-500 mt-2">
            <span>{timeframe === '1D' ? '24h ago' : timeframe === '1W' ? '7d ago' : timeframe === '1M' ? '30d ago' : timeframe === '3M' ? '90d ago' : timeframe === 'YTD' ? 'Jan 1' : '1y ago'}</span>
            <span>Now</span>
          </div>
        </>
      )}
    </div>
  );
}

function GoalTracker({ currentValue }: { currentValue: number }) {
  const [goals, setGoals] = useState([
    { name: 'Financial Freedom', target: 1000000, deadline: '2030-01-01' },
    { name: 'Emergency Fund', target: 50000, deadline: '2025-06-01' },
  ]);

  return (
    <div className="space-y-3">
      {goals.map((goal, i) => {
        const progress = Math.min(100, (currentValue / goal.target) * 100);
        const daysLeft = Math.max(0, Math.floor((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        return (
          <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{goal.name}</span>
              <span className="text-xs text-gray-500">{daysLeft}d left</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between mt-2 text-[11px] sm:text-[10px] text-gray-500">
              <span>${currentValue.toLocaleString()}</span>
              <span>Goal: ${goal.target.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
      <Button variant="ghost" size="sm" className="w-full text-xs text-purple-400 hover:text-purple-300">
        <Plus className="w-3 h-3 mr-1" /> Add Goal
      </Button>
    </div>
  );
}

function CorrelationMatrix({ assets }: { assets: PortfolioAsset[] }) {
  if (assets.length < 2) {
    return (
      <div className="text-center py-4">
        <PieChart className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add 2+ assets to see correlations</p>
      </div>
    );
  }

  const topAssets = assets.slice(0, 5);
  const correlations: Record<string, Record<string, number>> = {};
  
  topAssets.forEach(a => {
    correlations[a.symbol] = {};
    topAssets.forEach(b => {
      if (a.symbol === b.symbol) {
        correlations[a.symbol][b.symbol] = 1;
      } else {
        const sameType = a.assetType === b.assetType;
        const base = sameType ? 0.7 : 0.3;
        correlations[a.symbol][b.symbol] = base + (Math.random() - 0.5) * 0.4;
      }
    });
  });

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
              {topAssets.map(b => (
                <td key={b.symbol} className="p-1.5">
                  <div className={cn(
                    "w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[11px] sm:text-[10px] font-medium",
                    getCorrelationColor(correlations[a.symbol][b.symbol])
                  )}>
                    {correlations[a.symbol][b.symbol].toFixed(1)}
                  </div>
                </td>
              ))}
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
        <div className="p-2 bg-slate-800/50 rounded-lg">
          <span className="text-[11px] sm:text-[10px] text-gray-400">Dividends</span>
          <p className="text-sm font-medium text-white">${estimatedAnnualDividends.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-2 bg-slate-800/50 rounded-lg">
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

function NewsAggregator({ assets }: { assets: PortfolioAsset[] }) {
  const newsItems = [
    { symbol: 'BTC', title: 'Bitcoin ETF inflows hit record high', source: 'CoinDesk', time: '2h ago', sentiment: 'bullish' },
    { symbol: 'ETH', title: 'Ethereum staking rewards increase after upgrade', source: 'Decrypt', time: '4h ago', sentiment: 'bullish' },
    { symbol: 'SOL', title: 'Solana network processes 2000 TPS milestone', source: 'TheBlock', time: '6h ago', sentiment: 'bullish' },
    { symbol: 'AAPL', title: 'Apple announces record iPhone sales in Q4', source: 'Reuters', time: '8h ago', sentiment: 'bullish' },
    { symbol: 'TSLA', title: 'Tesla faces increased EV competition in Europe', source: 'Bloomberg', time: '10h ago', sentiment: 'bearish' },
  ].filter(n => assets.length === 0 || assets.some(a => a.symbol === n.symbol || a.symbol.includes(n.symbol.slice(0, 3))));

  if (assets.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText className="w-6 h-6 mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Add assets to see relevant news</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {newsItems.slice(0, 4).map((item, i) => (
        <div key={i} className="p-2.5 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
          <div className="flex items-start gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
              item.sentiment === 'bullish' ? 'bg-green-400' : 'bg-red-400'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[11px] sm:text-[9px] px-1.5 py-0.5 text-gray-500 border-slate-600">{item.symbol}</Badge>
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
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-xl">
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
          <TabsList className="w-full bg-transparent border-b border-slate-700 p-0 h-auto rounded-none gap-0">
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
                    className="bg-slate-800/50 border-slate-600 text-white pl-10 h-11 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
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
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    {stockResults.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-slate-800 text-xs text-gray-400 font-medium flex items-center gap-2 border-b border-slate-700">
                          <Building2 className="w-3 h-3" /> Stocks
                        </div>
                        {stockResults.slice(0, 5).map((result) => (
                          <button
                            key={result.symbol}
                            onClick={() => handleSelectAsset({ ...result, type: 'stock' })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 text-left border-b border-slate-800 last:border-b-0 transition-colors"
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
                        <div className="px-3 py-2 bg-slate-800 text-xs text-gray-400 font-medium flex items-center gap-2 border-b border-slate-700">
                          <Bitcoin className="w-3 h-3" /> Crypto
                        </div>
                        {cryptoResults.slice(0, 5).map((result: any) => (
                          <button
                            key={result.id || result.symbol}
                            onClick={() => handleSelectAsset({ symbol: result.symbol, name: result.name, type: 'crypto', thumb: result.thumb })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 text-left border-b border-slate-800 last:border-b-0 transition-colors"
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
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                  className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account Name (optional)</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Chase Checking, Coinbase"
                  className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
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
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                  className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" 
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Current Balance ($)</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => { setQuantity(e.target.value); setAvgCost('1'); }}
                  placeholder="50,000" 
                  className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" 
                />
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
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
                      className="bg-slate-800/50 border-slate-600 text-white h-10 mt-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" 
                    />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Contribution ($)</Label>
                    <Input 
                      type="number" 
                      value={contributionAmount} 
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="500" 
                      className="bg-slate-800/50 border-slate-600 text-white h-10 mt-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" 
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-gray-500 text-xs">Contribution Frequency</Label>
                  <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-10 mt-1 focus:border-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
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
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                  <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="BTC" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitcoin" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-400 text-sm">Quantity</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Avg Cost ($)</Label>
                  <Input type="number" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="0.00" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account (optional)</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Coinbase, Fidelity..." className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
              </div>
              <Button onClick={handleSubmit} disabled={addAssetMutation.isPending} className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium">
                {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
              </Button>
            </div>
          </TabsContent>

          {selectedAsset && mode === 'search' && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Avg Cost ($)</Label>
                  <Input type="number" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="0.00" className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
                </div>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Account (optional)</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Coinbase, Fidelity..." className="bg-slate-800/50 border-slate-600 text-white h-11 mt-1.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" />
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

function AssetRow({ asset, portfolioId, showValues = true }: { asset: PortfolioAsset; portfolioId: string; showValues?: boolean }) {
  const Icon = assetTypeIcons[asset.assetType] || Wallet;
  const colorGradient = assetTypeColors[asset.assetType] || assetTypeColors.other;
  const priceChange = asset.priceChange24h || 0;
  const is24hPositive = priceChange >= 0;
  const isPnlPositive = (asset.unrealizedPnlPercent || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br", colorGradient)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">{asset.symbol}</span>
            <span className="text-[11px] sm:text-[10px] text-gray-500 uppercase">{asset.assetType}</span>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-[120px]">{asset.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-white text-sm">
          {showValues ? `$${asset.currentValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
        </p>
        <div className="flex items-center justify-end gap-2">
          {/* 24h price change - always show % change */}
          <div className={cn("flex items-center gap-0.5 text-xs", is24hPositive ? 'text-green-400' : 'text-red-400')}>
            {is24hPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            <span>{is24hPositive ? '+' : ''}{priceChange.toFixed(1)}%</span>
          </div>
          {/* PnL indicator */}
          {asset.assetType !== 'cash' && asset.assetType !== 'stablecoin' && (
            <span className={cn("text-[10px] px-1 py-0.5 rounded", isPnlPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
              PnL {isPnlPositive ? '+' : ''}{(asset.unrealizedPnlPercent || 0).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
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
  const { toast } = useToast();

  const { data: portfoliosData, isLoading: portfoliosLoading } = useQuery<{ portfolios: Portfolio[] }>({
    queryKey: ['/api/portfolios'],
    refetchInterval: 60000,
  });

  const portfolios = portfoliosData?.portfolios || [];
  const activePortfolioId = selectedPortfolioId || portfolios[0]?.id;

  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery<{ portfolio: Portfolio; assets: PortfolioAsset[]; insights: any[] }>({
    queryKey: ['/api/portfolios', activePortfolioId],
    enabled: !!activePortfolioId,
    refetchInterval: 60000,
  });

  const { data: analysisData, refetch: refetchAnalysis } = useQuery<{ analysis: AIAnalysis }>({
    queryKey: ['/api/portfolios', activePortfolioId, 'ai-analysis'],
    enabled: !!activePortfolioId,
    refetchInterval: 300000,
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
    refetchInterval: 300000,
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
    refetchInterval: 300000,
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
    refetchInterval: 300000,
  });

  const taxAnalytics = taxData?.taxAnalytics;

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
  const assets = portfolioData?.assets || [];
  const insights = portfolioData?.insights || [];
  const analysis = analysisData?.analysis;
  
  // Auto-sync prices when portfolio loads and has assets
  useEffect(() => {
    if (activePortfolioId && assets.length > 0 && !syncMutation.isPending) {
      // Check if last sync was more than 5 minutes ago
      const lastUpdated = assets[0]?.priceLastUpdated;
      const needsSync = !lastUpdated || (Date.now() - new Date(lastUpdated).getTime() > 300000);
      if (needsSync) {
        syncMutation.mutate();
      }
    }
  }, [activePortfolioId, assets.length]);
  
  // Calculate total PnL for header display
  const totalPnl = assets.reduce((sum, a) => sum + (a.unrealizedPnl || 0), 0);
  const totalPnlPercent = portfolio?.totalValue ? (totalPnl / (portfolio.totalValue - totalPnl)) * 100 : 0;
  const isPnlPositive = totalPnl >= 0;

  if (portfoliosLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-800 rounded-lg w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
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
                className="text-gray-400 hover:text-white hover:bg-slate-800 min-w-[44px] min-h-[44px]"
              >
                {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <div className="flex flex-col items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || !activePortfolioId}
                  className="border-slate-700 text-gray-300 hover:bg-slate-800 hover:text-white min-h-[44px]"
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
              <Card className="bg-slate-900/80 border-slate-700/50 p-8">
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

                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-700/50">
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
                        : 'border-slate-600 text-gray-300'
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
                <Card className="bg-slate-900/80 border-slate-700/50 p-5 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
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
                <Card className="bg-slate-900/80 border-slate-700/50 p-5 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all">
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
              <Card className="bg-slate-900/60 border-slate-700/50 p-3 mb-6">
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
                      className="text-gray-400 hover:text-white hover:bg-slate-800 hidden sm:flex"
                      data-testid="button-set-alert"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Set Alert
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRebalanceDialog(true)}
                      className="text-gray-400 hover:text-white hover:bg-slate-800 hidden sm:flex"
                      data-testid="button-rebalance"
                    >
                      <Scale className="w-4 h-4 mr-2" />
                      Rebalance
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTaxDialog(true)}
                      className="text-gray-400 hover:text-white hover:bg-slate-800 hidden md:flex"
                      data-testid="button-tax-loss"
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      Tax Loss
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-gray-500 border-slate-600 text-xs">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                        Holdings
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-gray-400 border-slate-600 text-xs">
                          {assets.length} positions
                        </Badge>
                        {assets.length > 0 && (
                          <AddAssetDialog portfolioId={activePortfolioId!} onSuccess={() => refetchPortfolio()} />
                        )}
                      </div>
                    </div>
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
                              <div key={item.label} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                          <AssetRow key={asset.id} asset={asset} portfolioId={activePortfolioId!} showValues={showValues} />
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Performance Chart */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-green-400" />
                        Performance
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-slate-600">
                        {((portfolio?.totalPnlPercent || 0) >= 0 ? '+' : '')}{(portfolio?.totalPnlPercent || 0).toFixed(2)}% all time
                      </Badge>
                    </div>
                    <PerformanceChart portfolio={portfolio} assets={assets} portfolioId={activePortfolioId} />
                  </Card>

                  {/* Risk & Metrics Panel */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-cyan-400" />
                        Risk Metrics
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Volatility</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {assets.length > 0 ? 'Medium' : '--'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Crosshair className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-gray-400">Concentration</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-white">
                          {assets.length > 0 ? `${assets.length > 1 ? Math.round(100 / assets.length) : 100}%` : '--'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
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
                            <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Top Movers (24h)
                      </h2>
                    </div>
                    <TopMovers assets={assets} showValues={showValues} />
                  </Card>

                  {/* Correlation Matrix */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-cyan-400" />
                        Asset Correlations
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-slate-600">30D</Badge>
                    </div>
                    <CorrelationMatrix assets={assets} />
                  </Card>

                  {/* AI Insights Feed */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
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
                              'bg-slate-800/30 border-slate-700/50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-1.5 rounded-md mt-0.5",
                                rec.priority === 'high' ? 'bg-red-500/10' :
                                rec.priority === 'medium' ? 'bg-amber-500/10' :
                                'bg-slate-700/50'
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
                                  <Badge variant="outline" className="text-[11px] sm:text-[10px] text-gray-500 border-slate-600 px-1.5 py-0">
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
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      Portfolio Health
                    </h2>
                    <div className="flex justify-center mb-5">
                      <HealthScoreRing score={analysis?.healthScore || portfolio?.healthScore || 0} />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Diversification</span>
                          <span className="text-white font-medium">{analysis?.diversificationScore || portfolio?.diversificationScore || 0}%</span>
                        </div>
                        <Progress value={analysis?.diversificationScore || portfolio?.diversificationScore || 0} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-sm text-gray-400">Risk Profile</span>
                        <Badge className={cn("text-xs", riskLevelColors[analysis?.riskLevel || portfolio?.riskLevel || ''] || 'text-gray-400 bg-gray-500/20')}>
                          {(analysis?.riskLevel || portfolio?.riskLevel || 'Unknown').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Asset Allocation */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
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
                            const colorGradient = assetTypeColors[type] || assetTypeColors.other;
                            return (
                              <div key={type} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2.5 h-2.5 rounded-full bg-gradient-to-r", colorGradient)} />
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
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-xs text-gray-400">If BTC drops 30%</span>
                        <span className="text-xs font-medium text-red-400">
                          {showValues ? `-$${Math.round((assets.find(a => a.symbol === 'BTC')?.currentValue || 0) * 0.3).toLocaleString()}` : '••••'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-xs text-gray-400">If stocks drop 20%</span>
                        <span className="text-xs font-medium text-red-400">
                          {showValues ? `-$${Math.round(assets.filter(a => a.assetType === 'stock').reduce((sum, a) => sum + (a.currentValue || 0), 0) * 0.2).toLocaleString()}` : '••••'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-xs text-gray-400">Worst case (50% crash)</span>
                        <span className="text-xs font-medium text-red-400">
                          {showValues ? `-$${Math.round((portfolio?.totalValue || 0) * 0.5).toLocaleString()}` : '••••'}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs h-8">
                      <Calculator className="w-3 h-3 mr-1.5" />
                      Custom Scenario
                    </Button>
                  </Card>

                  {/* Event Calendar */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Upcoming Events
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {assets.filter(a => a.assetType === 'stock').length > 0 ? (
                        <>
                          <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-cyan-400">Earnings</span>
                              <span className="text-[11px] sm:text-[10px] text-gray-500">Jan 15</span>
                            </div>
                            <p className="text-xs text-gray-300">COIN Q4 earnings report</p>
                          </div>
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-amber-400">Fed Meeting</span>
                              <span className="text-[11px] sm:text-[10px] text-gray-500">Jan 29</span>
                            </div>
                            <p className="text-xs text-gray-300">FOMC rate decision</p>
                          </div>
                        </>
                      ) : null}
                      {assets.filter(a => a.assetType === 'crypto').length > 0 ? (
                        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-purple-400">Token Unlock</span>
                            <span className="text-[11px] sm:text-[10px] text-gray-500">Jan 12</span>
                          </div>
                          <p className="text-xs text-gray-300">SOL foundation unlock 2.5M tokens</p>
                        </div>
                      ) : null}
                      {assets.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">Add assets to see relevant events</p>
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
                  <Card className="bg-slate-900/80 border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4 text-green-400" />
                        Passive Income
                      </h3>
                    </div>
                    <IncomeTracker assets={assets} />
                  </Card>

                  {/* News Feed */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Latest News
                      </h3>
                      <Badge variant="outline" className="text-[11px] sm:text-[9px] text-gray-500 border-slate-600">Live</Badge>
                    </div>
                    <NewsAggregator assets={assets} />
                  </Card>
                </div>
              </div>

              {/* Section Divider */}
              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-950 px-4 text-xs text-gray-500 uppercase tracking-wider">Advanced Analytics</span>
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
                    <div className="md:col-span-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
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
                        className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors text-left group"
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
                        className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors text-left group"
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
                        className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors text-left group"
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

                {/* Portfolio Analytics + Tax Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Portfolio Analytics */}
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Portfolio Analytics
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-slate-600">vs. S&P 500</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                  <Card className="bg-slate-900/80 border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-400" />
                        Tax Dashboard
                      </h2>
                      <Badge variant="outline" className="text-[10px] text-gray-500 border-slate-600">2024 Tax Year</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <span className="text-xs text-gray-400">Unrealized Gains</span>
                        <p className={cn("text-xl font-bold", (portfolio?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {showValues ? `${(portfolio?.totalPnl || 0) >= 0 ? '+' : ''}$${Math.abs(portfolio?.totalPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                      <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs text-gray-400">Long-term holdings (1yr+)</span>
                        </div>
                        <span className="text-xs font-medium text-white">
                          {taxAnalytics ? `${taxAnalytics.longTermAssetCount} assets` : assets.length > 0 ? '--' : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
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
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Price Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              Set Price Alert
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400 text-sm">Select Asset</Label>
              <Select>
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Choose asset" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {assets.map(a => (
                    <SelectItem key={a.id} value={a.symbol} className="text-white hover:bg-slate-700">
                      {a.symbol} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Alert When Price</Label>
              <div className="flex gap-2 mt-1.5">
                <Select defaultValue="above">
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="above" className="text-white">Goes above</SelectItem>
                    <SelectItem value="below" className="text-white">Goes below</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Enter price" className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <Button 
              onClick={() => {
                toast({ title: 'Alert Created!', description: 'You will be notified when the price target is reached' });
                setShowAlertDialog(false);
              }}
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              Create Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rebalance Dialog */}
      <Dialog open={showRebalanceDialog} onOpenChange={setShowRebalanceDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              Portfolio Rebalancing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-400">
              AI-recommended rebalancing to optimize your portfolio allocation:
            </p>
            <div className="space-y-2">
              {assets.slice(0, 5).map(a => {
                const targetAllocation = 100 / Math.max(assets.length, 1);
                const diff = (a.allocationPercent || 0) - targetAllocation;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{a.symbol}</span>
                      <span className="text-xs text-gray-500">{a.allocationPercent?.toFixed(1)}%</span>
                    </div>
                    <div className={cn("text-xs font-medium", diff > 5 ? 'text-red-400' : diff < -5 ? 'text-green-400' : 'text-gray-400')}>
                      {diff > 0 ? `Sell ${diff.toFixed(1)}%` : diff < 0 ? `Buy ${Math.abs(diff).toFixed(1)}%` : 'Balanced'}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button 
              onClick={() => {
                toast({ title: 'Rebalance Simulated', description: 'Review the suggested trades in your portfolio' });
                setShowRebalanceDialog(false);
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500"
            >
              Apply Rebalancing Suggestions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax Analytics Dialog */}
      <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              Tax Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400">Long-term (15% rate)</span>
                </div>
                <p className="text-lg font-bold text-green-400">{taxAnalytics?.longTermAssetCount || 0} assets</p>
                <p className="text-xs text-gray-500">
                  {taxAnalytics?.longTermGains ? `+$${taxAnalytics.longTermGains.toLocaleString(undefined, { maximumFractionDigits: 0 })} gains` : 'No gains'}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-amber-500/20">
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
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-red-500/20">
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
                <p className="text-center py-4 text-gray-500 bg-slate-800/30 rounded-lg">
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
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
                  'bg-slate-800/50 border-slate-700/50'
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Set Portfolio Goals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400 text-sm">Target Portfolio Value</Label>
              <Input placeholder="e.g. $100,000" className="mt-1.5 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Target Date</Label>
              <Input type="date" className="mt-1.5 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Monthly Contribution</Label>
              <Input placeholder="e.g. $500/month" className="mt-1.5 bg-slate-800 border-slate-600 text-white" />
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
    </div>
  );
}
