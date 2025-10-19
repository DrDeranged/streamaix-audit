import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Search, Github, Twitter, MessageCircle, Users, Mail } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="py-20 bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden border-t border-slate-200 dark:border-slate-800">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
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
                The future of content consumption. Transform any video into valuable, ownable knowledge with AI and Web3.
              </p>
              
              {/* ENS Lookup */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">ENS Name Lookup</label>
                <div className="flex space-x-2">
                  <Input 
                    type="text" 
                    placeholder="vitalik.eth" 
                    className="flex-1 bg-gray-800 border-gray-700 focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                  />
                  <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Wallet Connect */}
              <Button className="glass-bg glass-border hover:bg-muted/20 text-white">
                <Wallet className="w-5 h-5 mr-3 text-purple-400" />
                Connect Wallet
              </Button>
            </motion.div>
          </div>
          
          {/* Links Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Whitepaper</a></li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Farcaster</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Lens Protocol</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Twitter</a></li>
            </ul>
          </motion.div>
          
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
                  arslandin.founder@streamaix.com
                </a>
              </li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Support Center</a></li>
              <li>
                <a 
                  href="mailto:arslandin.founder@streamaix.com?subject=Partnership Inquiry&body=Hi! I'm interested in exploring partnership opportunities with StreamAiX." 
                  className="hover:text-purple-400 transition-colors"
                >
                  Partnership
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
            
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Users className="w-5 h-5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
