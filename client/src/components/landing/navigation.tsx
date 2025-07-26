import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Sparkles, Menu, X, User, LogOut, BarChart3 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            
            {/* Demo summarize input - hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-2 ml-4 xl:ml-8">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Paste a video URL to summarize..." 
                  className="w-64 xl:w-80 glass-bg glass-border focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <Sparkles className="absolute right-3 top-2.5 w-4 h-4 text-indigo-400" />
              </div>
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Summarize
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <button 
                onClick={() => scrollToSection("demo")}
                className="text-muted-foreground hover:text-indigo-500 transition-colors"
              >
                Demo
              </button>
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
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-bg glass-border" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.username}</p>
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/create-summary" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Summary
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet-dashboard" className="cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
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
            
            <Button className="hidden md:block bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              Connect Wallet
            </Button>

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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 py-4 border-t glass-border"
            >
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection("demo")}
                  className="text-left text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  Demo
                </button>
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
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  Connect Wallet
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
