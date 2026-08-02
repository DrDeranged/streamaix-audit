import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, CheckCircle, Star, Eye, Heart, 
  MessageCircle, Gift, Share2, Bot, Sparkles, FileText, 
  ExternalLink, Award, X, Send, Reply,
  Bookmark, Zap, TrendingUp, Target,
  Copy, Twitter
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import type { Bounty } from '@shared/schema';

interface EnrichedBounty extends Bounty {
  summaryPreview?: string[];
  summaryTitle?: string;
  qualityScore?: number;
  completerUsername?: string;
  completerAvatar?: string;
  isAiCompleted?: boolean;
}

interface BountyComment {
  id: string;
  parentId?: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  likes: number;
  createdAt: string;
  replies?: BountyComment[];
}

interface CompletedBountyDetailModalProps {
  bounty: EnrichedBounty;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletedBountyDetailModal({ bounty, isOpen, onClose }: CompletedBountyDetailModalProps) {
  const { wallet, isConnected } = useWeb3();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch full summary content
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ summary: any }>({
    queryKey: ['/api/summaries', bounty.summaryId],
    enabled: !!bounty.summaryId && isOpen,
  });

  // Fetch quality score breakdown
  const { data: qualityData } = useQuery<{ score: number; breakdown: any }>({
    queryKey: ['/api/bounties', bounty.id, 'quality'],
    enabled: isOpen,
  });

