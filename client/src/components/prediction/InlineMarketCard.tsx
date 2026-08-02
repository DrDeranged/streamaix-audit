import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Surface from '@/components/ds/Surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface InlineMarketCardProps {
  market: {
    id: string;
    question: string;
    category: string;
    deadline: string;
    yesPrice?: number;
    noPrice?: number;
    totalVolume?: number;
    yesLiquidity?: number;
    noLiquidity?: number;
    status?: string;
  };
  variant?: 'compact' | 'mini';
  context?: 'social' | 'avatar';
}

export function InlineMarketCard({ 
  market, 
  variant = 'compact',
  context = 'social'
}: InlineMarketCardProps) {
  const { toast } = useToast();
  const [tradeAmount, setTradeAmount] = useState<number>(100);

  // Safety check: ensure market has required fields
  if (!market || !market.id || !market.question || !market.deadline) {
    console.error('InlineMarketCard: Invalid market data', market);
    return null;
  }

  // Calculate display values
  // Prices can be stored in different formats:
  // - Basis points (10000 = 100%): values typically 0-10000
  // - Micro-units (1000000 = 100%): values typically 0-1000000
  const rawYesPrice = market.yesPrice || 5000;
  const rawNoPrice = market.noPrice || 5000;
  
  // Normalize to percentage (detect format based on value range)
  const normalizePrice = (price: number): number => {
    if (price > 10000) {
      // Micro-units format (1000000 = 100%)
      return Math.round((price / 1000000) * 100);
    } else {
      // Basis points format (10000 = 100%)
      return Math.round((price / 10000) * 100);
    }
  };
  
  const yesPricePercent = normalizePrice(rawYesPrice);
  const noPricePercent = normalizePrice(rawNoPrice);
  const totalVolume = market.totalVolume || 0;

  // Category styling
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      crypto: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      defi: 'bg-accent-deep/20 text-accent-bright border-accent-core/30',
      social: 'bg-warn/10 text-warn border-warn/30',
      avatar: 'bg-accent-core/10 text-accent-bright border-accent-core/30',
      macro: 'bg-gain/10 text-gain border-gain/30',
    };
    return styles[category.toLowerCase()] || styles.crypto;
  };

  // Time until deadline
  const deadline = new Date(market.deadline);
  const timeUntilDeadline = formatDistanceToNow(deadline, { addSuffix: true });

  // Trade mutation
  const tradeMutation = useMutation({
    mutationFn: async ({ outcome, amount }: { outcome: 'yes' | 'no'; amount: number }) => {
      const response = await apiRequest(`/api/prediction-markets/${market.id}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          amount,
        }),
      });
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Trade Executed!',
        description: `Bought ${variables.outcome.toUpperCase()} shares for ${variables.amount} STREAM`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets/positions/me'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to complete trade',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleQuickTrade = (outcome: 'yes' | 'no') => {
    tradeMutation.mutate({ outcome, amount: tradeAmount });
  };

  if (variant === 'mini') {
    return (
      <Surface className="overflow-hidden transition-all duration-300 group hover:bg-ink-raised">
        <div className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", getCategoryStyle(market.category))}>
              {market.category}
            </Badge>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-muted">
              <Clock className="h-2.5 w-2.5" />
              <span>{timeUntilDeadline}</span>
            </div>
          </div>

          <Link href={`/markets/${market.id}`}>
            <h3 className="mb-2 line-clamp-2 text-xs font-semibold text-primary transition-colors hover:text-accent-bright">
              {market.question}
            </h3>
          </Link>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              onClick={() => handleQuickTrade('yes')}
              disabled={tradeMutation.isPending}
              className="h-8 rounded-xl border-0 bg-gain text-[11px] text-ink-page transition-colors hover:bg-gain/80"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              YES {yesPricePercent}%
            </Button>
            <Button
              size="sm"
              onClick={() => handleQuickTrade('no')}
              disabled={tradeMutation.isPending}
              className="h-8 rounded-xl border-0 bg-loss text-[11px] text-ink-page transition-colors hover:bg-loss/80"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              NO {noPricePercent}%
            </Button>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="overflow-hidden transition-all duration-300 group hover:bg-ink-raised">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", getCategoryStyle(market.category))}>
              {market.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Sparkles className="h-3 w-3 text-accent-bright" />
              Trade on this
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3 w-3" />
            <span>{timeUntilDeadline}</span>
          </div>
        </div>

        {/* Question */}
        <Link href={`/markets/${market.id}`}>
          <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-primary transition-colors group-hover:text-accent-bright hover:text-accent-bright">
            {market.question}
          </h3>
        </Link>

        {/* Price Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="tabular text-xs font-medium text-gain">YES {yesPricePercent}%</span>
            <span className="tabular text-xs font-medium text-loss">NO {noPricePercent}%</span>
          </div>
          <Progress 
            value={yesPricePercent} 
            className="h-2 bg-loss/20 [&>div]:bg-gain"
          />
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            size="sm"
            onClick={() => handleQuickTrade('yes')}
            disabled={tradeMutation.isPending}
            className="rounded-xl border-0 bg-gain text-ink-page transition-colors hover:bg-gain/80"
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Buy YES
          </Button>
          <Button
            size="sm"
            onClick={() => handleQuickTrade('no')}
            disabled={tradeMutation.isPending}
            className="rounded-xl border-0 bg-loss text-ink-page transition-colors hover:bg-loss/80"
          >
            <TrendingDown className="h-4 w-4 mr-1.5" />
            Buy NO
          </Button>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t border-ink-divider pt-2 text-xs text-muted">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <AnimatedCounter value={totalVolume} />
            <span>STREAM</span>
          </div>
          <Link href={`/markets/${market.id}`}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-accent-bright hover:bg-ink-raised hover:text-primary">
              View Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Surface>
  );
}
