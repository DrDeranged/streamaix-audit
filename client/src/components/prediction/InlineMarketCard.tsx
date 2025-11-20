import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Users,
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

  // Calculate display values
  const yesPrice = market.yesPrice || 500000; // Default 50%
  const noPrice = market.noPrice || 500000;
  const yesPricePercent = Math.round((yesPrice / 1000000) * 100);
  const noPricePercent = Math.round((noPrice / 1000000) * 100);
  const totalVolume = market.totalVolume || 0;

  // Category styling
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      crypto: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      defi: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      social: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      avatar: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      macro: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
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
        title: 'Trade Failed',
        description: error.message || 'Unable to execute trade',
        variant: 'destructive',
      });
    },
  });

  const handleQuickTrade = (outcome: 'yes' | 'no') => {
    tradeMutation.mutate({ outcome, amount: tradeAmount });
  };

  if (variant === 'mini') {
    return (
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden group">
        <div className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", getCategoryStyle(market.category))}>
              {market.category}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
              <Clock className="h-2.5 w-2.5" />
              <span>{timeUntilDeadline}</span>
            </div>
          </div>

          <Link href={`/markets/${market.id}`}>
            <h3 className="text-xs font-semibold text-foreground mb-2 line-clamp-2 hover:text-purple-400 transition-colors cursor-pointer">
              {market.question}
            </h3>
          </Link>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              onClick={() => handleQuickTrade('yes')}
              disabled={tradeMutation.isPending}
              className="h-8 text-[11px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              YES {yesPricePercent}%
            </Button>
            <Button
              size="sm"
              onClick={() => handleQuickTrade('no')}
              disabled={tradeMutation.isPending}
              className="h-8 text-[11px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-0"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              NO {noPricePercent}%
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden group">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", getCategoryStyle(market.category))}>
              {market.category}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" />
              Trade on this
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeUntilDeadline}</span>
          </div>
        </div>

        {/* Question */}
        <Link href={`/markets/${market.id}`}>
          <h3 className="text-sm font-semibold text-foreground mb-3 line-clamp-2 hover:text-purple-400 transition-colors cursor-pointer group-hover:text-purple-300">
            {market.question}
          </h3>
        </Link>

        {/* Price Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-green-400 font-medium">YES {yesPricePercent}%</span>
            <span className="text-xs text-red-400 font-medium">NO {noPricePercent}%</span>
          </div>
          <Progress 
            value={yesPricePercent} 
            className="h-2 bg-red-900/30 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
          />
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            size="sm"
            onClick={() => handleQuickTrade('yes')}
            disabled={tradeMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-lg shadow-green-500/20"
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Buy YES
          </Button>
          <Button
            size="sm"
            onClick={() => handleQuickTrade('no')}
            disabled={tradeMutation.isPending}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-0 shadow-lg shadow-red-500/20"
          >
            <TrendingDown className="h-4 w-4 mr-1.5" />
            Buy NO
          </Button>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <AnimatedCounter value={totalVolume} />
            <span>STREAM</span>
          </div>
          <Link href={`/markets/${market.id}`}>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2">
              View Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
