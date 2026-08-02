import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  GraduationCap, BookOpen, Brain, Target, Trophy,
  Clock, Zap,
  Sparkles, Award, BarChart3, Lightbulb, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { cn } from '@/lib/utils';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  xpReward: number;
  lessonCount: number;
}

const categoryIcons: Record<string, any> = {
  web3_basics: BookOpen,
  defi: BarChart3,
  ai_trading: Brain,
  prediction_markets: Target,
  macro_economics: Lightbulb,
  tech_stocks: Award,
};

const categoryColors: Record<string, string> = {
  web3_basics: 'bg-accent-core',
  defi: 'bg-accent-deep',
  ai_trading: 'bg-gain',
  prediction_markets: 'bg-warn',
  macro_economics: 'bg-loss',
  tech_stocks: 'bg-accent-core',
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-gain bg-gain/10 border border-gain/30',
  intermediate: 'text-warn bg-warn/10 border border-warn/30',
  advanced: 'text-loss bg-loss/10 border border-loss/30',
};

function ModulePreviewCard({ module, index }: { module: LearningModule; index: number }) {
  const colors = categoryColors[module.category] || categoryColors.web3_basics;
  const Icon = categoryIcons[module.category] || BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.02 }}
    >
      <Surface className="relative h-full overflow-hidden p-5 transition-all duration-300 group hover:border-accent-core/50 hover:bg-ink-raised">
        <div className={cn("absolute inset-0 opacity-[0.06]", colors)} />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className={cn("p-2.5 rounded-xl shadow-lg", colors)}>
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <Badge className={cn("text-xs", difficultyColors[module.difficulty])}>
              {module.difficulty}
            </Badge>
          </div>
          
          <h3 className="text-lg font-bold text-primary mb-2 group-hover:text-accent-bright transition-colors">
            {module.title}
          </h3>
          <p className="text-secondary text-sm mb-4 line-clamp-2">{module.description}</p>
          
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {module.estimatedMinutes}m
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {module.lessonCount}
              </span>
            </div>
            <span className="flex items-center gap-1 text-warn tabular">
              <Zap className="w-3 h-3" />
              {module.xpReward} STREAM
            </span>
          </div>
        </div>
      </Surface>
    </motion.div>
  );
}

export function LearningHubSection() {
  const { data: modulesData, isLoading } = useQuery<{ modules: LearningModule[] }>({
    queryKey: ['/api/learning/modules'],
    refetchInterval: 120000,
  });

  const modules = modulesData?.modules?.slice(0, 6) || [];

  return (
    <div className="pt-24 pb-16 px-4 min-h-[100dvh] bg-ink-page">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-core/10 border border-accent-core/30 mb-6">
            <Sparkles className="w-4 h-4 text-accent-bright" />
            <span className="text-sm text-accent-bright">Gamified Learning Experience</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div 
              className="p-4 rounded-2xl bg-accent-core shadow-xl glow-accent"
            >
              <GraduationCap className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
          
           <SectionTitle as="h1" className="text-4xl sm:text-5xl font-bold mb-4">
             Learning Hub
           </SectionTitle>
           <p className="text-lg text-secondary max-w-2xl mx-auto mb-6">
            Master Web3, DeFi, AI Trading & Market Intelligence through interactive courses. 
            Earn STREAM points while you learn.
          </p>

           <div className="flex items-center justify-center gap-6 text-sm text-muted mb-8">
            <div className="flex items-center gap-2">
               <div className="p-1.5 rounded-xl bg-gain/10">
                 <BookOpen className="w-4 h-4 text-gain" />
              </div>
              <span>6 Courses</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="p-1.5 rounded-xl bg-warn/10">
                 <Zap className="w-4 h-4 text-warn" />
              </div>
              <span>3,350+ STREAM Available</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="p-1.5 rounded-xl bg-accent-core/10">
                 <Trophy className="w-4 h-4 text-accent-bright" />
              </div>
              <span>Leaderboard</span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Surface key={i} className="h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {modules.map((module, index) => (
              <Link href={`/learn/${module.id}`} key={module.id}>
                <ModulePreviewCard module={module} index={index} />
              </Link>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link href="/learn">
               <Button
              size="lg"
               className="grad-accent glow-accent text-primary px-8 py-6 text-lg font-semibold group hover:bg-accent-deep"
              data-testid="explore-all-courses"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Explore All Courses
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
             { icon: BookOpen, label: 'Interactive Lessons', value: '14+', color: 'bg-accent-core' },
             { icon: Brain, label: 'Knowledge Quizzes', value: '14+', color: 'bg-accent-deep' },
             { icon: Trophy, label: 'STREAM Rewards', value: '3,350+', color: 'bg-warn' },
             { icon: Target, label: 'Skill Levels', value: '3', color: 'bg-gain' },
          ].map((stat, i) => (
             <Surface key={i} className="relative overflow-hidden p-4 text-center">
               <div className={cn("absolute inset-0 opacity-[0.06]", stat.color)} />
              <div className="relative">
                 <div className={cn("inline-flex p-2 rounded-xl mb-2", stat.color)}>
                   <stat.icon className="w-4 h-4 text-primary" />
                </div>
                 <StatValue label={stat.label} value={stat.value} valueClassName="text-2xl font-bold" />
              </div>
             </Surface>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default LearningHubSection;
