import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Award, Zap, ArrowLeft, Flame, Bot, User } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import Surface from "@/components/ds/Surface";

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
    if (rank === 1) return 'border-warn/60';
    if (rank === 2) return 'border-ink-edge';
    if (rank === 3) return 'border-warn/40';
    return 'border-accent-core/20';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return (
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
      <Trophy className="w-8 h-8 text-warn" />
      </motion.div>
    );
    if (rank === 2) return <Trophy className="w-7 h-7 text-secondary" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-warn" />;
    return <span className="tabular text-lg font-bold text-accent-bright">#{rank}</span>;
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
    <div className="min-h-screen bg-ink-page relative overflow-hidden tnums-scope">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-warn/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-core/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-deep/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PageHeader
              eyebrow="Prediction markets · top traders"
              title="Markets Leaderboard"
              subtitle="Top prediction market traders ranked by performance."
              icon={<Trophy className="h-5 w-5" />}
              actions={
                <Link href="/#prediction-markets">
                    <Button variant="ghost" size="sm" className="rounded-xl text-secondary hover:bg-ink-raised hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Markets
                  </Button>
                </Link>
              }
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Surface className="p-6 space-y-6">
              <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as any)}>
                <TabsList className="grid grid-cols-4 w-full rounded-xl border border-ink-edge bg-ink-raised p-1">
                  <TabsTrigger 
                    value="profit" 
                    className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                    data-testid="tab-profit"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Profit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="volume"
                    className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                    data-testid="tab-volume"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Volume
                  </TabsTrigger>
                  <TabsTrigger 
                    value="winrate"
                    className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
                    data-testid="tab-winrate"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Win Rate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roi"
                    className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
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
                         <div key={i} className="h-24 rounded-xl border border-ink-edge bg-ink-raised animate-pulse" />
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
                          <Surface
                            variant="raised"
                            className={`border ${getRankColor(entry.rank || index + 1)} bg-ink-surface p-[1px] transition-all duration-300 cursor-pointer`}
                            data-testid={`leaderboard-entry-${index}`}
                          >
                            <div className="rounded-xl bg-ink-raised p-4">
                              <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="flex items-center justify-center w-16">
                                  {getRankIcon(entry.rank || index + 1)}
                                </div>

                                {/* User/Avatar info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {isAvatar ? (
                                       <Bot className="w-4 h-4 text-accent-bright shrink-0" />
                                    ) : (
                                       <User className="w-4 h-4 text-accent-bright shrink-0" />
                                    )}
                                     <span className="font-bold text-primary text-lg truncate">
                                      {entry.username}
                                    </span>
                                    {isAvatar && (
                                       <Badge variant="outline" className="border-accent-core/30 text-accent-bright text-xs shrink-0">
                                        Avatar
                                      </Badge>
                                    )}
                                    {entry.currentWinStreak >= 3 && (
                                       <div className="flex items-center gap-1 rounded-xl border border-warn/30 bg-warn/10 px-2 py-1 shrink-0">
                                         <Flame className="w-3 h-3 text-warn" />
                                         <span className="text-xs text-warn font-semibold">{entry.currentWinStreak} streak</span>
                                      </div>
                                    )}
                                  </div>
                                   <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
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
                                     <span className="text-xs text-muted">{getMetricLabel()}</span>
                                  </div>
                                  <div className="text-2xl font-bold">
                                    {activeMetric === 'winrate' || activeMetric === 'roi' ? (
                                       <span className="tabular text-gain">
                                        <AnimatedCounter value={getMetricValue(entry)} formatValue={(v) => `${v.toFixed(1)}%`} />
                                      </span>
                                    ) : (
                                       <span className="tabular text-warn">
                                        <AnimatedCounter value={getMetricValue(entry)} formatValue={(v) => formatNumber(v)} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Surface>
                          </Link>
                        </motion.div>
                      );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Surface>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
