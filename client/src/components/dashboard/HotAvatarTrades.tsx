import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Flame, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarTrade {
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
  reasoning: string;
  probability: number | null;
  createdAt: string;
  traderType?: 'agent' | 'avatar';
  avatarImageUrl?: string | null;
}

interface HotAvatarTradesProps {
  limit?: number;
  className?: string;
}

export function HotAvatarTrades({ limit = 5, className = "" }: HotAvatarTradesProps) {
  const { data, isLoading } = useQuery<{ trades: AvatarTrade[] }>({
    queryKey: [`/api/ai-agents/trades?limit=${limit * 2}&includeAvatars=true`],
    refetchInterval: 30000,
  });

  const avatarTrades = (data?.trades || []).filter(t => t.traderType === 'avatar').slice(0, limit);

  if (isLoading) {
    return (
      <Card className={`neural-glass p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Hot Avatar Trades</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!avatarTrades || avatarTrades.length === 0) {
    return (
      <Card className={`neural-glass p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Hot Avatar Trades</h3>
        </div>
        <div className="text-center py-6 text-slate-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No avatar trades yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900/90 to-orange-950/30 border border-orange-500/20 backdrop-blur-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-orange-400" />
          </motion.div>
          <h3 className="text-lg font-semibold text-white">Hot Avatar Trades</h3>
        </div>
        <Link href="/markets/leaderboard">
          <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {avatarTrades.map((trade, index) => {
          const isYes = trade.outcome === "YES";
          
          return (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/avatars/${trade.agentId}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <Avatar className="w-10 h-10 border-2 border-cyan-400/30 group-hover:border-cyan-400/60 transition-colors">
                    <AvatarImage src={trade.avatarImageUrl || undefined} alt={trade.agentName} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-sm">
                      {trade.agentName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                        {trade.agentName}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isYes ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}
                      >
                        {trade.outcome}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {trade.marketQuestion}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      {isYes ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                      )}
                      <span className="text-sm font-mono font-semibold text-cyan-300">
                        {trade.streamAmount.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export default HotAvatarTrades;
