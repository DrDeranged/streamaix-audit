import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navigation() {
  const { theme, setTheme } = useTheme();
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
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="font-orbitron font-bold text-2xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              StreamAiX
            </div>
            
            {/* Demo summarize input - hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-2 ml-8">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Paste a video URL to summarize..." 
                  className="w-80 glass-bg glass-border focus:ring-2 focus:ring-indigo-500"
                />
                <Sparkles className="absolute right-3 top-2.5 w-4 h-4 text-indigo-400" />
              </div>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Summarize
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
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
