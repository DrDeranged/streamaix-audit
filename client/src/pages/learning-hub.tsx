import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  GraduationCap, BookOpen, Brain, Target, Trophy,
  ChevronRight, Clock, Zap, CheckCircle2, Play, Award,
  BarChart3, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import { useAuth } from '@/hooks/useAuth';
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
  web3_basics: { from: 'bg-accent-core', to: 'bg-accent-deep', border: 'border-accent-core/30' },
  defi: { from: 'bg-accent-bright', to: 'bg-accent-core', border: 'border-accent-core/30' },
  ai_trading: { from: 'bg-gain', to: 'bg-accent-core', border: 'border-gain/30' },
  prediction_markets: { from: 'bg-warn', to: 'bg-accent-deep', border: 'border-warn/30' },
  macro_economics: { from: 'bg-loss', to: 'bg-accent-deep', border: 'border-loss/30' },
  tech_stocks: { from: 'bg-accent-deep', to: 'bg-accent-core', border: 'border-accent-core/30' },
};

const difficultyBadge: Record<string, { color: string; label: string }> = {
  beginner: { color: 'bg-gain/15 text-gain border-gain/30', label: 'Beginner' },
  intermediate: { color: 'bg-warn/15 text-warn border-warn/30', label: 'Intermediate' },
  advanced: { color: 'bg-loss/15 text-loss border-loss/30', label: 'Advanced' },
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
      <Surface className={cn(
        "relative overflow-hidden transition-all duration-300 hover:border-accent-core/50",
        colors.border
      )}>
        <div className={cn("absolute inset-0 opacity-[0.08]", colors.from)} />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-xl shadow-lg", colors.from)}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex items-center gap-2">
              {isCompleted && (
                  <Badge className="bg-gain/15 text-gain border-gain/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
              <Badge className={difficulty.color}>
                {difficulty.label}
              </Badge>
            </div>
          </div>
          
           <h3 className="text-xl font-bold text-primary mb-2">{module.title}</h3>
           <p className="text-secondary text-sm mb-4 line-clamp-2">{module.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.estimatedMinutes} min
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {module.lessonCount} lessons
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-warn" />
              {module.xpReward} STREAM
            </div>
          </div>
          
          {isStarted && !isCompleted && (
            <div className="mb-4">
               <div className="flex items-center justify-between text-xs text-secondary mb-1">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
               <Progress value={progressPercent} className="h-2 bg-ink-raised" />
            </div>
          )}
          
          <Link href={`/learn/${module.id}`}>
            <Button 
              className={cn(
                 "w-full group rounded-xl",
                isCompleted 
                   ? "bg-ink-raised hover:bg-ink-edge text-primary"
                  : isStarted
                     ? "bg-warn hover:bg-warn/85 text-ink-page"
                     : "grad-accent glow-accent hover:bg-accent-deep"
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
     </Surface>
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
    <Surface className="relative overflow-hidden p-4">
      <div className={cn("absolute inset-0 opacity-[0.08]", gradient)} />
      <div className="relative flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <StatValue label={label} value={value} valueClassName="text-2xl font-bold" />
      </div>
    </Surface>
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
    <div className="min-h-[100dvh] bg-ink-page pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="Education · curriculum"
            title="Learning Hub"
            icon={<GraduationCap className="h-5 w-5" />}
            subtitle="Master Web3, DeFi, AI trading & market intelligence."
          />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            icon={BookOpen} 
            label="Courses Available" 
            value={modules.length}
             gradient="bg-accent-core"
          />
          <StatsCard 
            icon={CheckCircle2} 
            label="Completed" 
            value={completedCount}
             gradient="bg-gain"
          />
          <StatsCard 
            icon={Zap} 
            label="STREAM Earned" 
            value={totalXp.toLocaleString()}
             gradient="bg-warn"
          />
          <StatsCard 
            icon={Trophy} 
            label="Leaderboard Rank" 
            value={user ? (leaderboard.findIndex((l: any) => l.id === user.id) + 1 || '-') : '-'}
             gradient="bg-accent-deep"
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
                   ? "bg-accent-core text-white border-accent-core glow-accent"
                   : "border-ink-edge text-secondary hover:bg-ink-raised"
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
              <Surface key={i} className="h-72 bg-ink-raised animate-pulse" />
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
            <Surface className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-warn">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <SectionTitle as="h2">Top Learners</SectionTitle>
              </div>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((learner: any, index: number) => (
                  <div 
                    key={learner.id}
                    className={cn(
                       "flex items-center gap-4 p-3 rounded-xl border border-ink-divider",
                       index === 0 ? "bg-warn/10 border-warn/30" :
                       index === 1 ? "bg-ink-raised" :
                       index === 2 ? "bg-loss/10 border-loss/30" :
                       "bg-ink-raised/50"
                    )}
                  >
                    <div className={cn(
                       "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm",
                       index === 0 ? "bg-warn text-ink-page" :
                       index === 1 ? "bg-ink-edge text-primary" :
                       index === 2 ? "bg-loss text-primary" :
                       "bg-ink-edge text-secondary"
                    )}>
                      {learner.rank}
                    </div>
                    <div className="flex-1">
                       <p className="text-primary font-medium">{learner.username}</p>
                       <p className="text-xs text-secondary">{learner.completedModules} modules completed</p>
                    </div>
                    <div className="text-right">
                       <p className="text-warn font-bold tabular">{learner.totalXp?.toLocaleString() || 0}</p>
                       <p className="text-xs text-muted">STREAM</p>
                    </div>
                  </div>
                ))}
              </div>
             </Surface>
          </motion.div>
        )}
      </div>
    </div>
  );
}
