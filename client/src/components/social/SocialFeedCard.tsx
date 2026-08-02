import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Surface from '@/components/ds/Surface';
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
  Send,
  ExternalLink,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MotionSurface = motion(Surface);

interface SocialFeedCardProps {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary' | 'macro' | 'crypto';
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
  const [showLikes, setShowLikes] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(engagement.likesCount);
  const [isLiked, setIsLiked] = useState(engagement.isLiked || false);
  const [isSaved, setIsSaved] = useState(engagement.isSaved || false);

  // Map types to correct API endpoints
  const getApiEndpoint = (endpoint: string) => {
    const baseType = (type === 'macro' || type === 'crypto') ? 'news' : type;
    const typeMap: Record<string, string> = {
      'bounty': 'bounties',
      'market': 'prediction-markets',
      'summary': 'summaries',
      'news': 'news'
    };
    return `/api/${typeMap[baseType]}/${id}/${endpoint}`;
  };
  
  // Fetch comments when expanded
  const { data: commentsData } = useQuery({
    queryKey: [getApiEndpoint('comments')],
    enabled: showComments,
  });

  // Fetch likes when dialog is open
  const { data: likesData } = useQuery({
    queryKey: [getApiEndpoint('likes')],
    enabled: showLikes,
  });

  const comments = (commentsData as any)?.comments || [];
  const likes = (likesData as any)?.likes || [];

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest(getApiEndpoint('like'), { method: 'POST' }),
    onMutate: async () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint('likes')] });
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      toast({ title: 'Unable to like', description: 'Please try again.', variant: 'destructive' });
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => apiRequest(getApiEndpoint('save'), { method: 'POST' }),
    onMutate: async () => {
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
      toast({ title: 'Unable to save', description: 'Please try again.', variant: 'destructive' });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(getApiEndpoint('comment'), { 
        method: 'POST',
        body: JSON.stringify({ content })
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint('comments')] });
      toast({ title: 'Comment posted!' });
    },
    onError: () => {
      toast({ title: 'Unable to post comment', description: 'Please try again.', variant: 'destructive' });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to like posts.', variant: 'destructive' });
      return;
    }
    likeMutation.mutate();
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to save posts.', variant: 'destructive' });
      return;
    }
    saveMutation.mutate();
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to comment.', variant: 'destructive' });
      return;
    }
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'bounty': return <Trophy className="w-3 h-3 text-warn" />;
      case 'market': return <TrendingUp className="w-3 h-3 text-gain" />;
      case 'summary': return <FileText className="w-3 h-3 text-accent-bright" />;
      default: return <MessageCircle className="w-3 h-3 text-accent-bright" />;
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
     <MotionSurface
       variant="panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
       className="border border-ink-edge bg-ink-surface transition-all hover:bg-ink-raised hover:border-accent-core/40 rounded-xl"
      data-testid={`social-card-${type}-${id}`}
    >
      <div className="p-2.5">
        {/* Header */}
        <div className="flex items-start gap-2 mb-1.5">
          <Link href={`/hunter/${content.author?.id || 'anon'}`}>
           <Avatar className="w-7 h-7 cursor-pointer ring-1 ring-accent-core/30">
             <AvatarFallback className="bg-accent-core text-primary text-xs">
                {(content.author?.username || 'AI')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Link href={`/hunter/${content.author?.id || 'anon'}`}>
                 <span className="text-xs font-semibold text-primary hover:text-accent-bright cursor-pointer">
                  @{content.author?.username || 'AI Hunter'}
                </span>
              </Link>
               <span className="text-muted text-xs">•</span>
               <span className="text-muted text-xs">
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
              </span>
               <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-accent-core/10 border border-accent-core/20">
                {getTypeIcon()}
                 <span className="text-[10px] text-accent-bright capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-1.5 pl-9">
          {(type === 'macro' || type === 'crypto') ? (
            // For news articles, title links to external URL
            <>
              {content.metadata?.url ? (
                <a 
                  href={content.metadata.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                   <h3 className="text-sm font-semibold text-primary mb-0.5 hover:text-accent-bright line-clamp-1 cursor-pointer">
                    {content.title}
                  </h3>
                </a>
              ) : (
                 <h3 className="text-sm font-semibold text-primary mb-0.5 line-clamp-1">
                  {content.title}
                </h3>
              )}
            </>
          ) : (
            // For other types, title links to internal page
            <Link href={getLink()}>
               <h3 className="text-sm font-semibold text-primary mb-0.5 hover:text-accent-bright line-clamp-1 cursor-pointer">
                {content.title}
              </h3>
            </Link>
          )}
          
          {content.description && (
             <p className="text-xs text-secondary line-clamp-1">
              {content.description}
            </p>
          )}
          
          {/* Type-specific metadata */}
          {content.metadata && (
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              {(type === 'macro' || type === 'crypto') && (
                <>
                  {content.metadata.category && (
                     <span className="px-1.5 py-0.5 rounded-xl bg-accent-core/20 text-accent-bright font-medium">
                      {content.metadata.category}
                    </span>
                  )}
                  {content.metadata.url && (
                    <a 
                      href={content.metadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                       className="flex items-center gap-0.5 text-accent-bright hover:text-primary"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      Read Full Story
                    </a>
                  )}
                </>
              )}
              {type === 'bounty' && (
                <>
                   <span className="text-accent-bright font-semibold flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" />
                    {content.metadata.reward} STREAM
                  </span>
                   <span className="text-secondary capitalize">{content.metadata.status}</span>
                </>
              )}
              {type === 'market' && (
                <div className="flex items-center gap-1.5">
                   <span className="text-gain font-medium tabular">
                    YES {((content.metadata.yesPrice || 5000) > 10000 ? 50 : (content.metadata.yesPrice || 5000) / 100).toFixed(0)}%
                  </span>
                   <span className="text-loss font-medium tabular">
                    NO {((content.metadata.noPrice || 5000) > 10000 ? 50 : (content.metadata.noPrice || 5000) / 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {type === 'summary' && content.metadata.duration && (
                 <span className="text-secondary">{content.metadata.duration}</span>
              )}
            </div>
          )}
        </div>

        {/* Engagement Stats */}
         <div className="flex items-center gap-1.5 text-[10px] text-muted mb-1.5 pl-9">
          <Dialog open={showLikes} onOpenChange={setShowLikes}>
            <DialogTrigger asChild>
              <button
                 className="hover:text-accent-bright hover:underline cursor-pointer"
                data-testid={`link-likes-${id}`}
              >
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </button>
            </DialogTrigger>
             <DialogContent className="bg-ink-surface border border-ink-edge rounded-2xl max-w-md">
              <DialogHeader>
               <DialogTitle className="text-primary flex items-center gap-2">
                   <Users className="w-4 h-4 text-accent-bright" />
                  Liked by
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {likes.length === 0 ? (
                   <p className="text-muted text-sm text-center py-8">No likes yet</p>
                ) : (
                  likes.map((like: any) => (
                    <Link key={like.id} href={`/hunter/${like.id}`}>
                       <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-ink-raised cursor-pointer transition-colors">
                         <Avatar className="w-8 h-8 ring-1 ring-accent-core/30">
                           <AvatarFallback className="bg-accent-core text-primary text-xs">
                            {(like.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                           <p className="text-sm font-medium text-primary">@{like.username}</p>
                           <p className="text-xs text-muted">
                            {formatDistanceToNow(new Date(like.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <span>•</span>
          <button
            onClick={() => setShowComments(!showComments)}
             className="hover:text-accent-bright hover:underline cursor-pointer"
            data-testid={`link-comments-${id}`}
          >
            {engagement.commentsCount} {engagement.commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Action Buttons */}
         <div className="flex items-center gap-0.5 pb-1.5 border-b border-ink-divider pl-9">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
             className={`tap-target flex-1 gap-1 h-6 text-[10px] ${isLiked ? 'text-loss' : 'text-secondary'} hover:text-loss`}
            data-testid={`button-like-${id}`}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
             className="tap-target flex-1 gap-1 h-6 text-[10px] text-secondary hover:text-accent-bright"
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
             className={`tap-target flex-1 gap-1 h-6 text-[10px] ${isSaved ? 'text-accent-bright' : 'text-secondary'} hover:text-accent-bright`}
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
                   className="min-h-[60px] text-xs bg-ink-raised border-ink-edge focus:border-accent-core/40 rounded-xl"
                  data-testid={`input-comment-${id}`}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  size="sm"
                   className="grad-accent h-[60px] rounded-xl"
                  data-testid={`button-submit-comment-${id}`}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-2">
              {comments.map((comment: any) => (
                 <div key={comment.id} className="flex gap-2 p-2 rounded-xl bg-ink-raised border border-ink-divider">
                  <Avatar className="w-6 h-6">
                     <AvatarFallback className="bg-accent-core/20 text-primary text-xs">
                      {(comment.user?.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                       <span className="text-xs font-semibold text-primary">
                        @{comment.user?.username || 'User'}
                      </span>
                       <span className="text-xs text-muted">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                     <p className="text-xs text-body">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
     </MotionSurface>
  );
}
