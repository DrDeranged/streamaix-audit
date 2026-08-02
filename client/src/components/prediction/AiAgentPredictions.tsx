import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Sparkles, Info, Snowflake } from "lucide-react";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiAgent {
  id: string;
  name: string;
  personality: string;
  avatar: string;
  accuracyRate: number;
  totalPredictions: number;
  suspendedUntil?: string | null;
}

interface AiPrediction {
  id: string;
  prediction: "YES" | "NO";
  confidence: number;
  reasoning: string;
  agent: AiAgent;
  createdAt: string;
}

interface AiAgentPredictionsProps {
  marketId: string;
  compact?: boolean;
}

export function AiAgentPredictions({ marketId, compact = false }: AiAgentPredictionsProps) {
  const { data, isLoading } = useQuery<{ predictions: AiPrediction[] }>({
    queryKey: ["/api/ai-agents/predictions", marketId],
  });

  const predictions = data?.predictions || [];

  if (isLoading) {
    return compact ? null : (
      <Surface className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-accent-core/20 rounded-xl w-1/3" />
          <div className="h-8 bg-accent-core/20 rounded-xl" />
          <div className="h-8 bg-accent-core/20 rounded-xl" />
        </div>
      </Surface>
    );
  }

  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Calculate consensus
  const yesPredictions = predictions.filter(p => p.prediction === "YES");
  const noPredictions = predictions.filter(p => p.prediction === "NO");
  const consensus = yesPredictions.length > noPredictions.length ? "YES" : "NO";
  const consensusPercentage = Math.round((Math.max(yesPredictions.length, noPredictions.length) / predictions.length) * 100);
  
  // Average confidence
  const avgConfidence = Math.round(predictions.reduce((sum, p) => sum + p.confidence * 100, 0) / predictions.length);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 p-2 rounded-xl bg-accent-core/10 border border-accent-core/30 cursor-help"
              data-testid="ai-predictions-compact"
            >
              <Brain className="w-4 h-4 text-accent-bright" />
              <span className="text-xs font-medium text-accent-bright">
                {predictions.length} AI Agents Predict:
              </span>
              <span className={`text-sm font-bold ${consensus === 'YES' ? 'text-gain' : 'text-loss'}`}>
                {consensus} {avgConfidence}%
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-ink-surface border-accent-core/30 p-4 max-w-sm">
            <p className="text-sm text-body mb-2">
              {consensusPercentage}% consensus ({yesPredictions.length} YES, {noPredictions.length} NO)
            </p>
            <div className="space-y-1">
              {predictions.slice(0, 3).map(pred => (
                <div key={pred.id} className="text-xs text-secondary">
                  {pred.agent.avatar} {pred.agent.name}: {pred.prediction} ({Math.round(pred.confidence * 100)}%)
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Surface className="overflow-hidden" data-testid="ai-predictions-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-bright" />
            <SectionTitle as="h3">AI Agent Predictions</SectionTitle>
          </div>
          <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30">
            {predictions.length} Agents
          </Badge>
        </div>

        {/* Consensus Overview */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent-core/10 border border-accent-core/20">
          <div>
            <div className="text-sm text-accent-bright mb-1">AI Consensus</div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${consensus === 'YES' ? 'text-gain' : 'text-loss'}`}>
                {consensus}
              </span>
              <span className="text-lg text-secondary">
                ({consensusPercentage}% agreement)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-accent-bright mb-1">Avg. Confidence</div>
            <div className="tabular text-2xl font-bold text-accent-bright">{avgConfidence}%</div>
          </div>
        </div>

        {/* Individual Agent Predictions */}
        <div className="space-y-3">
          {predictions.map((pred, index) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`ai-prediction-${pred.agent.name.toLowerCase()}`}
            >
              <Surface variant="raised" className="border border-ink-edge p-4 hover:border-accent-core/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pred.agent.avatar}</span>
                    <div>
                       <div className="font-semibold text-primary flex items-center gap-2">
                        {pred.agent.name}
                        {pred.agent.suspendedUntil && (
                          <Badge
                             className="bg-warn/20 text-warn border-warn/30 border text-[10px] px-1.5 py-0 rounded-xl"
                            data-testid={`badge-cooling-off-${pred.agent.id}`}
                          >
                            <Snowflake className="w-3 h-3 mr-1" />
                            Cooling off
                          </Badge>
                        )}
                      </div>
                       <div className="text-xs text-secondary capitalize">{pred.agent.personality}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        pred.prediction === "YES"
                           ? "bg-gain/20 text-gain border-gain/30"
                           : "bg-loss/20 text-loss border-loss/30"
                      }
                    >
                      {pred.prediction === "YES" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {pred.prediction}
                    </Badge>
                     <span className="tabular text-sm font-bold text-accent-bright">
                      {Math.round(pred.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-2 text-sm text-secondary cursor-help">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent-bright" />
                        <p className="line-clamp-2">{pred.reasoning}</p>
                      </div>
                    </TooltipTrigger>
                     <TooltipContent className="bg-ink-surface border-accent-core/30 max-w-md p-4">
                       <p className="text-sm text-body">{pred.reasoning}</p>
                       <div className="mt-2 pt-2 border-t border-ink-divider flex items-center justify-between text-xs text-secondary">
                        <span>Accuracy: {Math.round(pred.agent.accuracyRate * 100)}%</span>
                        <span>{pred.agent.totalPredictions} predictions</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Agent Stats */}
                 <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-divider">
                   <div className="flex items-center gap-4 text-xs text-secondary">
                    <span>
                       Accuracy: <span className="tabular text-accent-bright font-semibold">{Math.round(pred.agent.accuracyRate * 100)}%</span>
                    </span>
                    <span>
                      {pred.agent.totalPredictions} predictions
                    </span>
                  </div>
                </div>
              </Surface>
            </motion.div>
          ))}
        </div>

        {/* Trade Against AI Hint */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-core/5 border border-accent-core/20">
          <Sparkles className="w-4 h-4 text-accent-bright" />
          <p className="text-xs text-secondary">
            Think the AI is wrong? Trade against their predictions and prove your market insight!
          </p>
        </div>
      </div>
    </Surface>
  );
}
