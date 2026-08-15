import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { HORIZON_HOURS, computeSuggestedSize, type TimeHorizon } from "@shared/agentSignals";
import { useWallet } from "@/hooks/useWallet";

export interface SignalAgent {
  id: string;
  name: string;
  handle: string;
  imageUrl: string | null;
  winRate: number | null;
  totalTrades: number | null;
}

export interface SignalRow {
  id: string;
  agentId: string;
  token: string;
  direction: "accumulate" | "reduce" | "neutral";
  thesis: string;
  confidence: number;
  keyEvidence: string[];
  invalidation: string;
  timeHorizon: string;
  entryPrice: number;
  status: "open" | "resolved";
  resolvePrice: number | null;
  hypotheticalReturnPct: number | null;
  correct: boolean | null;
  resolvedAt: string | null;
  createdAt: string;
  agent: SignalAgent | null;
  realMarketAccuracy: {
    resolved: number;
    correct: number;
    accuracyPct: number | null;
    avgReturnPct: number | null;
  } | null;
}

const DIRECTION_STYLE: Record<SignalRow["direction"], { label: string; cls: string; Icon: typeof TrendingUp }> = {
  accumulate: { label: "Accumulate", cls: "bg-gain/10 text-gain border-gain/30", Icon: TrendingUp },
  reduce: { label: "Reduce", cls: "bg-loss/10 text-loss border-loss/30", Icon: TrendingDown },
  neutral: { label: "Neutral", cls: "bg-ink-raised text-muted border-ink-edge", Icon: Minus },
};

function useCountdown(createdAt: string, horizon: string): string {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const hours = HORIZON_HOURS[horizon as TimeHorizon] ?? 24;
  const endsAt = new Date(createdAt).getTime() + hours * 3_600_000;
  const msLeft = endsAt - Date.now();
  if (msLeft <= 0) return "resolving soon";
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

/** Suggested size for "Trade this": capped 5% of the user's relevant balance. */
export function suggestedTradeParams(
  signal: SignalRow,
  balances: { eth: string | null; usdc: string | null; weth: string | null }
): { sell: string; buy: string; amount: string | null } {
  if (signal.direction === "reduce") {
    // Reduce exposure: sell the token for USDC. Only prefill size for balances we know.
    const bal =
      signal.token === "ETH" ? balances.eth : signal.token === "WETH" ? balances.weth : null;
    const size = computeSuggestedSize(bal ? Number(bal) : null);
    return { sell: signal.token, buy: "USDC", amount: size ? trimAmount(size) : null };
  }
  // Accumulate (and neutral fallback): spend USDC on the token.
  const size = computeSuggestedSize(balances.usdc ? Number(balances.usdc) : null);
  return { sell: "USDC", buy: signal.token, amount: size ? trimAmount(size) : null };
}

function trimAmount(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 6, useGrouping: false });
}

export function SignalCard({ signal, swapsLive }: { signal: SignalRow; swapsLive: boolean }) {
  const { isConnected, balances } = useWallet();
  const countdown = useCountdown(signal.createdAt, signal.timeHorizon);
  const d = DIRECTION_STYLE[signal.direction] ?? DIRECTION_STYLE.neutral;
  const acc = signal.realMarketAccuracy;
  const resolved = signal.status === "resolved";

  const tradeHref = (() => {
    const p = suggestedTradeParams(signal, balances);
    const qs = new URLSearchParams({ sell: p.sell, buy: p.buy, signal: signal.id });
    if (p.amount) qs.set("amount", p.amount);
    return `/trade?${qs.toString()}`;
  })();

  return (
    <div className="bg-ink-surface border border-ink-edge rounded-2xl p-4" data-testid={`card-signal-${signal.id}`}>
      {/* Agent identity + accuracy */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8">
            {signal.agent?.imageUrl && <AvatarImage src={signal.agent.imageUrl} alt={signal.agent?.name} />}
            <AvatarFallback>{(signal.agent?.name || "??").slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-primary truncate">{signal.agent?.name ?? "Agent"}</div>
            <div className="text-[11px] text-muted flex flex-wrap gap-x-2">
              <span title="Resolved against real market prices">
                Signal accuracy — real market prices:{" "}
                {acc && acc.accuracyPct !== null ? `${acc.accuracyPct}% (${acc.resolved})` : "no resolved signals yet"}
              </span>
              {signal.agent?.winRate != null && (
                <span title="Simulated portfolio win rate">Simulated portfolio: {Math.round(signal.agent.winRate)}%</span>
              )}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 ${d.cls}`} data-testid={`chip-direction-${signal.id}`}>
          <d.Icon className="h-3.5 w-3.5" />
          {d.label} {signal.token}
        </span>
      </div>

      {/* Thesis */}
      <p className="text-sm text-primary leading-relaxed mb-3">{signal.thesis}</p>

      {/* Evidence chips */}
      {signal.keyEvidence?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {signal.keyEvidence.map((e, i) => (
            <span key={i} className="text-[11px] bg-ink-raised border border-ink-edge text-muted rounded-full px-2 py-0.5">
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Invalidation callout */}
      <div className="flex items-start gap-2 bg-warn/10 border border-warn/30 rounded-xl px-3 py-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-warn shrink-0 mt-0.5" />
        <p className="text-xs text-warn">{signal.invalidation}</p>
      </div>

      {/* Confidence bar + horizon */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-muted mb-1">
            <span>Confidence</span>
            <span>{Math.round(signal.confidence * 100)}%</span>
          </div>
          <div className="h-1.5 bg-ink-raised rounded-full overflow-hidden">
            <div className="h-full bg-accent-core rounded-full" style={{ width: `${Math.round(signal.confidence * 100)}%` }} />
          </div>
        </div>
        <div className="text-xs text-muted flex items-center gap-1 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          {resolved ? "Resolved" : countdown}
        </div>
      </div>

      {/* Resolved outcome — losses as prominent as wins */}
      {resolved && (
        <div
          className={`text-sm font-semibold rounded-xl px-3 py-2 mb-3 border ${
            signal.correct ? "bg-gain/10 text-gain border-gain/30" : "bg-loss/10 text-loss border-loss/30"
          }`}
          data-testid={`outcome-${signal.id}`}
        >
          {signal.correct ? "Thesis held" : "Thesis failed"} · hypothetical return{" "}
          {signal.hypotheticalReturnPct !== null && signal.hypotheticalReturnPct >= 0 ? "+" : ""}
          {signal.hypotheticalReturnPct}% (entry ${signal.entryPrice} → ${signal.resolvePrice})
        </div>
      )}

      {/* Trade this — only wallet-connected + swaps live; never auto-executes */}
      {!resolved && swapsLive && isConnected && (
        <Link href={tradeHref}>
          <Button size="sm" className="w-full" data-testid={`button-trade-signal-${signal.id}`}>
            Trade this — you confirm & sign
          </Button>
        </Link>
      )}

      <p className="text-[11px] text-muted mt-3">
        Agent thesis, not advice. You decide. Trades are user-signed via your own wallet; quotes include a 0.3% platform fee.
      </p>
    </div>
  );
}
