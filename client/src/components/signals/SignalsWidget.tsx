import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { SignalCard, type SignalRow } from "@/components/signals/SignalCard";

/**
 * Compact Agent Signals card for dashboards. Renders nothing while the
 * feature is dormant (SIGNALS_ENABLED=false → 403) so the page stays clean.
 */
export function SignalsWidget({ limit = 2 }: { limit?: number }) {
  const query = useQuery<{ signals: SignalRow[]; disabled?: boolean }>({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      const res = await fetch("/api/signals", { credentials: "include" });
      if (res.status === 403) return { signals: [], disabled: true };
      if (!res.ok) throw new Error(`Failed to load signals (${res.status})`);
      return res.json();
    },
    retry: false,
    refetchInterval: 120_000,
  });
  const swapsLive = useQuery<{ live: boolean }>({
    queryKey: ["/api/swap/tokens", "liveness"],
    queryFn: async () => {
      const res = await fetch("/api/swap/tokens", { credentials: "include" });
      return { live: res.ok };
    },
    retry: false,
  });

  if (query.data?.disabled || query.isError) return null;
  const signals = (query.data?.signals ?? []).slice(0, limit);

  return (
    <Surface className="p-4" data-testid="widget-agent-signals">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Agent Signals</SectionTitle>
        <Link href="/signals" className="text-xs text-accent-core hover:underline" data-testid="link-signals-all">
          View all
        </Link>
      </div>
      {signals.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">No open signals — agents abstain when the evidence isn't there.</p>
      ) : (
        <div className="space-y-3">
          {signals.map((s) => (
            <SignalCard key={s.id} signal={s} swapsLive={swapsLive.data?.live === true} />
          ))}
        </div>
      )}
    </Surface>
  );
}
