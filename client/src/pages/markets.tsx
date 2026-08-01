import { useState, useEffect, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, TrendingUp, Filter, Search, Sparkles, ExternalLink, Home, ArrowLeft, Wallet, Copy, AlertTriangle, Trophy, Award, PieChart, Bot, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatGrid } from "@/components/StatGrid";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import StatValue from "@/components/ds/StatValue";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/landing/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMarketModal } from "@/components/prediction/CreateMarketModal";
import { AiAgentPredictions } from "@/components/prediction/AiAgentPredictions";
import { MarketActivityFeed } from "@/components/markets/MarketActivityFeed";
import { AIConsensusCard } from "@/components/markets/AIConsensusCard";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useWeb3 } from "@/hooks/useWeb3";
import { useToast } from "@/hooks/use-toast";

interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  deadline: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalTrades: number;
  imageUrl?: string;
  tags?: string[];
  sourceContentId?: string;
  sourceSummary?: {
    id: string;
    title: string;
  };
  aiProbability?: number;
  aiReasoning?: string;
}

const MarketCard = memo(({ market }: { market: PredictionMarket }) => {
  const normalizePrice = (price: number) => {
    if (price > 10000) return 50;
    return price / 100;
  };
  const yesPercentage = normalizePrice(market.yesPrice).toFixed(1);
  const noPercentage = normalizePrice(market.noPrice).toFixed(1);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="transform transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1.5">
        <Surface className="surface-interactive overflow-hidden hover:border-accent-core/60 h-full cursor-pointer">
          {market.imageUrl && (
            <div className="h-32 overflow-hidden relative">
              <img 
                src={market.imageUrl} 
                alt={market.question}
                loading="lazy"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-ink-page/70" />
            </div>
          )}
          
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-accent-core/15 text-accent-bright text-xs rounded-xl border border-accent-core/30">
                  {market.category.replace('_', ' ').toUpperCase()}
                </span>
                {market.sourceContentId && (
                  <span className="px-2 py-1 bg-accent-core/15 text-accent-bright text-xs rounded-xl border border-accent-core/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Generated
                  </span>
                )}
              </div>
              <span className="text-xs text-muted">{daysLeft}d left</span>
            </div>

            <AIConsensusCard marketId={market.id} compact />

            <h3 className="text-sm font-semibold text-primary line-clamp-2 leading-snug">
              {market.question}
            </h3>
            
            {market.sourceSummary && (
              <Link href={`/summary/${market.sourceContentId}`}>
                <div className="flex items-center gap-1 text-xs text-accent-bright hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  <span className="line-clamp-1">{market.sourceSummary.title}</span>
                </div>
              </Link>
            )}

            <div className="flex gap-2">
                <div className="flex-1 bg-ink-raised rounded-xl p-3 border border-gain/40">
                  <div className="text-xs font-medium text-gain mb-0.5">YES</div>
                  <StatValue label="" value={`${yesPercentage}%`} valueClassName="text-gain text-xl md:text-2xl font-bold" />
              </div>
                <div className="flex-1 bg-ink-raised rounded-xl p-3 border border-loss/40">
                  <div className="text-xs font-medium text-loss mb-0.5">NO</div>
                  <StatValue label="" value={`${noPercentage}%`} valueClassName="text-loss text-xl md:text-2xl font-bold" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-ink-divider">
              <span>{(market.totalVolume / 1000).toFixed(1)}K Vol</span>
              <span>{market.totalTrades} Trades</span>
            </div>
          </div>
        </Surface>
      </div>
    </Link>
  );
});

