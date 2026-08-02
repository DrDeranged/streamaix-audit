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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

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

// Design-system confidence color mapping
function confidenceClasses(conf: number): { bar: string; text: string } {
  if (conf >= 80) return { bar: "bg-gain", text: "text-gain" };
  if (conf >= 70) return { bar: "bg-accent-core", text: "text-accent-bright" };
  return { bar: "bg-warn", text: "text-warn" };
}

function stanceBadge(prediction: string) {
  if (prediction === "YES") return "bg-gain/10 text-gain border-gain/30";
  if (prediction === "NO") return "bg-loss/10 text-loss border-loss/30";
  return "bg-warn/10 text-warn border-warn/30";
}

function TrackRecordLine({ agentId }: { agentId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; trackRecord: TrackRecord }>({
    queryKey: ["/api/agents", agentId, "track-record"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className="h-4 w-40 bg-ink-raised" />;
  }

  const tr = data?.trackRecord;
  if (!tr || tr.decisions.length === 0) {
    return <span className="text-xs text-muted">No trading history yet</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary" data-testid={`track-record-${agentId}`}>
      <History className="w-3 h-3 text-accent-bright" />
      <span>
        Last {tr.decisions.length}: <span className="text-gain">{tr.wins}W</span>
        {" / "}
        <span className="text-loss">{tr.losses}L</span>
      </span>
      {tr.winRate != null && (
        <span>
          Win rate <span className="text-primary font-semibold tabular">{Math.round(tr.winRate * 100)}%</span>
        </span>
      )}
      <span className={tr.netPnl >= 0 ? "text-gain" : "text-loss"}>
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
      <Surface className="p-4 transition-colors hover:border-accent-core/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-accent-core/10 border border-accent-core/30 flex items-center justify-center text-lg flex-shrink-0">
                {pred.agent?.avatar || <Bot className="w-4 h-4 text-accent-bright" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-primary text-sm truncate">{pred.agent?.name || "AI Agent"}</div>
                <div className="text-xs text-secondary capitalize truncate">{pred.agent?.personality || "unknown"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLegacy && (
                  <Badge variant="outline" className="border-ink-edge text-muted text-[10px] px-1.5 py-0">
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
                <span className="text-secondary">Confidence</span>
                <span className={`font-semibold tabular ${colors.text}`}>{conf}%</span>
              </div>
              <div className="h-1.5 rounded-xl bg-ink-raised overflow-hidden">
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
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-accent-bright hover:text-primary py-1.5 rounded-xl bg-accent-core/10 border border-accent-core/20 hover:border-accent-core/40 transition-all"
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
              <p className="text-xs text-body leading-relaxed">{pred.reasoning}</p>

              {hasStructured && (
                <>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
                      <Lightbulb className="w-3 h-3 text-warn" /> Key evidence
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data!.keyEvidence!.map((ev, i) => (
                        <span
                          key={i}
                           className="text-[11px] px-2 py-1 rounded-xl bg-accent-core/10 border border-accent-core/25 text-accent-bright leading-tight"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {data!.riskAssessment && (
                    <div className="flex items-start gap-2 text-xs text-secondary">
                      <ShieldAlert className="w-3.5 h-3.5 text-loss mt-0.5 flex-shrink-0" />
                      <p>{data!.riskAssessment}</p>
                    </div>
                  )}

                  {data!.wouldChangeMindIf && (
                    <div className="rounded-xl border-l-2 border-warn/70 bg-warn/10 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warn mb-0.5">
                        <RefreshCcw className="w-3 h-3" /> Would change mind if
                      </div>
                      <p className="text-xs text-body">{data!.wouldChangeMindIf}</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </Surface>
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
    <Surface variant="raised" className="border border-accent-core/25 p-4 space-y-3" data-testid="agent-consensus-strip">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Scale className="w-4 h-4 text-accent-bright" /> Consensus
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {abstained > 0 && (
              <Badge variant="outline" className="border-ink-edge text-secondary text-xs">
              {abstained} agent{abstained === 1 ? "" : "s"} abstained — low information
            </Badge>
          )}
          {divergent && (
            <Badge className="bg-warn/10 text-warn border border-warn/30 text-xs">
              High divergence — top agents disagree
            </Badge>
          )}
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gain font-semibold">YES {yesShare}%</span>
            <span className="text-loss font-semibold">NO {100 - yesShare}%</span>
          </div>
          <div className="h-2 rounded-xl bg-ink-raised overflow-hidden flex">
            <div className="h-full bg-gain" style={{ width: `${yesShare}%` }} />
            <div className="h-full bg-loss" style={{ width: `${100 - yesShare}%` }} />
          </div>
          <p className="text-[11px] text-secondary">Weighted by each agent's confidence.</p>
        </>
      ) : (
        <p className="text-xs text-secondary">No active stances — all agents abstained on this market.</p>
      )}
    </Surface>
  );
}

export function AgentAnalysis({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; predictions: AgentPrediction[] }>({
    queryKey: ["/api/ai-agents/predictions", marketId],
  });

  const predictions = data?.predictions || [];

  if (isLoading) {
    return (
      <Surface className="p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-accent-core/10" />
          ))}
      </Surface>
    );
  }

  if (predictions.length === 0) {
    return (
      <Surface className="p-8 text-center">
        <Brain className="w-12 h-12 mx-auto mb-3 text-accent-bright opacity-50" />
        <p className="text-secondary">No agent analysis yet for this market.</p>
        <p className="text-muted text-sm mt-1">Agents research and analyze markets on a rolling cycle.</p>
      </Surface>
    );
  }

  return (
    <Surface className="p-4 sm:p-6" data-testid="agent-analysis-section">
      <div className="pb-3">
        <div className="text-primary flex items-center gap-2 text-lg font-semibold">
          <Brain className="w-5 h-5 text-accent-bright" />
          <SectionTitle as="h3">Agent Analysis</SectionTitle>
          <Badge variant="outline" className="ml-auto border-accent-core/30 text-accent-bright">
            {predictions.length} agents
          </Badge>
        </div>
      </div>
      <div className="space-y-4">
        <ConsensusStrip predictions={predictions} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {predictions.map((pred, i) => (
            <AgentAnalysisCard key={pred.id} pred={pred} index={i} />
          ))}
        </div>
      </div>
    </Surface>
  );
}
