import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Heart, Reply, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  parentId?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
}

interface CommentSectionProps {
  entityType: "bounty" | "market" | "summary" | "avatar" | "story";
  entityId: string;
  className?: string;
}

export function CommentSection({ entityType, entityId, className = "" }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Build the link field name based on entity type
  const linkField = `linked${entityType.charAt(0).toUpperCase() + entityType.slice(1)}Id`;

  // Fetch comments for this entity
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/conversations/comments", entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/comments?${linkField}=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      if (!isAuthenticated) throw new Error("Please sign in to comment");
      
      const payload: any = {
        content: data.content,
        [linkField]: entityId,
      };
      
      if (data.parentId) {
        payload.parentId = data.parentId;
      }

      return apiRequest(`/api/conversations`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/comments", entityType, entityId] });
      setNewComment("");
      setReplyTo(null);
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest(`/api/conversations/${commentId}/like`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/comments", entityType, entityId] });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({ content: newComment, parentId: replyTo || undefined });
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: string) => comments.filter(c => c.parentId === commentId);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-full blur-md opacity-50" />
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discussion
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
        </div>
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <div className="neural-glass p-4 rounded-xl border border-gray-200 dark:border-purple-500/30">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {replyTo && (
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Reply className="w-4 h-4" />
                  <span>Replying to comment</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] bg-white/50 dark:bg-slate-900/50 border-gray-300 dark:border-purple-500/30 focus:ring-purple-500 dark:focus:ring-purple-400"
                data-testid="input-comment"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90"
                  data-testid="button-submit-comment"
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="neural-glass p-6 rounded-xl border border-gray-200 dark:border-purple-500/30 text-center">
          <p className="text-gray-600 dark:text-slate-400">
            Please sign in to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-slate-600 mb-3" />
            <p className="text-gray-600 dark:text-slate-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {topLevelComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                replies={getReplies(comment.id)}
                onLike={() => likeCommentMutation.mutate(comment.id)}
                onReply={() => setReplyTo(comment.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface CommentCardProps {
  comment: Comment;
  replies: Comment[];
  onLike: () => void;
  onReply: () => void;
  isAuthenticated: boolean;
  isReply?: boolean;
}

function CommentCard({ comment, replies, onLike, onReply, isAuthenticated, isReply = false }: CommentCardProps) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`neural-glass p-4 rounded-xl border border-gray-200 dark:border-purple-500/20 ${
        isReply ? "ml-12" : ""
      }`}
      data-testid={`comment-${comment.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-purple-500/20">
          <AvatarImage src={comment.author?.avatar} alt={comment.author?.username} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-fuchsia-400 text-white text-sm">
            {comment.author?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          {/* Author & timestamp */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {comment.author?.username || "Anonymous"}
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={onLike}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                comment.isLiked
                  ? "text-pink-500 dark:text-pink-400"
                  : "text-gray-600 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400"
              } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid={`button-like-${comment.id}`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? "fill-current" : ""}`} />
              <span>{comment.likesCount}</span>
            </button>

            <button
              onClick={onReply}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors ${
                !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-testid={`button-reply-${comment.id}`}
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              </button>
            )}
          </div>

          {/* Nested replies */}
          {showReplies && replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  onLike={() => {}}
                  onReply={() => {}}
                  isAuthenticated={isAuthenticated}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
