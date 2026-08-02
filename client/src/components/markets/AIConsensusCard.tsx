import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
import Surface from "@/components/ds/Surface";
import { motion } from "framer-motion";

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

const personalityColors: Record<string, string> = {
  conservative: "bg-accent-core/10 border-accent-core/30",
  aggressive: "bg-loss/10 border-loss/30",
  quantitative: "bg-accent-core/10 border-accent-core/30",
  contrarian: "bg-warn/10 border-warn/30",
};

export function AIConsensusCard({ marketId, compact = false }: AIConsensusCardProps) {
  const { data, isLoading } = useQuery<{ predictions: AIPrediction[] }>({
    queryKey: [`/api/ai-agents/predictions/${marketId}`],
    refetchInterval: 30000,
  });

  const predictions = data?.predictions || [];

  if (isLoading || predictions.length === 0) {
    return null;
  }

  const yesVotes = predictions.filter(p => p.prediction === "YES").length;
  const noVotes = predictions.filter(p => p.prediction === "NO").length;
  const totalVotes = yesVotes + noVotes;
  
  const consensus = yesVotes > noVotes ? "YES" : noVotes > yesVotes ? "NO" : "SPLIT";
  const consensusStrength = Math.max(yesVotes, noVotes) / totalVotes;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  const strongestPrediction = predictions.reduce((max, p) => 
    p.confidence > max.confidence ? p : max, predictions[0]);

  if (compact) {
    return (
      <Surface variant="raised" className="flex items-center gap-3 border border-ink-edge px-4 py-3">
        <div className="flex -space-x-3">
          {predictions.slice(0, 4).map((pred, index) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative"
            >
              <ConfidenceRing 
                confidence={pred.confidence} 
                size={40} 
                strokeWidth={3}
                showPercentage={false}
              />
              <div 
                className="absolute inset-0 flex items-center justify-center text-lg"
                title={`${pred.agentName}: ${pred.prediction} (${pred.confidence}%)`}
              >
                 {personalityIcons[pred.agentPersonality] || "🤖"}
               </div>
            </motion.div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
               <Sparkles className="w-4 h-4 text-accent-bright" />
            </motion.div>
             <span className="text-xs font-semibold text-accent-bright">AI Consensus:</span>
            <Badge 
              variant="outline" 
              className={`text-xs font-bold ${
                consensus === "YES" 
                   ? "bg-gain/20 text-gain border-gain/40" 
                  : consensus === "NO"
                   ? "bg-loss/20 text-loss border-loss/40"
                   : "bg-warn/20 text-warn border-warn/40"
              }`}
            >
              {consensus === "SPLIT" ? "MIXED" : consensus}
            </Badge>
             <span className="tabular text-xs font-semibold text-accent-bright">
              {Math.round(avgConfidence)}% avg
            </span>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
       <Surface className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, repeatDelay: 5 }
            }}
          >
             <Brain className="w-6 h-6 text-accent-bright" />
          </motion.div>
          <div>
             <div className="flex items-center gap-2 text-sm font-bold text-primary">
              AI Agent Consensus
               <Badge variant="outline" className="border-accent-core/30 bg-accent-core/10 text-accent-bright">
                {predictions.length} agents
              </Badge>
            </div>
             <div className="text-xs text-secondary">Live predictions updated every 30s</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            {consensus === "YES" ? (
               <TrendingUp className="w-5 h-5 text-gain" />
            ) : consensus === "NO" ? (
               <TrendingDown className="w-5 h-5 text-loss" />
            ) : (
               <Sparkles className="w-5 h-5 text-warn" />
            )}
            <Badge 
              variant="outline" 
              className={`font-bold text-sm ${
                consensus === "YES" 
                   ? "bg-gain/20 text-gain border-gain/40" 
                  : consensus === "NO"
                   ? "bg-loss/20 text-loss border-loss/40"
                   : "bg-warn/20 text-warn border-warn/40"
              }`}
            >
              {consensus === "SPLIT" ? "SPLIT" : `${consensus} ${Math.round(consensusStrength * 100)}%`}
            </Badge>
          </div>
           <div className="tabular text-xs text-accent-bright font-semibold mt-1">
            {Math.round(avgConfidence)}% avg confidence
          </div>
        </div>
       </Surface>

       <Surface variant="raised" className="relative h-3 overflow-hidden rounded-xl border border-ink-edge p-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(yesVotes / totalVotes) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
           className="absolute left-0 top-0 h-full bg-gain"
          style={{
            boxShadow: yesVotes > 0 ? "0 0 20px hsla(160, 84%, 39%, 0.5)" : "none"
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(noVotes / totalVotes) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
           className="absolute right-0 top-0 h-full bg-loss"
          style={{
            boxShadow: noVotes > 0 ? "0 0 20px hsla(0, 84%, 60%, 0.5)" : "none"
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold">
           <span className="tabular text-primary">{yesVotes} YES</span>
           <span className="tabular text-primary">{noVotes} NO</span>
        </div>
       </Surface>

      <div className="grid grid-cols-4 gap-3">
        {predictions.map((pred, index) => (
          <motion.div
            key={pred.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
             className={`relative rounded-xl border p-3 ${
               personalityColors[pred.agentPersonality] || "bg-ink-raised border-ink-edge"
            } border backdrop-blur-sm`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ConfidenceRing 
                  confidence={pred.confidence} 
                  size={56} 
                  strokeWidth={4}
                  showPercentage={false}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {personalityIcons[pred.agentPersonality] || "🤖"}
                </div>
              </div>
              <div className="text-center w-full">
                 <div className="truncate text-[10px] font-semibold text-body">
                  {pred.agentName.split(" ")[0]}
                </div>
                <Badge 
                  variant="outline"
                  className={`mt-1 text-[10px] font-bold ${
                    pred.prediction === "YES"
                       ? "bg-gain/20 text-gain border-gain/40"
                       : "bg-loss/20 text-loss border-loss/40"
                  }`}
                >
                  {pred.prediction}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
         className="rounded-xl border border-ink-edge bg-ink-surface p-4"
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="text-3xl">{personalityIcons[strongestPrediction.agentPersonality] || "🤖"}</div>
            <motion.div
               className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-core"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
               <span className="text-sm font-bold text-primary">{strongestPrediction.agentName}</span>
               <Badge variant="outline" className="border-ink-edge bg-ink-raised text-secondary text-[10px]">
                {strongestPrediction.agentPersonality}
              </Badge>
               <Badge variant="outline" className="border-accent-core/30 bg-accent-core/10 text-accent-bright text-[10px]">
                Strongest
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`font-bold ${
                  strongestPrediction.prediction === "YES"
                     ? "bg-gain/20 text-gain border-gain/40"
                     : "bg-loss/20 text-loss border-loss/40"
                }`}
              >
                {strongestPrediction.prediction}
              </Badge>
               <span className="tabular text-xs font-bold text-accent-bright">
                {strongestPrediction.confidence}% confident
              </span>
            </div>
             <p className="text-xs text-secondary line-clamp-3 leading-relaxed">
              {strongestPrediction.reasoning}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          asChild
          variant="outline"
          className={`border-2 transition-all duration-300 card-3d-hover ${
            consensus === "YES"
               ? "bg-gain/20 border-gain/40 text-gain hover:bg-gain/30"
               : "bg-ink-surface border-ink-edge text-body hover:bg-ink-raised"
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
          className={`border-2 transition-all duration-300 card-3d-hover ${
            consensus === "NO"
               ? "bg-loss/20 border-loss/40 text-loss hover:bg-loss/30"
               : "bg-ink-surface border-ink-edge text-body hover:bg-ink-raised"
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
