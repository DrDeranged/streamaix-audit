import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  GraduationCap, BookOpen, Brain, Target, Trophy,
  ChevronRight, Clock, Zap, CheckCircle2, Play,
  Sparkles, Award, BarChart3, Lightbulb, ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

const categoryColors: Record<string, { from: string; to: string }> = {
  web3_basics: { from: 'from-purple-600', to: 'to-fuchsia-500' },
  defi: { from: 'from-cyan-500', to: 'to-blue-600' },
  ai_trading: { from: 'from-emerald-500', to: 'to-teal-500' },
  prediction_markets: { from: 'from-amber-500', to: 'to-orange-500' },
  macro_economics: { from: 'from-rose-500', to: 'to-pink-500' },
  tech_stocks: { from: 'from-indigo-500', to: 'to-violet-500' },
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/20',
  intermediate: 'text-amber-400 bg-amber-500/20',
  advanced: 'text-rose-400 bg-rose-500/20',
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
      <Card className="relative overflow-hidden bg-slate-900/60 border-slate-700/50 p-5 h-full backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group">
        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", colors.from, colors.to)} />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg", colors.from, colors.to)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <Badge className={cn("text-xs", difficultyColors[module.difficulty])}>
              {module.difficulty}
            </Badge>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
            {module.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{module.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
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
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3 h-3" />
              {module.xpReward} STREAM
            </span>
          </div>
        </div>
      </Card>
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
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Gamified Learning Experience</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div 
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-xl shadow-purple-500/25"
              animate={{ 
                boxShadow: ['0 10px 40px -10px rgba(168,85,247,0.4)', '0 10px 60px -10px rgba(168,85,247,0.6)', '0 10px 40px -10px rgba(168,85,247,0.4)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-4">
            Learning Hub
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            Master Web3, DeFi, AI Trading & Market Intelligence through interactive courses. 
            Earn STREAM points while you learn.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <span>6 Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <span>3,350+ STREAM Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <span>Leaderboard</span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-48 bg-slate-800/50 animate-pulse" />
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
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white px-8 py-6 text-lg font-semibold shadow-xl shadow-purple-500/25 group"
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
            { icon: BookOpen, label: 'Interactive Lessons', value: '14+', color: 'from-purple-500 to-fuchsia-500' },
            { icon: Brain, label: 'Knowledge Quizzes', value: '14+', color: 'from-cyan-500 to-blue-500' },
            { icon: Trophy, label: 'STREAM Rewards', value: '3,350+', color: 'from-amber-500 to-orange-500' },
            { icon: Target, label: 'Skill Levels', value: '3', color: 'from-emerald-500 to-teal-500' },
          ].map((stat, i) => (
            <Card key={i} className="relative overflow-hidden bg-slate-900/60 border-slate-700/50 p-4 text-center backdrop-blur-sm">
              <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", stat.color)} />
              <div className="relative">
                <div className={cn("inline-flex p-2 rounded-lg bg-gradient-to-br mb-2", stat.color)}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default LearningHubSection;
