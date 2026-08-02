import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
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
    aiProbability?: number;
    aiReasoning?: string;
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

  // Calculate display values - prices stored as basis points (5000 = 50%)
  // Handle edge cases where prices might be stored incorrectly
  const normalizePrice = (price: number) => {
    if (price > 10000) return 50; // Invalid, default to 50%
    return price / 100;
  };
  const yesPrice = market.yesPrice || 5000; // Default 50%
  const noPrice = market.noPrice || 5000;
  const yesPricePercent = Math.round(normalizePrice(yesPrice));
  const noPricePercent = Math.round(normalizePrice(noPrice));
  const confidence = market.confidence || 70;
  const totalVolume = market.totalVolume || 0;
  const totalTrades = market.totalTrades || 0;
  const liquidity = (market.yesLiquidity || 0) + (market.noLiquidity || 0);

  // Category styling - improved for light mode
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      crypto: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      defi: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      real_world: 'bg-warn/10 text-warn border-warn/30',
      community: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      bounty: 'bg-gain/10 text-gain border-gain/30',
      content: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      general: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      avatar: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
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
          initialLiquidity: 1000,
          aiProbability: market.aiProbability,
          aiReasoning: market.aiReasoning
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Market Created!',
        description: `Successfully created prediction market`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
    },
    onError: (error: any) => {
      // Check if it's a duplicate market error
      if (error.message?.includes('409')) {
        toast({
          title: 'Market Already Exists',
          description: 'A market with this question already exists. Check the markets page to trade on it!',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Unable to create market',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
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
          className="text-ink-edge"
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
        <span className="text-xs font-bold text-primary tabular">{value}%</span>
      </div>
    </div>
  );

  // Compact variant (for landing page, lists) - Improved light mode
  if (variant === 'compact') {
    return (
          <Surface
        className={cn(
           "group overflow-hidden transition-all duration-300 hover:border-accent-core/60 hover:bg-ink-raised h-full"
        )}
        data-testid={`prediction-card-compact-${market.id}`}
      >
         <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Confidence Ring */}
            <ConfidenceRing value={confidence} />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={cn("text-xs font-medium", getCategoryStyle(market.category))} data-testid="badge-category">
                  {market.category.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-secondary" data-testid="time-remaining">
                  <Clock className="w-3 h-3" />
                  <span className={isExpiringSoon ? "text-orange-500 dark:text-orange-400 font-medium" : ""}>{timeUntilDeadline}</span>
                </div>
              </div>

              {/* Question */}
              <h4 className="font-semibold text-primary leading-snug mb-3 min-h-[2.5rem] group-hover:text-accent-bright transition-colors text-sm" data-testid="text-question">
                {market.question}
              </h4>

              {/* Price Indicators - Improved light mode */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-gain/10 border border-gain/30">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-gain" />
                    <span className="text-xs font-semibold text-gain">YES</span>
                  </div>
                  <span className="text-sm font-bold text-gain tabular" data-testid="yes-price">
                    {yesPricePercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-loss/10 border border-loss/30">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-loss" />
                    <span className="text-xs font-semibold text-loss">NO</span>
                  </div>
                  <span className="text-sm font-bold text-loss tabular" data-testid="no-price">
                    {noPricePercent}%
                  </span>
                </div>
              </div>

              {/* AI Prediction - Improved light mode */}
              {market.aiProbability !== undefined && market.aiProbability !== null && (
                <div className="mb-3 p-2 rounded-xl bg-accent-core/10 border border-accent-core/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-accent-bright" />
                      <span className="text-xs font-medium text-accent-bright">AI Predicts:</span>
                      <Badge 
                        className={cn(
                          "text-xs font-bold",
                          market.aiProbability > 50 
                            ? "bg-gain/10 text-gain border-gain/30"
                            : "bg-loss/10 text-loss border-loss/30"
                        )}
                        data-testid="ai-prediction-badge"
                      >
                        {market.aiProbability > 50 ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-accent-bright tabular" data-testid="ai-probability">
                      {market.aiProbability}%
                    </span>
                  </div>
                </div>
              )}

              {/* Volume & Trades - Improved light mode */}
              {(totalVolume > 0 || totalTrades > 0) && (
                <div className="flex items-center gap-4 text-xs text-secondary mb-3">
                  {totalVolume > 0 && (
                    <div className="flex items-center gap-1" data-testid="total-volume">
                      <DollarSign className="w-3 h-3 text-muted" />
                      <span className="font-medium">{(totalVolume / 1000).toFixed(1)}K</span>
                    </div>
                  )}
                  {totalTrades > 0 && (
                    <div className="flex items-center gap-1" data-testid="total-trades">
                      <Activity className="w-3 h-3 text-muted" />
                      <span className="font-medium">{totalTrades} trades</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tags - Light mode friendly */}
              {market.tags && market.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {market.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-xl bg-ink-raised text-secondary border border-ink-edge">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions - Glassmorphism style */}
              {showActions && (
                <div className="flex items-center gap-2">
                  {market.id ? (
                    <Link href={`/markets/${market.id}`} className="flex-1">
                      <div className="relative group/btn">
                        <div className="absolute -inset-[1px] rounded-xl bg-accent-core opacity-70 group-hover/btn:opacity-100 blur-[1px] transition-opacity duration-300" />
                        <Button 
                          size="sm" 
                          className="relative w-full grad-accent text-primary border-0 rounded-xl transition-all duration-300 glow-accent"
                          data-testid="button-trade"
                        >
                          <span className="font-medium">Trade Now</span>
                          <ChevronRight className="w-3 h-3 ml-1 text-primary" />
                        </Button>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex-1 relative group/btn">
                      <div className="absolute -inset-[1px] rounded-xl bg-accent-core opacity-70 group-hover/btn:opacity-100 blur-[1px] transition-opacity duration-300" />
                      <Button 
                        size="sm" 
                        className="relative w-full grad-accent text-primary border-0 rounded-xl glow-accent"
                        onClick={() => createMarketMutation.mutate()}
                        disabled={createMarketMutation.isPending}
                        data-testid="button-create-market"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-primary" />
                        <span className="font-medium">Create Market</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Position Indicator */}
          {userPosition && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-muted">Your Position</span>
              <Badge variant="outline" className="text-xs bg-accent-core/10 text-accent-bright border-accent-core/30">
                {userPosition.outcome.toUpperCase()} • {userPosition.shares} shares
              </Badge>
            </div>
          )}
         </div>
      </Surface>
    );
  }

  // Detailed variant (for summary pages) - Improved light mode
  if (variant === 'detailed') {
    return (
      <Surface
        className="transition-all hover:border-accent-core/60 hover:bg-ink-raised"
        data-testid={`prediction-card-detailed-${market.id}`}
      >
        <div className="p-6">
          <div className="space-y-4">
            {/* Header with Confidence Ring */}
            <div className="flex items-start gap-4">
              <ConfidenceRing value={confidence} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={cn("font-medium", getCategoryStyle(market.category))} data-testid="badge-category">
                    {market.category.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>{format(deadline, 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-primary leading-tight" data-testid="text-question">
                  {market.question}
                </h3>
                {market.description && (
                  <p className="text-sm text-body mt-2" data-testid="text-description">
                    {market.description}
                  </p>
                )}
              </div>
            </div>

            {/* Price Chart - Improved light mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gain/10 border border-gain/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gain">YES</span>
                  <TrendingUp className="w-4 h-4 text-gain" />
                </div>
                <div className="text-2xl font-bold text-gain tabular mb-1" data-testid="yes-price-detailed">
                  {yesPricePercent}%
                </div>
                <Progress value={yesPricePercent} className="h-1.5 bg-gain/20" />
              </div>
              <div className="p-4 rounded-xl bg-loss/10 border border-loss/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-loss">NO</span>
                  <TrendingDown className="w-4 h-4 text-loss" />
                </div>
                <div className="text-2xl font-bold text-loss tabular mb-1" data-testid="no-price-detailed">
                  {noPricePercent}%
                </div>
                <Progress value={noPricePercent} className="h-1.5 bg-loss/20" />
              </div>
            </div>

            {/* AI Prediction - Detailed View */}
            {market.aiProbability !== undefined && market.aiProbability !== null && (
              <div className="p-4 rounded-xl bg-accent-core/10 border border-accent-core/30">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-accent-bright" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-accent-bright">AI Analysis</h4>
                  </div>
                  <Badge 
                    className={cn(
                      "text-sm font-bold px-3 py-1",
                      market.aiProbability > 50 
                         ? "bg-gain/10 text-gain border-gain/30"
                         : "bg-loss/10 text-loss border-loss/30"
                    )}
                    data-testid="ai-prediction-badge-detailed"
                  >
                    {market.aiProbability > 50 ? 'YES' : 'NO'} {market.aiProbability}%
                  </Badge>
                </div>
                {market.aiReasoning && (
                  <p className="text-xs text-body leading-relaxed" data-testid="ai-reasoning">
                    {market.aiReasoning}
                  </p>
                )}
              </div>
            )}

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-ink-raised rounded-xl">
              <div className="text-center" data-testid="stat-volume">
                <div className="text-xs text-muted mb-1">Volume</div>
                <div className="text-sm font-bold text-primary tabular">
                  ${(totalVolume / 100).toLocaleString()}
                </div>
              </div>
              <div className="text-center" data-testid="stat-trades">
                <div className="text-xs text-muted mb-1">Trades</div>
                <div className="text-sm font-bold text-primary tabular">{totalTrades}</div>
              </div>
              <div className="text-center" data-testid="stat-liquidity">
                <div className="text-xs text-muted mb-1">Liquidity</div>
                <div className="text-sm font-bold text-primary tabular">
                  ${(liquidity / 100).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tags */}
            {market.tags && market.tags.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="tags-container">
                {market.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-ink-raised border-ink-edge text-secondary">
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
                      className="w-full grad-accent rounded-xl glow-accent"
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
                    className="flex-1 grad-accent rounded-xl glow-accent"
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
        </div>
      </Surface>
    );
  }

  return null;
}
