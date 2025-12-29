import { lazy, Suspense, useMemo, useRef, useCallback } from "react";
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

function SectionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-3" />
        <p className="text-white/50 text-sm">Loading section...</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const slidingRef = useRef<SlidingPageContainerHandle>(null);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    slidingRef.current?.goToSectionById(sectionId);
  }, []);

  const sections = useMemo(() => [
    {
      id: "bounties",
      label: "Bounties",
      component: (
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-emerald-950/10 to-slate-950">
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-blue-950/10 to-slate-950">
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-pink-950/10 to-slate-950">
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950">
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-cyan-950/10 to-slate-950" fullHeight={false}>
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-violet-950/10 to-slate-950">
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
        <SectionWrapper className="relative bg-gradient-to-b from-slate-950 via-teal-950/10 to-slate-950">
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
  ], [handleNavigateToSection]);

  return (
    <div className="relative bg-background text-foreground">
      <SlidingPageContainer ref={slidingRef} sections={sections} initialSection={3} />
    </div>
  );
}
