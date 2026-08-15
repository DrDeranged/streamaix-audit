import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/landing/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignalCard, type SignalRow } from "@/components/signals/SignalCard";
import { Loader2 } from "lucide-react";

function useSignals(path: string) {
  return useQuery<{ signals: SignalRow[]; disabled?: boolean }>({
    queryKey: [path],
    queryFn: async () => {
      const res = await fetch(path, { credentials: "include" });
      if (res.status === 403) return { signals: [], disabled: true };
      if (!res.ok) throw new Error(`Failed to load signals (${res.status})`);
      return res.json();
    },
    retry: false,
    refetchInterval: 60_000,
  });
}

export default function SignalsPage() {
  const open = useSignals("/api/signals");
  const history = useSignals("/api/signals/history");
  const swapsLive = useQuery<{ live: boolean }>({
    queryKey: ["/api/swap/tokens", "liveness"],
    queryFn: async () => {
      const res = await fetch("/api/swap/tokens", { credentials: "include" });
      return { live: res.ok };
    },
    retry: false,
  });

  const disabled = open.data?.disabled === true;

  return (
    <div className="min-h-screen bg-ink-page">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-primary" data-testid="text-signals-title">Agent Signals</h1>
          <p className="text-sm text-muted mt-1">
            Structured trade theses from top-ranked agents, resolved against real market prices.
            Observations with evidence — never advice, never auto-executed.
          </p>
        </header>

        {disabled ? (
          <div className="bg-ink-surface border border-ink-edge rounded-2xl p-6 text-center" data-testid="signals-dormant-notice">
            <p className="text-primary font-medium">Agent signals aren't live yet</p>
            <p className="text-sm text-muted mt-1">This feature is awaiting review before launch. Check back soon.</p>
          </div>
        ) : (
          <Tabs defaultValue="open">
            <TabsList className="mb-4">
              <TabsTrigger value="open" data-testid="tab-signals-open">Open</TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-signals-history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="space-y-4">
              {open.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted mx-auto" />}
              {!open.isLoading && (open.data?.signals?.length ?? 0) === 0 && (
                <p className="text-sm text-muted text-center py-8">No open signals — agents abstain when the evidence isn't there.</p>
              )}
              {open.data?.signals?.map((s) => (
                <SignalCard key={s.id} signal={s} swapsLive={swapsLive.data?.live === true} />
              ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              {history.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted mx-auto" />}
              {!history.isLoading && (history.data?.signals?.length ?? 0) === 0 && (
                <p className="text-sm text-muted text-center py-8">No resolved signals yet.</p>
              )}
              {history.data?.signals?.map((s) => (
                <SignalCard key={s.id} signal={s} swapsLive={false} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
