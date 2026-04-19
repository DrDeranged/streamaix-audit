import OpenAI from "openai";
import { db } from "../db";
import {
  knowledgeAvatars,
  predictionMarkets,
  avatarPosts,
  avatarPostReactions,
  type KnowledgeAvatar,
  type AvatarPost,
} from "@shared/schema";
import { and, desc, eq, lt, sql } from "drizzle-orm";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type Broadcaster = (event: { type: string; payload: any }) => void;
let broadcaster: Broadcaster = () => {};
export function setAvatarFeedBroadcaster(fn: Broadcaster) {
  broadcaster = fn;
}

export interface TradeEvent {
  avatarId: string;
  avatarName?: string;
  marketId: string;
  marketQuestion?: string;
  outcome: "YES" | "NO";
  shares: number;
  positionSize: number;
  reasoning: string;
  tradeId?: string;
}

function fallbackPost(
  avatar: KnowledgeAvatar,
  marketQ: string,
  ev: TradeEvent,
): string {
  return `Just opened a ${ev.outcome} position on "${marketQ}" — ${ev.shares} shares for ${ev.positionSize} STREAM. ${ev.reasoning}`;
}

async function generateBody(
  avatar: KnowledgeAvatar,
  market: { question: string; category?: string | null },
  ev: TradeEvent,
): Promise<string> {
  if (!openai || process.env.PAUSE_OPENAI_API === "true") {
    return fallbackPost(avatar, market.question, ev);
  }
  const expertise = Array.isArray(avatar.expertise)
    ? avatar.expertise.join(", ")
    : avatar.expertise || "markets";
  const system = `You are ${avatar.name}, a Knowledge Avatar on StreamAiX. You just placed a trade on a prediction market. Write a Twitter-style first-person post (1-2 short sentences, max 240 characters) explaining your trade rationale in your own voice. Be specific and confident, not generic. Trading style: ${avatar.tradingStyle || "balanced"}. Risk tolerance: ${avatar.riskTolerance || "moderate"}. Expertise: ${expertise}. Do not use hashtags or emojis.`;
  const user = `Market: "${market.question}"\nCategory: ${market.category || "general"}\nMy position: ${ev.outcome} (${ev.shares} shares, ${ev.positionSize} STREAM)\nMy raw reasoning notes: ${ev.reasoning}\n\nWrite the post now.`;
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 120,
    });
    const text = r.choices[0]?.message?.content?.trim();
    if (text && text.length > 10) return text.slice(0, 280);
  } catch (err) {
    console.error("[avatarCommentary] LLM error", err);
  }
  return fallbackPost(avatar, market.question, ev);
}

export async function recordTradeAsPost(ev: TradeEvent): Promise<AvatarPost | null> {
  try {
    const [avatar] = await db
      .select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.id, ev.avatarId))
      .limit(1);
    if (!avatar) return null;
    const [market] = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.id, ev.marketId))
      .limit(1);
    if (!market) return null;

    const body = await generateBody(avatar, market, ev);
    const [inserted] = await db
      .insert(avatarPosts)
      .values({
        avatarId: avatar.id,
        marketId: market.id,
        tradeId: ev.tradeId,
        action: "opened_position",
        outcome: ev.outcome,
        asset: market.category || null,
        body,
        metadata: {
          shares: ev.shares,
          positionSize: ev.positionSize,
          marketQuestion: market.question,
          avatarName: avatar.name,
          avatarHandle: avatar.handle,
          avatarImageUrl: avatar.imageUrl,
        },
      })
      .returning();

    broadcaster({
      type: "new_post",
      payload: hydratePost(inserted, avatar, market.question),
    });
    return inserted;
  } catch (err) {
    console.error("[avatarCommentary] recordTradeAsPost failed", err);
    return null;
  }
}

function hydratePost(
  post: AvatarPost,
  avatar?: { name: string; handle: string | null; imageUrl: string | null },
  marketQuestion?: string | null,
) {
  const meta = (post.metadata as any) || {};
  return {
    id: post.id,
    avatarId: post.avatarId,
    avatarName: avatar?.name || meta.avatarName || "Avatar",
    avatarHandle: avatar?.handle || meta.avatarHandle || null,
    avatarImageUrl: avatar?.imageUrl || meta.avatarImageUrl || null,
    marketId: post.marketId,
    marketQuestion: marketQuestion || meta.marketQuestion || null,
    action: post.action,
    outcome: post.outcome,
    asset: post.asset,
    body: post.body,
    likeCount: post.likeCount,
    replyCount: post.replyCount,
    parentPostId: post.parentPostId,
    authorUserId: post.authorUserId,
    createdAt: post.createdAt,
    metadata: meta,
  };
}

