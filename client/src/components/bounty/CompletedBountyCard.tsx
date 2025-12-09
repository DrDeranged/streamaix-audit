import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Trophy, DollarSign, User, CheckCircle, Star, Eye, Heart, 
  MessageCircle, Gift, Share2, Bot, Sparkles, FileText, 
  ExternalLink, Award, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { useEngagement } from '@/hooks/useEngagement';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
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
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface CompletedBountyCardProps {
  bounty: EnrichedBounty;
}

export default function CompletedBountyCard({ bounty }: CompletedBountyCardProps) {
  const { wallet, isConnected } = useWeb3();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState('');
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Fetch quality score
  const { data: qualityData } = useQuery<{ score: number; breakdown: any }>({
    queryKey: ['/api/bounties', bounty.id, 'quality'],
  });

  // Fetch engagement stats
  const { data: engagementData, refetch: refetchEngagement } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', bounty.id, 'engagement'],
  });

  // Fetch comments
  const { data: commentsData, refetch: refetchComments } = useQuery<{ comments: BountyComment[] }>({
    queryKey: ['/api/bounties', bounty.id, 'comments'],
  });

  // Fetch likes to check if current user liked
  const { data: likesData } = useQuery<{ likes: { userId: string }[] }>({
    queryKey: ['/api/bounties', bounty.id, 'likes'],
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
    mutationFn: async (content: string) => {
      return apiRequest(`/api/bounties/${bounty.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      setNewComment('');
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
      setShowTipDialog(false);
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: bounty.title,
        text: `Check out this completed bounty: ${bounty.title}`,
        url: `${window.location.origin}/bounties/${bounty.id}`,
      });
    } catch {
      await navigator.clipboard.writeText(`${window.location.origin}/bounties/${bounty.id}`);
      toast({
        title: 'Link copied!',
        description: 'Bounty link copied to clipboard.',
      });
    }
  };

  const comments = commentsData?.comments || [];
  const qualityScore = qualityData?.score || bounty.qualityScore;

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/30 backdrop-blur-sm overflow-hidden hover:border-green-500/50 transition-all">
      <div className="p-6 space-y-4">
        {/* Header with Completed Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/bounties/${bounty.id}`}>
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 hover:text-green-300 transition-colors cursor-pointer" data-testid={`completed-bounty-title-${bounty.id}`}>
                {bounty.title}
              </h3>
            </Link>
            {bounty.completedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Completed {formatDistanceToNow(new Date(bounty.completedAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
          <Badge className="border-green-500/50 bg-green-500/10 text-green-400" data-testid={`completed-badge-${bounty.id}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        </div>

        {/* Winner / Completer Info */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-lg">
          {bounty.isAiCompleted ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-cyan-300">AI Agent</span>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">Autonomous completion</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                {bounty.completerUsername?.[0]?.toUpperCase() || 
                 bounty.claimerWallet?.slice(2, 4).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-purple-300">
                  {bounty.completerUsername ? `@${bounty.completerUsername}` : 
                   bounty.claimerWallet ? `${bounty.claimerWallet.slice(0, 6)}...${bounty.claimerWallet.slice(-4)}` : 
                   'Anonymous'}
                </span>
                <p className="text-xs text-gray-400">Bounty Hunter</p>
              </div>
            </>
          )}
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{bounty.reward}</span>
            </div>
            <span className="text-xs text-gray-400">$STREAM earned</span>
          </div>
        </div>

        {/* Summary Preview */}
        {bounty.summaryPreview && bounty.summaryPreview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Key Insights</span>
            </div>
            <ul className="space-y-1.5 pl-2">
              {bounty.summaryPreview.slice(0, 3).map((point, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="line-clamp-2">{point}</span>
                </li>
              ))}
            </ul>
            {bounty.summaryPreview.length > 3 && (
              <Link href={`/bounties/${bounty.id}`}>
                <p className="text-xs text-green-400 font-medium hover:underline cursor-pointer">
                  +{bounty.summaryPreview.length - 3} more insights →
                </p>
              </Link>
            )}
          </div>
        )}

        {/* Quality Score */}
        {qualityScore && (
          <div className="flex items-center gap-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Star className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-yellow-400">{qualityScore}/100</span>
                {qualityScore >= 90 && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Top Quality
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 p-2 bg-slate-800/50 rounded-lg">
            <Eye className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-white">{engagementData?.views || 0}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-800/50 rounded-lg">
            <Heart className={`w-4 h-4 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-pink-400'}`} />
            <div>
              <p className="text-sm font-semibold text-white">{engagementData?.likes || 0}</p>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-800/50 rounded-lg">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">{comments.length}</p>
              <p className="text-xs text-gray-500">Comments</p>
            </div>
          </div>
        </div>

        {/* Social Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending || !isAuthenticated}
            className={`flex-1 ${isLiked ? 'border-pink-500/50 bg-pink-500/10 text-pink-400' : 'border-pink-500/30 hover:bg-pink-500/10'}`}
            data-testid={`button-like-completed-${bounty.id}`}
          >
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
            {likeMutation.isPending ? 'Liking...' : 'Like'}
          </Button>

          <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-blue-500/30 hover:bg-blue-500/10"
                data-testid={`button-comment-${bounty.id}`}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Comment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-slate-900 border-purple-500/30 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Comments on "{bounty.title}"</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Comment List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No comments yet. Be the first!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                            {comment.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium text-purple-300">@{comment.username}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 pl-8">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-slate-800 border-purple-500/30 text-white"
                      rows={2}
                      data-testid={`input-comment-${bounty.id}`}
                    />
                    <Button
                      onClick={() => newComment.trim() && commentMutation.mutate(newComment)}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-fuchsia-500"
                      data-testid={`button-submit-comment-${bounty.id}`}
                    >
                      {commentMutation.isPending ? '...' : 'Post'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm">
                    Sign in to comment
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!isConnected}
                className="flex-1 border-amber-500/30 hover:bg-amber-500/10"
                data-testid={`button-tip-${bounty.id}`}
              >
                <Gift className="w-4 h-4 mr-1" />
                Tip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/30">
              <DialogHeader>
                <DialogTitle className="text-white">Send a Tip</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Reward the creator for their great work on this bounty!
                </p>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Amount ($STREAM)</label>
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="bg-slate-800 border-purple-500/30 text-white"
                    placeholder="Enter amount"
                    min="1"
                    data-testid={`input-tip-${bounty.id}`}
                  />
                </div>
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setTipAmount(amount.toString())}
                      className="border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => tipAmount && tipMutation.mutate(parseFloat(tipAmount))}
                    disabled={!tipAmount || tipMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    data-testid={`button-submit-tip-${bounty.id}`}
                  >
                    {tipMutation.isPending ? 'Sending...' : `Send ${tipAmount || '0'} $STREAM`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTipDialog(false)}
                    className="border-gray-500/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-green-500/30 hover:bg-green-500/10"
            data-testid={`button-share-completed-${bounty.id}`}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* View Full Details Link */}
        <Link href={`/bounties/${bounty.id}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/10"
            data-testid={`button-view-details-${bounty.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
