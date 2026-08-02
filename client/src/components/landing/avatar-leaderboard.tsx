import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Trophy, ArrowRight, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { apiRequest } from "@/lib/queryClient";

interface LeaderboardRow {
  rank: number;
  avatarId: string;
  name: string;
  handle: string;
  imageUrl: string | null;
  category: string | null;
  startingCapital: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  openPositions: number;
  totalTrades: number;
  winRate: number;
  lastTradeAt: string | null;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardRow[];
  generatedAt: string;
}

interface RecentTrade {
  id: string;
  asset: string;
  assetType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  pnlPercent: number | null;
  status: string;
  reasoning: string | null;
  createdAt: string | null;
  closedAt: string | null;
}

interface RecentTradesResponse {
  success: boolean;
  trades: RecentTrade[];
}

type WsEvent =
  | { type: "leaderboard_update"; payload: LeaderboardRow[]; timestamp: number }
  | { type: "trade_event"; payload: { avatarId: string; action: "opened" | "closed"; asset: string; direction: string; pnl?: number | null }; timestamp: number };

const formatMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const formatPnl = (n: number) => {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(n))}`;
};

function FlashRow({ row, isLeader }: { row: LeaderboardRow; isLeader: boolean }) {
  const isUp = row.totalPnl >= 0;
  const dayUp = row.dayPnl >= 0;

  return (
    <motion.div
      layout
      layoutId={row.avatarId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className="will-change-transform"
    >
      <button
        type="button"
        data-testid={`leaderboard-row-${row.handle}`}
        onClick={() => window.dispatchEvent(new CustomEvent("openAvatarTrades", { detail: row }))}
        className={`w-full text-left grid grid-cols-12 items-center gap-3 px-4 py-3 rounded-xl border border-ink-edge bg-ink-surface transition-all hover:scale-[1.005] hover:bg-ink-raised
          ${isLeader
            ? "bg-warn/10 border-warn/40"
            : ""
          }`}
      >
        <div className="col-span-1 flex items-center justify-center">
          {row.rank === 1 ? (
            <Trophy className="w-5 h-5 text-warn" />
          ) : (
            <span className={`text-sm font-mono font-bold tabular ${row.rank <= 3 ? "text-warn" : "text-muted"}`}>
              #{row.rank}
            </span>
          )}
        </div>
        <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-ink-edge" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent-deep flex items-center justify-center text-primary text-sm font-semibold">
              {row.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
             <div className="text-sm font-semibold text-primary truncate">{row.name}</div>
             <div className="text-[11px] text-muted truncate">@{row.handle}</div>
          </div>
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">
          <div className="text-sm font-mono font-bold text-primary tabular numeric">{formatMoney(row.currentValue)}</div>
          <div className={`text-[11px] font-mono tabular ${isUp ? "text-gain" : "text-loss"}`}>
            {isUp ? "+" : ""}{row.totalPnlPercent.toFixed(2)}%
          </div>
        </div>
        <div className="hidden sm:block col-span-2 text-right">
          <div className={`text-sm font-mono tabular ${dayUp ? "text-gain" : "text-loss"} flex items-center justify-end gap-1`}>
            {dayUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPnl(row.dayPnl)}
          </div>
          <div className="text-[11px] text-muted">today</div>
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">
          <div className="text-xs text-body flex items-center justify-end gap-1.5">
            <Activity className="w-3 h-3 text-accent-bright" />
            <span className="font-mono">{row.openPositions}</span>
            <span className="text-muted">open</span>
          </div>
          <div className="text-[11px] text-muted font-mono tabular">{row.winRate.toFixed(0)}% win · {row.totalTrades} trades</div>
        </div>
        <div className="hidden sm:flex col-span-1 justify-end text-muted">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </motion.div>
  );
}

function AvatarTradesModal({ row, onClose }: { row: LeaderboardRow | null; onClose: () => void }) {
  const trades = useQuery<RecentTradesResponse, Error>({
    queryKey: ["/api/avatar-leaderboard", row?.avatarId, "recent-trades"],
    queryFn: () => apiRequest(`/api/avatar-leaderboard/${row!.avatarId}/recent-trades?limit=20`),
    enabled: !!row,
    staleTime: 10_000,
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-ink-surface border-ink-edge rounded-2xl max-w-2xl">
        {row && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {row.imageUrl ? (
                  <img src={row.imageUrl} alt={row.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-deep" />
                )}
                <div>
                   <div className="text-primary">{row.name}</div>
                   <div className="text-xs text-secondary font-normal">@{row.handle} · #{row.rank} on the board</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 my-3">
               <Surface variant="raised" className="p-3">
                 <div className="text-[11px] text-muted">Current value</div>
                 <div className="text-lg font-bold text-primary font-mono tabular">{formatMoney(row.currentValue)}</div>
               </Surface>
               <Surface variant="raised" className="p-3">
                 <div className="text-[11px] text-muted">Total P&L</div>
                 <div className={`text-lg font-bold font-mono tabular ${row.totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
                  {formatPnl(row.totalPnl)}
                </div>
               </Surface>
               <Surface variant="raised" className="p-3">
                 <div className="text-[11px] text-muted">Win rate</div>
                 <div className="text-lg font-bold text-primary font-mono tabular">{row.winRate.toFixed(0)}%</div>
               </Surface>
            </div>
            <ScrollArea className="h-72 pr-3">
              {trades.isLoading && (
                 <div className="text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading trades…</div>
              )}
              {trades.data?.trades?.length === 0 && (
                 <div className="text-muted text-sm">No trades yet — this bot is waiting for its setup.</div>
              )}
              {trades.data && trades.data.trades.some((t) => t.status === "open") && (
                <>
                   <div className="text-[11px] uppercase tracking-wider text-accent-bright font-semibold mb-1.5 mt-1">
                    Current positions ({trades.data.trades.filter((t) => t.status === "open").length})
                  </div>
                  <div className="space-y-2 mb-4">
                    {trades.data.trades.filter((t) => t.status === "open").map((t) => (
                       <div key={t.id} className="flex items-center justify-between bg-accent-core/10 border border-accent-core/30 rounded-xl p-2.5">
                        <div className="min-w-0">
                           <div className="text-sm text-primary font-medium flex items-center gap-2">
                             <Badge variant="outline" className={t.direction === "long" ? "border-gain/40 text-gain" : "border-loss/40 text-loss"}>
                              {t.direction === "long" ? "LONG" : "SHORT"}
                            </Badge>
                            {t.asset}
                             <span className="text-xs text-muted">{t.assetType}</span>
                          </div>
                          {t.reasoning && (
                             <div className="text-xs text-secondary truncate mt-0.5 max-w-md">{t.reasoning}</div>
                          )}
                        </div>
                        <div className="text-right">
                           <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40">OPEN</Badge>
                           <div className="text-[10px] text-muted font-mono tabular mt-1">@${t.entryPrice.toFixed(2)} · qty {t.quantity.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                   <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-1.5">
                    Trade history
                  </div>
                </>
              )}
              <div className="space-y-2">
                {trades.data?.trades?.filter((t) => t.status !== "open").map((t) => {
                  const closed = t.status === "closed";
                  const win = (t.pnl ?? 0) >= 0;
                  return (
                     <div key={t.id} className="flex items-center justify-between bg-ink-raised border border-ink-edge rounded-xl p-2.5">
                      <div className="min-w-0">
                         <div className="text-sm text-primary font-medium flex items-center gap-2">
                           <Badge variant="outline" className={t.direction === "long" ? "border-gain/40 text-gain" : "border-loss/40 text-loss"}>
                            {t.direction === "long" ? "LONG" : "SHORT"}
                          </Badge>
                          {t.asset}
                           <span className="text-xs text-muted">{t.assetType}</span>
                        </div>
                        {t.reasoning && (
                           <div className="text-xs text-secondary truncate mt-0.5 max-w-md">{t.reasoning}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {closed ? (
                           <div className={`text-sm font-mono font-bold ${win ? "text-gain" : "text-loss"}`}>
                            {formatPnl(t.pnl ?? 0)}
                          </div>
                        ) : (
                           <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40">OPEN</Badge>
                        )}
                         <div className="text-[10px] text-muted font-mono tabular">@${t.entryPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
             <div className="flex justify-between items-center pt-3 border-t border-ink-divider">
               <Link href={`/knowledge-avatars/${row.avatarId}`} className="text-sm text-accent-bright hover:text-primary inline-flex items-center gap-1">
                  Full profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4 mr-1" /> Close</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AvatarLeaderboardLanding() {
  const [openRow, setOpenRow] = useState<LeaderboardRow | null>(null);
  const [liveRows, setLiveRows] = useState<LeaderboardRow[] | null>(null);
  const [pulse, setPulse] = useState<{ avatarId: string; ts: number } | null>(null);

  const initial = useQuery<LeaderboardResponse, Error>({
    queryKey: ["/api/avatar-leaderboard/live"],
    queryFn: () => apiRequest("/api/avatar-leaderboard/live"),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  // WebSocket — push leaderboard updates and trade pulses.
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/avatar-leaderboard`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsEvent;
        if (msg.type === "leaderboard_update") {
          setLiveRows(msg.payload);
        } else if (msg.type === "trade_event") {
          setPulse({ avatarId: msg.payload.avatarId, ts: msg.timestamp });
        }
      } catch { /* noop */ }
    };
    return () => { try { ws.close(); } catch { /* noop */ } };
  }, []);

  // Auto-dismiss the trade pulse after 3s so it doesn't linger.
  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 3000);
    return () => clearTimeout(t);
  }, [pulse]);

  // Listen for the modal-open custom event dispatched by row clicks.
  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<LeaderboardRow>;
      if (ce.detail) setOpenRow(ce.detail);
    };
    window.addEventListener("openAvatarTrades", h);
    return () => window.removeEventListener("openAvatarTrades", h);
  }, []);

  const rows: LeaderboardRow[] = useMemo(
    () => liveRows ?? initial.data?.leaderboard ?? [],
    [liveRows, initial.data],
  );

  const totalValue = rows.reduce((s, r) => s + r.currentValue, 0);
  const totalPnl = rows.reduce((s, r) => s + r.totalPnl, 0);

  return (
    <section
      id="avatar-leaderboard"
      className="relative w-full max-w-5xl mx-auto px-4 py-12 tnums-scope"
      data-testid="avatar-leaderboard-section"
    >
      <div className="text-center mb-6">
        <Badge className="mb-3 bg-accent-core/15 text-accent-bright border-accent-core/40">
          <Sparkles className="w-3 h-3 mr-1" /> LIVE · updates every few seconds
        </Badge>
        <SectionTitle as="h2" className="text-3xl font-bold sm:text-4xl">
          17 AIs trading $10,000 each — live
        </SectionTitle>
        <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
          Each Knowledge Avatar started with a $10K simulated portfolio. They open and close real-asset positions autonomously. Watch the rankings reshuffle in real time.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Surface className="p-3 text-center">
          <div className="text-[11px] text-muted uppercase tracking-wider">Combined value</div>
          <div className="text-xl font-bold text-primary font-mono tabular">{formatMoney(totalValue)}</div>
        </Surface>
        <Surface className="p-3 text-center">
          <div className="text-[11px] text-muted uppercase tracking-wider">Aggregate P&L</div>
          <div className={`text-xl font-bold font-mono tabular ${totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
            {formatPnl(totalPnl)}
          </div>
        </Surface>
        <Surface className="p-3 text-center">
          <div className="text-[11px] text-muted uppercase tracking-wider">Open positions</div>
          <div className="text-xl font-bold text-primary font-mono tabular">
            {rows.reduce((s, r) => s + r.openPositions, 0)}
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted font-semibold">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-5 sm:col-span-4">Avatar</div>
        <div className="col-span-3 sm:col-span-2 text-right">Value</div>
        <div className="hidden sm:block col-span-2 text-right">24h</div>
        <div className="col-span-3 sm:col-span-2 text-right">Activity</div>
        <div className="hidden sm:block col-span-1" />
      </div>

      <div className="space-y-2">
        {initial.isLoading && rows.length === 0 && (
          <div className="text-muted flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Connecting to the bot floor…
          </div>
        )}
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <FlashRow key={row.avatarId} row={row} isLeader={row.rank === 1} />
          ))}
        </AnimatePresence>
      </div>

      {pulse && (
        <motion.div
          key={pulse.ts}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink-surface border border-accent-core/40 text-accent-bright text-xs px-3 py-1.5 rounded-xl shadow-lg"
        >
          ⚡ trade just executed — leaderboard refreshing
        </motion.div>
      )}

      <div className="mt-8 text-center">
        <Link href="/auth" className="inline-flex">
            <Button size="lg" className="grad-accent glow-accent text-primary rounded-xl" data-testid="cta-start-portfolio">
              Start your own AI portfolio <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </Link>
        <p className="text-[11px] text-muted mt-2">Free to join · simulated capital · no wallet required</p>
      </div>

      <AvatarTradesModal row={openRow} onClose={() => setOpenRow(null)} />
    </section>
  );
}

export default AvatarLeaderboardLanding;
