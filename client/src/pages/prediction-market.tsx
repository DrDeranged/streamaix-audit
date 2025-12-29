import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Award,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Sparkles,
  Activity,
  Bot,
  Zap,
  Wallet,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AiAgentPredictions } from "@/components/prediction/AiAgentPredictions";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
import { PriceChart } from "@/components/market/PriceChart";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AITrade {
  id: string;
  agentId: string;
  agentName: string;
  agentPersonality: string;
  outcome: "YES" | "NO";
  tradeType: string;
  streamAmount: number;
  shares: number;
  price: number;
  fee: number;
  reasoning: string;
  probability: number | null;
  createdAt: string;
}

function MarketTradesTab({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; trades: Array<{ ai_trades: AITrade; ai_agents: any }> }>({
    queryKey: [`/api/ai-agents/trades/${marketId}`],
    refetchInterval: 60000, // Reduced from 10s to 60s for performance
    staleTime: 30000,
  });

  const trades = data?.trades || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 p-4 animate-pulse">
            <div className="h-4 bg-purple-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-purple-500/20 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
        <CardContent className="p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
          <p className="text-slate-400">No AI trades yet on this market.</p>
          <p className="text-slate-500 text-sm mt-1">Trading bots cycle every 15-30 minutes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => {
        const t = trade.ai_trades;
        const agent = trade.ai_agents;
        const isYes = t.outcome === "YES";
        
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{agent?.name || "AI Agent"}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-purple-500/30 text-purple-300">
                          {agent?.personality || "unknown"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${isYes ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'} border font-bold`}>
                      {t.outcome}
                    </Badge>
                    <div className="text-xs text-slate-400 mt-1">
                      {Math.floor(t.shares).toLocaleString()} shares
                    </div>
                  </div>
                </div>

                {t.reasoning && (
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-3 border border-slate-700/50">
                    <div className="flex items-start gap-2">
                      <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">{t.reasoning}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400">Amount: </span>
                      <span className="text-purple-300 font-semibold">{Math.floor(t.streamAmount).toLocaleString()} STREAM</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Price: </span>
                      <span className="text-white">{(t.price / 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {t.probability && (
                    <div className="flex items-center gap-1">
                      <ConfidenceRing confidence={t.probability} size={20} strokeWidth={2} showPercentage={false} />
                      <span className="text-slate-400">{t.probability.toFixed(0)}% confidence</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

interface AvatarPosition {
  avatar: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  outcome: string;
  shares: number;
  invested: number;
}

function AvatarPositionsSection({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; positions: AvatarPosition[] }>({
    queryKey: ["/api/markets", marketId, "avatar-positions"],
    refetchInterval: 30000,
  });

  const positions = data?.positions || [];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-cyan-400" />
            Knowledge Avatar Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-cyan-900/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-cyan-400" />
            Knowledge Avatar Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-cyan-400 opacity-50" />
            <p className="text-slate-400">No avatars have traded this market yet</p>
            <p className="text-slate-500 text-sm mt-1">Avatar trading cycles run periodically</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const yesPositions = positions.filter(p => p.outcome === 'YES');
  const noPositions = positions.filter(p => p.outcome === 'NO');

  return (
    <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-cyan-400" />
          Knowledge Avatar Positions
          <Badge variant="outline" className="ml-auto border-cyan-500/30 text-cyan-300">
            {positions.length} avatars trading
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YES Positions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-semibold text-sm">YES Positions</span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-xs">
                {yesPositions.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {yesPositions.length > 0 ? yesPositions.map((pos) => (
                <Link key={pos.avatar.id} href={`/avatars/${pos.avatar.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/40 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
                      {pos.avatar.imageUrl ? (
                        <img src={pos.avatar.imageUrl} alt={pos.avatar.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-emerald-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{pos.avatar.name}</div>
                      <div className="text-xs text-slate-400">
                        {pos.shares.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {(pos.invested / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-slate-500">STREAM</div>
                    </div>
                  </motion.div>
                </Link>
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">No YES positions</div>
              )}
            </div>
          </div>

          {/* NO Positions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 font-semibold text-sm">NO Positions</span>
              <Badge variant="outline" className="border-rose-500/30 text-rose-300 text-xs">
                {noPositions.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {noPositions.length > 0 ? noPositions.map((pos) => (
                <Link key={pos.avatar.id} href={`/avatars/${pos.avatar.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-400/40 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/20 to-fuchsia-500/20 border border-rose-500/30 flex items-center justify-center overflow-hidden">
                      {pos.avatar.imageUrl ? (
                        <img src={pos.avatar.imageUrl} alt={pos.avatar.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-rose-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{pos.avatar.name}</div>
                      <div className="text-xs text-slate-400">
                        {pos.shares.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400">
                        {(pos.invested / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-slate-500">STREAM</div>
                    </div>
                  </motion.div>
                </Link>
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">No NO positions</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  yesVolume?: number;
  noVolume?: number;
  volume24h?: number;
  volumeChange24h?: number;
}

function VolumeFlowIndicator({ yesVolume, noVolume, totalVolume }: { yesVolume: number; noVolume: number; totalVolume: number }) {
  const yesPercent = totalVolume > 0 ? (yesVolume / totalVolume) * 100 : 50;
  const noPercent = totalVolume > 0 ? (noVolume / totalVolume) * 100 : 50;
  const flowDirection = yesVolume > noVolume ? 'yes' : noVolume > yesVolume ? 'no' : 'neutral';
  
  return (
    <div className="relative p-4 rounded-xl neural-glass overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-transparent transition-all duration-1000"
          style={{ width: `${yesPercent}%` }}
        />
        <div 
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500 to-transparent transition-all duration-1000"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Volume Flow
          </span>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              flowDirection === 'yes' 
                ? 'border-emerald-500/50 text-emerald-300' 
                : flowDirection === 'no' 
                  ? 'border-rose-500/50 text-rose-300' 
                  : 'border-slate-500/50 text-slate-300'
            }`}
          >
            {flowDirection === 'yes' ? '↑ YES Leading' : flowDirection === 'no' ? '↓ NO Leading' : '⟷ Balanced'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                YES
              </span>
              <span className="text-emerald-300 font-bold">{yesPercent.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-slate-400">{Math.floor(yesVolume).toLocaleString()} STREAM</div>
          </div>
          
          <div className="w-px h-10 bg-slate-600" />
          
          <div className="flex-1 text-right">
            <div className="flex items-center justify-between mb-1">
              <span className="text-rose-300 font-bold">{noPercent.toFixed(1)}%</span>
              <span className="text-rose-400 font-semibold text-sm flex items-center gap-1">
                NO
                <TrendingDown className="w-3 h-3" />
              </span>
            </div>
            <div className="text-xs text-slate-400">{Math.floor(noVolume).toLocaleString()} STREAM</div>
          </div>
        </div>
        
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden flex">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${yesPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div 
            className="h-full bg-gradient-to-l from-rose-500 to-rose-400"
            initial={{ width: 0 }}
            animate={{ width: `${noPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

interface UserPosition {
  id: string;
  yesShares: number;
  noShares: number;
  totalCost: number;
  currentYesValue: number;
  currentNoValue: number;
  totalValue: number;
  unrealizedPnL: number;
  percentChange: number;
}

interface UserTrade {
  id: string;
  outcome: string;
  tradeType: string;
  shares: number;
  price: number;
  streamAmount: number;
  fee: number;
  createdAt: string;
}

interface VolumeStats {
  yesVolume: number;
  noVolume: number;
  totalVolume: number;
  volume24h: number;
  volumeChange24h: number;
  recentTrades: Array<{
    id: string;
    outcome: string;
    tradeType: string;
    streamAmount: number;
    createdAt: string;
    userId?: string;
    username?: string;
  }>;
}

function LiveTradeFeed({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; stats: VolumeStats }>({
    queryKey: ["/api/prediction-markets", marketId, "volume-stats"],
    refetchInterval: 30000, // Reduced from 5s to 30s for performance
    staleTime: 15000,
  });

  const stats = data?.stats;
  const trades = stats?.recentTrades || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-purple-900/20 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No trades yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {trades.slice(0, 10).map((trade, index) => (
        <motion.div
          key={trade.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center justify-between p-2 rounded-lg ${
            trade.outcome === 'YES' 
              ? 'bg-emerald-500/10 border border-emerald-500/20' 
              : 'bg-rose-500/10 border border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              trade.outcome === 'YES' ? 'bg-emerald-400' : 'bg-rose-400'
            } animate-pulse`} />
            <Badge 
              variant="outline" 
              className={`text-xs ${
                trade.tradeType === 'buy' 
                  ? 'border-cyan-500/30 text-cyan-300' 
                  : 'border-orange-500/30 text-orange-300'
              }`}
            >
              {trade.tradeType.toUpperCase()}
            </Badge>
            <Badge 
              className={`text-xs ${
                trade.outcome === 'YES' 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {trade.outcome}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {Math.floor(trade.streamAmount).toLocaleString()} <span className="text-purple-400 text-xs">STREAM</span>
            </span>
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
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

  const { data: quoteData } = useQuery<{ success: boolean; quote: any }>({
    queryKey: ["/api/prediction-markets", id, "quote-buy", amount, outcome],
    enabled: amount !== "" && parseFloat(amount) > 0 && tradeType === "buy",
  });

  const { data: positionData, refetch: refetchPosition } = useQuery<{ 
    success: boolean; 
    position: UserPosition | null; 
    hasPosition: boolean;
  }>({
    queryKey: ["/api/prediction-markets", id, "position"],
  });

  const { data: myTradesData, refetch: refetchTrades } = useQuery<{
    success: boolean;
    trades: UserTrade[];
    count: number;
  }>({
    queryKey: ["/api/prediction-markets", id, "trades", "me"],
  });

  const { data: userBalanceData } = useQuery<{ user: { streamPoints: number } }>({
    queryKey: ["/api/user"],
  });

  const { data: volumeStatsData } = useQuery<{ success: boolean; stats: VolumeStats }>({
    queryKey: ["/api/prediction-markets", id, "volume-stats"],
    refetchInterval: 30000, // Reduced from 5s to 30s for performance
    staleTime: 15000,
  });

  const volumeStats = volumeStatsData?.stats;

  const tradeMutation = useMutation({
    mutationFn: async (tradeParams: { amount: number; outcome: string; tradeType: string }) => {
      return await apiRequest(`/api/prediction-markets/${id}/trade`, {
        method: "POST",
        body: JSON.stringify(tradeParams),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Executed!",
        description: `You ${tradeType === 'buy' ? 'bought' : 'sold'} ${data.quote?.sharesReceived?.toFixed(2) || '0'} ${outcome.toUpperCase()} shares`,
      });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/prediction-markets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/prediction-markets", id, "position"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prediction-markets", id, "trades", "me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prediction-markets", id, "volume-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Could not execute trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const market = data?.market;
  const quote = quoteData?.quote;
  const userPosition = positionData?.position;
  const userTrades = myTradesData?.trades || [];
  const userBalance = userBalanceData?.user?.streamPoints || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6 bg-purple-900/20" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full bg-purple-900/20" />
              <Skeleton className="h-96 w-full bg-purple-900/20" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full bg-purple-900/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Market Not Found</h2>
          <p className="text-slate-400 mb-4">The market you're looking for doesn't exist.</p>
          <Link href="/markets">
            <Button variant="outline" className="border-purple-500/30 text-purple-300">
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
      defi: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
      real_world: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      community: "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
      tech_stock: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      macro: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    return colors[category] || colors.community;
  };

  // Market temperature classification for gradient borders
  const getMarketTemperature = (volume: number): { label: string; className: string } => {
    if (volume >= 100000) {
      return { label: "Hot", className: "gradient-border-hot" };
    } else if (volume >= 50000) {
      return { label: "Warm", className: "gradient-border-warm" };
    } else {
      return { label: "Cool", className: "gradient-border-cool" };
    }
  };

  const marketTemp = getMarketTemperature(market.totalVolume);

  const handleTrade = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);

    // Check balance for buys
    if (tradeType === "buy" && amountNum > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You have ${userBalance.toLocaleString()} STREAM available`,
        variant: "destructive"
      });
      return;
    }

    // Check shares for sells
    if (tradeType === "sell") {
      const sharesHeld = outcome === "yes" 
        ? (userPosition?.yesShares || 0) 
        : (userPosition?.noShares || 0);
      if (amountNum > sharesHeld) {
        toast({
          title: "Insufficient Shares",
          description: `You have ${sharesHeld.toFixed(2)} ${outcome.toUpperCase()} shares available`,
          variant: "destructive"
        });
        return;
      }
    }

    tradeMutation.mutate({
      amount: amountNum,
      outcome,
      tradeType
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/markets">
          <Button 
            variant="ghost" 
            className="mb-6 text-purple-300 hover:text-white hover:bg-purple-900/30"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
            <Card className={`neural-glass iridescent-border ${marketTemp.className} overflow-hidden backdrop-blur-sm relative group`}>
              {market.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={market.imageUrl} 
                    alt={market.question}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${getCategoryColor(market.category)} border`}>
                    {market.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysLeft}d {hoursLeft}h left
                  </Badge>
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">{market.question}</h1>
                
                {market.description && (
                  <p className="text-slate-400 mb-4">{market.description}</p>
                )}

                {market.tags && market.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {market.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-800/30 text-purple-300 text-sm rounded-full border border-purple-500/30">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/30">
                  <div className="relative p-3 rounded-lg neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Total Volume
                      </div>
                      <AnimatedCounter 
                        value={Math.floor(market.totalVolume / 1000)} 
                        formatValue={(v) => `${v}K`}
                        className="text-lg font-bold text-slate-100"
                        trend="up"
                        trendValue="+8.5%"
                      />
                    </div>
                  </div>
                  <div className="relative p-3 rounded-lg neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Total Trades
                      </div>
                      <AnimatedCounter 
                        value={market.totalTrades} 
                        className="text-lg font-bold text-slate-100"
                        trend="up"
                        trendValue="+12%"
                      />
                    </div>
                  </div>
                  <div className="relative p-3 rounded-lg neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Liquidity
                      </div>
                      <AnimatedCounter 
                        value={Math.floor((market.yesLiquidity + market.noLiquidity) / 1000)} 
                        formatValue={(v) => `${v}K`}
                        className="text-lg font-bold text-slate-100"
                        trend="neutral"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Market Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-purple-900/20 border-b border-purple-500/30">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="ai-predictions" data-testid="tab-ai-predictions">AI Predictions</TabsTrigger>
                <TabsTrigger value="trades" data-testid="tab-trades">Recent Trades</TabsTrigger>
                <TabsTrigger value="positions" data-testid="tab-positions">Top Positions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Real-time Volume Flow */}
                {volumeStats && (
                  <VolumeFlowIndicator 
                    yesVolume={volumeStats.yesVolume} 
                    noVolume={volumeStats.noVolume}
                    totalVolume={volumeStats.totalVolume}
                  />
                )}

                {/* 24h Volume Stats Card */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Live Trade Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">24h Volume</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white">
                            {volumeStats ? Math.floor(volumeStats.volume24h).toLocaleString() : '0'}
                          </span>
                          <span className="text-xs text-purple-400">STREAM</span>
                          {volumeStats && volumeStats.volumeChange24h !== 0 && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                volumeStats.volumeChange24h > 0 
                                  ? 'border-emerald-500/30 text-emerald-300' 
                                  : 'border-rose-500/30 text-rose-300'
                              }`}
                            >
                              {volumeStats.volumeChange24h > 0 ? '+' : ''}{volumeStats.volumeChange24h.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">Recent Trades</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white">
                            {volumeStats?.recentTrades?.length || 0}
                          </span>
                          <span className="text-xs text-slate-500">in feed</span>
                        </div>
                      </div>
                    </div>
                    <LiveTradeFeed marketId={market.id} />
                  </CardContent>
                </Card>

                <PriceChart marketId={market.id} hours={24} />
                
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-purple-400" />
                      Market Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {market.sourceSummary && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
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
                    <div className="flex justify-between items-center py-3 border-b border-purple-500/20">
                      <span className="text-slate-400">Resolution Source</span>
                      <span className="text-white font-medium capitalize">{market.resolutionSource}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-purple-500/20">
                      <span className="text-slate-400">Creator</span>
                      <span className="text-white font-mono text-sm">{market.creatorWallet ? `${market.creatorWallet.slice(0, 6)}...${market.creatorWallet.slice(-4)}` : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-purple-500/20">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border">
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

              <TabsContent value="ai-predictions" className="mt-6">
                <AiAgentPredictions marketId={market.id} />
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <MarketTradesTab marketId={market.id} />
              </TabsContent>

              <TabsContent value="positions" className="mt-6 space-y-6">
                {/* Your Position */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-purple-400" />
                      Your Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userPosition ? (
                      <div className="space-y-4">
                        {/* Position Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          {(userPosition.yesShares || 0) > 0 && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30">
                              <div className="text-xs text-emerald-300 font-medium mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                YES Shares
                              </div>
                              <div className="text-2xl font-bold text-emerald-400">
                                {userPosition.yesShares.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Value: {userPosition.currentYesValue?.toFixed(2) || '0'} STREAM
                              </div>
                            </div>
                          )}
                          {(userPosition.noShares || 0) > 0 && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/30">
                              <div className="text-xs text-rose-300 font-medium mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                NO Shares
                              </div>
                              <div className="text-2xl font-bold text-rose-400">
                                {userPosition.noShares.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Value: {userPosition.currentNoValue?.toFixed(2) || '0'} STREAM
                              </div>
                            </div>
                          )}
                        </div>

                        {/* P&L Summary */}
                        <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Total Value</span>
                            <span className="text-white font-bold">{userPosition.totalValue?.toFixed(2) || '0'} STREAM</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Cost Basis</span>
                            <span className="text-white">{userPosition.totalCost?.toFixed(2) || '0'} STREAM</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-purple-500/20">
                            <span className="text-slate-400">Unrealized P&L</span>
                            <span className={`font-bold ${(userPosition.unrealizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {(userPosition.unrealizedPnL || 0) >= 0 ? '+' : ''}{userPosition.unrealizedPnL?.toFixed(2) || '0'} STREAM
                              <span className="text-xs ml-1">
                                ({(userPosition.percentChange || 0) >= 0 ? '+' : ''}{userPosition.percentChange?.toFixed(1) || '0'}%)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
                        <p className="text-slate-400">No position in this market yet</p>
                        <p className="text-slate-500 text-sm mt-1">Buy YES or NO shares to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trade History */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-fuchsia-400" />
                      Your Trade History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userTrades.length > 0 ? (
                      <div className="space-y-3">
                        {userTrades.map((trade) => {
                          const isYes = trade.outcome === "YES";
                          const isBuy = trade.tradeType === "buy";
                          return (
                            <div 
                              key={trade.id}
                              className="p-3 bg-purple-900/30 rounded-lg border border-purple-500/20"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${isBuy ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'} border`}>
                                    {isBuy ? 'BUY' : 'SELL'}
                                  </Badge>
                                  <Badge className={`${isYes ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'} border font-bold`}>
                                    {trade.outcome}
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">
                                  {trade.shares.toFixed(2)} shares @ {(trade.price / 100).toFixed(1)}%
                                </span>
                                <span className="text-white font-medium">
                                  {trade.streamAmount.toLocaleString()} STREAM
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-fuchsia-400 opacity-50" />
                        <p className="text-slate-400">No trades yet</p>
                        <p className="text-slate-500 text-sm mt-1">Your trade history will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Avatar Positions */}
                <AvatarPositionsSection marketId={market.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            {/* Trading Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
            <Card className="neural-glass iridescent-border backdrop-blur-sm relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  Trade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trade Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={tradeType === "buy" ? "default" : "outline"}
                    className={tradeType === "buy" 
                      ? "flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 border-0" 
                      : "flex-1 border-purple-500/30 text-purple-300"
                    }
                    onClick={() => setTradeType("buy")}
                    data-testid="button-buy"
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === "sell" ? "default" : "outline"}
                    className={tradeType === "sell" 
                      ? "flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 border-0" 
                      : "flex-1 border-purple-500/30 text-purple-300"
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
                        ? "flex-1 bg-emerald-500/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/40" 
                        : "flex-1 border-purple-500/30 text-purple-300 hover:border-emerald-500/50"
                      }
                      onClick={() => setOutcome("yes")}
                      data-testid="button-outcome-yes"
                    >
                      YES
                    </Button>
                    <Button
                      variant={outcome === "no" ? "default" : "outline"}
                      className={outcome === "no" 
                        ? "flex-1 bg-rose-500/30 text-rose-300 border-rose-500/50 hover:bg-rose-500/40" 
                        : "flex-1 border-purple-500/30 text-purple-300 hover:border-rose-500/50"
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
                    className="bg-purple-900/20 border-purple-500/30 text-white"
                    data-testid="input-amount"
                  />
                </div>

                {/* Quote Display */}
                {amount && parseFloat(amount) > 0 && quote && (
                  <div className="bg-purple-900/30 rounded-lg p-3 space-y-2 border border-purple-500/20">
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
                  className="w-full text-purple-300 hover:text-white hover:bg-purple-900/30"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  data-testid="button-advanced-options"
                >
                  Advanced Options
                  {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-2 pt-2 border-t border-purple-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Slippage Tolerance</span>
                      <span className="text-white">1%</span>
                    </div>
                  </div>
                )}

                {/* User Balance Display */}
                <div className="flex justify-between items-center text-sm py-2 px-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <span className="text-slate-400">Your Balance</span>
                  <span className="text-white font-medium">{userBalance.toLocaleString()} STREAM</span>
                </div>

                {/* Trade Button */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50"
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0 || tradeMutation.isPending}
                  data-testid="button-place-trade"
                >
                  {tradeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {tradeType === "buy" ? "Buy" : "Sell"} {outcome.toUpperCase()} Shares
                    </>
                  )}
                </Button>

                {/* Position Quick View */}
                {userPosition && ((userPosition.yesShares || 0) > 0 || (userPosition.noShares || 0) > 0) && (
                  <div className="text-xs text-slate-400 text-center space-y-1 pt-2 border-t border-purple-500/20">
                    <p>Your position:</p>
                    <div className="flex justify-center gap-3">
                      {(userPosition.yesShares || 0) > 0 && (
                        <span className="text-emerald-400">{userPosition.yesShares.toFixed(1)} YES</span>
                      )}
                      {(userPosition.noShares || 0) > 0 && (
                        <span className="text-rose-400">{userPosition.noShares.toFixed(1)} NO</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
            <Card className="neural-glass iridescent-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-fuchsia-400" />
                  Top Predictors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-4">
                  <Users className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm">No leaderboard data yet</p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
