import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
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
    crypto: "bg-warn/10 text-warn border-warn/30",
    defi: "bg-accent-core/10 text-accent-bright border-accent-core/30",
    bounty: "bg-accent-core/10 text-accent-bright border-accent-core/30",
    real_world: "bg-gain/10 text-gain border-gain/30",
    community: "bg-accent-core/10 text-accent-bright border-accent-core/30"
  };
  return styles[category] || "bg-ink-raised text-secondary border-ink-edge";
};

const PositionCard = ({ position }: { position: UserPosition }) => {
  const { market } = position;
  const deadline = new Date(market.deadline);
  const currentPrice = position.outcome === 'yes' ? market.yesPrice : market.noPrice;
  const positionValue = (position.shares * currentPrice) / 100;
  const pnl = positionValue - position.totalInvested;
  const pnlPercent = ((pnl / position.totalInvested) * 100).toFixed(2);
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
      <Surface className="group transition-all hover:border-accent-core/50">
        <div className="p-5">
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
                       ? "bg-gain/10 text-gain border-gain/30"
                       : "bg-loss/10 text-loss border-loss/30"
                    )}
                    data-testid={`badge-position-${position.id}`}
                  >
                    {position.outcome.toUpperCase()} • {position.shares} shares
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-primary leading-snug group-hover:text-accent-bright transition-colors" data-testid={`text-question-${position.id}`}>
                  {market.question}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(deadline, 'MMM d')}</span>
              </div>
            </div>

            {/* AI Prediction Indicator */}
            {aiPrediction && (
              <div className={cn(
                "p-2.5 rounded-xl border flex items-center gap-2",
                followedAI 
                  ? "bg-accent-core/10 border-accent-core/30"
                  : "bg-warn/10 border-warn/30"
              )}>
                <Sparkles className={cn(
                  "w-4 h-4",
                  followedAI ? "text-accent-bright" : "text-warn"
                )} />
                <div className="flex-1">
                  <span className={cn(
                    "text-xs font-medium",
                    followedAI ? "text-accent-bright" : "text-warn"
                  )}>
                    {followedAI ? "Following AI" : "Bet Against AI"}
                  </span>
                  <span className={cn(
                    "text-xs ml-2",
                    followedAI ? "text-accent-bright" : "text-warn"
                  )}>
                    ({market.aiProbability}% {aiPrediction.toUpperCase()})
                  </span>
                </div>
              </div>
            )}

            {/* Position Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-ink-raised rounded-xl">
              <div className="text-center">
                <div className="text-xs text-muted mb-1">Invested</div>
                <div className="text-sm font-bold text-primary tabular" data-testid={`stat-invested-${position.id}`}>
                  ${(position.totalInvested / 100).toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted mb-1">Current</div>
                <div className="text-sm font-bold text-primary tabular" data-testid={`stat-current-${position.id}`}>
                  ${(positionValue / 100).toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted mb-1">P&L</div>
                <div className={cn(
                  "text-sm font-bold flex items-center justify-center gap-1 tabular",
                  isProfitable ? "text-gain" : "text-loss"
                )} data-testid={`stat-pnl-${position.id}`}>
                  {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isProfitable ? '+' : ''}{pnlPercent}%
                </div>
              </div>
            </div>

            {/* Current Market Prices */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-gain/10 border border-gain/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gain">YES</span>
                  <span className="text-sm font-bold text-gain tabular" data-testid={`price-yes-${position.id}`}>
                    {((market.yesPrice ?? 5000) > 10000 ? 50 : (market.yesPrice ?? 5000) / 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-loss/10 border border-loss/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-loss">NO</span>
                  <span className="text-sm font-bold text-loss tabular" data-testid={`price-no-${position.id}`}>
                    {((market.noPrice ?? 5000) > 10000 ? 50 : (market.noPrice ?? 5000) / 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/markets/${market.id}`}>
              <Button 
                size="sm" 
                className="w-full grad-accent glow-accent text-primary"
                data-testid={`button-trade-more-${position.id}`}
              >
                Trade More
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </Surface>
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
        <SectionTitle className="mb-4">Active Prediction Markets</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Surface key={i} className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4 bg-ink-raised" />
              <Skeleton className="h-4 w-full bg-ink-raised" />
              <Skeleton className="h-20 w-full bg-ink-raised" />
            </Surface>
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="space-y-4">
        <SectionTitle className="mb-4">Active Prediction Markets</SectionTitle>
        <Surface className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-accent-core/10 flex items-center justify-center">
                <Target className="w-8 h-8 text-accent-bright" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">No Active Positions</h3>
                <p className="text-secondary mb-4">
                  Start trading on prediction markets to see your positions here
                </p>
                <Link href="/markets">
                  <Button className="grad-accent glow-accent text-primary">
                    Browse Markets
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
        </Surface>
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
  const totalPnlPercent = ((totalPnl / totalInvested) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Active Prediction Markets</SectionTitle>
        <Link href="/markets">
          <Button variant="outline" size="sm" className="border-ink-edge text-secondary hover:bg-ink-raised">
            Browse All Markets
          </Button>
        </Link>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Surface className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted">Total Invested</span>
            </div>
            <StatValue label="" value={`$${(totalInvested / 100).toLocaleString()}`} data-testid="total-invested" />
        </Surface>
        <Surface className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted">Current Value</span>
            </div>
            <StatValue label="" value={`$${(totalCurrentValue / 100).toLocaleString()}`} data-testid="total-current" />
        </Surface>
        <Surface className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted">Total P&L</span>
            </div>
            <div className={cn(
              "text-xl font-bold flex items-center gap-1 tabular",
              totalPnl >= 0 ? "text-gain" : "text-loss"
            )} data-testid="total-pnl">
              {totalPnl >= 0 ? '+' : ''}{totalPnlPercent}%
            </div>
        </Surface>
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
