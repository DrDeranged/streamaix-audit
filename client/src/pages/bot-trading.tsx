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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Cpu, TrendingUp, TrendingDown, Users, Coins, Activity, Target, Flame,
  BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Eye, LogIn, Zap,
  Shield, Crosshair, Clock, Trophy, ChevronRight, ChevronLeft, Sparkles, BarChart2,
  Bot, AlertTriangle, DollarSign,
} from 'lucide-react';

const personalityConfig: Record<string, { label: string; color: string; icon: any; gradient: string }> = {
  momentum: { label: 'Momentum', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30', icon: Zap, gradient: 'from-cyan-500/20 to-blue-500/20' },
  contrarian: { label: 'Contrarian', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: Target, gradient: 'from-purple-500/20 to-pink-500/20' },
  'swing-trader': { label: 'Swing Trader', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Activity, gradient: 'from-amber-500/20 to-orange-500/20' },
  scalper: { label: 'Scalper', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: Crosshair, gradient: 'from-emerald-500/20 to-teal-500/20' },
  conservative: { label: 'Conservative', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', icon: Shield, gradient: 'from-blue-500/20 to-indigo-500/20' },
  aggressive: { label: 'Aggressive', color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: Flame, gradient: 'from-red-500/20 to-orange-500/20' },
  hodler: { label: 'HODLer', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30', icon: DollarSign, gradient: 'from-yellow-500/20 to-amber-500/20' },
  'day-trader': { label: 'Day Trader', color: 'text-pink-400 bg-pink-500/15 border-pink-500/30', icon: Clock, gradient: 'from-pink-500/20 to-rose-500/20' },
  quantitative: { label: 'Quant', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30', icon: BarChart2, gradient: 'from-indigo-500/20 to-violet-500/20' },
  arbitrage: { label: 'Arbitrage', color: 'text-teal-400 bg-teal-500/15 border-teal-500/30', icon: Sparkles, gradient: 'from-teal-500/20 to-cyan-500/20' },
};

function getPersonality(p: string) {
  return personalityConfig[p] || personalityConfig.momentum;
}

function MiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PerformanceChart({ snapshots }: { snapshots: any[] }) {
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
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
  const color = isPositive ? '#10b981' : '#ef4444';

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
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#334155" strokeWidth="0.5" />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">{val.toFixed(1)}%</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#perfChartGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} stroke="#0f172a" strokeWidth="2" />
      )}
    </svg>
  );
}

function BotCard({ bot, onSelect, rank }: { bot: any; onSelect: () => void; rank: number }) {
  const roi = bot.roi ?? 0;
  const isPositive = roi >= 0;
  const config = getPersonality(bot.personality);
  const Icon = config.icon;
  const winRate = bot.accuracyRate ?? 0;
  const totalStaked = Number(bot.totalStaked ?? 0);
  const backers = Number(bot.backerCount ?? 0);
  const trades = Number(bot.recentTradeCount ?? bot.totalPredictions ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.3) }}
      className="cursor-pointer group"
      onClick={onSelect}
    >
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-5 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-2xl">
                  {bot.avatar || '🤖'}
                </div>
                {rank <= 3 && (
                  <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    rank === 1 ? 'bg-amber-500 text-black' : rank === 2 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                  }`}>
                    #{rank}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{bot.name}</h3>
                <Badge variant="outline" className={`text-[10px] mt-0.5 ${config.color}`}>
                  <Icon className="w-2.5 h-2.5 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {roi.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500">ROI</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Win Rate</span>
              <span className="text-cyan-400 font-medium">{winRate.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(winRate, 100)}%` }}
                transition={{ duration: 1, delay: rank * 0.05 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-700/30">
              <p className="text-[10px] text-slate-500">Staked</p>
              <p className="text-xs font-semibold text-white">{totalStaked >= 1000 ? `${(totalStaked / 1000).toFixed(0)}k` : totalStaked}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-700/30">
              <p className="text-[10px] text-slate-500">Backers</p>
              <p className="text-xs font-semibold text-purple-400">{backers}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-700/30">
              <p className="text-[10px] text-slate-500">Trades</p>
              <p className="text-xs font-semibold text-amber-400">{trades}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/30">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3 h-3" />
              <span>Risk: <span className="text-slate-300 capitalize">{bot.riskTolerance || 'medium'}</span></span>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400 group-hover:text-cyan-300 transition-colors">
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
    mutationFn: async (data: { agentId: string; amount: number }) =>
      apiRequest('/api/bot-trading/stake', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/my-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-trading/stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setStakeAmount('');
      toast({ title: 'Stake Placed!', description: 'Your STREAM points have been staked on this bot.' });
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
    stakeMutation.mutate({ agentId: botId!, amount });
  };

  if (!botId) return null;

  const config = bot ? getPersonality(bot.personality) : getPersonality('momentum');
  const BotIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-slate-700/50 max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500" />
              <Bot className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        ) : bot ? (
          <>
            <div className={`relative bg-gradient-to-br ${config.gradient} p-6 pb-4`}>
              <div className="absolute inset-0 bg-slate-900/40" />
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-4 text-white">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-600/50 flex items-center justify-center text-3xl shadow-lg">
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{bot.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          <BotIcon className="w-2.5 h-2.5 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">
                          Risk: {bot.riskTolerance}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                {bot.description && (
                  <p className="text-sm text-slate-300/80 mt-3 leading-relaxed">{bot.description}</p>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'ROI', value: `${(bot.roi ?? 0).toFixed(1)}%`, color: (bot.roi ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Win Rate', value: `${(bot.accuracyRate ?? 0).toFixed(0)}%`, color: 'text-cyan-400' },
                  { label: 'Trades', value: bot.totalPredictions ?? 0, color: 'text-white' },
                  { label: 'Streak', value: `🔥 ${bot.currentStreak ?? 0}`, color: 'text-amber-400' },
                  { label: 'Backers', value: stakeStats?.backerCount ?? bot.backerCount ?? 0, color: 'text-purple-400' },
                  { label: 'Staked', value: `${(Number(stakeStats?.totalStaked ?? bot.totalStaked ?? 0) / 1000).toFixed(0)}k`, color: 'text-cyan-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-2.5 text-center border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Performance History
                </h3>
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-3">
                  <PerformanceChart snapshots={snapshots} />
                </div>
              </div>

              {trades.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Recent Trades
                  </h3>
                  <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-700/50 text-slate-500">
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
                              <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/50 transition-colors">
                                <td className="p-2.5 text-white font-medium">{trade.asset || trade.symbol || '-'}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className={`text-[10px] ${isLong ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                                    {isLong ? '↑ Long' : '↓ Short'}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-right text-slate-300">${Number(trade.entryPrice ?? 0).toFixed(2)}</td>
                                <td className="p-2.5 text-right text-slate-300">{trade.exitPrice ? `$${Number(trade.exitPrice).toFixed(2)}` : '—'}</td>
                                <td className={`p-2.5 text-right font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {pnl >= 0 ? '+' : ''}{Number(pnl).toFixed(2)}
                                </td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className={`text-[10px] ${trade.status === 'open' ? 'text-amber-400 border-amber-500/30' : 'text-slate-400 border-slate-600'}`}>
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

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-xl border border-cyan-500/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-cyan-400" /> Stake STREAM Points
                </h3>

                {userStake ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-[10px] text-slate-500 uppercase">Your Stake</p>
                        <p className="text-lg font-bold text-white">{Number(userStake.amount ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-[10px] text-slate-500 uppercase">Current Value</p>
                        <p className="text-lg font-bold text-cyan-400">{Number(userStake.currentValue ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`text-center p-2.5 rounded-lg font-medium text-sm ${(userStake.totalPnl ?? 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      P&L: {(userStake.totalPnl ?? 0) >= 0 ? '+' : ''}{Number(userStake.totalPnl ?? 0).toFixed(2)} ({Number(userStake.totalPnlPercent ?? 0).toFixed(1)}%)
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                      onClick={() => withdrawMutation.mutate(userStake.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Stake'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isAuthenticated && (
                      <p className="text-xs text-slate-400">
                        Balance: <span className="text-cyan-400 font-semibold">{((user?.streamPoints as number) ?? 0).toLocaleString()} STREAM</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount to stake"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleStake}
                        disabled={stakeMutation.isPending}
                        className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold whitespace-nowrap shadow-lg shadow-cyan-500/20"
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
                    <div className="flex items-start gap-2 text-[11px] text-slate-500">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>Stakes are simulated. Bot performance is based on real market data but trades are paper-traded.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-500">Bot not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-slate-800 rounded mb-2" />
          <div className="w-16 h-4 bg-slate-800 rounded" />
        </div>
        <div className="w-16 h-6 bg-slate-800 rounded" />
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800/40 rounded-lg" />)}
      </div>
    </div>
  );
}

export default function BotTradingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [strategy, setStrategy] = useState('all');
  const [sort, setSort] = useState('roi');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const BOTS_PER_PAGE = 9;

  const { data: statsData } = useQuery({ queryKey: ['/api/bot-trading/stats'] });
  const stats = statsData as any;

  const botsQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    if (strategy !== 'all') params.set('strategy', strategy);
    params.set('sort', sort);
    params.set('limit', String(BOTS_PER_PAGE));
    params.set('offset', String((page - 1) * BOTS_PER_PAGE));
    const qs = params.toString();
    return [`/api/bot-trading/bots?${qs}`];
  }, [strategy, sort, page]);

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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950" />
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-emerald-500/20 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
              animate={{ boxShadow: ['0 0 20px rgba(6,182,212,0.1)', '0 0 40px rgba(6,182,212,0.2)', '0 0 20px rgba(6,182,212,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Bot className="w-7 h-7 text-cyan-400" />
            </motion.div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Bot Trading Simulator
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Stake STREAM points on AI trading bots and watch them trade real markets with simulated capital
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Coins, label: 'Total Staked', value: stats?.totalStaked ? `${(Number(stats.totalStaked) / 1000).toFixed(0)}k` : '0', sub: 'STREAM', color: 'cyan', glow: 'shadow-cyan-500/10' },
            { icon: Users, label: 'Active Traders', value: stats?.activeTraders ?? '0', sub: 'staking now', color: 'purple', glow: 'shadow-purple-500/10' },
            { icon: Trophy, label: 'Top Bot', value: stats?.topBot?.name ?? '—', sub: stats?.topBot ? `${(stats.topBot.roi ?? 0).toFixed(1)}% ROI` : '', color: 'emerald', glow: 'shadow-emerald-500/10' },
            { icon: Activity, label: 'Total Trades', value: stats?.totalTrades ?? '0', sub: 'executed', color: 'amber', glow: 'shadow-amber-500/10' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 hover:border-${item.color}-500/40 transition-all shadow-lg ${item.glow}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold text-white truncate">{item.value}</p>
                  {item.sub && <p className={`text-[10px] text-${item.color}-400/70`}>{item.sub}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-900/60 border border-slate-700/40 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm px-5">
                <Bot className="w-4 h-4 mr-1.5" /> All Bots
                <Badge variant="outline" className="ml-2 text-[10px] border-slate-600 text-slate-400">{totalBots}</Badge>
              </TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 data-[state=active]:shadow-sm px-5">
                <Wallet className="w-4 h-4 mr-1.5" /> My Bots
                {stakes.length > 0 && <Badge variant="outline" className="ml-2 text-[10px] border-purple-500/30 text-purple-400">{stakes.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'all' && (
              <div className="flex flex-wrap gap-2">
                <Select value={strategy} onValueChange={(v) => { setStrategy(v); setPage(1); }}>
                  <SelectTrigger className="w-[150px] bg-slate-900/60 border-slate-700/50 text-white text-sm h-9">
                    <SelectValue placeholder="Strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Strategies</SelectItem>
                    <SelectItem value="momentum">Momentum</SelectItem>
                    <SelectItem value="contrarian">Contrarian</SelectItem>
                    <SelectItem value="swing-trader">Swing Trader</SelectItem>
                    <SelectItem value="scalper">Scalper</SelectItem>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="hodler">HODLer</SelectItem>
                    <SelectItem value="day-trader">Day Trader</SelectItem>
                    <SelectItem value="quantitative">Quant</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                  <SelectTrigger className="w-[130px] bg-slate-900/60 border-slate-700/50 text-white text-sm h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="roi">ROI</SelectItem>
                    <SelectItem value="backers">Backers</SelectItem>
                    <SelectItem value="winRate">Win Rate</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-2xl">
                <Bot className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium mb-1">No bots found</p>
                <p className="text-slate-500 text-sm">Try adjusting your filters</p>
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
                      className="border-slate-700/50 text-slate-400 hover:text-white hover:border-cyan-500/50 disabled:opacity-30"
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
                            ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400'
                            : 'border-slate-700/50 text-slate-400 hover:text-white hover:border-cyan-500/50'
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700/50 text-slate-400 hover:text-white hover:border-cyan-500/50 disabled:opacity-30"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <span className="text-xs text-slate-500 ml-3">
                      {(page - 1) * BOTS_PER_PAGE + 1}-{Math.min(page * BOTS_PER_PAGE, totalBots)} of {totalBots}
                    </span>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="my">
            {!isAuthenticated ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-slate-300 text-lg font-medium mb-1">Sign in to view your stakes</p>
                <p className="text-slate-500 text-sm">Track your bot investments and P&L</p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                  {[
                    { label: 'Invested', value: `${totalInvested.toLocaleString()}`, icon: Coins, color: 'text-white' },
                    { label: 'Current Value', value: `${totalCurrentValue.toLocaleString()}`, icon: DollarSign, color: 'text-cyan-400' },
                    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}`, icon: TrendingUp, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'P&L %', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%`, icon: BarChart3, color: totalPnlPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-slate-500" />
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                      </div>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </motion.div>

                {stakesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="bg-slate-900/40 border border-slate-700/40 rounded-xl h-20 animate-pulse" />)}
                  </div>
                ) : stakes.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-cyan-400" />
                    </div>
                    <p className="text-slate-300 font-medium mb-1">No active stakes yet</p>
                    <p className="text-slate-500 text-sm mb-5">Browse bots and stake STREAM points to get started</p>
                    <Button
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20"
                      onClick={() => setActiveTab('all')}
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Browse Bots
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {stakes.map((stake: any, i: number) => {
                        const pnl = stake.totalPnl ?? (Number(stake.currentValue ?? 0) - Number(stake.amount ?? 0));
                        const pnlPct = stake.totalPnlPercent ?? (Number(stake.amount) > 0 ? (pnl / Number(stake.amount)) * 100 : 0);
                        const isPositive = pnl >= 0;
                        const config = getPersonality(stake.botPersonality || stake.botStrategy || 'momentum');

                        return (
                          <motion.div
                            key={stake.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-xl p-4 hover:border-cyan-500/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-xl cursor-pointer hover:border-cyan-500/50 transition-colors shrink-0"
                                  onClick={() => setSelectedBotId(stake.agentId)}
                                >
                                  {stake.botAvatar || '🤖'}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className="text-white font-medium text-sm truncate cursor-pointer hover:text-cyan-400 transition-colors"
                                      onClick={() => setSelectedBotId(stake.agentId)}
                                    >
                                      {stake.botName}
                                    </h4>
                                    <Badge variant="outline" className={`text-[9px] ${config.color}`}>
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-xs">
                                    <span className="text-slate-500">Staked: <span className="text-white font-medium">{Number(stake.amount ?? 0).toLocaleString()}</span></span>
                                    <span className="text-slate-500">Value: <span className="text-cyan-400 font-medium">{Number(stake.currentValue ?? 0).toLocaleString()}</span></span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {isPositive ? '+' : ''}{Number(pnl).toFixed(0)}
                                  </div>
                                  <p className={`text-[10px] ${isPositive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                    {isPositive ? '+' : ''}{Number(pnlPct).toFixed(1)}%
                                  </p>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 shrink-0"
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
