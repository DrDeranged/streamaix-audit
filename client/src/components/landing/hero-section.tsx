import { Button } from "@/components/ui/button";
import { Play, Mail, Brain, Link2, Shield, Users, Target, TrendingUp, BarChart3, FileText, LayoutDashboard, Sparkles, Hexagon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export function HeroSection() {
  const scrollToProcessor = () => {
    document.getElementById('ai-processor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-16 bg-transparent">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40 dark:opacity-50">
        {/* Animated waveform */}
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
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            <span className="gradient-text-primary font-bold">Your Web3 Hub for AI Content, Prediction Markets, DeFi Bounties & Market Intelligence</span>
            <br/>
            <span className="text-fuchsia-400 font-semibold block mt-1">Decentralized. Monetizable. Ownable.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 px-4">
            <Button 
              size="lg"
              onClick={scrollToProcessor}
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-gradient focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              data-testid="button-try-ai"
            >
              <Play className="w-5 h-5 mr-2" />
              Try AI Analysis
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = 'mailto:arslandin.founder@streamaix.com?subject=StreamAiX Waitlist&body=Hi! I would like to join the StreamAiX waitlist.'}
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold glass-bg glass-border hover:bg-white/20 dark:hover:bg-white/10 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              data-testid="button-join-waitlist"
            >
              <Mail className="w-5 h-5 mr-2" />
              Join Waitlist
            </Button>
          </div>

          {/* Elegant Navigation Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
              <Link href="/bounties" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-bounties">
                <Target className="w-3.5 h-3.5" />
                <span>Bounties</span>
              </Link>
              
              <span className="text-gray-600">•</span>
              
              <Link href="/markets" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-markets">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Markets</span>
              </Link>
              
              <span className="text-gray-600">•</span>
              
              <Link href="/discover" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-fuchsia-500/20 hover:text-fuchsia-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-analytics">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </Link>
              
              <span className="text-gray-600">•</span>
              
              <Link href="/summaries" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-summaries">
                <FileText className="w-3.5 h-3.5" />
                <span>Summaries</span>
              </Link>
              
              <span className="text-gray-600">•</span>
              
              <Link href="/dashboard" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-dashboard">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              
              <span className="text-gray-600">•</span>
              
              <Link href="/discover" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-300 cursor-pointer" data-testid="link-nav-discover">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discover</span>
              </Link>
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
    </section>
  );
}
