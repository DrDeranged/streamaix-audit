import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CreateSummary from "@/pages/create-summary";
import WalletDashboard from "@/pages/wallet-dashboard";
import Web3WalletPage from "@/pages/web3-wallet";
import DeFiDashboard from "@/pages/defi-dashboard";
import NFTGallery from "@/pages/nft-gallery";
import GovernancePage from "@/pages/governance";
import SummaryView from "@/pages/summary-view";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create-summary" component={CreateSummary} />
      <Route path="/wallet-dashboard" component={WalletDashboard} />
      <Route path="/web3-wallet" component={Web3WalletPage} />
      <Route path="/defi-dashboard" component={DeFiDashboard} />
      <Route path="/nft-gallery" component={NFTGallery} />
      <Route path="/governance" component={GovernancePage} />
      <Route path="/summary/:id" component={SummaryView} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="streamaix-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;