export default function Markets() {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const INITIAL_MARKET_COUNT = 8;
  
  const { toast } = useToast();
  const {
    wallet,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    switchNetwork,
    formatAddress,
    formatBalance,
    getNetworkInfo,
    isMetaMaskAvailable,
  } = useWeb3();

  const { data: marketsData, isLoading } = useQuery<{ markets: PredictionMarket[] }>({
    queryKey: category === "all" ? ["/api/prediction-markets"] : ["/api/prediction-markets", { category }],
  });

  const { data: statsData } = useQuery<{ stats: any }>({
    queryKey: ["/api/prediction-markets/stats"],
  });

  const { data: aiStatsData } = useQuery<{ totalAiInLeagues: number; activeLeagues: number }>({
    queryKey: ["/api/prediction-leagues/ai-stats"],
  });

  const markets = marketsData?.markets || [];
  const stats = statsData?.stats;
  const aiStats = aiStatsData;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = searchQuery === "" || market.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || 
      (sourceFilter === "ai" && market.sourceContentId) || 
      (sourceFilter === "community" && !market.sourceContentId);
    return matchesSearch && matchesSource;
  });

  const displayedMarkets = showAllMarkets ? filteredMarkets : filteredMarkets.slice(0, INITIAL_MARKET_COUNT);
  const hasMoreMarkets = filteredMarkets.length > INITIAL_MARKET_COUNT;

  return (
    <div className="min-h-screen bg-ink-page tnums-scope">
      <Navigation />
      <div className="section-container pt-24">

        {/* Page header */}
        <PageHeader
          eyebrow="On-chain · Base"
          title="Prediction Markets"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Trade the future. Predict outcomes. Earn STREAM."
          className="mb-6"
          actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Wallet Button */}
            {!isConnected ? (
              <Button
                onClick={() => connectWallet('metamask')}
                disabled={isConnecting}
                variant="outline"
                 className="border-accent-core/50 text-accent-bright hover:bg-accent-core/10 hover:border-accent-core transition-all duration-300"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                     className="border-accent-core/50 hover:bg-accent-core/10 hover:border-accent-core transition-all duration-300"
                    data-testid="button-wallet-menu"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                     <span className="text-accent-bright">{formatAddress(wallet?.address || '')}</span>
                    {wallet?.chainId === 8453 ? (
                        <Badge className="ml-2 bg-gain/15 text-gain border-gain/30 text-xs" data-testid="badge-base-network">
                        Base
                      </Badge>
                    ) : (
                        <Badge className="ml-2 bg-warn/15 text-warn border-warn/30 text-xs" data-testid="badge-wrong-network">
                        Wrong Network
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-ink-surface border border-ink-edge text-body w-64">
                  <DropdownMenuLabel className="text-secondary">Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-ink-divider" />
                  <div className="px-2 py-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Address:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-accent-bright text-xs">{formatAddress(wallet?.address || '')}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(wallet?.address || '');
                            toast({ title: "Copied!", description: "Address copied to clipboard" });
                          }}
                          className="hover:text-accent-bright transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {wallet?.balance && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary">Balance:</span>
                        <span className="text-primary">{formatBalance(wallet.balance)} ETH</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Network:</span>
                      <span className="text-primary">{getNetworkInfo(wallet?.chainId || 1)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-muted" />
                  {wallet?.chainId !== 8453 && (
                    <DropdownMenuItem
                      onClick={() => switchNetwork(8453)}
                      className="text-warn focus:text-warn focus:bg-warn/10 cursor-pointer"
                      data-testid="menu-switch-to-base"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Switch to Base Network
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={disconnect}
                    className="text-loss focus:text-loss focus:bg-loss/10 cursor-pointer"
                    data-testid="menu-disconnect"
                  >
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Create Market Button */}
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="grad-accent glow-accent text-primary border-0 transition-all duration-300 hover:scale-105"
              data-testid="button-create-market"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Market
            </Button>
            </div>
          }
        />

        {/* Stats - Enhanced with Animated Counters */}
        {stats && (
          <StatGrid className="mb-6">
            <div className="transform transition-transform duration-200 hover:scale-[1.02]">
              <Surface className="overflow-hidden">
                <div className="p-4 relative">
                  <StatValue label="Active Markets" value={stats.activeMarkets} />
                  <AnimatedCounter 
                    value={stats.activeMarkets} 
                    className="text-primary tabular"
                    duration={800}
                  />
                </div>
              </Surface>
            </div>
            
            <div className="transform transition-transform duration-200 hover:scale-[1.02]">
              <Surface className="overflow-hidden">
                <div className="p-4 relative">
                  <StatValue label="Total Volume" value={`${(stats.totalVolume / 1000000).toFixed(1)}M`} delta={12} />
                  <AnimatedCounter 
                    value={stats.totalVolume / 1000000} 
                    formatValue={(v) => `${v.toFixed(1)}M`}
                    className="text-primary tabular"
                    trend="up"
                    trendValue="+12%"
                    duration={1000}
                  />
                </div>
              </Surface>
            </div>
            
            <div className="transform transition-transform duration-200 hover:scale-[1.02]">
              <Surface className="overflow-hidden">
                <div className="p-4 relative">
                  <StatValue label="Total Trades" value={stats.totalTrades.toLocaleString()} />
                  <AnimatedCounter 
                    value={stats.totalTrades} 
                    formatValue={(v) => v.toLocaleString()}
                    className="text-primary tabular"
                    showSparkle={true}
                    duration={900}
                  />
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
                </div>
              </Surface>
            </div>
            
            <div className="transform transition-transform duration-200 hover:scale-[1.02]">
              <Surface className="overflow-hidden">
                <div className="p-4 relative">
                  <StatValue label="All Markets" value={stats.totalMarkets} />
                  <AnimatedCounter 
                    value={stats.totalMarkets} 
                    className="text-primary tabular"
                    duration={850}
                  />
                </div>
              </Surface>
            </div>
          </StatGrid>
        )}

        {/* Market Features Navigation */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/leagues">
              <div className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
                <Surface className="overflow-hidden group">
                  <div className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-accent-core/15 group-hover:bg-accent-core/25 transition-colors">
                        <Swords className="w-5 h-5 text-accent-bright" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary text-sm flex items-center gap-2">
                          Prediction Leagues
                          {aiStats && aiStats.totalAiInLeagues > 0 && (
                            <Badge className="bg-accent-core/15 text-accent-bright border-accent-core/30 px-1.5 py-0 text-[10px]">
                              <Bot className="w-2.5 h-2.5 mr-0.5" />
                              {aiStats.totalAiInLeagues} AI
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-secondary">Compete for prizes</p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </div>
            </Link>

            <Link href="/markets/leaderboard">
              <div className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
                <Surface className="overflow-hidden group">
                  <div className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-warn/15 group-hover:bg-warn/25 transition-colors">
                        <Trophy className="w-5 h-5 text-warn" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary text-sm">Leaderboard</h3>
                        <p className="text-xs text-secondary">Top traders & rankings</p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </div>
            </Link>

            <Link href="/markets/achievements">
              <div className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
                <Surface className="overflow-hidden group">
                  <div className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-accent-core/15 group-hover:bg-accent-core/25 transition-colors">
                        <Award className="w-5 h-5 text-accent-bright" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary text-sm">Achievements</h3>
                        <p className="text-xs text-secondary">Unlock badges & rewards</p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </div>
            </Link>

            <Link href="/markets/portfolio">
              <div className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
                <Surface className="overflow-hidden group">
                  <div className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-accent-core/15 group-hover:bg-accent-core/25 transition-colors">
                        <PieChart className="w-5 h-5 text-accent-bright" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary text-sm">Portfolio</h3>
                        <p className="text-xs text-secondary">Track your P&L & trades</p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </div>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-markets"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-category">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="surface-2">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="defi">DeFi</SelectItem>
              <SelectItem value="real_world">Real World</SelectItem>
              <SelectItem value="community">Community</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-source">
              <Sparkles className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="surface-2">
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="ai">AI-Generated</SelectItem>
              <SelectItem value="community">Community Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content: Markets Grid + Activity Feed */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Markets Grid - Left Column */}
          <div className="flex-1 lg:w-[65%]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Surface key={i} className="p-4 space-y-3">
                      <Skeleton className="h-4 w-24 bg-muted" />
                      <Skeleton className="h-12 w-full bg-muted" />
                      <div className="flex gap-2">
                        <Skeleton className="h-16 flex-1 bg-muted" />
                        <Skeleton className="h-16 flex-1 bg-muted" />
                      </div>
                      <Skeleton className="h-4 w-full bg-muted" />
                  </Surface>
                ))}
              </div>
            ) : filteredMarkets.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                  {displayedMarkets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </div>
                
                {/* View All / Show Less Button */}
                {hasMoreMarkets && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllMarkets(!showAllMarkets)}
                      className="border-accent-core/50 text-accent-bright hover:bg-accent-core/10 hover:border-accent-core transition-all"
                      data-testid="button-toggle-markets"
                    >
                      {showAllMarkets ? (
                        <>Show Less Markets</>
                      ) : (
                        <>View All {filteredMarkets.length} Markets</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Surface className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted" />
                  <SectionTitle as="h3" className="mb-2">No Markets Found</SectionTitle>
                  <p className="text-secondary mb-6">
                    {searchQuery ? "Try a different search term" : "Be the first to create a market"}
                  </p>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="grad-accent text-primary border-0"
                    data-testid="button-create-first-market"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Market
                  </Button>
              </Surface>
            )}
          </div>

          {/* AI Activity Feed - Right Column */}
          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="animate-fade-in">
                <MarketActivityFeed limit={15} className="max-w-full" />
              </div>
              
              {/* Engagement Section - Leagues, Achievements, Leaderboard */}
              <div className="space-y-3 animate-fade-in">
                {/* Quick Engagement Links */}
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent-bright" />
                  <h4 className="text-sm font-semibold text-body">Compete & Earn</h4>
                </div>
                
                {/* Leagues Card */}
                <Link href="/leagues">
                  <Surface className="p-3 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-accent-core/15">
                            <Swords className="w-4 h-4 text-accent-bright" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary">Prediction Leagues</span>
                              {aiStats && aiStats.totalAiInLeagues > 0 && (
                                <Badge className="bg-accent-core/15 text-accent-bright border-accent-core/30 px-1 py-0 text-[10px]">
                                  <Bot className="w-2.5 h-2.5 mr-0.5" />
                                  {aiStats.totalAiInLeagues}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-secondary">Compete for STREAM prizes</p>
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-accent-bright group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Surface>
                </Link>
                
                {/* Leaderboard Card */}
                <Link href="/markets/leaderboard">
                  <Surface className="p-3 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-warn/15">
                            <Trophy className="w-4 h-4 text-warn" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-primary block">Leaderboard</span>
                            <p className="text-xs text-secondary">Top traders & rankings</p>
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-warn group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Surface>
                </Link>
                
                {/* Achievements Card */}
                <Link href="/markets/achievements">
                  <Surface className="p-3 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-accent-core/15">
                            <Award className="w-4 h-4 text-accent-bright" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-primary block">Achievements</span>
                            <p className="text-xs text-secondary">Unlock badges & rewards</p>
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-accent-bright group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Surface>
                </Link>
                
                {/* Portfolio Card */}
                <Link href="/markets/portfolio">
                  <Surface className="p-3 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-accent-core/15">
                            <PieChart className="w-4 h-4 text-accent-bright" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-primary block">Portfolio</span>
                            <p className="text-xs text-secondary">Track your P&L</p>
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-accent-bright group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Surface>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Create Market Modal */}
        <CreateMarketModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
      </div>
    </div>
  );
}
