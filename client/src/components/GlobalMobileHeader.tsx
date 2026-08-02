import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ChevronUp, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePointsBalance, formatPoints } from "@/hooks/usePoints";
import { useAuth } from "@/hooks/useAuth";

// Maps routes to their corresponding landing page section IDs
const routeToSectionMap: Record<string, string> = {
  '/portfolio': 'portfolio',
  '/markets': 'prediction-markets',
  '/prediction-market': 'prediction-markets',
  '/bounties': 'bounties',
  '/bounty': 'bounties',
  '/ai-trading': 'ai-trading',
  '/bot-trading': 'ai-trading',
  '/discover': 'discover',
  '/streams': 'live-streams',
  '/stream-view': 'live-streams',
  '/go-live': 'live-streams',
  '/debates': 'live-streams',
  '/debate-view': 'live-streams',
  '/avatars': 'avatars',
  '/knowledge-avatar-profile': 'avatars',
  '/avatar': 'avatars',
  '/learning-hub': 'learn',
  '/lesson-viewer': 'learn',
  '/leagues': 'prediction-markets',
  '/league-detail': 'prediction-markets',
  '/market-portfolio': 'prediction-markets',
  '/market-leaderboard': 'prediction-markets',
  '/market-achievements': 'prediction-markets',
  '/dashboard': 'hero',
  '/wallet-dashboard': 'hero',
  '/leaderboard': 'bounties',
  '/hunter': 'bounties',
  '/chat': 'ai-suggestions',
  '/social': 'social',
  '/following': 'social',
  '/summaries': 'ai-processor',
  '/summary-view': 'ai-processor',
  '/create-summary': 'ai-processor',
  '/processing-results': 'ai-processor',
};

function getSectionForRoute(path: string): string {
  // Exact match
  if (routeToSectionMap[path]) {
    return routeToSectionMap[path];
  }
  // Check if path starts with any mapped route
  for (const [route, section] of Object.entries(routeToSectionMap)) {
    if (path.startsWith(route)) {
      return section;
    }
  }
  // Default to hero
  return 'hero';
}

export function GlobalMobileHeader() {
  const [location] = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: pointsData } = usePointsBalance();

  // Don't show on landing page - it has its own navigation
  const isLandingPage = location === "/";
  
  // Determine which section to return to based on current route
  const targetSection = useMemo(() => getSectionForRoute(location), [location]);
  
  // Track scroll position to show/hide scroll-to-top indicator
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to top with visual feedback
  const scrollToTop = useCallback(() => {
    setIsScrolling(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    
    // Reset animation state after scroll completes
    setTimeout(() => setIsScrolling(false), 500);
  }, []);

  // Navigate home
  const goHome = useCallback(() => {
    window.location.href = "/";
  }, []);

  if (isLandingPage) {
    return null;
  }

  return (
    <>
      {/* Scroll-to-top tap zone - tapping anywhere in this area scrolls to top */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] h-2 cursor-pointer bg-ink-page/60"
        onClick={scrollToTop}
        role="button"
        aria-label="Scroll to top"
        data-testid="scroll-to-top-zone"
      />
      
      {/* Main navigation header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-[99] border-b border-ink-edge bg-ink-surface/95 shadow-lg shadow-ink-page/40 backdrop-blur-xl"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="relative flex items-center justify-between h-14 px-3">
          {/* Left: Back button - navigates to landing page section */}
          <Link href={`/#${targetSection}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2 text-secondary hover:bg-ink-raised hover:text-primary"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Button>
          </Link>

          {/* Center: StreamAiX Logo - absolutely positioned for true centering on mobile */}
          <button
            onClick={goHome}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl px-3 py-1.5 text-primary transition-all duration-200 hover:bg-ink-raised active:scale-95 active:bg-ink-raised"
            aria-label="Go to StreamAiX home"
            data-testid="button-logo-home"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-core shadow-lg shadow-accent-core/25">
              <span className="text-sm font-bold text-primary">S</span>
            </div>
            <span className="text-lg font-bold text-accent-bright">
              StreamAiX
            </span>
          </button>

          {/* Right: STREAM Points + Scroll to top */}
          <div className="flex items-center gap-2">
            {/* STREAM Points Display */}
            {isAuthenticated && pointsData && (
              <Link href="/points">
                <motion.div
                  className="flex items-center gap-1.5 rounded-xl border border-gain/30 bg-gain/10 px-2 py-1 transition-all duration-200 hover:bg-gain/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="mobile-points-display"
                >
                  <Coins className="h-4 w-4 text-gain" />
                  <span className="tabular text-sm font-bold text-gain">
                    {formatPoints(pointsData.balance || 0)}
                  </span>
                </motion.div>
              </Link>
            )}
            
            {/* Scroll to top button (visible when scrolled) */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollToTop}
                    className={`px-2 text-secondary hover:bg-ink-raised hover:text-primary ${isScrolling ? 'animate-pulse' : ''}`}
                    data-testid="button-scroll-top"
                  >
                    <ChevronUp className={`h-5 w-5 ${isScrolling ? 'text-accent-bright' : ''}`} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-14" />
    </>
  );
}
