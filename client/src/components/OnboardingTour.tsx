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
    subtitle: "Your Web3 Hub for AI Content, DeFi Bounties, and Market Intelligence",
    description: "StreamAiX combines AI-powered content processing, prediction markets, institutional-grade analytics, and gamified bounties on the Base network. Turn content into markets, earn tokens, and access real-time intelligence—all on-chain.",
    icon: Sparkles,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Navigate through each feature by clicking 'Next'",
      "Visit actual pages with 'Try It' buttons",
      "Learn hands-on by interacting with real features",
      "Complete the tour to unlock your first rewards"
    ],
    action: {
      label: "Start Your Journey",
      path: "/"
    }
  },
  {
    title: "AI-Powered Summaries",
    subtitle: "Transform Content Into Knowledge Assets & Markets",
    description: "Convert podcasts, videos, and livestreams into comprehensive summaries using OpenAI Whisper + GPT-4o. Then instantly turn insights into prediction markets—creating tradeable forecasts from content analysis.",
    icon: Zap,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Paste any YouTube, podcast, or Twitch URL",
      "AI transcribes with 98% accuracy using Whisper",
      "GPT-4o generates chapters and key insights",
      "One-click to create prediction markets from content",
      "Markets auto-link to summaries for context",
      "Store forever on Arweave/IPFS decentralized storage"
    ],
    action: {
      label: "Try AI Summaries →",
      path: "/create"
    }
  },
  {
    title: "Prediction Markets",
    subtitle: "Trade on Future Outcomes with Real Money",
    description: "Binary YES/NO markets powered by smart contracts on Base. AMM-based pricing, real-time trading, and automated settlement. Create markets from AI summaries or trade on community predictions.",
    icon: TrendingUp,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Browse crypto, DeFi, and real-world event markets",
      "Buy YES/NO positions with instant pricing",
      "AMM automatically adjusts prices (x*y=k formula)",
      "Track your positions and P&L in real-time",
      "Earn from accurate predictions when markets resolve",
      "Build reputation on the predictor leaderboard"
    ],
    action: {
      label: "Explore Markets →",
      path: "/markets"
    }
  },
  {
    title: "Discovery & Analytics",
    subtitle: "Institutional-Grade Market Intelligence",
    description: "Access 9 analytics categories with 67+ live endpoints. AI trading signals, volatility forecasting, pattern recognition, and cross-market correlations. 3-tier API fallback ensures uninterrupted data flow.",
    icon: BarChart3,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Explore volatility forecasting with ML models",
      "View AI-powered Smart Insights with confidence scores",
      "Analyze real-time charts and trading signals",
      "Check sentiment analysis across social media",
      "Monitor cross-market correlations and regime detection",
      "Get personalized recommendations based on activity"
    ],
    action: {
      label: "Open Analytics →",
      path: "/discover"
    }
  },
  {
    title: "AI Chat Assistant",
    subtitle: "Your Personal Investment & Platform Guide",
    description: "GPT-4o powered assistant providing platform help, investment insights, market analysis, and personalized recommendations. Ask anything about features, strategies, or crypto trends.",
    icon: Bot,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Type questions in natural language",
      "Get platform help: 'How do bounties work?'",
      "Request market insights: 'Analyze Bitcoin trends'",
      "Ask about DeFi: 'What's happening with Uniswap?'",
      "Receive investment ideas based on your portfolio",
      "Chat history saved for easy reference"
    ],
    action: {
      label: "Chat with AI →",
      path: "/chat"
    }
  },
  {
    title: "Personal Dashboard",
    subtitle: "Your Summaries, Markets & Portfolio",
    description: "Track all your created summaries, active prediction market positions, bounty progress, and earnings in one place. Monitor your knowledge assets, P&L, and Web3 reputation.",
    icon: Crown,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "View all your AI summaries and NFTs",
      "Track prediction market positions and P&L",
      "Monitor bounty completions and earnings",
      "Check referral stats and bonus rewards",
      "See your STREAM token balance and staking",
      "Export data for tax reporting"
    ],
    action: {
      label: "View Dashboard →",
      path: "/profile"
    }
  },
  {
    title: "Social Integration",
    subtitle: "Connect & Share Across Web3",
    description: "Link Twitter, Lens Protocol, and Farcaster accounts. Share summaries across platforms, build Web3 reputation, and engage with decentralized social networks—all with one click.",
    icon: Share2,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Connect Twitter via OAuth for social sharing",
      "Link Lens Protocol for Web3 social graph",
      "Join Farcaster for decentralized posting",
      "Share summaries across all platforms at once",
      "Build cross-platform reputation and followers",
      "Earn from social engagement and referrals"
    ],
    action: {
      label: "Connect Social →",
      path: "/profile"
    }
  },
  {
    title: "Bounty System",
    subtitle: "Earn STREAM, ETH & USDC for Contributions",
    description: "Complete tasks, create content, and contribute to the ecosystem. Gamified with reputation levels, badges, streaks, and AI-powered quality scoring. Multi-token rewards distributed instantly.",
    icon: Coins,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Browse available bounties sorted by reward",
      "Accept tasks that match your skills",
      "Collaborate in real-time with WebSocket sync",
      "Submit work and earn multi-token rewards",
      "Level up reputation and unlock badges",
      "Climb the global bounty leaderboard"
    ],
    action: {
      label: "Explore Bounties →",
      path: "/bounties"
    }
  },
  {
    title: "Web3 & Wallet",
    subtitle: "On-Chain Ownership & DeFi Features",
    description: "Connect your Web3 wallet to unlock decentralized features. Own knowledge assets as NFTs, participate in staking, trade on Base network, and manage your STREAM tokens.",
    icon: Wallet,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Click 'Connect Wallet' in the navbar",
      "Approve MetaMask or WalletConnect request",
      "Switch to Base network (Chain ID 8453)",
      "View STREAM token balance in real-time",
      "Mint summaries as tradeable NFTs",
      "Stake tokens for governance and rewards"
    ],
    action: {
      label: "Connect Wallet →",
      path: "/"
    }
  },
  {
    title: "You're All Set!",
    subtitle: "Start Building Your Web3 Empire",
    description: "You've completed the StreamAiX tour! Create AI summaries, launch prediction markets, earn through bounties, access analytics, and build your decentralized portfolio. Let's go!",
    icon: Rocket,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Install StreamAiX as a PWA on any device",
      "Create your first AI summary and market",
      "Complete bounties to earn tokens daily",
      "Use analytics for smarter trading decisions",
      "Invite friends with your referral code",
      "Join our Discord and Twitter communities"
    ],
    action: {
      label: "Start Building →",
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
    const hasSeenTour = localStorage.getItem('streamaix_tour_completed');
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
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
                  <div className="overflow-y-auto max-h-[80vh] scrollbar-thin relative z-10">
                    <div className="p-10">
                      {/* Header Section */}
                      <div className="flex items-start gap-8 mb-8">
                        {/* Circular Progress & Icon with Energy Flow */}
                        <div className="relative flex-shrink-0">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <defs>
                              <linearGradient id={`energy-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="64"
                              cy="64"
                              r={radius}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="4"
                              fill="none"
                            />
                            <motion.circle
                              cx="64"
                              cy="64"
                              r={radius}
                              className="energy-flow"
                              strokeWidth="4"
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
                            <div className={`p-5 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-2xl`}>
                              <Icon className="h-10 w-10 text-white" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-sm font-bold font-orbitron bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 text-transparent bg-clip-text">
                                STEP {currentStep + 1} / {steps.length}
                              </span>
                              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 via-cyan-500/50 to-transparent" />
                            </div>
                            <h2 className="text-5xl font-bold text-white mb-3 font-orbitron">
                              {currentStepData.title}
                            </h2>
                            <p className={`text-xl font-semibold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text mb-4 animate-gradient`}>
                              {currentStepData.subtitle}
                            </p>
                            <p className="text-gray-300 text-lg leading-relaxed">
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
                        className="mb-8"
                      >
                        <div className="relative neural-glass rounded-2xl p-8 border border-purple-500/20 overflow-hidden">
                          <div className="absolute inset-0 iridescent-shimmer rounded-2xl opacity-50" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                              <div className={`p-2 bg-gradient-to-br ${currentStepData.gradient} rounded-lg`}>
                                <MousePointer2 className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold text-white font-orbitron">Quick Start Guide</h3>
                            </div>
                            
                            <div className="grid gap-3">
                              {currentStepData.instructions.map((instruction, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + index * 0.08 }}
                                  className="flex items-start gap-3 group hover:bg-white/5 p-2 rounded-lg transition-all"
                                >
                                  {/* Simple numbered indicator */}
                                  <span className={`flex-shrink-0 text-sm font-bold bg-gradient-to-br ${currentStepData.gradient} text-transparent bg-clip-text pt-0.5`}>
                                    {index + 1}.
                                  </span>
                                  <p className="text-gray-200 text-base leading-relaxed">
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
                        className="flex justify-center mb-8"
                      >
                        <Button
                          onClick={() => handleAction(currentStepData.action.path)}
                          className={`px-6 py-2.5 text-sm font-semibold bg-gradient-to-r ${currentStepData.gradient} hover:scale-105 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-300 rounded-lg`}
                          data-testid={`button-action-step-${currentStep}`}
                        >
                          <span className="flex items-center gap-2">
                            {currentStepData.action.label}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </motion.div>

                      {/* Navigation Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <Button
                          onClick={handlePrevious}
                          disabled={currentStep === 0}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all text-sm"
                          data-testid="button-previous-step"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1.5">
                          {steps.map((_, index) => (
                            <motion.div
                              key={index}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentStep 
                                  ? `w-6 bg-gradient-to-r ${currentStepData.gradient}` 
                                  : index < currentStep
                                  ? 'w-1.5 bg-green-500'
                                  : 'w-1.5 bg-white/20'
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
                          className="text-gray-400 hover:text-white px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all text-sm"
                          data-testid="button-next-step"
                        >
                          {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                          <ChevronRight className="ml-1 h-4 w-4" />
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
