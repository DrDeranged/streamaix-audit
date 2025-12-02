import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Coins, 
  Share2, 
  Heart,
  Send,
  Video,
  TrendingUp,
  Headphones,
  Target,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Sparkles,
  Bot,
  ChevronUp,
  ChevronDown,
  X,
  Monitor,
  UserPlus,
  Zap,
  BarChart3,
  Plus,
  Circle,
  Play,
  Pause,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStreamSocket } from '@/hooks/useStreamSocket';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { AIAvatarStream } from '@/components/streaming/AIAvatarStream';
import { StreamReactions, QuickReactButtons } from '@/components/streaming/StreamReactions';
import { StreamPoll, CreatePollForm } from '@/components/streaming/StreamPoll';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamType: string;
  hostId: string;
  hostUsername?: string;
  hostAvatar?: string;
  status: string;
  currentViewers: number;
  peakViewers?: number;
  totalTipsReceived: number;
  category?: string;
  tags?: string[];
  scheduledStart?: string;
  actualStart?: string;
  roomId?: string;
  isAiHost?: boolean;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
}

interface CoHost {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  isVideoOn: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
}

interface TipAlert {
  id: string;
  username: string;
  amount: number;
  message?: string;
  timestamp: number;
}

const streamTypeConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  broadcast: { icon: Video, label: 'Broadcast', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  trading_room: { icon: TrendingUp, label: 'Trading Room', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  audio_space: { icon: Headphones, label: 'Audio Space', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  live_bounty: { icon: Target, label: 'Live Bounty', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

function TipAlertAnimation({ tip, onComplete }: { tip: TipAlert; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ scale: 0, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, y: -20, opacity: 0 }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="bg-gradient-to-br from-amber-500/90 via-orange-500/90 to-yellow-500/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-amber-400/50 shadow-2xl shadow-amber-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <Coins className="w-8 h-8 text-yellow-200" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-white">@{tip.username}</p>
              <p className="text-sm text-yellow-100">sent a tip!</p>
            </div>
          </div>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-3xl font-bold text-center text-white font-orbitron"
          >
            {tip.amount.toLocaleString()} STREAM
          </motion.p>
          {tip.message && (
            <p className="text-sm text-yellow-100 mt-2 text-center italic">"{tip.message}"</p>
          )}
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -left-2"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-6 h-6 text-amber-300" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function MarketPriceOverlay({ streamId }: { streamId: string }) {
  const { data } = useQuery<{ marketData: MarketData[] }>({
    queryKey: ['/api/streams', streamId, 'market-overlay'],
    enabled: !!streamId,
    refetchInterval: 30000,
  });

  if (!data?.marketData?.length) return null;

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
      {data.marketData.map((coin) => (
        <motion.div
          key={coin.symbol}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700/50 flex items-center gap-2"
        >
          <span className="text-xs font-bold text-white">{coin.symbol}</span>
          <span className="text-xs text-slate-300">${coin.price.toLocaleString()}</span>
          <span className={cn(
            "text-[10px] font-medium",
            coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function CoHostsDisplay({ streamId }: { streamId: string }) {
  const { data } = useQuery<{ coHosts: CoHost[] }>({
    queryKey: ['/api/streams', streamId, 'co-hosts'],
    enabled: !!streamId,
    refetchInterval: 10000,
  });

  if (!data?.coHosts?.length) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 flex gap-2">
      {data.coHosts.map((coHost) => (
        <motion.div
          key={coHost.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center border-2 border-cyan-400/50 overflow-hidden">
            {coHost.avatar ? (
              <img src={coHost.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{coHost.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          {coHost.isScreenSharing && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
              <Monitor className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-slate-900/80 rounded px-1">
            <span className="text-[8px] text-slate-300">{coHost.username}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function StreamViewPage() {
  const [, params] = useRoute('/stream/:id');
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [showTipPanel, setShowTipPanel] = useState(false);
  const [showPredictionPanel, setShowPredictionPanel] = useState(false);
  const [predictionText, setPredictionText] = useState('');
  const [activeTipAlerts, setActiveTipAlerts] = useState<TipAlert[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [activePoll, setActivePoll] = useState<{
    id: string;
    question: string;
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    isActive: boolean;
    createdBy: string;
  } | null>(null);
  const [hasVotedOnPoll, setHasVotedOnPoll] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const streamId = params?.id || null;
  
  const { isConnected, viewerCount, messages, sendMessage } = useStreamSocket(streamId);
  
  const { data: streamData, isLoading } = useQuery<{ stream: LiveStream }>({
    queryKey: ['/api/streams', streamId],
    enabled: !!streamId,
    refetchInterval: 10000,
  });
  
  const stream = streamData?.stream;
  const config = stream ? streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast : streamTypeConfig.broadcast;
  const Icon = config.icon;
  const isHost = user?.id === stream?.hostId;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const tipMessages = messages.filter(m => m.content.includes('💎 Tipped'));
    if (tipMessages.length > 0) {
      const latestTip = tipMessages[tipMessages.length - 1];
      const match = latestTip.content.match(/💎 Tipped (\d+) STREAM(?:: (.+))?/);
      if (match) {
        const newAlert: TipAlert = {
          id: latestTip.id,
          username: latestTip.username,
          amount: parseInt(match[1]),
          message: match[2],
          timestamp: latestTip.timestamp,
        };
        if (!activeTipAlerts.find(a => a.id === newAlert.id)) {
          setActiveTipAlerts(prev => [...prev, newAlert]);
        }
      }
    }
  }, [messages]);

  const removeTipAlert = (id: string) => {
    setActiveTipAlerts(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleCreatePoll = (question: string, options: string[]) => {
    const newPoll = {
      id: `poll-${Date.now()}`,
      question,
      options: options.map((text, i) => ({ id: `opt-${i}`, text, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      createdBy: user?.username || 'host',
    };
    setActivePoll(newPoll);
    setShowPollCreator(false);
    toast({
      title: "Poll Created",
      description: "Viewers can now vote on your poll!",
    });
  };

  const handleVotePoll = (optionId: string) => {
    if (!activePoll || hasVotedOnPoll) return;
    
    setActivePoll(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        totalVotes: prev.totalVotes + 1,
      };
    });
    setHasVotedOnPoll(optionId);
  };

  const handleEndPoll = () => {
    if (activePoll) {
      setActivePoll(prev => prev ? { ...prev, isActive: false } : null);
      toast({
        title: "Poll Ended",
        description: "Results are now final.",
      });
    }
  };

  const handleReaction = useCallback((emoji: string) => {
    if (isConnected) {
      sendMessage(`[reaction:${emoji}]`);
    }
  }, [isConnected, sendMessage]);

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!message.trim() || !isAuthenticated) return;
    
    if (isConnected) {
      sendMessage(message.trim());
      setMessage('');
    } else {
      toast({
        title: "Not connected",
        description: "Reconnecting to stream...",
        variant: "destructive",
      });
    }
  };

  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest(`/api/streams/${streamId}/tip`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Tip sent!",
        description: `You tipped ${tipAmount} STREAM to the streamer`,
      });
      setTipAmount('');
      setShowTipPanel(false);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't send tip",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleTip = (amount?: number) => {
    const tipValue = amount || parseInt(tipAmount);
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    if (isNaN(tipValue) || tipValue < 1) {
      toast({
        title: "Invalid tip amount",
        variant: "destructive",
      });
      return;
    }
    tipMutation.mutate(tipValue);
  };

  const predictionMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest(`/api/streams/${streamId}/predictions/create`, {
        method: 'POST',
        body: JSON.stringify({ predictionText: text, confidence: 70 }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Prediction created!",
        description: "Your prediction has been shared with the stream",
      });
      setPredictionText('');
      setShowPredictionPanel(false);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't create prediction",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreatePrediction = () => {
    if (!predictionText.trim()) {
      toast({
        title: "Please enter a prediction",
        variant: "destructive",
      });
      return;
    }
    predictionMutation.mutate(predictionText.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center safe-area-inset">
        <div className="animate-pulse text-purple-400">Loading stream...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-4 px-4 safe-area-inset">
        <h1 className="text-xl font-semibold text-white">Stream not found</h1>
        <Link href="/">
          <Button variant="outline" className="h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  const displayViewerCount = isConnected ? viewerCount : stream.currentViewers;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset flex flex-col">
      {/* Header - Mobile Optimized */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-9 w-9 p-0 hover:bg-purple-500/20" data-testid="button-home">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/streams">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-9 w-9 sm:w-auto p-0 sm:px-3 hover:bg-purple-500/20" data-testid="button-back-streams">
                  <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-2">Streams</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={cn("p-1 sm:p-1.5 rounded-lg", config.bgColor)}>
                <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", config.color)} />
              </div>
              <Badge variant="outline" className={cn("border-purple-500/30 text-[10px] sm:text-xs hidden sm:flex", config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] sm:text-xs px-1.5 sm:px-2",
                isConnected 
                  ? "border-emerald-500/30 text-emerald-400" 
                  : "border-orange-500/30 text-orange-400"
              )}
            >
              {isConnected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </Badge>
            
            {isLive && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                LIVE
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] sm:text-xs hidden sm:flex">
                <Calendar className="w-3 h-3 mr-1" />
                Scheduled
              </Badge>
            )}
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs">
              <Users className="w-3 h-3 mr-1" />
              {displayViewerCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Stack on mobile, side by side on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Video/Stream Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
          {/* Video Area with Overlays */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 aspect-video">
            {/* Live Market Price Overlay */}
            {isLive && streamId && <MarketPriceOverlay streamId={streamId} />}
            
            {/* Co-hosts Display */}
            {isLive && streamId && <CoHostsDisplay streamId={streamId} />}
            
            {/* Animated Tip Alerts */}
            <AnimatePresence>
              {activeTipAlerts.map((tip) => (
                <TipAlertAnimation
                  key={tip.id}
                  tip={tip}
                  onComplete={() => removeTipAlert(tip.id)}
                />
              ))}
            </AnimatePresence>
            
            {/* AI Avatar Stream or Regular Stream Display */}
            {isLive && stream.isAiHost ? (
              <AIAvatarStream
                hostName={stream.hostUsername || 'AI Host'}
                hostAvatar={stream.hostAvatar}
                streamType={stream.streamType}
                isLive={isLive}
                currentMessage={messages.length > 0 ? messages[messages.length - 1]?.content : undefined}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10">
                {isLive ? (
                  <div className="text-center px-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 sm:p-6 rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 border border-purple-400/30 mb-3 sm:mb-4 inline-block"
                    >
                      <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400" />
                    </motion.div>
                    <p className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2 font-orbitron">Stream is Live</p>
                    <p className="text-xs sm:text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      Audio/Video active
                    </p>
                  </div>
                ) : isScheduled ? (
                <div className="text-center px-4">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mb-3 sm:mb-4 mx-auto" />
                  <p className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2">Stream Scheduled</p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {stream.scheduledStart 
                      ? new Date(stream.scheduledStart).toLocaleString()
                      : 'Time TBD'}
                  </p>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Video className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 mb-3 sm:mb-4 mx-auto" />
                  <p className="text-base sm:text-lg font-medium text-slate-400">Stream Ended</p>
                </div>
              )}
              </div>
            )}
            
            {/* In-Stream Prediction Button */}
            {isLive && isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 right-3 z-10"
              >
                <Button
                  onClick={() => setShowPredictionPanel(true)}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 h-9 text-xs shadow-lg shadow-purple-500/20"
                  data-testid="button-create-prediction"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Make Prediction
                </Button>
              </motion.div>
            )}
          </Card>

          {/* Stream Info */}
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
            <h1 className="text-lg sm:text-xl font-bold text-white mb-2 font-orbitron line-clamp-2">{stream.title}</h1>
            
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0">
                  {stream.hostAvatar ? (
                    <img src={stream.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    stream.hostUsername?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">@{stream.hostUsername || 'anonymous'}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">Host</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9 sm:h-8 text-xs"
                  data-testid="button-follow"
                >
                  <Heart className="w-3.5 h-3.5 mr-1" />
                  Follow
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9 w-9 sm:h-8 sm:w-8 p-0"
                  data-testid="button-share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            {stream.description && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 sm:line-clamp-none">{stream.description}</p>
            )}
            
            {stream.tags && stream.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                {stream.tags.slice(0, 5).map((tag, i) => (
                  <Badge key={i} variant="outline" className="border-purple-500/20 text-purple-400 text-[10px] sm:text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Viewer Engagement: Reactions & Polls */}
          {isLive && (
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  Engage
                </h3>
                
                {/* Host Controls */}
                {isAuthenticated && stream.hostId === user?.id && (
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRecording(false)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                        data-testid="button-stop-recording"
                      >
                        <Circle className="w-3 h-3 mr-1 fill-red-500 text-red-500 animate-pulse" />
                        {formatRecordingTime(recordingDuration)}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setIsRecording(true); setRecordingDuration(0); }}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                        data-testid="button-start-recording"
                      >
                        <Circle className="w-3 h-3 mr-1" />
                        Record
                      </Button>
                    )}
                    
                    {!activePoll && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPollCreator(true)}
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-8 text-xs"
                        data-testid="button-create-poll"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Poll
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Reactions */}
              <div className="flex items-center justify-between">
                <QuickReactButtons onReact={handleReaction} />
                <StreamReactions streamId={streamId || ''} onReact={handleReaction} />
              </div>
              
              {/* Active Poll */}
              <AnimatePresence>
                {activePoll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <StreamPoll
                      poll={activePoll}
                      hasVoted={hasVotedOnPoll || undefined}
                      onVote={handleVotePoll}
                      isHost={stream.hostId === user?.id}
                      onEndPoll={handleEndPoll}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Poll Creator */}
              <AnimatePresence>
                {showPollCreator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <CreatePollForm
                      onCreate={handleCreatePoll}
                      onCancel={() => setShowPollCreator(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Mobile: Quick Tip Buttons */}
          <div className="lg:hidden">
            <Card className="p-3 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Send Tip
                </h3>
                <div className="flex gap-1.5">
                  {[10, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTip(amount)}
                      disabled={!isAuthenticated || tipMutation.isPending}
                      className="border-amber-500/30 text-amber-400 text-xs h-8 px-3 hover:bg-amber-500/10"
                      data-testid={`quick-tip-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTipPanel(true)}
                    className="border-purple-500/30 text-purple-400 text-xs h-8 hover:bg-purple-500/10"
                    data-testid="custom-tip-button"
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Chat Sidebar - Collapsible on mobile */}
        <div className={cn(
          "lg:w-[350px] xl:w-[400px] flex flex-col border-t lg:border-t-0 lg:border-l border-purple-500/20 bg-slate-900/30",
          "transition-all duration-300"
        )}>
          {/* Mobile Chat Toggle */}
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="lg:hidden flex items-center justify-between p-3 bg-slate-900/50"
          >
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-400" />
              Live Chat
              {messages.length > 0 && (
                <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                  {messages.length}
                </Badge>
              )}
            </span>
            {isChatExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Chat Content */}
          <div className={cn(
            "flex flex-col transition-all duration-300 overflow-hidden",
            isChatExpanded ? "h-[300px] sm:h-[350px] lg:h-full lg:flex-1" : "h-0 lg:h-full lg:flex-1"
          )}>
            {/* Desktop: Tip Section */}
            <div className="hidden lg:block p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Send a Tip
              </h3>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-slate-900/50 border-purple-500/20 text-white h-10"
                  min="1"
                  data-testid="input-tip-amount"
                />
                <Button 
                  onClick={() => handleTip()}
                  disabled={!isAuthenticated || !tipAmount || tipMutation.isPending}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 h-10"
                  data-testid="button-send-tip"
                >
                  {tipMutation.isPending ? '...' : 'Tip'}
                </Button>
              </div>
              
              <div className="flex gap-2 mt-3">
                {[10, 50, 100, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount.toString())}
                    className="flex-1 border-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/10 h-8"
                    data-testid={`preset-tip-${amount}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              
              {stream.totalTipsReceived > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Total tips: {stream.totalTipsReceived.toLocaleString()} STREAM
                </p>
              )}
            </div>

            {/* Desktop: Chat Header */}
            <div className="hidden lg:flex p-3 border-b border-purple-500/20 items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                Live Chat
              </h3>
              {isConnected && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              )}
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 sm:space-y-3"
            >
              {messages.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-slate-500 text-xs sm:text-sm">
                  No messages yet. Be the first!
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs sm:text-sm"
                  >
                    <span className={cn(
                      "font-medium",
                      msg.isAiAgent ? "text-cyan-400" : "text-purple-400"
                    )}>
                      {msg.isAiAgent && <Bot className="w-3 h-3 inline mr-1" />}
                      @{msg.username || 'anon'}:
                    </span>{' '}
                    <span className="text-slate-300">{msg.content}</span>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-3 border-t border-purple-500/20 bg-slate-900/50">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-slate-900/50 border-purple-500/20 text-white text-sm h-11 sm:h-10"
                    disabled={!isConnected}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!isConnected || !message.trim()}
                    className="bg-purple-600 hover:bg-purple-500 h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-11 sm:h-10">
                    Sign in to Chat
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Custom Tip Modal */}
      {showTipPanel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowTipPanel(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                Send a Tip
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTipPanel(false)}
                className="text-slate-400 h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block text-sm">Amount (STREAM)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-slate-900/50 border-purple-500/30 text-white h-12 text-base"
                  min="1"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setTipAmount(amount.toString())}
                    className="border-purple-500/30 text-purple-400 h-10"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={() => handleTip()}
                disabled={!tipAmount || tipMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 h-12 text-base font-semibold"
              >
                {tipMutation.isPending ? 'Sending...' : `Tip ${tipAmount || '0'} STREAM`}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* In-Stream Prediction Modal */}
      {showPredictionPanel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowPredictionPanel(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md bg-gradient-to-br from-slate-900 via-fuchsia-900/30 to-slate-900 border border-fuchsia-500/30 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-orbitron">
                <BarChart3 className="w-5 h-5 text-fuchsia-400" />
                Make a Prediction
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPredictionPanel(false)}
                className="text-slate-400 h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Share your crypto prediction with the stream. Popular predictions can become real prediction markets!
            </p>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block text-sm">Your Prediction</Label>
                <Input
                  placeholder="e.g., BTC will reach $150k by end of 2025"
                  value={predictionText}
                  onChange={(e) => setPredictionText(e.target.value)}
                  className="bg-slate-900/50 border-fuchsia-500/30 text-white h-12 text-base"
                  data-testid="input-prediction-text"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge 
                  className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 cursor-pointer hover:bg-fuchsia-500/30"
                  onClick={() => setPredictionText('BTC will reach $100k by Q1 2025')}
                >
                  BTC $100k
                </Badge>
                <Badge 
                  className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-pointer hover:bg-cyan-500/30"
                  onClick={() => setPredictionText('ETH will flip BTC market cap by 2026')}
                >
                  ETH Flippening
                </Badge>
                <Badge 
                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30"
                  onClick={() => setPredictionText('SOL will reach $500 by end of bull run')}
                >
                  SOL $500
                </Badge>
              </div>
              
              <Button 
                onClick={handleCreatePrediction}
                disabled={!predictionText.trim() || predictionMutation.isPending}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 h-12 text-base font-semibold"
                data-testid="button-submit-prediction"
              >
                {predictionMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Share Prediction
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Add Label component inline since it's a simple component
function Label({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <label className={cn("text-sm font-medium", className)} {...props}>
      {children}
    </label>
  );
}
