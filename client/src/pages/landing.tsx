import { Navigation } from "@/components/landing/navigation";
import { AICapabilitiesBanner } from "@/components/landing/ai-capabilities-banner";
import { HeroSection } from "@/components/landing/hero-section";
import { LiveStreamingTerminal } from "@/components/landing/live-streaming-terminal";
import { AIProcessor } from "@/components/landing/rebuilt-ai-demo";
import LiveCryptoVideos from "@/components/landing/live-crypto-videos";
import { NeuralNetworkBackground } from "@/components/NeuralNetworkBackground";
import { KnowledgeAvatars } from "@/components/landing/knowledge-avatars";
import { AISuggestions } from "@/components/landing/ai-suggestions";
import { RecentActivity } from "@/components/landing/RecentActivity";
import { BountyFeed } from "@/components/landing/bounty-feed";
import { PredictionMarketSection } from "@/components/PredictionMarketSection";
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
        <LiveStreamingTerminal />
        <AIProcessor />
        <LiveCryptoVideos />
        <BountyFeed />
        <PredictionMarketSection />
        <SocialFeed />
        <KnowledgeAvatars />
        <AISuggestions />
        <RecentActivity />
        <Footer />
      </div>
    </div>
  );
}
