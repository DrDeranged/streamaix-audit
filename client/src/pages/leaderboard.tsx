import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, Target, Zap, Award, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  'text-gray-400',
  'text-green-400',
  'text-blue-400',
  'text-purple-400',
  'text-pink-400',
  'text-orange-400',
  'text-red-400',
  'text-yellow-400',
  'text-cyan-400',
  'text-emerald-400',
];

const BADGE_ICONS: Record<string, { icon: any; color: string }> = {
  first_bounty: { icon: Star, color: 'text-yellow-400' },
  speed_demon: { icon: Zap, color: 'text-orange-400' },
  quality_master: { icon: Award, color: 'text-purple-400' },
  streak_3: { icon: Target, color: 'text-cyan-400' },
  streak_7: { icon: Target, color: 'text-blue-400' },
  streak_30: { icon: Target, color: 'text-purple-400' },
  specialist_crypto: { icon: TrendingUp, color: 'text-green-400' },
  specialist_tech: { icon: TrendingUp, color: 'text-blue-400' },
  specialist_business: { icon: TrendingUp, color: 'text-orange-400' },
  century_club: { icon: Crown, color: 'text-yellow-400' },
  consistent_hunter: { icon: Medal, color: 'text-pink-400' },
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
    if (index === 0) return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    if (index === 1) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
    if (index === 2) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mb-2">
                Bounty Hunter Leaderboard
              </h1>
              <p className="text-gray-400">
                Top performers earning rewards and building reputation
              </p>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] bg-slate-900/50 border-purple-500/30" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reputation">Reputation</SelectItem>
                <SelectItem value="earnings">Total Earnings</SelectItem>
                <SelectItem value="quality">Quality Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-fuchsia-500/30 backdrop-blur-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-fuchsia-500/50 text-fuchsia-300">
                        #2
                      </Badge>
                      <Medal className="w-8 h-8 text-fuchsia-300" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                        {hunters[1]?.userId || 'U'}
                      </div>
                      <p className="text-xl font-bold text-white mb-1">User #{hunters[1]?.userId}</p>
                      <p className="text-sm text-gray-400">Level {hunters[1]?.level}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reputation:</span>
                        <span className="text-white font-semibold numeric">{hunters[1]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Earnings:</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">{formatPoints(Number(hunters[1]?.totalEarnings || 0))} STREAM</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="md:order-2 md:-mt-4"
              >
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/50 backdrop-blur-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        👑 Champion
                      </Badge>
                      <Crown className="w-10 h-10 text-purple-400" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-400 to-cyan-400 mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-purple-400/50">
                        {hunters[0]?.userId || 'U'}
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">User #{hunters[0]?.userId}</p>
                      <p className="text-sm text-purple-400">Level {hunters[0]?.level}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Reputation:</span>
                        <span className="text-white font-bold numeric">{hunters[0]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Earnings:</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 font-bold">{formatPoints(Number(hunters[0]?.totalEarnings || 0))} STREAM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Quality:</span>
                        <span className="text-purple-400">{hunters[0]?.averageQuality?.toFixed(1) || 0}/100</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="md:order-3"
              >
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-cyan-500/30 backdrop-blur-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                        #3
                      </Badge>
                      <Medal className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                        {hunters[2]?.userId || 'U'}
                      </div>
                      <p className="text-xl font-bold text-white mb-1">User #{hunters[2]?.userId}</p>
                      <p className="text-sm text-gray-400">Level {hunters[2]?.level}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reputation:</span>
                        <span className="text-white font-semibold numeric">{hunters[2]?.reputation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Earnings:</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{formatPoints(Number(hunters[2]?.totalEarnings || 0))} STREAM</span>
                      </div>
                    </div>
                  </div>
                </Card>
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
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-purple-500/20">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                All Hunters
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : hunters.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hunters yet. Be the first to complete a bounty!</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-500/10">
                {hunters.map((hunter, index) => {
                  const podium = getPodiumPlace(index);
                  const levelColor = LEVEL_COLORS[Math.min(hunter.level - 1, LEVEL_COLORS.length - 1)];
                  
                  return (
                    <motion.div
                      key={hunter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      className={`p-4 hover:bg-slate-800/30 transition-colors ${podium ? podium.bg : ''}`}
                      data-testid={`hunter-${hunter.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-12 text-center ${podium ? podium.color : 'text-gray-400'}`}>
                          {podium ? (
                            <podium.icon className="w-6 h-6 mx-auto" />
                          ) : (
                            <span className="text-lg font-bold">#{index + 1}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-bold ${podium ? 'ring-2 ' + podium.border : ''}`}>
                          {hunter.userId}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">User #{hunter.userId}</p>
                            <Badge variant="outline" className={`text-xs ${levelColor}`}>
                              Level {hunter.level}
                            </Badge>
                            {hunter.currentStreak > 0 && (
                              <Badge variant="outline" className="text-xs text-fuchsia-400 border-fuchsia-500/50">
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
                              <span className="text-xs text-gray-500">+{hunter.badges.length - 5}</span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Reputation</p>
                            <p className="font-bold text-purple-400 numeric">{hunter.reputation.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Earnings</p>
                            <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">{formatPoints(Number(hunter.totalEarnings || 0))} STREAM</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Completed</p>
                            <p className="font-bold text-cyan-400">{hunter.bountiesCompleted}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Quality</p>
                            <p className="font-bold text-fuchsia-400">{hunter.averageQuality?.toFixed(1) || 0}</p>
                          </div>
                        </div>

                        {/* View Profile */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 hover:bg-purple-500/10"
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
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
