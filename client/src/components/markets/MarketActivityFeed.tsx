import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Clock, Sparkles, Zap, Shield, BarChart2, RefreshCw, User } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ConfidenceRing } from "@/components/ui/confidence-ring";

interface AITrade {
  id: string;
  agentId: string;
  agentName: string;
  agentPersonality: string;
  marketId: string;
  marketQuestion: string;
  marketCategory: string;
  outcome: "YES" | "NO";
  tradeType: string;
  streamAmount: number;
  shares: number;
  price: number;
  fee: number;
  reasoning: string;
  probability: number | null;
  createdAt: string;
  traderType?: 'agent' | 'avatar';
  avatarImageUrl?: string | null;
}

interface MarketActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const personalityColors: Record<string, string> = {
  conservative: "from-blue-500/20 to-indigo-500/20 border-blue-400/30",
  aggressive: "from-red-500/20 to-orange-500/20 border-red-400/30",
  quantitative: "from-cyan-500/20 to-blue-500/20 border-cyan-400/30",
  contrarian: "from-purple-500/20 to-pink-500/20 border-purple-400/30",
};

const personalityIcons: Record<string, { emoji: string; icon: typeof Shield }> = {
  conservative: { emoji: "🛡️", icon: Shield },
  aggressive: { emoji: "⚡", icon: Zap },
  quantitative: { emoji: "📊", icon: BarChart2 },
  contrarian: { emoji: "🔄", icon: RefreshCw },
};

