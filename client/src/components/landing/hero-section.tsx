import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Brain, TrendingUp, Target, BarChart3, Sparkles, Users, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { WaitlistModal } from "@/components/WaitlistModal";

export function HeroSection() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-16 bg-transparent">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating orbs - techy accent */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-6 md:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-orbitron font-bold mb-6 tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Stream the Noise.
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Capture the Signal.
            </span>
          </h1>
          
          {/* Subtitle - clean and minimal */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
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
            <Link href="/discover">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-300 hover:text-cyan-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-discover"
                >
                  <BarChart3 className="w-4 h-4 mr-2 text-cyan-400 group-hover:text-cyan-300" />
                  Discover
                </Button>
              </motion.div>
            </Link>

            <Link href="/markets">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-purple-500/50 hover:bg-purple-500/5 text-slate-300 hover:text-purple-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-markets"
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-400 group-hover:text-purple-300" />
                  Markets
                </Button>
              </motion.div>
            </Link>

            <Link href="/bounties">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline"
                  className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 text-slate-300 hover:text-fuchsia-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                  data-testid="button-bounties"
                >
                  <Target className="w-4 h-4 mr-2 text-fuchsia-400 group-hover:text-fuchsia-300" />
                  Bounties
                </Button>
              </motion.div>
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-ai-analysis"
              >
                <Brain className="w-4 h-4 mr-2 text-emerald-400 group-hover:text-emerald-300" />
                AI Analysis
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('social-feed')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-300 hover:text-indigo-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-social-feed"
              >
                <Users className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-300" />
                Social Feed
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('knowledge-avatars')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 sm:px-6 py-5 sm:py-6 text-sm font-medium bg-transparent border border-slate-700/50 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-300 hover:text-amber-400 transition-all duration-300 rounded-xl backdrop-blur-sm group"
                data-testid="button-knowledge-avatars"
              >
                <Bot className="w-4 h-4 mr-2 text-amber-400 group-hover:text-amber-300" />
                Knowledge Avatars
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Themed Join Waitlist CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              
              <Button 
                size="lg"
                onClick={() => setWaitlistOpen(true)}
                className="relative px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-cyan-500 text-white shadow-2xl shadow-purple-500/25 transition-all duration-500 rounded-xl border-0"
                data-testid="button-join-waitlist"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Join the Waitlist
              </Button>
            </motion.div>
          </motion.div>

          {/* Minimal status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex items-center justify-center gap-2 text-slate-500 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100+ AI agents active on Base</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </section>
  );
}
