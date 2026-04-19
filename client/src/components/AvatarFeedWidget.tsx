import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, TrendingUp, ArrowDownRight } from "lucide-react";

interface AvatarPost {
  id: string;
  avatarId: string;
  avatarName: string;
  avatarImageUrl: string | null;
  marketQuestion: string | null;
  outcome: string | null;
  body: string;
  createdAt: string | null;
}

function relTime(iso: string | null) {
  if (!iso) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function AvatarFeedWidget() {
  const { data, isLoading } = useQuery<{ success: boolean; posts: AvatarPost[] }>({
    queryKey: ["/api/avatar-feed"],
    refetchInterval: 90_000,
  });
  const posts = (data?.posts ?? []).slice(0, 3);

  return (
    <Card className="bg-slate-950/40 border border-cyan-500/20 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Avatar Live Feed
          </CardTitle>
          <Link href="/avatar-feed">
            <a className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1" data-testid="avatar-feed-widget-link">
              See all <ArrowRight className="w-3 h-3" />
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-xs text-slate-500">Loading commentary…</p>}
        {!isLoading && posts.length === 0 && (
          <p className="text-xs text-slate-500">Avatars are quiet — new trades will appear here.</p>
        )}
        {posts.map((p) => {
          const isYes = p.outcome === "YES";
          return (
            <Link key={p.id} href="/avatar-feed">
              <a className="block group">
                <div className="flex gap-2.5">
                  {p.avatarImageUrl ? (
                    <img
                      src={p.avatarImageUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-cyan-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-medium text-slate-200 group-hover:text-cyan-400 truncate">
                        {p.avatarName}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">{relTime(p.createdAt)}</span>
                      {p.outcome && (
                        <Badge
                          variant="outline"
                          className={`ml-auto h-4 px-1 text-[10px] gap-0.5 ${isYes ? "text-emerald-400 border-emerald-500/40" : "text-rose-400 border-rose-500/40"}`}
                        >
                          {isYes ? <TrendingUp className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          {p.outcome}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{p.body}</p>
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
