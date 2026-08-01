import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, Target, Zap, Award, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPoints } from '@/hooks/usePoints';

interface BountyHunter {
  id: number;
  userId: number;
  reputation: number;
  level: number;
  badges: string[];
  totalEarnings: string;
  bountiesCompleted: number;
  currentStreak: number;
  averageQuality: number;
  specializations: string[];
}

const LEVEL_COLORS = [
  'text-muted',
  'text-gain',
  'text-accent-bright',
  'text-accent-bright',
  'text-accent-bright',
  'text-warn',
  'text-loss',
  'text-warn',
  'text-accent-bright',
  'text-gain',
];

const BADGE_ICONS: Record<string, { icon: any; color: string }> = {
  first_bounty: { icon: Star, color: 'text-warn' },
  speed_demon: { icon: Zap, color: 'text-warn' },
  quality_master: { icon: Award, color: 'text-accent-bright' },
  streak_3: { icon: Target, color: 'text-accent-bright' },
  streak_7: { icon: Target, color: 'text-accent-bright' },
  streak_30: { icon: Target, color: 'text-accent-bright' },
  specialist_crypto: { icon: TrendingUp, color: 'text-gain' },
  specialist_tech: { icon: TrendingUp, color: 'text-accent-bright' },
  specialist_business: { icon: TrendingUp, color: 'text-warn' },
  century_club: { icon: Crown, color: 'text-warn' },
  consistent_hunter: { icon: Medal, color: 'text-accent-bright' },
};

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<string>('reputation');
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<{ hunters: BountyHunter[] }>({
    queryKey: ['/api/leaderboard', sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?sortBy=${sortBy}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });

  const hunters = data?.hunters || [];

  const getPodiumPlace = (index: number) => {
    if (index === 0) return { icon: Crown, color: 'text-warn', bg: 'bg-accent-core/10', border: 'border-accent-core/30' };
    if (index === 1) return { icon: Medal, color: 'text-secondary', bg: 'bg-ink-raised', border: 'border-ink-edge' };
    if (index === 2) return { icon: Medal, color: 'text-warn', bg: 'bg-accent-core/10', border: 'border-accent-core/30' };
    return null;
  };

  return (
    <div className="min-h-screen bg-ink-page tnums-scope">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="Reputation · top performers"
            title="Bounty Hunter Leaderboard"
            icon={<Trophy className="h-5 w-5" />}
            subtitle="Top performers earning rewards and building reputation."
            actions={
              <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] rounded-xl border border-ink-edge bg-ink-surface text-body" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reputation">Reputation</SelectItem>
                <SelectItem value="earnings">Total Earnings</SelectItem>
                <SelectItem value="quality">Quality Score</SelectItem>
              </SelectContent>
            </Select>
            }
          />
        </motion.div>

        {/* Top 3 Podium */}
        {hunters.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:order-1"
              >
                <Surface className="relative overflow-hidden p-6">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-xl bg-accent-core/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-accent-core/50 text-accent-bright">
                        #2
                      </Badge>
                      <Medal className="h-8 w-8 text-accent-bright" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-accent-deep text-2xl font-bold text-primary">
                        {hunters[1]?.userId || 'U'}
                      </div>
                      <p className="mb-1 text-xl font-bold text-primary">User #{hunters[1]?.userId}</p>
                      <p className="text-sm text-secondary">Level {hunters[1]?.level}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                         <span className="text-secondary">Reputation:</span>
                         <span className="numeric font-semibold tabular text-primary">{hunters[1]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-secondary">Earnings:</span>
                         <span className="tabular text-gain">{formatPoints(Number(hunters[1]?.totalEarnings || 0))} STREAM</span>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="md:order-2 md:-mt-4"
              >
                <Surface className="relative overflow-hidden p-6">
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-xl bg-accent-core/20 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-accent-core/50 text-accent-bright">
                        👑 Champion
                      </Badge>
                      <Crown className="h-10 w-10 text-accent-bright" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-xl bg-accent-core text-3xl font-bold text-primary ring-4 ring-accent-core/50">
                        {hunters[0]?.userId || 'U'}
                      </div>
                      <p className="mb-1 text-2xl font-bold text-primary">User #{hunters[0]?.userId}</p>
                      <p className="text-sm text-accent-bright">Level {hunters[0]?.level}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                         <span className="text-body">Reputation:</span>
                         <span className="numeric font-bold tabular text-primary">{hunters[0]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-body">Earnings:</span>
                         <span className="tabular font-bold text-gain">{formatPoints(Number(hunters[0]?.totalEarnings || 0))} STREAM</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-body">Quality:</span>
                         <span className="tabular text-accent-bright">{hunters[0]?.averageQuality?.toFixed(1) || 0}/100</span>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="md:order-3"
              >
                <Surface className="relative overflow-hidden p-6">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-xl bg-accent-core/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-accent-core/50 text-accent-bright">
                        #3
                      </Badge>
                      <Medal className="h-8 w-8 text-accent-bright" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-accent-deep text-2xl font-bold text-primary">
                        {hunters[2]?.userId || 'U'}
                      </div>
                      <p className="mb-1 text-xl font-bold text-primary">User #{hunters[2]?.userId}</p>
                      <p className="text-sm text-secondary">Level {hunters[2]?.level}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                         <span className="text-secondary">Reputation:</span>
                         <span className="numeric font-semibold tabular text-primary">{hunters[2]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-secondary">Earnings:</span>
                         <span className="tabular text-gain">{formatPoints(Number(hunters[2]?.totalEarnings || 0))} STREAM</span>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Surface className="overflow-hidden">
            <div className="border-b border-ink-divider p-6">
              <SectionTitle as="h2">All Hunters</SectionTitle>
            </div>
            
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                   <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-raised" />
                ))}
              </div>
            ) : hunters.length === 0 ? (
              <div className="p-12 text-center">
                 <Trophy className="mx-auto mb-4 h-16 w-16 text-muted" />
                 <p className="text-secondary">No hunters yet. Be the first to complete a bounty!</p>
              </div>
            ) : (
               <div className="divide-y divide-ink-divider">
                {hunters.map((hunter, index) => {
                  const podium = getPodiumPlace(index);
                  const levelColor = LEVEL_COLORS[Math.min(hunter.level - 1, LEVEL_COLORS.length - 1)];
                  
                  return (
                    <motion.div
                      key={hunter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                       className={`p-4 transition-colors hover:bg-ink-raised ${podium ? podium.bg : ''}`}
                      data-testid={`hunter-${hunter.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                         <div className={`w-12 text-center ${podium ? podium.color : 'text-muted'}`}>
                          {podium ? (
                            <podium.icon className="w-6 h-6 mx-auto" />
                          ) : (
                            <span className="text-lg font-bold">#{index + 1}</span>
                          )}
                        </div>

                        {/* Avatar */}
                         <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-accent-deep font-bold text-primary ${podium ? 'ring-2 ' + podium.border : ''}`}>
                          {hunter.userId}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-semibold text-primary">User #{hunter.userId}</p>
                            <Badge variant="outline" className={`text-xs ${levelColor}`}>
                              Level {hunter.level}
                            </Badge>
                            {hunter.currentStreak > 0 && (
                               <Badge variant="outline" className="border-accent-core/50 text-xs text-accent-bright">
                                🔥 {hunter.currentStreak} day streak
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {hunter.badges?.slice(0, 5).map((badge, i) => {
                              const badgeInfo = BADGE_ICONS[badge];
                              if (!badgeInfo) return null;
                              const Icon = badgeInfo.icon;
                              return (
                                <Icon
                                  key={i}
                                  className={`w-4 h-4 ${badgeInfo.color}`}
                                  data-testid={`badge-${badge}`}
                                />
                              );
                            })}
                            {hunter.badges?.length > 5 && (
                               <span className="text-xs text-muted">+{hunter.badges.length - 5}</span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          <div className="text-center">
                             <p className="mb-1 text-xs text-muted">Reputation</p>
                             <p className="numeric tabular font-bold text-accent-bright">{hunter.reputation.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                             <p className="mb-1 text-xs text-muted">Earnings</p>
                             <p className="tabular font-bold text-gain">{formatPoints(Number(hunter.totalEarnings || 0))} STREAM</p>
                          </div>
                          <div className="text-center">
                             <p className="mb-1 text-xs text-muted">Completed</p>
                             <p className="tabular font-bold text-accent-bright">{hunter.bountiesCompleted}</p>
                          </div>
                          <div className="text-center">
                             <p className="mb-1 text-xs text-muted">Quality</p>
                             <p className="tabular font-bold text-accent-bright">{hunter.averageQuality?.toFixed(1) || 0}</p>
                          </div>
                        </div>

                        {/* View Profile */}
                        <Button
                          variant="outline"
                          size="sm"
                           className="rounded-xl border border-ink-edge text-body hover:bg-ink-raised"
                          onClick={() => setLocation(`/hunter/${hunter.id}`)}
                          data-testid={`button-view-profile-${hunter.id}`}
                        >
                          View Profile
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Surface>
        </motion.div>
      </div>
    </div>
  );
}
