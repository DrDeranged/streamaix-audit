import { Button } from "@/components/ui/button";
import { Wallet, Mail, Target, TrendingUp, BarChart3, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useWeb3 } from "@/hooks/useWeb3";

export function Footer() {
  const { isConnected, connectWallet } = useWeb3();
  
  return (
    <footer className="py-20 bg-transparent text-slate-900 dark:text-white relative overflow-hidden border-t border-slate-200/50 dark:border-slate-800/50">
      {/* Background Pattern */}
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
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="font-orbitron font-bold text-xl bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                StreamAiX
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Your Web3 Hub for AI Content, Prediction Markets, DeFi Bounties & Market Intelligence.
              </p>
              
              {/* Wallet Connect */}
              {!isConnected && (
                <Button 
                  onClick={() => connectWallet('metamask')}
                  className="glass-bg glass-border hover:bg-muted/20 text-white"
                >
                  <Wallet className="w-5 h-5 mr-3 text-purple-400" />
                  Connect Wallet
                </Button>
              )}
            </motion.div>
          </div>
          
          {/* Platform Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/bounties" className="hover:text-purple-400 transition-colors flex items-center">
                  <Target className="w-3.5 h-3.5 mr-2" />
                  Bounties
                </Link>
              </li>
              <li>
                <Link href="/markets" className="hover:text-purple-400 transition-colors flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-2" />
                  Prediction Markets
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-purple-400 transition-colors flex items-center">
                  <BarChart3 className="w-3.5 h-3.5 mr-2" />
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-purple-400 transition-colors flex items-center">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                  Dashboard
                </Link>
              </li>
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/auth" className="hover:text-purple-400 transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-purple-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Support" 
                  className="hover:text-purple-400 transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=StreamAiX%20Waitlist" 
                  className="hover:text-purple-400 transition-colors"
                >
                  Join Waitlist
                </a>
              </li>
            </ul>
          </motion.div>
          
          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com" 
                  className="hover:text-purple-400 transition-colors flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </a>
              </li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=Partnership%20Inquiry" 
                  className="hover:text-purple-400 transition-colors"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* Bottom Section */}
        <motion.div 
          className="border-t border-gray-800 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 StreamAiX. Built with ❤️ for the decentralized future.
            </div>
            
            <div className="text-gray-400 text-sm">
              <span className="inline-flex items-center gap-2">
                Powered by <span className="text-purple-400 font-semibold">OpenAI</span> · <span className="text-cyan-400 font-semibold">Base Network</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
