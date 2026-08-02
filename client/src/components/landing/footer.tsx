import { Button } from "@/components/ui/button";
import { Wallet, Mail, Target, TrendingUp, BarChart3, LayoutDashboard, Sparkles, Box, MessageSquare, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useWeb3 } from "@/hooks/useWeb3";
import { useAuth } from "@/hooks/useAuth";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

const ADMIN_USERNAMES = ['arslan'];

export function Footer() {
  const { isConnected, connectWallet } = useWeb3();
  
  // Check if current user is admin
  const { user } = useAuth();
  
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username);
  
  return (
    <footer className="relative overflow-hidden border-t border-ink-divider bg-ink-page py-20 text-body">
      {/* Enhanced Background Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <motion.div 
          className="absolute left-10 top-10 h-32 w-32 rounded-xl bg-accent-core blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 h-24 w-24 rounded-xl bg-accent-bright blur-lg"
          animate={{ y: [-15, 25, -15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute left-1/2 top-1/2 h-28 w-28 rounded-xl bg-accent-deep blur-xl"
          animate={{ y: [-10, 30, -10], x: [-20, 20, -20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand Section - Enhanced Glass Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Surface className="p-6">
              <div className="mb-4 font-display text-2xl font-bold text-primary">
                StreamAiX
              </div>
              <p className="mb-6 text-sm leading-relaxed text-body">
                Your Web3 Hub for AI Content, Prediction Markets, DeFi Bounties & Market Intelligence.
              </p>
              
              {/* Enhanced Wallet Connect */}
              {!isConnected && (
                <Button 
                  onClick={() => connectWallet('metamask')}
                  className="group relative w-full overflow-hidden rounded-xl grad-accent text-primary glow-accent transition-all duration-300 hover:bg-accent-deep"
                >
                  <Wallet className="mr-2 h-5 w-5 text-primary transition-colors group-hover:text-primary" />
                  <span className="relative">Connect Wallet</span>
                </Button>
              )}
              </Surface>
              </motion.div>
          </div>
          
          {/* Platform Links - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="mb-5 flex items-center gap-2"><Box className="h-5 w-5 text-accent-bright" /><SectionTitle as="h3">Platform</SectionTitle></div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/bounties" 
                  className="group flex items-center text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <Target className="mr-2 h-3.5 w-3.5 text-muted transition-colors group-hover:text-accent-bright" />
                  <span className="relative">
                    Bounties
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/markets" 
                  className="group flex items-center text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <TrendingUp className="mr-2 h-3.5 w-3.5 text-muted transition-colors group-hover:text-accent-bright" />
                  <span className="relative">
                    Prediction Markets
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/discover" 
                  className="group flex items-center text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <BarChart3 className="mr-2 h-3.5 w-3.5 text-muted transition-colors group-hover:text-accent-bright" />
                  <span className="relative">
                    Analytics
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="group flex items-center text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <LayoutDashboard className="mr-2 h-3.5 w-3.5 text-muted transition-colors group-hover:text-accent-bright" />
                  <span className="relative">
                    Dashboard
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
            </ul>
          </motion.div>
          
          {/* Resources - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="mb-5 flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent-bright" /><SectionTitle as="h3">Resources</SectionTitle></div>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/auth" 
                  className="group inline-block text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <span className="relative">
                    Sign Up
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth" 
                  className="group inline-block text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <span className="relative">
                    Sign In
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Support" 
                  className="group inline-block text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <span className="relative">
                    Support
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Waitlist" 
                  className="group inline-block text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <span className="relative">
                    Join Waitlist
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </a>
              </li>
            </ul>
          </motion.div>
          
          {/* Contact - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="mb-5 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-accent-bright" /><SectionTitle as="h3">Contact</SectionTitle></div>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com" 
                  className="group flex items-center text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <Mail className="mr-2 h-4 w-4 text-muted transition-colors group-hover:text-accent-bright" />
                  <span className="relative">
                    Email Us
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=Partnership%20Inquiry" 
                  className="group inline-block text-secondary transition-colors duration-200 hover:text-accent-bright"
                >
                  <span className="relative">
                    Partnerships
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-core transition-all duration-300 group-hover:w-full" />
                  </span>
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* Enhanced Bottom Section */}
        <motion.div 
          className="border-t border-ink-divider pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-secondary">
              <span>
                © 2025 StreamAiX. Built with{" "}
                  <span className="animate-pulse text-loss">❤️</span>{" "}
                for the decentralized future.
              </span>
              
              {/* Admin Link - Only visible to admin users */}
              {isAdmin && (
                <>
                  <span className="text-muted">·</span>
                  <Link 
                    href="/newsletter-admin" 
                    className="group inline-flex items-center gap-1.5 rounded-xl border border-warn/30 bg-warn/10 px-2 py-1 text-xs font-semibold text-warn transition-all duration-200 hover:border-warn hover:bg-warn/20"
                    data-testid="link-admin-panel"
                  >
                    <Settings className="w-3 h-3" />
                    Admin
                  </Link>
                </>
              )}
            </div>
            
            <div className="text-sm text-secondary">
              <span className="inline-flex items-center gap-2 flex-wrap justify-center">
                <span className="text-muted">Powered by</span>
                <span className="rounded-xl border border-accent-core/30 bg-accent-core/10 px-2 py-1 text-xs font-semibold text-accent-bright">
                  Base Network
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
