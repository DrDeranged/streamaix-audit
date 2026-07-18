import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Brain,
  Bot,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RefreshCcw,
  ShieldAlert,
  Scale,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisData {
  keyEvidence?: string[];
  wouldChangeMindIf?: string;
  riskAssessment?: string;
  [key: string]: unknown;
}

interface AgentPrediction {
  id: string;
  prediction: "YES" | "NO" | "ABSTAIN";
  confidence: number; // may be 0-1 or 0-100 depending on era
  reasoning: string;
  analysisData: AnalysisData | null;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    personality: string;
    avatar: string | null;
  } | null;
}

interface TrackRecord {
  wins: number;
  losses: number;
  open: number;
  netPnl: number;
  winRate: number | null;
  decisions: Array<{ id: string; decision: string; outcome: string; pnl: number | null }>;
}

// Normalize confidence to 0-100 regardless of stored scale
function pct(confidence: number): number {
  return Math.round(confidence <= 1 ? confidence * 100 : confidence);
}

// Amber/Cyan/Emerald confidence color system (matches ConfidenceRing)
function confidenceClasses(conf: number): { bar: string; text: string } {
  if (conf >= 80) return { bar: "bg-emerald-400", text: "text-emerald-300" };
  if (conf >= 70) return { bar: "bg-cyan-400", text: "text-cyan-300" };
  return { bar: "bg-amber-400", text: "text-amber-300" };
}

function stanceBadge(prediction: string) {
  if (prediction === "YES") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (prediction === "NO") return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  return "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

function TrackRecordLine({ agentId }: { agentId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; trackRecord: TrackRecord }>({
    queryKey: ["/api/agents", agentId, "track-record"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className="h-4 w-40 bg-slate-700/50" />;
  }

  const tr = data?.trackRecord;
  if (!tr || tr.decisions.length === 0) {
    return <span className="text-xs text-slate-500">No trading history yet</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400" data-testid={`track-record-${agentId}`}>
      <History className="w-3 h-3 text-purple-400" />
      <span>
        Last {tr.decisions.length}: <span className="text-emerald-300">{tr.wins}W</span>
        {" / "}
        <span className="text-rose-300">{tr.losses}L</span>
      </span>
      {tr.winRate != null && (
        <span>
          Win rate <span className="text-white font-semibold">{Math.round(tr.winRate * 100)}%</span>
        </span>
      )}
      <span className={tr.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}>
        {tr.netPnl >= 0 ? "+" : ""}
        {tr.netPnl.toLocaleString()} pts
      </span>
    </div>
  );
}

function AgentAnalysisCard({ pred, index }: { pred: AgentPrediction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const conf = pct(pred.confidence);
  const colors = confidenceClasses(conf);
  const data = pred.analysisData || null;
  const hasStructured = !!data && Array.isArray(data.keyEvidence) && data.keyEvidence.length > 0;
  const isLegacy = !hasStructured;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
    >
      <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-lg flex-shrink-0">
                {pred.agent?.avatar || <Bot className="w-4 h-4 text-purple-300" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm truncate">{pred.agent?.name || "AI Agent"}</div>
                <div className="text-xs text-slate-400 capitalize truncate">{pred.agent?.personality || "unknown"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLegacy && (
                <Badge variant="outline" className="border-slate-600/50 text-slate-500 text-[10px] px-1.5 py-0">
                  legacy analysis
                </Badge>
              )}
              <Badge className={`${stanceBadge(pred.prediction)} border font-bold`}>{pred.prediction}</Badge>
            </div>
          </div>

          {/* Confidence bar */}
          {pred.prediction !== "ABSTAIN" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Confidence</span>
                <span className={`font-semibold ${colors.text}`}>{conf}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${conf}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {pred.agent?.id && (
            <div className="mt-3">
              <TrackRecordLine agentId={pred.agent.id} />
            </div>
          )}

          {/* Expand toggle — collapsed by default (mobile-first) */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-purple-300 hover:text-purple-200 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/40 transition-all"
            data-testid={`toggle-analysis-${pred.id}`}
          >
            {expanded ? (
              <>
                Hide reasoning <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show reasoning <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">{pred.reasoning}</p>

              {hasStructured && (
                <>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-400" /> Key evidence
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data!.keyEvidence!.map((ev, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-200 leading-tight"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {data!.riskAssessment && (
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <p>{data!.riskAssessment}</p>
                    </div>
                  )}

                  {data!.wouldChangeMindIf && (
                    <div className="rounded-lg border-l-2 border-amber-400/70 bg-amber-500/10 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-0.5">
                        <RefreshCcw className="w-3 h-3" /> Would change mind if
                      </div>
                      <p className="text-xs text-amber-100/90">{data!.wouldChangeMindIf}</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConsensusStrip({ predictions }: { predictions: AgentPrediction[] }) {
  const active = predictions.filter((p) => p.prediction === "YES" || p.prediction === "NO");
  const abstained = predictions.length - active.length;

  const weight = (p: AgentPrediction) => pct(p.confidence);
  const yesWeight = active.filter((p) => p.prediction === "YES").reduce((s, p) => s + weight(p), 0);
  const noWeight = active.filter((p) => p.prediction === "NO").reduce((s, p) => s + weight(p), 0);
  const total = yesWeight + noWeight;
  const yesShare = total > 0 ? Math.round((yesWeight / total) * 100) : 50;

  // Divergence: top-3 confident agents split across YES and NO with high confidence
  const top = [...active].sort((a, b) => pct(b.confidence) - pct(a.confidence)).slice(0, 3);
  const divergent =
    top.some((p) => p.prediction === "YES" && pct(p.confidence) >= 70) &&
    top.some((p) => p.prediction === "NO" && pct(p.confidence) >= 70);

  return (
    <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 backdrop-blur-sm p-4 space-y-3" data-testid="agent-consensus-strip">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Scale className="w-4 h-4 text-purple-300" /> Consensus
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {abstained > 0 && (
            <Badge variant="outline" className="border-slate-600/50 text-slate-400 text-xs">
              {abstained} agent{abstained === 1 ? "" : "s"} abstained — low information
            </Badge>
          )}
          {divergent && (
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
              High divergence — top agents disagree
            </Badge>
          )}
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-semibold">YES {yesShare}%</span>
            <span className="text-rose-300 font-semibold">NO {100 - yesShare}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-emerald-400/80" style={{ width: `${yesShare}%` }} />
            <div className="h-full bg-rose-400/80" style={{ width: `${100 - yesShare}%` }} />
          </div>
          <p className="text-[11px] text-slate-400">Weighted by each agent's confidence.</p>
        </>
      ) : (
        <p className="text-xs text-slate-400">No active stances — all agents abstained on this market.</p>
      )}
    </div>
  );
}

export function AgentAnalysis({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; predictions: AgentPrediction[] }>({
    queryKey: ["/api/ai-agents/predictions", marketId],
  });

  const predictions = data?.predictions || [];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/10 border-purple-500/30">
        <CardContent className="p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-purple-500/10" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/10 border-purple-500/30">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
          <p className="text-slate-400">No agent analysis yet for this market.</p>
          <p className="text-slate-500 text-sm mt-1">Agents research and analyze markets on a rolling cycle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/10 border-purple-500/30 backdrop-blur-sm" data-testid="agent-analysis-section">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-purple-400" />
          Agent Analysis
          <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-300">
            {predictions.length} agents
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConsensusStrip predictions={predictions} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {predictions.map((pred, i) => (
            <AgentAnalysisCard key={pred.id} pred={pred} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
