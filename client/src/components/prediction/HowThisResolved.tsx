import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
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
      <Surface className="animate-pulse py-8" />
    );
  }

  const audit = data?.audit;
  if (!audit) return null;

  const outcome = audit.resolution.toUpperCase();
  const isYes = outcome === "YES";
  const isNo = outcome === "NO";
  const OutcomeIcon = isYes ? CheckCircle2 : isNo ? XCircle : AlertTriangle;
  const outcomeColor = isYes
    ? "text-gain bg-gain/10 border-gain/30"
    : isNo
      ? "text-loss bg-loss/10 border-loss/30"
      : "text-warn bg-warn/10 border-warn/30";

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
    <Surface className="p-4 sm:p-5" data-testid="card-how-resolved">
      <div className="mb-4">
        <SectionTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent-bright" />
          How this resolved
        </SectionTitle>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={`border ${outcomeColor} flex items-center gap-1.5 px-3 py-1 text-sm`} data-testid="badge-resolution-outcome">
            <OutcomeIcon className="w-4 h-4" />
            {outcome}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-body">
            <ResolverIcon className="w-4 h-4 text-accent-bright" />
            <span data-testid="text-resolved-by">
              {audit.autoResolved ? "Auto-resolved by " : "Resolved by "}
              {resolverLabel}
            </span>
          </div>
          {typeof audit.confidence === "number" && (
            <Badge variant="outline" className="border-accent-core/40 text-accent-bright" data-testid="badge-resolution-confidence">
              {(audit.confidence * 100).toFixed(0)}% confidence
            </Badge>
          )}
          {audit.createdAt && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3 h-3" />
              {new Date(audit.createdAt).toLocaleString()}
            </span>
          )}
        </div>

        {audit.reasoning && (
          <p className="text-sm leading-relaxed text-body" data-testid="text-resolution-reasoning">
            {audit.reasoning}
          </p>
        )}

        {shownEvidence.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-secondary">
              {citedItems.length > 0 ? "Cited evidence" : "Gathered evidence"}
            </div>
            {shownEvidence.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-ink-edge bg-ink-raised p-3"
                data-testid={`evidence-item-${idx}`}
              >
                <div className="text-sm text-primary">{item.claim}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>fetched {new Date(item.fetchedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}