export function MarketActivityFeed({ 
  limit = 20, 
  showHeader = true,
  className = "" 
}: MarketActivityFeedProps) {
  const [prevTradeCount, setPrevTradeCount] = useState(0);
  const [newTradesCount, setNewTradesCount] = useState(0);

  const { data, isLoading } = useQuery<{ trades: AITrade[] }>({
    queryKey: [`/api/ai-agents/trades?limit=${limit}`],
    refetchInterval: 60000, // Reduced from 10s to 60s for performance
    staleTime: 30000,
  });

  const allTrades = data?.trades || [];

  useEffect(() => {
    if (allTrades.length > prevTradeCount && prevTradeCount > 0) {
      const newCount = allTrades.length - prevTradeCount;
      setNewTradesCount(newCount);
      setTimeout(() => setNewTradesCount(0), 5000);
    }
    setPrevTradeCount(allTrades.length);
  }, [allTrades.length, prevTradeCount]);

  const getConfidenceColor = (probability: number): string => {
    if (probability >= 80) return "text-emerald-400";
    if (probability >= 70) return "text-cyan-400";
    return "text-amber-400";
  };

  const getTradeSizeBadge = (amount: number): { label: string; className: string } => {
    if (amount >= 1000) return { label: "Large", className: "trade-badge-large" };
    if (amount >= 500) return { label: "Medium", className: "trade-badge-medium" };
    return { label: "Small", className: "trade-badge-small" };
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Trading Activity</h3>
            </div>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="neural-glass p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!allTrades || allTrades.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Trading Activity</h3>
            </div>
          </div>
        )}
        <Card className="neural-glass p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No AI trades yet. The trading engine will start soon.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </motion.div>
            <h3 className="text-lg font-semibold">AI Trading Activity</h3>
            {newTradesCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge variant="default" className="bg-purple-500/20 border-purple-500/40 animate-pulse">
                  +{newTradesCount} new
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-emerald-400 font-semibold">Live</span>
          </div>
        </div>
      )}

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {allTrades.map((trade, index) => {
            const isYes = trade.outcome === "YES";
            const probability = trade.probability || 0;
            const tradeSizeBadge = getTradeSizeBadge(trade.streamAmount);
            const personalityInfo = personalityIcons[trade.agentPersonality] || personalityIcons.quantitative;
            const isAvatar = trade.traderType === 'avatar';
            const traderLink = isAvatar ? `/avatars/${trade.agentId}` : undefined;
            
            return (
              <CarouselItem 
                key={trade.id} 
                className="pl-2 md:pl-4 basis-full" 
                data-testid={`trade-card-${trade.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="slide-in-trade"
                >
                  <Card className={`bg-gradient-to-br ${isAvatar ? 'from-cyan-500/20 to-purple-500/20 border-cyan-400/30' : (personalityColors[trade.agentPersonality] || personalityColors.quantitative)} border backdrop-blur-sm p-4 card-3d-hover`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 relative">
                        {isAvatar && trade.avatarImageUrl ? (
                          <Link href={traderLink!}>
                            <Avatar className="w-16 h-16 border-2 border-cyan-400/50 cursor-pointer hover:border-cyan-400 transition-colors">
                              <AvatarImage src={trade.avatarImageUrl} alt={trade.agentName} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-lg">
                                {trade.agentName.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        ) : (
                          <>
                            <ConfidenceRing 
                              confidence={probability} 
                              size={64} 
                              strokeWidth={4}
                              showPercentage={false}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                              {personalityInfo.emoji}
                            </div>
                          </>
                        )}
                        <motion.div
                          className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 ${isAvatar ? 'border-cyan-400/60' : 'border-primary/40'} flex items-center justify-center shadow-lg`}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {isAvatar ? (
                            <User className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <span className={`text-[10px] font-bold ${getConfidenceColor(probability)}`}>
                              {probability.toFixed(0)}%
                            </span>
                          )}
                        </motion.div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isAvatar ? (
                              <Link href={traderLink!} className="font-bold text-base truncate hover:text-cyan-400 transition-colors cursor-pointer" data-testid={`text-agent-name-${trade.id}`}>
                                {trade.agentName}
                              </Link>
                            ) : (
                              <span className="font-bold text-base truncate" data-testid={`text-agent-name-${trade.id}`}>
                                {trade.agentName}
                              </span>
                            )}
                            {isAvatar ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs flex-shrink-0 bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                              >
                                Avatar
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs flex-shrink-0 bg-slate-700/50 border-slate-600"
                              >
                                {trade.agentPersonality}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 mb-3 line-clamp-2 leading-relaxed" data-testid={`text-market-question-${trade.id}`}>
                          {trade.marketQuestion}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <div className="flex items-center gap-1.5">
                            {isYes ? (
                              <TrendingUp className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-rose-400" />
                            )}
                            <Badge 
                              variant="outline"
                              className={`font-bold text-sm px-3 py-1 shadow-lg ${
                                isYes 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20' 
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20'
                              }`}
                              data-testid={`badge-outcome-${trade.id}`}
                            >
                              {trade.outcome}
                            </Badge>
                          </div>
                          
                          <span className="text-sm font-mono font-bold text-cyan-300" data-testid={`text-amount-${trade.id}`}>
                            {trade.streamAmount.toLocaleString()} STREAM
                          </span>

                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold px-2.5 py-1 ${tradeSizeBadge.className}`}
                          >
                            {tradeSizeBadge.label} Trade
                          </Badge>

                          <Badge variant="outline" className="text-xs capitalize bg-slate-700/50 border-slate-600">
                            {trade.marketCategory}
                          </Badge>
                        </div>

                        {trade.reasoning && (
                          <details className="text-xs group">
                            <summary className="cursor-pointer text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 font-medium">
                              <Bot className="w-3.5 h-3.5" />
                              View AI reasoning
                            </summary>
                            <motion.p 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2 pl-4 py-2.5 border-l-2 border-purple-500/40 bg-slate-800/50 rounded-r text-xs leading-relaxed text-slate-300"
                            >
                              {trade.reasoning}
                            </motion.p>
                          </details>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        <div className="flex items-center justify-center gap-4 mt-4">
          <CarouselPrevious className="relative static translate-y-0 bg-slate-800/70 border-slate-600/50 hover:bg-slate-700/70 card-3d-hover" />
          <div className="text-xs text-slate-400 font-semibold">
            {allTrades.length} total trades
          </div>
          <CarouselNext className="relative static translate-y-0 bg-slate-800/70 border-slate-600/50 hover:bg-slate-700/70 card-3d-hover" />
        </div>
      </Carousel>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="neural-glass mt-4 p-4 stat-glow">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <motion.div 
                className="text-2xl font-bold text-cyan-400" 
                data-testid="text-total-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {allTrades.length}
              </motion.div>
              <div className="text-xs text-slate-400">Total Trades</div>
            </div>
            <div>
              <motion.div 
                className="text-2xl font-bold text-emerald-400" 
                data-testid="text-yes-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                {allTrades.filter(t => t.outcome === "YES").length}
              </motion.div>
              <div className="text-xs text-slate-400">YES</div>
            </div>
            <div>
              <motion.div 
                className="text-2xl font-bold text-rose-400" 
                data-testid="text-no-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {allTrades.filter(t => t.outcome === "NO").length}
              </motion.div>
              <div className="text-xs text-slate-400">NO</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
