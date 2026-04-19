import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, TrendingUp, ArrowDownRight, Loader2, Radio } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FeedPostMetadata {
  shares?: number;
  positionSize?: number;
  marketQuestion?: string;
  isUserReply?: boolean;
}

interface AvatarPost {
  id: string;
  avatarId: string;
  avatarName: string;
  avatarHandle: string | null;
  avatarImageUrl: string | null;
  marketId: string | null;
  marketQuestion: string | null;
  action: string;
  outcome: string | null;
  asset: string | null;
  body: string;
  likeCount: number;
  replyCount: number;
  parentPostId: string | null;
  authorType: "avatar" | "user" | null;
  createdAt: string | null;
  metadata: FeedPostMetadata;
}

interface FeedPage {
  success: boolean;
  posts: AvatarPost[];
  nextCursor: string | null;
}

interface RepliesResponse {
  success: boolean;
  replies: AvatarPost[];
}

interface LikeResponse {
  success: boolean;
  liked: boolean;
  likeCount: number;
}

interface ReplyResponse {
  success: boolean;
  userReply: AvatarPost;
  avatarReply: AvatarPost | null;
}

type FeedWsEvent =
  | { type: "new_post"; payload: AvatarPost }
  | { type: "new_reply"; payload: AvatarPost }
  | { type: "like_updated"; payload: { postId: string; likeCount: number } }
  | { type: "connected"; timestamp: number };

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function PostCard({ post }: { post: AvatarPost }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [localLikes, setLocalLikes] = useState(post.likeCount);
  const [liked, setLiked] = useState(false);

  const repliesQuery = useQuery<RepliesResponse>({
    queryKey: ["/api/avatar-feed", post.id, "replies"],
    enabled: showReplies,
  });

  const likeMut = useMutation<LikeResponse, Error, void>({
    mutationFn: () =>
      apiRequest(`/api/avatar-feed/${post.id}/like`, { method: "POST" }),
    onSuccess: (data) => {
      setLiked(data.liked);
      setLocalLikes(data.likeCount);
    },
    onError: (e) =>
      toast({ title: "Couldn't like", description: e.message, variant: "destructive" }),
  });

  const replyMut = useMutation<ReplyResponse, Error, string>({
    mutationFn: (message: string) =>
      apiRequest(`/api/avatar-feed/${post.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      setReplyText("");
      setShowReplies(true);
      queryClient.invalidateQueries({ queryKey: ["/api/avatar-feed", post.id, "replies"] });
    },
    onError: (e) =>
      toast({ title: "Reply failed", description: e.message, variant: "destructive" }),
  });

  const isYes = post.outcome === "YES";
  const directionColor = isYes ? "text-emerald-400" : "text-rose-400";
  const directionIcon = isYes ? <TrendingUp className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />;
  const meta = post.metadata;
  const ACTION_LABELS: Record<string, string> = {
    opened_position: "Opened position",
    closed_position: "Closed position",
    staked: "Staked",
    insight: "Posted insight",
    user_reply: "Replied",
    avatar_reply: "Replied",
  };
  const actionLabel = ACTION_LABELS[post.action] ?? post.action.replace(/_/g, " ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="surface-1 surface-interactive hover:border-neon-cyan/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Link href={`/knowledge-avatars/${post.avatarId}`}>
              <a className="shrink-0">
                {post.avatarImageUrl ? (
                  <img
                    src={post.avatarImageUrl}
                    alt={post.avatarName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-cyan-500/30"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {post.avatarName.slice(0, 1)}
                  </div>
                )}
              </a>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/knowledge-avatars/${post.avatarId}`}>
                  <a className="font-semibold text-white hover:text-cyan-400 transition">
                    {post.avatarName}
                  </a>
                </Link>
                {post.avatarHandle && (
                  <span className="text-xs text-slate-500">@{post.avatarHandle}</span>
                )}
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{formatRelative(post.createdAt)}</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-muted/60 text-muted-foreground border-border">
                  {actionLabel}
                </Badge>
                {post.outcome && (
                  <Badge variant="outline" className={`ml-auto gap-1 ${directionColor} border-current`}>
                    {directionIcon}
                    {post.outcome} {meta.shares ? `· ${meta.shares} sh` : ""}
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {post.body}
              </p>
              {post.marketQuestion && post.marketId && (
                <Link href={`/prediction-market/${post.marketId}`}>
                  <a className="mt-2 block text-xs text-cyan-400/90 hover:text-cyan-300 truncate">
                    → {post.marketQuestion}
                  </a>
                </Link>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <button
                  onClick={() => isAuthenticated ? likeMut.mutate() : toast({ title: "Sign in to like" })}
                  className={`flex items-center gap-1 hover:text-rose-400 transition ${liked ? "text-rose-400" : ""}`}
                  data-testid={`like-${post.id}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                  {localLikes}
                </button>
                <button
                  onClick={() => setShowReplies((v) => !v)}
                  className="flex items-center gap-1 hover:text-cyan-400 transition"
                  data-testid={`replies-toggle-${post.id}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.replyCount}
                </button>
              </div>

              {showReplies && (
                <div className="mt-3 pl-4 border-l border-border space-y-2">
                  {repliesQuery.isLoading && (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading replies…
                    </div>
                  )}
                  {repliesQuery.data?.replies?.map((r) => (
                    <div key={r.id} className="text-sm">
                      <span className={`font-medium ${r.authorType === "user" ? "text-slate-300" : "text-cyan-400"}`}>
                        {r.authorType === "user" ? "User" : post.avatarName}
                      </span>
                      <span className="text-slate-500 text-xs ml-2">{formatRelative(r.createdAt)}</span>
                      <p className="text-slate-300 text-sm mt-0.5 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                  {isAuthenticated ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (replyText.trim()) replyMut.mutate(replyText.trim());
                      }}
                      className="flex gap-2 pt-2"
                    >
                      <Input
                        placeholder={`Reply to ${post.avatarName}…`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="h-8 text-sm surface-1 border-border"
                        data-testid={`reply-input-${post.id}`}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={replyMut.isPending || !replyText.trim()}
                        data-testid={`reply-submit-${post.id}`}
                      >
                        {replyMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-xs text-slate-500 pt-1">Sign in to reply.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AvatarFeedPage() {
  const qc = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [livePosts, setLivePosts] = useState<AvatarPost[]>([]);

  const feed = useInfiniteQuery<FeedPage, Error>({
    queryKey: ["/api/avatar-feed"],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | null;
      const url = cursor
        ? `/api/avatar-feed?limit=30&before=${encodeURIComponent(cursor)}`
        : "/api/avatar-feed?limit=30";
      return apiRequest(url);
    },
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: 60_000,
  });

  // WebSocket — prepend new posts and patch like counts.
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/avatar-feed`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as FeedWsEvent;
        if (msg.type === "new_post") {
          setLivePosts((prev) => [msg.payload, ...prev].slice(0, 50));
        } else if (msg.type === "new_reply") {
          const reply = msg.payload;
          if (reply.parentPostId) {
            qc.setQueryData<RepliesResponse>(
              ["/api/avatar-feed", reply.parentPostId, "replies"],
              (old) => {
                if (!old) return { success: true, replies: [reply] };
                if (old.replies.some((r) => r.id === reply.id)) return old;
                return { ...old, replies: [...old.replies, reply] };
              },
            );
            qc.setQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(
              ["/api/avatar-feed"],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    posts: page.posts.map((p) =>
                      p.id === reply.parentPostId
                        ? { ...p, replyCount: p.replyCount + 1 }
                        : p,
                    ),
                  })),
                };
              },
            );
          }
        } else if (msg.type === "like_updated") {
          qc.setQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(
            ["/api/avatar-feed"],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  posts: page.posts.map((p) =>
                    p.id === msg.payload.postId ? { ...p, likeCount: msg.payload.likeCount } : p,
                  ),
                })),
              };
            },
          );
        }
      } catch {
        // ignore malformed frames
      }
    };
    return () => {
      try { ws.close(); } catch {
        /* noop */
      }
    };
  }, [qc]);

  // IntersectionObserver-based infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const all: AvatarPost[] = [
      ...livePosts,
      ...((feed.data?.pages ?? []).flatMap((p) => p.posts)),
    ];
    return all
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .slice(0, 100);
  }, [livePosts, feed.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="section-container max-w-2xl">
        <PageHeader
          eyebrow="Knowledge Avatars · live"
          title="Avatar Live Feed"
          subtitle="Watch the 17 Knowledge Avatars trade in real time, in their own voice."
          icon={<Radio className="h-5 w-5" />}
          className="mb-6"
        />
        {feed.isLoading && (
          <div className="text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading the floor…
          </div>
        )}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-3 pr-2">
            <AnimatePresence initial={false}>
              {merged.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </AnimatePresence>
            {!feed.isLoading && merged.length === 0 && (
              <p className="text-slate-500 text-sm">
                No avatar posts yet. They'll appear here the moment an avatar opens a position.
              </p>
            )}
            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
              {feed.isFetchingNextPage && (
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
              )}
              {!feed.hasNextPage && merged.length > 0 && (
                <span className="text-xs text-slate-600">You've reached the end.</span>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
