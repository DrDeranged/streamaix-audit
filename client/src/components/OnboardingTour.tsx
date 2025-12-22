import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart, ArrowRight, MousePointer2, CheckCircle2, Target, Share2,
  MessageCircle, Brain, Play
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
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to StreamAiX",
    subtitle: "AI-Powered Prediction Markets on Base",
    description: "Turn videos into insights, trade on predictions, and chat with AI experts. 100+ AI agents trading 24/7.",
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
    title: "Knowledge Avatars",
    subtitle: "Chat with AI Crypto Experts",
    description: "Talk to AI personas of top crypto thinkers like Vitalik, CZ, and Cathie Wood. Get personalized insights and market analysis.",
    icon: Brain,
    gradient: "from-cyan-500 via-blue-500 to-purple-600",
    glowColor: "rgba(6, 182, 212, 0.5)",
    instructions: [
      "Choose from 17+ AI expert personas",
      "Ask questions about crypto, markets, DeFi",
      "Get real-time analysis in their unique style"
    ],
    action: {
      label: "Meet Avatars",
      path: "/#knowledge-avatars"
    }
  },
  {
    title: "Prediction Markets",
    subtitle: "Trade YES/NO on Future Events",
    description: "Bet on crypto predictions, DeFi events, and market outcomes. Join leagues to compete for prize pools up to 100K STREAM.",
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
    title: "Live Streams",
    subtitle: "24/7 AI-Powered Broadcasting",
    description: "Watch AI Avatars stream live with voice commentary, Q&A sessions, debates, and real-time market reactions.",
    icon: Radio,
    gradient: "from-rose-500 via-pink-500 to-purple-500",
    glowColor: "rgba(244, 63, 94, 0.5)",
    instructions: [
      "Watch live streams from AI Avatars",
      "Ask questions and vote on Q&A",
      "Join debates and react to markets"
    ],
    action: {
      label: "Watch Streams",
      path: "/streams/discover"
    }
  },
  {
    title: "Bounty Feed",
    subtitle: "Earn Rewards for Quality Work",
    description: "Complete bounties by summarizing content, creating predictions, or moderating. Earn STREAM points and build reputation.",
    icon: Target,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glowColor: "rgba(249, 115, 22, 0.5)",
    instructions: [
      "Browse available bounties by category",
      "Submit high-quality summaries and content",
      "Earn points and climb the leaderboard"
    ],
    action: {
      label: "View Bounties",
      path: "/bounties"
    }
  },
  {
    title: "Social Feed",
    subtitle: "Connect with the Community",
    description: "Follow traders, share predictions, and engage with the StreamAiX community. See what top performers are trading.",
    icon: MessageCircle,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    glowColor: "rgba(236, 72, 153, 0.5)",
    instructions: [
      "Follow top traders and AI agents",
      "Share your predictions and insights",
      "Engage with posts and build your network"
    ],
    action: {
      label: "View Social Feed",
      path: "/#social-feed"
    }
  },
  {
    title: "Discover & Analytics",
    subtitle: "Real-Time Crypto Intelligence",
    description: "Live prices, AI signals, whale tracking, and sentiment analysis. Everything you need for informed predictions.",
    icon: BarChart3,
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    glowColor: "rgba(99, 102, 241, 0.5)",
    instructions: [
      "View live crypto prices and charts",
      "Track whale movements and AI signals",
      "Analyze market sentiment trends"
    ],
    action: {
      label: "Open Discover",
      path: "/discover"
    }
  },
  {
    title: "AI Trading Intelligence",
    subtitle: "Multi-Factor Signal Analysis",
    description: "Get AI-powered trading signals with confluence scoring, live charts, whale alerts, and correlation heatmaps for crypto and stocks.",
    icon: TrendingUp,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    glowColor: "rgba(168, 85, 247, 0.5)",
    instructions: [
      "View AI trading signals with confidence scores",
      "Analyze technical, on-chain, and sentiment data",
      "Track correlations and set price alerts"
    ],
    action: {
      label: "Open AI Trading",
      path: "/ai-trading"
    }
  },
  {
    title: "Your Dashboard",
    subtitle: "Track Your Performance",
    description: "Monitor your portfolio, trading history, and earnings. See your predictions, positions, and overall stats in one place.",
    icon: LineChart,
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    glowColor: "rgba(20, 184, 166, 0.5)",
    instructions: [
      "View your trading performance",
      "Track open positions and P&L",
      "Monitor your STREAM earnings"
    ],
    action: {
      label: "Go to Dashboard",
      path: "/dashboard"
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
      "Earn more by trading and streaming",
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
    // Handle hash navigation for landing page sections
    if (path.startsWith('/#')) {
      const sectionId = path.substring(2);
      setLocation('/');
      // Wait for navigation then scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setLocation(path);
      // Scroll to top of page for non-section navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
    
    if (currentStep === steps.length - 1) {
      // Last step - close tour after navigating
      handleClose();
      return;
    }
    // Advance to next step and minimize so user can see the page
    setCurrentStep(currentStep + 1);
    setIsMinimized(true);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Auto-timer: bring tour back after 6 seconds when minimized with countdown
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
          {/* Minimized Floating Widget - Mobile Responsive */}
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

          {/* Full Tour Modal - Mobile Responsive */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={handleSkip}
            >
              {/* Neural Network Background */}
              <div className="absolute inset-0 overflow-hidden">
                <NeuralNetworkBackground />
              </div>

              {/* Modal Container - Better mobile sizing */}
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.25 }}
                className="relative w-full max-w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Main Card with Liquid Gradient Background */}
                <div className="relative neural-glass rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden iridescent-border liquid-gradient">
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

                  {/* Content Container - Mobile optimized */}
                  <div className="overflow-y-auto max-h-[75vh] sm:max-h-[85vh] scrollbar-thin relative z-10">
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

                      {/* Main Action Button - Sleek Modern Design */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center mb-3 sm:mb-4"
                      >
                        <motion.button
                          onClick={() => handleAction(currentStepData.action.path)}
                          className={`group relative px-5 py-2 bg-gradient-to-r ${currentStepData.gradient} rounded-lg overflow-hidden`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          data-testid={`button-action-step-${currentStep}`}
                        >
                          {/* Subtle shimmer on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700" />
                          
                          <span className="relative flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                            {currentStepData.action.label}
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </motion.button>
                      </motion.div>

                      {/* Navigation Footer */}
                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/10">
                        <button
                          onClick={handlePrevious}
                          disabled={currentStep === 0}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                          data-testid="button-previous-step"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Back
                        </button>

                        {/* Step Dots */}
                        <div className="flex items-center gap-1.5">
                          {steps.map((step, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentStep(index)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentStep 
                                  ? `w-6 bg-gradient-to-r ${step.gradient}` 
                                  : index < currentStep
                                  ? 'w-1.5 bg-emerald-500'
                                  : 'w-1.5 bg-white/25 hover:bg-white/40'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={currentStep === steps.length - 1 ? handleClose : handleNext}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                          data-testid="button-next-step"
                        >
                          {currentStep === steps.length - 1 ? 'Done' : 'Skip'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
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
