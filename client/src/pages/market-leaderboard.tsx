import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Target, Award, Zap } from "lucide-react";

type LeaderboardEntry = {
  userId: string;
  username: string;
  avatar: string | null;
  netProfit: number;
  totalVolume: number;
  winRate: number;
  roi: number;
  totalTrades: number;
  winningTrades: number;
  currentWinStreak: number;
  longestWinStreak: number;
  rank: number | null;
};

export default function MarketLeaderboard() {
  const [activeMetric, setActiveMetric] = useState<'profit' | 'volume' | 'winrate' | 'roi'>('profit');

  const { data: leaderboard, isLoading } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/markets/leaderboards', activeMetric],
    refetchInterval: 30000
  });

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-amber-400 to-amber-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-700 to-amber-900';
    return 'from-cyan-500/20 to-emerald-500/20';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-cyan-400">#{rank}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (activeMetric) {
      case 'profit': return formatNumber(entry.netProfit);
      case 'volume': return formatNumber(entry.totalVolume);
      case 'winrate': return `${entry.winRate.toFixed(1)}%`;
      case 'roi': return `${entry.roi.toFixed(1)}%`;
    }
  };

  const getMetricLabel = () => {
    switch (activeMetric) {
      case 'profit': return 'Net Profit';
      case 'volume': return 'Total Volume';
      case 'winrate': return 'Win Rate';
      case 'roi': return 'ROI';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Prediction Market Leaderboard
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Top Traders by Performance</p>
        </div>

        <Card className="neural-glass border-iridescent p-6 space-y-6">
          <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as any)}>
            <TabsList className="grid grid-cols-4 w-full bg-slate-800/50 border border-cyan-500/20">
              <TabsTrigger 
                value="profit" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-amber-400"
                data-testid="tab-profit"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Profit
              </TabsTrigger>
              <TabsTrigger 
                value="volume"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-cyan-400"
                data-testid="tab-volume"
              >
                <Zap className="w-4 h-4 mr-2" />
                Volume
              </TabsTrigger>
              <TabsTrigger 
                value="winrate"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-amber-500/20 data-[state=active]:text-emerald-400"
                data-testid="tab-winrate"
              >
                <Target className="w-4 h-4 mr-2" />
                Win Rate
              </TabsTrigger>
              <TabsTrigger 
                value="roi"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400"
                data-testid="tab-roi"
              >
                <Award className="w-4 h-4 mr-2" />
                ROI
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeMetric} className="mt-6">
              {isLoading ? (
                <div className="space-y-3" data-testid="loading-skeleton">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-slate-800/30 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard?.leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={entry.userId}
                        className={`group relative overflow-hidden rounded-lg border border-cyan-500/20 bg-gradient-to-r ${getRankColor(rank)} p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20`}
                        data-testid={`leaderboard-entry-${entry.userId}`}
                      >
                        <div className="relative z-10 flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80">
                            {getRankIcon(rank)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white" data-testid={`username-${entry.userId}`}>
                                {entry.username}
                              </span>
                              {entry.currentWinStreak >= 3 && (
                                <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                                  <span className="text-xs text-amber-400">🔥 {entry.currentWinStreak} streak</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                              <span>{entry.totalTrades} trades</span>
                              <span>•</span>
                              <span>{entry.winningTrades} wins</span>
                              <span>•</span>
                              <span>{entry.winRate.toFixed(1)}% win rate</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">{getMetricLabel()}</div>
                            <div className="text-2xl font-bold text-white" data-testid={`metric-value-${entry.userId}`}>
                              {getMetricValue(entry)}
                            </div>
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    );
                  })}

                  {(!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0) && (
                    <div className="text-center py-12 text-slate-400" data-testid="empty-state">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No traders found yet. Be the first to trade!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Top Profit</h3>
            </div>
            <div className="space-y-2">
              {leaderboard?.leaderboard.slice(0, 3).map((entry, i) => (
                <div key={entry.userId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{entry.username}</span>
                  <span className="text-amber-400 font-bold">{formatNumber(entry.netProfit)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Best Accuracy</h3>
            </div>
            <div className="space-y-2">
              {[...leaderboard?.leaderboard || []]
                .sort((a, b) => b.winRate - a.winRate)
                .slice(0, 3)
                .map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{entry.username}</span>
                    <span className="text-emerald-400 font-bold">{entry.winRate.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Hot Streaks</h3>
            </div>
            <div className="space-y-2">
              {[...leaderboard?.leaderboard || []]
                .sort((a, b) => b.currentWinStreak - a.currentWinStreak)
                .slice(0, 3)
                .map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{entry.username}</span>
                    <span className="text-cyan-400 font-bold">🔥 {entry.currentWinStreak}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
