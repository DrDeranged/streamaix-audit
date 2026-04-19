import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  Zap, Target, Trophy, Star, Flame, Gift, Crown,
  Calendar, Clock, ChevronRight, Lock, CheckCircle2,
  Sparkles, TrendingUp, Award, Users, BarChart3,
  Bell, ArrowLeft, Coins, Timer
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface LevelInfo {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progress: number;
  totalXpEarned: number;
  prestigeLevel: number;
}

interface QuestProgress {
  questId: string;
  name: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  expiresAt: string;
}

interface MissionProgress {
  missionId: string;
  name: string;
  description: string;
  objectives: Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
  overallProgress: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  weekEnd: string;
}

interface StreakInfo {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivity: string | null;
  nextMilestone: number;
  graceAvailable: boolean;
}

interface SeasonPassInfo {
  seasonId: string;
  seasonName: string;
  currentTier: number;
  maxTier: number;
  currentXp: number;
  xpPerTier: number;
  tierProgress: number;
  hasPremium: boolean;
  unclaimedFreeRewards: number[];
  unclaimedPremiumRewards: number[];
  daysRemaining: number;
}

interface XPTransaction {
  id: string;
  xpAmount: number;
  xpType: string;
  source: string;
  description: string;
  createdAt: string;
}

interface GamificationDashboard {
  level: LevelInfo;
  dailyQuests: QuestProgress[];
  weeklyMissions: MissionProgress[];
  streaks: StreakInfo[];
  seasonPass: SeasonPassInfo | null;
  activeEvent: { xpMultiplier: number } | null;
  recentXP: XPTransaction[];
  notifications: any[];
}

const streakIcons: Record<string, any> = {
  login: Calendar,
  trading: TrendingUp,
  prediction: Target,
  content: Star,
};

const streakColors: Record<string, string> = {
  login: 'from-purple-500 to-fuchsia-500',
  trading: 'from-emerald-500 to-cyan-500',
  prediction: 'from-amber-500 to-orange-500',
  content: 'from-pink-500 to-rose-500',
};

