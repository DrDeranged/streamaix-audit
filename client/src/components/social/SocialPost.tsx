import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import Surface from '@/components/ds/Surface';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  DollarSign, 
  Trophy,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SocialPostProps {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary';
  title: string;
  content?: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  metadata?: any;
}

export function SocialPost({ 
  id, 
  type, 
  title, 
  content, 
  author, 
  createdAt, 
  likesCount: initialLikes, 
  commentsCount: initialCommentsCount,
  isLiked: initialIsLiked,
  metadata 
}: SocialPostProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  // Fetch comments when expanded
  const { data: commentsData } = useQuery({
    queryKey: [`/api/${type}s/${id}/comments`],
    enabled: showComments,
  });

  const comments = (commentsData as any)?.comments || [];

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/${type}s/${id}/like`, { method: 'POST' }),
    onMutate: async () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      toast({
        title: 'Unable to like post',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/${type}s/${id}/comment`, { 
        method: 'POST',
        body: JSON.stringify({ content })
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      toast({
        title: 'Comment posted!',
      });
    },
    onError: () => {
      toast({
        title: 'Unable to post comment',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
        variant: 'destructive',
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment',
        variant: 'destructive',
      });
      return;
    }
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'bounty':
        return <Trophy className="w-3 h-3 text-warn" />;
      case 'market':
        return <BarChart3 className="w-3 h-3 text-gain" />;
      case 'summary':
        return <FileText className="w-3 h-3 text-accent-bright" />;
      default:
        return <MessageCircle className="w-3 h-3 text-accent-bright" />;
    }
  };

  const getPostLink = () => {
    switch (type) {
      case 'bounty':
        return `/bounties/${id}`;
      case 'market':
        return `/markets/${id}`;
      case 'summary':
        return `/summary/${id}`;
      default:
        return '#';
    }
  };

  return (
    <Surface className="transition-all duration-300 hover:border-accent-core/50">
      <div className="p-3">
        {/* Header - Author Info */}
        <div className="flex items-start gap-2 mb-2">
          <Link href={`/hunter/${author.id}`}>
            <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-accent-core/20 hover:ring-accent-core/50 transition-all">
              <AvatarFallback className="bg-accent-core text-primary text-xs">
                {author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/hunter/${author.id}`}>
                <span className="text-sm font-semibold text-primary hover:text-accent-bright transition-colors cursor-pointer" data-testid={`post-author-${id}`}>
                  @{author.username}
                </span>
              </Link>
              <span className="text-muted text-xs">•</span>
              <span className="text-muted text-xs" data-testid={`post-time-${id}`}>
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-accent-core/10 border border-accent-core/20">
                {getTypeIcon()}
                <span className="text-xs text-accent-bright capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <Link href={getPostLink()}>
          <div className="mb-2 cursor-pointer">
            <h3 className="text-sm font-semibold text-primary mb-1 hover:text-accent-bright transition-colors" data-testid={`post-title-${id}`}>
              {title}
            </h3>
            {content && (
              <p className="text-xs text-body line-clamp-2" data-testid={`post-content-${id}`}>
                {content}
              </p>
            )}
          </div>
        </Link>

        {/* Metadata */}
        {metadata && (
          <div className="mb-2 p-1.5 rounded-xl bg-ink-raised border border-ink-edge">
            {type === 'bounty' && (
              <div className="flex items-center gap-2 text-xs">
                <Trophy className="w-3 h-3 text-warn" />
                <span className="text-warn font-semibold tabular">{metadata.reward} STREAM</span>
                <span className="text-muted">•</span>
                <span className="text-secondary capitalize">{metadata.status}</span>
              </div>
            )}
            {type === 'market' && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gain tabular">YES: {((metadata.yesPrice || 5000) > 10000 ? 50 : Math.round((metadata.yesPrice || 5000) / 100))}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-loss tabular">NO: {((metadata.noPrice || 5000) > 10000 ? 50 : Math.round((metadata.noPrice || 5000) / 100))}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center gap-1 text-xs text-muted mb-2">
          <span data-testid={`post-likes-${id}`}>{likesCount} likes</span>
          <span>•</span>
          <span data-testid={`post-comments-${id}`}>{initialCommentsCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pb-2 border-b border-ink-divider">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`tap-target flex-1 gap-1.5 h-8 text-xs ${isLiked ? 'text-loss' : 'text-secondary'} hover:text-loss transition-colors`}
            data-testid={`button-like-${id}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="tap-target flex-1 gap-1.5 h-8 text-xs text-secondary hover:text-accent-bright transition-colors"
            data-testid={`button-comment-${id}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="tap-target flex-1 gap-1.5 h-8 text-xs text-secondary hover:text-accent-bright transition-colors"
            data-testid={`button-share-${id}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                toast({
                  title: 'Sign in required',
                  description: 'Please sign in to tip creators',
                  variant: 'destructive',
                });
                return;
              }
              toast({
                title: 'Tipping feature',
                description: 'Tip functionality coming soon!',
              });
            }}
            className="tap-target flex-1 gap-2 text-secondary hover:text-warn transition-colors"
            data-testid={`button-tip-${id}`}
          >
            <DollarSign className="w-4 h-4" />
            Tip
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3"
          >
            {/* Comment Input */}
            {isAuthenticated && (
              <div className="flex gap-2 mb-3">
                <Avatar className="w-8 h-8 ring-2 ring-accent-core/20">
                  <AvatarFallback className="bg-accent-core text-primary text-xs">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] rounded-xl bg-ink-raised border-ink-edge focus:border-accent-core/50 text-primary resize-none"
                    data-testid={`input-comment-${id}`}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="mt-2 rounded-xl grad-accent hover:bg-accent-deep glow-accent"
                    data-testid={`button-submit-comment-${id}`}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice(0, showComments ? undefined : 3).map((comment: any) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-7 h-7 ring-1 ring-accent-core/20">
                      <AvatarFallback className="bg-accent-core text-primary text-xs">
                        {comment.author?.username?.slice(0, 2).toUpperCase() || 'AN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-ink-raised rounded-xl p-2 border border-ink-edge">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary">
                            @{comment.author?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-body" data-testid={`comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <button className="text-xs text-muted hover:text-loss transition-colors">
                          <Heart className="w-3 h-3 inline mr-1" />
                          {comment.likesCount || 0}
                        </button>
                        <button className="text-xs text-muted hover:text-accent-bright transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Surface>
  );
}
