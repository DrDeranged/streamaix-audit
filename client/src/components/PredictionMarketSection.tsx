import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Trophy, Clock, Users, ArrowRight, Sparkles, ChevronRight, Activity, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Sparkline } from "@/components/ui/sparkline";
import Surface from "@/components/ds/Surface";
import StatValue from "@/components/ds/StatValue";
import SectionTitle from "@/components/ds/SectionTitle";

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
  // Handle edge cases where values might be incorrectly stored or undefined
  const normalizePrice = (price: number | undefined | null) => {
    if (price == null || price > 10000) return 50; // Invalid or missing value, default to 50%
    return price / 100;
  };
  const yesPercentage = normalizePrice(market.yesPrice);
  const noPercentage = normalizePrice(market.noPrice);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-accent-core/20 text-accent-bright border-accent-core/30",
      defi: "bg-accent-core/10 text-accent-bright border-accent-core/30",
      real_world: "bg-gain/10 text-gain border-gain/30",
      community: "bg-warn/10 text-warn border-warn/30",
    };
    return colors[category] || colors.community;
  };

  const volumeKSTREAM = market.totalVolume / 1000;
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
      <Surface className="relative overflow-hidden transition-all duration-300 group hover:bg-ink-raised">
        
        {market.imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={market.imageUrl} 
              alt={market.question}
              className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-ink-page/70" />
          </div>
        )}
        
        <div className="relative p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={`text-xs ${getCategoryColor(market.category)} border`}>
              {market.category.replace('_', ' ').toUpperCase()}
            </Badge>
             <div className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3 h-3" />
              <span>{daysLeft}d {hoursLeft}h</span>
            </div>
          </div>

           <h3 className="text-sm font-semibold text-primary line-clamp-2 leading-snug group-hover:text-accent-bright transition-colors">
            {market.question}
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
               <div className="flex-1 relative overflow-hidden rounded-xl border border-gain/30 bg-gain/10 hover:bg-gain/20 transition-all cursor-pointer p-2.5 group/yes">
                <div className="relative z-10">
                   <div className="text-xs text-gain font-medium mb-0.5">YES</div>
                   <div className="tabular text-xl font-bold text-gain">{yesPercentage.toFixed(2)}%</div>
                </div>
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gain/20 rounded-xl overflow-hidden">
                  <motion.div 
                     className="h-full bg-gain"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${yesPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
              
               <div className="flex-1 relative overflow-hidden rounded-xl border border-loss/30 bg-loss/10 hover:bg-loss/20 transition-all cursor-pointer p-2.5 group/no">
                <div className="relative z-10">
                   <div className="text-xs text-loss font-medium mb-0.5">NO</div>
                   <div className="tabular text-xl font-bold text-loss">{noPercentage.toFixed(2)}%</div>
                </div>
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-loss/20 rounded-xl overflow-hidden">
                  <motion.div 
                     className="h-full bg-loss"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${noPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
               <div className="flex items-center gap-1.5 text-secondary">
                 <Activity className="w-3.5 h-3.5 text-accent-bright" />
                 <span className="tabular font-medium">{volumeKSTREAM.toFixed(1)}K</span>
                 <Sparkline data={mockVolumeData} width={40} height={16} color="#8B7CF6" />
              </div>
               <div className="flex items-center gap-1.5 text-secondary">
                <Users className="w-3.5 h-3.5" />
                 <span className="tabular">{market.totalTrades} trades</span>
              </div>
            </div>
          </div>

          {market.tags && market.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap pt-1">
              {market.tags.slice(0, 3).map((tag, i) => (
                 <span key={i} className="px-2 py-0.5 bg-ink-raised text-secondary text-xs rounded-xl border border-ink-edge">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Surface>
    </motion.div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend, formatValue }: { label: string; value: number; icon: any; color: string; trend?: number; formatValue?: (v: number) => string }) => {
  const trendDirection = trend && trend > 0 ? "up" : trend && trend < 0 ? "down" : "neutral";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative overflow-hidden rounded-xl border border-ink-edge bg-ink-surface p-3 transition-all duration-300 hover:bg-ink-raised sm:p-4"
    >
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted mb-1 sm:mb-2">{label}</div>
          <div className="flex items-baseline gap-2">
            <StatValue
              label=""
              value={<AnimatedCounter 
              value={value} 
              formatValue={formatValue}
              className="text-xl sm:text-2xl font-bold text-primary"
              trend={trendDirection as "up" | "down" | "neutral"}
              trendValue={trend ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : undefined}
            />}
            />
          </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${color} flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <SectionTitle eyebrow="Prediction Markets">Prediction Markets</SectionTitle>
          <p className="mt-2 text-body">Trade the future with AI-powered predictions</p>

          {/* Platform Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                label="Active Markets"
                value={stats.activeMarkets}
                icon={TrendingUp}
                 color="bg-accent-core/20"
                trend={5.2}
              />
              <StatCard
                label="Total Volume"
                value={stats.totalVolume / 1000000}
                formatValue={(v) => `${v.toFixed(1)}M`}
                icon={Sparkles}
                 color="bg-accent-core/20"
                trend={12.8}
              />
              <StatCard
                label="Total Trades"
                value={stats.totalTrades}
                icon={Users}
                 color="bg-accent-core/20"
                trend={8.4}
              />
              <StatCard
                label="Total Markets"
                value={stats.totalMarkets}
                icon={Trophy}
                 color="bg-gain/20"
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
                <div className="absolute -inset-px rounded-xl bg-accent-core opacity-20 blur-[1px]" />
              )}
              <Button
                variant="outline"
                onClick={() => setActiveTab("trending")}
                size="sm"
                className={activeTab === "trending" 
                  ? "relative bg-accent-core text-primary border-accent-core text-xs sm:text-sm px-2.5 sm:px-4 glow-accent" 
                  : "bg-ink-surface border-ink-edge text-secondary hover:text-primary hover:border-accent-core/50 hover:bg-ink-raised text-xs sm:text-sm px-2.5 sm:px-4 transition-all duration-200"
                }
                data-testid="button-trending-markets"
              >
                <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${activeTab === "trending" ? "text-primary" : ""}`} />
                Trending
              </Button>
            </div>
            {/* All Markets Tab */}
            <div className={`relative group ${activeTab === "all" ? "" : "cursor-pointer"}`}>
              {activeTab === "all" && (
                <div className="absolute -inset-px rounded-xl bg-accent-core opacity-20 blur-[1px]" />
              )}
              <Button
                variant="outline"
                onClick={() => setActiveTab("all")}
                size="sm"
                className={activeTab === "all" 
                  ? "relative bg-accent-core text-primary border-accent-core text-xs sm:text-sm px-2.5 sm:px-4 glow-accent" 
                  : "bg-ink-surface border-ink-edge text-secondary hover:text-primary hover:border-accent-core/50 hover:bg-ink-raised text-xs sm:text-sm px-2.5 sm:px-4 transition-all duration-200"
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
                    className="bg-accent-core/10 border-accent-core/30 text-accent-bright hover:border-accent-core transition-all px-2 sm:px-3 py-1 whitespace-nowrap"
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
              <div className="absolute -inset-px rounded-xl bg-accent-core opacity-0 group-hover:opacity-30 blur-[1px] transition-opacity duration-300" />
              <Button 
                variant="ghost" 
                size="sm"
                className="relative bg-transparent hover:bg-ink-raised text-accent-bright text-xs sm:text-sm px-2 sm:px-4 border border-transparent hover:border-accent-core/30 transition-all duration-200"
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
              <Surface key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-24 bg-ink-raised" />
                  <Skeleton className="h-12 w-full bg-ink-raised" />
                  <div className="flex gap-2">
                    <Skeleton className="h-16 flex-1 bg-ink-raised" />
                    <Skeleton className="h-16 flex-1 bg-ink-raised" />
                  </div>
                  <Skeleton className="h-4 w-full bg-ink-raised" />
              </Surface>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-ink-raised mb-4">
              <Trophy className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Markets Yet</h3>
            <p className="text-body mb-6">Be the first to create a prediction market</p>
            <Link href="/markets/create">
              <Button className="grad-accent text-primary border-0 glow-accent">
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
              <div className="absolute -inset-px rounded-xl bg-accent-core opacity-30 group-hover:opacity-60 blur-[2px] transition-opacity duration-300" />
              <Button 
                size="lg" 
                className="relative grad-accent border-0 text-primary transition-all duration-300 overflow-hidden px-6 py-3 glow-accent"
                data-testid="button-explore-markets"
              >
                {/* Shimmer effect */}
                <Trophy className="w-5 h-5 mr-2 text-primary" />
                <span className="relative z-10 font-medium">Explore All Prediction Markets</span>
                <ArrowRight className="w-5 h-5 ml-2 text-primary group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
