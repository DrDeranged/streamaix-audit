import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Check, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, FileText, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  gradient: string;
  features: string[];
  action?: {
    label: string;
    path: string;
  };
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to StreamAiX",
    description: "The ultimate decentralized AI platform that transforms long-form content into ownable, monetizable knowledge assets. Powered by cutting-edge AI and Web3 technology on Base network.",
    icon: Sparkles,
    gradient: "from-purple-500 via-pink-500 to-red-500",
    features: [
      "AI-powered content transformation",
      "Decentralized knowledge ownership",
      "Multi-token rewards & staking",
      "Real-time collaboration tools"
    ]
  },
  {
    title: "AI Content Creation",
    description: "Convert podcasts, videos, and livestreams into comprehensive blog-style summaries with AI-generated chapters, insights, and key takeaways using GPT-4o and Whisper.",
    icon: Zap,
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    features: [
      "OpenAI Whisper transcription",
      "GPT-4o chapter generation",
      "Automatic insights extraction",
      "Decentralized IPFS/Arweave storage"
    ],
    action: {
      label: "Create Summary",
      path: "/create"
    }
  },
  {
    title: "Gamified Bounty System",
    description: "Earn STREAM, ETH, and USDC by completing bounties! Level up your reputation, unlock badges, maintain streaks, and compete on the leaderboard with AI-powered quality scoring.",
    icon: Coins,
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    features: [
      "Multi-token rewards (STREAM/ETH/USDC)",
      "Reputation & leveling system",
      "Achievement badges & streaks",
      "AI quality scoring engine"
    ],
    action: {
      label: "View Bounties",
      path: "/bounties"
    }
  },
  {
    title: "Real-Time Collaboration",
    description: "Work together on bounties with WebSocket-powered live editing, real-time cursors, instant reward distribution, and collaborative workspaces.",
    icon: Users,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Live multi-user editing",
      "Real-time cursor tracking",
      "Instant reward distribution",
      "Collaborative workspaces"
    ]
  },
  {
    title: "Advanced Analytics Suite",
    description: "Access institutional-grade market intelligence with 9 analytics categories, 67+ live endpoints, volatility forecasting, pattern recognition, and cross-market signals.",
    icon: TrendingUp,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    features: [
      "9 analytics categories, 67+ endpoints",
      "Volatility forecasting & risk assessment",
      "Pattern recognition algorithms",
      "Real-time market regime detection"
    ],
    action: {
      label: "Explore Analytics",
      path: "/discover"
    }
  },
  {
    title: "Smart Insights Dashboard",
    description: "AI-powered market intelligence with trading signals, sentiment analysis, confidence scoring, and personalized investment recommendations.",
    icon: LineChart,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    features: [
      "AI trading signals & alerts",
      "Multi-source sentiment analysis",
      "Confidence scoring system",
      "Personalized recommendations"
    ]
  },
  {
    title: "3-Tier API Fallback",
    description: "Reliable crypto data with automatic failover: CoinGecko → CoinMarketCap → Dune Analytics. Never miss market movements with our redundant data architecture.",
    icon: Shield,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    features: [
      "Primary: CoinGecko API",
      "Secondary: CoinMarketCap",
      "Tertiary: Dune Analytics",
      "TTL-based caching for rate limits"
    ]
  },
  {
    title: "GPT-4o AI Assistant",
    description: "Chat with our advanced AI assistant for platform help, investment insights, market analysis, and personalized content recommendations.",
    icon: Bot,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    features: [
      "GPT-4o powered conversations",
      "Investment insights & analysis",
      "Platform guidance & tutorials",
      "Personalized recommendations"
    ],
    action: {
      label: "Try AI Chat",
      path: "/chat"
    }
  },
  {
    title: "Web3 Wallet Integration",
    description: "Connect your wallet to access decentralized features, own knowledge assets on-chain, and participate in Base network activities with STREAM token staking.",
    icon: Wallet,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    features: [
      "Multi-wallet support (MetaMask, etc.)",
      "Base network (Chain ID 8453)",
      "On-chain asset ownership",
      "STREAM token staking & rewards"
    ]
  },
  {
    title: "NFT Summaries & DeFi",
    description: "Mint your summaries as NFTs, trade knowledge assets, and participate in decentralized finance with smart contract integration and decentralized storage.",
    icon: Crown,
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    features: [
      "Summary NFT minting",
      "Smart contract automation",
      "Decentralized asset trading",
      "DeFi yield opportunities"
    ]
  },
  {
    title: "Social Integration",
    description: "Connect with Twitter, Lens Protocol, and Farcaster. Share summaries, build your Web3 reputation, and engage with the decentralized social ecosystem.",
    icon: Radio,
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    features: [
      "Twitter OAuth integration",
      "Lens Protocol support",
      "Farcaster connectivity",
      "Cross-platform sharing"
    ]
  },
  {
    title: "Referral & Rewards",
    description: "Invite friends with your unique referral code, track signups, earn bonus STREAM tokens, and climb the referral leaderboard.",
    icon: Trophy,
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    features: [
      "Unique referral code generation",
      "Signup tracking & analytics",
      "Token reward multipliers",
      "Referral leaderboard rankings"
    ]
  },
  {
    title: "Analytics Dashboard",
    description: "Monitor platform-wide engagement metrics, activity trends, category distribution, reward analytics, and user growth statistics in real-time.",
    icon: BarChart3,
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    features: [
      "Platform engagement metrics",
      "Activity trend analysis",
      "Category distribution charts",
      "Reward distribution tracking"
    ]
  },
  {
    title: "Progressive Web App",
    description: "Install StreamAiX on any device! Enjoy offline capability, push notifications, mobile-optimized experience, and instant loading with our PWA technology.",
    icon: Rocket,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    features: [
      "Install on any device",
      "Offline functionality",
      "Push notifications",
      "Mobile-first design"
    ],
    action: {
      label: "Get Started",
      path: "/"
    }
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('streamaix_onboarding_completed');
    if (!hasSeenOnboarding) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('streamaix_onboarding_completed', 'true');
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
    handleClose();
    setLocation(path);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-5xl mx-4"
          >
            <div className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50 pointer-events-none" />
              
              {/* Header */}
              <div className="relative p-8 pb-6">
                <button
                  onClick={handleSkip}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  data-testid="button-skip-onboarding"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="flex items-start gap-6">
                  {/* Animated Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                    className={`p-4 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-lg`}
                  >
                    <Icon className="h-10 w-10 text-white" />
                  </motion.div>

                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text`}>
                          Step {currentStep + 1} of {steps.length}
                        </span>
                        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${currentStepData.gradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-3">
                        {currentStepData.title}
                      </h2>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {currentStepData.description}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative px-8 pb-8">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {currentStepData.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/30 transition-all duration-300"
                      >
                        {/* Gradient accent on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                        
                        <div className="relative flex items-start gap-3">
                          <div className="mt-0.5">
                            <Check className={`h-5 w-5 bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text`} style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }} />
                            <div className={`h-5 w-5 bg-gradient-to-r ${currentStepData.gradient} rounded-full opacity-60 absolute top-0 left-0`}>
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <span className="text-gray-200 font-medium group-hover:text-white transition-colors">
                            {feature}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Button or Info */}
                  {currentStepData.action && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className={`bg-gradient-to-r ${currentStepData.gradient} p-[2px] rounded-xl`}
                    >
                      <div className="bg-gray-950 rounded-[10px] p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-cyan-400" />
                            <span className="text-white font-medium">Ready to explore?</span>
                          </div>
                          <Button
                            onClick={() => handleAction(currentStepData.action!.path)}
                            className={`bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-semibold`}
                            data-testid="button-action"
                          >
                            {currentStepData.action.label}
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Footer */}
              <div className="relative px-8 py-6 bg-black/40 backdrop-blur-sm border-t border-white/10">
                <div className="flex items-center justify-between">
                  {/* Progress Dots */}
                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`relative transition-all duration-300 ${
                          index === currentStep
                            ? 'w-12 h-3'
                            : 'w-3 h-3'
                        }`}
                        data-testid={`button-step-${index}`}
                      >
                        <div className={`absolute inset-0 rounded-full transition-all ${
                          index === currentStep
                            ? `bg-gradient-to-r ${steps[index].gradient}`
                            : index < currentStep
                            ? 'bg-white/40'
                            : 'bg-white/20'
                        }`} />
                      </button>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                      <Button
                        onClick={handlePrevious}
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-white/10"
                        data-testid="button-previous"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    )}

                    <Button
                      onClick={handleNext}
                      className={`bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-semibold px-6`}
                      data-testid="button-next"
                    >
                      {currentStep === steps.length - 1 ? (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Start Building
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Manual trigger button for users who want to replay the tour
export function OnboardingTrigger() {
  const [, setLocation] = useLocation();

  const restartTour = () => {
    localStorage.removeItem('streamaix_onboarding_completed');
    setLocation('/');
    window.location.reload();
  };

  return (
    <button
      onClick={restartTour}
      className="group text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-500/10"
      data-testid="button-restart-tour"
    >
      <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
      Replay Tutorial
    </button>
  );
}
