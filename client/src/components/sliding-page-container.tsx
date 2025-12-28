import { useState, useRef, useEffect, useCallback, ReactNode, createContext, useContext, forwardRef, useImperativeHandle } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Section {
  id: string;
  label: string;
  component: ReactNode;
}

interface SlidingContextType {
  currentSection: number;
  goToSection: (index: number) => void;
  goToSectionById: (id: string) => void;
  sections: Section[];
}

const SlidingContext = createContext<SlidingContextType | null>(null);

export function useSlidingNavigation() {
  const context = useContext(SlidingContext);
  if (!context) {
    throw new Error("useSlidingNavigation must be used within SlidingPageContainer");
  }
  return context;
}

export interface SlidingPageContainerHandle {
  goToSection: (index: number) => void;
  goToSectionById: (id: string) => void;
  currentSection: number;
}

interface SlidingPageContainerProps {
  sections: Section[];
  showNavDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export const SlidingPageContainer = forwardRef<SlidingPageContainerHandle, SlidingPageContainerProps>(
  function SlidingPageContainerInner({ sections, showNavDots = true, showArrows = true, className = "" }, ref) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToSection = useCallback((index: number, forceDirection?: number) => {
    if (!isAnimating) {
      const normalizedIndex = ((index % sections.length) + sections.length) % sections.length;
      const dir = forceDirection !== undefined ? forceDirection : (index > currentSection ? 1 : -1);
      setDirection(dir);
      setIsAnimating(true);
      setCurrentSection(normalizedIndex);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [currentSection, sections.length, isAnimating]);

  const goToSectionById = useCallback((id: string) => {
    const index = sections.findIndex(s => s.id === id);
    if (index !== -1) {
      goToSection(index);
    }
  }, [sections, goToSection]);

  useImperativeHandle(ref, () => ({
    goToSection,
    goToSectionById,
    currentSection,
  }), [goToSection, goToSectionById, currentSection]);

  const goNext = useCallback(() => {
    const nextIndex = currentSection + 1;
    if (nextIndex >= sections.length) {
      goToSection(0, 1);
    } else {
      goToSection(nextIndex, 1);
    }
  }, [currentSection, sections.length, goToSection]);

  const goPrev = useCallback(() => {
    const prevIndex = currentSection - 1;
    if (prevIndex < 0) {
      goToSection(sections.length - 1, -1);
    } else {
      goToSection(prevIndex, -1);
    }
  }, [currentSection, sections.length, goToSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <SlidingContext.Provider value={{ currentSection, goToSection, goToSectionById, sections }}>
      <div
        ref={containerRef}
        className={`relative h-screen overflow-hidden ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSection}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 overflow-y-auto"
          >
            {sections[currentSection]?.component}
          </motion.div>
        </AnimatePresence>

        {showArrows && (
          <>
            <button
              onClick={goPrev}
              disabled={isAnimating}
              className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full 
                bg-black/40 backdrop-blur-md border border-white/20 
                text-white transition-all duration-300 hidden md:flex items-center justify-center
                ${isAnimating ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20 hover:scale-110"}`}
              aria-label="Previous section"
              data-testid="button-prev-section"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goNext}
              disabled={isAnimating}
              className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full 
                bg-black/40 backdrop-blur-md border border-white/20 
                text-white transition-all duration-300 hidden md:flex items-center justify-center
                ${isAnimating ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20 hover:scale-110"}`}
              aria-label="Next section"
              data-testid="button-next-section"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {showNavDots && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => goToSection(index)}
                className={`group relative flex items-center justify-end`}
                aria-label={`Go to ${section.label}`}
                data-testid={`nav-dot-${section.id}`}
              >
                <span 
                  className={`absolute right-6 px-2 py-1 rounded text-xs whitespace-nowrap
                    bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity
                    pointer-events-none`}
                >
                  {section.label}
                </span>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${index === currentSection 
                      ? "bg-purple-500 scale-125 shadow-lg shadow-purple-500/50" 
                      : "bg-white/30 hover:bg-white/60"}`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex md:hidden gap-1.5">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => goToSection(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300
                ${index === currentSection 
                  ? "bg-purple-500 w-6" 
                  : "bg-white/30"}`}
              aria-label={`Go to ${section.label}`}
              data-testid={`nav-dot-mobile-${section.id}`}
            />
          ))}
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden md:block">
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/70 text-sm">
            {currentSection + 1} / {sections.length}
          </div>
        </div>
      </div>
    </SlidingContext.Provider>
  );
});

export function SectionWrapper({ 
  children, 
  className = "",
  fullHeight = true,
}: { 
  children: ReactNode; 
  className?: string;
  fullHeight?: boolean;
}) {
  return (
    <div className={`${fullHeight ? "min-h-screen" : ""} ${className}`}>
      {children}
    </div>
  );
}
