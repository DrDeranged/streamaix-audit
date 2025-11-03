import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Sparkles, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <Card className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 border-violet-500/30 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-violet-500/20 rounded w-1/3" />
          <div className="h-8 bg-violet-500/20 rounded" />
          <div className="h-8 bg-violet-500/20 rounded" />
        </div>
      </Card>
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
              className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 cursor-help"
              data-testid="ai-predictions-compact"
            >
              <Brain className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">
                {predictions.length} AI Agents Predict:
              </span>
              <span className={`text-sm font-bold ${consensus === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                {consensus} {avgConfidence}%
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 border-violet-500/30 p-4 max-w-sm">
            <p className="text-sm text-slate-300 mb-2">
              {consensusPercentage}% consensus ({yesPredictions.length} YES, {noPredictions.length} NO)
            </p>
            <div className="space-y-1">
              {predictions.slice(0, 3).map(pred => (
                <div key={pred.id} className="text-xs text-slate-400">
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
    <Card className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 border-violet-500/30 overflow-hidden backdrop-blur-sm" data-testid="ai-predictions-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">AI Agent Predictions</h3>
          </div>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
            {predictions.length} Agents
          </Badge>
        </div>

        {/* Consensus Overview */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div>
            <div className="text-sm text-violet-300 mb-1">AI Consensus</div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${consensus === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                {consensus}
              </span>
              <span className="text-lg text-slate-400">
                ({consensusPercentage}% agreement)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-violet-300 mb-1">Avg. Confidence</div>
            <div className="text-2xl font-bold text-violet-400">{avgConfidence}%</div>
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
              <Card className="bg-slate-900/50 border-slate-700/50 p-4 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pred.agent.avatar}</span>
                    <div>
                      <div className="font-semibold text-white">{pred.agent.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{pred.agent.personality}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        pred.prediction === "YES"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {pred.prediction === "YES" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {pred.prediction}
                    </Badge>
                    <span className="text-sm font-bold text-violet-400">
                      {Math.round(pred.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-2 text-sm text-slate-400 cursor-help">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-400" />
                        <p className="line-clamp-2">{pred.reasoning}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-violet-500/30 max-w-md p-4">
                      <p className="text-sm text-slate-300">{pred.reasoning}</p>
                      <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                        <span>Accuracy: {Math.round(pred.agent.accuracyRate * 100)}%</span>
                        <span>{pred.agent.totalPredictions} predictions</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Agent Stats */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>
                      Accuracy: <span className="text-violet-400 font-semibold">{Math.round(pred.agent.accuracyRate * 100)}%</span>
                    </span>
                    <span>
                      {pred.agent.totalPredictions} predictions
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trade Against AI Hint */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-500/20">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <p className="text-xs text-slate-400">
            Think the AI is wrong? Trade against their predictions and prove your market insight!
          </p>
        </div>
      </div>
    </Card>
  );
}
