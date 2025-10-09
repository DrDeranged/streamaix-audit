import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Coins, TrendingUp, Bot, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  image?: string;
  action?: {
    label: string;
    path: string;
  };
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to StreamAiX!",
    description: "Transform long-form content into ownable, monetizable knowledge assets powered by AI and Web3. Let's show you around.",
    icon: Sparkles,
  },
  {
    title: "Create AI Summaries",
    description: "Convert podcasts, videos, and livestreams into comprehensive blog-style summaries with chapters, insights, and key takeaways.",
    icon: Zap,
    action: {
      label: "Create Summary",
      path: "/create"
    }
  },
  {
    title: "Earn with Bounties",
    description: "Complete bounties to earn STREAM tokens! Collaborate in real-time, level up your reputation, and unlock exclusive rewards.",
    icon: Coins,
    action: {
      label: "View Bounties",
      path: "/bounties"
    }
  },
  {
    title: "Advanced Analytics",
    description: "Access institutional-grade market intelligence with volatility forecasting, pattern recognition, and real-time cross-market signals.",
    icon: TrendingUp,
    action: {
      label: "Explore Analytics",
      path: "/discover"
    }
  },
  {
    title: "AI Assistant",
    description: "Chat with our GPT-4 powered assistant for platform help, investment insights, and personalized recommendations.",
    icon: Bot,
    action: {
      label: "Try AI Chat",
      path: "/chat"
    }
  },
  {
    title: "Connect Your Wallet",
    description: "Link your Web3 wallet to access decentralized features, earn tokens, and own your knowledge assets on-chain.",
    icon: Wallet,
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
      // Show onboarding after a short delay
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30 border-2 border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  data-testid="button-skip-onboarding"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-cyan-400 font-medium">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                    <h2 className="text-2xl font-bold text-white mt-1">
                      {currentStepData.title}
                    </h2>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <Progress value={progress} className="h-2 bg-white/10" />
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {currentStepData.description}
                  </p>

                  {/* Feature Preview */}
                  <div className="bg-black/40 rounded-lg p-6 border border-cyan-500/20 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-6 w-6 text-cyan-400" />
                      <h3 className="text-white font-semibold">Key Features</h3>
                    </div>
                    <ul className="space-y-2">
                      {currentStep === 0 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>AI-powered content transformation</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Earn tokens through bounties</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Advanced market analytics</span>
                          </li>
                        </>
                      )}
                      {currentStep === 1 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>AI transcription with Whisper</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Chapter generation & insights</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Decentralized storage on IPFS</span>
                          </li>
                        </>
                      )}
                      {currentStep === 2 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Real-time collaboration tools</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Reputation & leveling system</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Multi-token rewards (STREAM, ETH, USDC)</span>
                          </li>
                        </>
                      )}
                      {currentStep === 3 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>9 analytics categories with 67+ endpoints</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Real-time market data & signals</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Pattern recognition & forecasting</span>
                          </li>
                        </>
                      )}
                      {currentStep === 4 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>GPT-4 powered conversations</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Investment insights & analysis</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Platform help & guidance</span>
                          </li>
                        </>
                      )}
                      {currentStep === 5 && (
                        <>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Web3 wallet integration</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Own knowledge assets on-chain</span>
                          </li>
                          <li className="flex items-start gap-2 text-gray-300">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Earn & stake STREAM tokens</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-black/20 border-t border-white/10 flex items-center justify-between">
                <div className="flex gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-8 bg-cyan-500'
                          : index < currentStep
                          ? 'w-2 bg-cyan-500/50'
                          : 'w-2 bg-white/20'
                      }`}
                      data-testid={`button-step-${index}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="ghost"
                      className="text-gray-300 hover:text-white"
                      data-testid="button-previous"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  )}

                  {currentStepData.action ? (
                    <Button
                      onClick={() => handleAction(currentStepData.action!.path)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      data-testid="button-action"
                    >
                      {currentStepData.action.label}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      data-testid="button-next"
                    >
                      {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Optional: Manual trigger button for users who want to replay the tour
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
      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
      data-testid="button-restart-tour"
    >
      <Sparkles className="h-4 w-4" />
      Replay Tutorial
    </button>
  );
}
