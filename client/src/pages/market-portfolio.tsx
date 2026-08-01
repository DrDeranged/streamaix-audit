import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { PageHeader } from "@/components/PageHeader";
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
  // Use the authenticated user's positions endpoint instead of hardcoded ID
  const { data: portfolio, isLoading } = useQuery<{ portfolio: PortfolioData }>({
    queryKey: ['/api/markets/portfolio/me'],
    refetchInterval: 30000
  });

  const formatNumber = (num: number | undefined | null) => {
    if (num == null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatCurrency = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${formatNumber(num)}`;
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-gain';
    if (value < 0) return 'text-loss';
    return 'text-secondary';
  };

  const getPnLBgColor = (value: number) => {
    if (value > 0) return 'bg-gain/10 border-gain/30 text-gain';
    if (value < 0) return 'bg-loss/10 border-loss/30 text-loss';
    return 'bg-ink-raised border-ink-edge text-secondary';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-page relative overflow-hidden">
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="loading-skeleton">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl border border-ink-edge bg-ink-surface animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-xl border border-ink-edge bg-ink-surface animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const p = portfolio?.portfolio;
  if (!p) {
    return (
      <div className="min-h-screen bg-ink-page p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted" />
          <p className="text-secondary">No portfolio data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-page relative overflow-hidden tnums-scope">
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <Link href="/#prediction-markets">
              <Button variant="ghost" className="mb-4 rounded-xl text-secondary hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>

            <PageHeader
              align="center"
              eyebrow="Prediction markets · positions"
              title="Portfolio"
              icon={<PieChart className="h-5 w-5" />}
              subtitle="Track your positions, performance, and trade history."
            />
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Surface className="p-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-warn" />
                    <h3 className="text-sm font-medium text-secondary">Total Profit</h3>
                  </div>
                  <div className={`tabular text-3xl font-bold ${getPnLColor(p.totalProfit)}`} data-testid="total-profit">
                    <AnimatedCounter value={p.totalProfit} formatValue={(v) => formatCurrency(v)} />
                  </div>
                  <div className="text-xs text-muted mt-1">all-time earnings</div>
                </div>
              </Surface>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Surface className="p-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-gain" />
                    <h3 className="text-sm font-medium text-secondary">Win Rate</h3>
                  </div>
                  <div className="tabular text-3xl font-bold text-gain" data-testid="win-rate">
                    <AnimatedCounter value={p.winRate} formatValue={(v) => `${(v ?? 0) >= 0 ? '+' : ''}${(v ?? 0).toFixed(2)}%`} />
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {p.winningTrades} / {p.totalTrades} trades
                  </div>
                </div>
              </Surface>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Surface className="p-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-accent-bright" />
                    <h3 className="text-sm font-medium text-secondary">ROI</h3>
                  </div>
                  <div className={`tabular text-3xl font-bold ${getPnLColor(p.roi)}`} data-testid="roi">
                    <AnimatedCounter value={p.roi} formatValue={(v) => `${formatCurrency(v)}%`} />
                  </div>
                  <div className="text-xs text-muted mt-1">return on investment</div>
                </div>
              </Surface>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Surface className="p-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-accent-bright" />
                    <h3 className="text-sm font-medium text-secondary">Total Volume</h3>
                  </div>
                  <div className="tabular text-3xl font-bold text-accent-bright" data-testid="total-volume">
                    <AnimatedCounter value={p.totalVolume} formatValue={(v) => formatNumber(v)} />
                  </div>
                  <div className="text-xs text-muted mt-1">tokens traded</div>
                </div>
              </Surface>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Surface className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-accent-bright" />
                <h3 className="text-sm font-medium text-secondary">Total Trades</h3>
              </div>
              <div className="tabular text-3xl font-bold text-accent-bright" data-testid="total-trades">
                <AnimatedCounter value={p.totalTrades} formatValue={(v) => (v ?? 0).toFixed(0)} />
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-gain" />
                <h3 className="text-sm font-medium text-secondary">Winning Trades</h3>
              </div>
              <div className="tabular text-3xl font-bold text-gain" data-testid="winning-trades">
                <AnimatedCounter value={p.winningTrades} formatValue={(v) => (v ?? 0).toFixed(0)} />
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center gap-3 mb-2">
                {p.currentStreak > 0 && <Flame className="w-5 h-5 text-warn animate-pulse" />}
                {p.currentStreak <= 0 && <Zap className="w-5 h-5 text-warn" />}
                <h3 className="text-sm font-medium text-secondary">Current Streak</h3>
              </div>
              <div className="tabular text-3xl font-bold text-warn" data-testid="current-streak">
                <AnimatedCounter value={Math.abs(p.currentStreak)} formatValue={(v) => p.currentStreak > 0 ? `🔥 ${(v ?? 0).toFixed(0)}` : (v ?? 0).toFixed(0)} />
              </div>
            </Surface>
          </motion.div>

          {/* Active Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Surface className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle as="h2">Active Positions</SectionTitle>
                <span className="text-sm text-secondary bg-ink-raised px-3 py-1 rounded-xl border border-ink-edge">
                  {p.positions.length} open
                </span>
              </div>

              {p.positions.length === 0 ? (
                <div className="text-center py-16 text-secondary" data-testid="empty-positions">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Target className="w-20 h-20 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg">No active positions</p>
                   <p className="text-sm text-muted mt-2">Start trading to see your portfolio!</p>
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
                      <Surface variant="raised" className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 className="text-lg font-bold text-primary" data-testid={`position-market-${index}`}>
                                  {position.marketTitle}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className="px-2 py-1 rounded-xl bg-accent-core/15 text-accent-bright text-xs border border-accent-core/40 font-semibold">
                                    {position.outcome}
                                  </span>
                                   <span className="text-sm text-secondary tabular">
                                    <AnimatedCounter value={position.shares} formatValue={(v) => (v ?? 0).toFixed(0)} /> shares @ {(position.avgPrice ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                   <span className="text-muted">Current:</span>{' '}
                                   <span className="text-primary font-medium tabular">{(position.currentPrice ?? 0).toFixed(2)}</span>
                                </div>
                                <div>
                                   <span className="text-muted">Change:</span>{' '}
                                  <span className={getPnLColor(position.percentChange)}>
                                   {position.percentChange >= 0 ? '+' : ''}{(position.percentChange ?? 0).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                               <div className="text-xs text-secondary mb-1">Unrealized P&L</div>
                               <div className={`tabular text-2xl font-bold flex items-center justify-end gap-1 ${getPnLColor(position.unrealizedPnL)}`} data-testid={`position-pnl-${index}`}>
                                {position.unrealizedPnL >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                <AnimatedCounter value={position.unrealizedPnL} formatValue={(v) => formatCurrency(v)} />
                              </div>
                               <div className={`mt-2 px-3 py-1 rounded-xl text-xs font-medium border ${getPnLBgColor(position.unrealizedPnL)}`}>
                                {position.unrealizedPnL >= 0 ? 'Profit' : 'Loss'}
                              </div>
                            </div>
                          </div>
                      </Surface>
                    </motion.div>
                  ))}
                </div>
              )}
            </Surface>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Surface className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle as="h2">Recent Trades</SectionTitle>
                <span className="text-sm text-secondary bg-ink-raised px-3 py-1 rounded-xl border border-ink-edge">
                  Last {p.recentTrades.length}
                </span>
              </div>

              {p.recentTrades.length === 0 ? (
                <div className="text-center py-16 text-secondary" data-testid="empty-trades">
                  <motion.div
                    animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="w-20 h-20 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg">No recent trades</p>
                  <p className="text-sm text-muted mt-2">Your trade history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-divider">
                        <th className="text-left py-3 px-2 text-sm font-medium text-secondary">Market</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-secondary">Outcome</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-secondary">Type</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-secondary">Shares</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-secondary">Price</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-secondary">P&L</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-secondary">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.recentTrades.map((trade, index) => (
                        <motion.tr 
                          key={trade.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-ink-divider hover:bg-ink-raised transition-colors"
                          data-testid={`trade-${trade.id}`}
                        >
                          <td className="py-3 px-2 text-sm text-primary" data-testid={`trade-market-${trade.id}`}>
                            {trade.marketTitle}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded-xl bg-accent-core/15 text-accent-bright text-xs border border-accent-core/40">
                              {trade.outcome}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-xl text-xs font-medium ${
                              trade.type === 'buy' 
                                ? 'bg-gain/15 text-gain border border-gain/40' 
                                : 'bg-loss/15 text-loss border border-loss/40'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-primary tabular">
                            {trade.shares}
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-primary tabular">
                            {(trade.price ?? 0).toFixed(2)}
                          </td>
                          <td className={`py-3 px-2 text-sm text-right font-medium tabular ${trade.pnl ? getPnLColor(trade.pnl) : 'text-secondary'}`}>
                            {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-secondary">
                            {new Date(trade.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Surface>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
