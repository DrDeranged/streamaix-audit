import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, Zap, TrendingUp, Users, Star, ArrowLeft, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
      case 'bronze': return 'from-amber-700 via-amber-800 to-amber-900';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-500';
      case 'gold': return 'from-amber-400 via-amber-500 to-amber-600';
      case 'platinum': return 'from-purple-400 via-purple-500 to-purple-600';
      default: return 'from-cyan-500/20 via-purple-500/20 to-emerald-500/20';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'shadow-xl shadow-amber-800/50';
      case 'silver': return 'shadow-xl shadow-gray-400/50';
      case 'gold': return 'shadow-xl shadow-amber-500/60';
      case 'platinum': return 'shadow-2xl shadow-purple-500/70';
      default: return 'shadow-lg shadow-cyan-500/10';
    }
  };

  const getTierIcon = (tier: string, completed: boolean) => {
    const iconClass = completed ? "" : "opacity-30";
    switch (tier) {
      case 'bronze': return <Award className={`w-8 h-8 text-amber-700 ${iconClass} drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]`} />;
      case 'silver': return <Award className={`w-8 h-8 text-gray-300 ${iconClass} drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]`} />;
      case 'gold': return <Trophy className={`w-8 h-8 text-amber-400 ${iconClass} drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]`} />;
      case 'platinum': return <Star className={`w-8 h-8 text-purple-400 ${iconClass} drop-shadow-[0_0_12px_rgba(192,132,252,0.7)]`} />;
      default: return <Award className={`w-8 h-8 text-cyan-400 ${iconClass}`} />;
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
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
            <Link href="/markets">
              <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-16 h-16 text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.7)]" />
              </motion.div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Achievements
              </h1>
            </div>
            <p className="text-slate-400 text-lg">Unlock rewards and showcase your trading prowess</p>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-purple-500/30 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold">
                    <span className="text-purple-400" data-testid="completed-count">
                      <AnimatedCounter value={completedCount} />
                    </span>
                    <span className="text-slate-500"> / {totalCount}</span>
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-3 bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                </Progress>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-500/10 p-6 space-y-6">
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
                <TabsList className="grid grid-cols-5 w-full bg-slate-900/50 border border-purple-500/30 p-1 rounded-xl">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30 data-[state=active]:text-purple-300 rounded-lg transition-all duration-300"
                    data-testid="tab-all"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trading"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-orange-500/30 data-[state=active]:text-amber-300 rounded-lg transition-all duration-300"
                    data-testid="tab-trading"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trading
                  </TabsTrigger>
                  <TabsTrigger 
                    value="prediction"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:text-cyan-300 rounded-lg transition-all duration-300"
                    data-testid="tab-prediction"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Prediction
                  </TabsTrigger>
                  <TabsTrigger 
                    value="social"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/30 data-[state=active]:to-green-500/30 data-[state=active]:text-emerald-300 rounded-lg transition-all duration-300"
                    data-testid="tab-social"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger 
                    value="milestone"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:text-pink-300 rounded-lg transition-all duration-300"
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
                        <div key={i} className="h-48 rounded-lg bg-gradient-to-r from-slate-800/30 to-slate-700/30 animate-pulse" />
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
                          <Card
                            className={`h-full bg-gradient-to-r ${getTierColor(achievement.tier)} p-[2px] ${achievement.completed ? getTierGlow(achievement.tier) : 'opacity-60'} transition-all duration-300`}
                          >
                            <div className="h-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-lg p-5 flex flex-col">
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
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    </motion.div>
                                  )}
                                  {!achievement.completed && (
                                    <Lock className="w-5 h-5 text-slate-600" />
                                  )}
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 bg-slate-800/50 border ${achievement.completed ? 'border-emerald-500/30 text-emerald-300' : 'border-slate-700/50 text-slate-500'}`}>
                                  {getCategoryIcon(achievement.category)}
                                  <span className="capitalize">{achievement.category}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <h3 className={`font-bold mb-2 ${achievement.completed ? 'text-white' : 'text-slate-500'}`}>
                                  {achievement.name}
                                </h3>
                                <p className={`text-sm mb-3 ${achievement.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {achievement.description}
                                </p>

                                {/* Progress */}
                                {!achievement.completed && achievement.progress !== undefined && (
                                  <div className="space-y-1 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500">Progress</span>
                                      <span className="text-slate-400">
                                        <AnimatedCounter value={achievement.progress} formatValue={(v) => v.toFixed(0)} /> / {formatNumber(achievement.requirement)}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={(achievement.progress / achievement.requirement) * 100} 
                                      className="h-2 bg-slate-800"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-slate-500">Reward:</span>
                                  <span className={`font-bold ${achievement.completed ? 'text-amber-400' : 'text-slate-600'}`}>
                                    <AnimatedCounter value={achievement.rewardAmount} formatValue={(v) => formatNumber(v)} /> STREAM
                                  </span>
                                </div>
                                {achievement.unlockedAt && (
                                  <span className="text-xs text-emerald-400">
                                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