export async function listFeed(opts: {
  limit?: number;
  before?: string;
  avatarId?: string;
}) {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
  const where = [eq(avatarPosts.parentPostId, sql`NULL`)] as any[];
  // top-level only
  let q = db
    .select({
      post: avatarPosts,
      avatarName: knowledgeAvatars.name,
      avatarHandle: knowledgeAvatars.handle,
      avatarImage: knowledgeAvatars.imageUrl,
      marketQuestion: predictionMarkets.question,
    })
    .from(avatarPosts)
    .leftJoin(knowledgeAvatars, eq(avatarPosts.avatarId, knowledgeAvatars.id))
    .leftJoin(predictionMarkets, eq(avatarPosts.marketId, predictionMarkets.id))
    .where(sql`${avatarPosts.parentPostId} IS NULL`)
    .orderBy(desc(avatarPosts.createdAt))
    .limit(limit);

  const rows = await q;
  let filtered = rows;
  if (opts.avatarId) {
    filtered = rows.filter((r) => r.post.avatarId === opts.avatarId);
  }
  if (opts.before) {
    const beforeRow = await db
      .select({ createdAt: avatarPosts.createdAt })
      .from(avatarPosts)
      .where(eq(avatarPosts.id, opts.before))
      .limit(1);
    const cutoff = beforeRow[0]?.createdAt;
    if (cutoff) {
      filtered = filtered.filter((r) => r.post.createdAt && r.post.createdAt < cutoff);
    }
  }
  return filtered.map((r) =>
    hydratePost(
      r.post,
      r.avatarName
        ? { name: r.avatarName, handle: r.avatarHandle, imageUrl: r.avatarImage }
        : undefined,
      r.marketQuestion,
    ),
  );
}

export async function listReplies(postId: string) {
  const rows = await db
    .select({
      post: avatarPosts,
      avatarName: knowledgeAvatars.name,
      avatarHandle: knowledgeAvatars.handle,
      avatarImage: knowledgeAvatars.imageUrl,
    })
    .from(avatarPosts)
    .leftJoin(knowledgeAvatars, eq(avatarPosts.avatarId, knowledgeAvatars.id))
    .where(eq(avatarPosts.parentPostId, postId))
    .orderBy(avatarPosts.createdAt);
  return rows.map((r) =>
    hydratePost(
      r.post,
      r.avatarName
        ? { name: r.avatarName, handle: r.avatarHandle, imageUrl: r.avatarImage }
        : undefined,
    ),
  );
}

