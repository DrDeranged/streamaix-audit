import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Filter, Search, Sparkles, ExternalLink, Home, ArrowLeft, Wallet, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

const MarketCard = ({ market }: { market: PredictionMarket }) => {
  const yesPercentage = (market.yesPrice / 100).toFixed(1);
  const noPercentage = (market.noPrice / 100).toFixed(1);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  
  // AI prediction indicator
  const hasAiPrediction = market.aiProbability !== undefined && market.aiProbability !== null;
  const aiPrediction = hasAiPrediction ? (market.aiProbability! > 50 ? 'YES' : 'NO') : null;
  const aiConfidence = market.aiProbability || 50;

  return (
    <Link href={`/markets/${market.id}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 overflow-hidden backdrop-blur-sm hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 h-full cursor-pointer">
          {market.imageUrl && (
            <div className="h-32 overflow-hidden relative">
              <img 
                src={market.imageUrl} 
                alt={market.question}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            </div>
          )}
          
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                  {market.category.replace('_', ' ').toUpperCase()}
                </span>
                {market.sourceContentId && (
                  <span className="px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs rounded border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Generated
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">{daysLeft}d left</span>
            </div>

            {/* AI Consensus Card */}
            <AIConsensusCard marketId={market.id} compact />

            <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
              {market.question}
            </h3>
            
            {market.sourceSummary && (
              <Link href={`/summary/${market.sourceContentId}`}>
                <div className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  <span className="line-clamp-1">{market.sourceSummary.title}</span>
                </div>
              </Link>
            )}

            <div className="flex gap-2">
              <div className="flex-1 bg-green-500/20 rounded p-2 border border-green-500/30">
                <div className="text-xs text-green-300">YES</div>
                <div className="text-lg font-bold text-green-400">{yesPercentage}%</div>
              </div>
              <div className="flex-1 bg-red-500/20 rounded p-2 border border-red-500/30">
                <div className="text-xs text-red-300">NO</div>
                <div className="text-lg font-bold text-red-400">{noPercentage}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
              <span>{(market.totalVolume / 1000).toFixed(1)}K Vol</span>
              <span>{market.totalTrades} Trades</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

export default function Markets() {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
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

  const markets = marketsData?.markets || [];
  const stats = statsData?.stats;

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = searchQuery === "" || market.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || 
      (sourceFilter === "ai" && market.sourceContentId) || 
      (sourceFilter === "community" && !market.sourceContentId);
    return matchesSearch && matchesSource;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">

        {/* Hero Header - Compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 border border-purple-500/20 p-4"
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-2"
              >
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Prediction Markets ✨
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-300 text-sm mb-2 font-light"
              >
                🚀 <span className="font-semibold text-cyan-300">Trade the future.</span> Predict outcomes. <span className="font-semibold text-purple-300">Earn STREAM.</span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2 text-xs"
              >
                <Badge className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-200 border-purple-500/30 px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Predictions
                </Badge>
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border-cyan-500/30 px-2 py-0.5">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live Trading
                </Badge>
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border-green-500/30 px-2 py-0.5">
                  Base Network
                </Badge>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
            {/* Wallet Button */}
            {!isConnected ? (
              <Button
                onClick={() => connectWallet('metamask')}
                disabled={isConnecting}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
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
                    className="border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
                    data-testid="button-wallet-menu"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    <span className="text-cyan-400">{formatAddress(wallet?.address || '')}</span>
                    {wallet?.chainId === 8453 ? (
                      <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs" data-testid="badge-base-network">
                        Base
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs" data-testid="badge-wrong-network">
                        Wrong Network
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-white w-64">
                  <DropdownMenuLabel className="text-slate-400">Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <div className="px-2 py-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Address:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 text-xs">{formatAddress(wallet?.address || '')}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(wallet?.address || '');
                            toast({ title: "Copied!", description: "Address copied to clipboard" });
                          }}
                          className="hover:text-cyan-400 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {wallet?.balance && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Balance:</span>
                        <span className="text-white">{formatBalance(wallet.balance)} ETH</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Network:</span>
                      <span className="text-white">{getNetworkInfo(wallet?.chainId || 1)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {wallet?.chainId !== 8453 && (
                    <DropdownMenuItem
                      onClick={() => switchNetwork(8453)}
                      className="text-yellow-400 focus:text-yellow-300 focus:bg-yellow-500/10 cursor-pointer"
                      data-testid="menu-switch-to-base"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Switch to Base Network
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={disconnect}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
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
              className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white border-0 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              data-testid="button-create-market"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Market
            </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats - Compact */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-3">
                <div className="text-xs text-purple-300/80">Active Markets</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {stats.activeMarkets}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="p-3">
                <div className="text-xs text-cyan-300/80">Total Volume</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {(stats.totalVolume / 1000000).toFixed(1)}M
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="p-3">
                <div className="text-xs text-green-300/80">Total Trades</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {stats.totalTrades.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
              <CardContent className="p-3">
                <div className="text-xs text-orange-300/80">All Markets</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {stats.totalMarkets}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              data-testid="input-search-markets"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48 bg-slate-900/50 border-slate-700 text-white" data-testid="select-category">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="defi">DeFi</SelectItem>
              <SelectItem value="real_world">Real World</SelectItem>
              <SelectItem value="community">Community</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-48 bg-slate-900/50 border-slate-700 text-white" data-testid="select-source">
              <Sparkles className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
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
                  <Card key={i} className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-24 bg-slate-700" />
                      <Skeleton className="h-12 w-full bg-slate-700" />
                      <div className="flex gap-2">
                        <Skeleton className="h-16 flex-1 bg-slate-700" />
                        <Skeleton className="h-16 flex-1 bg-slate-700" />
                      </div>
                      <Skeleton className="h-4 w-full bg-slate-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMarkets.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {filteredMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </motion.div>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Markets Found</h3>
                  <p className="text-slate-400 mb-6">
                    {searchQuery ? "Try a different search term" : "Be the first to create a market"}
                  </p>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0"
                    data-testid="button-create-first-market"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Market
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Activity Feed - Right Column */}
          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MarketActivityFeed limit={15} className="max-w-full" />
              </motion.div>
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
