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
import Surface from '@/components/ds/Surface';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStreamSocket } from '@/hooks/useStreamSocket';
import { useAwardStreamWatch, useAwardVoiceConversation } from '@/hooks/usePoints';
import { useViewerStream } from '@/hooks/useViewerStream';
import { useLiveKitStream } from '@/hooks/useLiveKitStream';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { AIAvatarStream } from '@/components/streaming/AIAvatarStream';
import { LiveKitVideo } from '@/components/streaming/LiveKitVideo';
import { ViewerPresence } from '@/components/streaming/MobileStreamViewer';
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
  CoStreamPanel,
  ClipsGallery,
  RaidPanel,
  ChannelPointsPanel,
  ChatModerationPanel,
  GiftSubscriptionPanel,
  StreamAnalyticsPanel
} from '@/components/streaming/EnhancedStreamingFeatures';
import { ConversationPanel } from '@/components/streams/ConversationPanel';
import { ConversationReplay } from '@/components/streams/ConversationReplay';
import { ImmersiveStreamView } from '@/components/streaming/ImmersiveStreamView';

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
  broadcast: { icon: Video, label: 'Broadcast', color: 'text-accent-bright', bgColor: 'bg-accent-core/20', gradient: 'bg-accent-core' },
  trading_room: { icon: TrendingUp, label: 'Trading Room', color: 'text-gain', bgColor: 'bg-gain/20', gradient: ' ' },
  audio_space: { icon: Headphones, label: 'Audio Space', color: 'text-accent-bright', bgColor: 'bg-accent-core/20', gradient: 'bg-accent-core' },
  live_bounty: { icon: Target, label: 'Live Bounty', color: 'text-warn', bgColor: 'bg-warn/20', gradient: 'bg-warn' },
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
    basic: { bg: 'bg-warn/90', border: 'border-warn/50', shadow: 'shadow-warn/30' },
    super: { bg: 'bg-accent-core/90', border: 'border-accent-core/50', shadow: 'shadow-accent-core/30' },
    mega: { bg: 'bg-accent-core/90', border: 'border-accent-core/50', shadow: 'shadow-accent-core/30' },
  };
  const config = tierConfig[tip.tier];

  return (
    <div className={cn(
      "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
      "animate-bounce-in"
    )}>
      <div className="relative">
        <div className={cn(
          "bg-ink-raised backdrop-blur-xl rounded-2xl p-6 border-2 border-ink-edge shadow-2xl",
          config.bg, config.border, config.shadow,
          tip.tier === 'mega' && "animate-pulse"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-full",
              tip.tier === 'mega' ? "bg-accent-core" : "bg-ink-surface"
            )}>
              {tip.tier === 'mega' ? <Crown className="w-6 h-6 text-primary" /> : <Coins className="w-6 h-6 text-yellow-200" />}
            </div>
            <div>
              <p className="text-lg font-bold text-primary">@{tip.username}</p>
              <p className="text-sm text-primary/80">sent a {tip.tier} tip!</p>
            </div>
          </div>
          <p className={cn(
            "text-3xl font-bold text-center text-primary font-orbitron",
            tip.tier === 'mega' && "text-4xl"
          )}>
            {tip.amount.toLocaleString()} STREAM
          </p>
          {tip.message && (
            <p className="text-sm text-secondary mt-3 text-center italic bg-ink-page rounded-xl p-2">
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
    <div className="absolute top-12 right-3 z-10 hidden sm:flex flex-col gap-1.5">
      {data.marketData.map((coin) => (
        <div
          key={coin.symbol}
          className="bg-ink-surface/90 backdrop-blur-sm rounded-xl px-2.5 py-1 border border-ink-edge flex items-center gap-1.5 animate-fade-in"
        >
          <span className="text-[10px] font-bold text-primary">{coin.symbol}</span>
          <span className="text-[10px] text-body">${coin.price.toLocaleString()}</span>
          <span className={cn(
            "text-[9px] font-medium",
            coin.change24h >= 0 ? "text-gain" : "text-loss"
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
    refetchInterval: 30000, // Reduced from 10s to 30s for performance
    staleTime: 15000,
  });

  if (!data?.coHosts?.length) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 hidden sm:flex gap-2">
      {data.coHosts.map((coHost) => (
        <div key={coHost.id} className="relative animate-scale-in">
          <div className="w-10 h-10 rounded-full bg-accent-core flex items-center justify-center border-2 border-accent-core/50 overflow-hidden">
            {coHost.avatar ? (
              <img src={coHost.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{coHost.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          {coHost.isScreenSharing && (
            <div className="absolute -top-1 -right-1 bg-gain rounded-full p-0.5">
              <Monitor className="w-2.5 h-2.5 text-primary" />
            </div>
          )}
          {coHost.isMuted && (
            <div className="absolute -bottom-1 -right-1 bg-loss rounded-full p-0.5">
              <MicOff className="w-2.5 h-2.5 text-primary" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

const ChatMessage = memo(function ChatMessageComponent({ msg }: { msg: ChatMessage }) {
  return (
    <div className="group flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-ink-raised transition-all duration-200 border-b border-ink-divider last:border-b-0">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md transition-transform duration-200 group-hover:scale-105",
        msg.isAiAgent ? "bg-ink-raised shadow-cyan-500/30" :
        msg.isModerator ? "bg-ink-raised shadow-emerald-500/30" :
        msg.isSubscriber ? "bg-ink-raised shadow-purple-500/30" :
        "bg-ink-raised"
      )}>
        {msg.isAiAgent ? <Bot className="w-4 h-4 text-primary" /> : msg.username[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {msg.isAiAgent && (
            <Badge className="bg-accent-core/20 text-accent-bright text-[9px] px-1.5 py-0.5 h-auto font-semibold">AI</Badge>
          )}
          {msg.isModerator && (
            <Badge className="bg-gain/20 text-gain text-[9px] px-1.5 py-0.5 h-auto font-semibold">MOD</Badge>
          )}
          {msg.isSubscriber && (
            <Badge className="bg-accent-core/20 text-accent-bright text-[9px] px-1.5 py-0.5 h-auto">
              <Crown className="w-2.5 h-2.5" />
            </Badge>
          )}
          <span className={cn(
            "text-sm font-semibold",
            msg.isAiAgent ? "text-accent-bright" :
            msg.isModerator ? "text-gain" :
            msg.isSubscriber ? "text-accent-bright" : "text-body"
          )}>
            {msg.username}
          </span>
        </div>
        <p className="text-sm text-body break-words leading-relaxed">{msg.content}</p>
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
    ? { bg: ' ', border: 'border-accent-core/40', text: 'text-accent-bright' }
    : { bg: ' ', border: 'border-accent-core/40', text: 'text-accent-bright' };

  return (
    <div className={cn(
      "p-3 rounded-xl border mb-2",
      config.bg, config.border
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn("text-sm font-bold", config.text)}>@{username}</span>
        <Badge className={cn("text-[10px]", config.text, config.bg)}>
          {amount.toLocaleString()} STREAM
        </Badge>
      </div>
      {message && <p className="text-sm text-body">{message}</p>}
    </div>
  );
});

const StreamerCard = memo(function StreamerCard({ stream, isFollowing }: { stream: LiveStream; isFollowing: boolean }) {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;

  return (
    <Surface className="p-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg bg-accent-core ring-2",
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
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gain rounded-full border-2 border-ink-surface" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-primary text-lg">{stream.hostUsername || 'Anonymous'}</h3>
          <p className="text-sm text-secondary line-clamp-2 mb-2">{stream.title}</p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatViewers(stream.currentViewers)} watching
            </span>
            {stream.totalTipsReceived > 0 && (
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-warn" />
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
              ? "bg-ink-raised hover:bg-ink-edge"
              : "bg-ink-raised "
          )}
          data-testid="button-follow-streamer"
        >
          <Heart className={cn("w-4 h-4 mr-2", isFollowing && "fill-current")} />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
        <Button variant="outline" className="border-ink-edge text-body" data-testid="button-subscribe-streamer">
          <Crown className="w-4 h-4 mr-2 text-warn" />
          Subscribe
        </Button>
      </div>
    </Surface>
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
  const [chatTab, setChatTab] = useState<'chat' | 'tips' | 'subscribe' | 'costream' | 'converse' | 'replay' | 'clips' | 'points' | 'tools'>('chat');
  const [isCopied, setIsCopied] = useState(false);
  const [isFloatingChat, setIsFloatingChat] = useState(false);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<{ id: string; username: string; content: string; pinnedAt: string; isAlpha: boolean }[]>([]);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [hasAutoEnteredImmersive, setHasAutoEnteredImmersive] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const streamId = params?.id || null;
  const watchTimeRef = useRef<number>(0);
  const lastPointsAwardedRef = useRef<number>(0);

  const { isConnected, viewerCount, messages, recentJoins, sendMessage, onAvatarAudio } = useStreamSocket(streamId);

  const awardStreamWatch = useAwardStreamWatch();
  const awardVoiceConversation = useAwardVoiceConversation();

  const { data: streamData, isLoading } = useQuery<{ stream: LiveStream }>({
    queryKey: ['/api/streams', streamId],
    enabled: !!streamId,
    refetchInterval: 30000, // Reduced from 10s to 30s for performance
    staleTime: 15000,
  });

  const stream = streamData?.stream;
  const isAvatarStream = stream?.isKnowledgeAvatar === true;

  const {
    isReceivingVideo,
    remoteStream,
    connectionState: videoConnectionState,
    error: videoError,
    retryConnection: retryVideoConnection,
  } = useViewerStream(streamId, false);

  const {
    isConnected: liveKitConnected,
    connectionState: liveKitConnectionState,
    remoteVideoTrack,
    remoteAudioTrack,
    localVideoTrack,
    isHost: isLiveKitHost,
    error: liveKitError,
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    participantCount: liveKitParticipants,
  } = useLiveKitStream(streamId);

  const hasLiveKitVideo = !!remoteVideoTrack || (isLiveKitHost && !!localVideoTrack);

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

  const [hasAttemptedLiveKitConnect, setHasAttemptedLiveKitConnect] = useState(false);

  useEffect(() => {
    if (stream?.status === 'live' && !stream?.isKnowledgeAvatar && isAuthenticated && !liveKitConnected && !hasAttemptedLiveKitConnect && !liveKitError) {
      console.log('[StreamView] Auto-connecting to LiveKit for live stream');
      setHasAttemptedLiveKitConnect(true);
      connectLiveKit();
    }
  }, [stream?.status, stream?.isKnowledgeAvatar, isAuthenticated, liveKitConnected, hasAttemptedLiveKitConnect, liveKitError, connectLiveKit]);

  useEffect(() => {
    return () => {
      if (liveKitConnected) {
        disconnectLiveKit();
      }
    };
  }, [liveKitConnected, disconnectLiveKit]);

  const config = stream ? streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast : streamTypeConfig.broadcast;
  const Icon = config.icon;
  const isHost = user?.id === stream?.hostId;
  const isLiveStream = stream?.status === 'live';

  useEffect(() => {
    if (isHost && isLiveStream && !hasAutoEnteredImmersive && !stream?.isKnowledgeAvatar) {
      console.log('[StreamView] Auto-entering immersive fullscreen mode for host');
      setIsImmersiveMode(true);
      setHasAutoEnteredImmersive(true);

      toast({
        title: "You're Live!",
        description: "Swipe down or press ESC to exit fullscreen",
      });
    }
  }, [isHost, isLiveStream, hasAutoEnteredImmersive, stream?.isKnowledgeAvatar, toast]);

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

  useEffect(() => {
    if (!streamId || !isAuthenticated || !stream?.status) return;

    const POINTS_INTERVAL_MS = 5 * 60 * 1000;

    const interval = setInterval(() => {
      watchTimeRef.current += 5;

      if (watchTimeRef.current >= 5 && watchTimeRef.current > lastPointsAwardedRef.current) {
        const minutesToAward = watchTimeRef.current - lastPointsAwardedRef.current;
        if (minutesToAward >= 5) {
          awardStreamWatch.mutate({ streamId, minutesWatched: minutesToAward });
          lastPointsAwardedRef.current = watchTimeRef.current;
          console.log(`[StreamView] Awarded points for ${minutesToAward} minutes watched`);
        }
      }
    }, POINTS_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      watchTimeRef.current = 0;
      lastPointsAwardedRef.current = 0;
    };
  }, [streamId, isAuthenticated, stream?.status, awardStreamWatch]);

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

  // These useCallback hooks MUST be defined before any early returns
  // to satisfy React's rules of hooks (consistent hook order)
  const handleImmersiveSendMessage = useCallback((msg: string) => {
    if (isConnected) {
      sendMessage(msg);
    }
  }, [isConnected, sendMessage]);

  const handleImmersiveReaction = useCallback((emoji: string) => {
    if (isConnected) {
      sendMessage(`[reaction:${emoji}]`);
    }
  }, [isConnected, sendMessage]);

  const handleImmersiveTip = useCallback((amount: number, tipMsg?: string) => {
    if (streamId) {
      tipMutation.mutate({ amount, message: tipMsg });
    }
  }, [streamId, tipMutation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-ink-page safe-area-inset">
        <div className="flex flex-col lg:flex-row h-screen">
          <div className="flex-1 flex flex-col">
            <div className="h-14 bg-ink-surface border-b border-ink-divider animate-pulse" />
            <div className="flex-1 relative bg-ink-surface m-4 rounded-2xl animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-core/20 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-accent-bright animate-pulse" />
                  </div>
                  <div className="h-4 w-32 mx-auto bg-ink-raised rounded-xl mb-3" />
                  <div className="h-3 w-24 mx-auto bg-ink-raised rounded-xl" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-ink-raised rounded-xl animate-pulse" />
              <div className="h-4 w-1/2 bg-ink-raised rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block w-[380px] border-l border-accent-core/20 bg-ink-surface/40">
            <div className="p-4 border-b border-ink-edge/40">
              <div className="h-10 bg-ink-raised/30 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-8 h-8 rounded-full bg-ink-raised/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-ink-raised/40 rounded" />
                    <div className="h-3 w-full bg-ink-raised/30 rounded" />
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
      <div className="min-h-[100dvh] bg-ink-raised flex flex-col items-center justify-center gap-4 px-4 safe-area-inset">
        <div className="w-20 h-20 rounded-full bg-ink-raised/60 flex items-center justify-center mb-2">
          <Video className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="text-xl font-bold text-primary">Stream not found</h1>
        <p className="text-secondary text-center max-w-md">This stream may have ended or doesn't exist.</p>
        <Link href="/streams">
          <Button className="bg-ink-raised   mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Streams
          </Button>
        </Link>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  const isEnded = stream.status === 'ended';
  const displayViewerCount = isConnected ? viewerCount : stream.currentViewers;

  // Determine effective connection state - prioritize LiveKit over WebRTC
  const effectiveLiveKitConnected = liveKitConnected && (!!remoteVideoTrack || (isLiveKitHost && !!localVideoTrack));
  const effectiveConnectionState = effectiveLiveKitConnected
    ? 'connected'
    : liveKitConnectionState === 'connected'
      ? 'connected'
      : liveKitConnectionState === 'connecting'
        ? 'connecting'
        : videoConnectionState === 'disconnected'
          ? 'failed'
          : videoConnectionState;

  // Get the effective video track (prioritize host's local track if they're the host, otherwise remote)
  const effectiveVideoTrack = isLiveKitHost ? localVideoTrack : remoteVideoTrack;

  // Handle ended streams - show replay interface
  if (isEnded) {
    return (
      <div className="min-h-[100dvh] bg-ink-raised safe-area-inset">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="text-secondary hover:text-primary hover:bg-accent-core/20 shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <Badge className="bg-warn/20 text-warn border border-warn/30 mb-2">
                <Video className="w-3 h-3 mr-1" />
                Replay
              </Badge>
              <h1 className="text-lg sm:text-xl font-bold text-primary truncate">{stream.title}</h1>
            </div>
          </div>

          {/* Combined Host & Audio Player Card */}
          <Surface className="overflow-hidden bg-ink-raised border border-ink-edge/50 mb-6 sm:mb-8">
            {/* Avatar Hero Section */}
            <div className="relative bg-ink-raised p-6 sm:p-8">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />

              <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Large centered avatar */}
                <div className="relative">
                  <div className="absolute inset-0 bg-ink-raised rounded-full blur-2xl scale-150" />
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-ink-raised border-4 border-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
                    {stream.hostAvatar && (
                      <img
                        src={stream.hostAvatar}
                        alt={stream.hostUsername}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-4xl sm:text-5xl font-bold text-primary drop-shadow-lg select-none">
                      {(stream.hostUsername || 'A')[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Host info */}
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <p className="font-bold text-xl sm:text-2xl text-primary mb-1">{stream.hostUsername || 'Anonymous'}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                    <Badge className="bg-accent-core/20 text-accent-bright border border-accent-core/30 text-xs">
                      <Bot className="w-3 h-3 mr-1" />
                      Knowledge Avatar
                    </Badge>
                  </div>
                  {stream.description && (
                    <p className="text-sm text-secondary line-clamp-3 max-w-lg">{stream.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Player Section */}
            <div className="p-4 sm:p-6 border-t border-ink-edge/50 bg-ink-raised">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-ink-raised border border-accent-core/30 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-accent-bright" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary">Listen to Market Update</h3>
                  <p className="text-xs text-muted">AI-generated audio commentary</p>
                </div>
              </div>
              <div className="bg-ink-raised/50 rounded-xl p-3 border border-ink-edge/50">
                <audio
                  controls
                  className="w-full h-10"
                  style={{ colorScheme: 'dark' }}
                  src={`/api/streams/${stream.id}/audio`}
                  onError={(e) => {
                    const parent = (e.target as HTMLAudioElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<p class="text-center text-muted text-sm py-2">Audio not available for this replay</p>';
                    }
                  }}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          </Surface>

          {/* Back to streams button */}
          <div className="flex justify-center">
            <Link href="/replays">
              <Button className="bg-ink-raised ">
                <Video className="w-4 h-4 mr-2" />
                Browse More Replays
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isImmersiveMode && stream && isLive) {
    return (
      <ImmersiveStreamView
        streamId={stream.id}
        title={stream.title}
        hostUsername={stream.hostUsername || 'Anonymous'}
        hostAvatar={stream.hostAvatar}
        viewerCount={displayViewerCount}
        streamDuration={streamDuration}
        isLive={isLive}
        isMuted={isMuted}
        isConnected={effectiveLiveKitConnected || isConnected}
        connectionState={effectiveConnectionState}
        messages={messages.map(m => ({
          id: m.id,
          username: m.username,
          content: m.content,
          isAiAgent: m.isAiAgent,
          timestamp: m.timestamp,
          isModerator: (m as any).isModerator,
          isSubscriber: (m as any).isSubscriber,
        }))}
        videoRef={viewerVideoRef}
        remoteStream={remoteStream}
        liveKitVideoTrack={effectiveVideoTrack}
        onSendMessage={handleImmersiveSendMessage}
        onToggleMute={() => setIsMuted(!isMuted)}
        onReaction={handleImmersiveReaction}
        onTip={handleImmersiveTip}
        onExit={() => setIsImmersiveMode(false)}
        isHost={isHost}
        autoFullscreen={isHost}
      >
        {stream.isKnowledgeAvatar && (
          <AIAvatarStream
            hostName={stream.hostUsername || 'AI Host'}
            hostAvatar={stream.hostAvatar}
            streamType={stream.streamType}
            isLive={isLive}
            currentMessage={messages.length > 0 ? messages[messages.length - 1]?.content : undefined}
            viewerCount={displayViewerCount}
            onAudioMessage={onAvatarAudio}
            streamId={stream.id}
          />
        )}
      </ImmersiveStreamView>
    );
  }

  return (
    <div className={cn(
      "min-h-[100dvh] bg-ink-raised safe-area-inset flex flex-col",
      isTheaterMode && "bg-black"
    )}>
      <div className={cn(
        "border-b border-accent-core/20 bg-ink-surface/80 backdrop-blur-xl sticky top-0 z-50",
        isTheaterMode && "bg-black/90"
      )}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-secondary hover:text-primary h-9 w-9 sm:w-auto p-0 sm:px-3 hover:bg-accent-core/20"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-2">Back</span>
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <div className={cn("p-1.5 rounded-xl", config.bgColor)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <Badge variant="outline" className={cn("border-accent-core/30 text-xs", config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <>
                <Badge className="bg-loss/20 text-loss border-loss/30 text-[10px] sm:text-xs px-2">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-loss"></span>
                  </span>
                  LIVE
                </Badge>
                <Badge variant="outline" className="border-ink-edge text-body text-[10px] sm:text-xs hidden sm:flex">
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
                  ? "border-gain/30 text-gain"
                  : "border-warn/30 text-warn"
              )}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            </Badge>

            <Badge variant="outline" className="border-accent-core/30 text-accent-bright text-[10px] sm:text-xs">
              <Eye className="w-3 h-3 mr-1" />
              {formatViewers(displayViewerCount)}
            </Badge>

            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-secondary hover:text-primary h-8 w-8 p-0"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="text-secondary hover:text-primary h-8 w-8 p-0"
                data-testid="button-theater-mode"
              >
                {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {isLive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImmersiveMode(true)}
                  className="text-accent-bright hover:text-purple-300 hover:bg-accent-core/20 h-8 px-2 gap-1"
                  data-testid="button-immersive-mode"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs hidden md:inline">{isHost ? 'Preview' : 'Immersive'}</span>
                </Button>
              )}
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
          <Surface className={cn(
            "relative overflow-hidden border border-accent-core/20",
            isTheaterMode
              ? "aspect-auto h-[60dvh] sm:h-[70dvh] lg:h-[80dvh] rounded-none border-0 bg-black"
              : "aspect-video bg-ink-raised"
          )}>
            {isLive && streamId && <MarketPriceOverlay streamId={streamId} />}
            {isLive && streamId && <CoHostsDisplay streamId={streamId} />}

            {isLive && recentJoins.length > 0 && (
              <div className="absolute left-3 top-16 z-20 space-y-1">
                <ViewerPresence recentJoins={recentJoins} />
              </div>
            )}

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
                streamId={stream.id}
              />
            ) : isLive && liveKitConnected && hasLiveKitVideo ? (
              <div className="absolute inset-0">
                <LiveKitVideo
                  track={isLiveKitHost ? localVideoTrack : remoteVideoTrack}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  mirror={isLiveKitHost}
                />
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="backdrop-blur-sm text-xs px-2.5 py-1 bg-gain/80 text-primary">
                    <Wifi className="w-3 h-3 mr-1.5" />
                    Live via LiveKit
                  </Badge>
                </div>
                {liveKitParticipants > 1 && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="backdrop-blur-sm text-xs px-2.5 py-1 bg-accent-core/80 text-primary">
                      <Users className="w-3 h-3 mr-1.5" />
                      {liveKitParticipants}
                    </Badge>
                  </div>
                )}
              </div>
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
                    videoConnectionState === 'connected' ? "bg-gain/80 text-primary" :
                    videoConnectionState === 'connecting' ? "bg-accent-core/80 text-primary" :
                    videoConnectionState === 'reconnecting' ? "bg-warn/80 text-primary" :
                    "bg-loss/80 text-primary"
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
              <div className="absolute inset-0 flex items-center justify-center bg-ink-raised">
                {isLive ? (
                  <div className="text-center px-4">
                    <div className={cn(
                      "p-6 rounded-full bg-ink-raised border mb-4 inline-block",
                      config.gradient,
                      "border-white/20"
                    )}>
                      {liveKitConnectionState === 'connecting' ? (
                        <Radio className="w-12 h-12 text-primary animate-pulse" />
                      ) : liveKitError ? (
                        <WifiOff className="w-12 h-12 text-primary" />
                      ) : (
                        <Icon className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary mb-2 font-orbitron">
                      {liveKitConnectionState === 'connecting' ? 'Connecting to Stream...' :
                       liveKitError ? 'Connection Failed' :
                       liveKitConnected && !hasLiveKitVideo ? 'Waiting for Video...' : 'Stream is Live'}
                    </p>
                    <p className="text-sm text-secondary flex items-center justify-center gap-2 mb-3">
                      {liveKitConnectionState === 'connecting' ? (
                        <>
                          <Radio className="w-4 h-4 text-accent-bright animate-pulse" />
                          Establishing video connection...
                        </>
                      ) : liveKitError ? (
                        <>
                          <WifiOff className="w-4 h-4 text-loss" />
                          {liveKitError}
                        </>
                      ) : liveKitConnected && !hasLiveKitVideo ? (
                        <>
                          <Radio className="w-4 h-4 text-accent-bright animate-pulse" />
                          Waiting for broadcaster to start video...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-accent-bright" />
                          Waiting for broadcaster...
                        </>
                      )}
                    </p>
                    {liveKitError && (
                      <Button
                        onClick={() => {
                          setHasAttemptedLiveKitConnect(false);
                          connectLiveKit();
                        }}
                        className="bg-ink-raised   text-primary"
                        data-testid="button-retry-video"
                      >
                        <Radio className="w-4 h-4 mr-2" />
                        Retry Connection
                      </Button>
                    )}
                  </div>
                ) : isScheduled ? (
                  <div className="text-center px-4">
                    <div className="p-6 rounded-full bg-warn/20 border border-warn/30 mb-4 inline-block">
                      <Clock className="w-12 h-12 text-warn" />
                    </div>
                    <p className="text-lg font-bold text-primary mb-2">Stream Scheduled</p>
                    <p className="text-sm text-secondary">
                      {stream.scheduledStart
                        ? new Date(stream.scheduledStart).toLocaleString()
                        : 'Time TBD'}
                    </p>
                    <Button className="mt-4 bg-warn hover:bg-warn">
                      <Bell className="w-4 h-4 mr-2" />
                      Remind Me
                    </Button>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="p-6 rounded-full bg-ink-raised border border-ink-edge mb-4 inline-block">
                      <Video className="w-12 h-12 text-muted" />
                    </div>
                    <p className="text-lg font-bold text-secondary">Stream Ended</p>
                    <p className="text-sm text-muted mt-1">Check back for replays!</p>
                  </div>
                )}
              </div>
            )}

            {isLive && isAuthenticated && !isHost && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 flex items-center gap-1.5 sm:gap-2">
                <CreateClipButton
                  streamId={streamId || ''}
                  currentTime={streamDuration}
                />
                <Button
                  onClick={() => setShowPredictionPanel(true)}
                  className="bg-ink-raised   border-0 h-8 sm:h-10 min-h-0 sm:min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm font-medium shadow-lg shadow-fuchsia-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
                  data-testid="button-create-prediction"
                >
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Predict</span>
                </Button>
                <Button
                  onClick={() => setShowTipPanel(true)}
                  className="bg-ink-raised   border-0 h-8 sm:h-10 min-h-0 sm:min-h-[44px] px-2 sm:px-4 text-xs sm:text-sm font-medium shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
                  data-testid="button-open-tip-panel"
                >
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Tip</span>
                </Button>
              </div>
            )}

            {isTheaterMode && (
              <Button
                onClick={() => setIsFloatingChat(!isFloatingChat)}
                variant="ghost"
                size="sm"
                className="absolute bottom-3 left-3 z-10 bg-ink-surface/60 hover:bg-ink-raised/80"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isFloatingChat ? 'Hide' : 'Show'} Chat
              </Button>
            )}
          </Surface>

          {!isTheaterMode && (
            <>
              <Surface className="p-3 sm:p-4 bg-ink-surface/60 border border-ink-edge/40">
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <h1 className="text-base sm:text-xl font-bold text-primary font-orbitron line-clamp-2 flex-1">{stream.title}</h1>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="border-ink-edge/80 text-body h-10 min-h-[44px] w-10 min-w-[44px] p-0 hover:bg-ink-raised/50 hover:border-ink-edge transition-all duration-200"
                      data-testid="button-copy-link"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-gain" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-ink-edge/80 text-body h-10 min-h-[44px] w-10 min-w-[44px] p-0 hover:bg-ink-raised/50 hover:border-ink-edge transition-all duration-200"
                      data-testid="button-share-stream"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <StreamerCard stream={stream} isFollowing={false} />

                {stream.description && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ink-edge/40">
                    <p className="text-xs sm:text-sm text-secondary line-clamp-2 sm:line-clamp-none">{stream.description}</p>
                  </div>
                )}

                {stream.tags && stream.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                    {stream.tags.slice(0, 4).map((tag, i) => (
                      <Badge key={i} variant="outline" className="border-accent-core/20 text-accent-bright text-[10px] sm:text-xs px-1.5 sm:px-2">
                        #{tag}
                      </Badge>
                    ))}
                    {stream.tags.length > 4 && (
                      <>
                        {stream.tags.slice(4).map((tag, i) => (
                          <Badge key={i + 4} variant="outline" className="border-accent-core/20 text-accent-bright text-[10px] sm:text-xs px-1.5 sm:px-2 hidden sm:inline-flex">
                            #{tag}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="border-ink-edge/20 text-secondary text-[10px] px-1.5 sm:hidden">
                          +{stream.tags.length - 4}
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </Surface>

              {isLive && (
                <Surface className="p-3 sm:p-4 bg-ink-surface/60 border border-ink-edge/40">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-bright" />
                      Engage
                    </h3>

                    {isHost && (
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRecording(false)}
                            className="border-loss/30 text-loss hover:bg-loss/10 h-8 text-xs"
                          >
                            <Circle className="w-3 h-3 mr-1 fill-red-500 text-red-500 animate-pulse" />
                            {formatDuration(recordingDuration)}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsRecording(true); setRecordingDuration(0); }}
                            className="border-loss/30 text-loss hover:bg-loss/10 h-8 text-xs"
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
                            className="border-accent-core/30 text-accent-bright hover:bg-accent-core/10 h-8 text-xs"
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
                </Surface>
              )}
            </>
          )}
        </div>

        <div className={cn(
          "w-full lg:w-[380px] xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-accent-core/30",
          "lg:overflow-hidden",
          isTheaterMode && !isFloatingChat && "hidden",
          isTheaterMode && isFloatingChat && "fixed bottom-4 right-4 w-[360px] h-[500px] rounded-xl border shadow-2xl z-50 bg-ink-surface",
          !isTheaterMode && "bg-ink-raised lg:h-[calc(100vh-56px)] lg:sticky lg:top-14"
        )}>
          {isTheaterMode && isFloatingChat && (
            <div className="flex items-center justify-between p-3 border-b border-ink-edge/50">
              <span className="text-sm font-semibold text-primary">Live Chat</span>
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
            className="lg:hidden flex items-center justify-between p-4 bg-ink-raised min-h-[56px] active:bg-ink-raised/60 transition-colors"
          >
            <span className="text-base font-semibold text-primary flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-accent-core/20">
                <MessageCircle className="w-5 h-5 text-accent-bright" />
              </div>
              Live Chat
              {messages.length > 0 && (
                <Badge className="bg-accent-core/30 text-purple-300 text-xs px-2 py-0.5">
                  {messages.length}
                </Badge>
              )}
            </span>
            <div className="p-2 rounded-xl bg-ink-raised/50">
              {isChatExpanded ? (
                <ChevronDown className="w-5 h-5 text-body" />
              ) : (
                <ChevronUp className="w-5 h-5 text-body" />
              )}
            </div>
          </button>

          <div className={cn(
            "flex flex-col transition-all duration-300 ease-out overflow-hidden",
            isChatExpanded ? "min-h-[60dvh] sm:min-h-[55dvh] lg:min-h-0 lg:flex-1" : "h-0 lg:flex-1"
          )}>
            <Tabs value={chatTab} onValueChange={(v) => setChatTab(v as 'chat' | 'tips' | 'subscribe' | 'costream' | 'converse' | 'replay' | 'clips' | 'points' | 'tools')} className="flex flex-col h-full">
              <div className="hidden lg:block border-b border-ink-edge/40">
                <TabsList className="bg-transparent w-full justify-start rounded-none h-11 p-0">
                  <TabsTrigger
                    value="chat"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent-core data-[state=active]:bg-transparent text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="tips"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-warn data-[state=active]:bg-transparent text-xs"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1 text-warn" />
                    Tips
                  </TabsTrigger>
                  <TabsTrigger
                    value="subscribe"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent-core data-[state=active]:bg-transparent text-xs"
                  >
                    <Crown className="w-3.5 h-3.5 mr-1 text-accent-bright" />
                    Sub
                  </TabsTrigger>
                  <TabsTrigger
                    value="costream"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent-core data-[state=active]:bg-transparent text-xs"
                  >
                    <Radio className="w-3.5 h-3.5 mr-1 text-accent-bright" />
                    Co-Stream
                  </TabsTrigger>
                  <TabsTrigger
                    value="converse"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-gain data-[state=active]:bg-transparent text-xs"
                  >
                    <Mic className="w-3.5 h-3.5 mr-1 text-gain" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger
                    value="replay"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-400 data-[state=active]:bg-transparent text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1 text-secondary" />
                    History
                  </TabsTrigger>
                  <TabsTrigger
                    value="clips"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <Scissors className="w-3.5 h-3.5 mr-1 text-pink-400" />
                    Clips
                  </TabsTrigger>
                  <TabsTrigger
                    value="points"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-400" />
                    Points
                  </TabsTrigger>
                  {isHost && (
                    <TabsTrigger
                      value="tools"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-loss data-[state=active]:bg-transparent text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1 text-loss" />
                      Host Tools
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
                {pinnedData?.messages && pinnedData.messages.length > 0 && (
                  <div className="p-2 border-b border-ink-edge/40">
                    <PinnedMessagesBar
                      messages={pinnedData.messages}
                      onUnpin={undefined}
                    />
                  </div>
                )}

                {superChats.length > 0 && (
                  <div className="p-3 border-b border-ink-edge/40 max-h-[150px] overflow-y-auto">
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
                    <div className="text-center py-12 text-muted animate-fade-in">
                      <div className="p-4 rounded-full bg-ink-raised/50 inline-block mb-4">
                        <MessageSquare className="w-10 h-10 text-muted" />
                      </div>
                      <p className="text-sm font-medium text-secondary">No messages yet</p>
                      <p className="text-xs text-muted mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <ChatMessage key={msg.id} msg={msg as any} />
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-ink-edge/50 bg-ink-raised relative">
                  {showCommandsHelp && (
                    <ChatCommandsHelp onClose={() => setShowCommandsHelp(false)} />
                  )}
                  {isAuthenticated ? (
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCommandsHelp(!showCommandsHelp)}
                        className="h-12 w-12 min-w-[48px] min-h-[48px] p-0 text-secondary hover:text-accent-bright hover:bg-accent-core/10 flex-shrink-0 rounded-xl transition-all duration-200"
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
                          className="bg-ink-raised/70 border-2 border-ink-edge/80 text-primary text-sm h-12 rounded-xl pl-4 pr-4 focus:border-accent-core/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                          disabled={!isConnected}
                          data-testid="input-chat-message"
                        />
                      </div>
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!isConnected || !message.trim()}
                        className="bg-ink-raised   h-12 w-12 min-w-[48px] min-h-[48px] flex-shrink-0 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                        data-testid="button-send-message"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth">
                      <Button className="w-full bg-ink-raised   h-12 rounded-xl shadow-lg shadow-purple-500/25 font-semibold">
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
                          "border-warn/30 text-warn hover:bg-warn/10 h-12",
                          amount >= 100 && "border-accent-core/30 text-accent-bright hover:bg-accent-core/10"
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
                      className="bg-ink-raised/50 border-ink-edge text-primary h-11"
                      min="1"
                      data-testid="input-tip-amount"
                    />
                    <Textarea
                      placeholder="Add a message (optional)"
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      className="bg-ink-raised/50 border-ink-edge text-primary resize-none h-20"
                      data-testid="input-tip-message"
                    />
                    <Button
                      onClick={() => handleTip()}
                      disabled={!isAuthenticated || !tipAmount || tipMutation.isPending}
                      className="w-full bg-ink-raised   h-11"
                      data-testid="button-send-tip"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {tipMutation.isPending ? 'Sending...' : `Send ${tipAmount || '0'} STREAM`}
                    </Button>
                  </div>

                  {stream.totalTipsReceived > 0 && (
                    <div className="pt-4 border-t border-ink-edge/40 text-center">
                      <p className="text-2xl font-bold text-warn font-orbitron">
                        {stream.totalTipsReceived.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">STREAM received this stream</p>
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
                    <h3 className="text-lg font-bold text-primary mb-1">Subscribe to {stream.hostUsername || 'this streamer'}</h3>
                    <p className="text-xs text-secondary">Get exclusive perks and support your favorite creator</p>
                  </div>

                  <div className="p-4 rounded-xl border border-ink-edge/50 bg-ink-raised/30 hover:border-ink-edge/60 transition-colors cursor-pointer group"
                       onClick={() => toast({ title: 'Free Tier', description: 'You already have access to free content!' })}
                       data-testid="subscription-tier-free"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink-raised flex items-center justify-center">
                          <Users className="w-4 h-4 text-secondary" />
                        </div>
                        <span className="font-semibold text-primary">Free</span>
                      </div>
                      <Badge variant="outline" className="border-ink-edge text-secondary text-[10px]">Current</Badge>
                    </div>
                    <ul className="text-xs text-secondary space-y-1.5">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-gain" /> Watch all public streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-gain" /> Chat during live streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-gain" /> Basic emotes</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-accent-core/50 bg-ink-raised hover:border-accent-core/70 transition-all cursor-pointer group"
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
                        <div className="w-8 h-8 rounded-full bg-ink-raised flex items-center justify-center">
                          <Crown className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">Silver</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-accent-bright">100</span>
                        <span className="text-xs text-secondary ml-1">STREAM/mo</span>
                      </div>
                    </div>
                    <ul className="text-xs text-body space-y-1.5 mb-3">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-accent-bright" /> All Free tier perks</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-accent-bright" /> Subscriber badge in chat</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-accent-bright" /> Custom emotes (10+)</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-accent-bright" /> Ad-free viewing</li>
                    </ul>
                    <Button className="w-full bg-ink-raised   h-9 text-sm">
                      Subscribe - 100 STREAM
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-warn/50 bg-ink-raised hover:border-warn/70 transition-all cursor-pointer group relative overflow-hidden"
                       onClick={() => {
                         if (!isAuthenticated) {
                           toast({ title: 'Sign in required', description: 'Please sign in to subscribe.' });
                           return;
                         }
                         toast({ title: 'Gold Subscription', description: 'Subscribe for 500 STREAM/month to unlock gold perks!' });
                       }}
                       data-testid="subscription-tier-gold"
                  >
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-warn text-[10px] font-bold text-primary">
                      BEST VALUE
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink-raised flex items-center justify-center animate-pulse-slow">
                          <Trophy className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">Gold</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-warn">500</span>
                        <span className="text-xs text-secondary ml-1">STREAM/mo</span>
                      </div>
                    </div>
                    <ul className="text-xs text-body space-y-1.5 mb-3">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-warn" /> All Silver tier perks</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-warn" /> Priority chat messages</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-warn" /> Access subscriber-only streams</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-warn" /> Exclusive Discord role</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-warn" /> Monthly shoutout on stream</li>
                    </ul>
                    <Button className="w-full bg-ink-raised   h-9 text-sm text-primary font-semibold">
                      Subscribe - 500 STREAM
                    </Button>
                  </div>

                  <p className="text-[10px] text-muted text-center pt-2">
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

              <TabsContent value="converse" className="flex-1 flex flex-col m-0 overflow-hidden">
                {isAuthenticated && streamId ? (
                  <ConversationPanel
                    streamId={streamId}
                    userId={user?.id?.toString()}
                    isHost={isHost}
                    className="h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Mic className="w-12 h-12 text-gain/50 mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">Voice Conversation</h3>
                    <p className="text-sm text-secondary mb-4">
                      Join the live voice conversation with the host and other viewers
                    </p>
                    {!isAuthenticated && (
                      <Link href="/auth">
                        <Button className="bg-ink-raised ">
                          Sign in to Join
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="replay" className="flex-1 flex flex-col m-0 overflow-hidden">
                {streamId ? (
                  <ConversationReplay
                    streamId={streamId}
                    className="h-full border-0"
                    limit={100}
                    hostName={stream?.hostUsername || 'AI Host'}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Clock className="w-12 h-12 text-secondary/50 mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">Conversation History</h3>
                    <p className="text-sm text-secondary">
                      View past voice conversations from this stream
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clips" className="flex-1 flex flex-col m-0 overflow-y-auto">
                {streamId && <ClipsGallery streamId={streamId} />}
              </TabsContent>

              <TabsContent value="points" className="flex-1 flex flex-col m-0 overflow-y-auto">
                {streamId && (
                  <div className="space-y-4">
                    <ChannelPointsPanel streamId={streamId} userPoints={user?.streamPoints || 0} isHost={isHost} />
                    {isAuthenticated && (
                      <GiftSubscriptionPanel streamId={streamId} streamerId={stream?.hostId?.toString() || ''} streamerUsername={stream?.hostUsername || 'Streamer'} />
                    )}
                  </div>
                )}
              </TabsContent>

              {isHost && (
                <TabsContent value="tools" className="flex-1 flex flex-col m-0 overflow-y-auto">
                  {streamId && (
                    <div className="space-y-4 p-4">
                      <RaidPanel
                        streamId={streamId}
                        isHost={isHost}
                        currentViewers={stream?.currentViewers || 0}
                      />
                      <ChatModerationPanel
                        streamId={streamId}
                        isHost={true}
                      />
                      <StreamAnalyticsPanel streamId={streamId} />
                    </div>
                  )}
                </TabsContent>
              )}
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
            className="bg-ink-surface border border-ink-edge rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Gift className="w-5 h-5 text-warn" />
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
                      ? "bg-warn/20 border-warn text-warn"
                      : "border-ink-edge text-body"
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
              className="bg-ink-raised/50 border-ink-edge text-primary h-12"
              min="1"
            />

            <Textarea
              placeholder="Add a message (shows on stream if 100+ STREAM)"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="bg-ink-raised/50 border-ink-edge text-primary resize-none h-24"
            />

            <Button
              onClick={() => handleTip()}
              disabled={!tipAmount || tipMutation.isPending}
              className="w-full bg-ink-raised   h-12 text-lg"
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
            className="bg-ink-surface border border-ink-edge rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-bright" />
                Make a Prediction
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPredictionPanel(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-secondary">
              Share your market prediction. If the community likes it, it might become a prediction market!
            </p>

            <Textarea
              placeholder="e.g., BTC will reach $100k by end of Q1 2025"
              value={predictionText}
              onChange={(e) => setPredictionText(e.target.value)}
              className="bg-ink-raised/50 border-ink-edge text-primary resize-none h-28"
            />

            <Button
              onClick={handleCreatePrediction}
              disabled={!predictionText.trim() || predictionMutation.isPending}
              className="w-full bg-ink-raised   h-12"
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