export async function toggleLike(postId: string, userId: string) {
  const existing = await db
    .select()
    .from(avatarPostReactions)
    .where(
      and(
        eq(avatarPostReactions.postId, postId),
        eq(avatarPostReactions.userId, userId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(avatarPostReactions)
      .where(eq(avatarPostReactions.id, existing[0].id));
    await db
      .update(avatarPosts)
      .set({ likeCount: sql`GREATEST(${avatarPosts.likeCount} - 1, 0)` })
      .where(eq(avatarPosts.id, postId));
    const [post] = await db
      .select({ likeCount: avatarPosts.likeCount })
      .from(avatarPosts)
      .where(eq(avatarPosts.id, postId));
    broadcaster({
      type: "like_updated",
      payload: { postId, likeCount: post?.likeCount ?? 0 },
    });
    return { liked: false, likeCount: post?.likeCount ?? 0 };
  }
  await db
    .insert(avatarPostReactions)
    .values({ postId, userId, reactionType: "like" });
  await db
    .update(avatarPosts)
    .set({ likeCount: sql`${avatarPosts.likeCount} + 1` })
    .where(eq(avatarPosts.id, postId));
  const [post] = await db
    .select({ likeCount: avatarPosts.likeCount })
    .from(avatarPosts)
    .where(eq(avatarPosts.id, postId));
  broadcaster({
    type: "like_updated",
    payload: { postId, likeCount: post?.likeCount ?? 0 },
  });
  return { liked: true, likeCount: post?.likeCount ?? 0 };
}

export async function postUserReply(
  postId: string,
  userId: string,
  message: string,
): Promise<{ userReply: any; avatarReply: any }> {
  const [parent] = await db
    .select()
    .from(avatarPosts)
    .where(eq(avatarPosts.id, postId))
    .limit(1);
  if (!parent) throw new Error("Post not found");

  const [userReply] = await db
    .insert(avatarPosts)
    .values({
      avatarId: parent.avatarId,
      marketId: parent.marketId,
      action: "user_reply",
      body: message.slice(0, 600),
      parentPostId: postId,
      authorUserId: userId,
      metadata: { isUserReply: true },
    })
    .returning();
  await db
    .update(avatarPosts)
    .set({ replyCount: sql`${avatarPosts.replyCount} + 1` })
    .where(eq(avatarPosts.id, postId));
  broadcaster({ type: "new_reply", payload: hydratePost(userReply) });

  let avatarReply: any = null;
  try {
    const { generateAvatarChatResponse } = await import("./avatarChatService");
    const ctx = `In reply to your earlier post: "${parent.body}"\n\nUser asks: ${message}`;
    const r = await generateAvatarChatResponse(parent.avatarId, userId, ctx);
    const [inserted] = await db
      .insert(avatarPosts)
      .values({
        avatarId: parent.avatarId,
        marketId: parent.marketId,
        action: "avatar_reply",
        body: r.response.slice(0, 600),
        parentPostId: postId,
        metadata: { inReplyToUser: userId },
      })
      .returning();
    await db
      .update(avatarPosts)
      .set({ replyCount: sql`${avatarPosts.replyCount} + 1` })
      .where(eq(avatarPosts.id, postId));
    avatarReply = hydratePost(inserted);
    broadcaster({ type: "new_reply", payload: avatarReply });
  } catch (err) {
    console.error("[avatarCommentary] avatar reply generation failed", err);
  }

  return { userReply: hydratePost(userReply), avatarReply };
}

/**
 * Backfill posts from recent avatar trades so the feed isn't empty on first
 * load. Runs once at startup, only when the posts table is empty.
 */
export async function backfillFromRecentTrades(maxPosts = 30): Promise<number> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(avatarPosts);
    if ((count ?? 0) > 0) return 0;

    const { avatarTrades } = await import("@shared/schema");
    const trades = await db
      .select({
        trade: avatarTrades,
        avatar: knowledgeAvatars,
        market: predictionMarkets,
      })
      .from(avatarTrades)
      .leftJoin(knowledgeAvatars, eq(avatarTrades.avatarId, knowledgeAvatars.id))
      .leftJoin(predictionMarkets, eq(avatarTrades.marketId, predictionMarkets.id))
      .orderBy(desc(avatarTrades.createdAt))
      .limit(maxPosts);

    let inserted = 0;
    for (const row of trades) {
      if (!row.avatar || !row.market) continue;
      // Use deterministic templated body for backfill (no LLM cost on 30 posts).
      const body = `Opened a ${row.trade.outcome} position on "${row.market.question}" — ${row.trade.shares} shares for ${row.trade.streamAmount} STREAM. ${row.trade.reasoning || ""}`.trim();
      await db.insert(avatarPosts).values({
        avatarId: row.avatar.id,
        marketId: row.market.id,
        tradeId: row.trade.id,
        action: "opened_position",
        outcome: row.trade.outcome,
        asset: row.market.category || null,
        body: body.slice(0, 280),
        createdAt: row.trade.createdAt,
        metadata: {
          shares: row.trade.shares,
          positionSize: row.trade.streamAmount,
          marketQuestion: row.market.question,
          avatarName: row.avatar.name,
          avatarHandle: row.avatar.handle,
          avatarImageUrl: row.avatar.imageUrl,
          backfilled: true,
        },
      });
      inserted++;
    }
    if (inserted > 0) {
      console.log(`[avatarCommentary] Backfilled ${inserted} posts from recent trades`);
    }
    return inserted;
  } catch (err) {
    console.error("[avatarCommentary] backfill failed", err);
    return 0;
  }
}
