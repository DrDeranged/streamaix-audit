import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveDemo } from "@/components/landing/live-demo";
import { WhyBlockchain } from "@/components/landing/why-blockchain";
import { KnowledgeAvatars } from "@/components/landing/knowledge-avatars";
import { AISuggestions } from "@/components/landing/ai-suggestions";
import { Bounties } from "@/components/landing/bounties";
import { SocialEcosystem } from "@/components/landing/social-ecosystem";
import { Footer } from "@/components/landing/footer";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="streamaix-theme">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <HeroSection />
            <HowItWorks />
            <LiveDemo />
            <WhyBlockchain />
            <KnowledgeAvatars />
            <AISuggestions />
            <Bounties />
            <SocialEcosystem />
            <Footer />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;