function XPBar({ level }: { level: LevelInfo }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 border border-purple-500/30 p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(147,51,234,0.15),transparent_50%)]" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-full blur-md opacity-50"
              />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center border-2 border-purple-400/50">
                <span className="text-xl sm:text-2xl font-bold text-white font-orbitron">{level.currentLevel}</span>
              </div>
              {level.prestigeLevel > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center border border-amber-300">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-orbitron">Level {level.currentLevel}</h2>
              {level.prestigeLevel > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                  Prestige {level.prestigeLevel}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-orbitron">
              {level.totalXpEarned.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{level.currentXp.toLocaleString()} XP</span>
            <span>{level.xpToNextLevel.toLocaleString()} XP to Level {level.currentLevel + 1}</span>
          </div>
          <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden border border-purple-500/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-shimmer" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function DailyQuestsCard({ quests }: { quests: QuestProgress[] }) {
  const completedCount = quests.filter(q => q.completed).length;
  
  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Daily Quests</h3>
            <p className="text-xs text-slate-400">{completedCount}/{quests.length} completed</p>
          </div>
        </div>
        <Badge className={cn(
          "text-xs",
          completedCount === quests.length 
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-slate-800/50 text-slate-400 border-slate-700/30"
        )}>
          {completedCount === quests.length ? 'All Done!' : 'In Progress'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {quests.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No quests available today</p>
        ) : (
          quests.map((quest) => (
            <motion.div
              key={quest.questId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                quest.completed
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-slate-800/30 border-slate-700/30 hover:border-purple-500/30"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      quest.completed ? "text-emerald-400 line-through" : "text-white"
                    )}>
                      {quest.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 ml-6 mt-1">{quest.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 font-medium">{quest.xpReward} XP</span>
                </div>
              </div>
              
              {!quest.completed && (
                <div className="ml-6 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{quest.current}/{quest.target}</span>
                    <span>{Math.round((quest.current / quest.target) * 100)}%</span>
                  </div>
                  <Progress value={(quest.current / quest.target) * 100} className="h-1.5" />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
}

function StreaksCard({ streaks }: { streaks: StreakInfo[] }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <Flame className="w-5 h-5 text-orange-400" />
        </div>
        <h3 className="font-semibold text-white">Active Streaks</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {streaks.length === 0 ? (
          <p className="text-sm text-slate-500 col-span-2 text-center py-4">
            Start an activity to begin a streak!
          </p>
        ) : (
          streaks.map((streak) => {
            const Icon = streakIcons[streak.streakType] || Flame;
            const colorClass = streakColors[streak.streakType] || 'from-purple-500 to-fuchsia-500';
            
            return (
              <motion.div
                key={streak.streakType}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-3 rounded-lg border border-slate-700/30 bg-slate-800/30",
                  streak.currentStreak > 0 && "border-orange-500/30 bg-orange-500/5"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", colorClass)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 capitalize">{streak.streakType}</span>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white font-orbitron">{streak.currentStreak}</span>
                  <span className="text-xs text-slate-400">days</span>
                  {streak.currentStreak > 0 && (
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse ml-1" />
                  )}
                </div>
                
                <div className="mt-2 text-[10px] text-slate-500">
                  Best: {streak.longestStreak} days • Next: {streak.nextMilestone}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function SeasonPassCard({ seasonPass }: { seasonPass: SeasonPassInfo | null }) {
  if (!seasonPass) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-fuchsia-500/20">
            <Gift className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h3 className="font-semibold text-white">Season Pass</h3>
        </div>
        <p className="text-sm text-slate-500 text-center py-6">
          No active season. Check back soon!
        </p>
      </Card>
    );
  }
  
  const unclaimedTotal = seasonPass.unclaimedFreeRewards.length + seasonPass.unclaimedPremiumRewards.length;
  
  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-fuchsia-900/20 to-slate-900/90 border border-fuchsia-500/30 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,70,239,0.1),transparent_50%)]" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-fuchsia-500/20">
              <Gift className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{seasonPass.seasonName}</h3>
              <p className="text-xs text-slate-400">{seasonPass.daysRemaining} days remaining</p>
            </div>
          </div>
          
          {seasonPass.hasPremium ? (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          ) : (
            <Button size="sm" className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 h-8 text-xs">
              Upgrade
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center border-2 border-fuchsia-400/50">
              <span className="text-lg font-bold text-white font-orbitron">{seasonPass.currentTier}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Tier {seasonPass.currentTier}</span>
              <span>Tier {Math.min(seasonPass.currentTier + 1, seasonPass.maxTier)}</span>
            </div>
            <Progress value={seasonPass.tierProgress} className="h-2" />
            <p className="text-[10px] text-slate-500 mt-1">
              {seasonPass.currentXp}/{seasonPass.xpPerTier} XP to next tier
            </p>
          </div>
        </div>
        
        {unclaimedTotal > 0 && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm font-medium text-amber-400">
                  {unclaimedTotal} reward{unclaimedTotal > 1 ? 's' : ''} to claim!
                </span>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black h-7 text-xs">
                Claim
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

function RecentXPCard({ transactions }: { transactions: XPTransaction[] }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="font-semibold text-white">Recent XP</h3>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No XP earned yet</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/30"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">{tx.description || tx.source}</p>
                  <p className="text-[10px] text-slate-500">{tx.xpType}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-400">+{tx.xpAmount}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export default function GamificationPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data, isLoading } = useQuery<{ success: boolean; dashboard: GamificationDashboard }>({
    queryKey: ['/api/gamification/dashboard'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  
  const dashboard = data?.dashboard;
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <Card className="p-8 bg-slate-900/90 border-purple-500/30 text-center max-w-md">
          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 mb-6">Sign in to track your progress and earn rewards!</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500">
              Sign In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">Loading your progress...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <PageHeader
          eyebrow="XP · quests · streaks"
          title="Your Progress"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Complete quests, earn XP, level up."
          className="mb-6"
        />
        
        {dashboard?.activeEvent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-amber-400" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-amber-400">
                  Double XP Event Active!
                </p>
                <p className="text-xs text-amber-300/70">
                  All XP gains are multiplied by {dashboard.activeEvent.xpMultiplier}x
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {dashboard && (
          <div className="space-y-6">
            <XPBar level={dashboard.level} />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-slate-900/50 border border-purple-500/20 p-1 h-auto flex-wrap">
                <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="quests" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
                  Quests
                </TabsTrigger>
                <TabsTrigger value="season" className="flex-1 data-[state=active]:bg-purple-600/30 text-xs sm:text-sm">
                  Season
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DailyQuestsCard quests={dashboard.dailyQuests} />
                  <StreaksCard streaks={dashboard.streaks} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SeasonPassCard seasonPass={dashboard.seasonPass} />
                  <RecentXPCard transactions={dashboard.recentXP} />
                </div>
              </TabsContent>
              
              <TabsContent value="quests" className="mt-6 space-y-6">
                <DailyQuestsCard quests={dashboard.dailyQuests} />
                
                <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="font-semibold text-white">Weekly Missions</h3>
                  </div>
                  
                  {dashboard.weeklyMissions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No weekly missions active</p>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.weeklyMissions.map((mission) => (
                        <div
                          key={mission.missionId}
                          className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-white">{mission.name}</h4>
                              <p className="text-xs text-slate-400">{mission.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span className="text-amber-400 font-medium">{mission.xpReward} XP</span>
                              </div>
                              {mission.streamReward > 0 && (
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Coins className="w-3 h-3 text-purple-400" />
                                  <span className="text-purple-400">{mission.streamReward}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Progress value={mission.overallProgress} className="h-2 mb-2" />
                          <p className="text-[10px] text-slate-500">{mission.overallProgress}% complete</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="season" className="mt-6 space-y-6">
                <SeasonPassCard seasonPass={dashboard.seasonPass} />
                
                {dashboard.seasonPass && (
                  <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 p-4">
                    <h3 className="font-semibold text-white mb-4">Reward Track</h3>
                    <div className="relative">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700/50 rounded-full" />
                      <div 
                        className="absolute top-6 left-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all"
                        style={{ width: `${(dashboard.seasonPass.currentTier / dashboard.seasonPass.maxTier) * 100}%` }}
                      />
                      
                      <div className="flex justify-between relative">
                        {[1, 25, 50, 75, 100].map((tier) => {
                          const isReached = dashboard.seasonPass!.currentTier >= tier;
                          return (
                            <div key={tier} className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                isReached
                                  ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 border-fuchsia-400"
                                  : "bg-slate-800 border-slate-600"
                              )}>
                                {isReached ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <Lock className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-2">Tier {tier}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}