  // Fetch engagement stats
  const { data: engagementData, refetch: refetchEngagement } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', bounty.id, 'engagement'],
    enabled: isOpen,
  });

  // Fetch all comments with replies
  const { data: commentsData, refetch: refetchComments, isLoading: commentsLoading } = useQuery<{ comments: BountyComment[] }>({
    queryKey: ['/api/bounties', bounty.id, 'comments'],
    enabled: isOpen,
  });

  // Fetch completer profile
  const { data: completerData } = useQuery<{ user: any }>({
    queryKey: ['/api/users', bounty.assigneeId],
    enabled: !!bounty.assigneeId && isOpen,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bounties/${bounty.id}/like`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setIsLiked(true);
      refetchEngagement();
      toast({
        title: 'Liked!',
        description: 'You liked this bounty submission.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like',
        variant: 'destructive',
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      return apiRequest(`/api/bounties/${bounty.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      refetchComments();
      refetchEngagement();
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    },
  });

  // Tip mutation
  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest(`/api/bounties/${bounty.id}/tip`, {
        method: 'POST',
        body: JSON.stringify({ 
          amount, 
          tipperWallet: wallet?.address,
          blockchainTxHash: `tip_${Date.now()}_${bounty.id}` 
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      setTipAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/bounties', bounty.id] });
      toast({
        title: 'Tip sent!',
        description: `You tipped ${tipAmount} $STREAM to the bounty completer.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send tip',
        variant: 'destructive',
      });
    },
  });

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/bounties/${bounty.id}`;
    const shareText = `Check out this completed bounty: ${bounty.title}`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Bounty link copied to clipboard.',
      });
    } else {
      try {
        await navigator.share({
          title: bounty.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Bounty link copied to clipboard.',
        });
      }
    }
  };

  const comments = commentsData?.comments || [];
  const summary = summaryData?.summary;
  const qualityScore = qualityData?.score || bounty.qualityScore || 0;
  const completer = completerData?.user;

  // Parse summary content for display
  const summaryContent = summary?.summary || summary?.executiveSummary || '';
  const keyInsights = summary?.keyInsights || bounty.summaryPreview || [];
  const actionItems = summary?.actionItems || [];
  const sources = summary?.sources || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl p-0 bg-ink-surface border-ink-edge overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ink-surface/95 backdrop-blur-xl border-b border-ink-divider px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gain/10 text-gain border-gain/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
                {bounty.category && (
                  <Badge variant="outline" className="border-accent-core/40 text-accent-bright">
                    {bounty.category}
                  </Badge>
                )}
                {qualityScore >= 90 && (
                  <Badge className="bg-warn/10 text-warn border-warn/30">
                    <Award className="w-3 h-3 mr-1" />
                    Top Quality
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-primary line-clamp-2" data-testid="modal-bounty-title">
                {bounty.title}
              </h2>
              {bounty.completedAt && (
                <p className="text-sm text-secondary mt-1">
                  Completed {formatDistanceToNow(new Date(bounty.completedAt), { addSuffix: true })}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-secondary hover:text-primary hover:bg-ink-raised"
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-gain">
              <Trophy className="w-4 h-4" />
              <span className="font-semibold">{(bounty.reward || 0).toLocaleString()} $STREAM</span>
            </div>
            <div className="flex items-center gap-1.5 text-accent-bright">
              <Eye className="w-4 h-4" />
              <span>{engagementData?.views || 0} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-loss">
              <Heart className="w-4 h-4" />
              <span>{engagementData?.likes || 0} likes</span>
            </div>
            <div className="flex items-center gap-1.5 text-accent-bright">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length} comments</span>
            </div>
            {qualityScore > 0 && (
              <div className="flex items-center gap-1.5 text-warn">
                <Star className="w-4 h-4" />
                <span>{qualityScore}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content - with always visible scrollbar */}
        <div className="flex-1 max-h-[calc(90vh-180px)] overflow-y-auto scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3DD68C #181F38' }}>
          <div className="px-6 py-4 space-y-6">
            {/* Winner Section */}
            <Surface variant="raised" className="border border-gain/30 p-4">
              <div className="flex items-center gap-4">
                {bounty.isAiCompleted ? (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-accent-core/15 flex items-center justify-center">
                      <Bot className="w-7 h-7 text-accent-bright" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent-bright">AI Agent</span>
                        <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/40 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Autonomous
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary">AI-powered content analysis and summary generation</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar className="w-14 h-14 border-2 border-accent-core/50">
                      <AvatarImage src={completer?.avatar || bounty.completerAvatar} />
                      <AvatarFallback className="bg-accent-deep text-primary text-lg font-bold">
                        {bounty.completerUsername?.[0]?.toUpperCase() || 
                         bounty.claimerWallet?.slice(2, 4).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent-bright">
                          {bounty.completerUsername ? `@${bounty.completerUsername}` : 
                           bounty.claimerWallet ? `${bounty.claimerWallet.slice(0, 8)}...${bounty.claimerWallet.slice(-6)}` : 
                           'Anonymous Hunter'}
                        </span>
                        {completer?.reputation && completer.reputation >= 1000 && (
                          <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/40 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Top Hunter
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
                        {completer?.reputation && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {completer.reputation} rep
                          </span>
                        )}
                        {completer?.bountiesCompleted && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {completer.bountiesCompleted} bounties
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gain">
                    <Trophy className="w-5 h-5" />
                  <StatValue label="" value={bounty.reward} valueClassName="text-gain text-2xl font-bold" />
                  </div>
                  <span className="text-sm text-secondary">$STREAM earned</span>
                </div>
              </div>
            </Surface>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-ink-raised border border-ink-edge p-1 rounded-xl">
                <TabsTrigger 
                  value="summary" 
                  className="flex-1 data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:glow-accent"
                  data-testid="tab-summary"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Full Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="comments" 
                  className="flex-1 data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:glow-accent"
                  data-testid="tab-comments"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Comments ({comments.length})
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-4 space-y-6">
                {summaryLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-ink-raised border-ink-edge rounded-xl rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Executive Summary */}
                    {summaryContent && (
                      <div className="space-y-3">
                        <SectionTitle as="h3" className="text-lg font-semibold text-primary flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gain" />
                          Executive Summary
                        </SectionTitle>
                        <Surface variant="raised" className="border border-gain/20 p-4">
                          <p className="text-body leading-relaxed whitespace-pre-wrap">
                            {summaryContent}
                          </p>
                        </Surface>
                      </div>
                    )}

                    {/* Key Insights */}
                    {keyInsights.length > 0 && (
                      <div className="space-y-3">
                        <SectionTitle as="h3" className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-accent-bright" />
                          Key Insights
                        </SectionTitle>
                        <Surface variant="raised" className="border border-accent-core/20 p-4">
                          <ul className="space-y-3">
                            {keyInsights.map((insight: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-accent-core/20 text-accent-bright rounded-full flex items-center justify-center text-sm font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-body">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </Surface>
                      </div>
                    )}

                    {/* Action Items */}
                    {actionItems.length > 0 && (
                      <div className="space-y-3">
                        <SectionTitle as="h3" className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Target className="w-5 h-5 text-warn" />
                          Action Items
                        </SectionTitle>
                        <Surface variant="raised" className="border border-warn/20 p-4">
                          <ul className="space-y-2">
                            {actionItems.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-warn mt-1 flex-shrink-0" />
                                <span className="text-body">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </Surface>
                      </div>
                    )}

                    {/* Quality Score Breakdown */}
                    {qualityData?.breakdown && (
                      <div className="space-y-3">
                        <SectionTitle as="h3" className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Star className="w-5 h-5 text-warn" />
                          Quality Score: {qualityScore}/100
                        </SectionTitle>
                        <Surface variant="raised" className="border border-warn/20 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(qualityData.breakdown).map(([key, value]: [string, any]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-warn font-medium">{value}%</span>
                                </div>
                                <div className="h-2 bg-ink-raised rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-warn rounded-full transition-all"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </Surface>
                      </div>
                    )}

                    {/* Sources */}
                    {sources.length > 0 && (
                      <div className="space-y-3">
                        <SectionTitle as="h3" className="text-lg font-semibold text-primary flex items-center gap-2">
                          <ExternalLink className="w-5 h-5 text-accent-bright" />
                          Sources
                        </SectionTitle>
                        <Surface variant="raised" className="border border-accent-core/20 p-4">
                          <ul className="space-y-2">
                            {sources.map((source: string, idx: number) => (
                              <li key={idx}>
                                <a 
                                  href={source} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-accent-bright hover:text-accent-bright hover:underline text-sm flex items-center gap-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {source}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </Surface>
                      </div>
                    )}

                    {/* Bounty Description */}
                    {bounty.description && (
                      <div className="space-y-3">
                        <SectionTitle as="h3">Original Bounty Request</SectionTitle>
                        <Surface variant="raised" className="border border-ink-edge p-4">
                          <p className="text-secondary text-sm">{bounty.description}</p>
                        </Surface>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="mt-4 space-y-4">
                {/* Add Comment */}
                {isAuthenticated ? (
                  <div className="bg-ink-raised border-ink-edge rounded-xl border border-blue-500/20 rounded-xl p-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts on this submission..."
                      className="bg-ink-page border-ink-edge text-primary resize-none mb-3"
                      rows={3}
                      data-testid="input-new-comment"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => newComment.trim() && commentMutation.mutate({ content: newComment })}
                        disabled={!newComment.trim() || commentMutation.isPending}
                        className="grad-accent hover:bg-accent-deep"
                        data-testid="button-post-comment"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ink-surface border-ink-edge rounded-xl border border-ink-edge rounded-xl p-4 text-center">
                    <p className="text-secondary">Sign in to join the discussion</p>
                  </div>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-ink-raised border-ink-edge rounded-xl rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-primary mb-2">No comments yet</h4>
                    <p className="text-secondary">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-ink-raised border border-ink-edge rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-accent-deep text-primary font-bold">
                              {comment.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-accent-bright">@{comment.username}</span>
                              <span className="text-xs text-muted">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-body text-sm whitespace-pre-wrap">{comment.content}</p>
                            
                            {/* Comment Actions */}
                            <div className="flex items-center gap-4 mt-3">
                              <button className="flex items-center gap-1 text-xs text-muted hover:text-loss transition-colors">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{comment.likes || 0}</span>
                              </button>
                              {isAuthenticated && (
                                <button 
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="flex items-center gap-1 text-xs text-muted hover:text-accent-bright transition-colors"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                  <span>Reply</span>
                                </button>
                              )}
                            </div>

                            {/* Reply Form */}
                            <AnimatePresence>
                              {replyingTo === comment.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 overflow-hidden"
                                >
                                  <div className="flex gap-2">
                                    <Input
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder={`Reply to @${comment.username}...`}
                                      className="flex-1 bg-ink-page border-ink-edge text-primary text-sm"
                                      data-testid={`input-reply-${comment.id}`}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => replyContent.trim() && commentMutation.mutate({ content: replyContent, parentId: comment.id })}
                                      disabled={!replyContent.trim() || commentMutation.isPending}
                                      className="bg-accent-core hover:bg-accent-deep"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 space-y-3 pl-4 border-l-2 border-ink-divider">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <Avatar className="w-7 h-7">
                                      <AvatarImage src={reply.avatar} />
                                      <AvatarFallback className="bg-accent-core text-primary text-xs font-bold">
                                        {reply.username?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-accent-bright">@{reply.username}</span>
                                        <span className="text-xs text-muted">
                                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-secondary text-sm">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 bg-ink-surface/95 backdrop-blur-xl border-t border-gain/30 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Social Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending || !isAuthenticated}
                className={`tap-target ${isLiked ? 'border-pink-500 bg-pink-500/20 text-loss' : 'border-loss/30 hover:bg-loss/10 hover:border-loss/50'}`}
                data-testid="button-like-bounty"
              >
                <Heart className={`w-4 h-4 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`tap-target ${isBookmarked ? 'border-amber-500 bg-warn/10 text-warn' : 'border-warn/30 hover:bg-warn/10 hover:border-amber-500/50'}`}
                data-testid="button-bookmark-bounty"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>

              {/* Share Dropdown */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare()}
                  className="tap-target border-gain/30 hover:bg-gain/10 hover:border-gain/50"
                  data-testid="button-share-bounty"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('twitter')}
                  className="w-8 h-8 border-accent-core/30 hover:bg-accent-core/10"
                >
                  <Twitter className="w-3.5 h-3.5 text-accent-bright" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('copy')}
                  className="w-8 h-8 border-ink-edge hover:bg-ink-raised"
                >
                  <Copy className="w-3.5 h-3.5 text-secondary" />
                </Button>
              </div>
            </div>

            {/* Tip Section */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-ink-raised border-ink-edge rounded-xl border border-warn/30 rounded-xl px-2">
                <Gift className="w-4 h-4 text-warn" />
                <Input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="0"
                  className="w-20 bg-transparent border-0 text-primary text-center p-1 focus-visible:ring-0"
                  min="1"
                  data-testid="input-tip-amount"
                />
                <span className="text-warn text-sm">$STREAM</span>
              </div>
              {[10, 25, 50].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setTipAmount(amount.toString())}
                  className="border-warn/30 hover:bg-warn/10 text-warn px-2"
                >
                  {amount}
                </Button>
              ))}
              <Button
                onClick={() => tipAmount && tipMutation.mutate(parseFloat(tipAmount))}
                disabled={!tipAmount || !isConnected || tipMutation.isPending}
                className="grad-accent hover:bg-accent-deep"
                data-testid="button-send-tip"
              >
                {tipMutation.isPending ? 'Sending...' : 'Send Tip'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
