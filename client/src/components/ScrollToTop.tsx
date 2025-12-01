import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 
                     bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500
                     hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600
                     hover:shadow-xl hover:shadow-purple-500/25
                     active:scale-95
                     md:bottom-8 md:right-8 md:p-4"
          aria-label="Scroll to top"
          data-testid="button-scroll-to-top"
        >
          <ArrowUp className="w-5 h-5 text-white md:w-6 md:h-6" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/50 via-fuchsia-500/50 to-cyan-500/50 blur-lg opacity-0 hover:opacity-60 transition-opacity duration-300 -z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
