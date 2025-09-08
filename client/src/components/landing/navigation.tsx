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
} from '@/components/ui/dropdown-menu';
import { WalletSelectionModal } from '@/components/wallet/WalletSelectionModal';
import { Moon, Sun, Sparkles, Menu, X, User, LogOut, BarChart3, Wallet, Loader2, ExternalLink, Settings } from "lucide-react";
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
    <nav className="fixed top-0 w-full z-50 glass-bg border-b glass-border transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="font-orbitron font-bold text-xl sm:text-2xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              StreamAiX
            </div>
            
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <button 
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-indigo-500 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("bounties")}
                className="text-muted-foreground hover:text-indigo-500 transition-colors"
              >
                Bounties
              </button>
              
              {/* Authentication */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all duration-200">
                      <Avatar className="h-10 w-10 ring-2 ring-indigo-500/20 hover:ring-indigo-500/40 transition-all duration-200">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 glass-bg glass-border border-white/20 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-slate-900/90" align="end" forceMount>
                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                      <Avatar className="h-10 w-10 ring-2 ring-indigo-500/30">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-semibold text-white">{user?.username}</p>
                        {user?.email && (
                          <p className="w-[180px] truncate text-xs text-gray-300">
                            {user.email}
                          </p>
                        )}
                        <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          • Online
                        </span>
                      </div>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200 rounded-md mx-2">
                          <BarChart3 className="mr-3 h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                          <div className="flex flex-col">
                            <span className="font-medium">Dashboard</span>
                            <span className="text-xs text-gray-400 group-hover:text-indigo-200">View analytics & summaries</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-green-500/20 hover:text-green-300 transition-all duration-200 rounded-md mx-2">
                          <Wallet className="mr-3 h-4 w-4 text-green-400 group-hover:text-green-300" />
                          <div className="flex flex-col">
                            <span className="font-medium">Wallet</span>
                            <span className="text-xs text-gray-400 group-hover:text-green-200">Manage tokens & earnings</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200 rounded-md mx-2">
                        <User className="mr-3 h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">Profile</span>
                          <span className="text-xs text-gray-400 group-hover:text-purple-200">Edit settings & preferences</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t border-white/10 pt-2 pb-1">
                      <DropdownMenuItem 
                        className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 rounded-md mx-2"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">Sign out</span>
                          <span className="text-xs text-gray-400 group-hover:text-red-200">End current session</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth">
                    <Button variant="ghost" className="text-muted-foreground hover:text-indigo-500">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="glass-bg glass-border hover:bg-muted"
            >
              {theme === "light" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400" />
              )}
            </Button>
            
            {/* Web3 Wallet Connection */}
            <div className="hidden md:block">
              {isConnected && wallet ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="glass-bg glass-border hover:bg-muted">
                      <Wallet className="w-4 h-4 mr-2" />
                      <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 glass-bg glass-border border-white/20 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-slate-900/90" align="end">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Connected Wallet</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-xs text-gray-300 font-mono mt-1">{formatAddress(wallet.address)}</p>
                          {wallet.ensName && (
                            <p className="text-xs text-indigo-400 mt-1 font-medium">{wallet.ensName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200 rounded-md mx-2">
                          <BarChart3 className="mr-3 h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                          <div className="flex flex-col">
                            <span className="font-medium">Wallet Dashboard</span>
                            <span className="text-xs text-gray-400 group-hover:text-indigo-200">View portfolio & transactions</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200 rounded-md mx-2">
                        <ExternalLink className="mr-3 h-4 w-4 text-blue-400 group-hover:text-blue-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">View on Explorer</span>
                          <span className="text-xs text-gray-400 group-hover:text-blue-200">Open in blockchain explorer</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t border-white/10 pt-2 pb-1">
                      <DropdownMenuItem 
                        className="cursor-pointer group flex items-center px-4 py-3 text-sm text-white hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 rounded-md mx-2"
                        onClick={disconnect}
                      >
                        <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">Disconnect</span>
                          <span className="text-xs text-gray-400 group-hover:text-red-200">Remove wallet connection</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setWalletModalOpen(true)}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden glass-bg glass-border"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden mt-4 py-4 border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent rounded-b-xl backdrop-blur-sm"
            >
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection("features")}
                  className="text-left text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection("bounties")}
                  className="text-left text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  Bounties
                </button>
                
                {/* Mobile Authentication */}
                {!isAuthenticated && (
                  <motion.div 
                    className="space-y-3 pt-4 border-t border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link href="/auth" className="block">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200 rounded-lg p-3">
                        <User className="w-4 h-4 mr-3 text-indigo-400" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Sign In</span>
                          <span className="text-xs text-gray-400">Access your dashboard</span>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/auth" className="block">
                      <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 rounded-lg p-3 shadow-lg">
                        <Sparkles className="w-4 h-4 mr-3" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Get Started</span>
                          <span className="text-xs opacity-80">Start processing content</span>
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                )}
                
                {/* Mobile User Menu */}
                {isAuthenticated && (
                  <motion.div 
                    className="space-y-3 pt-4 border-t border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-indigo-500/30">
                          <AvatarImage src={user?.avatar} alt={user?.username} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-semibold text-white text-sm">{user?.username}</p>
                          {user?.email && (
                            <p className="text-xs text-gray-300 truncate">{user.email}</p>
                          )}
                          <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full mt-1 w-fit">
                            • Online
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href="/dashboard" className="block">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200 rounded-lg p-3">
                        <BarChart3 className="w-4 h-4 mr-3 text-indigo-400" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Dashboard</span>
                          <span className="text-xs text-gray-400">View analytics & summaries</span>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/wallet-dashboard" className="block">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-500/20 hover:text-green-300 transition-all duration-200 rounded-lg p-3">
                        <Wallet className="w-4 h-4 mr-3 text-green-400" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Wallet</span>
                          <span className="text-xs text-gray-400">Manage tokens & earnings</span>
                        </div>
                      </Button>
                    </Link>
                    <div className="border-t border-white/10 pt-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 rounded-lg p-3"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="w-4 h-4 mr-3 text-red-400" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Sign Out</span>
                          <span className="text-xs text-gray-400">End current session</span>
                        </div>
                      </Button>
                    </div>
                  </motion.div>
                )}
                {/* Mobile Wallet Connection */}
                {isConnected && wallet ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Wallet Connected</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{formatAddress(wallet.address)}</p>
                    </div>
                    <Button 
                      onClick={disconnect}
                      variant="outline" 
                      className="w-full border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setWalletModalOpen(true)}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
