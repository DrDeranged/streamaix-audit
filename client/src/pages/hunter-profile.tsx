import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, TrendingUp, Target, Zap, Award, Crown, Medal, 
  DollarSign, CheckCircle, BarChart3, Activity, Calendar 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPoints } from '@/hooks/usePoints';
import { useToast } from '@/hooks/use-toast';

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
  first_bounty: { label: 'First Steps', icon: Star, color: 'text-yellow-400', description: 'Completed your first bounty' },
  speed_demon: { label: 'Speed Demon', icon: Zap, color: 'text-orange-400', description: 'Completed a bounty in under 1 hour' },
  quality_master: { label: 'Quality Master', icon: Award, color: 'text-purple-400', description: 'Achieved 95+ quality score' },
  streak_3: { label: '3-Day Streak', icon: Target, color: 'text-cyan-400', description: 'Maintained a 3-day streak' },
  streak_7: { label: 'Week Warrior', icon: Target, color: 'text-blue-400', description: 'Maintained a 7-day streak' },
  streak_30: { label: 'Month Master', icon: Target, color: 'text-purple-400', description: 'Maintained a 30-day streak' },
  specialist_crypto: { label: 'Crypto Specialist', icon: TrendingUp, color: 'text-green-400', description: 'Completed 3+ crypto bounties' },
  specialist_tech: { label: 'Tech Specialist', icon: TrendingUp, color: 'text-blue-400', description: 'Completed 3+ tech bounties' },
  specialist_business: { label: 'Business Specialist', icon: TrendingUp, color: 'text-orange-400', description: 'Completed 3+ business bounties' },
  century_club: { label: 'Century Club', icon: Crown, color: 'text-yellow-400', description: 'Completed 100+ bounties' },
  consistent_hunter: { label: 'Consistent Hunter', icon: Medal, color: 'text-pink-400', description: 'Completed 10+ bounties with 85+ quality' },
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
  const { toast } = useToast();

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading hunter profile...</div>
      </div>
    );
  }

  if (!hunter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-red-500/30 p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Hunter Not Found</h3>
          <p className="text-gray-400">This bounty hunter doesn't exist yet.</p>
        </Card>
      </div>
    );
  }

  const levelProgress = getLevelProgress(hunter.reputation, hunter.level);
  const nextLevelRep = LEVEL_THRESHOLDS[hunter.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30 backdrop-blur-sm p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-400 to-cyan-400 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-purple-400/30">
                {hunter.userId}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">User #{hunter.userId}</h1>
                  {hunter.level >= 8 && <Crown className="w-8 h-8 text-yellow-400" />}
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline" className="text-purple-400 border-purple-500/50">
                    Level {hunter.level}
                  </Badge>
                  {hunter.currentStreak > 0 && (
                    <Badge variant="outline" className="text-fuchsia-400 border-fuchsia-500/50">
                      🔥 {hunter.currentStreak} day streak
                    </Badge>
                  )}
                  {hunter.specializations?.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-cyan-400 border-cyan-500/50">
                      {spec} specialist
                    </Badge>
                  ))}
                </div>

                {/* Level Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      {hunter.reputation.toLocaleString()} / {nextLevelRep.toLocaleString()} XP
                    </span>
                    <span className="text-purple-400">{levelProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-3 bg-slate-800" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Earnings</p>
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">{formatPoints(Number(hunter.totalEarnings || 0))} STREAM</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-lg font-bold text-purple-400">{hunter.bountiesCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Avg Quality</p>
                    <p className="text-lg font-bold text-fuchsia-400">{hunter.averageQuality?.toFixed(1) || 0}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Longest Streak</p>
                    <p className="text-lg font-bold text-cyan-400">{hunter.longestStreak} days</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Achievements & Badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Achievements</h2>
                <Badge variant="outline" className="ml-auto border-purple-500/50 text-purple-400">
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
                      className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3"
                      data-testid={`badge-${badge}`}
                    >
                      <div className={`p-2 rounded-lg ${info.color.replace('text', 'bg')}/10`}>
                        <Icon className={`w-6 h-6 ${info.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{info.label}</p>
                        <p className="text-xs text-gray-400">{info.description}</p>
                      </div>
                    </motion.div>
                  );
                })}

                {(!hunter.badges || hunter.badges.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No badges earned yet</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Activity & Completed Bounties */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                <Badge variant="outline" className="ml-auto border-purple-500/50 text-purple-400">
                  {completedBounties.length} completed
                </Badge>
              </div>

              <div className="space-y-3">
                {completedBounties.slice(0, 10).map((bounty) => (
                  <div
                    key={bounty.id}
                    className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
                    data-testid={`completed-bounty-${bounty.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{bounty.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-fuchsia-500/50 text-fuchsia-400">
                            {bounty.category || 'General'}
                          </Badge>
                          {bounty.qualityScore && (
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                              Quality: {bounty.qualityScore}/100
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">{formatPoints(Number(bounty.reward || 0))} {bounty.tokenType}</p>
                        <p className="text-xs text-gray-400">{new Date(bounty.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {completedBounties.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No completed bounties yet</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
