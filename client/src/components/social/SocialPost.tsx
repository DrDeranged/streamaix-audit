import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
        return <Trophy className="w-3 h-3 text-fuchsia-400" />;
      case 'market':
        return <BarChart3 className="w-3 h-3 text-cyan-400" />;
      case 'summary':
        return <FileText className="w-3 h-3 text-purple-400" />;
      default:
        return <MessageCircle className="w-3 h-3 text-purple-400" />;
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
    <Card className="bg-white/5 dark:bg-white/5 backdrop-blur-md border border-purple-500/20 hover:border-fuchsia-500/40 transition-all duration-300">
      <div className="p-3">
        {/* Header - Author Info */}
        <div className="flex items-start gap-2 mb-2">
          <Link href={`/hunter/${author.id}`}>
            <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-purple-500/20 hover:ring-fuchsia-500/40 transition-all">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs">
                {author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/hunter/${author.id}`}>
                <span className="text-sm font-semibold text-white hover:text-fuchsia-400 transition-colors cursor-pointer" data-testid={`post-author-${id}`}>
                  @{author.username}
                </span>
              </Link>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-500 text-xs" data-testid={`post-time-${id}`}>
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {getTypeIcon()}
                <span className="text-xs text-purple-300 capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <Link href={getPostLink()}>
          <div className="mb-2 cursor-pointer">
            <h3 className="text-sm font-semibold text-white mb-1 hover:text-fuchsia-400 transition-colors" data-testid={`post-title-${id}`}>
              {title}
            </h3>
            {content && (
              <p className="text-xs text-gray-300 line-clamp-2" data-testid={`post-content-${id}`}>
                {content}
              </p>
            )}
          </div>
        </Link>

        {/* Metadata */}
        {metadata && (
          <div className="mb-2 p-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
            {type === 'bounty' && (
              <div className="flex items-center gap-2 text-xs">
                <Trophy className="w-3 h-3 text-fuchsia-400" />
                <span className="text-fuchsia-400 font-semibold">{metadata.reward} STREAM</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 capitalize">{metadata.status}</span>
              </div>
            )}
            {type === 'market' && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-green-400">YES: {Math.round((metadata.yesPrice || 0.5) * 100)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-400">NO: {Math.round((1 - (metadata.yesPrice || 0.5)) * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <span data-testid={`post-likes-${id}`}>{likesCount} likes</span>
          <span>•</span>
          <span data-testid={`post-comments-${id}`}>{initialCommentsCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pb-2 border-b border-purple-500/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex-1 gap-1.5 h-8 text-xs ${isLiked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500 transition-colors`}
            data-testid={`button-like-${id}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 gap-1.5 h-8 text-xs text-gray-400 hover:text-cyan-500 transition-colors"
            data-testid={`button-comment-${id}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs text-gray-400 hover:text-purple-500 transition-colors"
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
            className="flex-1 gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
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
                <Avatar className="w-8 h-8 ring-2 ring-purple-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] bg-white/5 border-purple-500/20 focus:border-fuchsia-500/40 text-white resize-none"
                    data-testid={`input-comment-${id}`}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
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
                    <Avatar className="w-7 h-7 ring-1 ring-purple-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-fuchsia-400 text-white text-xs">
                        {comment.author?.username?.slice(0, 2).toUpperCase() || 'AN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/5 rounded-lg p-2 border border-purple-500/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white">
                            @{comment.author?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300" data-testid={`comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <button className="text-xs text-gray-500 hover:text-pink-500 transition-colors">
                          <Heart className="w-3 h-3 inline mr-1" />
                          {comment.likesCount || 0}
                        </button>
                        <button className="text-xs text-gray-500 hover:text-cyan-500 transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
