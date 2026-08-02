import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Target, BarChart3, Sparkles, Users, Bot, Radio, LineChart, GraduationCap, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { WaitlistModal } from "@/components/WaitlistModal";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

interface HeroSectionProps {
  onNavigateToSection?: (sectionId: string) => void;
}

export function HeroSection({ onNavigateToSection }: HeroSectionProps) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const navigateToSection = (sectionId: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionId);
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-16 bg-ink-page">
      {/* Floating orbs - techy accent */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-core/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-bright/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-accent-deep/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-6 md:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Main headline */}
          <SectionTitle as="h1" className="mb-6 text-4xl font-bold tracking-tight leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-accent-bright">
              Stream the Noise.
            </span>
            <br />
            <span className="text-primary">
              Capture the Signal.
            </span>
          </SectionTitle>
          
          {/* Subtitle - clean and minimal */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-secondary mb-12 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Autonomous intelligence. On-chain rewards.
          </motion.p>

          {/* Sleek horizontal button row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10"
          >
            <Link href="/streams/discover">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-loss/50 hover:bg-ink-raised text-body hover:text-loss transition-all duration-300 rounded-xl backdrop-blur-sm group relative"
                  data-testid="button-live-streams"
                >
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-loss animate-pulse" />
                  <Radio className="w-4 h-4 mr-2 text-loss group-hover:text-loss" />
                  Live Streams
                </Button>
              </motion.div>
            </Link>

            <Link href="/discover">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-discover"
                >
                  <BarChart3 className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Discover
                </Button>
              </motion.div>
            </Link>

            <Link href="/markets">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-markets"
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Markets
                </Button>
              </motion.div>
            </Link>

            <Link href="/bounties">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-bounties"
                >
                  <Target className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Bounties
                </Button>
              </motion.div>
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => navigateToSection('ai-processor')}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-gain/50 hover:bg-ink-raised text-body hover:text-gain transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-ai-analysis"
              >
                <Brain className="w-4 h-4 mr-2 text-gain group-hover:text-gain" />
                AI Analysis
              </Button>
            </motion.div>

            <Link href="/ai-trading">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-warn/50 hover:bg-ink-raised text-body hover:text-warn transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-ai-trading"
                >
                  <LineChart className="w-4 h-4 mr-2 text-warn group-hover:text-warn" />
                  AI Trading
                </Button>
              </motion.div>
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => navigateToSection('social')}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-social-feed"
              >
                <Users className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                Social Feed
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => navigateToSection('avatars')}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-warn/50 hover:bg-ink-raised text-body hover:text-warn transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-knowledge-avatars"
              >
                <Bot className="w-4 h-4 mr-2 text-warn group-hover:text-warn" />
                Knowledge Avatars
              </Button>
            </motion.div>

            <Link href="/learn">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-learn"
                >
                  <GraduationCap className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Learn
                </Button>
              </motion.div>
            </Link>

            <Link href="/bot-trading">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-bot-trading"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Bot Trading
                </Button>
              </motion.div>
            </Link>

            <Link href="/portfolio">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-ink-surface border border-ink-edge hover:border-accent-core/50 hover:bg-ink-raised text-body hover:text-accent-bright transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-portfolio"
                >
                  <Wallet className="w-4 h-4 mr-2 text-accent-bright group-hover:text-primary" />
                  Portfolio
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          
          {/* Glassmorphism Join Waitlist CTA - Ultra Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
              className="relative group cursor-pointer"
              onClick={() => setWaitlistOpen(true)}
              data-testid="button-join-waitlist"
            >
              {/* Subtle outer glow */}
              <div className="absolute -inset-0.5 bg-accent-core/30 rounded-xl blur-sm opacity-30 group-hover:opacity-60 transition-all duration-500" />
              
              {/* Thin gradient border */}
              <div className="absolute -inset-[1px] bg-accent-core rounded-xl opacity-60 group-hover:opacity-85 transition-opacity duration-300" />
              
              {/* Glass container - ultra compact */}
              <Surface variant="raised" className="relative px-5 py-2.5 rounded-xl overflow-hidden">
                {/* Top highlight */}
                <div className="absolute top-0 left-2 right-2 h-[1px] bg-accent-bright/30" />
                
                {/* Shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 overflow-hidden">
                  <div className="absolute inset-0 bg-accent-core/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-600" />
                </div>
                
                {/* Button content - compact */}
                <div className="relative flex items-center justify-center gap-1.5">
                  <motion.div
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warn" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium text-primary">
                    Join the Waitlist
                  </span>
                </div>
              </Surface>
            </motion.div>
          </motion.div>

          {/* Minimal status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex items-center justify-center gap-2 text-muted text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />
            <span>100+ AI agents active on Base</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </section>
  );
}
