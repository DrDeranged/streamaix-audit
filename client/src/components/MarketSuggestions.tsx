import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Calendar, Target, Loader2, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ExtractedPrediction {
  question: string;
  description: string;
  category: 'crypto' | 'defi' | 'bounty' | 'realworld' | 'community';
  deadline: string;
  resolutionSource: string;
  rationale: string;
  confidence: number;
  tags: string[];
}

interface MarketSuggestionsProps {
  summaryId: string;
  onCreateMarket?: (prediction: ExtractedPrediction) => void;
}

export function MarketSuggestions({ summaryId, onCreateMarket }: MarketSuggestionsProps) {
  const { toast } = useToast();
  const [extracting, setExtracting] = useState(false);
  const [predictions, setPredictions] = useState<ExtractedPrediction[]>([]);
  const [summaryInsights, setSummaryInsights] = useState('');

  const handleExtractPredictions = async () => {
    setExtracting(true);
    try {
      const response = await fetch(`/api/summaries/${summaryId}/extract-predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to extract predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions);
      setSummaryInsights(data.summaryInsights);

      toast({
        title: "Predictions extracted!",
        description: `Found ${data.totalFound} verifiable prediction${data.totalFound !== 1 ? 's' : ''} in this content.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to extract predictions",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setExtracting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      defi: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      bounty: 'bg-green-500/20 text-green-400 border-green-500/30',
      realworld: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      community: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[category] || colors.community;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { color: 'bg-green-500/20 text-green-400', label: 'High Confidence' };
    if (confidence >= 60) return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Medium Confidence' };
    return { color: 'bg-red-500/20 text-red-400', label: 'Low Confidence' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI-Powered Market Suggestions
          </h3>
          <p className="text-sm text-muted-foreground">
            Extract verifiable predictions from this content and turn them into prediction markets
          </p>
        </div>
        <Button
          onClick={handleExtractPredictions}
          disabled={extracting || predictions.length > 0}
          className="gap-2"
          data-testid="button-extract-predictions"
        >
          {extracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              Extract Predictions
            </>
          )}
        </Button>
      </div>

      {summaryInsights && (
        <Alert className="bg-purple-500/10 border-purple-500/30">
          <Lightbulb className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-purple-300">
            {summaryInsights}
          </AlertDescription>
        </Alert>
      )}

      {predictions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {predictions.map((prediction, index) => {
            const confidenceBadge = getConfidenceBadge(prediction.confidence);
            const deadlineDate = new Date(prediction.deadline);

            return (
              <Card 
                key={index} 
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all"
                data-testid={`card-prediction-${index}`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={getCategoryColor(prediction.category)}>
                      {prediction.category}
                    </Badge>
                    <Badge className={confidenceBadge.color}>
                      {prediction.confidence}%
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {prediction.question}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {prediction.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>Source: {prediction.resolutionSource}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {prediction.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      {prediction.rationale}
                    </p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => onCreateMarket?.(prediction)}
                    className="w-full gap-2"
                    data-testid={`button-create-market-${index}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Create Market
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {predictions.length === 0 && !extracting && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Click "Extract Predictions" to analyze this content for potential prediction markets</p>
        </div>
      )}
    </div>
  );
}
