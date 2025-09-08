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
                  <DropdownMenuContent className="w-48 glass-bg glass-border bg-white/10 dark:bg-slate-900/90" align="end" forceMount>
                    <div className="flex items-center gap-2 p-3 border-b border-white/10">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-indigo-500 text-white text-sm">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white text-sm">{user?.username}</p>
                    </div>
                    <div className="py-1">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                          Wallet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                        Profile
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t border-white/10 pt-1 pb-1">
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Sign out
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
                  <DropdownMenuContent className="w-56 glass-bg glass-border bg-white/10 dark:bg-slate-900/90" align="end">
                    <div className="p-3 border-b border-white/10">
                      <div className="text-sm text-white">
                        <span className="font-mono">{formatAddress(wallet.address)}</span>
                      </div>
                    </div>
                    <div className="py-1">
                      <DropdownMenuItem asChild>
                        <Link href="/wallet-dashboard" className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                        View on Explorer
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t border-white/10 pt-1 pb-1">
                      <DropdownMenuItem 
                        className="cursor-pointer flex items-center px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={disconnect}
                      >
                        Disconnect
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
              className="md:hidden mt-4 py-3 border-t border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => scrollToSection("features")}
                  className="text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection("bounties")}
                  className="text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors"
                >
                  Bounties
                </button>
                
                {/* Mobile Authentication */}
                {!isAuthenticated && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <Link href="/auth" className="block">
                      <button className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/auth" className="block">
                      <button className="w-full text-left bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded-md transition-colors">
                        Get Started
                      </button>
                    </Link>
                  </div>
                )}
                
                {/* Mobile User Menu */}
                {isAuthenticated && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-indigo-500 text-white text-xs">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user?.username}
                    </div>
                    <Link href="/dashboard" className="block">
                      <button className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors">
                        Dashboard
                      </button>
                    </Link>
                    <Link href="/wallet-dashboard" className="block">
                      <button className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors">
                        Wallet
                      </button>
                    </Link>
                    <button 
                      className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Sign Out
                    </button>
                  </div>
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
