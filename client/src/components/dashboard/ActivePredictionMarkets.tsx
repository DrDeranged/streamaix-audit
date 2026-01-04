import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ChevronRight, 
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserPosition {
  id: string;
  marketId: string;
  userId: string;
  outcome: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  totalInvested: number;
  currentValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  createdAt: string;
  updatedAt: string;
  market: {
    id: string;
    question: string;
    category: string;
    deadline: string;
    yesPrice: number;
    noPrice: number;
    yesLiquidity: number;
    noLiquidity: number;
    totalVolume: number;
    totalTrades: number;
    aiProbability?: number;
    aiReasoning?: string;
    status: string;
    imageUrl?: string;
    tags?: string[];
  };
}

const getCategoryStyle = (category: string) => {
  const styles: Record<string, string> = {
    crypto: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    defi: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    bounty: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    real_world: "bg-green-500/20 text-green-300 border-green-500/30",
    community: "bg-pink-500/20 text-pink-300 border-pink-500/30"
  };
  return styles[category] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
};

const PositionCard = ({ position }: { position: UserPosition }) => {
  const { market } = position;
  const deadline = new Date(market.deadline);
  const currentPrice = position.outcome === 'yes' ? market.yesPrice : market.noPrice;
  const positionValue = (position.shares * currentPrice) / 100;
  const pnl = positionValue - position.totalInvested;
  const pnlPercent = ((pnl / position.totalInvested) * 100).toFixed(1);
  const isProfitable = pnl >= 0;
  
  // Check if user followed AI or bet against
  const aiPrediction = market.aiProbability !== undefined && market.aiProbability !== null
    ? market.aiProbability > 50 ? 'yes' : 'no'
    : null;
  const followedAI = aiPrediction === position.outcome;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-purple-500/50 transition-all group">
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryStyle(market.category)} data-testid={`badge-category-${position.id}`}>
                    {market.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge 
                    className={cn(
                      "text-xs font-bold",
                      position.outcome === 'yes' 
                        ? "bg-green-500/20 text-green-400 border-green-500/40" 
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    )}
                    data-testid={`badge-position-${position.id}`}
                  >
                    {position.outcome.toUpperCase()} • {position.shares} shares
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-purple-300 transition-colors" data-testid={`text-question-${position.id}`}>
                  {market.question}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(deadline, 'MMM d')}</span>
              </div>
            </div>

            {/* AI Prediction Indicator */}
            {aiPrediction && (
              <div className={cn(
                "p-2.5 rounded-lg border flex items-center gap-2",
                followedAI 
                  ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30" 
                  : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
              )}>
                <Sparkles className={cn(
                  "w-4 h-4",
                  followedAI ? "text-violet-400" : "text-amber-400"
                )} />
                <div className="flex-1">
                  <span className={cn(
                    "text-xs font-medium",
                    followedAI ? "text-violet-300" : "text-amber-300"
                  )}>
                    {followedAI ? "Following AI" : "Bet Against AI"}
                  </span>
                  <span className={cn(
                    "text-xs ml-2",
                    followedAI ? "text-violet-400" : "text-amber-400"
                  )}>
                    ({market.aiProbability}% {aiPrediction.toUpperCase()})
                  </span>
                </div>
              </div>
            )}

            {/* Position Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Invested</div>
                <div className="text-sm font-bold text-white" data-testid={`stat-invested-${position.id}`}>
                  ${(position.totalInvested / 100).toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Current</div>
                <div className="text-sm font-bold text-white" data-testid={`stat-current-${position.id}`}>
                  ${(positionValue / 100).toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">P&L</div>
                <div className={cn(
                  "text-sm font-bold flex items-center justify-center gap-1",
                  isProfitable ? "text-green-400" : "text-red-400"
                )} data-testid={`stat-pnl-${position.id}`}>
                  {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isProfitable ? '+' : ''}{pnlPercent}%
                </div>
              </div>
            </div>

            {/* Current Market Prices */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-400">YES</span>
                  <span className="text-sm font-bold text-green-400" data-testid={`price-yes-${position.id}`}>
                    {(market.yesPrice > 10000 ? 50 : market.yesPrice / 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400">NO</span>
                  <span className="text-sm font-bold text-red-400" data-testid={`price-no-${position.id}`}>
                    {(market.noPrice > 10000 ? 50 : market.noPrice / 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/markets/${market.id}`}>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                data-testid={`button-trade-more-${position.id}`}
              >
                Trade More
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ActivePredictionMarkets() {
  const { data, isLoading } = useQuery<{ positions: UserPosition[] }>({
    queryKey: ['/api/prediction-markets/positions/me']
  });

  const positions = data?.positions || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Active Prediction Markets</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4 bg-slate-700" />
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-20 w-full bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Active Prediction Markets</h2>
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">No Active Positions</h3>
                <p className="text-slate-400 mb-4">
                  Start trading on prediction markets to see your positions here
                </p>
                <Link href="/markets">
                  <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white">
                    Browse Markets
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total stats
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalCurrentValue = positions.reduce((sum, p) => {
    const currentPrice = p.outcome === 'yes' ? p.market.yesPrice : p.market.noPrice;
    return sum + (p.shares * currentPrice) / 100;
  }, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPercent = ((totalPnl / totalInvested) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Active Prediction Markets</h2>
        <Link href="/markets">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Browse All Markets
          </Button>
        </Link>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Total Invested</span>
            </div>
            <div className="text-xl font-bold text-white" data-testid="total-invested">
              ${(totalInvested / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Current Value</span>
            </div>
            <div className="text-xl font-bold text-white" data-testid="total-current">
              ${(totalCurrentValue / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Total P&L</span>
            </div>
            <div className={cn(
              "text-xl font-bold flex items-center gap-1",
              totalPnl >= 0 ? "text-green-400" : "text-red-400"
            )} data-testid="total-pnl">
              {totalPnl >= 0 ? '+' : ''}{totalPnlPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-testid="positions-grid">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
}
