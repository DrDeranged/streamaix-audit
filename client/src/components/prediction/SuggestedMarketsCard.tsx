import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
  aiProbability?: number;
  aiReasoning?: string;
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
      <Surface className="overflow-hidden" data-testid="card-suggested-markets-loading">
        <div className="border-b border-ink-divider px-5 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-xl bg-ink-raised" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </Surface>
    );
  }

  if (!suggestedMarkets || suggestedMarkets.length === 0) {
    return (
      <Surface className="overflow-hidden" data-testid="card-suggested-markets-empty">
        <div className="border-b border-ink-divider px-5 py-4">
          <SectionTitle as="h3" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-bright" />
            AI-Suggested Markets
          </SectionTitle>
          <p className="mt-1 text-sm text-secondary">
            Prediction markets generated from this content
          </p>
        </div>
        <div className="p-5">
          <div className="py-8 text-center text-secondary">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted opacity-50" />
            <p className="text-sm">No prediction markets were suggested for this content.</p>
            <p className="mt-1 text-xs text-muted">The AI analyzes content to find verifiable predictions.</p>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="overflow-hidden" data-testid="card-suggested-markets">
      <div className="border-b border-ink-divider px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 animate-pulse text-accent-bright" />
            </div>
            <SectionTitle as="h3">
              AI-Suggested Markets
            </SectionTitle>
          </div>
          <Badge variant="outline" className="ml-auto rounded-xl border-accent-core/30 bg-accent-core/10 text-xs text-accent-bright">
            {topMarkets.length} {topMarkets.length === 1 ? 'Market' : 'Markets'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-secondary">
          Prediction markets generated from "{summaryTitle}"
        </p>
      </div>
      <div className="space-y-4 p-5">
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
              aiProbability: market.aiProbability,
              aiReasoning: market.aiReasoning,
            }}
            variant="detailed"
            summaryId={summaryId}
            summaryTitle={summaryTitle}
            showActions={true}
          />
        ))}
      </div>
    </Surface>
  );
}
