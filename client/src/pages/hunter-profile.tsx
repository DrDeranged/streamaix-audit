import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, TrendingUp, Target, Zap, Award, Crown, Medal, 
  CheckCircle, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatPoints } from '@/hooks/usePoints';
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';

interface BountyHunter {
  id: number;
  userId: number;
  reputation: number;
  level: number;
  badges: string[];
  totalEarnings: string;
  bountiesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageQuality: number;
  specializations: string[];
  createdAt: string;
}

interface CompletedBounty {
  id: number;
  title: string;
  category: string;
  reward: string;
  tokenType: string;
  completedAt: string;
  qualityScore?: number;
}

const BADGE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
  first_bounty: { label: 'First Steps', icon: Star, color: 'text-warn', description: 'Completed your first bounty' },
  speed_demon: { label: 'Speed Demon', icon: Zap, color: 'text-warn', description: 'Completed a bounty in under 1 hour' },
  quality_master: { label: 'Quality Master', icon: Award, color: 'text-accent-bright', description: 'Achieved 95+ quality score' },
  streak_3: { label: '3-Day Streak', icon: Target, color: 'text-accent-bright', description: 'Maintained a 3-day streak' },
  streak_7: { label: 'Week Warrior', icon: Target, color: 'text-accent-bright', description: 'Maintained a 7-day streak' },
  streak_30: { label: 'Month Master', icon: Target, color: 'text-accent-bright', description: 'Maintained a 30-day streak' },
  specialist_crypto: { label: 'Crypto Specialist', icon: TrendingUp, color: 'text-gain', description: 'Completed 3+ crypto bounties' },
  specialist_tech: { label: 'Tech Specialist', icon: TrendingUp, color: 'text-accent-bright', description: 'Completed 3+ tech bounties' },
  specialist_business: { label: 'Business Specialist', icon: TrendingUp, color: 'text-warn', description: 'Completed 3+ business bounties' },
  century_club: { label: 'Century Club', icon: Crown, color: 'text-warn', description: 'Completed 100+ bounties' },
  consistent_hunter: { label: 'Consistent Hunter', icon: Medal, color: 'text-loss', description: 'Completed 10+ bounties with 85+ quality' },
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 15000];

const getLevelProgress = (reputation: number, level: number) => {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = ((reputation - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export default function HunterProfile() {
  const [, params] = useRoute('/hunter/:id');
  const hunterId = params?.id;

  const { data: hunterData, isLoading } = useQuery<{ hunter: BountyHunter }>({
    queryKey: ['/api/bounty-hunters', hunterId],
    enabled: !!hunterId,
  });

  const { data: bountiesData } = useQuery<{ bounties: CompletedBounty[] }>({
    queryKey: ['/api/bounties', 'completed', hunterId],
    queryFn: async () => {
      const response = await fetch(`/api/bounties?status=completed&hunterId=${hunterId}`);
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return response.json();
    },
    enabled: !!hunterId,
  });

  const hunter = hunterData?.hunter;
  const completedBounties = bountiesData?.bounties || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-secondary">Loading hunter profile...</div>
      </div>
    );
  }

  if (!hunter) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <Surface className="border-loss/30 p-8 text-center">
          <Trophy className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">Hunter Not Found</h3>
          <p className="text-secondary">This bounty hunter doesn't exist yet.</p>
        </Surface>
      </div>
    );
  }

  const levelProgress = getLevelProgress(hunter.reputation, hunter.level);
  const nextLevelRep = LEVEL_THRESHOLDS[hunter.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  return (
    <div className="min-h-screen bg-ink-page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <PageHeader
            eyebrow={`Bounty hunter · level ${hunter.level}`}
            title={`User #${hunter.userId}`}
            subtitle="Reputation, badges, and bounty performance."
            icon={hunter.level >= 8 ? <Crown className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Surface className="grad-surface p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-xl bg-accent-core flex items-center justify-center text-3xl font-bold text-primary ring-4 ring-accent-core/30">
                {hunter.userId}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline" className="text-accent-bright border-accent-core/50">
                    Level {hunter.level}
                  </Badge>
                  {hunter.currentStreak > 0 && (
                    <Badge variant="outline" className="text-accent-bright border-accent-core/50">
                      🔥 {hunter.currentStreak} day streak
                    </Badge>
                  )}
                  {hunter.specializations?.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-accent-bright border-accent-core/50">
                      {spec} specialist
                    </Badge>
                  ))}
                </div>

                {/* Level Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary tabular">
                      {hunter.reputation.toLocaleString()} / {nextLevelRep.toLocaleString()} XP
                    </span>
                    <span className="text-accent-bright tabular">{levelProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-3 bg-ink-raised" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <StatValue label="Total Earnings" value={`${formatPoints(Number(hunter.totalEarnings || 0))} STREAM`} valueClassName="text-gain" />
                  </div>
                  <div>
                    <StatValue label="Completed" value={hunter.bountiesCompleted} valueClassName="text-accent-bright" />
                  </div>
                  <div>
                    <StatValue label="Avg Quality" value={`${hunter.averageQuality?.toFixed(1) || 0}/100`} valueClassName="text-accent-bright" />
                  </div>
                  <div>
                    <StatValue label="Longest Streak" value={`${hunter.longestStreak} days`} valueClassName="text-accent-bright" />
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Achievements & Badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Surface className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-accent-bright" />
                <SectionTitle as="h2">Achievements</SectionTitle>
                <Badge variant="outline" className="ml-auto border-accent-core/50 text-accent-bright">
                  {hunter.badges?.length || 0}
                </Badge>
              </div>

              <div className="space-y-3">
                {hunter.badges?.map((badge) => {
                  const info = BADGE_INFO[badge];
                  if (!info) return null;
                  const Icon = info.icon;

                  return (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-ink-raised rounded-xl p-3 flex items-center gap-3"
                      data-testid={`badge-${badge}`}
                    >
                      <div className={`p-2 rounded-xl ${info.color.replace('text', 'bg')}/10`}>
                        <Icon className={`w-6 h-6 ${info.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary text-sm">{info.label}</p>
                        <p className="text-xs text-secondary">{info.description}</p>
                      </div>
                    </motion.div>
                  );
                })}

                {(!hunter.badges || hunter.badges.length === 0) && (
                  <p className="text-center text-muted py-8">No badges earned yet</p>
                )}
              </div>
            </Surface>
          </motion.div>

          {/* Activity & Completed Bounties */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Surface className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-accent-bright" />
                <SectionTitle as="h2">Recent Activity</SectionTitle>
                <Badge variant="outline" className="ml-auto border-accent-core/50 text-accent-bright">
                  {completedBounties.length} completed
                </Badge>
              </div>

              <div className="space-y-3">
                {completedBounties.slice(0, 10).map((bounty) => (
                  <div
                    key={bounty.id}
                    className="bg-ink-raised rounded-xl p-4 hover:bg-ink-surface transition-colors"
                    data-testid={`completed-bounty-${bounty.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-primary">{bounty.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-accent-core/50 text-accent-bright">
                            {bounty.category || 'General'}
                          </Badge>
                          {bounty.qualityScore && (
                            <Badge variant="outline" className="text-xs border-accent-core/50 text-accent-bright">
                              Quality: {bounty.qualityScore}/100
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gain tabular">{formatPoints(Number(bounty.reward || 0))} {bounty.tokenType}</p>
                        <p className="text-xs text-secondary">{new Date(bounty.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {completedBounties.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-secondary">No completed bounties yet</p>
                  </div>
                )}
              </div>
            </Surface>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
