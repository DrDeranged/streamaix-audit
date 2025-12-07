import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Home,
  Maximize2,
  Minimize2,
  Settings,
  Volume2,
  VolumeX,
  PictureInPicture,
  ExternalLink,
  Gift,
  Crown,
  Trophy,
  Bell,
  Copy,
  Check,
  Flag,
  MoreVertical,
  Scissors,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bookmark,
  Radio,
  Mic,
  MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStreamSocket } from '@/hooks/useStreamSocket';
import { useViewerStream } from '@/hooks/useViewerStream';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { AIAvatarStream } from '@/components/streaming/AIAvatarStream';
import { StreamReactions, QuickReactButtons } from '@/components/streaming/StreamReactions';
import { StreamPoll, CreatePollForm } from '@/components/streaming/StreamPoll';
import { BroadcasterView } from '@/components/streaming/BroadcasterView';
import { 
  ViewerLeaderboard, 
  WatchTimeRewards, 
  StreamAchievementsPanel,
  ChatCommandsHelp,
  CreateClipButton,
  PinnedMessagesBar,
  CoStreamPanel
} from '@/components/streaming/EnhancedStreamingFeatures';

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
  isKnowledgeAvatar?: boolean;
  isSubscriberOnly?: boolean;
  ticketPrice?: number;
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
  tier: 'basic' | 'super' | 'mega';
}

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  isAiAgent?: boolean;
  timestamp: number;
  badges?: string[];
  isModerator?: boolean;
  isSubscriber?: boolean;
}

