import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, CircleDollarSign, Gauge } from "lucide-react";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

type PulseSection<T> = { data?: T; asOf?: string; delayed?: boolean };
export interface MarketPulseData {
  btcDominance?: PulseSection<{ value?: number | string; trend?: string }>;
  totalMarketCap?: PulseSection<{ value?: number | string; trend?: string }>;
  fearGreed?: PulseSection<{ value?: number; valueClassification?: string; classification?: string; label?: string; timestamp?: string }>;
  unusualVolumeCount?: PulseSection<number>;
}

function metricDate<T>(metric: PulseSection<T> | undefined) { return metric?.asOf; }
function formatTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function display(value: number | string | undefined, kind: "percent" | "money" | "count" | "fear") {
  if (value === undefined || value === null || value === "") return "—";
  if (kind === "percent" && typeof value === "number") return `${value.toFixed(1)}%`;
  if (kind === "money" && typeof value === "number") {
    return value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` : `$${(value / 1e6).toFixed(0)}M`;
  }
  if (kind === "count" && typeof value === "number") return value.toLocaleString();
  return String(value);
}

/** Compact, provenance-aware market context for the dashboard. */
export function MarketPulse() {
  const query = useQuery<MarketPulseData>({
    queryKey: ["/api/market-pulse"],
    queryFn: async () => {
      const response = await fetch("/api/market-pulse", { credentials: "include" });
      if (!response.ok) throw new Error(`Failed to load market pulse (${response.status})`);
      return response.json();
    },
    staleTime: 60_000,
    retry: false,
  });
  const data = query.data;
  if (!data || query.isError) return null;
  const fear = data.fearGreed?.data;
  const items = [
    data.btcDominance?.data?.value !== undefined && { label: "BTC dominance", value: display(data.btcDominance.data.value, "percent"), icon: CircleDollarSign, date: metricDate(data.btcDominance), delayed: data.btcDominance.delayed },
    data.totalMarketCap?.data?.value !== undefined && { label: "Total market cap", value: display(data.totalMarketCap.data.value, "money"), icon: BarChart3, date: metricDate(data.totalMarketCap), delayed: data.totalMarketCap.delayed },
    fear?.value !== undefined && { label: "Fear & greed", value: `${display(fear.value, "fear")}${fear.valueClassification || fear.classification || fear.label ? ` · ${fear.valueClassification || fear.classification || fear.label}` : ""}`, icon: Gauge, date: fear.timestamp || metricDate(data.fearGreed), delayed: data.fearGreed?.delayed },
    data.unusualVolumeCount?.data !== undefined && { label: "Unusual volume", value: display(data.unusualVolumeCount.data, "count"), icon: Activity, date: metricDate(data.unusualVolumeCount), delayed: data.unusualVolumeCount.delayed },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: typeof Activity; date?: string; delayed?: boolean }>;
  if (!items.length) return null;
  return (
    <Surface className="p-4" data-testid="surface-market-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <SectionTitle>Market Pulse</SectionTitle>
        {(data.btcDominance?.delayed || data.totalMarketCap?.delayed || data.fearGreed?.delayed || data.unusualVolumeCount?.delayed) && <span className="text-[10px] rounded-full border border-warn/40 bg-warn/10 text-warn px-2 py-1 whitespace-nowrap">Delayed data</span>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {items.map(({ label, value, icon: Icon, date, delayed }) => (
          <div key={label} className="rounded-xl border border-ink-edge bg-ink-raised/60 p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted truncate"><Icon className="h-3.5 w-3.5 text-accent-bright shrink-0" />{label}</div>
            <div className="text-sm font-semibold text-primary truncate mt-1">{value}</div>
            {(date || delayed) && <div className="flex items-center gap-1.5 text-[10px] text-muted mt-1">
              {date && <span>As of {formatTime(date)}</span>}
              {delayed && <span className="text-warn">Delayed</span>}
            </div>}
          </div>
        ))}
      </div>
    </Surface>
  );
}