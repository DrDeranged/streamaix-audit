import { Navigation } from "@/components/landing/navigation";
import { AICapabilitiesBanner } from "@/components/landing/ai-capabilities-banner";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AIProcessor } from "@/components/landing/rebuilt-ai-demo";
import LiveCryptoVideos from "@/components/landing/live-crypto-videos";
import { NeuralNetworkBackground } from "@/components/NeuralNetworkBackground";
import { WhyBlockchain } from "@/components/landing/why-blockchain";
import { KnowledgeAvatars } from "@/components/landing/knowledge-avatars";
import { AISuggestions } from "@/components/landing/ai-suggestions";
import { BountyFeed } from "@/components/landing/bounty-feed";
import { PredictionMarketSection } from "@/components/PredictionMarketSection";
import { SocialEcosystem } from "@/components/landing/social-ecosystem";
import { SocialFeed } from "@/components/landing/SocialFeed";
import { Footer } from "@/components/landing/footer";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <NeuralNetworkBackground />
      <div className="relative z-10">
        <Navigation />
        <AICapabilitiesBanner />
        <HeroSection />
        <HowItWorks />
        <AIProcessor />
        <LiveCryptoVideos />
        <BountyFeed />
        <PredictionMarketSection />
        <WhyBlockchain />
        <SocialEcosystem />
        <SocialFeed />
        <KnowledgeAvatars />
        <AISuggestions />
        <Footer />
      </div>
    </div>
  );
}
