import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Target,
  BarChart3,
  Users,
  Sparkles,
  ChevronRight,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface EnhancedPredictionMarketCardProps {
  market: {
    id?: string;
    question: string;
    description?: string;
    category: string;
    deadline: string;
    yesPrice?: number;
    noPrice?: number;
    totalVolume?: number;
    totalTrades?: number;
    confidence?: number;
    tags?: string[];
    resolutionSource?: string;
    yesLiquidity?: number;
    noLiquidity?: number;
    status?: string;
    imageUrl?: string;
  };
  variant?: 'compact' | 'detailed' | 'trading';
  showActions?: boolean;
  summaryId?: string;
  summaryTitle?: string;
  onTrade?: (outcome: 'yes' | 'no') => void;
}

export function EnhancedPredictionMarketCard({ 
  market, 
  variant = 'compact',
  showActions = true,
  summaryId,
  summaryTitle,
  onTrade
}: EnhancedPredictionMarketCardProps) {
  const { toast } = useToast();
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(100);

  // Get user's position if they have one
  const { data: userPosition } = useQuery<{
    outcome: string;
    shares: number;
    averagePrice: number;
    totalInvested: number;
    unrealizedPnl: number;
  }>({
    queryKey: ['/api/prediction-markets/positions/me', market.id],
    enabled: !!market.id,
  });

  // Calculate display values
  const yesPrice = market.yesPrice || 5000; // Default 50%
  const noPrice = market.noPrice || 5000;
  const yesPricePercent = Math.round((yesPrice / 100));
  const noPricePercent = Math.round((noPrice / 100));
  const confidence = market.confidence || 70;
  const totalVolume = market.totalVolume || 0;
  const totalTrades = market.totalTrades || 0;
  const liquidity = (market.yesLiquidity || 0) + (market.noLiquidity || 0);

  // Category styling
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      crypto: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      defi: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      real_world: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      community: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      bounty: 'bg-green-500/10 text-green-400 border-green-500/30',
      content: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return styles[category.toLowerCase()] || styles.community;
  };

  // Time until deadline
  const deadline = new Date(market.deadline);
  const timeUntilDeadline = formatDistanceToNow(deadline, { addSuffix: true });
  const isExpiringSoon = deadline.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  // Create market mutation
  const createMarketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/prediction-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: market.question,
          description: market.description || '',
          category: market.category,
          deadline: market.deadline,
          resolutionSource: market.resolutionSource || 'oracle',
          sourceContentId: summaryId,
          tags: market.tags || [],
          initialLiquidity: 1000
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Market Created!',
        description: `Successfully created prediction market`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Market',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Render confidence ring
  const ConfidenceRing = ({ value }: { value: number }) => (
    <div className="relative w-16 h-16" data-testid={`confidence-ring-${market.id}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-700"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 28}`}
          strokeDashoffset={`${2 * Math.PI * 28 * (1 - value / 100)}`}
          className={cn(
            "transition-all duration-500",
            value >= 80 ? "text-green-500" : value >= 60 ? "text-yellow-500" : "text-orange-500"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{value}%</span>
      </div>
    </div>
  );

  // Compact variant (for landing page, lists)
  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "group bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50",
          "hover:border-purple-500/50 transition-all duration-300 overflow-hidden",
          "hover:shadow-lg hover:shadow-purple-500/20 h-full"
        )}
        data-testid={`prediction-card-compact-${market.id}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Confidence Ring */}
            <ConfidenceRing value={confidence} />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={cn("text-xs", getCategoryStyle(market.category))} data-testid="badge-category">
                  {market.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="time-remaining">
                  <Clock className="w-3 h-3" />
                  <span className={isExpiringSoon ? "text-orange-400" : ""}>{timeUntilDeadline}</span>
                </div>
              </div>

              {/* Question */}
              <h4 className="font-semibold text-white leading-snug mb-3 min-h-[2.5rem] group-hover:text-purple-300 transition-colors text-sm" data-testid="text-question">
                {market.question}
              </h4>

              {/* Price Indicators */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-green-400">YES</span>
                  </div>
                  <span className="text-sm font-bold text-green-400" data-testid="yes-price">
                    {yesPricePercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-red-400">NO</span>
                  </div>
                  <span className="text-sm font-bold text-red-400" data-testid="no-price">
                    {noPricePercent}%
                  </span>
                </div>
              </div>

              {/* Volume & Trades */}
              {(totalVolume > 0 || totalTrades > 0) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {totalVolume > 0 && (
                    <div className="flex items-center gap-1" data-testid="total-volume">
                      <DollarSign className="w-3 h-3" />
                      <span>${(totalVolume / 100).toLocaleString()}</span>
                    </div>
                  )}
                  {totalTrades > 0 && (
                    <div className="flex items-center gap-1" data-testid="total-trades">
                      <Activity className="w-3 h-3" />
                      <span>{totalTrades} trades</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-2">
                  {market.id ? (
                    <Link href={`/markets/${market.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                        data-testid="button-trade"
                      >
                        Trade Now
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => createMarketMutation.mutate()}
                      disabled={createMarketMutation.isPending}
                      data-testid="button-create-market"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create Market
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Position Indicator */}
          {userPosition && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Your Position</span>
              <Badge variant="outline" className="text-xs">
                {userPosition.outcome.toUpperCase()} • {userPosition.shares} shares
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant (for summary pages)
  if (variant === 'detailed') {
    return (
      <Card 
        className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-purple-500/50 transition-all"
        data-testid={`prediction-card-detailed-${market.id}`}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with Confidence Ring */}
            <div className="flex items-start gap-4">
              <ConfidenceRing value={confidence} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={getCategoryStyle(market.category)} data-testid="badge-category">
                    {market.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(deadline, 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight" data-testid="text-question">
                  {market.question}
                </h3>
                {market.description && (
                  <p className="text-sm text-slate-300 mt-2" data-testid="text-description">
                    {market.description}
                  </p>
                )}
              </div>
            </div>

            {/* Price Chart */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-400">YES</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400 mb-1" data-testid="yes-price-detailed">
                  {yesPricePercent}%
                </div>
                <Progress value={yesPricePercent} className="h-1.5 bg-green-950" />
              </div>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-400">NO</span>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400 mb-1" data-testid="no-price-detailed">
                  {noPricePercent}%
                </div>
                <Progress value={noPricePercent} className="h-1.5 bg-red-950" />
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-center" data-testid="stat-volume">
                <div className="text-xs text-muted-foreground mb-1">Volume</div>
                <div className="text-sm font-bold text-white">
                  ${(totalVolume / 100).toLocaleString()}
                </div>
              </div>
              <div className="text-center" data-testid="stat-trades">
                <div className="text-xs text-muted-foreground mb-1">Trades</div>
                <div className="text-sm font-bold text-white">{totalTrades}</div>
              </div>
              <div className="text-center" data-testid="stat-liquidity">
                <div className="text-xs text-muted-foreground mb-1">Liquidity</div>
                <div className="text-sm font-bold text-white">
                  ${(liquidity / 100).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tags */}
            {market.tags && market.tags.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="tags-container">
                {market.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-slate-800/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 pt-2">
                {market.id ? (
                  <Link href={`/markets/${market.id}`} className="flex-1">
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                      data-testid="button-view-market"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      View Full Market
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    size="lg" 
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => createMarketMutation.mutate()}
                    disabled={createMarketMutation.isPending}
                    data-testid="button-create-market-detailed"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Market
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
