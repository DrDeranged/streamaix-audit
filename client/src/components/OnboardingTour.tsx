import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart, ArrowRight, MousePointer2, CheckCircle2, Target, Share2,
  MessageCircle, Brain, Play, GraduationCap, Swords, PieChart,
  Receipt, Lightbulb, Hand, ArrowLeftRight, ChevronDown
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
  glowColor: string;
  instructions: string[];
  action: {
    label: string;
    path: string;
  };
  tip?: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to StreamAiX",
    subtitle: "AI-Powered Finance & Prediction Markets",
    description: "Your unified command center for crypto, stocks, and prediction markets. 100+ AI agents trade 24/7 while you earn rewards.",
    icon: Sparkles,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    glowColor: "rgba(139, 92, 246, 0.5)",
    instructions: [
      "Explore each feature with action buttons",
      "Earn STREAM points for every activity",
      "Chat with Knowledge Avatars for insights"
    ],
    action: {
      label: "Begin Tour",
      path: "/"
    }
  },
  {
    title: "Navigation & Carousel",
    subtitle: "Swipe Through Content Sections",
    description: "The home page uses a sliding carousel. Swipe left/right on mobile or use arrow buttons on desktop to explore different content sections.",
    icon: ArrowLeftRight,
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    glowColor: "rgba(56, 189, 248, 0.5)",
    instructions: [
      "Swipe horizontally to browse sections",
      "Click dots at the bottom to jump to sections",
      "Use arrow buttons on larger screens"
    ],
    action: {
      label: "Try Carousel",
      path: "/"
    },
    tip: "The sidebar menu gives you quick access to all pages"
  },
  {
    title: "Portfolio Command Center",
    subtitle: "Unified Asset Management + Tax Analytics",
    description: "Track crypto, stocks, ETFs, retirement accounts, and cash in one dashboard. Get AI-powered tax optimization (15% long-term vs 32% short-term rates) and personalized financial advice.",
    icon: PieChart,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    glowColor: "rgba(20, 184, 166, 0.5)",
    instructions: [
      "Add assets from crypto wallets or manually",
      "View real-time PnL and allocation charts",
      "Get tax-loss harvesting recommendations"
    ],
    action: {
      label: "Open Portfolio",
      path: "/portfolio"
    },
    tip: "The AI Financial Advisor gives personalized tips based on your holdings"
  },
  {
    title: "Knowledge Avatars",
    subtitle: "Chat with AI Crypto Experts",
    description: "Talk to AI personas of legendary investors like Buffett, Saylor, and CZ. Get personalized insights in their unique style.",
    icon: Brain,
    gradient: "from-cyan-500 via-blue-500 to-purple-600",
    glowColor: "rgba(6, 182, 212, 0.5)",
    instructions: [
      "Choose from 17+ AI expert personas",
      "Ask questions about crypto, stocks, macro",
      "Watch live avatar streams with voice"
    ],
    action: {
      label: "Meet Avatars",
      path: "/#avatars"
    }
  },
  {
    title: "Prediction Markets",
    subtitle: "Trade YES/NO on Future Events",
    description: "Bet on crypto predictions, earnings reports, Fed decisions, and market outcomes. Join leagues to compete for prize pools.",
    icon: TrendingUp,
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.5)",
    instructions: [
      "Browse trending markets and predictions",
      "Trade YES/NO positions with STREAM",
      "Join leagues and climb leaderboards"
    ],
    action: {
      label: "Explore Markets",
      path: "/markets"
    }
  },
  {
    title: "AI Content Processor",
    subtitle: "Video → Summary → Market",
    description: "Paste any YouTube URL. AI extracts insights and creates tradeable prediction markets automatically.",
    icon: Zap,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    glowColor: "rgba(245, 158, 11, 0.5)",
    instructions: [
      "Paste a YouTube or podcast URL",
      "AI generates summary + key predictions",
      "One-click to launch a prediction market"
    ],
    action: {
      label: "Try AI Processor",
      path: "/#ai-processor"
    }
  },
  {
    title: "Live Streams & Debates",
    subtitle: "24/7 AI-Powered Broadcasting",
    description: "Watch AI Avatars stream live with voice commentary, debate each other on markets, and react to breaking news in real-time.",
    icon: Radio,
    gradient: "from-rose-500 via-pink-500 to-purple-500",
    glowColor: "rgba(244, 63, 94, 0.5)",
    instructions: [
      "Watch live streams from AI Avatars",
      "Vote in real-time avatar debates",
      "Ask questions and influence discussions"
    ],
    action: {
      label: "Watch Streams",
      path: "/streams/discover"
    }
  },
  {
    title: "Bounty Feed",
    subtitle: "Earn Rewards for Quality Work",
    description: "Complete bounties by summarizing content, creating predictions, or moderating. Earn STREAM points and build your reputation.",
    icon: Target,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glowColor: "rgba(249, 115, 22, 0.5)",
    instructions: [
      "Browse available bounties by category",
      "Submit high-quality summaries",
      "Earn points and unlock badges"
    ],
    action: {
      label: "View Bounties",
      path: "/bounties"
    }
  },
  {
    title: "Your Dashboard",
    subtitle: "Track Your Performance",
    description: "Monitor your trading history, open positions, and earnings. See your portfolio performance, prediction accuracy, and STREAM balance all in one place.",
    icon: BarChart3,
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    glowColor: "rgba(139, 92, 246, 0.5)",
    instructions: [
      "View your trading performance and P&L",
      "Track open positions and predictions",
      "Monitor your STREAM earnings over time"
    ],
    action: {
      label: "Go to Dashboard",
      path: "/dashboard"
    }
  },
  {
    title: "Discover & Analytics",
    subtitle: "Real-Time Market Intelligence",
    description: "Live crypto and stock prices, AI signals, whale tracking, and sentiment analysis. Everything you need for informed trading decisions.",
    icon: Globe,
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    glowColor: "rgba(99, 102, 241, 0.5)",
    instructions: [
      "View live prices and market data",
      "Track whale movements and trends",
      "Analyze market sentiment in real-time"
    ],
    action: {
      label: "Open Discover",
      path: "/discover"
    }
  },
  {
    title: "AI Trading Intelligence",
    subtitle: "Multi-Factor Signal Analysis",
    description: "Get AI-powered trading signals combining technical analysis, on-chain data, whale movements, and sentiment for both crypto and stocks.",
    icon: Lightbulb,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    glowColor: "rgba(168, 85, 247, 0.5)",
    instructions: [
      "View AI signals with confidence scores",
      "Analyze technical + on-chain data",
      "Set price alerts for key levels"
    ],
    action: {
      label: "Open AI Trading",
      path: "/ai-trading"
    }
  },
  {
    title: "You've Earned 2,500 STREAM!",
    subtitle: "Your Signup Bonus is Ready",
    description: "Welcome to StreamAiX! Start trading, chatting with avatars, and earning more rewards today.",
    icon: Coins,
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    glowColor: "rgba(251, 191, 36, 0.5)",
    instructions: [
      "2,500 STREAM bonus added to your wallet",
      "Earn more by trading and completing quests",
      "Daily login streaks multiply rewards"
    ],
    action: {
      label: "View Points",
      path: "/points"
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
    let timer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    
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
          {isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
            >
              <button
                onClick={toggleMinimize}
                className="group relative p-2.5 sm:p-4 neural-glass rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 glow-pulse overflow-hidden"
                data-testid="button-tour-minimized"
              >
                <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                  <div className={`p-2 sm:p-3 bg-gradient-to-br ${currentStepData.gradient} rounded-xl sm:rounded-2xl shadow-lg`}>
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-left pr-1 sm:pr-2">
                    <p className="text-[10px] sm:text-xs text-white/80 font-medium font-orbitron">Resuming in {countdown}s</p>
                    <p className="text-xs sm:text-sm text-white font-bold">Step {currentStep + 1}/{steps.length}</p>
                  </div>
                  <div className="relative w-8 h-8 sm:w-12 sm:h-12">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="12"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                        fill="none"
                        className="sm:hidden"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="12"
                        stroke="url(#progress-gradient-mini)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 12}`}
                        strokeDashoffset={`${2 * Math.PI * 12 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        className="energy-flow sm:hidden"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                        fill="none"
                        className="hidden sm:block"
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
                        className="energy-flow hidden sm:block"
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
                      className="absolute inset-0 flex items-center justify-center text-sm sm:text-xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  </div>
                </div>
                
                <div className="absolute inset-0 iridescent-shimmer rounded-2xl sm:rounded-3xl" />
              </button>
            </motion.div>
          )}

          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={handleSkip}
            >
              <div className="absolute inset-0 overflow-hidden">
                <NeuralNetworkBackground />
              </div>

              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.25 }}
                className="relative w-full max-w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative neural-glass rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden iridescent-border liquid-gradient">
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

                  <div className="overflow-y-auto max-h-[75vh] sm:max-h-[85vh] scrollbar-thin relative z-10">
                    <div className="p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-5">
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

                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-4 sm:mb-5"
                      >
                        <div className="grid gap-2 sm:gap-2.5">
                          {currentStepData.instructions.map((instruction, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                            >
                              <div className={`p-1 sm:p-1.5 bg-gradient-to-br ${currentStepData.gradient} rounded-md sm:rounded-lg flex-shrink-0`}>
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-200">{instruction}</span>
                            </motion.div>
                          ))}
                        </div>
                        
                        {currentStepData.tip && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-3 p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm text-amber-200">{currentStepData.tip}</p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>

                      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                        <Button
                          variant="ghost"
                          onClick={handlePrevious}
                          disabled={currentStep === 0}
                          className="text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 text-xs sm:text-sm px-2 sm:px-4"
                          data-testid="button-previous-step"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {steps.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentStep(index)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                index === currentStep 
                                  ? 'bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 w-4 sm:w-6' 
                                  : index < currentStep 
                                    ? 'bg-white/50' 
                                    : 'bg-white/20'
                              }`}
                              data-testid={`button-step-indicator-${index}`}
                            />
                          ))}
                        </div>

                        <div className="flex gap-1.5 sm:gap-2">
                          <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-4"
                            data-testid="button-skip-tour"
                          >
                            Skip
                          </Button>
                          <Button
                            onClick={() => handleAction(currentStepData.action.path)}
                            className={`bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-medium text-xs sm:text-sm px-3 sm:px-5 shadow-lg`}
                            data-testid="button-tour-action"
                          >
                            {currentStepData.action.label}
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                          </Button>
                        </div>
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
