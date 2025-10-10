import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  Award,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Market {
  id: string;
  question: string;
  description?: string;
  category: string;
  deadline: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalTrades: number;
  status: string;
  imageUrl?: string;
  tags?: string[];
  creatorWallet: string;
  resolutionSource: string;
  yesLiquidity: number;
  noLiquidity: number;
  sourceContentId?: string;
  sourceSummary?: {
    id: string;
    title: string;
  };
}

export default function PredictionMarket() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data, isLoading } = useQuery<{ market: Market }>({
    queryKey: ["/api/prediction-markets", id],
  });

  const { data: quoteData, isLoading: quoteLoading } = useQuery({
    queryKey: ["/api/prediction-markets", id, "quote-buy"],
    enabled: amount !== "" && parseFloat(amount) > 0,
  });

  const market = data?.market;
  const quote = quoteData?.quote;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6 bg-slate-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full bg-slate-800" />
              <Skeleton className="h-96 w-full bg-slate-800" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Market Not Found</h2>
          <p className="text-slate-400 mb-4">The market you're looking for doesn't exist.</p>
          <Link href="/markets">
            <Button variant="outline" className="border-slate-700 text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Markets
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const yesPercentage = (market.yesPrice / 100).toFixed(1);
  const noPercentage = (market.noPrice / 100).toFixed(1);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      defi: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      real_world: "bg-green-500/20 text-green-300 border-green-500/30",
      community: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return colors[category] || colors.community;
  };

  const handleTrade = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Trading Coming Soon",
      description: "Connect your wallet to start trading prediction markets",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/markets">
          <Button 
            variant="ghost" 
            className="mb-6 text-slate-400 hover:text-white"
            data-testid="button-back-to-markets"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 overflow-hidden backdrop-blur-sm">
              {market.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={market.imageUrl} 
                    alt={market.question}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${getCategoryColor(market.category)} border`}>
                    {market.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysLeft}d {hoursLeft}h left
                  </Badge>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">{market.question}</h1>
                
                {market.description && (
                  <p className="text-slate-400 mb-4">{market.description}</p>
                )}

                {market.tags && market.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {market.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800/50 text-slate-400 text-sm rounded-full border border-slate-700/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                  <div>
                    <div className="text-sm text-slate-400">Total Volume</div>
                    <div className="text-lg font-bold text-white">{(market.totalVolume / 1000).toFixed(1)}K STREAM</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Total Trades</div>
                    <div className="text-lg font-bold text-white">{market.totalTrades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Liquidity</div>
                    <div className="text-lg font-bold text-white">{((market.yesLiquidity + market.noLiquidity) / 1000).toFixed(1)}K</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-900/50 border-b border-slate-700/50">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="trades" data-testid="tab-trades">Recent Trades</TabsTrigger>
                <TabsTrigger value="positions" data-testid="tab-positions">Top Positions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Market Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {market.sourceSummary && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-cyan-300 font-medium mb-1">AI-Generated from Content</div>
                            <Link href={`/summary/${market.sourceContentId}`}>
                              <div className="flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-400 transition-colors group">
                                <span className="line-clamp-1">{market.sourceSummary.title}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                      <span className="text-slate-400">Resolution Source</span>
                      <span className="text-white font-medium capitalize">{market.resolutionSource}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                      <span className="text-slate-400">Creator</span>
                      <span className="text-white font-mono text-sm">{market.creatorWallet.slice(0, 6)}...{market.creatorWallet.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
                        {market.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-400">Deadline</span>
                      <span className="text-white">{new Date(market.deadline).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-6 text-center text-slate-400">
                    No recent trades available
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="positions" className="mt-6">
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-6 text-center text-slate-400">
                    No position data available
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Current Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-green-300 font-medium">YES</div>
                      <div className="text-2xl font-bold text-green-400">{yesPercentage}%</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-red-300 font-medium">NO</div>
                      <div className="text-2xl font-bold text-red-400">{noPercentage}%</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-400 rotate-180" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Card */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trade Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={tradeType === "buy" ? "default" : "outline"}
                    className={tradeType === "buy" 
                      ? "flex-1 bg-gradient-to-r from-green-500 to-emerald-600 border-0" 
                      : "flex-1 border-slate-700 text-slate-400"
                    }
                    onClick={() => setTradeType("buy")}
                    data-testid="button-buy"
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === "sell" ? "default" : "outline"}
                    className={tradeType === "sell" 
                      ? "flex-1 bg-gradient-to-r from-red-500 to-rose-600 border-0" 
                      : "flex-1 border-slate-700 text-slate-400"
                    }
                    onClick={() => setTradeType("sell")}
                    data-testid="button-sell"
                  >
                    Sell
                  </Button>
                </div>

                {/* Outcome Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Outcome</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={outcome === "yes" ? "default" : "outline"}
                      className={outcome === "yes" 
                        ? "flex-1 bg-green-500/30 text-green-300 border-green-500/50" 
                        : "flex-1 border-slate-700 text-slate-400"
                      }
                      onClick={() => setOutcome("yes")}
                      data-testid="button-outcome-yes"
                    >
                      YES
                    </Button>
                    <Button
                      variant={outcome === "no" ? "default" : "outline"}
                      className={outcome === "no" 
                        ? "flex-1 bg-red-500/30 text-red-300 border-red-500/50" 
                        : "flex-1 border-slate-700 text-slate-400"
                      }
                      onClick={() => setOutcome("no")}
                      data-testid="button-outcome-no"
                    >
                      NO
                    </Button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-slate-300">Amount (STREAM)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-amount"
                  />
                </div>

                {/* Quote Display */}
                {amount && parseFloat(amount) > 0 && quote && (
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">You'll receive</span>
                      <span className="text-white font-medium">{quote.tokensOut.toFixed(2)} shares</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Price impact</span>
                      <span className="text-white">{quote.priceImpact.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Fee</span>
                      <span className="text-white">{quote.fee} STREAM</span>
                    </div>
                  </div>
                )}

                {/* Advanced Options */}
                <Button
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  data-testid="button-advanced-options"
                >
                  Advanced Options
                  {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Slippage Tolerance</span>
                      <span className="text-white">1%</span>
                    </div>
                  </div>
                )}

                {/* Trade Button */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50"
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0}
                  data-testid="button-place-trade"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Place Trade
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Connect your wallet to start trading
                </p>
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Top Predictors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-4">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No leaderboard data yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
