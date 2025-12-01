import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton, TradingSkeleton } from "@/components/LazyWrapper";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { OnboardingTour } from "@/components/OnboardingTour";
import { PWAInstallPrompt, PWAUpdatePrompt } from "@/components/pwa/PWAInstallPrompt";
import { ScrollToTop } from "@/components/ScrollToTop";

// Immediate load for critical pages
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import AuthSuccess from "@/pages/auth-success";
import NotFound from "@/pages/not-found";

// Lazy load heavy pages for better performance
const Dashboard = React.lazy(() => import("@/pages/dashboard"));
const CreateSummary = React.lazy(() => import("@/pages/create-summary"));
const WalletDashboard = React.lazy(() => import("@/pages/wallet-dashboard"));
const Web3WalletPage = React.lazy(() => import("@/pages/web3-wallet"));
const DeFiDashboard = React.lazy(() => import("@/pages/defi-dashboard"));
const NFTGallery = React.lazy(() => import("@/pages/nft-gallery"));
const GovernancePage = React.lazy(() => import("@/pages/governance"));
const BountyBoard = React.lazy(() => import("@/pages/bounty-board"));
const BountyDetail = React.lazy(() => import("@/pages/bounty-detail"));
const Leaderboard = React.lazy(() => import("@/pages/leaderboard"));
const HunterProfile = React.lazy(() => import("@/pages/hunter-profile"));
const SummaryView = React.lazy(() => import("@/pages/summary-view"));
const ProcessingResults = React.lazy(() => import("@/pages/processing-results"));
const FarcasterActivity = React.lazy(() => import("@/pages/farcaster-activity"));
const AvatarProfile = React.lazy(() => import("@/pages/avatar-profile"));
const InsightsDashboard = React.lazy(() => import("@/pages/InsightsDashboard"));
const AnalyticsDashboard = React.lazy(() => import("@/pages/AnalyticsDashboard"));
const Markets = React.lazy(() => import("@/pages/markets"));
const PredictionMarket = React.lazy(() => import("@/pages/prediction-market"));
const ChatPage = React.lazy(() => import("@/pages/chat"));
const Discover = React.lazy(() => import("@/pages/discover"));
const Summaries = React.lazy(() => import("@/pages/summaries"));
const NewsletterAdmin = React.lazy(() => import("@/pages/newsletter-admin"));
const MarketAchievements = React.lazy(() => import("@/pages/market-achievements"));
const MarketPortfolio = React.lazy(() => import("@/pages/market-portfolio"));
const MarketLeaderboard = React.lazy(() => import("@/pages/market-leaderboard"));
const Leagues = React.lazy(() => import("@/pages/leagues"));
const LeagueDetail = React.lazy(() => import("@/pages/league-detail"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth-success" component={AuthSuccess} />
      
      <Route path="/dashboard">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </Route>
      
      <Route path="/create-summary">
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-gray-900 dark:text-white">Loading...</div></div>}>
          <CreateSummary />
        </Suspense>
      </Route>
      
      <Route path="/wallet-dashboard">
        <Suspense fallback={<DashboardSkeleton />}>
          <WalletDashboard />
        </Suspense>
      </Route>
      
      <Route path="/web3-wallet">
        <Suspense fallback={<DashboardSkeleton />}>
          <Web3WalletPage />
        </Suspense>
      </Route>
      
      <Route path="/defi-dashboard">
        <Suspense fallback={<DashboardSkeleton />}>
          <DeFiDashboard />
        </Suspense>
      </Route>
      
      <Route path="/nft-gallery">
        <Suspense fallback={<DashboardSkeleton />}>
          <NFTGallery />
        </Suspense>
      </Route>
      
      <Route path="/governance">
        <Suspense fallback={<DashboardSkeleton />}>
          <GovernancePage />
        </Suspense>
      </Route>
      
      <Route path="/bounties">
        <Suspense fallback={<DashboardSkeleton />}>
          <BountyBoard />
        </Suspense>
      </Route>
      
      <Route path="/bounties/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <BountyDetail />
        </Suspense>
      </Route>
      
      <Route path="/leaderboard">
        <Suspense fallback={<DashboardSkeleton />}>
          <Leaderboard />
        </Suspense>
      </Route>
      
      <Route path="/hunter/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <HunterProfile />
        </Suspense>
      </Route>
      
      <Route path="/farcaster-activity">
        <Suspense fallback={<DashboardSkeleton />}>
          <FarcasterActivity />
        </Suspense>
      </Route>
      
      <Route path="/avatar/:handle">
        <Suspense fallback={<DashboardSkeleton />}>
          <AvatarProfile />
        </Suspense>
      </Route>
      
      <Route path="/insights">
        <Suspense fallback={<DashboardSkeleton />}>
          <InsightsDashboard />
        </Suspense>
      </Route>
      
      <Route path="/analytics">
        <Suspense fallback={<DashboardSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </Route>
      
      <Route path="/discover">
        <Suspense fallback={<DashboardSkeleton />}>
          <Discover />
        </Suspense>
      </Route>
      
      <Route path="/summaries">
        <Suspense fallback={<DashboardSkeleton />}>
          <Summaries />
        </Suspense>
      </Route>
      
      <Route path="/markets">
        <Suspense fallback={<DashboardSkeleton />}>
          <Markets />
        </Suspense>
      </Route>
      
      <Route path="/markets/leaderboard">
        <Suspense fallback={<DashboardSkeleton />}>
          <MarketLeaderboard />
        </Suspense>
      </Route>
      
      <Route path="/markets/achievements">
        <Suspense fallback={<DashboardSkeleton />}>
          <MarketAchievements />
        </Suspense>
      </Route>
      
      <Route path="/markets/portfolio">
        <Suspense fallback={<DashboardSkeleton />}>
          <MarketPortfolio />
        </Suspense>
      </Route>
      
      <Route path="/leagues">
        <Suspense fallback={<DashboardSkeleton />}>
          <Leagues />
        </Suspense>
      </Route>
      
      <Route path="/leagues/:leagueId">
        <Suspense fallback={<DashboardSkeleton />}>
          <LeagueDetail />
        </Suspense>
      </Route>
      
      <Route path="/markets/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <PredictionMarket />
        </Suspense>
      </Route>
      
      <Route path="/chat">
        <Suspense fallback={<DashboardSkeleton />}>
          <ChatPage />
        </Suspense>
      </Route>
      
      <Route path="/newsletter-admin">
        <Suspense fallback={<DashboardSkeleton />}>
          <NewsletterAdmin />
        </Suspense>
      </Route>
      
      <Route path="/summary/:id">
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-gray-900 dark:text-white">Loading...</div></div>}>
          <SummaryView />
        </Suspense>
      </Route>
      
      <Route path="/results/:id">
        {(params) => (
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-gray-900 dark:text-white">Loading...</div></div>}>
            <ProcessingResults params={params} />
          </Suspense>
        )}
      </Route>
      
      <Route path="/processing-results/:id">
        {(params) => (
          <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-gray-900 dark:text-white">Loading...</div></div>}>
            <ProcessingResults params={params} />
          </Suspense>
        )}
      </Route>
      
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="streamaix-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatWidget />
            <OnboardingTour />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <ScrollToTop />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;