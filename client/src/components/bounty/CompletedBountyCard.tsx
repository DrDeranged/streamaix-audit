import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, CheckCircle, Star, Eye, Heart, 
  MessageCircle, Bot, Sparkles, FileText, 
  Award, Clock
} from 'lucide-react';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import CompletedBountyDetailModal from './CompletedBountyDetailModal';
import type { Bounty } from '@shared/schema';

interface EnrichedBounty extends Bounty {
  summaryPreview?: string[];
  summaryTitle?: string;
  qualityScore?: number;
  completerUsername?: string;
  completerAvatar?: string;
  isAiCompleted?: boolean;
}

interface CompletedBountyCardProps {
  bounty: EnrichedBounty;
}

export default function CompletedBountyCard({ bounty }: CompletedBountyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch engagement stats
  const { data: engagementData } = useQuery<{ views: number; shares: number; likes: number }>({
    queryKey: ['/api/bounties', bounty.id, 'engagement'],
  });

  // Fetch comments count
  const { data: commentsData } = useQuery<{ comments: any[] }>({
    queryKey: ['/api/bounties', bounty.id, 'comments'],
  });

  const comments = commentsData?.comments || [];
  const qualityScore = bounty.qualityScore;

  return (
    <>
      <Surface 
        className="overflow-hidden border border-ink-edge bg-ink-surface transition-all cursor-pointer group hover:border-accent-core/50 hover:bg-ink-raised"
        onClick={() => setIsModalOpen(true)}
        data-testid={`completed-bounty-card-${bounty.id}`}
      >
        <div className="p-5 space-y-4">
          {/* Header with Completed Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SectionTitle as="h3" className="mb-1 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-accent-bright" data-testid={`completed-bounty-title-${bounty.id}`}>
                {bounty.title}
              </SectionTitle>
              {bounty.completedAt && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Clock className="w-3 h-3" />
                  <span>Completed {formatDistanceToNow(new Date(bounty.completedAt), { addSuffix: true })}</span>
                </div>
              )}
            </div>
            <Badge className="flex-shrink-0 border-gain/30 bg-gain/10 text-gain" data-testid={`completed-badge-${bounty.id}`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>

          {/* Winner / Completer Info */}
          <div className="flex items-center gap-3 rounded-xl border border-ink-edge bg-ink-raised p-3">
            {bounty.isAiCompleted ? (
              <>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-core/20">
                  <Bot className="h-5 w-5 text-accent-bright" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-accent-bright">AI Agent</span>
                    <Badge className="border-accent-core/30 bg-accent-core/10 text-accent-bright text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-core/20 font-bold text-accent-bright">
                  {bounty.completerUsername?.[0]?.toUpperCase() || 
                   bounty.claimerWallet?.slice(2, 4).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                   <span className="block truncate text-sm font-medium text-accent-bright">
                    {bounty.completerUsername ? `@${bounty.completerUsername}` : 
                     bounty.claimerWallet ? `${bounty.claimerWallet.slice(0, 6)}...${bounty.claimerWallet.slice(-4)}` : 
                     'Anonymous'}
                  </span>
                </div>
              </>
            )}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-gain">
                <Trophy className="w-4 h-4" />
                <span className="tabular font-bold">{(bounty.reward || 0).toLocaleString()}</span>
              </div>
              <span className="text-xs text-muted">$STREAM</span>
            </div>
          </div>

          {/* Summary Preview */}
          {bounty.summaryPreview && bounty.summaryPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <FileText className="w-3.5 h-3.5" />
                <span>Key Insights</span>
              </div>
              <ul className="space-y-1.5">
                {bounty.summaryPreview.slice(0, 2).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-body">
                    <span className="mt-0.5 flex-shrink-0 text-gain">•</span>
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
              {bounty.summaryPreview.length > 2 && (
                  <p className="text-xs font-medium text-accent-bright">
                  +{bounty.summaryPreview.length - 2} more insights
                </p>
              )}
            </div>
          )}

          {/* Quality Score */}
          {qualityScore && qualityScore > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 p-2">
              <Star className="h-4 w-4 text-warn" />
              <span className="tabular text-sm font-semibold text-warn">{qualityScore}/100</span>
              {qualityScore >= 90 && (
                <Badge className="ml-auto border-warn/30 bg-warn/10 text-warn text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  Top Quality
                </Badge>
              )}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between border-t border-ink-divider pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-secondary">
                <Eye className="w-4 h-4" />
                <span className="tabular text-sm">{engagementData?.views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-loss">
                <Heart className="w-4 h-4" />
                <span className="tabular text-sm">{engagementData?.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-accent-bright">
                <MessageCircle className="w-4 h-4" />
                <span className="tabular text-sm">{comments.length}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-accent-bright group-hover:underline">
              Read & Engage →
            </span>
          </div>
        </div>
      </Surface>

      {/* Detail Modal */}
      <CompletedBountyDetailModal
        bounty={bounty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
