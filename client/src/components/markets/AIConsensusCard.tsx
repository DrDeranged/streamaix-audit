import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
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
  conservative: "from-blue-500/20 to-blue-600/20 border-blue-500/40",
  aggressive: "from-red-500/20 to-orange-600/20 border-red-500/40",
  quantitative: "from-cyan-500/20 to-blue-600/20 border-cyan-500/40",
  contrarian: "from-purple-500/20 to-pink-600/20 border-purple-500/40",
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
      <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-xl border border-purple-500/30 backdrop-blur-sm">
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
              <Sparkles className="w-4 h-4 text-purple-400" />
            </motion.div>
            <span className="text-xs font-semibold text-purple-300">AI Consensus:</span>
            <Badge 
              variant="outline" 
              className={`text-xs font-bold ${
                consensus === "YES" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20" 
                  : consensus === "NO"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20"
              }`}
            >
              {consensus === "SPLIT" ? "MIXED" : consensus}
            </Badge>
            <span className="text-xs font-semibold text-cyan-400">
              {Math.round(avgConfidence)}% avg
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 neural-glass rounded-xl iridescent-border">
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
            <Brain className="w-6 h-6 text-purple-400" />
          </motion.div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              AI Agent Consensus
              <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30">
                {predictions.length} agents
              </Badge>
            </div>
            <div className="text-xs text-slate-400">Live predictions updated every 30s</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            {consensus === "YES" ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : consensus === "NO" ? (
              <TrendingDown className="w-5 h-5 text-rose-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400" />
            )}
            <Badge 
              variant="outline" 
              className={`font-bold text-sm ${
                consensus === "YES" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/30" 
                  : consensus === "NO"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/30"
              }`}
            >
              {consensus === "SPLIT" ? "SPLIT" : `${consensus} ${Math.round(consensusStrength * 100)}%`}
            </Badge>
          </div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">
            {Math.round(avgConfidence)}% avg confidence
          </div>
        </div>
      </div>

      <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(yesVotes / totalVotes) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          style={{
            boxShadow: yesVotes > 0 ? "0 0 20px hsla(160, 84%, 39%, 0.5)" : "none"
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(noVotes / totalVotes) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-500 to-rose-400"
          style={{
            boxShadow: noVotes > 0 ? "0 0 20px hsla(0, 84%, 60%, 0.5)" : "none"
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold">
          <span className="text-emerald-200 drop-shadow-lg">{yesVotes} YES</span>
          <span className="text-rose-200 drop-shadow-lg">{noVotes} NO</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {predictions.map((pred, index) => (
          <motion.div
            key={pred.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`relative p-3 rounded-xl bg-gradient-to-br ${
              personalityColors[pred.agentPersonality] || "from-slate-500/20 to-slate-600/20 border-slate-500/40"
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
                <div className="text-[10px] font-semibold text-slate-300 truncate">
                  {pred.agentName.split(" ")[0]}
                </div>
                <Badge 
                  variant="outline"
                  className={`mt-1 text-[10px] font-bold ${
                    pred.prediction === "YES"
                      ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
                      : "bg-rose-500/30 text-rose-300 border-rose-500/50"
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
        className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-slate-700/50 backdrop-blur-sm"
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="text-3xl">{personalityIcons[strongestPrediction.agentPersonality] || "🤖"}</div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-white">{strongestPrediction.agentName}</span>
              <Badge variant="outline" className="text-[10px] bg-slate-700/50 border-slate-600">
                {strongestPrediction.agentPersonality}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-purple-500/20 border-purple-500/30 text-purple-300">
                Strongest
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`font-bold ${
                  strongestPrediction.prediction === "YES"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                }`}
              >
                {strongestPrediction.prediction}
              </Badge>
              <span className="text-xs font-bold text-cyan-400">
                {strongestPrediction.confidence}% confident
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
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
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20"
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
          className={`border-2 transition-all duration-300 card-3d-hover ${
            consensus === "NO"
              ? "bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30 shadow-lg shadow-rose-500/20"
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
