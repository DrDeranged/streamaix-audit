import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton, TradingSkeleton } from "@/components/LazyWrapper";

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
const SocialTradingPage = React.lazy(() => import("@/pages/social-trading"));
const SummaryView = React.lazy(() => import("@/pages/summary-view"));
const ProcessingResults = React.lazy(() => import("@/pages/processing-results"));

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
      
      <Route path="/social-trading">
        <Suspense fallback={<TradingSkeleton />}>
          <SocialTradingPage />
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
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;