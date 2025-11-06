import { Button } from "@/components/ui/button";
import { Wallet, Mail, Target, TrendingUp, BarChart3, LayoutDashboard, Sparkles, Box, MessageSquare, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useWeb3 } from "@/hooks/useWeb3";
import { useQuery } from "@tanstack/react-query";

const ADMIN_USERNAMES = ['arslan'];

export function Footer() {
  const { isConnected, connectWallet } = useWeb3();
  
  // Check if current user is admin
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });
  
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username);
  
  return (
    <footer className="py-20 bg-transparent text-slate-900 dark:text-white relative overflow-hidden border-t border-slate-200/50 dark:border-slate-800/50">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-lg"
          animate={{ y: [-15, 25, -15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-28 h-28 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full blur-xl"
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
              className="p-6 rounded-2xl neural-glass iridescent-border"
            >
              <div className="font-orbitron font-bold text-2xl bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                StreamAiX
              </div>
              <p className="text-gray-300 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                Your Web3 Hub for AI Content, Prediction Markets, DeFi Bounties & Market Intelligence.
              </p>
              
              {/* Enhanced Wallet Connect */}
              {!isConnected && (
                <Button 
                  onClick={() => connectWallet('metamask')}
                  className="w-full glass-bg glass-border hover:bg-muted/20 text-white group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Wallet className="w-5 h-5 mr-2 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  <span className="relative">Connect Wallet</span>
                </Button>
              )}
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
            <h3 className="text-lg font-bold mb-5 bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-400" />
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/bounties" 
                  className="group flex items-center text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:to-fuchsia-400 hover:bg-clip-text transition-all duration-200"
                >
                  <Target className="w-3.5 h-3.5 mr-2 group-hover:text-purple-400 transition-colors" />
                  <span className="relative">
                    Bounties
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/markets" 
                  className="group flex items-center text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:to-fuchsia-400 hover:bg-clip-text transition-all duration-200"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-2 group-hover:text-purple-400 transition-colors" />
                  <span className="relative">
                    Prediction Markets
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/discover" 
                  className="group flex items-center text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:to-fuchsia-400 hover:bg-clip-text transition-all duration-200"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-2 group-hover:text-purple-400 transition-colors" />
                  <span className="relative">
                    Analytics
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="group flex items-center text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:to-fuchsia-400 hover:bg-clip-text transition-all duration-200"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2 group-hover:text-purple-400 transition-colors" />
                  <span className="relative">
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300" />
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
            <h3 className="text-lg font-bold mb-5 bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/auth" 
                  className="group text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-fuchsia-400 hover:to-cyan-400 hover:bg-clip-text transition-all duration-200 inline-block"
                >
                  <span className="relative">
                    Sign Up
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth" 
                  className="group text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-fuchsia-400 hover:to-cyan-400 hover:bg-clip-text transition-all duration-200 inline-block"
                >
                  <span className="relative">
                    Sign In
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Support" 
                  className="group text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-fuchsia-400 hover:to-cyan-400 hover:bg-clip-text transition-all duration-200 inline-block"
                >
                  <span className="relative">
                    Support
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Waitlist" 
                  className="group text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-fuchsia-400 hover:to-cyan-400 hover:bg-clip-text transition-all duration-200 inline-block"
                >
                  <span className="relative">
                    Join Waitlist
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
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
            <h3 className="text-lg font-bold mb-5 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com" 
                  className="group flex items-center text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-cyan-400 hover:to-purple-400 hover:bg-clip-text transition-all duration-200"
                >
                  <Mail className="w-4 h-4 mr-2 group-hover:text-cyan-400 transition-colors" />
                  <span className="relative">
                    Email Us
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=Partnership%20Inquiry" 
                  className="group text-gray-300 dark:text-gray-400 hover:text-transparent hover:bg-gradient-to-r hover:from-cyan-400 hover:to-purple-400 hover:bg-clip-text transition-all duration-200 inline-block"
                >
                  <span className="relative">
                    Partnerships
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* Enhanced Bottom Section */}
        <motion.div 
          className="border-t border-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm flex items-center gap-3 flex-wrap justify-center">
              <span>
                © 2025 StreamAiX. Built with{" "}
                <span className="text-red-400 animate-pulse">❤️</span>{" "}
                for the decentralized future.
              </span>
              
              {/* Admin Link - Only visible to admin users */}
              {isAdmin && (
                <>
                  <span className="text-gray-600">·</span>
                  <Link 
                    href="/newsletter-admin" 
                    className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all duration-200 hover:scale-105"
                    data-testid="link-admin-panel"
                  >
                    <Settings className="w-3 h-3" />
                    Admin
                  </Link>
                </>
              )}
            </div>
            
            <div className="text-gray-400 text-sm">
              <span className="inline-flex items-center gap-2 flex-wrap justify-center">
                <span className="text-gray-500">Powered by</span>
                <span className="px-2 py-1 rounded-md bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 text-purple-300 font-semibold text-xs">
                  OpenAI
                </span>
                <span className="text-gray-600">·</span>
                <span className="px-2 py-1 rounded-md bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-cyan-300 font-semibold text-xs">
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
