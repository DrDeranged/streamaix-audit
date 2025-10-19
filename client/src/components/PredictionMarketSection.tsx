import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Trophy, Clock, Users, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const yesPercentage = (market.yesPrice / 100).toFixed(1);
  const noPercentage = (market.noPrice / 100).toFixed(1);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      defi: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      real_world: "bg-green-500/20 text-green-300 border-green-500/30",
      community: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return colors[category] || colors.community;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/85 dark:bg-slate-900/85 backdrop-blur-xl border-purple-500/40 overflow-hidden hover:border-purple-400 dark:hover:border-fuchsia-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
        {market.imageUrl && (
          <div className="h-32 overflow-hidden relative">
            <img 
              src={market.imageUrl} 
              alt={market.question}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}
        
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={`text-xs ${getCategoryColor(market.category)} border`}>
              {market.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{daysLeft}d {hoursLeft}h</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {market.question}
          </h3>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 bg-green-500/20 rounded-lg p-2 border border-green-500/30 hover:bg-green-500/30 transition-colors cursor-pointer">
                <div className="text-xs text-green-300 font-medium">YES</div>
                <div className="text-lg font-bold text-green-400">{yesPercentage}%</div>
              </div>
              <div className="flex-1 bg-red-500/20 rounded-lg p-2 border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-pointer">
                <div className="text-xs text-red-300 font-medium">NO</div>
                <div className="text-lg font-bold text-red-400">{noPercentage}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{(market.totalVolume / 1000).toFixed(1)}K STREAM</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{market.totalTrades} trades</span>
              </div>
            </div>
          </div>

          {market.tags && market.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {market.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 text-xs rounded-full border border-slate-300 dark:border-slate-700/50">
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

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export function PredictionMarketSection() {
  const [activeTab, setActiveTab] = useState<"all" | "trending">("trending");

  const { data: marketsData, isLoading: marketsLoading } = useQuery<{ markets: PredictionMarket[] }>({
    queryKey: activeTab === "trending" ? ["/api/prediction-markets/trending"] : ["/api/prediction-markets"],
  });

  const { data: statsData } = useQuery<{ stats: MarketStats }>({
    queryKey: ["/api/prediction-markets/stats"],
  });

  const markets = marketsData?.markets || [];
  const stats = statsData?.stats;

  return (
    <section className="relative py-20 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-purple-300 dark:border-purple-500/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Prediction Markets</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Trade the Future with{" "}
            <span className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Prediction Markets
            </span>
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            Spend your earned STREAM tokens on binary YES/NO markets. Predict crypto trends, DeFi events, 
            bounty outcomes, and real-world events. Build your reputation as a top predictor.
          </p>

          {/* Platform Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Active Markets"
                value={stats.activeMarkets.toString()}
                icon={TrendingUp}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                label="Total Volume"
                value={`${(stats.totalVolume / 1000000).toFixed(1)}M`}
                icon={Sparkles}
                color="bg-gradient-to-br from-cyan-500 to-cyan-600"
              />
              <StatCard
                label="Total Trades"
                value={stats.totalTrades.toLocaleString()}
                icon={Users}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                label="Total Markets"
                value={stats.totalMarkets.toString()}
                icon={Trophy}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "trending" ? "default" : "outline"}
              onClick={() => setActiveTab("trending")}
              className={activeTab === "trending" 
                ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0" 
                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600"
              }
              data-testid="button-trending-markets"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              className={activeTab === "all" 
                ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0" 
                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600"
              }
              data-testid="button-all-markets"
            >
              All Markets
            </Button>
          </div>

          <Link href="/markets">
            <Button 
              variant="ghost" 
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/10"
              data-testid="link-view-all-markets"
            >
              View All Markets
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link href="/markets">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              data-testid="button-explore-markets"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Explore All Prediction Markets
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
