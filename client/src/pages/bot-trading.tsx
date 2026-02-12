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
  Cpu,
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  Activity,
  Target,
  Flame,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Eye,
  LogIn,
  Zap,
} from 'lucide-react';

const strategyColors: Record<string, string> = {
  momentum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  contrarian: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  swing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  scalp: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const avatarColors = ['bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-blue-500'];

function NeuralBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(6,182,212,0.03) 2px, transparent 2px)', backgroundSize: '50px 50px' }} />
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}

function PerformanceChart({ snapshots }: { snapshots: any[] }) {
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
        Not enough data for chart
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

  const points = values.map((v, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - minVal) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  const isPositive = values[values.length - 1] >= values[0];
  const color = isPositive ? '#10b981' : '#ef4444';

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = minVal + (range / (yTicks - 1)) * i;
    return val;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[200px]" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#334155" strokeWidth="0.5" />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">
              {val.toFixed(1)}%
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} stroke="#0f172a" strokeWidth="2" />
      )}
    </svg>
  );
}

function BotCard({ bot, onSelect }: { bot: any; onSelect: () => void }) {
  const isPositiveRoi = (bot.roi ?? 0) >= 0;
  const colorIdx = bot.name ? bot.name.charCodeAt(0) % avatarColors.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <Card className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl ${avatarColors[colorIdx]} flex items-center justify-center text-xl shrink-0`}>
              {bot.avatar || bot.name?.charAt(0) || '🤖'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{bot.name}</h3>
              <Badge variant="outline" className={`text-[10px] mt-1 ${strategyColors[bot.strategy] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                {bot.strategy}
              </Badge>
            </div>
            <div className={`text-right ${isPositiveRoi ? 'text-emerald-400' : 'text-red-400'}`}>
              <div className="flex items-center gap-1 text-lg font-bold">
                {isPositiveRoi ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {(bot.roi ?? 0).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500">ROI</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Win Rate</span>
                <span className="text-cyan-400 font-medium">{(bot.accuracyRate ?? 0).toFixed(1)}%</span>
              </div>
              <Progress value={bot.accuracyRate ?? 0} className="h-1.5 bg-slate-800" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-500">Staked</p>
                <p className="text-sm font-semibold text-white">{((bot.totalStaked ?? 0) / 1000).toFixed(0)}k</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-500">Backers</p>
                <p className="text-sm font-semibold text-white">{bot.backerCount ?? 0}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-500">Trades</p>
                <p className="text-sm font-semibold text-white">{bot.recentTradeCount ?? 0}</p>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
            <Eye className="w-3.5 h-3.5 mr-1.5" /> View Bot
          </Button>
        </CardContent>
      </Card>
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
  const snapshots = botData?.performanceSnapshots || [];
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-purple-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bot ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-white">
                <div className={`w-14 h-14 rounded-xl ${avatarColors[bot.name?.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-2xl`}>
                  {bot.avatar || bot.name?.charAt(0) || '🤖'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{bot.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={strategyColors[bot.strategy] || 'bg-slate-500/20 text-slate-400'}>
                      {bot.strategy}
                    </Badge>
                    <span className="text-xs text-slate-500">Risk: {bot.riskTolerance}</span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {bot.personality && (
              <p className="text-sm text-slate-400 italic border-l-2 border-purple-500/30 pl-3 mt-2">
                "{bot.personality}"
              </p>
            )}
            {bot.description && (
              <p className="text-sm text-slate-400 mt-2">{bot.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: 'ROI', value: `${(bot.roi ?? 0).toFixed(1)}%`, color: (bot.roi ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Win Rate', value: `${(bot.accuracyRate ?? 0).toFixed(1)}%`, color: 'text-cyan-400' },
                { label: 'Total Trades', value: bot.totalPredictions ?? 0, color: 'text-white' },
                { label: 'Streak', value: `🔥 ${bot.currentStreak ?? 0}`, color: 'text-amber-400' },
                { label: 'Backers', value: stakeStats?.backerCount ?? bot.backerCount ?? 0, color: 'text-purple-400' },
                { label: 'Total Staked', value: `${((stakeStats?.totalStaked ?? bot.totalStaked ?? 0) / 1000).toFixed(0)}k`, color: 'text-cyan-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Performance
              </h3>
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-2">
                <PerformanceChart snapshots={snapshots} />
              </div>
            </div>

            {trades.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Recent Trades
                </h3>
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-slate-500">
                          <th className="text-left p-2">Asset</th>
                          <th className="text-left p-2">Dir</th>
                          <th className="text-right p-2">Entry</th>
                          <th className="text-right p-2">Exit</th>
                          <th className="text-right p-2">P&L</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 10).map((trade: any, i: number) => {
                          const pnl = trade.pnl ?? trade.totalPnl ?? 0;
                          const isLong = trade.direction === 'long';
                          return (
                            <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/50">
                              <td className="p-2 text-white font-medium">{trade.asset || trade.symbol || '-'}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={`text-[10px] ${isLong ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                                  {isLong ? '↑ Long' : '↓ Short'}
                                </Badge>
                              </td>
                              <td className="p-2 text-right text-slate-300">${(trade.entryPrice ?? 0).toFixed(2)}</td>
                              <td className="p-2 text-right text-slate-300">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</td>
                              <td className={`p-2 text-right font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                              </td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-[10px]">{trade.status || 'closed'}</Badge>
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

            <div className="mt-4 bg-slate-800/30 rounded-xl border border-purple-500/20 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" /> Stake STREAM Points
              </h3>

              {userStake ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500">Your Stake</p>
                      <p className="text-lg font-bold text-white">{(userStake.amount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500">Current Value</p>
                      <p className="text-lg font-bold text-cyan-400">{(userStake.currentValue ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${(userStake.totalPnl ?? 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    P&L: {(userStake.totalPnl ?? 0) >= 0 ? '+' : ''}{(userStake.totalPnl ?? 0).toFixed(2)} ({(userStake.totalPnlPercent ?? 0).toFixed(1)}%)
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => withdrawMutation.mutate(userStake.id)}
                    disabled={withdrawMutation.isPending}
                  >
                    {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Stake'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAuthenticated && (
                    <p className="text-xs text-slate-500">
                      Balance: <span className="text-cyan-400 font-medium">{((user?.streamPoints as number) ?? 0).toLocaleString()} STREAM</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount to stake"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                    <Button
                      onClick={handleStake}
                      disabled={stakeMutation.isPending}
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white whitespace-nowrap"
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
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-500">Bot not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function BotTradingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [strategy, setStrategy] = useState('all');
  const [sort, setSort] = useState('roi');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const { data: statsData } = useQuery({ queryKey: ['/api/bot-trading/stats'] });
  const stats = statsData as any;

  const botsQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    if (strategy !== 'all') params.set('strategy', strategy);
    params.set('sort', sort);
    params.set('limit', '20');
    const qs = params.toString();
    return [`/api/bot-trading/bots?${qs}`];
  }, [strategy, sort]);

  const { data: botsData, isLoading: botsLoading } = useQuery({ queryKey: botsQueryKey });
  const bots = (botsData as any)?.bots || [];

  const { data: stakesData, isLoading: stakesLoading } = useQuery({
    queryKey: ['/api/bot-trading/my-stakes'],
    enabled: isAuthenticated,
  });
  const stakes = (stakesData as any)?.stakes || [];

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

  const totalInvested = stakes.reduce((s: number, st: any) => s + (st.amount ?? 0), 0);
  const totalCurrentValue = stakes.reduce((s: number, st: any) => s + (st.currentValue ?? 0), 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Bot Trading Simulator
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Stake STREAM points on AI trading bots and watch them trade real markets
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Coins, label: 'Total Staked', value: stats?.totalStaked ? `${(stats.totalStaked / 1000).toFixed(0)}k` : '0', color: 'cyan' },
            { icon: Users, label: 'Active Traders', value: stats?.activeTraders ?? 0, color: 'purple' },
            { icon: Target, label: 'Top Bot', value: stats?.topBot?.name ?? '-', sub: stats?.topBot ? `${(stats.topBot.roi ?? 0).toFixed(1)}% ROI` : '', color: 'emerald' },
            { icon: Activity, label: 'Total Trades', value: stats?.totalTrades ?? 0, color: 'amber' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                  {item.sub && <p className="text-[10px] text-emerald-400">{item.sub}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/60 border border-purple-500/20 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400">
              <Cpu className="w-4 h-4 mr-1.5" /> All Bots
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              <Wallet className="w-4 h-4 mr-1.5" /> My Bots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="flex flex-wrap gap-3 mb-6">
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="w-[160px] bg-slate-900/60 border-slate-700 text-white">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Strategies</SelectItem>
                  <SelectItem value="momentum">Momentum</SelectItem>
                  <SelectItem value="contrarian">Contrarian</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                  <SelectItem value="scalp">Scalp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[140px] bg-slate-900/60 border-slate-700 text-white">
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

            {botsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-900/40 border border-purple-500/20 rounded-xl h-[280px] animate-pulse" />
                ))}
              </div>
            ) : bots.length === 0 ? (
              <div className="text-center py-20">
                <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">No bots found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bots.map((bot: any) => (
                  <BotCard key={bot.id} bot={bot} onSelect={() => setSelectedBotId(bot.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my">
            {!isAuthenticated ? (
              <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
                <LogIn className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">Sign in to view your stakes</p>
                <p className="text-xs text-slate-600">Track your bot investments and P&L</p>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                  {[
                    { label: 'Invested', value: totalInvested.toLocaleString(), color: 'text-white' },
                    { label: 'Current Value', value: totalCurrentValue.toLocaleString(), color: 'text-cyan-400' },
                    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'P&L %', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%`, color: totalPnlPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                      <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </motion.div>

                {stakesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-slate-900/40 border border-purple-500/20 rounded-xl h-20 animate-pulse" />
                    ))}
                  </div>
                ) : stakes.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
                    <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-1">You haven't staked on any bots yet.</p>
                    <p className="text-xs text-slate-600 mb-4">Browse bots to get started!</p>
                    <Button
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => setActiveTab('all')}
                    >
                      Browse Bots
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {stakes.map((stake: any, i: number) => {
                        const pnl = stake.totalPnl ?? ((stake.currentValue ?? 0) - (stake.amount ?? 0));
                        const pnlPct = stake.totalPnlPercent ?? (stake.amount > 0 ? (pnl / stake.amount) * 100 : 0);
                        const isPositive = pnl >= 0;
                        const colorIdx = stake.botName ? stake.botName.charCodeAt(0) % avatarColors.length : 0;

                        return (
                          <motion.div
                            key={stake.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="bg-slate-900/40 backdrop-blur-xl border border-purple-500/20 hover:border-cyan-500/30 transition-all">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-10 h-10 rounded-xl ${avatarColors[colorIdx]} flex items-center justify-center text-lg shrink-0 cursor-pointer`}
                                    onClick={() => setSelectedBotId(stake.agentId)}
                                  >
                                    {stake.botAvatar || stake.botName?.charAt(0) || '🤖'}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4
                                        className="text-white font-medium text-sm truncate cursor-pointer hover:text-cyan-400 transition-colors"
                                        onClick={() => setSelectedBotId(stake.agentId)}
                                      >
                                        {stake.botName}
                                      </h4>
                                      <Badge variant="outline" className={`text-[9px] ${strategyColors[stake.botStrategy] || ''}`}>
                                        {stake.botStrategy}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs">
                                      <span className="text-slate-500">Staked: <span className="text-white">{(stake.amount ?? 0).toLocaleString()}</span></span>
                                      <span className="text-slate-500">Value: <span className="text-cyan-400">{(stake.currentValue ?? 0).toLocaleString()}</span></span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                      {isPositive ? '+' : ''}{pnl.toFixed(0)}
                                    </div>
                                    <p className={`text-[10px] ${isPositive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                      {isPositive ? '+' : ''}{pnlPct.toFixed(1)}%
                                    </p>
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                                    onClick={() => withdrawMutation.mutate(stake.id)}
                                    disabled={withdrawMutation.isPending}
                                  >
                                    Withdraw
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
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
