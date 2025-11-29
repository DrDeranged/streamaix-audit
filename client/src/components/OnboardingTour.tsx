import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart, ArrowRight, MousePointer2, CheckCircle2, Target, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { NeuralNetworkBackground } from './NeuralNetworkBackground';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  gradient: string;
  instructions: string[];
  action: {
    label: string;
    path: string;
  };
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to StreamAiX",
    subtitle: "AI-Powered Prediction Markets on Base",
    description: "Turn videos into insights, trade on predictions, and compete in leagues. 100+ AI agents trading 24/7.",
    icon: Sparkles,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Explore each feature with 'Try It' buttons",
      "Earn STREAM points for activity",
      "Join leagues to compete for prizes"
    ],
    action: {
      label: "Let's Go →",
      path: "/"
    }
  },
  {
    title: "AI Content Processor",
    subtitle: "Video → Summary → Market",
    description: "Paste any YouTube URL. AI extracts insights and creates tradeable prediction markets automatically.",
    icon: Zap,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Paste a YouTube or podcast URL",
      "AI generates summary + key predictions",
      "One-click to launch a prediction market"
    ],
    action: {
      label: "Try AI Processor →",
      path: "/create-summary"
    }
  },
  {
    title: "Markets & Leagues",
    subtitle: "Trade Predictions, Win Prizes",
    description: "Trade YES/NO on crypto, DeFi, and events. Join leagues to compete for prize pools up to 100K STREAM.",
    icon: TrendingUp,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Trade YES/NO positions on any market",
      "Join leagues and climb leaderboards",
      "Win from weekly prize pools"
    ],
    action: {
      label: "Explore Markets →",
      path: "/markets"
    }
  },
  {
    title: "Discover & Analytics",
    subtitle: "Real-Time Crypto Intelligence",
    description: "Live prices, AI signals, sentiment analysis. Everything you need to make informed predictions.",
    icon: BarChart3,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "View live crypto prices and charts",
      "Check AI-powered trading signals",
      "Analyze market sentiment"
    ],
    action: {
      label: "Open Discover →",
      path: "/discover"
    }
  },
  {
    title: "You're Ready!",
    subtitle: "Start Earning STREAM",
    description: "Create summaries, trade markets, win leagues. Your dashboard tracks everything.",
    icon: Rocket,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Visit your Dashboard to track progress",
      "Complete bounties for bonus rewards",
      "Invite friends to earn referral bonuses"
    ],
    action: {
      label: "Start Exploring →",
      path: "/"
    }
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; x: number }>>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for ?tour=1 URL parameter for testing
    const urlParams = new URLSearchParams(window.location.search);
    const forceTour = urlParams.get('tour') === '1';
    
    const hasSeenTour = localStorage.getItem('streamaix_tour_completed');
    if (forceTour || !hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  // Listen for custom event to trigger tour (for testing)
  useEffect(() => {
    const handleTriggerTour = () => {
      setIsOpen(true);
      setCurrentStep(0);
      setIsMinimized(false);
    };
    
    window.addEventListener('triggerOnboardingTour', handleTriggerTour);
    return () => window.removeEventListener('triggerOnboardingTour', handleTriggerTour);
  }, []);

  // Generate random particles for the stream effect
  useEffect(() => {
    const particleArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      x: Math.random() * 100
    }));
    setParticles(particleArray);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    localStorage.setItem('streamaix_tour_completed', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
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
    if (currentStep === 0) {
      handleNext();
      return;
    }
    
    if (currentStep === steps.length - 1) {
      handleClose();
      setLocation(path);
      return;
    }
    
    setLocation(path);
    setIsMinimized(true);
    
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setIsMinimized(false);
    }, 2000);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Minimized Floating Widget */}
          {isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <button
                onClick={toggleMinimize}
                className="group relative p-4 neural-glass rounded-3xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 glow-pulse overflow-hidden"
                data-testid="button-tour-minimized"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left pr-2">
                    <p className="text-xs text-white/80 font-medium font-orbitron">Tour Active</p>
                    <p className="text-sm text-white font-bold">Step {currentStep + 1}/{steps.length}</p>
                  </div>
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="url(#progress-gradient-mini)"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        className="energy-flow"
                      />
                      <defs>
                        <linearGradient id="progress-gradient-mini" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center text-xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  </div>
                </div>
                
                <div className="absolute inset-0 iridescent-shimmer rounded-3xl" />
              </button>
            </motion.div>
          )}

          {/* Full Tour Modal */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
              onClick={handleSkip}
            >
              {/* Neural Network Background */}
              <div className="absolute inset-0 overflow-hidden">
                <NeuralNetworkBackground />
              </div>

              {/* Modal Container */}
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.25 }}
                className="relative w-full max-w-4xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Main Card with Liquid Gradient Background */}
                <div className="relative neural-glass rounded-3xl shadow-2xl overflow-hidden iridescent-border liquid-gradient">
                  {/* Flowing Particle Stream - Reduced opacity */}
                  <div className="particle-stream opacity-30">
                    {particles.map((p) => (
                      <div
                        key={p.id}
                        className="particle"
                        style={{
                          left: `${p.x}%`,
                          bottom: 0,
                          animationDelay: `${p.delay}s`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="absolute top-6 right-6 z-20 flex gap-2">
                    <button
                      onClick={toggleMinimize}
                      className="text-gray-400 hover:text-white transition-all p-3 hover:bg-white/10 rounded-xl backdrop-blur-sm"
                      data-testid="button-minimize-tour"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSkip}
                      className="text-gray-400 hover:text-white transition-all p-3 hover:bg-white/10 rounded-xl backdrop-blur-sm"
                      data-testid="button-skip-onboarding"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="overflow-y-auto max-h-[85vh] scrollbar-thin relative z-10">
                    <div className="p-3 sm:p-4 md:p-6">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-5">
                        {/* Circular Progress & Icon with Energy Flow */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transform -rotate-90">
                            <defs>
                              <linearGradient id={`energy-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                            <circle
                              className="w-20 sm:w-24 md:w-32"
                              cx="50%"
                              cy="50%"
                              r={radius}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="3"
                              fill="none"
                            />
                            <motion.circle
                              className="energy-flow w-20 sm:w-24 md:w-32"
                              cx="50%"
                              cy="50%"
                              r={radius}
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </svg>
                          
                          {/* Icon in center */}
                          <motion.div
                            key={currentStep}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className={`p-1.5 sm:p-2.5 md:p-3.5 bg-gradient-to-br ${currentStepData.gradient} rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl`}>
                              <Icon className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2 justify-center sm:justify-start">
                              <span className="text-xs sm:text-sm font-bold font-orbitron bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 text-transparent bg-clip-text">
                                STEP {currentStep + 1} / {steps.length}
                              </span>
                              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 via-cyan-500/50 to-transparent hidden sm:block" />
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1.5 sm:mb-2 font-orbitron">
                              {currentStepData.title}
                            </h2>
                            <p className={`text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text mb-1.5 sm:mb-2.5 animate-gradient`}>
                              {currentStepData.subtitle}
                            </p>
                            <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                              {currentStepData.description}
                            </p>
                          </motion.div>
                        </div>
                      </div>

                      {/* Instructions Section */}
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-4 sm:mb-5"
                      >
                        <div className="relative neural-glass rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-purple-500/20 overflow-hidden">
                          <div className="absolute inset-0 iridescent-shimmer rounded-lg sm:rounded-xl opacity-50" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                              <div className={`p-1.5 bg-gradient-to-br ${currentStepData.gradient} rounded-lg`}>
                                <MousePointer2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                              </div>
                              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white font-orbitron">Quick Start Guide</h3>
                            </div>
                            
                            <div className="grid gap-1.5 sm:gap-2">
                              {currentStepData.instructions.map((instruction, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + index * 0.08 }}
                                  className="flex items-start gap-2 group hover:bg-white/5 p-1 sm:p-1.5 rounded-lg transition-all"
                                >
                                  {/* Simple numbered indicator */}
                                  <span className={`flex-shrink-0 text-xs font-bold bg-gradient-to-br ${currentStepData.gradient} text-transparent bg-clip-text pt-0.5`}>
                                    {index + 1}.
                                  </span>
                                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                                    {instruction}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Main Action Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center mb-3 sm:mb-4"
                      >
                        <Button
                          onClick={() => handleAction(currentStepData.action.path)}
                          className={`px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r ${currentStepData.gradient} hover:scale-105 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-300 rounded-lg`}
                          data-testid={`button-action-step-${currentStep}`}
                        >
                          <span className="flex items-center gap-1.5">
                            {currentStepData.action.label}
                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </span>
                        </Button>
                      </motion.div>

                      {/* Navigation Footer */}
                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/10">
                        <Button
                          onClick={handlePrevious}
                          disabled={currentStep === 0}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 sm:px-2.5 py-1 hover:bg-white/10 rounded-lg transition-all text-xs"
                          data-testid="button-previous-step"
                        >
                          <ChevronLeft className="mr-0.5 h-3 w-3" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>

                        <div className="flex items-center gap-1">
                          {steps.map((_, index) => (
                            <motion.div
                              key={index}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                index === currentStep 
                                  ? `w-5 bg-gradient-to-r ${currentStepData.gradient}` 
                                  : index < currentStep
                                  ? 'w-1 bg-green-500'
                                  : 'w-1 bg-white/20'
                              }`}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: index === currentStep ? 1 : 0.8 }}
                            />
                          ))}
                        </div>

                        <Button
                          onClick={handleNext}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white px-2 sm:px-2.5 py-1 hover:bg-white/10 rounded-lg transition-all text-xs"
                          data-testid="button-next-step"
                        >
                          <span className="hidden sm:inline">{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                          <span className="sm:hidden">{currentStep === steps.length - 1 ? 'Done' : 'Next'}</span>
                          <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
