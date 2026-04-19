import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton, TradingSkeleton } from "@/components/LazyWrapper";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { OnboardingTour } from "@/components/OnboardingTour";
import { PWAInstallPrompt, PWAUpdatePrompt } from "@/components/pwa/PWAInstallPrompt";
import { GlobalMobileHeader } from "@/components/GlobalMobileHeader";
import { WidgetSettingsProvider } from "@/contexts/WidgetSettingsContext";

// Immediate load for critical pages
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import AuthSuccess from "@/pages/auth-success";
import NotFound from "@/pages/not-found";

// Lazy load heavy pages for better performance
const Dashboard = React.lazy(() => import("@/pages/dashboard"));
const CreateSummary = React.lazy(() => import("@/pages/create-summary"));
const WalletDashboard = React.lazy(() => import("@/pages/wallet-dashboard"));
const BountyBoard = React.lazy(() => import("@/pages/bounty-board"));
const BountyDetail = React.lazy(() => import("@/pages/bounty-detail"));
const Leaderboard = React.lazy(() => import("@/pages/leaderboard"));
const HunterProfile = React.lazy(() => import("@/pages/hunter-profile"));
const SummaryView = React.lazy(() => import("@/pages/summary-view"));
const ProcessingResults = React.lazy(() => import("@/pages/processing-results"));
const FarcasterActivity = React.lazy(() => import("@/pages/farcaster-activity"));
const AvatarProfile = React.lazy(() => import("@/pages/avatar-profile"));
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
const StreamView = React.lazy(() => import("@/pages/stream-view"));
const GoLive = React.lazy(() => import("@/pages/go-live"));
const Streams = React.lazy(() => import("@/pages/streams"));
const DebateView = React.lazy(() => import("@/pages/debate-view"));
const Debates = React.lazy(() => import("@/pages/debates"));
const StreamReplays = React.lazy(() => import("@/pages/stream-replays"));
const FollowingFeed = React.lazy(() => import("@/pages/following-feed"));
const Points = React.lazy(() => import("@/pages/points"));
const AITrading = React.lazy(() => import("@/pages/ai-trading"));
const KnowledgeAvatarProfile = React.lazy(() => import("@/pages/knowledge-avatar-profile"));
const LearningHub = React.lazy(() => import("@/pages/learning-hub"));
const LessonViewer = React.lazy(() => import("@/pages/lesson-viewer"));
const PortfolioDashboard = React.lazy(() => import("@/pages/portfolio-dashboard"));
const NotificationSettings = React.lazy(() => import("@/pages/notification-settings"));
const BotTrading = React.lazy(() => import("@/pages/bot-trading"));
const AvatarFeed = React.lazy(() => import("@/pages/avatar-feed"));
const StyleGuide = React.lazy(() => import("@/pages/style-guide"));
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
      
      <Route path="/bounties">
        <Suspense fallback={<DashboardSkeleton />}>
          <BountyBoard />
        </Suspense>
      </Route>
      
      <Route path="/following">
        <Suspense fallback={<DashboardSkeleton />}>
          <FollowingFeed />
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
      
      <Route path="/avatar-feed">
        <Suspense fallback={<DashboardSkeleton />}>
          <AvatarFeed />
        </Suspense>
      </Route>

      <Route path="/knowledge-avatars/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <KnowledgeAvatarProfile />
        </Suspense>
      </Route>
      
      <Route path="/insights">
        <Suspense fallback={<DashboardSkeleton />}>
          <Discover />
        </Suspense>
      </Route>
      
      <Route path="/analytics">
        <Suspense fallback={<DashboardSkeleton />}>
          <Discover />
        </Suspense>
      </Route>
      
      <Route path="/discover">
        <Suspense fallback={<DashboardSkeleton />}>
          <Discover />
        </Suspense>
      </Route>
      
      <Route path="/ai-trading">
        <Suspense fallback={<TradingSkeleton />}>
          <AITrading />
        </Suspense>
      </Route>

      <Route path="/bot-trading">
        <Suspense fallback={<TradingSkeleton />}>
          <BotTrading />
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
      
      <Route path="/stream/:id">
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <StreamView />
          </Suspense>
        </ErrorBoundary>
      </Route>
      
      <Route path="/debate/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <DebateView />
        </Suspense>
      </Route>
      
      <Route path="/debates">
        <Suspense fallback={<DashboardSkeleton />}>
          <Debates />
        </Suspense>
      </Route>
      
      <Route path="/debates/:id">
        <Suspense fallback={<DashboardSkeleton />}>
          <DebateView />
        </Suspense>
      </Route>
      
      <Route path="/go-live">
        <Suspense fallback={<DashboardSkeleton />}>
          <GoLive />
        </Suspense>
      </Route>
      
      <Route path="/streams">
        <Suspense fallback={<DashboardSkeleton />}>
          <Streams />
        </Suspense>
      </Route>
      
      <Route path="/streams/discover">
        <Suspense fallback={<DashboardSkeleton />}>
          <Streams />
        </Suspense>
      </Route>
      
      <Route path="/replays">
        <Suspense fallback={<DashboardSkeleton />}>
          <StreamReplays />
        </Suspense>
      </Route>
      
      <Route path="/gamification">
        <Suspense fallback={<DashboardSkeleton />}>
          <Points />
        </Suspense>
      </Route>
      
      <Route path="/points">
        <Suspense fallback={<DashboardSkeleton />}>
          <Points />
        </Suspense>
      </Route>
      
      <Route path="/settings/notifications">
        <Suspense fallback={<DashboardSkeleton />}>
          <NotificationSettings />
        </Suspense>
      </Route>
      
      <Route path="/learn">
        <Suspense fallback={<DashboardSkeleton />}>
          <LearningHub />
        </Suspense>
      </Route>
      
      <Route path="/learn/:moduleId">
        <Suspense fallback={<DashboardSkeleton />}>
          <LessonViewer />
        </Suspense>
      </Route>
      
      <Route path="/learn/:moduleId/:lessonId">
        <Suspense fallback={<DashboardSkeleton />}>
          <LessonViewer />
        </Suspense>
      </Route>
      
      <Route path="/portfolio">
        <Suspense fallback={<DashboardSkeleton />}>
          <PortfolioDashboard />
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

      <Route path="/style-guide">
        <Suspense fallback={<DashboardSkeleton />}>
          <StyleGuide />
        </Suspense>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="streamaix-theme">
          <WidgetSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <GlobalMobileHeader />
              <Router />
              <ChatWidget />
              <VoiceAssistant />
              <OnboardingTour />
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
            </TooltipProvider>
          </WidgetSettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;