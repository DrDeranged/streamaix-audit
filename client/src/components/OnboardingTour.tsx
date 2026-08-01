import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Coins, TrendingUp, Bot,
  ArrowRight, Brain, Radio, Zap, Target, GraduationCap, PieChart,
  Lightbulb, ArrowLeftRight, MousePointer2, Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

interface FeatureRow {
  icon: any;
  name: string;
  description: string; // max 9 words
  path: string;
}

interface TourStep {
  title: string;
  eyebrow: string;
  description: string; // max 2 sentences
  rows?: FeatureRow[];
  action: {
    label: string;
    path: string;
  };
}

const steps: TourStep[] = [
  {
    title: 'Welcome to StreamAiX',
    eyebrow: 'The AI trading ledger',
    description:
      '100 autonomous agents trade and debate around the clock while you follow along. Trade prediction markets and earn STREAM points on every activity.',
    action: { label: 'Show me around', path: '/' },
  },
  {
    title: 'Find your way',
    eyebrow: 'Navigation',
    description:
      'The home page is a sliding carousel. The sidebar reaches every page.',
    rows: [
      {
        icon: ArrowLeftRight,
        name: 'Carousel',
        description: 'Swipe left or right to browse sections',
        path: '/',
      },
      {
        icon: MousePointer2,
        name: 'Sidebar',
        description: 'Quick access to every page',
        path: '/',
      },
      {
        icon: Circle,
        name: 'Bottom dots',
        description: 'Tap a dot to jump to a section',
        path: '/',
      },
    ],
    action: { label: 'Try the carousel', path: '/' },
  },
  {
    title: 'Trade the markets',
    eyebrow: 'Markets',
    description:
      'Three ways to trade, all powered by STREAM points.',
    rows: [
      {
        icon: TrendingUp,
        name: 'Prediction Markets',
        description: 'Trade YES/NO on real events',
        path: '/markets',
      },
      {
        icon: Bot,
        name: 'Bot Trading Simulator',
        description: 'Stake on AI traders, earn returns',
        path: '/bot-trading',
      },
      {
        icon: Lightbulb,
        name: 'AI Trading Intelligence',
        description: 'Multi-factor signals with confidence scores',
        path: '/ai-trading',
      },
    ],
    action: { label: 'Explore markets', path: '/markets' },
  },
  {
    title: 'Meet the AI ecosystem',
    eyebrow: 'AI agents',
    description:
      'The agents analyze, broadcast, and turn content into markets.',
    rows: [
      {
        icon: Brain,
        name: 'Knowledge Avatars',
        description: 'Chat with AI investing experts',
        path: '/#avatars',
      },
      {
        icon: Radio,
        name: 'Live Streams & Debates',
        description: '24/7 broadcasts and live debates',
        path: '/streams/discover',
      },
      {
        icon: Zap,
        name: 'AI Content Processor',
        description: 'Video to summary to market',
        path: '/#ai-processor',
      },
    ],
    action: { label: 'Meet the agents', path: '/#avatars' },
  },
  {
    title: 'Earn & learn',
    eyebrow: 'Rewards',
    description:
      'Every activity earns STREAM. Your progress compounds.',
    rows: [
      {
        icon: Coins,
        name: 'STREAM points',
        description: 'Earned on every activity',
        path: '/points',
      },
      {
        icon: Target,
        name: 'Bounty Feed',
        description: 'Complete tasks for rewards',
        path: '/bounties',
      },
      {
        icon: PieChart,
        name: 'Portfolio Command Center',
        description: 'Unified assets plus tax analytics',
        path: '/portfolio',
      },
      {
        icon: GraduationCap,
        name: 'Learning Hub',
        description: 'Crypto and trading skills',
        path: '/learn',
      },
    ],
    action: { label: 'Start earning', path: '/points' },
  },
  {
    title: 'Claim 2,500 STREAM!',
    eyebrow: 'Signup bonus',
    description:
      'Create your account and receive 2,500 STREAM points instantly. Start trading, chatting with avatars, and earning more rewards.',
    action: { label: 'Sign up now', path: '/auth' },
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceTour = urlParams.get('tour') === '1';

    const hasSeenTour = localStorage.getItem('streamaix_tour_completed');
    if (forceTour || !hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  useEffect(() => {
    const handleTriggerTour = () => {
      setIsOpen(true);
      setCurrentStep(0);
      setIsMinimized(false);
    };

    window.addEventListener('triggerOnboardingTour', handleTriggerTour);
    return () => window.removeEventListener('triggerOnboardingTour', handleTriggerTour);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    localStorage.setItem('streamaix_tour_completed', 'true');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleAction = (path: string) => {
    if (path.startsWith('/#')) {
      const sectionId = path.substring(2);
      setLocation('/');
      // Dispatch custom event for carousel navigation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigateCarouselSection', {
          detail: { sectionId }
        }));
      }, 300);
    } else {
      setLocation(path);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }

    if (currentStep === steps.length - 1) {
      handleClose();
      return;
    }
    setCurrentStep(currentStep + 1);
    setIsMinimized(true);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    if (isMinimized) {
      setCountdown(6);

      countdownInterval = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);

      timer = setTimeout(() => {
        setIsMinimized(false);
      }, 6000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isMinimized, currentStep]);

  const currentStepData = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
            >
              <button
                onClick={toggleMinimize}
                className="rounded-xl border border-ink-edge bg-ink-surface px-4 py-3 text-left transition-colors hover:bg-ink-raised"
                data-testid="button-tour-minimized"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Resuming in {countdown}s
                </p>
                <p className="tabular text-sm font-medium text-primary">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </button>
            </motion.div>
          )}

          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
              onClick={handleSkip}
            >
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
                className="relative w-full sm:max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Surface
                  className={
                    isLast
                      ? 'grad-surface overflow-hidden rounded-t-2xl rounded-b-none sm:rounded-2xl'
                      : 'overflow-hidden rounded-t-2xl rounded-b-none sm:rounded-2xl'
                  }
                >
                  <div className="flex items-start justify-between gap-3 px-5 pt-5">
                    <SectionTitle as="h2" eyebrow={currentStepData.eyebrow}>
                      {currentStepData.title}
                    </SectionTitle>
                    <div className="-mr-1 -mt-1 flex items-center gap-1">
                      <button
                        onClick={toggleMinimize}
                        className="rounded-xl p-2.5 text-muted transition-colors hover:bg-ink-raised hover:text-primary"
                        data-testid="button-minimize-tour"
                        aria-label="Minimize tour"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleSkip}
                        className="rounded-xl p-2.5 text-muted transition-colors hover:bg-ink-raised hover:text-primary"
                        data-testid="button-skip-onboarding"
                        aria-label="Close tour"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[55vh] overflow-y-auto px-5 pb-2 pt-3 sm:max-h-[60vh]">
                    <p className="text-sm leading-relaxed text-body">
                      {currentStepData.description}
                    </p>

                    {currentStepData.rows && (
                      <div className="mt-4">
                        {currentStepData.rows.map((row) => {
                          const RowIcon = row.icon;
                          return (
                            <button
                              key={row.name}
                              onClick={() => handleAction(row.path)}
                              className="flex min-h-[44px] w-full items-center gap-3 border-b border-ink-divider py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink-raised"
                              data-testid={`button-tour-row-${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-core/35 bg-accent-core/10 text-accent-bright">
                                <RowIcon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-primary">
                                  {row.name}
                                </span>
                                <span className="block truncate text-xs text-secondary">
                                  {row.description}
                                </span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-ink-divider px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        {steps.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index <= currentStep ? 'bg-accent-core' : 'bg-ink-edge'
                            }`}
                            data-testid={`button-step-indicator-${index}`}
                            aria-label={`Go to step ${index + 1}`}
                          />
                        ))}
                      </div>
                      <span className="tabular hidden text-xs text-muted sm:inline">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {!isFirst && (
                        <Button
                          variant="ghost"
                          onClick={handlePrevious}
                          className="rounded-xl px-2 text-xs text-secondary hover:bg-ink-raised hover:text-primary sm:px-3 sm:text-sm"
                          data-testid="button-previous-step"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Back</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="rounded-xl px-2 text-xs text-muted hover:bg-ink-raised hover:text-primary sm:px-3 sm:text-sm"
                        data-testid="button-skip-tour"
                      >
                        {isLast ? 'Explore first' : isFirst ? 'Skip tour' : 'Skip'}
                      </Button>
                      <Button
                        onClick={() => handleAction(currentStepData.action.path)}
                        className={`grad-accent rounded-xl px-3 text-xs font-medium text-white hover:opacity-90 sm:px-5 sm:text-sm ${
                          isLast ? 'glow-accent' : ''
                        }`}
                        data-testid="button-tour-action"
                      >
                        {currentStepData.action.label}
                        <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
