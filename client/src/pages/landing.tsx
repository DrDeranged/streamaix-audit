import { lazy, Suspense, useMemo, useRef, useCallback, useEffect } from "react";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { NeuralNetworkBackground } from "@/components/NeuralNetworkBackground";
import { SlidingPageContainer, SectionWrapper, SlidingPageContainerHandle } from "@/components/sliding-page-container";
import { Loader2 } from "lucide-react";

const LiveStreamingTerminal = lazy(() => import("@/components/landing/live-streaming-terminal").then(m => ({ default: m.LiveStreamingTerminal })));
const AIProcessor = lazy(() => import("@/components/landing/rebuilt-ai-demo").then(m => ({ default: m.AIProcessor })));
const LiveCryptoVideos = lazy(() => import("@/components/landing/live-crypto-videos"));
const BountyFeed = lazy(() => import("@/components/landing/bounty-feed").then(m => ({ default: m.BountyFeed })));
const PredictionMarketSection = lazy(() => import("@/components/PredictionMarketSection").then(m => ({ default: m.PredictionMarketSection })));
const SocialFeed = lazy(() => import("@/components/landing/SocialFeed").then(m => ({ default: m.SocialFeed })));
const KnowledgeAvatars = lazy(() => import("@/components/landing/knowledge-avatars").then(m => ({ default: m.KnowledgeAvatars })));
const AISuggestions = lazy(() => import("@/components/landing/ai-suggestions").then(m => ({ default: m.AISuggestions })));
const RecentActivity = lazy(() => import("@/components/landing/RecentActivity").then(m => ({ default: m.RecentActivity })));
const Footer = lazy(() => import("@/components/landing/footer").then(m => ({ default: m.Footer })));
const DiscoverPage = lazy(() => import("@/pages/discover"));
const AITradingPage = lazy(() => import("@/pages/ai-trading"));
const LearningHubSection = lazy(() => import("@/components/landing/learning-hub-section"));
const PortfolioSection = lazy(() => import("@/components/landing/portfolio-section"));
const BotTradingPage = lazy(() => import("@/pages/bot-trading"));
const AvatarLeaderboardLanding = lazy(() => import("@/components/landing/avatar-leaderboard").then(m => ({ default: m.AvatarLeaderboardLanding })));

function SectionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-page">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-bright mx-auto mb-3" />
        <p className="text-muted text-sm">Loading section...</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const slidingRef = useRef<SlidingPageContainerHandle>(null);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    slidingRef.current?.goToSectionById(sectionId);
  }, []);

  // Listen for custom navigation events from the onboarding tour
  useEffect(() => {
    const handleCarouselNavigation = (event: CustomEvent<{ sectionId: string }>) => {
      if (event.detail?.sectionId) {
        slidingRef.current?.goToSectionById(event.detail.sectionId);
      }
    };
    
    window.addEventListener('navigateCarouselSection', handleCarouselNavigation as EventListener);
    return () => window.removeEventListener('navigateCarouselSection', handleCarouselNavigation as EventListener);
  }, []);

  const sections = useMemo(() => [
    {
      id: "discover",
      label: "Discover",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Suspense fallback={<SectionLoader />}>
              <DiscoverPage />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "bounties",
      label: "Bounties",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <BountyFeed />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "prediction-markets",
      label: "Prediction Markets",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <PredictionMarketSection />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "social",
      label: "Social Feed",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <SocialFeed />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "hero",
      label: "Welcome",
      component: (
        <SectionWrapper className="relative" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <HeroSection onNavigateToSection={handleNavigateToSection} />
            <Suspense fallback={<SectionLoader />}>
              <AvatarLeaderboardLanding />
              <RecentActivity />
              <Footer />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "live-streams",
      label: "Live Streams",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <LiveStreamingTerminal />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "ai-processor",
      label: "AI Processing",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <AIProcessor />
              <LiveCryptoVideos embedded />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "avatars",
      label: "Knowledge Avatars",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <KnowledgeAvatars />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "ai-suggestions",
      label: "AI Suggestions",
      component: (
        <SectionWrapper className="relative bg-ink-page">
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <AISuggestions />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "ai-trading",
      label: "AI Trading",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Suspense fallback={<SectionLoader />}>
              <AITradingPage />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "bot-trading",
      label: "Bot Trading",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Suspense fallback={<SectionLoader />}>
              <BotTradingPage />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "portfolio",
      label: "Portfolio",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <PortfolioSection />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
    {
      id: "learn",
      label: "Learning Hub",
      component: (
        <SectionWrapper className="relative bg-ink-page" fullHeight={false}>
          <NeuralNetworkBackground />
          <div className="relative z-10">
            <Navigation />
            <Suspense fallback={<SectionLoader />}>
              <LearningHubSection />
            </Suspense>
          </div>
        </SectionWrapper>
      ),
    },
  ], [handleNavigateToSection]);

  return (
    <div className="relative bg-ink-page text-body">
      <SlidingPageContainer ref={slidingRef} sections={sections} initialSection={4} />
    </div>
  );
}
