import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Award, Zap, ArrowLeft, Flame, Star, Bot, User } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type LeaderboardEntry = {
  id: string;
  type: 'user' | 'avatar';
  userId?: string;
  avatarId?: string;
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
    if (rank === 1) return 'from-amber-400 via-amber-500 to-amber-600';
    if (rank === 2) return 'from-gray-300 via-gray-400 to-gray-500';
    if (rank === 3) return 'from-amber-700 via-amber-800 to-amber-900';
    return 'from-cyan-500/20 via-purple-500/20 to-emerald-500/20';
  };

  const getRankGlow = (rank: number) => {
    if (rank === 1) return 'shadow-xl shadow-amber-500/50';
    if (rank === 2) return 'shadow-xl shadow-gray-400/50';
    if (rank === 3) return 'shadow-xl shadow-amber-700/50';
    return 'shadow-lg shadow-cyan-500/10';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return (
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
      </motion.div>
    );
    if (rank === 2) return <Trophy className="w-7 h-7 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.4)]" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-700 drop-shadow-[0_0_6px_rgba(180,83,9,0.4)]" />;
    return <span className="text-lg font-bold text-cyan-400">#{rank}</span>;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num == null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (activeMetric) {
      case 'profit': return entry.netProfit;
      case 'volume': return entry.totalVolume;
      case 'winrate': return entry.winRate;
      case 'roi': return entry.roi;
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

  const getMetricIcon = () => {
    switch (activeMetric) {
      case 'profit': return <TrendingUp className="w-5 h-5" />;
      case 'volume': return <Zap className="w-5 h-5" />;
      case 'winrate': return <Target className="w-5 h-5" />;
      case 'roi': return <Award className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden tnums-scope">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
            <Link href="/#prediction-markets">
              <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-16 h-16 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
              </motion.div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
                Leaderboard
              </h1>
            </div>
            <p className="text-slate-400 text-lg">Top prediction market traders ranked by performance</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-cyan-500/20 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 p-6 space-y-6">
              <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as any)}>
                <TabsList className="grid grid-cols-4 w-full bg-slate-900/50 border border-cyan-500/30 p-1 rounded-xl">
                  <TabsTrigger 
                    value="profit" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-orange-500/30 data-[state=active]:text-amber-300 data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
                    data-testid="tab-profit"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Profit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="volume"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-cyan-300 data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
                    data-testid="tab-volume"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Volume
                  </TabsTrigger>
                  <TabsTrigger 
                    value="winrate"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/30 data-[state=active]:to-green-500/30 data-[state=active]:text-emerald-300 data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
                    data-testid="tab-winrate"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Win Rate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roi"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30 data-[state=active]:text-purple-300 data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
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
                        <div key={i} className="h-24 rounded-lg bg-gradient-to-r from-slate-800/30 to-slate-700/30 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard?.leaderboard.map((entry, index) => {
                        const isAvatar = entry.type === 'avatar';
                        const profileLink = isAvatar ? `/avatars/${entry.avatarId || entry.id}` : `/profile/${entry.userId || entry.id}`;
                        
                        return (
                        <motion.div
                          key={entry.id || entry.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                        >
                          <Link href={profileLink}>
                          <Card
                            className={`bg-gradient-to-r ${getRankColor(entry.rank || index + 1)} p-[1px] ${getRankGlow(entry.rank || index + 1)} transition-all duration-300 cursor-pointer`}
                            data-testid={`leaderboard-entry-${index}`}
                          >
                            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-4">
                              <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="flex items-center justify-center w-16">
                                  {getRankIcon(entry.rank || index + 1)}
                                </div>

                                {/* User/Avatar info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {isAvatar ? (
                                      <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                                    ) : (
                                      <User className="w-4 h-4 text-purple-400 shrink-0" />
                                    )}
                                    <span className="font-bold text-white text-lg truncate">
                                      {entry.username}
                                    </span>
                                    {isAvatar && (
                                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs shrink-0">
                                        Avatar
                                      </Badge>
                                    )}
                                    {entry.currentWinStreak >= 3 && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full shrink-0">
                                        <Flame className="w-3 h-3 text-orange-400" />
                                        <span className="text-xs text-orange-300 font-semibold">{entry.currentWinStreak} streak</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {entry.totalTrades} trades
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      {entry.winningTrades} wins
                                    </span>
                                  </div>
                                </div>

                                {/* Primary Metric */}
                                <div className="text-right">
                                  <div className="flex items-center justify-end gap-2 mb-1">
                                    {getMetricIcon()}
                                    <span className="text-xs text-slate-400">{getMetricLabel()}</span>
                                  </div>
                                  <div className="text-2xl font-bold">
                                    {activeMetric === 'winrate' || activeMetric === 'roi' ? (
                                      <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                        <AnimatedCounter value={getMetricValue(entry)} decimals={1} suffix="%" />
                                      </span>
                                    ) : (
                                      <span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
                                        <AnimatedCounter value={getMetricValue(entry)} formatValue={(v) => formatNumber(v)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                          </Link>
                        </motion.div>
                      );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
