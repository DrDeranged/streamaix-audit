import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AIPrediction {
  id: string;
  agentId: string;
  agentName: string;
  agentPersonality: string;
  prediction: "YES" | "NO";
  confidence: number;
  reasoning: string;
  createdAt: string;
}

interface AIConsensusCardProps {
  marketId: string;
  compact?: boolean;
}

const personalityIcons: Record<string, string> = {
  conservative: "🛡️",
  aggressive: "⚡",
  quantitative: "📊",
  contrarian: "🔄",
};

export function AIConsensusCard({ marketId, compact = false }: AIConsensusCardProps) {
  const { data, isLoading } = useQuery<{ predictions: AIPrediction[] }>({
    queryKey: [`/api/ai-agents/predictions/${marketId}`],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const predictions = data?.predictions || [];

  if (isLoading || predictions.length === 0) {
    return null;
  }

  // Calculate consensus
  const yesVotes = predictions.filter(p => p.prediction === "YES").length;
  const noVotes = predictions.filter(p => p.prediction === "NO").length;
  const totalVotes = yesVotes + noVotes;
  
  const consensus = yesVotes > noVotes ? "YES" : noVotes > yesVotes ? "NO" : "SPLIT";
  const consensusStrength = Math.max(yesVotes, noVotes) / totalVotes;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  // Get strongest prediction
  const strongestPrediction = predictions.reduce((max, p) => 
    p.confidence > max.confidence ? p : max, predictions[0]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
        <div className="flex -space-x-2">
          {predictions.slice(0, 4).map((pred) => (
            <div 
              key={pred.id}
              className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs"
              title={`${pred.agentName}: ${pred.prediction} (${pred.confidence}%)`}
            >
              {personalityIcons[pred.agentPersonality] || "🤖"}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">AI Consensus:</span>
            <Badge 
              variant="outline" 
              className={`text-xs font-bold ${
                consensus === "YES" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : consensus === "NO"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}
            >
              {consensus === "SPLIT" ? "MIXED" : consensus}
            </Badge>
            <span className="text-xs text-slate-400">
              {Math.round(avgConfidence)}% avg
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* AI Consensus Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/15 to-cyan-500/15 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <div>
            <div className="text-sm font-semibold text-white">AI Agent Consensus</div>
            <div className="text-xs text-slate-400">{predictions.length} agents analyzed</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            {consensus === "YES" ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : consensus === "NO" ? (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <Badge 
              variant="outline" 
              className={`font-bold ${
                consensus === "YES" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : consensus === "NO"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}
            >
              {consensus === "SPLIT" ? "SPLIT" : `${consensus} ${Math.round(consensusStrength * 100)}%`}
            </Badge>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {Math.round(avgConfidence)}% avg confidence
          </div>
        </div>
      </div>

      {/* Vote Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-2 rounded border ${yesVotes > noVotes ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
          <div className="text-xs text-emerald-400 font-semibold">YES</div>
          <div className="text-lg font-bold text-emerald-300">{yesVotes}</div>
          <div className="text-xs text-slate-400">agents</div>
        </div>
        <div className={`p-2 rounded border ${noVotes > yesVotes ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
          <div className="text-xs text-rose-400 font-semibold">NO</div>
          <div className="text-lg font-bold text-rose-300">{noVotes}</div>
          <div className="text-xs text-slate-400">agents</div>
        </div>
      </div>

      {/* Strongest Prediction Highlight */}
      <div className="p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="flex items-start gap-2">
          <div className="text-xl">{personalityIcons[strongestPrediction.agentPersonality] || "🤖"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{strongestPrediction.agentName}</span>
              <Badge variant="outline" className="text-xs">
                {strongestPrediction.agentPersonality}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`font-bold ${
                  strongestPrediction.prediction === "YES"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                }`}
              >
                {strongestPrediction.prediction}
              </Badge>
              <span className="text-xs text-cyan-400 font-semibold">
                {strongestPrediction.confidence}% confident
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {strongestPrediction.reasoning}
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          asChild
          variant="outline"
          className={`border-2 ${
            consensus === "YES"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-slate-800/50 border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          <Link href={`/markets/${marketId}`}>
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Trade YES
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className={`border-2 ${
            consensus === "NO"
              ? "bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20"
              : "bg-slate-800/50 border-slate-600/40 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          <Link href={`/markets/${marketId}`}>
            <TrendingDown className="w-4 h-4 mr-1.5" />
            Trade NO
          </Link>
        </Button>
      </div>
    </div>
  );
}
