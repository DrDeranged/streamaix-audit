import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Surface from '@/components/ds/Surface';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import {
  Cpu, TrendingUp, TrendingDown, Users, Coins, Activity, Target, Flame,
  BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Eye, LogIn, Zap,
  Shield, Crosshair, Clock, Trophy, ChevronRight, ChevronLeft, Sparkles, BarChart2,
  Bot, AlertTriangle, DollarSign, Briefcase, Layers, Network, Server, Brain, User,
  Crown, MessageSquareQuote, Package, Home,
} from 'lucide-react';

const categoryConfig: Record<string, { label: string; color: string; icon: any; gradient: string }> = {
  VC: { label: 'VC', color: 'text-accent-bright bg-accent-core/15 border-accent-core/30', icon: Briefcase, gradient: 'grad-surface' },
  DeFi: { label: 'DeFi', color: 'text-accent-bright bg-accent-core/15 border-accent-core/30', icon: Layers, gradient: 'grad-surface' },
  'L1/L2': { label: 'L1/L2', color: 'text-accent-bright bg-accent-core/15 border-accent-core/30', icon: Network, gradient: 'grad-surface' },
  Trading: { label: 'Trading', color: 'text-warn bg-warn/15 border-warn/30', icon: TrendingUp, gradient: 'grad-surface' },
  Bitcoin: { label: 'Bitcoin', color: 'text-warn bg-warn/15 border-warn/30', icon: Coins, gradient: 'grad-surface' },
  'AI/Tech': { label: 'AI/Tech', color: 'text-gain bg-gain/15 border-gain/30', icon: Sparkles, gradient: 'grad-surface' },
  Infrastructure: { label: 'Infra', color: 'text-secondary bg-ink-raised border-ink-edge', icon: Server, gradient: 'grad-surface' },
};

const tradingStyleConfig: Record<string, { label: string; color: string }> = {
  aggressive: { label: 'Aggressive', color: 'text-loss bg-loss/15 border-loss/30' },
  moderate: { label: 'Moderate', color: 'text-warn bg-warn/15 border-warn/30' },
  conservative: { label: 'Conservative', color: 'text-accent-bright bg-accent-core/15 border-accent-core/30' },
};

function getCategory(c: string) {
  return categoryConfig[c] || categoryConfig.Trading;
}

function getTradingStyle(s: string) {
  return tradingStyleConfig[s] || tradingStyleConfig.moderate;
}

function AvatarImage({ src, fallbackEmoji, size = 'md', className = '' }: { src?: string; fallbackEmoji?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'w-11 h-11', md: 'w-12 h-12', lg: 'w-16 h-16' };
  const textSizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' };
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-ink-raised border border-ink-edge flex items-center justify-center ${textSizes[size]} ${className}`}>
        {fallbackEmoji || <User className="w-1/2 h-1/2 text-secondary" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="avatar"
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-ink-edge ${className}`}
      onError={() => setImgError(true)}
    />
  );
}

function MiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const color = positive ? '#3DD68C' : '#FF7B7B';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PerformanceChart({ snapshots }: { snapshots: any[] }) {
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted text-sm">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p>Performance data will appear after trades execute</p>
        </div>
      </div>
    );
  }

  const values = snapshots.map((s: any) => s.cumulativeRoi ?? s.roi ?? s.value ?? 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const width = 600;
  const height = 180;
  const padding = { top: 20, bottom: 30, left: 50, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = values.map((v, i) => ({
    x: padding.left + (i / (values.length - 1)) * chartW,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;
  const isPositive = values[values.length - 1] >= values[0];
  const color = isPositive ? '#3DD68C' : '#FF7B7B';

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => minVal + (range / (yTicks - 1)) * i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[200px]" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="perfChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#232B45" strokeWidth="0.5" />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" fill="#9BA3B7" fontSize="10">{val.toFixed(1)}%</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#perfChartGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {points.length > 0 && (
         <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} stroke="#080B14" strokeWidth="2" />
      )}
    </svg>
  );
}

