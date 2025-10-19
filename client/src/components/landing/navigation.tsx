import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useWeb3 } from "@/hooks/useWeb3";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { WalletSelectionModal } from '@/components/wallet/WalletSelectionModal';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Menu, 
  X, 
  User, 
  LogOut, 
  BarChart3, 
  Wallet, 
  Loader2, 
  ExternalLink, 
  Settings,
  Target,
  Compass,
  LayoutDashboard,
  CreditCard,
  UserCircle,
  Zap,
  Activity,
  TrendingUp,
  Brain,
  Trophy,
  ChevronDown,
  LineChart,
  PieChart
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  
  // Web3 integration
  const { 
    wallet, 
    isConnected, 
    isConnecting, 
    disconnect, 
    formatAddress
  } = useWeb3();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/30 transition-all duration-300 shadow-lg shadow-purple-500/10">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo with Animated Glow */}
          <Link href="/">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="font-orbitron font-bold text-xl sm:text-2xl bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300">
                StreamAiX
              </div>
            </motion.div>
          </Link>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Desktop Navigation with Icons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {/* Bounties Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 to-fuchsia-500/0 group-hover:from-fuchsia-500/20 group-hover:to-fuchsia-500/10 transition-all duration-300 rounded-lg" />
                    <div className="relative flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors" />
                      <span className="font-medium">Bounties</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-slate-900/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/bounties" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-fuchsia-500/20 transition-all duration-200 rounded-md mx-1">
                      <Target className="w-4 h-4 text-fuchsia-400" />
                      <span className="font-medium">Browse Bounties</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/leaderboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-yellow-500/20 transition-all duration-200 rounded-md mx-1">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">Leaderboard</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Markets Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:to-purple-500/10 transition-all duration-300 rounded-lg" />
                    <div className="relative flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      <span className="font-medium">Markets</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-slate-900/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/markets" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-purple-500/20 transition-all duration-200 rounded-md mx-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">Prediction Markets</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Analytics Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    className="group relative px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-all duration-300 overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/20 group-hover:to-cyan-500/10 transition-all duration-300 rounded-lg" />
                    <div className="relative flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      <span className="font-medium">Analytics</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/discover" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-cyan-500/20 transition-all duration-200 rounded-md mx-1">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">Discover</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/insights-dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-blue-500/20 transition-all duration-200 rounded-md mx-1">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">AI Insights</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analytics-dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-green-500/20 transition-all duration-200 rounded-md mx-1">
                      <PieChart className="w-4 h-4 text-green-400" />
                      <span className="font-medium">Platform Stats</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Authentication */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all duration-200">
                      <Avatar className="h-10 w-10 ring-2 ring-purple-500/30 hover:ring-purple-500/60 transition-all duration-200">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-semibold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <motion.div 
                        className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-slate-950 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20" align="end" forceMount>
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 p-3 border-b border-purple-500/20">
                      <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-sm">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-white text-sm font-semibold">{user?.username}</p>
                        <p className="text-slate-400 text-xs">Premium Member</p>
                      </div>
                    </div>

                    {/* Menu Items with Icons */}
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-purple-500/20 transition-all duration-200 rounded-md mx-1">
                          <LayoutDashboard className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/discover" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-cyan-500/20 transition-all duration-200 rounded-md mx-1">
                          <Compass className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium">Discover</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-fuchsia-500/20 transition-all duration-200 rounded-md mx-1">
                          <Wallet className="w-4 h-4 text-fuchsia-400" />
                          <span className="font-medium">Wallet</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-blue-500/20 transition-all duration-200 rounded-md mx-1">
                        <UserCircle className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">Profile</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-purple-500/20" />

                    {/* Logout */}
                    <div className="py-1">
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 rounded-md mx-1"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="relative bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30">
                        <span className="relative z-10">Get Started</span>
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Theme Toggle with Enhanced Styling */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-slate-900/50 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300"
              >
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-400" />
                )}
              </Button>
            </motion.div>
            
            {/* Web3 Wallet Connection - Enhanced */}
            <div className="hidden md:block">
              {isConnected && wallet ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button variant="outline" className="relative bg-slate-900/50 border-purple-500/40 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all duration-300 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-purple-500/20 group-hover:via-fuchsia-500/10 group-hover:to-cyan-500/20 transition-all duration-500" />
                        <div className="relative flex items-center gap-2">
                          <div className="relative">
                            <Wallet className="w-4 h-4 text-purple-400" />
                            <motion.div 
                              className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                          <span className="font-mono text-sm text-slate-200">{formatAddress(wallet.address)}</span>
                        </div>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20" align="end">
                    {/* Wallet Header */}
                    <div className="p-4 border-b border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connected Wallet</span>
                        <motion.div 
                          className="flex items-center gap-1.5"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-green-400 font-medium">Active</span>
                        </motion.div>
                      </div>
                      <div className="text-sm text-white font-mono bg-slate-800/50 px-3 py-2 rounded-lg border border-purple-500/20">
                        {formatAddress(wallet.address)}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-purple-500/20 transition-all duration-200 rounded-md mx-1">
                          <LayoutDashboard className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-cyan-500/20 transition-all duration-200 rounded-md mx-1">
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium">View on Explorer</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-purple-500/20" />

                    {/* Disconnect */}
                    <div className="py-1">
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 rounded-md mx-1"
                        onClick={disconnect}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Disconnect</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Button 
                    onClick={() => setWalletModalOpen(true)}
                    disabled={isConnecting}
                    className="relative bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="relative z-10">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        <span className="relative z-10">Connect Wallet</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden bg-slate-900/50 border-purple-500/30 hover:bg-purple-500/20"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden mt-4 py-4 border-t border-purple-500/30 bg-slate-900/90 backdrop-blur-xl rounded-lg mx-2 shadow-xl shadow-purple-500/10"
            >
              <div className="flex flex-col space-y-1 px-4">
                {/* Bounties Section */}
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Bounties</div>
                <Link href="/bounties" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-fuchsia-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <Target className="w-4 h-4 text-fuchsia-400" />
                    Browse Bounties
                  </button>
                </Link>
                <Link href="/leaderboard" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-yellow-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Leaderboard
                  </button>
                </Link>

                {/* Markets Section */}
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-2">Markets</div>
                <Link href="/markets" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-purple-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Prediction Markets
                  </button>
                </Link>

                {/* Analytics Section */}
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mt-2">Analytics</div>
                <Link href="/discover" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-cyan-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Discover
                  </button>
                </Link>
                <Link href="/insights-dashboard" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-blue-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <Brain className="w-4 h-4 text-blue-400" />
                    AI Insights
                  </button>
                </Link>
                <Link href="/analytics-dashboard" className="block">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-green-500/20 transition-all duration-200 font-medium text-sm"
                  >
                    <PieChart className="w-4 h-4 text-green-400" />
                    Platform Stats
                  </button>
                </Link>
                
                {/* Mobile Authentication */}
                {!isAuthenticated && (
                  <div className="pt-3 border-t border-purple-500/20 mt-3">
                    <Link href="/auth" className="block">
                      <button className="w-full text-center bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 hover:from-purple-500/30 hover:to-fuchsia-500/30 text-white border border-purple-500/30 py-2.5 px-4 rounded-md transition-all duration-200 font-medium text-sm">
                        Sign In
                      </button>
                    </Link>
                  </div>
                )}
                
                {/* Mobile User Menu */}
                {isAuthenticated && (
                  <div className="space-y-1 pt-3 border-t border-purple-500/20 mt-3">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-purple-500/10 rounded-md border border-purple-500/20">
                      <Avatar className="h-7 w-7 ring-2 ring-purple-500/30">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs font-medium">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">{user?.username}</span>
                    </div>
                    <Link href="/dashboard" className="block">
                      <button className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-purple-500/20 transition-all duration-200 font-medium text-sm">
                        <LayoutDashboard className="w-4 h-4 text-purple-400" />
                        Dashboard
                      </button>
                    </Link>
                    <Link href="/wallet-dashboard" className="block">
                      <button className="w-full flex items-center gap-3 text-left text-slate-300 hover:text-white py-2.5 px-3 rounded-md hover:bg-fuchsia-500/20 transition-all duration-200 font-medium text-sm">
                        <Wallet className="w-4 h-4 text-fuchsia-400" />
                        Wallet
                      </button>
                    </Link>
                    <button 
                      className="w-full flex items-center gap-3 text-left text-red-400 hover:text-red-300 py-2.5 px-3 rounded-md hover:bg-red-500/20 transition-all duration-200 font-medium text-sm"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}

                {/* Mobile Wallet Connection */}
                {isConnected && wallet ? (
                  <div className="space-y-3 pt-3 border-t border-purple-500/20 mt-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Wallet Connected</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded border border-purple-500/20">{formatAddress(wallet.address)}</p>
                    </div>
                    <Button 
                      onClick={disconnect}
                      variant="outline" 
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-purple-500/20 mt-3">
                    <Button 
                      onClick={() => setWalletModalOpen(true)}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Wallet Selection Modal */}
      <WalletSelectionModal 
        open={walletModalOpen} 
        onOpenChange={setWalletModalOpen}
        onWalletConnected={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
