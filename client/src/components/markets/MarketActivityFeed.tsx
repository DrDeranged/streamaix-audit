import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Clock, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

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
}

interface MarketActivityFeedProps {
  limit?: number;
  mobileLimit?: number;
  showHeader?: boolean;
  className?: string;
}

const personalityColors: Record<string, string> = {
  conservative: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  aggressive: "bg-red-500/10 text-red-400 border-red-400/20",
  quantitative: "bg-purple-500/10 text-purple-400 border-purple-400/20",
  contrarian: "bg-orange-500/10 text-orange-400 border-orange-400/20",
};

const personalityIcons: Record<string, string> = {
  conservative: "🛡️",
  aggressive: "⚡",
  quantitative: "📊",
  contrarian: "🔄",
};

export function MarketActivityFeed({ 
  limit = 20, 
  mobileLimit = 4,
  showHeader = true,
  className = "" 
}: MarketActivityFeedProps) {
  const [prevTradeCount, setPrevTradeCount] = useState(0);
  const [newTradesCount, setNewTradesCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data, isLoading, refetch } = useQuery<{ trades: AITrade[] }>({
    queryKey: [`/api/ai-agents/trades?limit=${limit}`],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Limit trades based on viewport
  const allTrades = data?.trades || [];
  const trades = isMobile ? allTrades.slice(0, mobileLimit) : allTrades;

  // Detect new trades
  useEffect(() => {
    if (trades.length > prevTradeCount && prevTradeCount > 0) {
      const newCount = trades.length - prevTradeCount;
      setNewTradesCount(newCount);
      setTimeout(() => setNewTradesCount(0), 5000);
    }
    setPrevTradeCount(trades.length);
  }, [trades.length, prevTradeCount]);

  // Get confidence level styling - using consistent color palette
  const getConfidenceColor = (probability: number): string => {
    if (probability >= 80) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (probability >= 65) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    if (probability >= 50) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
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
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="neural-glass p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
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
            <Sparkles className="w-5 h-5 text-primary glow-pulse" />
            <h3 className="text-lg font-semibold">AI Trading Activity</h3>
            {newTradesCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                +{newTradesCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Live</span>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-visible">
        <AnimatePresence mode="popLayout">
          {trades.map((trade, index) => {
            const isYes = trade.outcome === "YES";
            const probability = trade.probability;
            
            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                data-testid={`trade-card-${trade.id}`}
              >
                <Card className="neural-glass p-3 lg:p-3.5 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] border iridescent-border">
                  <div className="flex items-start gap-2.5 lg:gap-3">
                    {/* Agent Icon with Probability Ring */}
                    <div className="flex-shrink-0 relative">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${personalityColors[trade.agentPersonality] || personalityColors.quantitative}`}>
                        {personalityIcons[trade.agentPersonality] || "🤖"}
                      </div>
                      {probability && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary">{probability.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Trade Details */}
                    <div className="flex-1 min-w-0">
                      {/* Agent Name & Time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-sm truncate" data-testid={`text-agent-name-${trade.id}`}>
                            {trade.agentName}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] lg:text-xs flex-shrink-0 px-1.5 py-0 ${personalityColors[trade.agentPersonality]}`}
                          >
                            {trade.agentPersonality}
                          </Badge>
                        </div>
                        <span className="text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Market Question */}
                      <p className="text-xs lg:text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-market-question-${trade.id}`}>
                        {trade.marketQuestion}
                      </p>

                      {/* Trade Action */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {isYes ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                          )}
                          <Badge 
                            variant="outline"
                            className={`font-semibold border ${isYes ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}
                            data-testid={`badge-outcome-${trade.id}`}
                          >
                            {trade.outcome}
                          </Badge>
                        </div>
                        
                        <span className="text-xs lg:text-sm font-mono font-semibold text-cyan-400" data-testid={`text-amount-${trade.id}`}>
                          {trade.streamAmount.toLocaleString()} STREAM
                        </span>

                        {probability && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] lg:text-xs font-semibold border ${getConfidenceColor(probability)}`}
                            data-testid={`badge-probability-${trade.id}`}
                          >
                            {probability.toFixed(0)}%
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-[10px] lg:text-xs capitalize bg-slate-500/10 text-slate-400 border-slate-500/20">
                          {trade.marketCategory}
                        </Badge>
                      </div>

                      {/* Reasoning (optional, collapsed) */}
                      {trade.reasoning && (
                        <details className="mt-2.5 text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            View AI analysis
                          </summary>
                          <p className="mt-2 pl-3 py-2 border-l-2 border-primary/30 bg-muted/30 rounded-r text-xs leading-relaxed">
                            {trade.reasoning}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <Card className="neural-glass mt-4 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-cyan-400" data-testid="text-total-trades">
              {allTrades.length}
            </div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400" data-testid="text-yes-trades">
              {allTrades.filter(t => t.outcome === "YES").length}
            </div>
            <div className="text-xs text-muted-foreground">YES</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-400" data-testid="text-no-trades">
              {allTrades.filter(t => t.outcome === "NO").length}
            </div>
            <div className="text-xs text-muted-foreground">NO</div>
          </div>
        </div>
        {isMobile && allTrades.length > mobileLimit && (
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Showing {mobileLimit} of {allTrades.length} trades
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
