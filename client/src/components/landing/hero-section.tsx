import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Mail, Brain, Link2, Shield, Users, Target, TrendingUp, BarChart3, FileText, MessageCircle, Sparkles, Hexagon, Zap, Trophy, Bot, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { WaitlistModal } from "@/components/WaitlistModal";

const featureCards = [
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Transform videos into insights",
    href: "#ai-processor",
    color: "from-purple-500 to-fuchsia-500",
    bgGlow: "purple",
    isScroll: true
  },
  {
    icon: TrendingUp,
    title: "Prediction Markets",
    description: "Trade on future outcomes",
    href: "/markets",
    color: "from-cyan-500 to-blue-500",
    bgGlow: "cyan",
    isScroll: false
  },
  {
    icon: Target,
    title: "Bounty Board",
    description: "Earn rewards for content",
    href: "/bounties",
    color: "from-fuchsia-500 to-pink-500",
    bgGlow: "fuchsia",
    isScroll: false
  },
  {
    icon: BarChart3,
    title: "Discover",
    description: "Market intelligence hub",
    href: "/discover",
    color: "from-emerald-500 to-teal-500",
    bgGlow: "emerald",
    isScroll: false
  },
  {
    icon: Bot,
    title: "Knowledge Avatars",
    description: "AI-powered personas",
    href: "#knowledge-avatars",
    color: "from-amber-500 to-orange-500",
    bgGlow: "amber",
    isScroll: true
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect & collaborate",
    href: "/dashboard",
    color: "from-indigo-500 to-violet-500",
    bgGlow: "indigo",
    isScroll: false
  }
];

export function HeroSection() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  
  const handleFeatureClick = (feature: typeof featureCards[0]) => {
    if (feature.isScroll) {
      const sectionId = feature.href.replace('#', '');
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-16 bg-transparent">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40 dark:opacity-50">
        <div className="absolute bottom-20 left-0 right-0 flex items-end justify-center space-x-2 opacity-50">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 bg-gradient-to-t from-purple-500 via-fuchsia-500 to-cyan-400 rounded-full shadow-lg shadow-purple-500/50 ${
                i % 3 === 0 ? 'h-20' : i % 2 === 0 ? 'h-16' : 'h-12'
              }`}
              animate={{ scaleY: [1, 1.8, 1] }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.1 
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="container mx-auto px-6 md:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-orbitron font-light mb-6 tracking-tight leading-none">
            <span className="gradient-text-primary animate-gradient font-bold">
              Stream the Noise.
            </span>
            <br />
            <span className="gradient-text-secondary font-bold">
              Capture the Signal.
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            <span className="gradient-text-primary font-bold">Your Web3 Hub for AI Content, Prediction Markets, DeFi Bounties & Market Intelligence</span>
            <br/>
            <span className="text-fuchsia-400 font-semibold block mt-1">Decentralized. Monetizable. Ownable.</span>
          </p>

          {/* Feature Grid - Equal Spotlight on All Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto mb-10 px-2"
          >
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              const CardWrapper = feature.isScroll ? 'button' : Link;
              const cardProps = feature.isScroll 
                ? { onClick: () => handleFeatureClick(feature), type: "button" as const }
                : { href: feature.href };
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  {feature.isScroll ? (
                    <button
                      onClick={() => handleFeatureClick(feature)}
                      type="button"
                      className="w-full block p-4 rounded-xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-sm border border-white/10 dark:border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                      data-testid={`feature-card-${feature.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">{feature.description}</p>
                      </div>
                    </button>
                  ) : (
                    <Link
                      href={feature.href}
                      className="block p-4 rounded-xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-sm border border-white/10 dark:border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                      data-testid={`feature-card-${feature.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">{feature.description}</p>
                      </div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          
          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 px-4">
            <Button 
              size="lg"
              onClick={() => document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-gradient focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              data-testid="button-try-ai"
            >
              <Play className="w-5 h-5 mr-2" />
              Try AI Analysis
            </Button>
            
            <Link href="/markets">
              <Button 
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold glass-bg glass-border hover:bg-cyan-500/20 dark:hover:bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                data-testid="button-explore-markets"
              >
                <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                Explore Markets
              </Button>
            </Link>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setWaitlistOpen(true)}
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold glass-bg glass-border hover:bg-white/20 dark:hover:bg-white/10 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              data-testid="button-join-waitlist"
            >
              <Mail className="w-5 h-5 mr-2" />
              Join Waitlist
            </Button>
          </div>

          {/* Live Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-8 px-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-slate-900/50 border border-purple-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-600 dark:text-slate-400">100+ AI Agents Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-slate-900/50 border border-cyan-500/20">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-gray-600 dark:text-slate-400">1.5M+ STREAM Distributed</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-slate-900/50 border border-fuchsia-500/20">
              <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Powered by Base</span>
            </div>
          </motion.div>
          
          {/* Tech stack indicators */}
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 md:space-x-8 opacity-60 flex-wrap gap-2 sm:gap-4 px-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-xs sm:text-sm">OpenAI</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
              <span className="text-xs sm:text-sm">IPFS</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-xs sm:text-sm">Arweave</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-xs sm:text-sm">Base</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </section>
  );
}
