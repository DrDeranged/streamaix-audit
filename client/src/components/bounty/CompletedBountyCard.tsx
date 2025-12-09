import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, CheckCircle, Star, Eye, Heart, 
  MessageCircle, Bot, Sparkles, FileText, 
  Award, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      <Card 
        className="bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/30 backdrop-blur-sm overflow-hidden hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
        data-testid={`completed-bounty-card-${bounty.id}`}
      >
        <div className="p-5 space-y-4">
          {/* Header with Completed Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-green-300 transition-colors" data-testid={`completed-bounty-title-${bounty.id}`}>
                {bounty.title}
              </h3>
              {bounty.completedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Completed {formatDistanceToNow(new Date(bounty.completedAt), { addSuffix: true })}</span>
                </div>
              )}
            </div>
            <Badge className="border-green-500/50 bg-green-500/10 text-green-400 flex-shrink-0" data-testid={`completed-badge-${bounty.id}`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>

          {/* Winner / Completer Info */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-lg">
            {bounty.isAiCompleted ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-cyan-300">AI Agent</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {bounty.completerUsername?.[0]?.toUpperCase() || 
                   bounty.claimerWallet?.slice(2, 4).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-purple-300 truncate block">
                    {bounty.completerUsername ? `@${bounty.completerUsername}` : 
                     bounty.claimerWallet ? `${bounty.claimerWallet.slice(0, 6)}...${bounty.claimerWallet.slice(-4)}` : 
                     'Anonymous'}
                  </span>
                </div>
              </>
            )}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-green-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{bounty.reward}</span>
              </div>
              <span className="text-xs text-gray-400">$STREAM</span>
            </div>
          </div>

          {/* Summary Preview */}
          {bounty.summaryPreview && bounty.summaryPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Key Insights</span>
              </div>
              <ul className="space-y-1.5">
                {bounty.summaryPreview.slice(0, 2).map((point, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
              {bounty.summaryPreview.length > 2 && (
                <p className="text-xs text-green-400 font-medium">
                  +{bounty.summaryPreview.length - 2} more insights
                </p>
              )}
            </div>
          )}

          {/* Quality Score */}
          {qualityScore && qualityScore > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">{qualityScore}/100</span>
              {qualityScore >= 90 && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs ml-auto">
                  <Award className="w-3 h-3 mr-1" />
                  Top Quality
                </Badge>
              )}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{engagementData?.views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-pink-400">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{engagementData?.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{comments.length}</span>
              </div>
            </div>
            <span className="text-xs text-green-400 font-medium group-hover:underline">
              Read & Engage →
            </span>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <CompletedBountyDetailModal
        bounty={bounty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
