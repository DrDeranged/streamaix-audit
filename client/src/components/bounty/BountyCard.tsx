import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Clock, Trophy, DollarSign, User, Tag, CheckCircle, AlertCircle, Star, Eye, Heart, Share2, Bot, Sparkles, FileText, Brain, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { useBounties } from '@/hooks/useBounties';
import { useEngagement } from '@/hooks/useEngagement';
import { format, formatDistanceToNow } from 'date-fns';

import type { Bounty } from '@shared/schema';

// Format numbers with commas
const formatNumber = (num: number | string | undefined): string => {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
};

interface EnrichedBounty extends Bounty {
  summaryPreview?: string[];
  summaryTitle?: string;
  qualityScore?: number;
  completerUsername?: string;
  completerAvatar?: string;
  isAiCompleted?: boolean;
  isAiProcessing?: boolean;
  processingAgentUsername?: string;
  processingAgentAvatar?: string;
}

interface BountyCardProps {
  bounty: EnrichedBounty;
}

export default function BountyCard({ bounty }: BountyCardProps) {
  const { wallet, isConnected } = useWeb3();
  const { claimBounty, addTip } = useBounties();
  const { trackLike, trackShare } = useEngagement(bounty.id);
  const [tipAmount, setTipAmount] = useState('');
  const [showTipDialog, setShowTipDialog] = useState(false);
  
  const isExpired = bounty.deadline ? new Date(bounty.deadline) < new Date() : false;
  const isOwner = wallet?.address?.toLowerCase() === bounty.creatorWallet?.toLowerCase();
  const isClaimer = wallet?.address?.toLowerCase() === bounty.claimerWallet?.toLowerCase();
  const canClaim = isConnected && !isOwner && !isClaimer && bounty.status === 'open' && !isExpired;

  // Fetch quality score for completed bounties
  const { data: qualityData } = useQuery<{ score: number; breakdown: any }>({
    queryKey: ['/api/bounties', bounty.id, 'quality'],
    enabled: bounty.status === 'completed',
  });

  // Fetch engagement stats
  const { data: engagementData } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', bounty.id, 'engagement'],
  });
  
  const statusColors: Record<string, string> = {
    open: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    claimed: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    in_progress: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    completed: 'border-green-500/50 bg-green-500/10 text-green-400',
    expired: 'border-red-500/50 bg-red-500/10 text-red-400',
  };

  const handleClaim = async () => {
    if (!bounty.contractBountyId) {
      console.error('No contract bounty ID');
      return;
    }
    await claimBounty.mutateAsync({
      bountyId: bounty.id,
      contractBountyId: bounty.contractBountyId,
    });
  };

  const handleAddTip = async () => {
    if (!bounty.contractBountyId || !tipAmount) return;
    
    await addTip.mutateAsync({
      bountyId: bounty.id,
      contractBountyId: bounty.contractBountyId,
      amount: parseFloat(tipAmount),
    });
    
    setTipAmount('');
    setShowTipDialog(false);
  };

  return (
    <Link href={`/bounties/${bounty.id}`}>
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm overflow-hidden hover:border-purple-500/60 transition-all cursor-pointer">
        <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2" data-testid={`bounty-title-${bounty.id}`}>
              {bounty.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-3 h-3" />
              <span className="truncate">{bounty.creatorWallet?.slice(0, 6)}...{bounty.creatorWallet?.slice(-4)}</span>
            </div>
          </div>
          <Badge className={statusColors[bounty.status]} data-testid={`bounty-status-${bounty.id}`}>
            {bounty.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* AI Processing Indicator for in-progress bounties */}
        {bounty.status === 'in_progress' && bounty.isAiProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40"
          >
            <div className="relative">
              <img
                src={bounty.processingAgentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bounty.processingAgentUsername}`}
                alt="AI Agent"
                className="w-8 h-8 rounded-full ring-2 ring-amber-500/50"
              />
              <motion.div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Brain className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-300">
                AI Agent Processing
              </p>
              <p className="text-xs text-amber-400/70">
                @{bounty.processingAgentUsername} is analyzing content...
              </p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-amber-400" />
            </motion.div>
          </motion.div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-300 line-clamp-3" data-testid={`bounty-description-${bounty.id}`}>
          {bounty.description}
        </p>

        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bounty.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-purple-500/30 text-purple-300 text-xs"
                data-testid={`bounty-tag-${bounty.id}-${index}`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {bounty.tags.length > 3 && (
              <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
                +{bounty.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-xs text-gray-400">Reward</p>
              <p className="text-sm font-semibold text-white" data-testid={`bounty-reward-${bounty.id}`}>
                {formatNumber(bounty.reward)} $STREAM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Tip Pool</p>
              <p className="text-sm font-semibold text-white" data-testid={`bounty-tip-pool-${bounty.id}`}>
                {formatNumber(bounty.tipPool || 0)} $STREAM
              </p>
            </div>
          </div>
        </div>

        {/* Deadline */}
        {bounty.deadline && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`w-4 h-4 ${isExpired ? 'text-red-400' : 'text-cyan-400'}`} />
            <span className={isExpired ? 'text-red-400' : 'text-gray-400'} data-testid={`bounty-deadline-${bounty.id}`}>
              {isExpired ? 'Expired' : formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Completed Bounty Analysis Preview */}
        {bounty.status === 'completed' && (bounty.summaryPreview || bounty.completerUsername) && (
          <div className="space-y-3 p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-lg">
            {/* Completer Info */}
            <div className="flex items-center gap-2">
              {bounty.isAiCompleted ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-cyan-400">AI Agent</span>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              ) : bounty.completerUsername ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                    {bounty.completerUsername[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-purple-300">@{bounty.completerUsername}</span>
                </div>
              ) : null}
            </div>
            
            {/* Summary Preview */}
            {bounty.summaryPreview && bounty.summaryPreview.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Key Takeaways</span>
                </div>
                <ul className="space-y-1">
                  {bounty.summaryPreview.slice(0, 2).map((point, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
                {bounty.summaryPreview.length > 2 && (
                  <p className="text-xs text-green-400 font-medium">
                    +{bounty.summaryPreview.length - 2} more insights →
                  </p>
                )}
              </div>
            )}
            
            {/* Quality Score inline */}
            {bounty.qualityScore && (
              <div className="flex items-center gap-2 pt-2 border-t border-green-500/20">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">{bounty.qualityScore}/100</span>
                {bounty.qualityScore >= 90 && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs ml-auto">
                    🏆 Top Quality
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quality Score & Engagement (for completed bounties - fallback if no enriched data) */}
        {bounty.status === 'completed' && !bounty.summaryPreview && (qualityData || engagementData) && (
          <div className="space-y-2">
            {qualityData && (
              <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <Star className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Quality Score</p>
                  <p className="text-lg font-bold text-purple-400" data-testid={`bounty-quality-${bounty.id}`}>
                    {qualityData.score}/100
                  </p>
                </div>
                {qualityData.score >= 95 && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
                    🏆 Excellent
                  </Badge>
                )}
              </div>
            )}
            
            {engagementData && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1 p-2 bg-slate-800/50 rounded-lg">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-sm font-semibold text-white" data-testid={`bounty-views-${bounty.id}`}>
                        {engagementData.views || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2 bg-slate-800/50 rounded-lg">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-semibold text-white" data-testid={`bounty-likes-${bounty.id}`}>
                        {engagementData.likes || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2 bg-slate-800/50 rounded-lg">
                    <Share2 className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm font-semibold text-white" data-testid={`bounty-shares-${bounty.id}`}>
                        {engagementData.shares || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => trackLike.mutate()}
                    disabled={trackLike.isPending}
                    className="tap-target flex-1 border-pink-500/30 hover:bg-pink-500/10"
                    data-testid={`button-like-${bounty.id}`}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {trackLike.isPending ? 'Liking...' : 'Like'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => trackShare.mutate()}
                    disabled={trackShare.isPending}
                    className="tap-target flex-1 border-green-500/30 hover:bg-green-500/10"
                    data-testid={`button-share-${bounty.id}`}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    {trackShare.isPending ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canClaim && (
            <Button
              onClick={handleClaim}
              disabled={claimBounty.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              data-testid={`button-claim-bounty-${bounty.id}`}
            >
              {claimBounty.isPending ? (
                'Claiming...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Claim Bounty
                </>
              )}
            </Button>
          )}

          {bounty.status === 'open' && !isOwner && isConnected && (
            <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10"
                  data-testid={`button-add-tip-${bounty.id}`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Tip
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/30">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Add Tip to Bounty</h3>
                    <p className="text-sm text-gray-400">
                      Boost this bounty to attract more creators
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Amount ($STREAM)</label>
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Enter amount"
                      min="1"
                      data-testid={`input-tip-amount-${bounty.id}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTip}
                      disabled={!tipAmount || addTip.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      data-testid={`button-submit-tip-${bounty.id}`}
                    >
                      {addTip.isPending ? 'Adding...' : 'Add Tip'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowTipDialog(false)}
                      className="border-gray-500/50"
                      data-testid={`button-cancel-tip-${bounty.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isClaimer && bounty.status === 'claimed' && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">You claimed this bounty</span>
            </div>
          )}

          {isOwner && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Your bounty</span>
            </div>
          )}
        </div>
      </div>
    </Card>
    </Link>
  );
}
