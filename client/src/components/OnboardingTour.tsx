import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Coins, TrendingUp, Bot, Wallet, 
  Zap, Users, Shield, Trophy, BarChart3, Radio, Rocket, Globe, Crown,
  LineChart, ArrowRight, MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

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
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
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
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
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
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Show onboarding on every app load
    setTimeout(() => setIsOpen(true), 1000);
  }, []);

  const handleClose = () => {
    // Just close the modal, don't save to localStorage
    setIsOpen(false);
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={handleSkip}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              {/* Animated gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.gradient} opacity-5 pointer-events-none`} />
              
              {/* Close Button */}
              <button
                onClick={handleSkip}
                className="absolute top-6 right-6 z-10 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                data-testid="button-skip-onboarding"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Content Container */}
              <div className="overflow-y-auto max-h-[75vh] custom-scrollbar">
                {/* Header */}
                <div className="relative p-8 pb-6">
                  <div className="flex items-start gap-6 mb-6">
                    {/* Animated Icon */}
                    <motion.div
                      key={currentStep}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.8, delay: 0.1 }}
                      className={`p-5 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-lg flex-shrink-0`}
                    >
                      <Icon className="h-12 w-12 text-white" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-sm font-bold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text`}>
                            Step {currentStep + 1} of {steps.length}
                          </span>
                          <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden max-w-xs">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${currentStepData.gradient}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2">
                          {currentStepData.title}
                        </h2>
                        <p className={`text-xl font-semibold bg-gradient-to-r ${currentStepData.gradient} text-transparent bg-clip-text`}>
                          {currentStepData.subtitle}
                        </p>
                      </motion.div>
                    </div>
                  </div>

                  {/* Description */}
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-300 text-lg leading-relaxed mb-6"
                  >
                    {currentStepData.description}
                  </motion.p>
                </div>

                {/* Instructions */}
                <div className="relative px-8 pb-8">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MousePointer2 className={`h-5 w-5 bg-gradient-to-r ${currentStepData.gradient} text-transparent`} style={{ WebkitTextFillColor: 'white' }} />
                        <h3 className="text-xl font-bold text-white">How to Get Started:</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {currentStepData.instructions.map((instruction, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-start gap-3 group"
                          >
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r ${currentStepData.gradient} flex items-center justify-center text-white font-bold text-sm mt-0.5`}>
                              {index + 1}
                            </div>
                            <p className="text-gray-200 text-base leading-relaxed group-hover:text-white transition-colors">
                              {instruction}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6"
                    >
                      <Button
                        onClick={() => handleAction(currentStepData.action.path)}
                        size="lg"
                        className={`w-full bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-bold text-lg py-6 group`}
                        data-testid="button-action"
                      >
                        <Globe className="h-5 w-5 mr-2" />
                        {currentStepData.action.label}
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="relative px-8 py-6 bg-black/40 backdrop-blur-sm border-t border-white/10">
                <div className="flex items-center justify-between">
                  {/* Progress Dots */}
                  <div className="flex gap-2 flex-wrap max-w-md">
                    {steps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`relative transition-all duration-300 ${
                          index === currentStep
                            ? 'w-12 h-3'
                            : 'w-3 h-3'
                        }`}
                        data-testid={`button-step-${index}`}
                        aria-label={`Go to step ${index + 1}: ${step.title}`}
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
                        size="lg"
                        className="text-gray-300 hover:text-white hover:bg-white/10"
                        data-testid="button-previous"
                      >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Previous
                      </Button>
                    )}

                    <Button
                      onClick={handleNext}
                      size="lg"
                      className={`bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white font-semibold px-8`}
                      data-testid="button-next"
                    >
                      {currentStep === steps.length - 1 ? (
                        <>
                          <Rocket className="h-5 w-5 mr-2" />
                          Start Building
                        </>
                      ) : (
                        <>
                          Next Step
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>

          {/* Custom scrollbar styles */}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

// Manual trigger button for users who want to replay the tour
// Note: Tour now shows on every app load, so this just reloads the page
export function OnboardingTrigger() {
  const [, setLocation] = useLocation();

  const restartTour = () => {
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