function BotCard({ bot, onSelect, rank }: { bot: any; onSelect: () => void; rank: number }) {
  const roi = bot.avgTradeRoi ?? 0;
  const isPositive = roi >= 0;
  const config = getCategory(bot.category);
  const Icon = config.icon;
  const style = getTradingStyle(bot.tradingStyle);
  const winRate = bot.winRate ?? 0;
  const totalStaked = Number(bot.totalStaked ?? 0);
  const backers = Number(bot.backerCount ?? 0);
  const trades = Number(bot.recentTradeCount ?? bot.totalTrades ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.3) }}
      className="cursor-pointer group"
      onClick={onSelect}
    >
      <div className="relative bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-2xl p-5 hover:border-accent-core/40 transition-all duration-300 overflow-hidden">

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AvatarImage src={bot.imageUrl} fallbackEmoji={bot.personaEmoji} />
                {rank <= 3 && (
                  <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    rank === 1 ? 'bg-warn text-ink-page' : rank === 2 ? 'bg-secondary text-ink-page' : 'bg-warn text-primary'
                  }`}>
                    #{rank}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-primary font-semibold text-sm">{bot.name}</h3>
                {bot.handle && <p className="text-[11px] text-muted">@{bot.handle}</p>}
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                    <Icon className="w-2.5 h-2.5 mr-1" />
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${style.color}`}>
                    {style.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {roi.toFixed(1)}%
              </div>
              <span className="text-[10px] text-muted">ROI</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-secondary">Win Rate</span>
              <span className="text-accent-bright font-medium">{winRate.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-ink-raised rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent-core"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(winRate, 100)}%` }}
                transition={{ duration: 1, delay: rank * 0.05 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-ink-raised/40 rounded-xl p-2 text-center border border-ink-edge/30">
              <p className="text-[10px] text-muted">Staked</p>
              <p className="text-xs font-semibold text-primary">{totalStaked >= 1000 ? `${(totalStaked / 1000).toFixed(0)}k` : totalStaked}</p>
            </div>
            <div className="bg-ink-raised/40 rounded-xl p-2 text-center border border-ink-edge/30">
              <p className="text-[10px] text-muted">Backers</p>
              <p className="text-xs font-semibold text-accent-bright">{backers}</p>
            </div>
            <div className="bg-ink-raised/40 rounded-xl p-2 text-center border border-ink-edge/30">
              <p className="text-[10px] text-muted">Trades</p>
              <p className="text-xs font-semibold text-warn">{trades}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-edge/30">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Shield className="w-3 h-3" />
              <span>Risk: <span className="text-body capitalize">{bot.riskTolerance || 'medium'}</span></span>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-bright group-hover:text-accent-bright transition-colors">
              View <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BotDetailDialog({ botId, open, onClose }: { botId: string | null; open: boolean; onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');

  const { data: botData, isLoading } = useQuery<any>({
    queryKey: ['/api/bot-trading/bots', botId],
    enabled: !!botId && open,
  });

  const stakeMutation = useMutation({
    mutationFn: async (data: { avatarId: string; amount: number }) =>
      apiRequest('/api/bot-trading/stake', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/my-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setStakeAmount('');
      toast({ title: 'Stake Placed!', description: 'Your STREAM points have been staked on this avatar.' });
    },
    onError: (err: any) => {
      toast({ title: 'Stake Failed', description: err.message, variant: 'destructive' });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (stakeId: string) =>
      apiRequest('/api/bot-trading/withdraw', { method: 'POST', body: JSON.stringify({ stakeId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/my-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({ title: 'Withdrawn!', description: 'Your stake has been withdrawn successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Withdraw Failed', description: err.message, variant: 'destructive' });
    },
  });

  const bot = botData?.bot;
  const trades = botData?.trades || [];
  const snapshots = botData?.performanceSnapshots || botData?.snapshots || [];
  const stakeStats = botData?.stakeStats;
  const userStake = botData?.userStake;
  const openPositions = botData?.openPositions || [];
  const portfolio = botData?.portfolio || [];
  const recentReasonings = botData?.recentReasonings || [];
  const preferredAssets = bot?.preferredAssets || [];

  const handleStake = () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to stake STREAM points.', variant: 'destructive' });
      return;
    }
    const amount = parseInt(stakeAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount.', variant: 'destructive' });
      return;
    }
    if (user?.streamPoints !== undefined && amount > (user.streamPoints as number)) {
      toast({ title: 'Insufficient balance', description: 'You don\'t have enough STREAM points.', variant: 'destructive' });
      return;
    }
    stakeMutation.mutate({ avatarId: botId!, amount });
  };

  if (!botId) return null;

  const config = bot ? getCategory(bot.category) : getCategory('Trading');
  const CatIcon = config.icon;
  const style = bot ? getTradingStyle(bot.tradingStyle) : getTradingStyle('moderate');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-ink-surface/95 backdrop-blur-2xl border-ink-edge/50 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-accent-core/30 rounded-full animate-spin border-t-cyan-500" />
              <Sparkles className="w-5 h-5 text-accent-bright absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        ) : bot ? (
          <>
            <div className={`relative grad-surface p-6 pb-4`}>
              <div className="absolute inset-0 bg-ink-surface/40" />
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-4 text-primary">
                    <AvatarImage src={bot.imageUrl} fallbackEmoji={bot.personaEmoji} size="lg" className="shadow-lg" />
                    <div>
                      <h2 className="text-xl font-bold">{bot.name}</h2>
                      {bot.handle && <p className="text-sm text-secondary font-normal">@{bot.handle}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          <CatIcon className="w-2.5 h-2.5 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${style.color}`}>
                          {style.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-secondary border-ink-edge">
                          Risk: {bot.riskTolerance}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                {bot.description && (
                  <p className="text-sm text-body/80 mt-3 leading-relaxed">{bot.description}</p>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'ROI', value: `${(bot.avgTradeRoi ?? 0).toFixed(1)}%`, color: (bot.avgTradeRoi ?? 0) >= 0 ? 'text-gain' : 'text-loss' },
                  { label: 'Win Rate', value: `${(bot.winRate ?? 0).toFixed(0)}%`, color: 'text-accent-bright' },
                  { label: 'Trades', value: bot.totalTrades ?? 0, color: 'text-primary' },
                  { label: 'Influence', value: bot.influenceScore ?? 0, color: 'text-warn' },
                  { label: 'Backers', value: stakeStats?.backerCount ?? bot.backerCount ?? 0, color: 'text-accent-bright' },
                  { label: 'Staked', value: `${(Number(stakeStats?.totalStaked ?? bot.totalStaked ?? 0) / 1000).toFixed(0)}k`, color: 'text-accent-bright' },
                ].map((stat, i) => (
                  <div key={i} className="bg-ink-raised/50 rounded-xl p-2.5 text-center border border-ink-edge/30">
                    <p className="text-[9px] text-muted uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-bright" /> Performance History
                </h3>
                <div className="bg-ink-raised/30 rounded-xl border border-ink-edge/30 p-3">
                  <PerformanceChart snapshots={snapshots} />
                </div>
              </div>

              {trades.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-bright" /> Recent Trades
                  </h3>
                  <div className="bg-ink-raised/30 rounded-xl border border-ink-edge/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-ink-edge/50 text-muted">
                            <th className="text-left p-2.5">Asset</th>
                            <th className="text-left p-2.5">Direction</th>
                            <th className="text-right p-2.5">Entry</th>
                            <th className="text-right p-2.5">Exit</th>
                            <th className="text-right p-2.5">P&L</th>
                            <th className="text-left p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.slice(0, 10).map((trade: any, i: number) => {
                            const pnl = trade.pnl ?? trade.totalPnl ?? 0;
                            const isLong = trade.direction === 'long';
                            return (
                              <tr key={i} className="border-b border-ink-edge/20 hover:bg-ink-raised/50 transition-colors">
                                <td className="p-2.5 text-primary font-medium">{trade.asset || trade.symbol || '-'}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className={`text-[10px] ${isLong ? 'text-gain border-gain/30' : 'text-loss border-loss/30'}`}>
                                    {isLong ? '↑ Long' : '↓ Short'}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-right text-body">${Number(trade.entryPrice ?? 0).toFixed(2)}</td>
                                <td className="p-2.5 text-right text-body">{trade.exitPrice ? `$${Number(trade.exitPrice).toFixed(2)}` : '—'}</td>
                                <td className={`p-2.5 text-right font-medium ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                                  {pnl >= 0 ? '+' : ''}{Number(pnl).toFixed(2)}
                                </td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className={`text-[10px] ${trade.status === 'open' ? 'text-warn border-warn/30' : 'text-secondary border-ink-edge'}`}>
                                    {trade.status || 'closed'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {bot.personaPhilosophy && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent-bright" /> Trading Philosophy
                  </h3>
                  <div className="bg-ink-raised/30 rounded-xl border border-accent-core/20 p-4">
                    <p className="text-xs text-body/80 leading-relaxed italic">{bot.personaPhilosophy}</p>
                  </div>
                </div>
              )}

              {preferredAssets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-warn" /> Preferred Assets
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {preferredAssets.map((a: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-warn border-warn/30 bg-warn/5">
                        {a.name || a.symbol} ({a.type})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {openPositions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent-bright" /> Open Positions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {openPositions.slice(0, 6).map((pos: any, i: number) => {
                      const isLong = pos.direction === 'long';
                      return (
                        <div key={i} className="bg-ink-raised/50 rounded-xl p-3 border border-ink-edge/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-primary font-semibold">{pos.asset}</span>
                            <Badge variant="outline" className={`text-[9px] ${isLong ? 'text-gain border-gain/30' : 'text-loss border-loss/30'}`}>
                              {isLong ? '↑ Long' : '↓ Short'}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted">
                            Entry: <span className="text-body">${Number(pos.entryPrice ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-muted">
                            Qty: <span className="text-body">{Number(pos.quantity ?? 0).toFixed(4)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {portfolio.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-accent-bright" /> Portfolio Breakdown
                  </h3>
                  <div className="bg-ink-raised/30 rounded-xl border border-ink-edge/30 p-3 space-y-2">
                    {(() => {
                      const maxValue = Math.max(...portfolio.map((p: any) => Math.abs(p.currentValue || p.quantity * p.entryPrice)));
                      const colors = ['bg-accent-core/500', 'bg-accent-core/500', 'bg-gain/500', 'bg-warn/500', 'bg-accent-core', 'bg-accent-core'];
                      return portfolio.map((p: any, i: number) => {
                        const value = Math.abs(p.currentValue || p.quantity * p.entryPrice);
                        const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-primary font-medium w-16 truncate">{p.asset}</span>
                            <div className="flex-1 h-2 bg-ink-raised rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${colors[i % colors.length]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-secondary w-20 text-right">${value.toFixed(0)}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {recentReasonings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-body mb-2 flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-accent-bright" /> Trading Insights
                  </h3>
                  <div className="space-y-2">
                    {recentReasonings.map((r: any, i: number) => (
                      <div key={i} className="bg-ink-raised/40 rounded-xl p-3 border border-ink-edge/30 relative">
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">{bot.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[9px] text-accent-bright border-accent-core/30">{r.asset}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${r.direction === 'long' ? 'text-gain border-gain/30' : 'text-loss border-loss/30'}`}>
                                {r.direction === 'long' ? '↑ Long' : '↓ Short'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-body/80 leading-relaxed italic">
                              &ldquo;{(r.reasoning || '').split(' | ')[0]}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-ink-raised rounded-xl border border-accent-core/20 p-5">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-accent-bright" /> Stake STREAM Points
                </h3>

                {userStake ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-ink-surface/60 rounded-xl p-3 border border-ink-edge/30">
                        <p className="text-[10px] text-muted uppercase">Your Stake</p>
                        <p className="text-lg font-bold text-primary">{Number(userStake.amount ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-ink-surface/60 rounded-xl p-3 border border-ink-edge/30">
                        <p className="text-[10px] text-muted uppercase">Current Value</p>
                        <p className="text-lg font-bold text-accent-bright">{Number(userStake.currentValue ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`text-center p-2.5 rounded-xl font-medium text-sm ${(userStake.totalPnl ?? 0) >= 0 ? 'bg-gain/10 text-gain border border-gain/20' : 'bg-loss/10 text-loss border border-loss/20'}`}>
                      P&L: {(userStake.totalPnl ?? 0) >= 0 ? '+' : ''}{Number(userStake.totalPnl ?? 0).toFixed(2)} ({Number(userStake.totalPnlPercent ?? 0).toFixed(1)}%)
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-loss/30 text-loss hover:bg-loss/10 hover:border-loss/50"
                      onClick={() => withdrawMutation.mutate(userStake.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Stake'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isAuthenticated && (
                      <p className="text-xs text-secondary">
                        Balance: <span className="text-accent-bright font-semibold">{((user?.streamPoints as number) ?? 0).toLocaleString()} STREAM</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount to stake"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="bg-ink-raised/50 border-ink-edge text-primary placeholder:text-muted"
                      />
                      <Button
                        onClick={handleStake}
                        disabled={stakeMutation.isPending}
                        className="grad-accent glow-accent text-primary font-semibold whitespace-nowrap rounded-xl"
                      >
                        {!isAuthenticated ? (
                          <><LogIn className="w-4 h-4 mr-1" /> Sign In</>
                        ) : stakeMutation.isPending ? (
                          'Staking...'
                        ) : (
                          <><Zap className="w-4 h-4 mr-1" /> Stake</>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-muted">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>Stakes are simulated. Avatar performance is based on real market data but trades are paper-traded.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-muted">Avatar not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-ink-surface/60 border border-ink-edge/40 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-ink-raised" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-ink-raised rounded mb-2" />
          <div className="w-16 h-4 bg-ink-raised rounded" />
        </div>
        <div className="w-16 h-6 bg-ink-raised rounded" />
      </div>
      <div className="w-full h-1.5 bg-ink-raised rounded-full mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-ink-raised/40 rounded-xl" />)}
      </div>
    </div>
  );
}

function LiveTradeFeed() {
  const { data: tradesData } = useQuery({ queryKey: ['/api/bot-trading/recent-trades'] });
  const trades = Array.isArray(tradesData) ? tradesData : [];

  if (trades.length === 0) return null;

  const doubled = [...trades, ...trades];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-gain/400 animate-pulse" />
        <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Live Trade Feed</h3>
      </div>
      <div className="bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-2xl p-3 overflow-hidden">
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-3"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: trades.length * 4, repeat: Infinity, ease: 'linear' }}
          >
            {doubled.map((trade: any, i: number) => {
              const pnl = Number(trade.pnl ?? 0);
              const isPositive = pnl >= 0;
              const isLong = trade.direction === 'long';
              const reasoning = trade.reasoning ? (trade.reasoning.length > 60 ? trade.reasoning.slice(0, 60) + '...' : trade.reasoning) : '';

              return (
                <div
                  key={`${trade.id}-${i}`}
                  className="flex-shrink-0 bg-ink-raised/50 border border-ink-edge/30 rounded-xl p-3 min-w-[220px] sm:min-w-[260px] max-w-[280px] hover:border-accent-core/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <AvatarImage src={trade.avatarImageUrl} size="sm" className="!w-7 !h-7" />
                    <span className="text-xs text-primary font-medium truncate">{trade.avatarName}</span>
                    <Badge variant="outline" className={`text-[9px] ml-auto ${isLong ? 'text-gain border-gain/30' : 'text-loss border-loss/30'}`}>
                      {isLong ? '↑ Long' : '↓ Short'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent-bright font-semibold">{trade.asset}</span>
                    {trade.status === 'closed' && (
                      <span className={`text-xs font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                        {isPositive ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    )}
                    {trade.status === 'open' && (
                      <Badge variant="outline" className="text-[9px] text-warn border-warn/30">Open</Badge>
                    )}
                  </div>
                  {reasoning && (
                    <p className="text-[10px] text-muted mt-1.5 leading-tight italic truncate">&ldquo;{reasoning}&rdquo;</p>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardContent() {
  const [period, setPeriod] = useState<string>('all');
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: [`/api/bot-trading/leaderboard?period=${period}`],
  });
  const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : [];

  const crownColors = ['text-warn', 'text-body', 'text-warn/60'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'all', label: 'All Time' },
        ].map((p) => (
          <Button
            key={p.value}
            variant="outline"
            size="sm"
            className={`text-xs h-8 ${
              period === p.value
                ? 'bg-accent-core/20 border-accent-core/50 text-accent-bright'
                : 'border-ink-edge/50 text-secondary hover:text-primary hover:border-accent-core/50'
            }`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-ink-surface/40 border border-ink-edge/40 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-ink-surface/40 backdrop-blur-xl border border-ink-edge/40 rounded-2xl">
          <Trophy className="w-14 h-14 text-muted mx-auto mb-4" />
          <p className="text-secondary text-lg font-medium mb-1">No leaderboard data yet</p>
          <p className="text-muted text-sm">Trades need to be executed first</p>
        </motion.div>
      ) : (
        <div className="bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-2xl overflow-hidden">
          <div className="table-scroller relative w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-ink-edge/50 text-muted">
                  <th className="text-left p-3 w-12">#</th>
                  <th className="text-left p-3">Avatar</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-center p-3">Trades</th>
                  <th className="text-left p-3 min-w-[120px]">Win Rate</th>
                  <th className="text-right p-3">ROI</th>
                  <th className="text-right p-3">Total P&L</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {leaderboard.map((entry: any, i: number) => {
                    const isPositivePnl = entry.totalPnl >= 0;
                    const isPositiveRoi = entry.avgRoi >= 0;
                    const catConfig = getCategory(entry.category);

                    return (
                      <motion.tr
                        key={entry.avatarId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-ink-edge/20 hover:bg-ink-raised/50 transition-colors"
                      >
                        <td className="p-3">
                          {entry.rank <= 3 ? (
                            <Crown className={`w-5 h-5 ${crownColors[entry.rank - 1]}`} />
                          ) : (
                            <span className="text-muted font-medium pl-0.5">{entry.rank}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <AvatarImage src={entry.imageUrl} size="sm" className="!w-8 !h-8" />
                            <div>
                              <p className="text-primary font-medium text-sm">{entry.name}</p>
                              <p className="text-[10px] text-muted">@{entry.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${catConfig.color}`}>
                            {catConfig.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-body">{entry.totalTrades}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-ink-raised rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent-core"
                                style={{ width: `${Math.min(entry.winRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-accent-bright font-medium">{entry.winRate.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className={`p-3 text-right font-bold ${isPositiveRoi ? 'text-gain' : 'text-loss'}`}>
                          {isPositiveRoi ? '+' : ''}{entry.avgRoi.toFixed(1)}%
                        </td>
                        <td className={`p-3 text-right font-bold ${isPositivePnl ? 'text-gain' : 'text-loss'}`}>
                          {isPositivePnl ? '+' : ''}${entry.totalPnl.toFixed(0)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const categories = ['all', 'VC', 'DeFi', 'L1/L2', 'Trading', 'Bitcoin', 'AI/Tech', 'Infrastructure'] as const;

export default function BotTradingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('roi');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const BOTS_PER_PAGE = 9;

  const { data: statsData } = useQuery({ queryKey: ['/api/bot-trading/stats'] });
  const stats = statsData as any;

  const botsQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    params.set('sort', sort);
    params.set('limit', String(BOTS_PER_PAGE));
    params.set('offset', String((page - 1) * BOTS_PER_PAGE));
    const qs = params.toString();
    return [`/api/bot-trading/bots?${qs}`];
  }, [category, sort, page]);

  const { data: botsData, isLoading: botsLoading } = useQuery({ queryKey: botsQueryKey });
  const botsResponse = botsData as any;
  const bots = botsResponse?.bots || (Array.isArray(botsData) ? botsData : []);
  const totalBots = botsResponse?.total || bots.length;
  const totalPages = Math.ceil(totalBots / BOTS_PER_PAGE);

  const { data: stakesData, isLoading: stakesLoading } = useQuery({
    queryKey: ['/api/bot-trading/my-stakes'],
    enabled: isAuthenticated,
  });
  const stakes = Array.isArray(stakesData) ? stakesData : (stakesData as any)?.stakes || [];

  const withdrawMutation = useMutation({
    mutationFn: async (stakeId: string) =>
      apiRequest('/api/bot-trading/withdraw', { method: 'POST', body: JSON.stringify({ stakeId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/my-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({ title: 'Withdrawn!', description: 'Your stake has been withdrawn successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Withdraw Failed', description: err.message, variant: 'destructive' });
    },
  });

  const totalInvested = stakes.reduce((s: number, st: any) => s + Number(st.amount ?? 0), 0);
  const totalCurrentValue = stakes.reduce((s: number, st: any) => s + Number(st.currentValue ?? 0), 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-ink-page text-primary">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(6,182,212,0.04) 1.5px, transparent 1.5px)', backgroundSize: '50px 50px' }} />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: i % 3 === 0 ? 'rgba(6,182,212,0.4)' : i % 3 === 1 ? 'rgba(168,85,247,0.3)' : 'rgba(16,185,129,0.3)',
            }}
            animate={{ y: [0, -40, 0], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Link href="/">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block mb-4"
          >
            <Button
              variant="outline"
              size="sm"
              className="bg-ink-surface/60 backdrop-blur-xl border-ink-edge/50 hover:border-accent-core/50 hover:bg-accent-core/5 text-secondary hover:text-accent-bright transition-all duration-300 rounded-xl"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-accent-core/10 flex items-center justify-center border border-accent-core/30 shadow-lg shadow-accent-core/10"
              animate={{ boxShadow: ['0 0 20px rgba(6,182,212,0.1)', '0 0 40px rgba(6,182,212,0.2)', '0 0 20px rgba(6,182,212,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-7 h-7 text-accent-bright" />
            </motion.div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Avatar Trading Simulator
          </h1>
          <p className="text-secondary text-sm max-w-md mx-auto">
            Stake STREAM points on legendary investors & traders and watch them trade real markets with simulated capital
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Coins, label: 'Total Staked', value: stats?.totalStaked ? `${(Number(stats.totalStaked) / 1000).toFixed(0)}k` : '0', sub: 'STREAM', iconBg: 'bg-accent-core/10', iconBorder: 'border-accent-core/20', iconColor: 'text-accent-bright', subColor: 'text-accent-bright/70', hoverBorder: 'hover:border-accent-core/40', glow: 'shadow-accent-core/10' },
            { icon: Users, label: 'Active Traders', value: stats?.activeTraders ?? '0', sub: 'staking now', iconBg: 'bg-accent-core/10', iconBorder: 'border-accent-core/20', iconColor: 'text-accent-bright', subColor: 'text-accent-bright/70', hoverBorder: 'hover:border-accent-core/40', glow: 'shadow-accent-core/10' },
            { icon: Trophy, label: 'Top Avatar', value: stats?.topBot?.name ?? '—', sub: stats?.topBot ? `${(stats.topBot.avgTradeRoi ?? 0).toFixed(1)}% ROI` : '', iconBg: 'bg-gain/10', iconBorder: 'border-gain/20', iconColor: 'text-gain', subColor: 'text-gain/70', hoverBorder: 'hover:border-gain/40', glow: 'shadow-gain/10', imageUrl: stats?.topBot?.imageUrl },
            { icon: Activity, label: 'Total Trades', value: stats?.totalTrades ?? '0', sub: 'executed', iconBg: 'bg-warn/10', iconBorder: 'border-warn/20', iconColor: 'text-warn', subColor: 'text-warn/70', hoverBorder: 'hover:border-warn/40', glow: 'shadow-warn/10' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className={`bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-2xl p-4 ${item.hoverBorder} transition-all shadow-lg ${item.glow}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} border ${item.iconBorder} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted uppercase tracking-wider">{item.label}</p>
                  <p className="text-base sm:text-lg font-bold text-primary truncate">{item.value}</p>
                  {item.sub && <p className={`text-[10px] ${item.subColor}`}>{item.sub}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <LiveTradeFeed />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-ink-surface/60 border border-ink-edge/40 p-1 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-accent-core/20 data-[state=active]:text-accent-bright data-[state=active]:shadow-sm px-3 sm:px-5">
                <Sparkles className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">All Avatars</span><span className="sm:hidden">All</span>
                <Badge variant="outline" className="ml-1.5 sm:ml-2 text-[10px] border-ink-edge text-secondary">{totalBots}</Badge>
              </TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-accent-core/20 data-[state=active]:text-accent-bright data-[state=active]:shadow-sm px-3 sm:px-5">
                <Wallet className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">My Stakes</span><span className="sm:hidden">Stakes</span>
                {stakes.length > 0 && <Badge variant="outline" className="ml-1.5 sm:ml-2 text-[10px] border-accent-core/30 text-accent-bright">{stakes.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-warn/20 data-[state=active]:text-warn data-[state=active]:shadow-sm px-3 sm:px-5">
                <Trophy className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Leaderboard</span><span className="sm:hidden">Board</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === 'all' && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-ink-surface/60 border-ink-edge/50 text-primary text-sm h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-ink-surface border-ink-edge">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(c => c !== 'all').map(c => {
                      const cfg = getCategory(c);
                      const CIcon = cfg.icon;
                      return (
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center gap-2">
                            <CIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-ink-surface/60 border-ink-edge/50 text-primary text-sm h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-ink-surface border-ink-edge">
                    <SelectItem value="roi">ROI</SelectItem>
                    <SelectItem value="winRate">Win Rate</SelectItem>
                    <SelectItem value="backers">Backers</SelectItem>
                    <SelectItem value="totalStaked">Total Staked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="all">
            {botsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : bots.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-ink-surface/40 backdrop-blur-xl border border-ink-edge/40 rounded-2xl">
                <Sparkles className="w-14 h-14 text-muted mx-auto mb-4" />
                <p className="text-secondary text-lg font-medium mb-1">No avatars found</p>
                <p className="text-muted text-sm">Try adjusting your filters</p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bots.map((bot: any, i: number) => (
                    <BotCard key={bot.id} bot={bot} rank={(page - 1) * BOTS_PER_PAGE + i + 1} onSelect={() => setSelectedBotId(bot.id)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-ink-edge/50 text-secondary hover:text-primary hover:border-accent-core/50 disabled:opacity-30"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className={`w-9 h-9 ${
                          p === page
                            ? 'bg-accent-core/20 border-accent-core/50 text-accent-bright'
                            : 'border-ink-edge/50 text-secondary hover:text-primary hover:border-accent-core/50'
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-ink-edge/50 text-secondary hover:text-primary hover:border-accent-core/50 disabled:opacity-30"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <span className="text-xs text-muted ml-3">
                      {(page - 1) * BOTS_PER_PAGE + 1}-{Math.min(page * BOTS_PER_PAGE, totalBots)} of {totalBots}
                    </span>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="my">
            {!isAuthenticated ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-ink-surface/40 backdrop-blur-xl border border-ink-edge/40 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-accent-core/10 border border-accent-core/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-accent-bright" />
                </div>
                <p className="text-body text-lg font-medium mb-1">Sign in to view your stakes</p>
                <p className="text-muted text-sm">Track your avatar investments and P&L</p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                  {[
                    { label: 'Invested', value: `${totalInvested.toLocaleString()}`, icon: Coins, color: 'text-primary' },
                    { label: 'Current Value', value: `${totalCurrentValue.toLocaleString()}`, icon: DollarSign, color: 'text-accent-bright' },
                    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}`, icon: TrendingUp, color: totalPnl >= 0 ? 'text-gain' : 'text-loss' },
                    { label: 'P&L %', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%`, icon: BarChart3, color: totalPnlPct >= 0 ? 'text-gain' : 'text-loss' },
                  ].map((item, i) => (
                    <div key={i} className="bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-muted" />
                        <p className="text-[10px] text-muted uppercase tracking-wider">{item.label}</p>
                      </div>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </motion.div>

                {stakesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="bg-ink-surface/40 border border-ink-edge/40 rounded-xl h-20 animate-pulse" />)}
                  </div>
                ) : stakes.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-ink-surface/40 backdrop-blur-xl border border-ink-edge/40 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-accent-core/10 border border-accent-core/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-accent-bright" />
                    </div>
                    <p className="text-body font-medium mb-1">No active stakes yet</p>
                    <p className="text-muted text-sm mb-5">Browse avatars and stake STREAM points to get started</p>
                    <Button
                      className="grad-accent glow-accent text-primary rounded-xl"
                      onClick={() => setActiveTab('all')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Browse Avatars
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {stakes.map((stake: any, i: number) => {
                        const pnl = stake.totalPnl ?? (Number(stake.currentValue ?? 0) - Number(stake.amount ?? 0));
                        const pnlPct = stake.totalPnlPercent ?? (Number(stake.amount) > 0 ? (pnl / Number(stake.amount)) * 100 : 0);
                        const isPositive = pnl >= 0;
                        const stakeCategory = getCategory(stake.botCategory || 'Trading');
                        const stakeStyle = getTradingStyle(stake.botTradingStyle || 'moderate');

                        return (
                          <motion.div
                            key={stake.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="bg-ink-surface/60 backdrop-blur-xl border border-ink-edge/40 rounded-xl p-4 hover:border-accent-core/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div
                                  className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                  onClick={() => setSelectedBotId(stake.avatarId)}
                                >
                                  <AvatarImage src={stake.botImageUrl} size="sm" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className="text-primary font-medium text-sm truncate cursor-pointer hover:text-accent-bright transition-colors"
                                      onClick={() => setSelectedBotId(stake.avatarId)}
                                    >
                                      {stake.botName}
                                    </h4>
                                    {stake.botHandle && <span className="text-[10px] text-muted">@{stake.botHandle}</span>}
                                    <Badge variant="outline" className={`text-[9px] ${stakeCategory.color}`}>
                                      {stakeCategory.label}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-xs">
                                    <span className="text-muted">Staked: <span className="text-primary font-medium">{Number(stake.amount ?? 0).toLocaleString()}</span></span>
                                    <span className="text-muted">Value: <span className="text-accent-bright font-medium">{Number(stake.currentValue ?? 0).toLocaleString()}</span></span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {isPositive ? '+' : ''}{Number(pnl).toFixed(0)}
                                  </div>
                                  <p className={`text-[10px] ${isPositive ? 'text-gain/70' : 'text-loss/70'}`}>
                                    {isPositive ? '+' : ''}{Number(pnlPct).toFixed(1)}%
                                  </p>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-loss/30 text-loss hover:bg-loss/10 hover:border-loss/50 shrink-0"
                                  onClick={() => withdrawMutation.mutate(stake.id)}
                                  disabled={withdrawMutation.isPending}
                                >
                                  Withdraw
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardContent />
          </TabsContent>
        </Tabs>
      </div>

      <BotDetailDialog
        botId={selectedBotId}
        open={!!selectedBotId}
        onClose={() => setSelectedBotId(null)}
      />
    </div>
  );
}
