import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  GraduationCap, BookOpen, Brain, Target, Trophy,
  ChevronRight, ChevronLeft, Clock, Star, Zap,
  CheckCircle2, Lock, Play, Award, Sparkles,
  ArrowLeft, BarChart3, Users, Lightbulb
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  xpReward: number;
  streamReward: number;
  lessonCount: number;
  iconType: string;
  gradientFrom: string;
  gradientTo: string;
  isActive: boolean;
  sortOrder: number;
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  lessonType: string;
  estimatedMinutes: number;
  xpReward: number;
  sortOrder: number;
}

interface Quiz {
  id: string;
  lessonId: string;
  question: string;
  questionType: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation: string;
  xpReward: number;
  sortOrder: number;
}

interface UserProgress {
  moduleId: string;
  progressPercent: number;
  lessonsCompleted: number;
  xpEarned: number;
  isCompleted: boolean;
}

const categoryIcons: Record<string, any> = {
  web3_basics: BookOpen,
  defi: BarChart3,
  ai_trading: Brain,
  prediction_markets: Target,
  macro_economics: Lightbulb,
  tech_stocks: Award,
};

const categoryColors: Record<string, { from: string; to: string; border: string }> = {
  web3_basics: { from: 'from-purple-600', to: 'to-fuchsia-500', border: 'border-purple-500/30' },
  defi: { from: 'from-cyan-500', to: 'to-blue-600', border: 'border-cyan-500/30' },
  ai_trading: { from: 'from-emerald-500', to: 'to-teal-500', border: 'border-emerald-500/30' },
  prediction_markets: { from: 'from-amber-500', to: 'to-orange-500', border: 'border-amber-500/30' },
  macro_economics: { from: 'from-rose-500', to: 'to-pink-500', border: 'border-rose-500/30' },
  tech_stocks: { from: 'from-indigo-500', to: 'to-violet-500', border: 'border-indigo-500/30' },
};

const difficultyBadge: Record<string, { color: string; label: string }> = {
  beginner: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Beginner' },
  intermediate: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Intermediate' },
  advanced: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'Advanced' },
};

function ModuleCard({ 
  module, 
  progress, 
  onStart 
}: { 
  module: LearningModule; 
  progress?: UserProgress;
  onStart: (id: string) => void;
}) {
  const colors = categoryColors[module.category] || categoryColors.web3_basics;
  const Icon = categoryIcons[module.category] || BookOpen;
  const difficulty = difficultyBadge[module.difficulty] || difficultyBadge.beginner;
  
  const progressPercent = progress?.progressPercent || 0;
  const isStarted = !!progress;
  const isCompleted = progress?.isCompleted || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90",
        "border transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10",
        colors.border
      )}>
        <div className={cn(
          "absolute inset-0 opacity-10 bg-gradient-to-br",
          colors.from, colors.to
        )} />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br shadow-lg",
              colors.from, colors.to
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
              <Badge className={difficulty.color}>
                {difficulty.label}
              </Badge>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{module.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.estimatedMinutes} min
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {module.lessonCount} lessons
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {module.xpReward} STREAM
            </div>
          </div>
          
          {isStarted && !isCompleted && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-slate-700" />
            </div>
          )}
          
          <Link href={`/learn/${module.id}`}>
            <Button 
              className={cn(
                "w-full group",
                isCompleted 
                  ? "bg-slate-700 hover:bg-slate-600"
                  : isStarted
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    : `bg-gradient-to-r ${colors.from} ${colors.to}`
              )}
              data-testid={`start-module-${module.id}`}
            >
              {isCompleted ? (
                <>Review Course</>
              ) : isStarted ? (
                <>Continue Learning <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <>Start Learning <Play className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

function StatsCard({ icon: Icon, label, value, gradient }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-slate-900/80 border-slate-700/50 p-4">
      <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", gradient)} />
      <div className="relative flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br", gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function LearningHub() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: modulesData, isLoading: modulesLoading } = useQuery<{ 
    modules: LearningModule[] 
  }>({
    queryKey: ['/api/learning/modules'],
    refetchInterval: 60000,
  });

  const { data: progressData } = useQuery<{
    progress: UserProgress[];
    totalXp: number;
    completedModules: number;
  }>({
    queryKey: ['/api/learning/progress'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: leaderboardData } = useQuery<{
    leaderboard: Array<{ id: number; rank: number; totalXp: number; completedModules: number; username: string; avatar?: string }>;
  }>({
    queryKey: ['/api/learning/leaderboard'],
    refetchInterval: 120000,
  });

  const modules = modulesData?.modules || [];
  const progressList = progressData?.progress || [];
  const totalXp = progressData?.totalXp || 0;
  const completedCount = progressData?.completedModules || 0;
  const leaderboard = leaderboardData?.leaderboard || [];

  const progressMap = new Map<string, UserProgress>(progressList.map((p) => [p.moduleId, p]));

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter((m: LearningModule) => m.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Courses' },
    { id: 'web3_basics', label: 'Web3 Basics' },
    { id: 'defi', label: 'DeFi' },
    { id: 'ai_trading', label: 'AI Trading' },
    { id: 'prediction_markets', label: 'Prediction Markets' },
    { id: 'macro_economics', label: 'Macro Economics' },
    { id: 'tech_stocks', label: 'Tech Stocks' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Learning Hub
              </h1>
              <p className="text-gray-400">Master Web3, DeFi, AI Trading & Market Intelligence</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            icon={BookOpen} 
            label="Courses Available" 
            value={modules.length}
            gradient="from-purple-500 to-fuchsia-500"
          />
          <StatsCard 
            icon={CheckCircle2} 
            label="Completed" 
            value={completedCount}
            gradient="from-emerald-500 to-teal-500"
          />
          <StatsCard 
            icon={Zap} 
            label="STREAM Earned" 
            value={totalXp.toLocaleString()}
            gradient="from-amber-500 to-orange-500"
          />
          <StatsCard 
            icon={Trophy} 
            label="Leaderboard Rank" 
            value={user ? (leaderboard.findIndex((l: any) => l.id === user.id) + 1 || '-') : '-'}
            gradient="from-cyan-500 to-blue-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                selectedCategory === cat.id 
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 border-0"
                  : "border-slate-600 text-gray-300 hover:bg-slate-800"
              )}
              data-testid={`filter-${cat.id}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {modulesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-72 bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredModules.map((module: LearningModule) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  progress={progressMap.get(module.id)}
                  onStart={() => {}}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-purple-500/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Top Learners</h2>
              </div>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((learner: any, index: number) => (
                  <div 
                    key={learner.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg",
                      index === 0 ? "bg-amber-500/10 border border-amber-500/30" :
                      index === 1 ? "bg-slate-500/10 border border-slate-500/30" :
                      index === 2 ? "bg-orange-500/10 border border-orange-500/30" :
                      "bg-slate-800/50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-amber-500 text-white" :
                      index === 1 ? "bg-slate-400 text-white" :
                      index === 2 ? "bg-orange-600 text-white" :
                      "bg-slate-700 text-gray-300"
                    )}>
                      {learner.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{learner.username}</p>
                      <p className="text-xs text-gray-400">{learner.completedModules} modules completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{learner.totalXp?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">STREAM</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
