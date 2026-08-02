import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { Bot, TrendingUp, TrendingDown, Sparkles, Zap, Shield, BarChart2, RefreshCw, User } from "lucide-react";
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
  conservative: "bg-accent-core/10 border-accent-core/30",
  aggressive: "bg-loss/10 border-loss/30",
  quantitative: "bg-accent-core/10 border-accent-core/30",
  contrarian: "bg-warn/10 border-warn/30",
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
    if (probability >= 80) return "text-gain";
    if (probability >= 70) return "text-accent-bright";
    return "text-warn";
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
              <Sparkles className="w-5 h-5 text-accent-bright" />
              <SectionTitle as="h3">AI Trading Activity</SectionTitle>
            </div>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <Surface key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-ink-raised rounded-xl w-3/4 mb-2"></div>
            <div className="h-3 bg-ink-raised rounded-xl w-1/2"></div>
          </Surface>
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
              <Sparkles className="w-5 h-5 text-accent-bright" />
              <SectionTitle as="h3">AI Trading Activity</SectionTitle>
            </div>
          </div>
        )}
        <Surface className="p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 text-muted opacity-50" />
          <p className="text-secondary">No AI trades yet. The trading engine will start soon.</p>
        </Surface>
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
              <Sparkles className="w-5 h-5 text-accent-bright" />
            </motion.div>
            <SectionTitle as="h3">AI Trading Activity</SectionTitle>
            {newTradesCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge variant="default" className="bg-accent-core/20 border-accent-core/40 text-accent-bright animate-pulse">
                  +{newTradesCount} new
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-gain"
            />
            <span className="text-gain font-semibold">Live</span>
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
                  <Surface className={`${isAvatar ? 'bg-accent-core/10 border-accent-core/30' : (personalityColors[trade.agentPersonality] || personalityColors.quantitative)} border p-4 transition-transform hover:-translate-y-0.5`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 relative">
                        {isAvatar && trade.avatarImageUrl ? (
                          <Link href={traderLink!}>
                              <Avatar className="w-16 h-16 border-2 border-accent-core/50 cursor-pointer hover:border-accent-core transition-colors">
                              <AvatarImage src={trade.avatarImageUrl} alt={trade.agentName} />
                              <AvatarFallback className="bg-accent-core/20 text-lg text-accent-bright">
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
                          className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-ink-raised border-2 ${isAvatar ? 'border-accent-core/60' : 'border-accent-core/40'} flex items-center justify-center`}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {isAvatar ? (
                            <User className="w-4 h-4 text-accent-bright" />
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
                              <Link href={traderLink!} className="font-bold text-base truncate hover:text-accent-bright transition-colors cursor-pointer" data-testid={`text-agent-name-${trade.id}`}>
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
                                 className="text-xs flex-shrink-0 bg-accent-core/20 border-accent-core/40 text-accent-bright"
                              >
                                Avatar
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                 className="text-xs flex-shrink-0 bg-ink-raised border-ink-edge text-secondary"
                              >
                                {trade.agentPersonality}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-sm text-body mb-3 line-clamp-2 leading-relaxed" data-testid={`text-market-question-${trade.id}`}>
                          {trade.marketQuestion}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <div className="flex items-center gap-1.5">
                            {isYes ? (
                              <TrendingUp className="w-5 h-5 text-gain" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-loss" />
                            )}
                            <Badge 
                              variant="outline"
                              className={`font-bold text-sm px-3 py-1 shadow-lg ${
                                isYes 
                                   ? 'bg-gain/10 text-gain border-gain/30' 
                                   : 'bg-loss/10 text-loss border-loss/30'
                              }`}
                              data-testid={`badge-outcome-${trade.id}`}
                            >
                              {trade.outcome}
                            </Badge>
                          </div>
                          
                           <span className="tabular text-sm font-mono font-bold text-accent-bright" data-testid={`text-amount-${trade.id}`}>
                            {trade.streamAmount.toLocaleString()} STREAM
                          </span>

                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold px-2.5 py-1 ${tradeSizeBadge.className}`}
                          >
                            {tradeSizeBadge.label} Trade
                          </Badge>

                           <Badge variant="outline" className="text-xs capitalize bg-ink-raised border-ink-edge text-secondary">
                            {trade.marketCategory}
                          </Badge>
                        </div>

                        {trade.reasoning && (
                          <details className="text-xs group">
                            <summary className="cursor-pointer text-secondary hover:text-primary transition-colors flex items-center gap-1.5 font-medium">
                              <Bot className="w-3.5 h-3.5" />
                              View AI reasoning
                            </summary>
                            <motion.p 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2 pl-4 py-2.5 border-l-2 border-accent-core/40 bg-ink-raised rounded-xl text-xs leading-relaxed text-body"
                            >
                              {trade.reasoning}
                            </motion.p>
                          </details>
                        )}
                      </div>
                    </div>
                  </Surface>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        <div className="flex items-center justify-center gap-4 mt-4">
          <CarouselPrevious className="relative static translate-y-0 bg-ink-raised border-ink-edge hover:bg-ink-surface" />
          <div className="text-xs text-muted font-semibold">
            {allTrades.length} total trades
          </div>
          <CarouselNext className="relative static translate-y-0 bg-ink-raised border-ink-edge hover:bg-ink-surface" />
        </div>
      </Carousel>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Surface className="mt-4 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <motion.div 
                className="tabular text-2xl font-bold text-accent-bright" 
                data-testid="text-total-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {allTrades.length}
              </motion.div>
                <div className="text-xs text-muted">Total Trades</div>
            </div>
            <div>
              <motion.div 
                className="tabular text-2xl font-bold text-gain" 
                data-testid="text-yes-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                {allTrades.filter(t => t.outcome === "YES").length}
              </motion.div>
                <div className="text-xs text-muted">YES</div>
            </div>
            <div>
              <motion.div 
                className="tabular text-2xl font-bold text-loss" 
                data-testid="text-no-trades"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {allTrades.filter(t => t.outcome === "NO").length}
              </motion.div>
                <div className="text-xs text-muted">NO</div>
            </div>
          </div>
        </Surface>
      </motion.div>
    </div>
  );
}
