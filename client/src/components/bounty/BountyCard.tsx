import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Clock, Trophy, DollarSign, User, Tag, CheckCircle, AlertCircle, Star, Eye, Heart, Share2, Bot, Sparkles, FileText, Brain, Zap } from 'lucide-react';
import Surface from '@/components/ds/Surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { useBounties } from '@/hooks/useBounties';
import { useEngagement } from '@/hooks/useEngagement';
import { formatDistanceToNow } from 'date-fns';

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
    open: 'border-accent-core/50 bg-accent-core/10 text-accent-bright',
    claimed: 'border-warn/50 bg-warn/10 text-warn',
    in_progress: 'border-accent-core/50 bg-accent-core/10 text-accent-bright',
    completed: 'border-gain/50 bg-gain/10 text-gain',
    expired: 'border-loss/50 bg-loss/10 text-loss',
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
      <Surface className="overflow-hidden cursor-pointer transition-colors hover:bg-ink-raised">
        <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-primary mb-1 line-clamp-2" data-testid={`bounty-title-${bounty.id}`}>
              {bounty.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-secondary">
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
            className="flex items-center gap-3 p-3 rounded-xl bg-warn/10 border border-warn/40"
          >
            <div className="relative">
              <img
                src={bounty.processingAgentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bounty.processingAgentUsername}`}
                alt="AI Agent"
                className="w-8 h-8 rounded-full ring-2 ring-warn/50"
              />
              <motion.div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-warn rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Brain className="w-2.5 h-2.5 text-primary" />
              </motion.div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-warn">
                AI Agent Processing
              </p>
              <p className="text-xs text-warn/70">
                @{bounty.processingAgentUsername} is analyzing content...
              </p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-warn" />
            </motion.div>
          </motion.div>
        )}

        {/* Description */}
        <p className="text-sm text-body line-clamp-3" data-testid={`bounty-description-${bounty.id}`}>
          {bounty.description}
        </p>

        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bounty.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-accent-core/30 text-accent-bright text-xs"
                data-testid={`bounty-tag-${bounty.id}-${index}`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {bounty.tags.length > 3 && (
              <Badge variant="outline" className="border-ink-edge text-secondary text-xs">
                +{bounty.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-ink-raised rounded-xl border border-ink-edge">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent-bright" />
            <div>
              <p className="text-xs text-muted">Reward</p>
              <p className="text-sm font-semibold text-primary tabular" data-testid={`bounty-reward-${bounty.id}`}>
                {formatNumber(bounty.reward)} $STREAM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent-bright" />
            <div>
              <p className="text-xs text-muted">Tip Pool</p>
              <p className="text-sm font-semibold text-primary tabular" data-testid={`bounty-tip-pool-${bounty.id}`}>
                {formatNumber(bounty.tipPool || 0)} $STREAM
              </p>
            </div>
          </div>
        </div>

        {/* Deadline */}
        {bounty.deadline && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`w-4 h-4 ${isExpired ? 'text-loss' : 'text-accent-bright'}`} />
            <span className={isExpired ? 'text-loss' : 'text-secondary'} data-testid={`bounty-deadline-${bounty.id}`}>
              {isExpired ? 'Expired' : formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Completed Bounty Analysis Preview */}
        {bounty.status === 'completed' && (bounty.summaryPreview || bounty.completerUsername) && (
          <div className="space-y-3 p-3 bg-gain/10 border border-gain/30 rounded-xl">
            {/* Completer Info */}
            <div className="flex items-center gap-2">
              {bounty.isAiCompleted ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent-core flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-accent-bright">AI Agent</span>
                  <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/40 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              ) : bounty.completerUsername ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent-deep flex items-center justify-center text-primary text-xs font-bold">
                    {bounty.completerUsername[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-accent-bright">@{bounty.completerUsername}</span>
                </div>
              ) : null}
            </div>
            
            {/* Summary Preview */}
            {bounty.summaryPreview && bounty.summaryPreview.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Key Takeaways</span>
                </div>
                <ul className="space-y-1">
                  {bounty.summaryPreview.slice(0, 2).map((point, idx) => (
                    <li key={idx} className="text-xs text-body flex items-start gap-2">
                      <span className="text-gain mt-0.5">•</span>
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
                {bounty.summaryPreview.length > 2 && (
                    <p className="text-xs text-gain font-medium">
                    +{bounty.summaryPreview.length - 2} more insights →
                  </p>
                )}
              </div>
            )}
            
            {/* Quality Score inline */}
            {bounty.qualityScore && (
                <div className="flex items-center gap-2 pt-2 border-t border-ink-divider">
                  <Star className="w-4 h-4 text-warn" />
                  <span className="text-sm font-semibold text-warn tabular">{bounty.qualityScore}/100</span>
                {bounty.qualityScore >= 90 && (
                  <Badge className="bg-warn/20 text-warn border-warn/40 text-xs ml-auto">
                    Top Quality
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
                <div className="flex items-center gap-2 p-3 bg-accent-core/10 border border-accent-core/30 rounded-xl">
                <Star className="w-5 h-5 text-accent-bright" />
                <div className="flex-1">
                  <p className="text-xs text-muted">Quality Score</p>
                  <p className="text-lg font-bold text-accent-bright tabular" data-testid={`bounty-quality-${bounty.id}`}>
                    {qualityData.score}/100
                  </p>
                </div>
                {qualityData.score >= 95 && (
                  <Badge variant="outline" className="border-warn/50 text-warn text-xs">
                    Excellent
                  </Badge>
                )}
              </div>
            )}
            
            {engagementData && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1 p-2 bg-ink-raised rounded-xl">
                     <Eye className="w-4 h-4 text-accent-bright" />
                    <div>
                       <p className="text-xs text-muted">Views</p>
                       <p className="text-sm font-semibold text-primary tabular" data-testid={`bounty-views-${bounty.id}`}>
                        {engagementData.views || 0}
                      </p>
                    </div>
                  </div>
                    <div className="flex items-center gap-1 p-2 bg-ink-raised rounded-xl">
                     <Heart className="w-4 h-4 text-loss" />
                    <div>
                       <p className="text-xs text-muted">Likes</p>
                       <p className="text-sm font-semibold text-primary tabular" data-testid={`bounty-likes-${bounty.id}`}>
                        {engagementData.likes || 0}
                      </p>
                    </div>
                  </div>
                    <div className="flex items-center gap-1 p-2 bg-ink-raised rounded-xl">
                     <Share2 className="w-4 h-4 text-gain" />
                    <div>
                       <p className="text-xs text-muted">Shares</p>
                       <p className="text-sm font-semibold text-primary tabular" data-testid={`bounty-shares-${bounty.id}`}>
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
                    className="tap-target flex-1 border-loss/30 hover:bg-loss/10 rounded-xl"
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
                    className="tap-target flex-1 border-gain/30 hover:bg-gain/10 rounded-xl"
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
              className="tap-target flex-1 grad-accent glow-accent hover:bg-accent-deep rounded-xl"
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
                  className="tap-target border-accent-core/50 hover:bg-accent-core/10 rounded-xl"
                  data-testid={`button-add-tip-${bounty.id}`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Tip
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-ink-surface border-ink-edge rounded-2xl">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Add Tip to Bounty</h3>
                    <p className="text-sm text-secondary">
                      Boost this bounty to attract more creators
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-body">Amount ($STREAM)</label>
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-ink-raised border border-ink-edge rounded-xl text-primary focus:outline-none focus:border-accent-core"
                      placeholder="Enter amount"
                      min="1"
                      data-testid={`input-tip-amount-${bounty.id}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTip}
                      disabled={!tipAmount || addTip.isPending}
                      className="flex-1 grad-accent hover:bg-accent-deep rounded-xl"
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
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-warn/10 border border-warn/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-warn" />
              <span className="text-sm text-warn">You claimed this bounty</span>
            </div>
          )}

          {isOwner && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-accent-core/10 border border-accent-core/30 rounded-xl">
              <User className="w-4 h-4 text-accent-bright" />
              <span className="text-sm text-accent-bright">Your bounty</span>
            </div>
          )}
        </div>
      </div>
     </Surface>
    </Link>
  );
}
