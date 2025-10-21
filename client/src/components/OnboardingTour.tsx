import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart, ArrowRight, MousePointer2, CheckCircle2
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
    description: "StreamAiX is your all-in-one platform combining AI-powered content processing, gamified bounty rewards, institutional-grade analytics, and Web3 integration on the Base network. Earn tokens, access real-time market data, and own your digital assets on-chain.",
    icon: Sparkles,
    gradient: "from-purple-500 via-pink-500 to-red-500",
    instructions: [
      "Explore each feature by clicking 'Next'",
      "Each step will guide you to the actual page",
      "Learn hands-on by interacting with real features",
      "Complete the tour to unlock your first rewards"
    ],
    action: {
      label: "Start Your Journey",
      path: "/"
    }
  },
  {
    title: "Create AI Summaries",
    subtitle: "Transform Content with AI Power",
    description: "Head to the Create page to convert podcasts, videos, and livestreams into comprehensive blog-style summaries. Our AI uses OpenAI Whisper for transcription and GPT-4o for intelligent chapter generation.",
    icon: Zap,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Click the button below to visit the Create page",
      "Paste a YouTube, podcast, or livestream URL",
      "Click 'Process Content' to start AI analysis",
      "Get AI-generated chapters, insights, and key takeaways",
      "Your summary is stored on IPFS/Arweave forever"
    ],
    action: {
      label: "Try Creating Content →",
      path: "/create"
    }
  },
  {
    title: "Earn with Bounties",
    subtitle: "Get Rewarded for Your Work",
    description: "The Bounties page is where you earn STREAM, ETH, and USDC tokens! Complete tasks, level up your reputation, unlock badges, and compete on the leaderboard.",
    icon: Coins,
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    instructions: [
      "Click below to explore the Bounties Board",
      "Browse available bounties sorted by reward amount",
      "Click 'Accept Bounty' to start working",
      "Complete the task and submit your work",
      "Earn multi-token rewards instantly on-chain",
      "Track your reputation level and unlock badges"
    ],
    action: {
      label: "Explore Bounty Board →",
      path: "/bounties"
    }
  },
  {
    title: "Real-Time Collaboration",
    subtitle: "Work Together, Earn Together",
    description: "On the Bounties page, you can collaborate with others in real-time. WebSocket technology powers live editing, cursor tracking, and instant reward distribution.",
    icon: Users,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    instructions: [
      "Open any bounty from the Bounties page",
      "See live cursors of other users working",
      "Edit together in real-time with auto-sync",
      "Chat with collaborators in the workspace",
      "Rewards are distributed automatically when complete"
    ],
    action: {
      label: "Try Collaboration →",
      path: "/bounties"
    }
  },
  {
    title: "Advanced Market Analytics",
    subtitle: "Institutional-Grade Intelligence & AI Insights",
    description: "Access the Discover page for comprehensive market analytics with 9 categories, 67+ live endpoints, AI trading signals, and a 3-tier API fallback system (CoinGecko → CoinMarketCap → Dune Analytics) ensuring uninterrupted data flow.",
    icon: TrendingUp,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    instructions: [
      "Click below to open the Analytics Dashboard",
      "Explore 9 analytics categories: volatility, patterns, derivatives & more",
      "View AI-powered Smart Insights with confidence scores",
      "Check real-time charts, trading signals, and sentiment analysis",
      "Analyze cross-market correlations and risk metrics",
      "Experience seamless data from our 3-tier API fallback system",
      "Get personalized recommendations based on your activity"
    ],
    action: {
      label: "Explore Analytics →",
      path: "/discover"
    }
  },
  {
    title: "AI Chat Assistant",
    subtitle: "Your Personal AI Guide",
    description: "Visit the Chat page to talk with our GPT-4o powered assistant. Get platform help, investment insights, market analysis, and personalized content recommendations.",
    icon: Bot,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    instructions: [
      "Click below to open the AI Chat interface",
      "Type your question or request in the chat box",
      "Ask about platform features: 'How do bounties work?'",
      "Get investment insights: 'Analyze Bitcoin trends'",
      "Request market analysis: 'What's happening in DeFi?'",
      "Receive personalized recommendations based on your activity"
    ],
    action: {
      label: "Chat with AI →",
      path: "/chat"
    }
  },
  {
    title: "Connect Your Wallet",
    subtitle: "Access Web3 Features",
    description: "Link your Web3 wallet from the navbar to unlock decentralized features. Own your knowledge assets on-chain, earn tokens, and participate in Base network activities.",
    icon: Wallet,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    instructions: [
      "Look for the 'Connect Wallet' button in the top navbar",
      "Click to connect MetaMask or other Web3 wallets",
      "Approve the connection request in your wallet",
      "Switch to Base network (Chain ID 8453) if prompted",
      "Once connected, access staking and DeFi features",
      "View your STREAM token balance in the navbar"
    ],
    action: {
      label: "Connect Now →",
      path: "/"
    }
  },
  {
    title: "NFT Summaries & DeFi",
    subtitle: "Own Your Knowledge On-Chain",
    description: "From the Create page, mint your summaries as NFTs! Trade knowledge assets, participate in DeFi, and benefit from smart contract automation.",
    icon: Crown,
    gradient: "from-purple-500 via-fuchsia-500 to-cyan-500",
    instructions: [
      "Create a summary on the Create page first",
      "After processing, click 'Mint as NFT' button",
      "Approve the transaction in your wallet",
      "Your summary becomes a tradeable NFT",
      "List it on decentralized marketplaces",
      "Earn royalties from future sales automatically"
    ],
    action: {
      label: "Mint Your First NFT →",
      path: "/create"
    }
  },
  {
    title: "Social Integration",
    subtitle: "Connect & Share Across Web3",
    description: "Navigate to Settings to link Twitter, Lens Protocol, and Farcaster accounts. Share your summaries, build your Web3 reputation, and engage with decentralized social networks.",
    icon: Radio,
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    instructions: [
      "Go to your Profile page from the navbar",
      "Click on 'Social Connections' tab",
      "Connect your Twitter account (OAuth)",
      "Link Lens Protocol profile for Web3 social",
      "Connect Farcaster for decentralized posting",
      "Share summaries across all platforms with one click"
    ],
    action: {
      label: "Connect Social →",
      path: "/profile"
    }
  },
  {
    title: "Referral & Rewards",
    subtitle: "Earn More by Inviting Friends",
    description: "Check your Profile page to find your unique referral code. Invite friends, track signups, earn bonus STREAM tokens, and climb the referral leaderboard.",
    icon: Trophy,
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    instructions: [
      "Navigate to your Profile page (navbar)",
      "Find your unique referral code in the 'Referrals' section",
      "Copy and share your code with friends",
      "Track signups in real-time on your dashboard",
      "Earn 50 STREAM tokens per successful referral",
      "Compete on the global referral leaderboard"
    ],
    action: {
      label: "Get Referral Code →",
      path: "/profile"
    }
  },
  {
    title: "Platform Analytics",
    subtitle: "Monitor Ecosystem Growth",
    description: "Visit the Analytics Dashboard to see platform-wide metrics. Track engagement trends, category distribution, reward analytics, and user growth in real-time.",
    icon: BarChart3,
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    instructions: [
      "Click below to open the Platform Analytics",
      "View total platform engagement metrics",
      "Analyze activity trends over time",
      "See category distribution charts",
      "Track total rewards distributed",
      "Monitor user growth and retention stats"
    ],
    action: {
      label: "View Platform Stats →",
      path: "/analytics"
    }
  },
  {
    title: "You're All Set!",
    subtitle: "Start Building Your Web3 Empire",
    description: "You've completed the StreamAiX tour! You now know how to create AI summaries, earn through bounties, access advanced analytics, chat with AI, connect your wallet, and much more.",
    icon: Rocket,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    instructions: [
      "Install StreamAiX as a PWA on any device",
      "Start creating summaries to build your portfolio",
      "Complete bounties to earn tokens daily",
      "Use analytics for smarter trading decisions",
      "Invite friends to grow together",
      "Join our community on Discord and Twitter"
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

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 1000);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
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
    
    setIsMinimized(true);
    setLocation(path);
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsMinimized(false);
      }
    }, 1500);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  // Circular progress calculation
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
                className={`group relative p-4 neural-glass rounded-3xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 glow-pulse overflow-hidden`}
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
                        stroke="url(#progress-gradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.25 }}
                className="relative w-full max-w-4xl max-h-[90vh] transform-3d"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Main Card */}
                <div className="relative neural-glass rounded-3xl shadow-2xl overflow-hidden iridescent-border">
                  {/* Animated gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.gradient} opacity-10 pointer-events-none animate-gradient`} />
                  
                  {/* Control Buttons */}
                  <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <button
                      onClick={toggleMinimize}
                      className="text-gray-400 hover:text-white transition-all p-3 hover:bg-white/10 rounded-xl backdrop-blur-sm neural-glow"
                      data-testid="button-minimize-tour"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSkip}
                      className="text-gray-400 hover:text-white transition-all p-3 hover:bg-white/10 rounded-xl backdrop-blur-sm neural-glow"
                      data-testid="button-skip-onboarding"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="overflow-y-auto max-h-[80vh] scrollbar-thin">
                    <div className="p-10">
                      {/* Header Section */}
                      <div className="flex items-start gap-8 mb-8">
                        {/* Circular Progress & Icon */}
                        <div className="relative flex-shrink-0">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <defs>
                              <linearGradient id={`grad-${currentStep}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
                              stroke={`url(#grad-${currentStep})`}
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
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
                            className={`absolute inset-0 flex items-center justify-center`}
                          >
                            <div className={`p-5 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-2xl float-3d`}>
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
                            <p className={`text-xl font-semibold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text mb-4`}>
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
                            
                            <div className="grid gap-4">
                              {currentStepData.instructions.map((instruction, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + index * 0.08 }}
                                  className="flex items-start gap-4 group hover:bg-white/5 p-3 rounded-xl transition-all"
                                >
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg neural-pulse`}>
                                    {index + 1}
                                  </div>
                                  <p className="text-gray-200 text-base leading-relaxed group-hover:text-white transition-colors flex-1">
                                    {instruction}
                                  </p>
                                  <CheckCircle2 className="h-5 w-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="mt-6"
                        >
                          <Button
                            onClick={() => handleAction(currentStepData.action.path)}
                            size="lg"
                            className={`w-full bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-bold text-lg py-7 rounded-xl group relative overflow-hidden shadow-2xl glow-pulse`}
                            data-testid="button-action"
                          >
                            <div className="absolute inset-0 iridescent-shimmer" />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              <Globe className="h-6 w-6" />
                              <span className="font-orbitron">{currentStepData.action.label}</span>
                              <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                            </span>
                          </Button>
                        </motion.div>
                      </motion.div>

                      {/* Footer Navigation */}
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        {/* Step Indicators */}
                        <div className="flex gap-2 flex-wrap">
                          {steps.map((step, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentStep(index)}
                              className={`relative transition-all duration-300 rounded-full overflow-hidden ${
                                index === currentStep
                                  ? 'w-10 h-3'
                                  : 'w-3 h-3'
                              }`}
                              data-testid={`button-step-${index}`}
                              aria-label={`Go to step ${index + 1}: ${step.title}`}
                            >
                              <div className={`absolute inset-0 rounded-full transition-all ${
                                index === currentStep
                                  ? `bg-gradient-to-r ${steps[index].gradient} shadow-lg`
                                  : index < currentStep
                                  ? 'bg-cyan-400/60'
                                  : 'bg-white/20'
                              }`} />
                            </button>
                          ))}
                        </div>

                        {/* Nav Buttons */}
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            variant="outline"
                            size="lg"
                            className="font-orbitron disabled:opacity-30"
                            data-testid="button-previous"
                          >
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            Previous
                          </Button>
                          <Button
                            onClick={handleNext}
                            size="lg"
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90 font-orbitron"
                            data-testid="button-next"
                          >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                            <ChevronRight className="h-5 w-5 ml-2" />
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
