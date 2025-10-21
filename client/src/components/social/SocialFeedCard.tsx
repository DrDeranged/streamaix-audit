import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Bookmark,
  Trophy,
  TrendingUp,
  FileText,
  ChevronDown,
  Send,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Newspaper
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SocialFeedCardProps {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary';
  content: {
    title: string;
    description?: string;
    author?: { id: string; username: string };
    createdAt: string;
    metadata?: any;
  };
  engagement: {
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean;
    isSaved?: boolean;
  };
}

export function SocialFeedCard({ id, type, content, engagement }: SocialFeedCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(engagement.likesCount);
  const [isLiked, setIsLiked] = useState(engagement.isLiked || false);
  const [isSaved, setIsSaved] = useState(engagement.isSaved || false);

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
      toast({ title: 'Failed to like', variant: 'destructive' });
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => apiRequest(`/api/${type}s/${id}/save`, { method: 'POST' }),
    onMutate: async () => {
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
      toast({ title: 'Failed to save', variant: 'destructive' });
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
      toast({ title: 'Comment posted!' });
    },
    onError: () => {
      toast({ title: 'Failed to comment', variant: 'destructive' });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in to like', variant: 'destructive' });
      return;
    }
    likeMutation.mutate();
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in to save', variant: 'destructive' });
      return;
    }
    saveMutation.mutate();
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in to comment', variant: 'destructive' });
      return;
    }
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'bounty': return <Trophy className="w-3 h-3 text-fuchsia-400" />;
      case 'market': return <TrendingUp className="w-3 h-3 text-cyan-400" />;
      case 'summary': return <FileText className="w-3 h-3 text-purple-400" />;
      default: return <MessageCircle className="w-3 h-3 text-purple-400" />;
    }
  };

  const getLink = () => {
    switch (type) {
      case 'bounty': return `/bounties/${id}`;
      case 'market': return `/markets/${id}`;
      case 'summary': return `/summary/${id}`;
      default: return '#';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-purple-500/20 hover:border-fuchsia-500/40 rounded-lg transition-all"
      data-testid={`social-card-${type}-${id}`}
    >
      <div className="p-2.5">
        {/* Header */}
        <div className="flex items-start gap-2 mb-1.5">
          <Link href={`/hunter/${content.author?.id || 'anon'}`}>
            <Avatar className="w-7 h-7 cursor-pointer ring-1 ring-purple-500/20">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs">
                {(content.author?.username || 'AI')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Link href={`/hunter/${content.author?.id || 'anon'}`}>
                <span className="text-xs font-semibold text-white hover:text-fuchsia-400 cursor-pointer">
                  @{content.author?.username || 'AI Hunter'}
                </span>
              </Link>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {getTypeIcon()}
                <span className="text-[10px] text-purple-300 capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Link href={getLink()}>
          <div className="mb-1.5 cursor-pointer pl-9">
            <h3 className="text-sm font-semibold text-white mb-0.5 hover:text-fuchsia-400 line-clamp-1">
              {content.title}
            </h3>
            {content.description && (
              <p className="text-xs text-gray-400 line-clamp-1">
                {content.description}
              </p>
            )}
            
            {/* Type-specific metadata */}
            {content.metadata && (
              <div className="mt-1 flex items-center gap-2 text-[10px]">
                {(type === 'macro' || type === 'crypto') && (
                  <>
                    {content.metadata.category && (
                      <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-medium">
                        {content.metadata.category}
                      </span>
                    )}
                    {content.metadata.url && (
                      <a 
                        href={content.metadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Read Full Story
                      </a>
                    )}
                  </>
                )}
                {type === 'bounty' && (
                  <>
                    <span className="text-fuchsia-400 font-semibold flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" />
                      {content.metadata.reward} STREAM
                    </span>
                    <span className="text-gray-400 capitalize">{content.metadata.status}</span>
                  </>
                )}
                {type === 'market' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400 font-medium">
                      YES {Math.round(((content.metadata.yesPrice || 500000) / 1000000) * 100)}%
                    </span>
                    <span className="text-red-400 font-medium">
                      NO {Math.round((1 - ((content.metadata.yesPrice || 500000) / 1000000)) * 100)}%
                    </span>
                  </div>
                )}
                {type === 'summary' && content.metadata.duration && (
                  <span className="text-gray-400">{content.metadata.duration}</span>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Engagement Stats */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1.5 pl-9">
          <span>{likesCount} likes</span>
          <span>•</span>
          <span>{engagement.commentsCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 pb-1.5 border-b border-purple-500/10 pl-9">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex-1 gap-1 h-6 text-[10px] ${isLiked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500`}
            data-testid={`button-like-${id}`}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 gap-1 h-6 text-[10px] text-gray-400 hover:text-cyan-500"
            data-testid={`button-comment-${id}`}
          >
            <MessageCircle className="w-2.5 h-2.5" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={`flex-1 gap-1 h-6 text-[10px] ${isSaved ? 'text-purple-400' : 'text-gray-400'} hover:text-purple-400`}
            data-testid={`button-save-${id}`}
          >
            <Bookmark className={`w-2.5 h-2.5 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-2 pl-9">
            {/* Comment Input */}
            {isAuthenticated && (
              <div className="flex gap-2 mb-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] text-xs bg-white/5 border-purple-500/20 focus:border-fuchsia-500/40"
                  data-testid={`input-comment-${id}`}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 h-[60px]"
                  data-testid={`button-submit-comment-${id}`}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-2">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2 p-2 rounded bg-white/5 border border-purple-500/10">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-purple-500/20 text-xs">
                      {(comment.user?.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-white">
                        @{comment.user?.username || 'User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
