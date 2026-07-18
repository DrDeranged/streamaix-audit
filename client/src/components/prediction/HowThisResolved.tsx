import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Bot, ShieldCheck, FileText, Clock } from "lucide-react";

interface EvidenceItem {
  source: string;
  fetchedAt: string;
  claim: string;
  rawValue: unknown;
}

interface ResolutionAudit {
  resolution: string;
  confidence: number | null;
  reasoning: string | null;
  resolvedBy: string;
  autoResolved: boolean;
  createdAt: string | null;
  evidence: EvidenceItem[];
  citedEvidence: number[];
}

export function HowThisResolved({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; audit: ResolutionAudit | null }>({
    queryKey: ["/api/prediction-markets", marketId, "resolution-audit"],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 animate-pulse">
        <CardContent className="py-8" />
      </Card>
    );
  }

  const audit = data?.audit;
  if (!audit) return null;

  const outcome = audit.resolution.toUpperCase();
  const isYes = outcome === "YES";
  const isNo = outcome === "NO";
  const OutcomeIcon = isYes ? CheckCircle2 : isNo ? XCircle : AlertTriangle;
  const outcomeColor = isYes
    ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : isNo
      ? "text-red-400 bg-red-500/15 border-red-500/30"
      : "text-amber-400 bg-amber-500/15 border-amber-500/30";

  const resolverLabel = audit.resolvedBy === "ai"
    ? "AI evidence pipeline"
    : audit.resolvedBy.startsWith("admin:")
      ? `Admin (${audit.resolvedBy.slice(6)})`
      : audit.resolvedBy;
  const ResolverIcon = audit.resolvedBy === "ai" ? Bot : ShieldCheck;

  const cited = new Set(audit.citedEvidence);
  const citedItems = audit.evidence.filter((_, i) => cited.has(i));
  const shownEvidence = citedItems.length > 0 ? citedItems : audit.evidence.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30" data-testid="card-how-resolved">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          How this resolved
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={`border ${outcomeColor} flex items-center gap-1.5 px-3 py-1 text-sm`} data-testid="badge-resolution-outcome">
            <OutcomeIcon className="w-4 h-4" />
            {outcome}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-slate-300">
            <ResolverIcon className="w-4 h-4 text-cyan-400" />
            <span data-testid="text-resolved-by">
              {audit.autoResolved ? "Auto-resolved by " : "Resolved by "}
              {resolverLabel}
            </span>
          </div>
          {typeof audit.confidence === "number" && (
            <Badge variant="outline" className="text-purple-300 border-purple-500/40" data-testid="badge-resolution-confidence">
              {(audit.confidence * 100).toFixed(0)}% confidence
            </Badge>
          )}
          {audit.createdAt && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {new Date(audit.createdAt).toLocaleString()}
            </span>
          )}
        </div>

        {audit.reasoning && (
          <p className="text-sm text-slate-300 leading-relaxed" data-testid="text-resolution-reasoning">
            {audit.reasoning}
          </p>
        )}

        {shownEvidence.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium">
              {citedItems.length > 0 ? "Cited evidence" : "Gathered evidence"}
            </div>
            {shownEvidence.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/40 border border-purple-500/20"
                data-testid={`evidence-item-${idx}`}
              >
                <div className="text-sm text-slate-200">{item.claim}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>fetched {new Date(item.fetchedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
