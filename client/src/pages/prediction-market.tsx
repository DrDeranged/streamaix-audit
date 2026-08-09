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
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AiAgentPredictions } from "@/components/prediction/AiAgentPredictions";
import { AgentAnalysis } from "@/components/prediction/AgentAnalysis";
import { HowThisResolved } from "@/components/prediction/HowThisResolved";
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
          <Surface variant="raised" key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-accent-core/20 rounded-xl w-3/4 mb-2"></div>
            <div className="h-3 bg-accent-core/20 rounded-xl w-1/2"></div>
          </Surface>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <Surface className="p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 text-accent-bright opacity-50" />
          <p className="text-secondary">No AI trades yet on this market.</p>
          <p className="text-muted text-sm mt-1">Trading bots cycle every 15-30 minutes</p>
      </Surface>
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
            <Surface variant="raised" className="p-4 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-core/10 border border-ink-edge flex items-center justify-center">
                      <Bot className="w-4 h-4 text-accent-bright" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary text-sm">{agent?.name || "AI Agent"}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-ink-edge text-accent-bright">
                          {agent?.personality || "unknown"}
                        </Badge>
                      </div>
                      <div className="text-xs text-secondary">
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${isYes ? 'bg-gain/20 text-gain border-ink-edge' : 'bg-loss/20 text-loss border-ink-edge'} border font-bold`}>
                      {t.outcome}
                    </Badge>
                    <div className="text-xs text-secondary mt-1">
                      {Math.floor(t.shares).toLocaleString()} shares
                    </div>
                  </div>
                </div>

                {t.reasoning && (
                  <div className="bg-ink-raised rounded-xl p-3 mb-3 border border-ink-edge">
                    <div className="flex items-start gap-2">
                      <Zap className="w-3 h-3 text-accent-bright mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-body leading-relaxed">{t.reasoning}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-secondary">Amount: </span>
                      <span className="text-accent-bright font-semibold">{Math.floor(t.streamAmount).toLocaleString()} STREAM</span>
                    </div>
                    <div>
                      <span className="text-secondary">Price: </span>
                      <span className="text-primary">{(t.price / 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {t.probability && (
                    <div className="flex items-center gap-1">
                      <ConfidenceRing confidence={t.probability} size={20} strokeWidth={2} showPercentage={false} />
                      <span className="text-secondary">{t.probability.toFixed(0)}% confidence</span>
                    </div>
                  )}
                </div>
            </Surface>
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
      <Surface className="p-4">
        <SectionTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-accent-bright" />
            Knowledge Avatar Positions
        </SectionTitle>
        <div className="pt-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-ink-raised rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Surface>
    );
  }

  if (positions.length === 0) {
    return (
      <Surface className="p-4">
        <SectionTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-accent-bright" />
            Knowledge Avatar Positions
        </SectionTitle>
        <div className="pt-4">
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-accent-bright opacity-50" />
            <p className="text-secondary">No avatars have traded this market yet</p>
            <p className="text-muted text-sm mt-1">Avatar trading cycles run periodically</p>
          </div>
        </div>
      </Surface>
    );
  }

  const yesPositions = positions.filter(p => p.outcome === 'YES');
  const noPositions = positions.filter(p => p.outcome === 'NO');

  return (
    <Surface className="p-4">
      <SectionTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-accent-bright" />
          Knowledge Avatar Positions
          <Badge variant="outline" className="ml-auto border-ink-edge text-accent-bright">
            {positions.length} avatars trading
          </Badge>
      </SectionTitle>
      <div className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YES Positions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gain" />
              <span className="text-gain font-semibold text-sm">YES Positions</span>
              <Badge variant="outline" className="border-ink-edge text-gain text-xs">
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-gain/10 border border-gain/20 hover:border-gain/40 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gain/10 border border-ink-edge flex items-center justify-center overflow-hidden">
                      {pos.avatar.imageUrl ? (
                        <img src={pos.avatar.imageUrl} alt={pos.avatar.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-gain" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{pos.avatar.name}</div>
                      <div className="text-xs text-secondary">
                        {pos.shares.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gain">
                        {(pos.invested / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted">STREAM</div>
                    </div>
                  </motion.div>
                </Link>
              )) : (
                <div className="text-center py-4 text-muted text-sm">No YES positions</div>
              )}
            </div>
          </div>

          {/* NO Positions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-loss" />
              <span className="text-loss font-semibold text-sm">NO Positions</span>
              <Badge variant="outline" className="border-ink-edge text-loss text-xs">
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-loss/10 border border-loss/20 hover:border-loss/40 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-loss/10 border border-ink-edge flex items-center justify-center overflow-hidden">
                      {pos.avatar.imageUrl ? (
                        <img src={pos.avatar.imageUrl} alt={pos.avatar.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-loss" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{pos.avatar.name}</div>
                      <div className="text-xs text-secondary">
                        {pos.shares.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-loss">
                        {(pos.invested / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted">STREAM</div>
                    </div>
                  </motion.div>
                </Link>
              )) : (
                <div className="text-center py-4 text-muted text-sm">No NO positions</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Surface>
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
          className="absolute inset-y-0 left-0 bg-gain/20 transition-all duration-1000"
          style={{ width: `${yesPercent}%` }}
        />
        <div 
          className="absolute inset-y-0 right-0 bg-loss/20 transition-all duration-1000"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-secondary uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Volume Flow
          </span>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              flowDirection === 'yes' 
                ? 'border-gain/50 text-gain' 
                : flowDirection === 'no' 
                  ? 'border-loss/50 text-loss' 
                  : 'border-ink-edge/50 text-body'
            }`}
          >
            {flowDirection === 'yes' ? '↑ YES Leading' : flowDirection === 'no' ? '↓ NO Leading' : '⟷ Balanced'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gain font-semibold text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                YES
              </span>
              <span className="text-gain font-bold">{yesPercent.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-secondary">{Math.floor(yesVolume).toLocaleString()} STREAM</div>
          </div>
          
          <div className="w-px h-10 bg-ink-edge" />
          
          <div className="flex-1 text-right">
            <div className="flex items-center justify-between mb-1">
              <span className="text-loss font-bold">{noPercent.toFixed(1)}%</span>
              <span className="text-loss font-semibold text-sm flex items-center gap-1">
                NO
                <TrendingDown className="w-3 h-3" />
              </span>
            </div>
            <div className="text-xs text-secondary">{Math.floor(noVolume).toLocaleString()} STREAM</div>
          </div>
        </div>
        
        <div className="mt-3 h-2 bg-ink-raised rounded-full overflow-hidden flex">
          <motion.div 
            className="h-full bg-gain"
            initial={{ width: 0 }}
            animate={{ width: `${yesPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div 
            className="h-full bg-loss"
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
          <div key={i} className="h-12 bg-ink-raised rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-6 text-secondary">
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
          className={`flex items-center justify-between p-2 rounded-xl ${
            trade.outcome === 'YES' 
              ? 'bg-gain/10 border border-gain/20' 
              : 'bg-loss/10 border border-loss/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              trade.outcome === 'YES' ? 'bg-gain' : 'bg-loss'
            } animate-pulse`} />
            <Badge 
              variant="outline" 
              className={`text-xs ${
                trade.tradeType === 'buy' 
                  ? 'border-ink-edge text-accent-bright' 
                  : 'border-warn/30 text-warn'
              }`}
            >
              {trade.tradeType.toUpperCase()}
            </Badge>
            <Badge 
              className={`text-xs ${
                trade.outcome === 'YES' 
                  ? 'bg-gain/20 text-gain' 
                  : 'bg-loss/20 text-loss'
              }`}
            >
              {trade.outcome}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary">
              {Math.floor(trade.streamAmount).toLocaleString()} <span className="text-accent-bright text-xs">STREAM</span>
            </span>
            <span className="text-xs text-muted">
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
      <div className="min-h-screen bg-ink-page py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6 bg-ink-raised" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full bg-ink-raised" />
              <Skeleton className="h-96 w-full bg-ink-raised" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full bg-ink-raised" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <Surface className="p-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Market Not Found</h2>
          <p className="text-secondary mb-4">The market you're looking for doesn't exist.</p>
          <Link href="/markets">
            <Button variant="outline" className="border-ink-edge text-accent-bright">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Markets
            </Button>
          </Link>
        </Surface>
      </div>
    );
  }

  const yesPercentage = ((market.yesPrice ?? 5000) > 10000 ? 50 : (market.yesPrice ?? 5000) / 100).toFixed(1);
  const noPercentage = ((market.noPrice ?? 5000) > 10000 ? 50 : (market.noPrice ?? 5000) / 100).toFixed(1);
  const timeLeft = new Date(market.deadline).getTime() - Date.now();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-accent-core/20 text-accent-bright border-ink-edge",
      defi: "bg-accent-core/20 text-accent-bright border-accent-core/30",
      real_world: "bg-accent-core/20 text-accent-bright border-ink-edge",
      community: "bg-accent-core/20 text-accent-bright border-ink-edge",
      tech_stock: "bg-accent-core/20 text-accent-bright border-ink-edge",
      macro: "bg-gain/20 text-gain border-ink-edge",
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
    <div className="min-h-screen bg-ink-page py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/markets">
          <Button 
            variant="ghost" 
            className="mb-6 text-accent-bright hover:text-primary hover:bg-ink-raised"
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
            <Surface className={`grad-surface ${marketTemp.className} overflow-hidden relative group`}>
              {market.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={market.imageUrl} 
                    alt={market.question}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-ink-page/70" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${getCategoryColor(market.category)} border`}>
                    {market.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-ink-edge text-accent-bright">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysLeft}d {hoursLeft}h left
                  </Badge>
                </div>

                <h1 className="font-display text-3xl font-bold text-primary mb-4">{market.question}</h1>
                
                {market.description && (
                  <p className="text-secondary mb-4">{market.description}</p>
                )}

                {market.tags && market.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {market.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-ink-raised text-accent-bright text-sm rounded-full border border-ink-edge">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ink-divider">
                  <div className="relative p-3 rounded-xl neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-secondary mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Total Volume
                      </div>
                      <AnimatedCounter 
                        value={Math.floor(market.totalVolume / 1000)} 
                        formatValue={(v) => `${v}K`}
                        className="text-lg font-bold text-primary"
                        trend="up"
                        trendValue="+8.5%"
                      />
                    </div>
                  </div>
                  <div className="relative p-3 rounded-xl neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-secondary mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Total Trades
                      </div>
                      <AnimatedCounter 
                        value={market.totalTrades} 
                        className="text-lg font-bold text-primary"
                        trend="up"
                        trendValue="+12%"
                      />
                    </div>
                  </div>
                  <div className="relative p-3 rounded-xl neural-glass group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 glow-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-xs text-secondary mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Liquidity
                      </div>
                      <AnimatedCounter 
                        value={Math.floor((market.yesLiquidity + market.noLiquidity) / 1000)} 
                        formatValue={(v) => `${v}K`}
                        className="text-lg font-bold text-primary"
                        trend="neutral"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Surface>
            </motion.div>

            {market.status === "resolved" && <HowThisResolved marketId={market.id} />}

            {/* Market Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-ink-raised border-b border-ink-edge">
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
                <Surface className="p-4">
                  <div className="pb-2">
                    <SectionTitle className="flex items-center gap-2 text-lg">
                      <Activity className="w-5 h-5 text-accent-bright" />
                      Live Trade Activity
                    </SectionTitle>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-ink-raised border border-ink-divider">
                        <div className="text-xs text-secondary mb-1">24h Volume</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">
                            {volumeStats ? Math.floor(volumeStats.volume24h).toLocaleString() : '0'}
                          </span>
                          <span className="text-xs text-accent-bright">STREAM</span>
                          {volumeStats && volumeStats.volumeChange24h !== 0 && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                volumeStats.volumeChange24h > 0 
                                  ? 'border-ink-edge text-gain' 
                                  : 'border-ink-edge text-loss'
                              }`}
                            >
                              {volumeStats.volumeChange24h > 0 ? '+' : ''}{volumeStats.volumeChange24h.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-ink-raised border border-ink-divider">
                        <div className="text-xs text-secondary mb-1">Recent Trades</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">
                            {volumeStats?.recentTrades?.length || 0}
                          </span>
                          <span className="text-xs text-muted">in feed</span>
                        </div>
                      </div>
                    </div>
                    <LiveTradeFeed marketId={market.id} />
                  </div>
                </Surface>

                <PriceChart marketId={market.id} hours={24} />
                
                <Surface className="p-4">
                  <div>
                    <SectionTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-accent-bright" />
                      Market Information
                    </SectionTitle>
                  </div>
                  <div className="space-y-4">
                    {market.sourceSummary && (
                      <div className="mb-4 p-4 bg-ink-raised border border-accent-core/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-accent-bright mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-accent-bright font-medium mb-1">AI-Generated from Content</div>
                            <Link href={`/summary/${market.sourceContentId}`}>
                              <div className="flex items-center gap-2 text-sm text-body hover:text-accent-bright transition-colors group">
                                <span className="line-clamp-1">{market.sourceSummary.title}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-ink-divider">
                      <span className="text-secondary">Resolution Source</span>
                      <span className="text-primary font-medium capitalize">{market.resolutionSource}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-ink-divider">
                      <span className="text-secondary">Creator</span>
                      <span className="text-primary font-mono text-sm">{market.creatorWallet ? `${market.creatorWallet.slice(0, 6)}...${market.creatorWallet.slice(-4)}` : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-ink-divider">
                      <span className="text-secondary">Status</span>
                      <Badge className="bg-accent-core/20 text-accent-bright border-ink-edge border">
                        {market.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-secondary">Deadline</span>
                      <span className="text-primary">{new Date(market.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Surface>
              </TabsContent>

              <TabsContent value="ai-predictions" className="mt-6 space-y-6">
                <AgentAnalysis marketId={market.id} />
                <AiAgentPredictions marketId={market.id} />
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <MarketTradesTab marketId={market.id} />
              </TabsContent>

              <TabsContent value="positions" className="mt-6 space-y-6">
                {/* Your Position */}
                <Surface className="p-4">
                  <div>
                    <SectionTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-accent-bright" />
                      Your Position
                    </SectionTitle>
                  </div>
                  <div>
                    {userPosition ? (
                      <div className="space-y-4">
                        {/* Position Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          {(userPosition.yesShares || 0) > 0 && (
                            <div className="p-4 rounded-xl bg-ink-raised border border-ink-edge">
                              <div className="text-xs text-gain font-medium mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                YES Shares
                              </div>
                              <div className="text-2xl font-bold text-gain">
                                {userPosition.yesShares.toFixed(2)}
                              </div>
                              <div className="text-xs text-secondary mt-1">
                                Value: {Math.round(userPosition.currentYesValue || 0).toLocaleString()} STREAM
                              </div>
                            </div>
                          )}
                          {(userPosition.noShares || 0) > 0 && (
                            <div className="p-4 rounded-xl bg-ink-raised border border-ink-edge">
                              <div className="text-xs text-loss font-medium mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                NO Shares
                              </div>
                              <div className="text-2xl font-bold text-loss">
                                {userPosition.noShares.toFixed(2)}
                              </div>
                              <div className="text-xs text-secondary mt-1">
                                Value: {Math.round(userPosition.currentNoValue || 0).toLocaleString()} STREAM
                              </div>
                            </div>
                          )}
                        </div>

                        {/* P&L Summary */}
                        <div className="p-4 bg-ink-raised rounded-xl border border-ink-divider">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-secondary">Total Value</span>
                            <span className="text-primary font-bold">{Math.round(userPosition.totalValue || 0).toLocaleString()} STREAM</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-secondary">Cost Basis</span>
                            <span className="text-primary">{Math.round(userPosition.totalCost || 0).toLocaleString()} STREAM</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-ink-divider">
                            <span className="text-secondary">Unrealized P&L</span>
                            <span className={`font-bold ${(userPosition.unrealizedPnL || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                              {(userPosition.unrealizedPnL || 0) >= 0 ? '+' : ''}{Math.round(userPosition.unrealizedPnL || 0).toLocaleString()} STREAM
                              <span className="text-xs ml-1">
                                ({(userPosition.percentChange || 0) >= 0 ? '+' : ''}{userPosition.percentChange?.toFixed(1) || '0'}%)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="w-12 h-12 mx-auto mb-3 text-accent-bright opacity-50" />
                        <p className="text-secondary">No position in this market yet</p>
                        <p className="text-muted text-sm mt-1">Buy YES or NO shares to get started</p>
                      </div>
                    )}
                  </div>
                </Surface>

                {/* Trade History */}
                <Surface className="p-4">
                  <div>
                    <SectionTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent-bright" />
                      Your Trade History
                    </SectionTitle>
                  </div>
                  <div>
                    {userTrades.length > 0 ? (
                      <div className="space-y-3">
                        {userTrades.map((trade) => {
                          const isYes = trade.outcome === "YES";
                          const isBuy = trade.tradeType === "buy";
                          return (
                            <div 
                              key={trade.id}
                              className="p-3 bg-ink-raised rounded-xl border border-ink-divider"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${isBuy ? 'bg-accent-core/20 text-accent-bright border-ink-edge' : 'bg-warn/20 text-warn border-ink-edge'} border`}>
                                    {isBuy ? 'BUY' : 'SELL'}
                                  </Badge>
                                  <Badge className={`${isYes ? 'bg-gain/20 text-gain border-ink-edge' : 'bg-loss/20 text-loss border-ink-edge'} border font-bold`}>
                                    {trade.outcome}
                                  </Badge>
                                </div>
                                <span className="text-xs text-secondary">
                                  {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-secondary">
                                  {trade.shares.toFixed(2)} shares @ {(trade.price / 100).toFixed(1)}%
                                </span>
                                <span className="text-primary font-medium">
                                  {trade.streamAmount.toLocaleString()} STREAM
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-accent-bright opacity-50" />
                        <p className="text-secondary">No trades yet</p>
                        <p className="text-muted text-sm mt-1">Your trade history will appear here</p>
                      </div>
                    )}
                  </div>
                </Surface>

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
            <Surface className="p-4 relative overflow-hidden">
              <div>
                <SectionTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-accent-bright" />
                  Trade
                </SectionTitle>
              </div>
              <div className="space-y-4">
                {/* Trade Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={tradeType === "buy" ? "default" : "outline"}
                    className={tradeType === "buy" 
                      ? "flex-1 grad-accent border-0" 
                      : "flex-1 border-ink-edge text-accent-bright"
                    }
                    onClick={() => setTradeType("buy")}
                    data-testid="button-buy"
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === "sell" ? "default" : "outline"}
                    className={tradeType === "sell" 
                      ? "flex-1 grad-accent border-0" 
                      : "flex-1 border-ink-edge text-accent-bright"
                    }
                    onClick={() => setTradeType("sell")}
                    data-testid="button-sell"
                  >
                    Sell
                  </Button>
                </div>

                {/* Outcome Selection */}
                <div className="space-y-2">
                  <Label className="text-body">Outcome</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={outcome === "yes" ? "default" : "outline"}
                      className={outcome === "yes" 
                        ? "flex-1 bg-gain/30 text-gain border-gain/50 hover:bg-gain/40" 
                        : "flex-1 border-ink-edge text-accent-bright hover:border-gain/50"
                      }
                      onClick={() => setOutcome("yes")}
                      data-testid="button-outcome-yes"
                    >
                      YES
                    </Button>
                    <Button
                      variant={outcome === "no" ? "default" : "outline"}
                      className={outcome === "no" 
                        ? "flex-1 bg-loss/30 text-loss border-loss/50 hover:bg-loss/40" 
                        : "flex-1 border-ink-edge text-accent-bright hover:border-loss/50"
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
                  <Label htmlFor="amount" className="text-body">Amount (STREAM)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-ink-raised border-ink-edge text-primary"
                    data-testid="input-amount"
                  />
                </div>

                {/* Quote Display */}
                {amount && parseFloat(amount) > 0 && quote && (
                  <div className="bg-ink-raised rounded-xl p-3 space-y-2 border border-ink-divider">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">You'll receive</span>
                      <span className="text-primary font-medium">{quote.tokensOut.toFixed(2)} shares</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Price impact</span>
                      <span className="text-primary">{quote.priceImpact.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Fee</span>
                      <span className="text-primary">{quote.fee} STREAM</span>
                    </div>
                  </div>
                )}

                {/* Advanced Options */}
                <Button
                  variant="ghost"
                  className="w-full text-accent-bright hover:text-primary hover:bg-ink-raised"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  data-testid="button-advanced-options"
                >
                  Advanced Options
                  {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-2 pt-2 border-t border-ink-divider">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Slippage Tolerance</span>
                      <span className="text-primary">1%</span>
                    </div>
                  </div>
                )}

                {/* User Balance Display */}
                <div className="flex justify-between items-center text-sm py-2 px-3 bg-ink-raised rounded-xl border border-ink-divider">
                  <span className="text-secondary">Your Balance</span>
                  <span className="text-primary font-medium">{userBalance.toLocaleString()} STREAM</span>
                </div>

                {/* Trade Button */}
                <Button
                  className="w-full grad-accent text-primary border-0 hover:shadow-lg hover:shadow-accent-core/50"
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
                  <div className="text-xs text-secondary text-center space-y-1 pt-2 border-t border-ink-divider">
                    <p>Your position:</p>
                    <div className="flex justify-center gap-3">
                      {(userPosition.yesShares || 0) > 0 && (
                        <span className="text-gain">{userPosition.yesShares.toFixed(1)} YES</span>
                      )}
                      {(userPosition.noShares || 0) > 0 && (
                        <span className="text-loss">{userPosition.noShares.toFixed(1)} NO</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Surface>
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
            <Surface className="p-4">
              <div>
                <SectionTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-bright" />
                  Top Predictors
                </SectionTitle>
              </div>
              <div>
                <div className="text-center text-secondary py-4">
                  <Users className="w-12 h-12 mx-auto mb-2 text-accent-deep" />
                  <p className="text-sm">No leaderboard data yet</p>
                </div>
              </div>
            </Surface>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
