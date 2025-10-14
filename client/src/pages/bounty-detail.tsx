import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clock,
  Trophy,
  DollarSign,
  User,
  Tag,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Upload,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Award,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/hooks/useWeb3';
import { useBounties } from '@/hooks/useBounties';
import { useEngagement } from '@/hooks/useEngagement';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatTokenAmount } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import type { Bounty } from '@shared/schema';

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet, isConnected } = useWeb3();
  const { claimBounty, addTip } = useBounties();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bounty details
  const { data: bountyData, isLoading } = useQuery<{ bounty: Bounty }>({
    queryKey: ['/api/bounties', id],
    enabled: !!id,
  });

  // Fetch quality score
  const { data: qualityData } = useQuery<{ score: number; breakdown: any; feedback: string }>({
    queryKey: ['/api/bounties', id, 'quality'],
    enabled: bountyData?.bounty?.status === 'completed',
  });

  // Fetch engagement stats
  const { data: engagementData } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', id, 'engagement'],
  });

  const { trackLike, trackShare } = useEngagement(id || '');

  const bounty = bountyData?.bounty;
  const isExpired = bounty?.deadline ? new Date(bounty.deadline) < new Date() : false;
  const isOwner = wallet?.address?.toLowerCase() === bounty?.creatorWallet?.toLowerCase();
  const isClaimer = wallet?.address?.toLowerCase() === bounty?.claimerWallet?.toLowerCase();
  const canClaim = isConnected && !isOwner && !isClaimer && bounty?.status === 'open' && !isExpired;
  const canSubmit = isClaimer && bounty?.status === 'claimed';
  const canReview = isOwner && bounty?.status === 'in_progress' && bounty?.summaryId;

  const handleClaim = async () => {
    if (!bounty?.contractBountyId) {
      toast({
        title: 'Error',
        description: 'Bounty not properly initialized',
        variant: 'destructive',
      });
      return;
    }

    try {
      await claimBounty.mutateAsync({
        bountyId: bounty.id,
        contractBountyId: bounty.contractBountyId,
      });
      toast({
        title: 'Success!',
        description: 'Bounty claimed successfully. You can now work on it.',
      });
    } catch (error) {
      toast({
        title: 'Failed to claim',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a content URL for your submission',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create summary from the submission
      const response = await apiRequest('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentUrl: submissionUrl,
          title: `Submission for: ${bounty?.title}`,
          description: submissionNotes || 'Bounty submission',
          bountyId: bounty?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Submitted!',
          description: 'Your submission is now being processed. The creator will review it.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/bounties', id] });
        setSubmissionUrl('');
        setSubmissionNotes('');
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTip = async () => {
    if (!bounty?.contractBountyId || !tipAmount) return;

    try {
      await addTip.mutateAsync({
        bountyId: bounty.id,
        contractBountyId: bounty.contractBountyId,
        amount: parseFloat(tipAmount),
      });
      toast({
        title: 'Tip added!',
        description: `${tipAmount} $STREAM added to the bounty pool`,
      });
      setTipAmount('');
    } catch (error) {
      toast({
        title: 'Failed to add tip',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bounties/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: bounty?.summaryId,
          completionTxHash: '0x...' // This should come from smart contract
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Bounty completed!',
        description: 'Rewards have been distributed to the hunter.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties', id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const statusColors: Record<string, string> = {
    open: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    claimed: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    in_progress: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    completed: 'border-green-500/50 bg-green-500/10 text-green-400',
    expired: 'border-red-500/50 bg-red-500/10 text-red-400',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading bounty...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Bounty not found</h2>
          <Link href="/bounties">
            <Button variant="outline" className="border-cyan-500/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bounties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Link href="/bounties">
          <Button
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white"
            data-testid="button-back-to-bounties"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bounties
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-3" data-testid="bounty-detail-title">
                    {bounty.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{bounty.creatorWallet?.slice(0, 6)}...{bounty.creatorWallet?.slice(-4)}</span>
                    </div>
                    {bounty.createdAt && (
                      <span>Posted {formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[bounty.status]} data-testid="bounty-detail-status">
                  {bounty.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Tags */}
              {bounty.tags && bounty.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {bounty.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-purple-500/30 text-purple-300"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{bounty.description}</p>
              </div>

              {/* Content URL */}
              {bounty.contentUrl && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Content to Summarize:</p>
                  <a
                    href={bounty.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                  >
                    {bounty.contentUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Engagement */}
              {engagementData && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => trackLike.mutate()}
                    className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
                    data-testid="button-like-bounty"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{engagementData.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => trackShare.mutate()}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                    data-testid="button-share-bounty"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{engagementData.shares || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{engagementData.views || 0}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Submission Form (for claimers) */}
            {canSubmit && (
              <Card className="bg-slate-900/50 border-yellow-500/30 backdrop-blur-sm p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-yellow-400" />
                  Submit Your Work
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Summary URL *</label>
                    <Input
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or link to your summary"
                      className="bg-slate-800 border-yellow-500/30 text-white"
                      data-testid="input-submission-url"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Additional Notes (Optional)</label>
                    <Textarea
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Any additional context or highlights from your summary..."
                      className="bg-slate-800 border-yellow-500/30 text-white min-h-[100px]"
                      data-testid="textarea-submission-notes"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !submissionUrl.trim()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    data-testid="button-submit-work"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Review Interface (for creators) */}
            {canReview && (
              <Card className="bg-slate-900/50 border-green-500/30 backdrop-blur-sm p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-400" />
                  Review Submission
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Submission ID:</p>
                    <Link href={`/summaries/${bounty.summaryId}`}>
                      <a className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
                        View Summary
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Link>
                  </div>
                  {qualityData && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">AI Quality Score:</p>
                      <p className="text-3xl font-bold text-purple-400">{qualityData.score}/100</p>
                      {qualityData.feedback && (
                        <p className="text-sm text-gray-300 mt-2">{qualityData.feedback}</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove.mutate()}
                      disabled={handleApprove.isPending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      data-testid="button-approve-submission"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve & Pay Reward
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Quality Score (for completed) */}
            {bounty.status === 'completed' && qualityData && (
              <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Quality Analysis
                </h2>
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-purple-400 mb-2">{qualityData.score}/100</p>
                  <p className="text-gray-400">Overall Quality Score</p>
                </div>
                {qualityData.breakdown && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(qualityData.breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-semibold text-white">{value}/100</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Info */}
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reward</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Base Reward</p>
                      <p className="text-2xl font-bold text-white">{bounty.reward} $STREAM</p>
                    </div>
                  </div>
                </div>

                {(bounty.tipPool ?? 0) > 0 && (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Tip Pool</p>
                        <p className="text-xl font-bold text-white">{bounty.tipPool ?? 0} $STREAM</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Total Reward:</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {(bounty.reward || 0) + (bounty.tipPool || 0)} $STREAM
                    </span>
                  </div>
                </div>

                {/* Add Tip */}
                {isConnected && !isOwner && (
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-3">Add to tip pool:</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="Amount"
                        className="bg-slate-800 border-purple-500/30 text-white"
                        data-testid="input-tip-amount"
                      />
                      <Button
                        onClick={handleAddTip}
                        disabled={addTip.isPending || !tipAmount}
                        variant="outline"
                        className="border-purple-500/50"
                        data-testid="button-add-tip"
                      >
                        Tip
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Deadline & Details */}
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="space-y-3">
                {bounty.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isExpired ? 'text-red-400' : 'text-cyan-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">Deadline</p>
                      <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                        {isExpired ? 'Expired' : formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}

                {bounty.difficulty && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Difficulty</p>
                      <p className="font-medium text-white capitalize">{bounty.difficulty}</p>
                    </div>
                  </div>
                )}

                {bounty.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <p className="font-medium text-white">{bounty.category}</p>
                    </div>
                  </div>
                )}

                {bounty.claimerWallet && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Claimed by</p>
                      <p className="font-medium text-white font-mono text-sm">
                        {bounty.claimerWallet.slice(0, 6)}...{bounty.claimerWallet.slice(-4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Button */}
            {canClaim && (
              <Button
                onClick={handleClaim}
                disabled={claimBounty.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-lg py-6"
                data-testid="button-claim-bounty"
              >
                <Trophy className="w-5 h-5 mr-2" />
                {claimBounty.isPending ? 'Claiming...' : 'Claim Bounty'}
              </Button>
            )}

            {isClaimer && bounty.status === 'claimed' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium">You've claimed this bounty!</p>
                <p className="text-gray-400 text-xs mt-1">Submit your work using the form above.</p>
              </div>
            )}

            {!isConnected && canClaim && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 text-sm">Connect your wallet to claim this bounty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
