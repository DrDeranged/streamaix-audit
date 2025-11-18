import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Award, Zap, ArrowUpRight, ArrowDownRight, ArrowLeft, Flame, PieChart } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type Position = {
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  percentChange: number;
};

type Trade = {
  id: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  price: number;
  type: 'buy' | 'sell';
  timestamp: string;
  pnl?: number;
};

type PortfolioData = {
  totalProfit: number;
  totalVolume: number;
  winRate: number;
  roi: number;
  totalTrades: number;
  winningTrades: number;
  currentStreak: number;
  positions: Position[];
  recentTrades: Trade[];
};

export default function MarketPortfolio() {
  const userId = "1"; // TODO: Get from auth context

  const { data: portfolio, isLoading } = useQuery<{ portfolio: PortfolioData }>({
    queryKey: ['/api/markets/portfolio', userId],
    refetchInterval: 30000
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatCurrency = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${formatNumber(num)}`;
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getPnLGradient = (value: number) => {
    if (value > 0) return 'from-emerald-400 via-emerald-500 to-emerald-600';
    if (value < 0) return 'from-red-400 via-red-500 to-red-600';
    return 'from-slate-400 to-slate-500';
  };

  const getPnLBgColor = (value: number) => {
    if (value > 0) return 'bg-emerald-500/10 border-emerald-500/30';
    if (value < 0) return 'bg-red-500/10 border-red-500/30';
    return 'bg-slate-500/10 border-slate-500/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 relative overflow-hidden">
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="loading-skeleton">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-lg bg-gradient-to-r from-slate-800/30 to-slate-700/30 animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-lg bg-gradient-to-r from-slate-800/30 to-slate-700/30 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const p = portfolio?.portfolio;
  if (!p) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No portfolio data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <Link href="/markets">
              <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <PieChart className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
              </motion.div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                Portfolio
              </h1>
            </div>
            <p className="text-slate-400 text-lg">Track your positions, performance, and trade history</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className={`bg-gradient-to-r ${getPnLGradient(p.totalProfit)} p-[2px] shadow-xl ${p.totalProfit > 0 ? 'shadow-emerald-500/30' : 'shadow-red-500/30'}`}>
                <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <h3 className="text-sm font-medium text-slate-400">Total Profit</h3>
                  </div>
                  <div className={`text-3xl font-bold ${getPnLColor(p.totalProfit)}`} data-testid="total-profit">
                    <AnimatedCounter value={p.totalProfit} formatValue={(v) => formatCurrency(v)} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">all-time earnings</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 p-[2px] shadow-xl shadow-emerald-500/30">
                <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <h3 className="text-sm font-medium text-slate-400">Win Rate</h3>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400" data-testid="win-rate">
                    <AnimatedCounter value={p.winRate} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {p.winningTrades} / {p.totalTrades} trades
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className={`bg-gradient-to-r ${getPnLGradient(p.roi)} p-[2px] shadow-xl ${p.roi > 0 ? 'shadow-cyan-500/30' : 'shadow-red-500/30'}`}>
                <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <h3 className="text-sm font-medium text-slate-400">ROI</h3>
                  </div>
                  <div className={`text-3xl font-bold ${getPnLColor(p.roi)}`} data-testid="roi">
                    <AnimatedCounter value={p.roi} decimals={1} formatValue={(v) => formatCurrency(v)} suffix="%" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">return on investment</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 p-[2px] shadow-xl shadow-purple-500/30">
                <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                    <h3 className="text-sm font-medium text-slate-400">Total Volume</h3>
                  </div>
                  <div className="text-3xl font-bold text-purple-400" data-testid="total-volume">
                    <AnimatedCounter value={p.totalVolume} formatValue={(v) => formatNumber(v)} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">tokens traded</div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-cyan-500/20 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-medium text-slate-400">Total Trades</h3>
              </div>
              <div className="text-3xl font-bold text-cyan-400" data-testid="total-trades">
                <AnimatedCounter value={p.totalTrades} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-emerald-500/20 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-medium text-slate-400">Winning Trades</h3>
              </div>
              <div className="text-3xl font-bold text-emerald-400" data-testid="winning-trades">
                <AnimatedCounter value={p.winningTrades} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-amber-500/20 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                {p.currentStreak > 0 && <Flame className="w-5 h-5 text-amber-400 animate-pulse" />}
                {p.currentStreak <= 0 && <Zap className="w-5 h-5 text-amber-400" />}
                <h3 className="text-sm font-medium text-slate-400">Current Streak</h3>
              </div>
              <div className="text-3xl font-bold text-amber-400" data-testid="current-streak">
                <AnimatedCounter value={Math.abs(p.currentStreak)} prefix={p.currentStreak > 0 ? '🔥 ' : ''} />
              </div>
            </Card>
          </motion.div>

          {/* Active Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-cyan-500/20 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Active Positions</h2>
                <span className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-cyan-500/20">
                  {p.positions.length} open
                </span>
              </div>

              {p.positions.length === 0 ? (
                <div className="text-center py-16 text-slate-400" data-testid="empty-positions">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Target className="w-20 h-20 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg">No active positions</p>
                  <p className="text-sm text-slate-500 mt-2">Start trading to see your portfolio!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {p.positions.map((position, index) => (
                    <motion.div
                      key={`${position.marketId}-${position.outcome}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      data-testid={`position-${index}`}
                    >
                      <Card className={`bg-gradient-to-r ${getPnLGradient(position.unrealizedPnL)} p-[1px] ${position.unrealizedPnL > 0 ? 'shadow-lg shadow-emerald-500/20' : 'shadow-lg shadow-red-500/20'}`}>
                        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 className="text-lg font-bold text-white" data-testid={`position-market-${index}`}>
                                  {position.marketTitle}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs border border-cyan-500/40 font-semibold">
                                    {position.outcome}
                                  </span>
                                  <span className="text-sm text-slate-400">
                                    <AnimatedCounter value={position.shares} /> shares @ {position.avgPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500">Current:</span>{' '}
                                  <span className="text-white font-medium">{position.currentPrice.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Change:</span>{' '}
                                  <span className={getPnLColor(position.percentChange)}>
                                    {position.percentChange >= 0 ? '+' : ''}{position.percentChange.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-400 mb-1">Unrealized P&L</div>
                              <div className={`text-2xl font-bold flex items-center justify-end gap-1 ${getPnLColor(position.unrealizedPnL)}`} data-testid={`position-pnl-${index}`}>
                                {position.unrealizedPnL >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                <AnimatedCounter value={position.unrealizedPnL} formatValue={(v) => formatCurrency(v)} />
                              </div>
                              <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getPnLBgColor(position.unrealizedPnL)}`}>
                                {position.unrealizedPnL >= 0 ? 'Profit' : 'Loss'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-500/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Recent Trades</h2>
                <span className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-purple-500/20">
                  Last {p.recentTrades.length}
                </span>
              </div>

              {p.recentTrades.length === 0 ? (
                <div className="text-center py-16 text-slate-400" data-testid="empty-trades">
                  <motion.div
                    animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="w-20 h-20 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg">No recent trades</p>
                  <p className="text-sm text-slate-500 mt-2">Your trade history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-400">Market</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-400">Outcome</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-slate-400">Type</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-slate-400">Shares</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-slate-400">Price</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-slate-400">P&L</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-slate-400">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.recentTrades.map((trade, index) => (
                        <motion.tr 
                          key={trade.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                          data-testid={`trade-${trade.id}`}
                        >
                          <td className="py-3 px-2 text-sm text-white" data-testid={`trade-market-${trade.id}`}>
                            {trade.marketTitle}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/40">
                              {trade.outcome}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              trade.type === 'buy' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-white">
                            {trade.shares}
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-white">
                            {trade.price.toFixed(2)}
                          </td>
                          <td className={`py-3 px-2 text-sm text-right font-medium ${trade.pnl ? getPnLColor(trade.pnl) : 'text-slate-400'}`}>
                            {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-slate-400">
                            {new Date(trade.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
