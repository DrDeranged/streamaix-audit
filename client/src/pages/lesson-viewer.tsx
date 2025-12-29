import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useLocation } from 'wouter';
import {
  BookOpen, ChevronRight, ChevronLeft, Clock, Zap,
  CheckCircle2, XCircle, Play, ArrowLeft, Trophy,
  Sparkles, Brain, Target, Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  lessonCount: number;
}

function QuizCard({ 
  quiz, 
  onSubmit, 
  isSubmitting 
}: { 
  quiz: Quiz; 
  onSubmit: (quizId: string, answer: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    xpEarned: number;
    explanation: string;
    correctAnswer: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    
    try {
      const response = await apiRequest(`/api/learning/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ selectedAnswer }),
      });
      
      setResult(response);
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-purple-500/30 p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Knowledge Check</h3>
      </div>
      
      <p className="text-white mb-4">{quiz.question}</p>
      
      <div className="space-y-3 mb-6">
        {quiz.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const showResult = result !== null;
          const isCorrectOption = result?.correctAnswer === option.id;
          const isWrongSelected = showResult && isSelected && !result?.isCorrect;
          
          return (
            <button
              key={option.id}
              onClick={() => !result && setSelectedAnswer(option.id)}
              disabled={!!result}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all",
                result 
                  ? isCorrectOption
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : isWrongSelected
                      ? "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-slate-700/50 border-slate-600 text-gray-400"
                  : isSelected
                    ? "bg-purple-500/20 border-purple-500 text-white"
                    : "bg-slate-700/50 border-slate-600 text-gray-300 hover:border-purple-500/50"
              )}
              data-testid={`quiz-option-${option.id}`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {showResult && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {showResult && isWrongSelected && <XCircle className="w-5 h-5 text-rose-400" />}
              </div>
            </button>
          );
        })}
      </div>
      
      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg mb-4",
            result.isCorrect ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-amber-500/20 border border-amber-500/30"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.isCorrect ? (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Correct! +{result.xpEarned} STREAM</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold">Not quite right</span>
              </>
            )}
          </div>
          <p className="text-gray-300 text-sm">{result.explanation}</p>
        </motion.div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400"
          data-testid="submit-quiz"
        >
          Submit Answer
        </Button>
      )}
    </Card>
  );
}

export default function LessonViewer() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId?: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [startTime] = useState(Date.now());

  const { data: moduleData, isLoading: moduleLoading } = useQuery<{
    module: LearningModule;
    lessons: Lesson[];
  }>({
    queryKey: ['/api/learning/modules', moduleId],
    enabled: !!moduleId,
  });

  const module = moduleData?.module;
  const lessons = moduleData?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const currentLessonId = currentLesson?.id || lessonId;

  const { data: lessonData } = useQuery<{
    lesson: Lesson;
    quizzes: Quiz[];
  }>({
    queryKey: ['/api/learning/lessons', currentLessonId],
    enabled: !!currentLessonId,
  });

  const { data: progressData } = useQuery({
    queryKey: ['/api/learning/progress'],
    enabled: !!user,
  });

  const startModuleMutation = useMutation({
    mutationFn: () => apiRequest(`/api/learning/modules/${moduleId}/start`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: (id: string) => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      return apiRequest(`/api/learning/lessons/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ timeSpentSeconds: timeSpent }),
      });
    },
    onSuccess: (data: any) => {
      if (data.xpEarned > 0) {
        toast({
          title: "Lesson Complete!",
          description: `You earned ${data.xpEarned} STREAM points`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    },
  });

  const quizzes = lessonData?.quizzes || [];

  useEffect(() => {
    if (user && moduleId && !moduleLoading) {
      startModuleMutation.mutate();
    }
  }, [user, moduleId, moduleLoading]);

  useEffect(() => {
    if (lessonId && lessons.length > 0) {
      const idx = lessons.findIndex(l => l.id === lessonId);
      if (idx >= 0) setCurrentLessonIndex(idx);
    }
  }, [lessonId, lessons]);

  const goToNextLesson = () => {
    if (currentLesson && user) {
      completeLessonMutation.mutate(currentLesson.id);
    }
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const goToPrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const progressPercent = lessons.length > 0 
    ? Math.round(((currentLessonIndex + 1) / lessons.length) * 100)
    : 0;

  if (moduleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-20 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading course...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-20 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Course not found</p>
        <Link href="/learn">
          <Button variant="outline">Back to Learning Hub</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Courses
            </Button>
          </Link>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-purple-500/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Badge variant="outline" className="mb-2 border-purple-500/30 text-purple-400">
                {module.title}
              </Badge>
              <h1 className="text-xl font-bold text-white">{currentLesson?.title || 'Loading...'}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Lesson {currentLessonIndex + 1} of {lessons.length}</p>
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-4 h-4" />
                <span className="font-bold">{currentLesson?.xpReward || 0} STREAM</span>
              </div>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-700" />
        </Card>

        {currentLesson && (
          <motion.div
            key={currentLesson.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-slate-700/50 p-6 mb-6">
              <div className="prose prose-invert prose-purple max-w-none">
                <div 
                  className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentLesson.content
                      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-white mt-6 mb-3">$1</h2>')
                      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-purple-300 mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                      .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300">$1</li>')
                      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 text-gray-300">$2</li>')
                      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto"><code class="text-emerald-400">$1</code></pre>')
                  }}
                />
              </div>
            </Card>

            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onSubmit={() => {}}
                isSubmitting={false}
              />
            ))}
          </motion.div>
        )}

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goToPrevLesson}
            disabled={currentLessonIndex === 0}
            className="border-slate-600"
            data-testid="prev-lesson"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {currentLessonIndex < lessons.length - 1 ? (
            <Button
              onClick={goToNextLesson}
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400"
              data-testid="next-lesson"
            >
              Next Lesson
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (currentLesson && user) {
                  completeLessonMutation.mutate(currentLesson.id);
                }
                setLocation('/learn');
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
              data-testid="complete-course"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Complete Course
            </Button>
          )}
        </div>

        {lessons.length > 0 && (
          <Card className="bg-slate-900/80 border-slate-700/50 p-4 mt-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Course Outline</h3>
            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLessonIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                    idx === currentLessonIndex
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "hover:bg-slate-800"
                  )}
                  data-testid={`lesson-nav-${idx}`}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    idx < currentLessonIndex ? "bg-emerald-500 text-white" :
                    idx === currentLessonIndex ? "bg-purple-500 text-white" :
                    "bg-slate-700 text-gray-400"
                  )}>
                    {idx < currentLessonIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={cn(
                    "flex-1 text-sm",
                    idx === currentLessonIndex ? "text-white" : "text-gray-400"
                  )}>
                    {lesson.title}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes}m
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