const streamTypeConfig: Record<string, { icon: any; label: string; color: string; bgColor: string; gradient: string }> = {
  broadcast: { icon: Video, label: 'Broadcast', color: 'text-purple-400', bgColor: 'bg-purple-500/20', gradient: 'from-purple-500 to-fuchsia-500' },
  trading_room: { icon: TrendingUp, label: 'Trading Room', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', gradient: 'from-emerald-500 to-cyan-500' },
  audio_space: { icon: Headphones, label: 'Audio Space', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', gradient: 'from-cyan-500 to-blue-500' },
  live_bounty: { icon: Target, label: 'Live Bounty', color: 'text-amber-400', bgColor: 'bg-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
};

const formatViewers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TipAlertAnimation = memo(function TipAlertAnimation({ tip, onComplete }: { tip: TipAlert; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, tip.tier === 'mega' ? 8000 : tip.tier === 'super' ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [onComplete, tip.tier]);

  const tierConfig = {
    basic: { bg: 'from-amber-500/90 to-orange-500/90', border: 'border-amber-400/50', shadow: 'shadow-amber-500/30' },
    super: { bg: 'from-purple-500/90 to-pink-500/90', border: 'border-purple-400/50', shadow: 'shadow-purple-500/30' },
    mega: { bg: 'from-cyan-500/90 via-purple-500/90 to-pink-500/90', border: 'border-cyan-400/50', shadow: 'shadow-cyan-500/30' },
  };
  const config = tierConfig[tip.tier];

  return (
    <div className={cn(
      "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
      "animate-bounce-in"
    )}>
      <div className="relative">
        <div className={cn(
          "bg-gradient-to-br backdrop-blur-xl rounded-2xl p-6 border-2 shadow-2xl",
          config.bg, config.border, config.shadow,
          tip.tier === 'mega' && "animate-pulse"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-full",
              tip.tier === 'mega' ? "bg-gradient-to-r from-cyan-400 to-purple-400" : "bg-white/20"
            )}>
              {tip.tier === 'mega' ? <Crown className="w-6 h-6 text-white" /> : <Coins className="w-6 h-6 text-yellow-200" />}
            </div>
            <div>
              <p className="text-lg font-bold text-white">@{tip.username}</p>
              <p className="text-sm text-white/80">sent a {tip.tier} tip!</p>
            </div>
          </div>
          <p className={cn(
            "text-3xl font-bold text-center text-white font-orbitron",
            tip.tier === 'mega' && "text-4xl"
          )}>
            {tip.amount.toLocaleString()} STREAM
          </p>
          {tip.message && (
            <p className="text-sm text-white/90 mt-3 text-center italic bg-black/20 rounded-lg p-2">
              "{tip.message}"
            </p>
          )}
        </div>
        {tip.tier !== 'basic' && (
          <>
            <div className="absolute -top-2 -right-2 animate-spin-slow">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const MarketPriceOverlay = memo(function MarketPriceOverlay({ streamId }: { streamId: string }) {
  const { data } = useQuery<{ marketData: MarketData[] }>({
    queryKey: ['/api/streams', streamId, 'market-overlay'],
    enabled: !!streamId,
    refetchInterval: 30000,
  });

  if (!data?.marketData?.length) return null;

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
      {data.marketData.map((coin) => (
        <div
          key={coin.symbol}
          className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700/50 flex items-center gap-2 animate-fade-in"
        >
          <span className="text-xs font-bold text-white">{coin.symbol}</span>
          <span className="text-xs text-slate-300">${coin.price.toLocaleString()}</span>
          <span className={cn(
            "text-[10px] font-medium",
            coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
});

const CoHostsDisplay = memo(function CoHostsDisplay({ streamId }: { streamId: string }) {
  const { data } = useQuery<{ coHosts: CoHost[] }>({
    queryKey: ['/api/streams', streamId, 'co-hosts'],
    enabled: !!streamId,
    refetchInterval: 10000,
  });

  if (!data?.coHosts?.length) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 flex gap-2">
      {data.coHosts.map((coHost) => (
        <div key={coHost.id} className="relative animate-scale-in">
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
          {coHost.isMuted && (
            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

const ChatMessage = memo(function ChatMessageComponent({ msg }: { msg: ChatMessage }) {
  return (
    <div className="group flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-800/40 transition-all duration-200 border-b border-slate-700/20 last:border-b-0">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md transition-transform duration-200 group-hover:scale-105",
        msg.isAiAgent ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-cyan-500/30" : 
        msg.isModerator ? "bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/30" :
        msg.isSubscriber ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-500/30" :
        "bg-slate-700"
      )}>
        {msg.isAiAgent ? <Bot className="w-4 h-4 text-white" /> : msg.username[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {msg.isAiAgent && (
            <Badge className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1.5 py-0.5 h-auto font-semibold">AI</Badge>
          )}
          {msg.isModerator && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 h-auto font-semibold">MOD</Badge>
          )}
          {msg.isSubscriber && (
            <Badge className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 h-auto">
              <Crown className="w-2.5 h-2.5" />
            </Badge>
          )}
          <span className={cn(
            "text-sm font-semibold",
            msg.isAiAgent ? "text-cyan-400" : 
            msg.isModerator ? "text-emerald-400" : 
            msg.isSubscriber ? "text-purple-400" : "text-slate-300"
          )}>
            {msg.username}
          </span>
        </div>
        <p className="text-sm text-slate-200 break-words leading-relaxed">{msg.content}</p>
      </div>
    </div>
  );
});

const SuperChatCard = memo(function SuperChatCard({ 
  amount, 
  username, 
  message,
  tier 
}: { 
  amount: number; 
  username: string; 
  message?: string;
  tier: 'super' | 'mega';
}) {
  const config = tier === 'mega' 
    ? { bg: 'from-cyan-500/20 to-purple-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400' }
    : { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', text: 'text-purple-400' };

  return (
    <div className={cn(
      "p-3 rounded-xl border bg-gradient-to-r mb-2",
      config.bg, config.border
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn("text-sm font-bold", config.text)}>@{username}</span>
        <Badge className={cn("text-[10px]", config.text, config.bg)}>
          {amount.toLocaleString()} STREAM
        </Badge>
      </div>
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  );
});

const StreamerCard = memo(function StreamerCard({ stream, isFollowing }: { stream: LiveStream; isFollowing: boolean }) {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;

  return (
    <Card className="p-4 bg-slate-900/60 border border-slate-700/40">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br ring-2",
            config.gradient,
            "ring-purple-500/30"
          )}>
            {stream.hostAvatar ? (
              <img src={stream.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              stream.hostUsername?.[0]?.toUpperCase()
            )}
          </div>
          {stream.status === 'live' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg">{stream.hostUsername || 'Anonymous'}</h3>
          <p className="text-sm text-slate-400 line-clamp-2 mb-2">{stream.title}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatViewers(stream.currentViewers)} watching
            </span>
            {stream.totalTipsReceived > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {stream.totalTipsReceived.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button 
          className={cn(
            "flex-1",
            isFollowing 
              ? "bg-slate-700 hover:bg-slate-600" 
              : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
          )}
          data-testid="button-follow-streamer"
        >
          <Heart className={cn("w-4 h-4 mr-2", isFollowing && "fill-current")} />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-300" data-testid="button-subscribe-streamer">
          <Crown className="w-4 h-4 mr-2 text-amber-400" />
          Subscribe
        </Button>
      </div>
    </Card>
  );
});

export default function StreamViewPage() {
  const [, params] = useRoute('/stream/:id');
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
  const [streamDuration, setStreamDuration] = useState(0);
  const [chatTab, setChatTab] = useState<'chat' | 'tips' | 'subscribe' | 'costream'>('chat');
  const [isCopied, setIsCopied] = useState(false);
  const [isFloatingChat, setIsFloatingChat] = useState(false);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<{ id: string; username: string; content: string; pinnedAt: string; isAlpha: boolean }[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const streamId = params?.id || null;
  
  const { isConnected, viewerCount, messages, sendMessage, onAvatarAudio } = useStreamSocket(streamId);
  
  const { data: streamData, isLoading } = useQuery<{ stream: LiveStream }>({
    queryKey: ['/api/streams', streamId],
    enabled: !!streamId,
    refetchInterval: 10000,
  });
  
  const stream = streamData?.stream;
  const isAvatarStream = stream?.isKnowledgeAvatar === true;
  
  const {
    isReceivingVideo,
    remoteStream,
    connectionState: videoConnectionState,
    error: videoError,
  } = useViewerStream(streamId, !isAvatarStream && !!stream);
  
  const { data: pinnedData } = useQuery<{ messages: { id: string; username: string; content: string; pinnedAt: string; isAlpha: boolean }[] }>({
    queryKey: ['/api/streams', streamId, 'messages', 'pinned'],
    enabled: !!streamId,
    refetchInterval: 15000,
  });
  
  useEffect(() => {
    if (streamId && isAuthenticated) {
      apiRequest(`/api/streams/${streamId}/join`, { method: 'POST' })
        .then(() => {
          console.log('[StreamView] Joined stream successfully');
        })
        .catch((error) => {
          console.log('[StreamView] Join API call failed (non-blocking):', error.message);
        });
    }
  }, [streamId, isAuthenticated]);
  
  const config = stream ? streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast : streamTypeConfig.broadcast;
  const Icon = config.icon;
  const isHost = user?.id === stream?.hostId;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (viewerVideoRef.current && remoteStream) {
      viewerVideoRef.current.srcObject = remoteStream;
      console.log('[StreamView] Attached remote stream to video element');
    }
  }, [remoteStream]);

  useEffect(() => {
    const tipMessages = messages.filter(m => m.content.includes('💎 Tipped'));
    if (tipMessages.length > 0) {
      const latestTip = tipMessages[tipMessages.length - 1];
      const match = latestTip.content.match(/💎 Tipped (\d+) STREAM(?:: (.+))?/);
      if (match) {
        const amount = parseInt(match[1]);
        const tier = amount >= 1000 ? 'mega' : amount >= 100 ? 'super' : 'basic';
        const newAlert: TipAlert = {
          id: latestTip.id,
          username: latestTip.username,
          amount,
          message: match[2],
          timestamp: latestTip.timestamp,
          tier,
        };
        if (!activeTipAlerts.find(a => a.id === newAlert.id)) {
          setActiveTipAlerts(prev => [...prev, newAlert]);
        }
      }
    }
  }, [messages, activeTipAlerts]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stream?.status === 'live' && stream?.actualStart) {
      const updateDuration = () => {
        const start = new Date(stream.actualStart!).getTime();
        const now = Date.now();
        setStreamDuration(Math.floor((now - start) / 1000));
      };
      updateDuration();
      interval = setInterval(updateDuration, 1000);
    }
    return () => clearInterval(interval);
  }, [stream?.status, stream?.actualStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const removeTipAlert = useCallback((id: string) => {
    setActiveTipAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleReaction = useCallback((emoji: string) => {
    if (isConnected) {
      sendMessage(`[reaction:${emoji}]`);
    }
  }, [isConnected, sendMessage]);

  const handleSendMessage = useCallback(() => {
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
  }, [message, isAuthenticated, isConnected, sendMessage, toast]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: "Link copied!" });
  }, [toast]);

  const tipMutation = useMutation({
    mutationFn: async ({ amount, message }: { amount: number; message?: string }) => {
      return apiRequest(`/api/streams/${streamId}/tip`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Tip sent!",
        description: `You tipped ${tipAmount} STREAM to the streamer`,
      });
      setTipAmount('');
      setTipMessage('');
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

  const handleTip = useCallback((amount?: number) => {
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
    tipMutation.mutate({ amount: tipValue, message: tipMessage || undefined });
  }, [tipAmount, tipMessage, isAuthenticated, setLocation, tipMutation, toast]);

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

  const handleCreatePrediction = useCallback(() => {
    if (!predictionText.trim()) {
      toast({
        title: "Please enter a prediction",
        variant: "destructive",
      });
      return;
    }
    predictionMutation.mutate(predictionText.trim());
  }, [predictionText, predictionMutation, toast]);

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/streams/${streamId}/end`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Stream ended",
        description: "Your stream has been ended successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
      setLocation('/streams');
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't end stream",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreatePoll = useCallback((question: string, options: string[]) => {
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
  }, [user?.username, toast]);

  const handleVotePoll = useCallback((optionId: string) => {
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
  }, [activePoll, hasVotedOnPoll]);

  const handleEndPoll = useCallback(() => {
    if (activePoll) {
      setActivePoll(prev => prev ? { ...prev, isActive: false } : null);
      toast({
        title: "Poll Ended",
        description: "Results are now final.",
      });
    }
  }, [activePoll, toast]);

  const superChats = useMemo(() => {
    return messages
      .filter(m => m.content.includes('💎 Tipped'))
      .map(m => {
        const match = m.content.match(/💎 Tipped (\d+) STREAM(?:: (.+))?/);
        if (!match) return null;
        const amount = parseInt(match[1]);
        if (amount < 100) return null;
        return {
          id: m.id,
          username: m.username,
          amount,
          message: match[2],
          tier: amount >= 1000 ? 'mega' : 'super' as 'super' | 'mega',
        };
      })
      .filter(Boolean)
      .slice(-10);
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
        <div className="flex flex-col lg:flex-row h-screen">
          <div className="flex-1 flex flex-col">
            <div className="h-14 bg-slate-900/80 border-b border-purple-500/20 animate-pulse" />
            <div className="flex-1 relative bg-slate-900/60 m-4 rounded-2xl animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-purple-400 animate-pulse" />
                  </div>
                  <div className="h-4 w-32 mx-auto bg-slate-700/50 rounded-full mb-3" />
                  <div className="h-3 w-24 mx-auto bg-slate-700/30 rounded-full" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-700/30 rounded animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block w-[380px] border-l border-purple-500/20 bg-slate-900/40">
            <div className="p-4 border-b border-slate-700/40">
              <div className="h-10 bg-slate-700/30 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-8 h-8 rounded-full bg-slate-700/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-slate-700/40 rounded" />
                    <div className="h-3 w-full bg-slate-700/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-4 px-4 safe-area-inset">
        <div className="w-20 h-20 rounded-full bg-slate-800/60 flex items-center justify-center mb-2">
          <Video className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="text-xl font-bold text-white">Stream not found</h1>
        <p className="text-slate-400 text-center max-w-md">This stream may have ended or doesn't exist.</p>
        <Link href="/streams">
          <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Streams
          </Button>
        </Link>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  const displayViewerCount = isConnected ? viewerCount : stream.currentViewers;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset flex flex-col",
      isTheaterMode && "bg-black"
    )}>
      <div className={cn(
        "border-b border-purple-500/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50",
        isTheaterMode && "bg-black/90"
      )}>
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
            
            <div className="hidden sm:flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <Badge variant="outline" className={cn("border-purple-500/30 text-xs", config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && (
              <>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] sm:text-xs px-2">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  LIVE
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px] sm:text-xs hidden sm:flex">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(streamDuration)}
                </Badge>
              </>
            )}
            
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] sm:text-xs px-2",
                isConnected 
                  ? "border-emerald-500/30 text-emerald-400" 
                  : "border-orange-500/30 text-orange-400"
              )}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            </Badge>
            
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs">
              <Eye className="w-3 h-3 mr-1" />
              {formatViewers(displayViewerCount)}
            </Badge>

            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                data-testid="button-theater-mode"
              >
                {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 flex flex-col lg:flex-row",
        isTheaterMode ? "max-w-none" : "max-w-7xl mx-auto w-full"
      )}>
        <div className={cn(
          "flex-1 p-3 sm:p-4 lg:p-6 space-y-4",
          isTheaterMode && "p-0 sm:p-0 lg:p-0"
        )}>
          <Card className={cn(
            "relative overflow-hidden border border-purple-500/20",
            isTheaterMode 
              ? "aspect-auto h-[60vh] sm:h-[70vh] lg:h-[80vh] rounded-none border-0 bg-black" 
              : "aspect-video bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90"
          )}>
            {isLive && streamId && <MarketPriceOverlay streamId={streamId} />}
            {isLive && streamId && <CoHostsDisplay streamId={streamId} />}
            
            {activeTipAlerts.map((tip) => (
              <TipAlertAnimation
                key={tip.id}
                tip={tip}
                onComplete={() => removeTipAlert(tip.id)}
              />
            ))}
            
            {isLive && isHost && !stream.isKnowledgeAvatar ? (
              <BroadcasterView
                streamId={stream.id}
                streamType={stream.streamType}
                viewerCount={displayViewerCount}
                onEndStream={() => endStreamMutation.mutate()}
                isEnding={endStreamMutation.isPending}
              />
            ) : isLive && stream.isKnowledgeAvatar ? (
              <AIAvatarStream
                hostName={stream.hostUsername || 'AI Host'}
                hostAvatar={stream.hostAvatar}
                streamType={stream.streamType}
                isLive={isLive}
                currentMessage={messages.length > 0 ? messages[messages.length - 1]?.content : undefined}
                viewerCount={displayViewerCount}
                onAudioMessage={onAvatarAudio}
              />
            ) : isLive && isReceivingVideo && remoteStream ? (
              <div className="absolute inset-0">
                <video
                  ref={viewerVideoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 z-10">
                  <Badge className={cn(
                    "backdrop-blur-sm text-xs px-2.5 py-1",
                    videoConnectionState === 'connected' ? "bg-emerald-500/80 text-white" :
                    videoConnectionState === 'connecting' ? "bg-cyan-500/80 text-white" :
                    videoConnectionState === 'reconnecting' ? "bg-amber-500/80 text-white" :
                    "bg-red-500/80 text-white"
                  )}>
                    {videoConnectionState === 'connected' ? <Wifi className="w-3 h-3 mr-1.5" /> :
                     videoConnectionState === 'connecting' ? <Radio className="w-3 h-3 mr-1.5 animate-pulse" /> :
                     <WifiOff className="w-3 h-3 mr-1.5" />}
                    {videoConnectionState === 'connected' ? 'Live' :
                     videoConnectionState === 'connecting' ? 'Connecting...' :
                     videoConnectionState === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10">
                {isLive ? (
                  <div className="text-center px-4">
                    <div className={cn(
                      "p-6 rounded-full bg-gradient-to-br border mb-4 inline-block",
                      config.gradient,
                      "border-white/20"
                    )}>
                      {videoConnectionState === 'connecting' ? (
                        <Radio className="w-12 h-12 text-white animate-pulse" />
                      ) : (
                        <Icon className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-white mb-2 font-orbitron">
                      {videoConnectionState === 'connecting' ? 'Connecting to Stream...' : 
                       videoConnectionState === 'reconnecting' ? 'Reconnecting...' :
                       videoError ? 'Connection Failed' : 'Stream is Live'}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                      {videoConnectionState === 'connecting' ? (
                        <>
                          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                          Establishing video connection...
                        </>
                      ) : videoError ? (
                        <>
                          <WifiOff className="w-4 h-4 text-red-400" />
                          {videoError}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Waiting for broadcaster...
                        </>
                      )}
                    </p>
                  </div>
                ) : isScheduled ? (
                  <div className="text-center px-4">
                    <div className="p-6 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4 inline-block">
                      <Clock className="w-12 h-12 text-amber-400" />
                    </div>
                    <p className="text-lg font-bold text-white mb-2">Stream Scheduled</p>
                    <p className="text-sm text-slate-400">
                      {stream.scheduledStart 
                        ? new Date(stream.scheduledStart).toLocaleString()
                        : 'Time TBD'}
                    </p>
                    <Button className="mt-4 bg-amber-500 hover:bg-amber-400">
                      <Bell className="w-4 h-4 mr-2" />
                      Remind Me
                    </Button>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="p-6 rounded-full bg-slate-800 border border-slate-700 mb-4 inline-block">
                      <Video className="w-12 h-12 text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-400">Stream Ended</p>
                    <p className="text-sm text-slate-500 mt-1">Check back for replays!</p>
                  </div>
                )}
              </div>
            )}
            
            {isLive && isAuthenticated && !isHost && (
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                <CreateClipButton 
                  streamId={streamId || ''} 
                  currentTime={streamDuration}
                />
                <Button
                  onClick={() => setShowPredictionPanel(true)}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 h-10 min-h-[44px] px-4 text-sm font-medium shadow-lg shadow-fuchsia-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
                  data-testid="button-create-prediction"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Predict
                </Button>
                <Button
                  onClick={() => setShowTipPanel(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 h-10 min-h-[44px] px-4 text-sm font-medium shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
                  data-testid="button-open-tip-panel"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Tip
                </Button>
              </div>
            )}

            {isTheaterMode && (
              <Button
                onClick={() => setIsFloatingChat(!isFloatingChat)}
                variant="ghost"
                size="sm"
                className="absolute bottom-3 left-3 z-10 bg-slate-900/60 hover:bg-slate-800/80"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isFloatingChat ? 'Hide' : 'Show'} Chat
              </Button>
            )}
          </Card>

          {!isTheaterMode && (
            <>
              <Card className="p-4 bg-slate-900/60 border border-slate-700/40">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-xl font-bold text-white font-orbitron line-clamp-2 flex-1">{stream.title}</h1>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="border-slate-600/80 text-slate-300 h-10 min-h-[44px] w-10 min-w-[44px] p-0 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200"
                      data-testid="button-copy-link"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600/80 text-slate-300 h-10 min-h-[44px] w-10 min-w-[44px] p-0 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200"
                      data-testid="button-share-stream"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <StreamerCard stream={stream} isFollowing={false} />
                
                {stream.description && (
                  <div className="mt-4 pt-4 border-t border-slate-700/40">
                    <p className="text-sm text-slate-400">{stream.description}</p>
                  </div>
                )}
                
                {stream.tags && stream.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {stream.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="border-purple-500/20 text-purple-400 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>

              {isLive && (
                <Card className="p-4 bg-slate-900/60 border border-slate-700/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      Engage
                    </h3>
                    
                    {isHost && (
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRecording(false)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                          >
                            <Circle className="w-3 h-3 mr-1 fill-red-500 text-red-500 animate-pulse" />
                            {formatDuration(recordingDuration)}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsRecording(true); setRecordingDuration(0); }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
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
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Poll
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <QuickReactButtons onReact={handleReaction} />
                    <StreamReactions streamId={streamId || ''} onReact={handleReaction} />
                  </div>
                  
                  {activePoll && (
                    <div className="mt-4">
                      <StreamPoll
                        poll={activePoll}
                        hasVoted={hasVotedOnPoll || undefined}
                        onVote={handleVotePoll}
                        isHost={isHost}
                        onEndPoll={handleEndPoll}
                      />
                    </div>
                  )}
                  
                  {showPollCreator && (
                    <div className="mt-4">
                      <CreatePollForm
                        onCreate={handleCreatePoll}
                        onCancel={() => setShowPollCreator(false)}
                      />
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        <div className={cn(
          "w-full lg:w-[380px] xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-purple-500/30",
          isTheaterMode && !isFloatingChat && "hidden",
          isTheaterMode && isFloatingChat && "fixed bottom-4 right-4 w-[360px] h-[500px] rounded-xl border shadow-2xl z-50 bg-slate-900",
          !isTheaterMode && "bg-gradient-to-b from-slate-900/60 to-slate-900/80"
        )}>
          {isTheaterMode && isFloatingChat && (
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
              <span className="text-sm font-semibold text-white">Live Chat</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFloatingChat(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="lg:hidden flex items-center justify-between p-4 bg-gradient-to-r from-slate-900/80 to-purple-900/20 min-h-[56px] active:bg-slate-800/60 transition-colors"
          >
            <span className="text-base font-semibold text-white flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <MessageCircle className="w-5 h-5 text-purple-400" />
              </div>
              Live Chat
              {messages.length > 0 && (
                <Badge className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5">
                  {messages.length}
                </Badge>
              )}
            </span>
            <div className="p-2 rounded-lg bg-slate-800/50">
              {isChatExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-300" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-300" />
              )}
            </div>
          </button>

          <div className={cn(
            "flex flex-col transition-all duration-300 ease-out overflow-hidden",
            isChatExpanded ? "h-[420px] sm:h-[480px] lg:h-full lg:flex-1" : "h-0 lg:h-full lg:flex-1"
          )}>
            <Tabs value={chatTab} onValueChange={(v) => setChatTab(v as 'chat' | 'tips' | 'subscribe' | 'costream')} className="flex flex-col h-full">
              <div className="hidden lg:block border-b border-slate-700/40">
                <TabsList className="bg-transparent w-full justify-start rounded-none h-11 p-0">
                  <TabsTrigger 
                    value="chat" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tips" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Tips
                  </TabsTrigger>
                  <TabsTrigger 
                    value="subscribe" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-fuchsia-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <Crown className="w-3.5 h-3.5 mr-1 text-fuchsia-400" />
                    Sub
                  </TabsTrigger>
                  <TabsTrigger 
                    value="costream" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <Radio className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                    Co-Stream
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
                {pinnedData?.messages && pinnedData.messages.length > 0 && (
                  <div className="p-2 border-b border-slate-700/40">
                    <PinnedMessagesBar 
                      messages={pinnedData.messages}
                      onUnpin={undefined}
                    />
                  </div>
                )}
                
                {superChats.length > 0 && (
                  <div className="p-3 border-b border-slate-700/40 max-h-[150px] overflow-y-auto">
                    {superChats.map((sc) => sc && (
                      <SuperChatCard 
                        key={sc.id} 
                        amount={sc.amount} 
                        username={sc.username} 
                        message={sc.message}
                        tier={sc.tier}
                      />
                    ))}
                  </div>
                )}

                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 animate-fade-in">
                      <div className="p-4 rounded-full bg-slate-800/50 inline-block mb-4">
                        <MessageSquare className="w-10 h-10 text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">No messages yet</p>
                      <p className="text-xs text-slate-500 mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <ChatMessage key={msg.id} msg={msg as any} />
                    ))
                  )}
                </div>
                
                <div className="p-4 border-t border-slate-700/50 bg-gradient-to-t from-slate-900 to-slate-900/80 relative">
                  {showCommandsHelp && (
                    <ChatCommandsHelp onClose={() => setShowCommandsHelp(false)} />
                  )}
                  {isAuthenticated ? (
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCommandsHelp(!showCommandsHelp)}
                        className="h-12 w-12 min-w-[48px] min-h-[48px] p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 flex-shrink-0 rounded-xl transition-all duration-200"
                        data-testid="button-commands-help"
                      >
                        <Zap className="w-5 h-5" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Send a message... (try !price BTC)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="bg-slate-800/70 border-2 border-slate-700/80 text-white text-sm h-12 rounded-xl pl-4 pr-4 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                          disabled={!isConnected}
                          data-testid="input-chat-message"
                        />
                      </div>
                      <Button 
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!isConnected || !message.trim()}
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 w-12 min-w-[48px] min-h-[48px] flex-shrink-0 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                        data-testid="button-send-message"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 rounded-xl shadow-lg shadow-purple-500/25 font-semibold">
                        Sign in to Chat
                      </Button>
                    </Link>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tips" className="flex-1 flex flex-col m-0 p-4 overflow-hidden">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => handleTip(amount)}
                        disabled={!isAuthenticated || tipMutation.isPending}
                        className={cn(
                          "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-12",
                          amount >= 100 && "border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        )}
                        data-testid={`quick-tip-${amount}`}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white h-11"
                      min="1"
                      data-testid="input-tip-amount"
                    />
                    <Textarea
                      placeholder="Add a message (optional)"
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white resize-none h-20"
                      data-testid="input-tip-message"
                    />
                    <Button 
                      onClick={() => handleTip()}
                      disabled={!isAuthenticated || !tipAmount || tipMutation.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 h-11"
                      data-testid="button-send-tip"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {tipMutation.isPending ? 'Sending...' : `Send ${tipAmount || '0'} STREAM`}
                    </Button>
                  </div>
                  
                  {stream.totalTipsReceived > 0 && (
                    <div className="pt-4 border-t border-slate-700/40 text-center">
                      <p className="text-2xl font-bold text-amber-400 font-orbitron">
                        {stream.totalTipsReceived.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">STREAM received this stream</p>
                    </div>
                  )}
                  
                  <div className="pt-4 space-y-4">
                    <ViewerLeaderboard streamId={streamId || ''} />
                    {isAuthenticated && user && (
                      <WatchTimeRewards streamId={streamId || ''} userId={user.id} />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscribe" className="flex-1 flex flex-col m-0 p-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">Subscribe to {stream.hostUsername || 'this streamer'}</h3>
                    <p className="text-xs text-slate-400">Get exclusive perks and support your favorite creator</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:border-slate-600/60 transition-colors cursor-pointer group"
                       onClick={() => toast({ title: 'Free Tier', description: 'You already have access to free content!' })}
                       data-testid="subscription-tier-free"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-semibold text-white">Free</span>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">Current</Badge>
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1.5">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Watch all public streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Chat during live streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Basic emotes</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 hover:border-purple-400/70 transition-all cursor-pointer group"
                       onClick={() => {
                         if (!isAuthenticated) {
                           toast({ title: 'Sign in required', description: 'Please sign in to subscribe.' });
                           return;
                         }
                         toast({ title: 'Silver Subscription', description: 'Subscribe for 100 STREAM/month to unlock silver perks!' });
                       }}
                       data-testid="subscription-tier-silver"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">Silver</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-purple-400">100</span>
                        <span className="text-xs text-slate-400 ml-1">STREAM/mo</span>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-3">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> All Free tier perks</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Subscriber badge in chat</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Custom emotes (10+)</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Ad-free viewing</li>
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-9 text-sm">
                      Subscribe - 100 STREAM
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:border-amber-400/70 transition-all cursor-pointer group relative overflow-hidden"
                       onClick={() => {
                         if (!isAuthenticated) {
                           toast({ title: 'Sign in required', description: 'Please sign in to subscribe.' });
                           return;
                         }
                         toast({ title: 'Gold Subscription', description: 'Subscribe for 500 STREAM/month to unlock gold perks!' });
                       }}
                       data-testid="subscription-tier-gold"
                  >
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-[10px] font-bold text-black">
                      BEST VALUE
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse-slow">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">Gold</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-amber-400">500</span>
                        <span className="text-xs text-slate-400 ml-1">STREAM/mo</span>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 mb-3">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" /> All Silver tier perks</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" /> Priority chat messages</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" /> Access subscriber-only streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" /> Exclusive Discord role</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" /> Monthly shoutout on stream</li>
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 h-9 text-sm text-black font-semibold">
                      Subscribe - 500 STREAM
                    </Button>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center pt-2">
                    Subscriptions renew monthly. Cancel anytime.
                  </p>
                  
                  <div className="pt-4">
                    <StreamAchievementsPanel userId={user?.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="costream" className="flex-1 flex flex-col m-0 p-4 overflow-y-auto">
                <CoStreamPanel 
                  sessionId={streamId || ''} 
                  avatars={[]}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {showTipPanel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowTipPanel(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                Send a Tip
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTipPanel(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => { setTipAmount(amount.toString()); }}
                  className={cn(
                    "h-14",
                    parseInt(tipAmount) === amount 
                      ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  {amount}
                </Button>
              ))}
            </div>
            
            <Input
              type="number"
              placeholder="Custom amount"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white h-12"
              min="1"
            />
            
            <Textarea
              placeholder="Add a message (shows on stream if 100+ STREAM)"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white resize-none h-24"
            />
            
            <Button 
              onClick={() => handleTip()}
              disabled={!tipAmount || tipMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 h-12 text-lg"
            >
              {tipMutation.isPending ? 'Sending...' : `Send ${tipAmount || '0'} STREAM`}
            </Button>
          </div>
        </div>
      )}

      {showPredictionPanel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowPredictionPanel(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-fuchsia-400" />
                Make a Prediction
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPredictionPanel(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-slate-400">
              Share your market prediction. If the community likes it, it might become a prediction market!
            </p>
            
            <Textarea
              placeholder="e.g., BTC will reach $100k by end of Q1 2025"
              value={predictionText}
              onChange={(e) => setPredictionText(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white resize-none h-28"
            />
            
            <Button 
              onClick={handleCreatePrediction}
              disabled={!predictionText.trim() || predictionMutation.isPending}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 h-12"
            >
              {predictionMutation.isPending ? 'Creating...' : 'Share Prediction'}
            </Button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
