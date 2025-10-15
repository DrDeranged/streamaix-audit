import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import { EnhancedPredictionMarketCard } from './EnhancedPredictionMarketCard';

interface SuggestedMarket {
  id?: string;
  question: string;
  description: string;
  category: string;
  deadline: string;
  confidence: number;
  resolutionSource?: string;
  tags?: string[];
  yesPrice?: number;
  noPrice?: number;
  totalVolume?: number;
  totalTrades?: number;
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
        {topMarkets.map((market, index) => (
          <EnhancedPredictionMarketCard
            key={index}
            market={{
              id: market.id,
              question: market.question,
              description: market.description,
              category: market.category,
              deadline: market.deadline,
              confidence: market.confidence,
              tags: market.tags,
              resolutionSource: market.resolutionSource,
              yesPrice: market.yesPrice || 5000,
              noPrice: market.noPrice || 5000,
              totalVolume: market.totalVolume || 0,
              totalTrades: market.totalTrades || 0,
            }}
            variant="detailed"
            summaryId={summaryId}
            summaryTitle={summaryTitle}
            showActions={true}
          />
        ))}
      </CardContent>
    </Card>
  );
}
