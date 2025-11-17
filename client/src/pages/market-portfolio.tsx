import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Award, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

  const getPnLBgColor = (value: number) => {
    if (value > 0) return 'bg-emerald-500/10 border-emerald-500/30';
    if (value < 0) return 'bg-red-500/10 border-red-500/30';
    return 'bg-slate-500/10 border-slate-500/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="loading-skeleton">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-slate-800/30 animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-lg bg-slate-800/30 animate-pulse" />
        </div>
      </div>
    );
  }

  const p = portfolio?.portfolio;
  if (!p) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No portfolio data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="w-12 h-12 text-cyan-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Trading Portfolio
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Track your positions and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <h3 className="text-sm font-medium text-slate-400">Total Profit</h3>
            </div>
            <div className={`text-3xl font-bold ${getPnLColor(p.totalProfit)}`} data-testid="total-profit">
              {formatCurrency(p.totalProfit)}
            </div>
            <div className="text-xs text-slate-500 mt-1">all-time earnings</div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-emerald-400" />
              <h3 className="text-sm font-medium text-slate-400">Win Rate</h3>
            </div>
            <div className="text-3xl font-bold text-emerald-400" data-testid="win-rate">
              {p.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {p.winningTrades} / {p.totalTrades} trades
            </div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-cyan-400" />
              <h3 className="text-sm font-medium text-slate-400">ROI</h3>
            </div>
            <div className={`text-3xl font-bold ${getPnLColor(p.roi)}`} data-testid="roi">
              {formatCurrency(p.roi)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">return on investment</div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
              <h3 className="text-sm font-medium text-slate-400">Total Volume</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400" data-testid="total-volume">
              {formatNumber(p.totalVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-1">tokens traded</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Total Trades</h3>
            </div>
            <div className="text-4xl font-bold text-cyan-400" data-testid="total-trades">
              {p.totalTrades}
            </div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Winning Trades</h3>
            </div>
            <div className="text-4xl font-bold text-emerald-400" data-testid="winning-trades">
              {p.winningTrades}
            </div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Current Streak</h3>
            </div>
            <div className="text-4xl font-bold text-amber-400" data-testid="current-streak">
              {p.currentStreak > 0 ? '🔥 ' : ''}{Math.abs(p.currentStreak)}
            </div>
          </Card>
        </div>

        <Card className="neural-glass border-iridescent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Active Positions</h2>
            <span className="text-sm text-slate-400">{p.positions.length} open</span>
          </div>

          {p.positions.length === 0 ? (
            <div className="text-center py-12 text-slate-400" data-testid="empty-positions">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No active positions. Start trading to see your portfolio!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {p.positions.map((position, index) => (
                <div
                  key={`${position.marketId}-${position.outcome}`}
                  className="group relative overflow-hidden rounded-lg border border-cyan-500/20 bg-slate-800/40 p-4 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/10"
                  data-testid={`position-${index}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-lg font-bold text-white" data-testid={`position-market-${index}`}>
                          {position.marketTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/40">
                            {position.outcome}
                          </span>
                          <span className="text-sm text-slate-400">
                            {position.shares} shares @ {position.avgPrice.toFixed(2)}
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
                      <div className={`text-2xl font-bold flex items-center gap-1 ${getPnLColor(position.unrealizedPnL)}`} data-testid={`position-pnl-${index}`}>
                        {position.unrealizedPnL >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        {formatCurrency(position.unrealizedPnL)}
                      </div>
                      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getPnLBgColor(position.unrealizedPnL)}`}>
                        {position.unrealizedPnL >= 0 ? 'Profit' : 'Loss'}
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="neural-glass border-iridescent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Recent Trades</h2>
            <span className="text-sm text-slate-400">Last {p.recentTrades.length} trades</span>
          </div>

          {p.recentTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-400" data-testid="empty-trades">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No recent trades to display.</p>
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
                  {p.recentTrades.map((trade) => (
                    <tr 
                      key={trade.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
