import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import Surface from "@/components/ds/Surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, Zap, TrendingUp, Users, Star, ArrowLeft, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type Achievement = {
  id: string;
  name: string;
  description: string;
  category: 'trading' | 'prediction' | 'social' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  reward: number;
  requirement: { type: string; value: number };
  progress?: number;
  completed?: boolean;
  unlockedAt?: string;
};

export default function MarketAchievements() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'trading' | 'prediction' | 'social' | 'milestone'>('all');
  const { user } = useAuth();
  const userId = user?.id || "1";

  const { data: achievements, isLoading } = useQuery<{ achievements: Achievement[] }>({
    queryKey: ['/api/achievements'],
    refetchInterval: 30000
  });

  const { data: userAchievementsData } = useQuery<{ 
    achievements: { 
      completed: Array<{ userAchievement: any; achievement: Achievement }>;
      inProgress: Array<{ userAchievement: any; achievement: Achievement }>;
      total: number;
    } 
  }>({
    queryKey: ['/api/achievements/user', userId],
    refetchInterval: 30000
  });

  // Merge completed and in-progress into a single array for filtering
  const allUserAchievements = [
    ...(userAchievementsData?.achievements.completed.map(ua => ({
      ...ua.achievement,
      completed: true,
      unlockedAt: ua.userAchievement.completedAt,
      progress: ua.userAchievement.progress
    })) || []),
    ...(userAchievementsData?.achievements.inProgress.map(ua => ({
      ...ua.achievement,
      completed: false,
      progress: ua.userAchievement.progress
    })) || [])
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'border-warn/60';
      case 'silver': return 'border-ink-edge';
      case 'gold': return 'border-warn';
      case 'platinum': return 'border-accent-core';
      default: return 'border-ink-edge';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'glow-accent';
      default: return '';
    }
  };

  const getTierIcon = (tier: string, completed: boolean) => {
    const iconClass = completed ? "" : "opacity-30";
    switch (tier) {
      case 'bronze': return <Award className={`w-8 h-8 text-warn ${iconClass}`} />;
      case 'silver': return <Award className={`w-8 h-8 text-secondary ${iconClass}`} />;
      case 'gold': return <Trophy className={`w-8 h-8 text-warn ${iconClass}`} />;
      case 'platinum': return <Star className={`w-8 h-8 text-accent-bright ${iconClass}`} />;
      default: return <Award className={`w-8 h-8 text-accent-bright ${iconClass}`} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading': return <TrendingUp className="w-4 h-4" />;
      case 'prediction': return <Target className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'milestone': return <Zap className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  // Create a map of user achievements for quick lookup
  const userAchievementMap = new Map(
    allUserAchievements.map(ua => [ua.id, ua])
  );

  // Merge all achievements with user progress data
  const mergedAchievements = achievements?.achievements.map(achievement => {
    const userAchievement = userAchievementMap.get(achievement.id);
    return {
      ...achievement,
      completed: userAchievement?.completed || false,
      progress: userAchievement?.progress || 0,
      unlockedAt: userAchievement?.unlockedAt
    };
  }) || [];

  const filteredAchievements = mergedAchievements.filter(
    achievement => activeCategory === 'all' || achievement.category === activeCategory
  );

  const completedCount = filteredAchievements.filter(a => a.completed).length;
  const totalCount = filteredAchievements.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-ink-page relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-accent-core/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-warn/10 blur-3xl" />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <Link href="/#prediction-markets">
              <Button variant="ghost" className="mb-4 rounded-xl text-secondary hover:bg-ink-raised hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="h-16 w-16 text-accent-bright" />
              </motion.div>
              <PageHeader
                align="center"
                eyebrow="Trading rewards · badges"
                title="Achievements"
                icon={<Trophy className="h-5 w-5" />}
                subtitle="Unlock rewards and showcase your trading prowess."
              />
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              <Surface className="p-4">
                <div className="flex items-center justify-between mb-2">
                   <span className="flex items-center gap-2 text-sm text-body">
                     <Sparkles className="h-4 w-4 text-accent-bright" />
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold">
                     <span className="tabular text-accent-bright" data-testid="completed-count">
                      <AnimatedCounter value={completedCount} />
                    </span>
                     <span className="tabular text-muted"> / {totalCount}</span>
                  </span>
                </div>
                 <Progress value={completionPercentage} className="h-3 rounded-xl bg-ink-raised">
                   <div className="h-full rounded-xl bg-accent-core transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                </Progress>
              </Surface>
            </motion.div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
             <Surface className="space-y-6 p-6">
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
                 <TabsList className="grid w-full grid-cols-5 rounded-xl border border-ink-edge bg-ink-raised p-1">
                  <TabsTrigger 
                    value="all" 
                     className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white"
                    data-testid="tab-all"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trading"
                     className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white"
                    data-testid="tab-trading"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trading
                  </TabsTrigger>
                  <TabsTrigger 
                    value="prediction"
                     className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white"
                    data-testid="tab-prediction"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Prediction
                  </TabsTrigger>
                  <TabsTrigger 
                    value="social"
                     className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white"
                    data-testid="tab-social"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger 
                    value="milestone"
                     className="rounded-xl transition-all duration-300 data-[state=active]:bg-accent-core data-[state=active]:text-white"
                    data-testid="tab-milestone"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Milestone
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory} className="mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="loading-skeleton">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-48 rounded-xl border border-ink-edge bg-ink-raised animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAchievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          data-testid={`achievement-${index}`}
                        >
                          <Surface
                            className={`h-full border-2 p-5 ${getTierColor(achievement.tier)} ${achievement.completed ? getTierGlow(achievement.tier) : 'opacity-60'} transition-all duration-300`}
                          >
                            <div className="flex h-full flex-col">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {getTierIcon(achievement.tier, achievement.completed || false)}
                                  {achievement.completed && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 200 }}
                                    >
                                      <CheckCircle2 className="h-5 w-5 text-gain" />
                                    </motion.div>
                                  )}
                                  {!achievement.completed && (
                                    <Lock className="h-5 w-5 text-muted" />
                                  )}
                                </div>
                                 <div className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-xs ${achievement.completed ? 'border-gain/30 text-gain' : 'border-ink-edge text-muted'}`}>
                                  {getCategoryIcon(achievement.category)}
                                  <span className="capitalize">{achievement.category}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                 <h3 className={`mb-2 font-bold ${achievement.completed ? 'text-primary' : 'text-muted'}`}>
                                  {achievement.name}
                                </h3>
                                 <p className={`mb-3 text-sm ${achievement.completed ? 'text-secondary' : 'text-muted'}`}>
                                  {achievement.description}
                                </p>

                                {/* Progress */}
                                {!achievement.completed && achievement.progress !== undefined && (
                                  <div className="space-y-1 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                       <span className="text-muted">Progress</span>
                                       <span className="tabular text-secondary">
                                        <AnimatedCounter value={achievement.progress || 0} formatValue={(v) => v.toFixed(0)} /> / {formatNumber(achievement.requirement?.value)}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={achievement.requirement?.value ? ((achievement.progress || 0) / achievement.requirement.value) * 100 : 0} 
                                       className="h-2 rounded-xl bg-ink-raised"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Footer */}
                               <div className="flex items-center justify-between border-t border-ink-divider pt-3">
                                <div className="flex items-center gap-1 text-xs">
                                   <span className="text-muted">Reward:</span>
                                   <span className={`tabular font-bold ${achievement.completed ? 'text-warn' : 'text-muted'}`}>
                                    <AnimatedCounter value={achievement.reward} formatValue={(v) => formatNumber(v)} /> STREAM
                                  </span>
                                </div>
                                {achievement.unlockedAt && (
                                   <span className="text-xs text-gain">
                                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Surface>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
             </Surface>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
