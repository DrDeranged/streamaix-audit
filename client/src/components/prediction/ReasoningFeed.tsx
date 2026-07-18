import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bot, Brain, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentDecision {
  id: string;
  prediction: "YES" | "NO" | "ABSTAIN";
  confidence: number;
  reasoning: string;
  createdAt: string;
  agent: { id: string | null; name: string | null; avatar: string | null; personality: string | null };
  market: { id: string | null; question: string | null };
}

function pct(confidence: number): number {
  return Math.round(confidence <= 1 ? confidence * 100 : confidence);
}

function confidenceText(conf: number): string {
  if (conf >= 80) return "text-emerald-300";
  if (conf >= 70) return "text-cyan-300";
  return "text-amber-300";
}

function stanceBadge(prediction: string) {
  if (prediction === "YES") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (prediction === "NO") return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  return "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

export function ReasoningFeed() {
  const { data, isLoading } = useQuery<{ success: boolean; decisions: RecentDecision[] }>({
    queryKey: ["/api/agents/recent-decisions"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const decisions = data?.decisions || [];

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50" data-testid="reasoning-feed">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-purple-400" />
          Reasoning Feed
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
          </span>
          <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-300 text-xs">
            Last {decisions.length || 20} decisions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 bg-slate-700/30" />
            ))}
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 mx-auto mb-2 text-purple-400 opacity-50" />
            <p className="text-slate-400 text-sm">No agent decisions yet.</p>
            <p className="text-slate-500 text-xs mt-1">Agents analyze markets on a rolling cycle.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {decisions.map((d, i) => {
              const conf = pct(d.confidence);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 hover:border-purple-500/30 transition-colors"
                  data-testid={`reasoning-feed-item-${d.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-base flex-shrink-0">
                    {d.agent.avatar || <Bot className="w-4 h-4 text-purple-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{d.agent.name || "AI Agent"}</span>
                      <Badge className={`${stanceBadge(d.prediction)} border text-[10px] px-1.5 py-0 font-bold`}>
                        {d.prediction}
                      </Badge>
                      {d.prediction !== "ABSTAIN" && (
                        <span className={`text-xs font-semibold ${confidenceText(conf)}`}>{conf}%</span>
                      )}
                      <span className="text-[11px] text-slate-500 ml-auto flex-shrink-0">
                        {d.createdAt ? formatDistanceToNow(new Date(d.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{d.reasoning}</p>
                    {d.market.id && (
                      <Link href={`/markets/${d.market.id}`}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 mt-1 cursor-pointer">
                          <ExternalLink className="w-3 h-3" />
                          <span className="line-clamp-1">{d.market.question || "View market"}</span>
                        </span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
