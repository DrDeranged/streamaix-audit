import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Trophy, Clock, Users, ArrowRight, Sparkles, ChevronRight, Activity, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Sparkline } from "@/components/ui/sparkline";
import { SectionHeader } from "@/components/ui/section-header";

interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  deadline: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalTrades: number;
  imageUrl?: string;
  tags?: string[];
}

interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalTrades: number;
}

const PredictionMarketCard = ({ market }: { market: PredictionMarket }) => {
  // Normalize price from basis points (5000 = 50%) to percentage
  // Handle edge cases where values might be incorrectly stored
  const normalizePrice = (price: number) => {
    if (price > 10000) return 50; // Invalid value, default to 50%
    return price / 100;
  };
  const yesPercentage = normalizePrice(market.yesPrice);
  const noPercentage = normalizePrice(market.noPrice);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      defi: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      real_world: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      community: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return colors[category] || colors.community;
  };

  const volumeKSTREAM = market.totalVolume / 1000;
  const gradientClass = volumeKSTREAM > 100 ? "gradient-border-hot" : volumeKSTREAM > 50 ? "gradient-border-warm" : "gradient-border-cool";
  
  const mockVolumeData = Array.from({ length: 10 }, (_, i) => 
    Math.random() * 100 + (i * 5)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="tilt-hover"
    >
      <Card className={`neural-glass relative overflow-hidden ${gradientClass} hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95 dark:from-slate-900/95 dark:to-slate-800/95" />
        <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {market.imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={market.imageUrl} 
              alt={market.question}
              className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}
        
        <CardContent className="relative p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={`text-xs ${getCategoryColor(market.category)} border`}>
              {market.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{daysLeft}d {hoursLeft}h</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-purple-400 dark:group-hover:text-cyan-400 transition-colors">
            {market.question}
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 transition-all cursor-pointer p-2.5 group/yes">
                <div className="relative z-10">
                  <div className="text-xs text-emerald-300 font-medium mb-0.5">YES</div>
                  <div className="text-xl font-bold text-emerald-400">{yesPercentage.toFixed(1)}%</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${yesPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5 hover:from-rose-500/20 hover:to-rose-500/10 transition-all cursor-pointer p-2.5 group/no">
                <div className="relative z-10">
                  <div className="text-xs text-rose-300 font-medium mb-0.5">NO</div>
                  <div className="text-xl font-bold text-rose-400">{noPercentage.toFixed(1)}%</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${noPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium">{volumeKSTREAM.toFixed(1)}K</span>
                <Sparkline data={mockVolumeData} width={40} height={16} color="rgb(34, 211, 238)" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>{market.totalTrades} trades</span>
              </div>
            </div>
          </div>

          {market.tags && market.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap pt-1">
              {market.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-800/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300 text-xs rounded-full border border-slate-700/50 dark:border-slate-600/50">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend, formatValue }: { label: string; value: number; icon: any; color: string; trend?: number; formatValue?: (v: number) => string }) => {
  const gradientClass = trend && trend > 0 ? "gradient-border-hot" : trend && trend < 0 ? "gradient-border-cool" : "gradient-border-warm";
  const trendDirection = trend && trend > 0 ? "up" : trend && trend < 0 ? "down" : "neutral";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -4 }}
      className={`neural-glass relative overflow-hidden p-3 sm:p-4 rounded-xl ${gradientClass} hover:shadow-xl transition-all duration-300`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95 dark:from-slate-900/95 dark:to-slate-800/95" />
      <div className="absolute inset-0 glow-pulse opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">{label}</div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter 
              value={value} 
              formatValue={formatValue}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
              trend={trendDirection as "up" | "down" | "neutral"}
              trendValue={trend ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : undefined}
            />
          </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color} shadow-lg tilt-hover flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

interface AILeagueStats {
  totalAiInLeagues: number;
  activeLeagues: number;
}

export function PredictionMarketSection() {
  const [activeTab, setActiveTab] = useState<"all" | "trending">("trending");

  const { data: marketsData, isLoading: marketsLoading } = useQuery<{ markets: PredictionMarket[] }>({
    queryKey: activeTab === "trending" ? ["/api/prediction-markets/trending"] : ["/api/prediction-markets"],
  });

  const { data: statsData } = useQuery<{ stats: MarketStats }>({
    queryKey: ["/api/prediction-markets/stats"],
  });

  const { data: aiStatsData } = useQuery<AILeagueStats>({
    queryKey: ["/api/prediction-leagues/ai-stats"],
  });

  const markets = marketsData?.markets || [];
  const stats = statsData?.stats;
  const aiStats = aiStatsData;

  return (
    <section className="relative pt-20 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <SectionHeader
            title="Prediction Markets"
            subtitle="Trade the future with AI-powered predictions"
            badge="Prediction Markets"
            badgeIcon={<Sparkles className="w-3 h-3" />}
          />

          {/* Platform Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                label="Active Markets"
                value={stats.activeMarkets}
                icon={TrendingUp}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                trend={5.2}
              />
              <StatCard
                label="Total Volume"
                value={stats.totalVolume / 1000000}
                formatValue={(v) => `${v.toFixed(1)}M`}
                icon={Sparkles}
                color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                trend={12.8}
              />
              <StatCard
                label="Total Trades"
                value={stats.totalTrades}
                icon={Users}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                trend={8.4}
              />
              <StatCard
                label="Total Markets"
                value={stats.totalMarkets}
                icon={Trophy}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                trend={3.1}
              />
            </div>
          )}
        </motion.div>

        {/* Tab Navigation - Glassmorphism */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-8">
          <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
            {/* Trending Tab */}
            <div className={`relative group ${activeTab === "trending" ? "" : "cursor-pointer"}`}>
              {activeTab === "trending" && (
                <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-80 blur-[1px]" />
              )}
              <Button
                variant="outline"
                onClick={() => setActiveTab("trending")}
                size="sm"
                className={activeTab === "trending" 
                  ? "relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white text-xs sm:text-sm px-2.5 sm:px-4" 
                  : "bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-purple-400/50 hover:bg-white/40 dark:hover:bg-slate-800/50 text-xs sm:text-sm px-2.5 sm:px-4 transition-all duration-200"
                }
                data-testid="button-trending-markets"
              >
                <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${activeTab === "trending" ? "text-purple-500" : ""}`} />
                Trending
              </Button>
            </div>
            {/* All Markets Tab */}
            <div className={`relative group ${activeTab === "all" ? "" : "cursor-pointer"}`}>
              {activeTab === "all" && (
                <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-80 blur-[1px]" />
              )}
              <Button
                variant="outline"
                onClick={() => setActiveTab("all")}
                size="sm"
                className={activeTab === "all" 
                  ? "relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white text-xs sm:text-sm px-2.5 sm:px-4" 
                  : "bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-purple-400/50 hover:bg-white/40 dark:hover:bg-slate-800/50 text-xs sm:text-sm px-2.5 sm:px-4 transition-all duration-200"
                }
                data-testid="button-all-markets"
              >
                All Markets
              </Button>
            </div>
            
            {/* AI Traders Competing Indicator */}
            {aiStats && aiStats.totalAiInLeagues > 0 && (
              <Link href="/leagues">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                >
                  <Badge 
                    variant="outline" 
                    className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400/50 transition-all px-2 sm:px-3 py-1 whitespace-nowrap"
                    data-testid="badge-ai-traders"
                  >
                    <Bot className="w-3 h-3 mr-1 sm:mr-1.5 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium">{aiStats.totalAiInLeagues} AI · {aiStats.activeLeagues} Leagues</span>
                  </Badge>
                </motion.div>
              </Link>
            )}
          </div>

          <Link href="/markets">
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
              className="relative group"
            >
              <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-70 blur-[1px] transition-opacity duration-300" />
              <Button 
                variant="ghost" 
                size="sm"
                className="relative bg-transparent hover:bg-white/30 dark:hover:bg-slate-800/30 backdrop-blur-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs sm:text-sm px-2 sm:px-4 border border-transparent hover:border-cyan-400/30 transition-all duration-200"
                data-testid="link-view-all-markets"
              >
                <span className="hidden sm:inline">View All Markets</span>
                <span className="sm:hidden">View All</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Markets Grid */}
        {marketsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-slate-900/70 dark:bg-slate-900/70 backdrop-blur-lg border-purple-500/30">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-24 bg-slate-700" />
                  <Skeleton className="h-12 w-full bg-slate-700" />
                  <div className="flex gap-2">
                    <Skeleton className="h-16 flex-1 bg-slate-700" />
                    <Skeleton className="h-16 flex-1 bg-slate-700" />
                  </div>
                  <Skeleton className="h-4 w-full bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : markets.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {markets.slice(0, 6).map((market) => (
              <Link key={market.id} href={`/markets/${market.id}`}>
                <PredictionMarketCard market={market} />
              </Link>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 mb-4">
              <Trophy className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Markets Yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to create a prediction market</p>
            <Link href="/markets/create">
              <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0">
                Create Market
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* CTA - Glassmorphism Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link href="/markets">
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
              className="inline-block relative group"
            >
              {/* Animated gradient border */}
              <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 opacity-80 group-hover:opacity-100 blur-[2px] animate-gradient-x transition-opacity duration-300" />
              <Button 
                size="lg" 
                className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-0 text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 overflow-hidden px-6 py-3"
                data-testid="button-explore-markets"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Trophy className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" />
                <span className="relative z-10 font-medium">Explore All Prediction Markets</span>
                <ArrowRight className="w-5 h-5 ml-2 text-cyan-500 dark:text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
