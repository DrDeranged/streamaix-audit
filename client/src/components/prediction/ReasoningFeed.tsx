import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bot, Brain, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

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
  if (conf >= 80) return "text-gain";
  if (conf >= 70) return "text-accent-bright";
  return "text-warn";
}

function stanceBadge(prediction: string) {
  if (prediction === "YES") return "bg-gain/10 text-gain border-gain/30";
  if (prediction === "NO") return "bg-loss/10 text-loss border-loss/30";
  return "bg-warn/10 text-warn border-warn/30";
}

export function ReasoningFeed() {
  const { data, isLoading } = useQuery<{ success: boolean; decisions: RecentDecision[] }>({
    queryKey: ["/api/agents/recent-decisions"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const decisions = data?.decisions || [];

  return (
    <Surface className="overflow-hidden" data-testid="reasoning-feed">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
          <Brain className="h-5 w-5 text-accent-bright" />
          <SectionTitle as="h3">Reasoning Feed</SectionTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gain/30 bg-gain/10 px-2 py-0.5 text-[10px] text-gain font-medium">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" /> LIVE
          </span>
          <Badge variant="outline" className="ml-auto border-accent-core/30 bg-accent-core/10 text-accent-bright text-xs">
            Last {decisions.length || 20} decisions
          </Badge>
      </div>
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-ink-raised" />
            ))}
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="mx-auto mb-2 h-10 w-10 text-accent-bright opacity-50" />
            <p className="text-secondary text-sm">No agent decisions yet.</p>
            <p className="mt-1 text-xs text-muted">Agents analyze markets on a rolling cycle.</p>
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
                  className="flex items-start gap-3 rounded-xl border border-ink-divider bg-ink-raised p-3 transition-colors hover:border-accent-core/50"
                  data-testid={`reasoning-feed-item-${d.id}`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-accent-core/30 bg-accent-core/10 text-base">
                    {d.agent.avatar || <Bot className="h-4 w-4 text-accent-bright" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-primary">{d.agent.name || "AI Agent"}</span>
                      <Badge className={`${stanceBadge(d.prediction)} border text-[10px] px-1.5 py-0 font-bold`}>
                        {d.prediction}
                      </Badge>
                      {d.prediction !== "ABSTAIN" && (
                        <span className={`text-xs font-semibold ${confidenceText(conf)}`}>{conf}%</span>
                      )}
                      <span className="ml-auto flex-shrink-0 text-[11px] text-muted tabular">
                        {d.createdAt ? formatDistanceToNow(new Date(d.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-secondary">{d.reasoning}</p>
                    {d.market.id && (
                      <Link href={`/markets/${d.market.id}`}>
                        <span className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[11px] text-accent-bright hover:text-primary">
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
      </div>
    </Surface>
  );
}
