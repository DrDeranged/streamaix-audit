import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Tag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SuggestedMarket {
  question: string;
  description: string;
  category: string;
  deadline: string;
  confidence: number;
  resolutionSource?: string;
  tags?: string[];
}

interface SuggestedMarketsCardProps {
  suggestedMarkets: SuggestedMarket[];
  summaryId: string;
  summaryTitle: string;
  isLoading?: boolean;
}

export function SuggestedMarketsCard({ 
  suggestedMarkets, 
  summaryId, 
  summaryTitle,
  isLoading = false 
}: SuggestedMarketsCardProps) {
  const { toast } = useToast();
  const [createdMarkets, setCreatedMarkets] = useState<Set<number>>(new Set());

  const createMarketMutation = useMutation({
    mutationFn: async (market: SuggestedMarket) => {
      const response = await apiRequest('/api/prediction-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: market.question,
          description: market.description,
          category: market.category,
          deadline: market.deadline,
          resolutionSource: market.resolutionSource || 'oracle',
          sourceContentId: summaryId,
          tags: market.tags || [],
          initialLiquidity: 1000,
          privateKey: import.meta.env.VITE_PRIVATE_KEY || ''
        }),
      });
      return response.json();
    },
    onSuccess: (data, market) => {
      toast({
        title: 'Market Created!',
        description: `Successfully created prediction market for "${market.question}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
    },
    onError: (error: Error, market) => {
      toast({
        title: 'Failed to Create Market',
        description: error.message || 'An error occurred while creating the market',
        variant: 'destructive',
      });
    },
  });

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      crypto: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      defi: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      real_world: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      community: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      bounty: 'bg-green-500/20 text-green-400 border-green-500/50',
    };
    return colors[category.toLowerCase()] || colors.community;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Sort by confidence and limit to top 5
  const topMarkets = [...suggestedMarkets]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border-purple-500/30" data-testid="card-suggested-markets-loading">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!suggestedMarkets || suggestedMarkets.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border-purple-500/30" data-testid="card-suggested-markets-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI-Suggested Markets
          </CardTitle>
          <CardDescription>
            Prediction markets generated from this content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No prediction markets were suggested for this content.</p>
            <p className="text-xs mt-1">The AI analyzes content to find verifiable predictions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border-purple-500/30" data-testid="card-suggested-markets">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full" />
            </div>
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Suggested Markets
            </span>
          </div>
          <Badge variant="outline" className="ml-auto text-xs bg-purple-500/10 border-purple-500/30">
            {topMarkets.length} {topMarkets.length === 1 ? 'Market' : 'Markets'}
          </Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          Prediction markets generated from "{summaryTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topMarkets.map((market, index) => {
          const isCreated = createdMarkets.has(index);
          const isCreating = createMarketMutation.isPending;
          const deadlineDate = new Date(market.deadline);

          return (
            <div
              key={index}
              className="group relative p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-purple-500/50 transition-all"
              data-testid={`suggested-market-${index}`}
            >
              {/* Confidence indicator on left edge */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getConfidenceColor(market.confidence)}`}
                data-testid={`confidence-indicator-${index}`}
              />

              <div className="space-y-3 pl-2">
                {/* Category and Confidence */}
                <div className="flex items-start justify-between gap-2">
                  <Badge className={getCategoryColor(market.category)} data-testid={`badge-category-${index}`}>
                    {market.category}
                  </Badge>
                  <div className="flex items-center gap-2" data-testid={`confidence-badge-${index}`}>
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Badge variant="outline" className="bg-slate-800/50">
                      {market.confidence}%
                    </Badge>
                  </div>
                </div>

                {/* Question */}
                <h4 className="font-semibold text-white leading-tight" data-testid={`text-question-${index}`}>
                  {market.question}
                </h4>

                {/* Description */}
                <p className="text-sm text-slate-300 line-clamp-2" data-testid={`text-description-${index}`}>
                  {market.description}
                </p>

                {/* Progress bar for confidence */}
                <div className="space-y-1">
                  <Progress 
                    value={market.confidence} 
                    className="h-1.5" 
                    data-testid={`progress-confidence-${index}`}
                  />
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" data-testid={`deadline-${index}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(deadlineDate, 'MMM d, yyyy')}</span>
                  </div>
                  {market.resolutionSource && (
                    <div className="flex items-center gap-1.5" data-testid={`resolution-source-${index}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span>{market.resolutionSource}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {market.tags && market.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" data-testid={`tags-${index}`}>
                    {market.tags.slice(0, 4).map((tag, tagIndex) => (
                      <Badge 
                        key={tagIndex} 
                        variant="outline" 
                        className="text-xs bg-slate-800/30 border-slate-600/50"
                        data-testid={`tag-${index}-${tagIndex}`}
                      >
                        <Tag className="w-2.5 h-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Create Market Button */}
                <Button
                  onClick={() => {
                    createMarketMutation.mutate(market);
                    setCreatedMarkets(prev => new Set(prev).add(index));
                  }}
                  disabled={isCreated || isCreating}
                  className={`w-full mt-2 ${
                    isCreated 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600'
                  }`}
                  data-testid={`button-create-market-${index}`}
                >
                  {isCreated ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Market Created
                    </>
                  ) : isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Create Market
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
