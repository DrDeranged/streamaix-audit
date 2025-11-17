import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, Zap, TrendingUp, Users, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Achievement = {
  id: string;
  name: string;
  description: string;
  category: 'trading' | 'prediction' | 'social' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardAmount: number;
  requirement: number;
  progress?: number;
  completed?: boolean;
  unlockedAt?: string;
};

export default function MarketAchievements() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'trading' | 'prediction' | 'social' | 'milestone'>('all');
  const userId = "1"; // TODO: Get from auth context

  const { data: achievements, isLoading } = useQuery<{ achievements: Achievement[] }>({
    queryKey: ['/api/achievements'],
    refetchInterval: 30000
  });

  const { data: userAchievements } = useQuery<{ achievements: Achievement[] }>({
    queryKey: ['/api/achievements/user', userId],
    refetchInterval: 30000
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-700 to-amber-900';
      case 'silver': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-amber-400 to-amber-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-cyan-500/20 to-emerald-500/20';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="w-6 h-6 text-amber-700" />;
      case 'silver': return <Award className="w-6 h-6 text-gray-300" />;
      case 'gold': return <Trophy className="w-6 h-6 text-amber-400" />;
      case 'platinum': return <Star className="w-6 h-6 text-purple-400" />;
      default: return <Award className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading': return <TrendingUp className="w-5 h-5" />;
      case 'prediction': return <Target className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      case 'milestone': return <Zap className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const filteredAchievements = achievements?.achievements.filter(
    achievement => activeCategory === 'all' || achievement.category === activeCategory
  ) || [];

  const completedCount = filteredAchievements.filter(a => a.completed).length;
  const totalCount = filteredAchievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Achievements
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Unlock rewards and showcase your trading prowess</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-300">
              <span className="text-amber-400 font-bold" data-testid="completed-count">{completedCount}</span> / {totalCount} Unlocked
            </span>
          </div>
        </div>

        <Card className="neural-glass border-iridescent p-6 space-y-6">
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
            <TabsList className="grid grid-cols-5 w-full bg-slate-800/50 border border-cyan-500/20">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400"
                data-testid="tab-all"
              >
                <Award className="w-4 h-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger 
                value="trading"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-amber-400"
                data-testid="tab-trading"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trading
              </TabsTrigger>
              <TabsTrigger 
                value="prediction"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-cyan-400"
                data-testid="tab-prediction"
              >
                <Target className="w-4 h-4 mr-2" />
                Prediction
              </TabsTrigger>
              <TabsTrigger 
                value="social"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-amber-500/20 data-[state=active]:text-emerald-400"
                data-testid="tab-social"
              >
                <Users className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger 
                value="milestone"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-pink-400"
                data-testid="tab-milestone"
              >
                <Zap className="w-4 h-4 mr-2" />
                Milestone
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="loading-skeleton">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 rounded-lg bg-slate-800/30 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`group relative overflow-hidden rounded-lg border ${
                        achievement.completed 
                          ? 'border-amber-500/40 bg-gradient-to-br ' + getTierColor(achievement.tier)
                          : 'border-cyan-500/20 bg-slate-800/40'
                      } p-5 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20`}
                      data-testid={`achievement-${achievement.id}`}
                    >
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                              achievement.completed ? 'bg-slate-900/80' : 'bg-slate-700/50'
                            }`}>
                              {getTierIcon(achievement.tier)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white" data-testid={`achievement-name-${achievement.id}`}>
                                {achievement.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`px-2 py-0.5 rounded-full text-xs ${
                                  achievement.completed 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                                }`}>
                                  {achievement.tier}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  {getCategoryIcon(achievement.category)}
                                  <span>{achievement.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300" data-testid={`achievement-description-${achievement.id}`}>
                          {achievement.description}
                        </p>

                        {!achievement.completed && achievement.progress !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-cyan-400 font-bold">
                                {achievement.progress} / {achievement.requirement}
                              </span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.requirement) * 100} 
                              className="h-2 bg-slate-700/50"
                              data-testid={`achievement-progress-${achievement.id}`}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                          <div className="text-sm text-slate-400">Reward</div>
                          <div className="text-lg font-bold text-amber-400" data-testid={`achievement-reward-${achievement.id}`}>
                            {formatNumber(achievement.rewardAmount)} tokens
                          </div>
                        </div>

                        {achievement.completed && achievement.unlockedAt && (
                          <div className="text-xs text-emerald-400 text-center">
                            ✓ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {achievement.completed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      )}
                    </div>
                  ))}

                  {filteredAchievements.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400" data-testid="empty-state">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>No achievements in this category yet.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Total Unlocked</h3>
            </div>
            <div className="text-3xl font-bold text-amber-400" data-testid="total-unlocked">
              {completedCount}
            </div>
            <div className="text-sm text-slate-400 mt-1">of {totalCount} achievements</div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Completion Rate</h3>
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-400 mt-1">overall progress</div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Rare Badges</h3>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {filteredAchievements.filter(a => a.completed && (a.tier === 'gold' || a.tier === 'platinum')).length}
            </div>
            <div className="text-sm text-slate-400 mt-1">gold & platinum</div>
          </Card>

          <Card className="neural-glass border-iridescent p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Total Rewards</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {formatNumber(filteredAchievements.filter(a => a.completed).reduce((sum, a) => sum + a.rewardAmount, 0))}
            </div>
            <div className="text-sm text-slate-400 mt-1">tokens earned</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
