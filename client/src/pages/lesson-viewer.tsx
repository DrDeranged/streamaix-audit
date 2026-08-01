import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams, useLocation } from 'wouter';
import {
  ChevronRight, ChevronLeft, Clock, Zap,
  CheckCircle2, XCircle, ArrowLeft, Trophy,
  Sparkles, Brain, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
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
    <Surface className="p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-accent-bright" />
        <SectionTitle as="h3">Knowledge Check</SectionTitle>
      </div>
      
      <p className="text-body mb-4">{quiz.question}</p>
      
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
                "w-full text-left p-4 rounded-xl border border-ink-edge transition-all",
                result 
                  ? isCorrectOption
                    ? "bg-ink-raised border-gain text-gain"
                    : isWrongSelected
                      ? "bg-ink-raised border-loss text-loss"
                      : "bg-ink-raised text-muted"
                  : isSelected
                    ? "bg-accent-core/20 border-accent-core text-primary glow-accent"
                    : "bg-ink-raised text-body hover:border-accent-core/50"
              )}
              data-testid={`quiz-option-${option.id}`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {showResult && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-gain" />}
                {showResult && isWrongSelected && <XCircle className="w-5 h-5 text-loss" />}
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
            "p-4 rounded-xl mb-4 border",
            result.isCorrect ? "bg-ink-raised border-gain/30" : "bg-ink-raised border-warn/30"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.isCorrect ? (
              <>
                <Sparkles className="w-5 h-5 text-gain" />
                <span className="text-gain font-bold">Correct! +{result.xpEarned} STREAM</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-warn" />
                <span className="text-warn font-bold">Not quite right</span>
              </>
            )}
          </div>
          <p className="text-body text-sm">{result.explanation}</p>
        </motion.div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitting}
           className="w-full grad-accent glow-accent rounded-xl"
          data-testid="submit-quiz"
        >
          Submit Answer
        </Button>
      )}
    </Surface>
  );
}

export default function LessonViewer() {
  const params = useParams();
  const moduleId = params.moduleId || params['0'];
  const lessonId = params.lessonId || params['1'];
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [startTime] = useState(Date.now());
  
  const [courseModule, setCourseModule] = useState<LearningModule | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [currentLessonData, setCurrentLessonData] = useState<{ lesson: Lesson; quizzes: Quiz[] } | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    let cancelled = false;
    setModuleLoading(true);
    setModuleError(null);
    
    const authToken = localStorage.getItem('auth_token');
    fetch(`/api/learning/modules/${moduleId}`, {
      credentials: 'include',
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        console.log('[LessonViewer] Module loaded:', data?.module?.title, 'Lessons:', data?.lessons?.length);
        setCourseModule(data.module || null);
        setLessons(Array.isArray(data.lessons) ? data.lessons : []);
        setModuleLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[LessonViewer] Failed to load module:', err);
        setModuleError(err.message);
        setModuleLoading(false);
      });
    
    return () => { cancelled = true; };
  }, [moduleId]);
  
  const currentLesson = lessons[currentLessonIndex];
  const currentLessonId = currentLesson?.id || lessonId;

  useEffect(() => {
    if (!currentLessonId) return;
    let cancelled = false;
    const authToken = localStorage.getItem('auth_token');
    
    fetch(`/api/learning/lessons/${currentLessonId}`, {
      credentials: 'include',
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setCurrentLessonData({ lesson: data.lesson, quizzes: data.quizzes || [] });
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[LessonViewer] Failed to load lesson:', err);
      });
    
    return () => { cancelled = true; };
  }, [currentLessonId]);

  const { data: progressData } = useQuery({
    queryKey: ['/api/learning/progress'],
    enabled: !!user,
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [hasStartedModule, setHasStartedModule] = useState(false);

  const startModuleMutation = useMutation({
    mutationFn: () => apiRequest(`/api/learning/modules/${moduleId}/start`, { method: 'POST' }),
    onSuccess: () => {
      setHasStartedModule(true);
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    },
    onError: () => {
      setHasStartedModule(true);
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

  const quizzes = currentLessonData?.quizzes || [];

  useEffect(() => {
    if (user && moduleId && !moduleLoading && !hasStartedModule) {
      startModuleMutation.mutate();
    }
  }, [user, moduleId, moduleLoading, hasStartedModule]);

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
      <div className="min-h-screen bg-ink-page pt-20 flex items-center justify-center">
        <div className="animate-pulse text-secondary">Loading course...</div>
      </div>
    );
  }

  if (!courseModule && !moduleLoading) {
    return (
      <div className="min-h-screen bg-ink-page pt-20 flex flex-col items-center justify-center gap-4">
        <p className="text-secondary">{moduleError ? 'Failed to load course. Please try again.' : 'Course not found'}</p>
        <Link href="/learn">
          <Button variant="outline">Back to Learning Hub</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-page pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/#learn">
            <Button variant="ghost" size="sm" className="text-secondary hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Courses
            </Button>
          </Link>
        </div>

        <Surface className="p-4 mb-6 grad-surface">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Badge variant="outline" className="mb-2 border-accent-core/30 text-accent-bright">
                {courseModule?.title || 'Course'}
              </Badge>
              <SectionTitle as="h1">{currentLesson?.title || 'Loading...'}</SectionTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary">Lesson {currentLessonIndex + 1} of {lessons.length}</p>
              <div className="flex items-center gap-1 text-warn tabular">
                <Zap className="w-4 h-4" />
                <span className="font-bold">{currentLesson?.xpReward || 0} STREAM</span>
              </div>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 bg-ink-raised" />
        </Surface>

        {currentLesson && (
          <motion.div
            key={currentLesson.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Surface className="p-6 mb-6">
              <div className="prose max-w-none">
                <div 
                  className="text-body leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentLesson.content
                       .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-primary mt-6 mb-3">$1</h2>')
                       .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-accent-bright mt-4 mb-2">$1</h3>')
                       .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                       .replace(/^- (.*$)/gm, '<li class="ml-4 text-body">$1</li>')
                       .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 text-body">$2</li>')
                       .replace(/```([\s\S]*?)```/g, '<pre class="bg-ink-raised p-4 rounded-xl overflow-x-auto"><code class="text-gain">$1</code></pre>')
                  }}
                />
              </div>
            </Surface>

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
            className="border-ink-edge rounded-xl"
            data-testid="prev-lesson"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {currentLessonIndex < lessons.length - 1 ? (
            <Button
              onClick={goToNextLesson}
              className="grad-accent glow-accent rounded-xl"
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
              className="bg-accent-deep hover:bg-accent-core rounded-xl"
              data-testid="complete-course"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Complete Course
            </Button>
          )}
        </div>

        {lessons.length > 0 && (
          <Surface className="p-4 mt-8">
            <SectionTitle as="h3" className="mb-3">Course Outline</SectionTitle>
            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLessonIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left",
                    idx === currentLessonIndex
                      ? "bg-accent-core/20 border border-accent-core/30 glow-accent"
                      : "hover:bg-ink-raised"
                  )}
                  data-testid={`lesson-nav-${idx}`}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold",
                    idx < currentLessonIndex ? "bg-gain text-primary" :
                    idx === currentLessonIndex ? "bg-accent-core text-primary" :
                    "bg-ink-raised text-muted"
                  )}>
                    {idx < currentLessonIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={cn(
                    "flex-1 text-sm",
                    idx === currentLessonIndex ? "text-primary" : "text-secondary"
                  )}>
                    {lesson.title}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes}m
                  </span>
                </button>
              ))}
            </div>
          </Surface>
        )}
      </div>
    </div>
  );
}
