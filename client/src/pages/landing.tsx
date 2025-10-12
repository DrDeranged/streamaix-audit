import { Navigation } from "@/components/landing/navigation";
import { AICapabilitiesBanner } from "@/components/landing/ai-capabilities-banner";
import { HeroSection } from "@/components/landing/hero-section";
import { InteractiveFeatures } from "@/components/landing/interactive-features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AIProcessor } from "@/components/landing/rebuilt-ai-demo";
import LiveCryptoVideos from "@/components/landing/live-crypto-videos";
import { TrendingSocialContent } from "@/components/landing/trending-social-content";

import { WhyBlockchain } from "@/components/landing/why-blockchain";
import { KnowledgeAvatars } from "@/components/landing/knowledge-avatars";
import { AISuggestions } from "@/components/landing/ai-suggestions";
import { Bounties } from "@/components/landing/bounties";
import { BountyFeed } from "@/components/landing/bounty-feed";
import { PredictionMarketSection } from "@/components/PredictionMarketSection";
import { SocialEcosystem } from "@/components/landing/social-ecosystem";
import { Footer } from "@/components/landing/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AICapabilitiesBanner />
      <HeroSection />
      <InteractiveFeatures />
      <HowItWorks />
      <AIProcessor />
      <LiveCryptoVideos />
      <TrendingSocialContent />
      <WhyBlockchain />
      <KnowledgeAvatars />
      <AISuggestions />
      <BountyFeed />
      <PredictionMarketSection />
      <SocialEcosystem />
      <Footer />
    </div>
  );
}
