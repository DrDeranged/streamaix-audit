import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  Video, 
  Users, 
  Eye, 
  TrendingUp, 
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Target,
  Coins,
  Headphones,
  Radio,
  Zap,
  ArrowRight,
  Mic,
  MessageSquare,
  History,
  Brain,
  Wifi,
  Shield,
  Wallet,
  BarChart3,
  Rocket,
  Globe,
  Hexagon
} from 'lucide-react';
import { 
  SiEthereum, 
  SiX, 
  SiOpenai,
  SiSolana,
  SiBitcoin,
  SiCoinbase,
  SiPolkadot,
  SiCardano
} from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type StreamType = 'broadcast' | 'trading_room' | 'audio_space' | 'live_bounty';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamType: StreamType;
  hostId: string;
  hostUsername?: string;
  hostAvatar?: string;
  status: string;
  currentViewers: number;
  totalTipsReceived: number;
  category?: string;
  tags?: string[];
  linkedBountyId?: string;
  linkedMarketId?: string;
  scheduledStart?: string;
  actualStart?: string;
  roomId?: string;
}

const streamTypeConfig = {
  broadcast: {
    icon: Video,
    label: 'Broadcasts',
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    shadowColor: 'shadow-amber-500/20',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading',
    color: 'from-cyan-500 to-blue-500',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    shadowColor: 'shadow-cyan-500/20',
  },
  audio_space: {
    icon: Headphones,
    label: 'Spaces',
    color: 'from-violet-500 to-purple-500',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    shadowColor: 'shadow-violet-500/20',
  },
  live_bounty: {
    icon: Target,
    label: 'Bounties',
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    shadowColor: 'shadow-amber-500/20',
  },
};

const avatarBrandIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Hayden Adams': { icon: Hexagon, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'Vitalik Buterin': { icon: SiEthereum, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Gavin Wood': { icon: SiPolkadot, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'Anatoly Yakovenko': { icon: SiSolana, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Brian Armstrong': { icon: SiCoinbase, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Jesse Powell': { icon: Wallet, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Sam Altman': { icon: SiOpenai, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  'Elon Musk': { icon: SiX, color: 'text-white', bgColor: 'bg-slate-700' },
  'Stani Kulechov': { icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'Arthur Hayes': { icon: BarChart3, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  'Andre Cronje': { icon: Rocket, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Charles Hoskinson': { icon: SiCardano, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Justin Sun': { icon: Zap, color: 'text-red-500', bgColor: 'bg-red-500/20' },
  'Marc Andreessen': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Chris Dixon': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Anthony Pompliano': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Adam Back': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Brad Garlinghouse': { icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Katie Haun': { icon: Shield, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Robert Leshner': { icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  'Naval Ravikant': { icon: Brain, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'Cameron Winklevoss': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Tyler Winklevoss': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Balaji Srinivasan': { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Cathie Wood': { icon: TrendingUp, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'Jesse Pollak': { icon: SiCoinbase, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Paul Graham': { icon: Rocket, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Michael Saylor': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Jack Dorsey': { icon: SiX, color: 'text-white', bgColor: 'bg-slate-700' },
  'Raoul Pal': { icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
};

const getAvatarFallback = (username?: string) => {
  if (!username) return null;
  return avatarBrandIcons[username] || null;
};

const getDiceBearAvatar = (username?: string) => {
  if (!username) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
};

function StreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join live streams",
      });
      setLocation('/auth');
      return;
    }
    setIsNavigating(true);
    setLocation(`/stream/${stream.id}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={handleJoin}
      data-testid={`stream-card-${stream.id}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 hover:border-amber-500/40 transition-all duration-300 shadow-xl hover:shadow-amber-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", config.color)} />
        
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br shadow-lg", config.color, config.shadowColor)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {stream.status === 'live' && (
                <Badge className="bg-red-500/90 text-white border-0 text-[10px] px-2 py-0.5 font-semibold shadow-lg shadow-red-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/30">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-amber-300">{stream.currentViewers}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-white text-sm mb-3 line-clamp-2 group-hover:text-amber-200 transition-colors leading-tight">
            {stream.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const brandFallback = getAvatarFallback(stream.hostUsername);
                const BrandIcon = brandFallback?.icon;
                const showBrandIcon = brandFallback != null;
                
                if (showBrandIcon && BrandIcon) {
                  return (
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shadow-lg", brandFallback.bgColor)}>
                      <BrandIcon className={cn("w-4 h-4", brandFallback.color)} />
                    </div>
                  );
                }
                return (
                  <img 
                    src={getDiceBearAvatar(stream.hostUsername)} 
                    alt="" 
                    className="w-7 h-7 rounded-full object-cover shadow-lg"
                  />
                );
              })()}
              <span className="text-xs text-slate-400 font-medium">@{stream.hostUsername || 'anon'}</span>
            </div>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
              disabled={isNavigating}
              data-testid={`join-stream-${stream.id}`}
              className={cn(
                "h-8 px-4 text-xs font-semibold rounded-xl bg-gradient-to-r border-0 shadow-lg transition-all",
                "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
                "hover:shadow-xl hover:shadow-amber-500/30"
              )}
            >
              {isNavigating ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1.5 fill-current" />
                  Join
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScheduledCard({ stream }: { stream: LiveStream }) {
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  const [, setLocation] = useLocation();
  const config = streamTypeConfig[stream.streamType];
  
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      onClick={() => setLocation(`/stream/${stream.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/30 cursor-pointer transition-all duration-200 group"
      data-testid={`scheduled-stream-${stream.id}`}
    >
      <div className={cn("p-2 rounded-lg bg-gradient-to-br", config.color, "opacity-80")}>
        <Calendar className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-amber-200 transition-colors">{stream.title}</h4>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          {scheduledDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) || 'TBD'}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
    </motion.div>
  );
}

export function LiveStreamingTerminal() {
  const [activeTab, setActiveTab] = useState<StreamType>('broadcast');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: streamsData, isLoading } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 10000,
  });
  
  const { data: scheduledData } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/scheduled'],
    refetchInterval: 30000,
  });
  
  const liveStreams = streamsData?.streams || [];
  const scheduledStreams = scheduledData?.streams || [];
  
  const filteredLiveStreams = liveStreams.filter(s => s.streamType === activeTab && s.status === 'live');
  const filteredScheduled = scheduledStreams.filter(s => s.streamType === activeTab);
  
  const totalLive = liveStreams.filter(s => s.status === 'live').length;
  const totalViewers = liveStreams.reduce((acc, s) => acc + (s.currentViewers || 0), 0);
  
  const streamTypes: StreamType[] = ['broadcast', 'trading_room', 'audio_space', 'live_bounty'];

  const handleGoLive = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start streaming",
      });
      setLocation('/auth');
      return;
    }
    setLocation('/go-live');
  };
  
  return (
    <section className="py-10 sm:py-16 px-4" data-testid="streaming-section">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-amber-950/20 to-slate-900/95" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-amber-500/50 via-cyan-500/30 to-amber-500/50" />
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          
          <div className="relative m-[1px] rounded-3xl bg-slate-900/80 overflow-hidden">
            <div className="absolute top-0 left-1/4 right-1/4 h-40 bg-gradient-to-b from-amber-500/15 via-cyan-500/10 to-transparent blur-3xl" />
            
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.1) 2px, rgba(16, 185, 129, 0.1) 4px)`
            }} />
            
            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-amber-200 to-cyan-200 bg-clip-text text-transparent">
                      StreamAiX Live
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-amber-400" />
                      AI-powered voice conversations & trading rooms
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-amber-500/20">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping opacity-50" />
                      <span className="relative w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-red-400">{totalLive} Live</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-cyan-500/20">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">{totalViewers}</span>
                  </div>
                  
                  <Button 
                    onClick={handleGoLive}
                    data-testid="go-live-button"
                    className="h-10 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-white font-semibold border-0 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all rounded-xl"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-1 p-1.5 mb-6 rounded-2xl bg-slate-800/50 border border-slate-700/30 backdrop-blur-sm">
                {streamTypes.map((type) => {
                  const config = streamTypeConfig[type];
                  const Icon = config.icon;
                  const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                  const isActive = activeTab === type;
                  
                  return (
                    <motion.button
                      key={type}
                      onClick={() => setActiveTab(type)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`tab-${type}`}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                        isActive 
                          ? cn("bg-gradient-to-r text-white shadow-lg", config.color)
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{config.label}</span>
                      {count > 0 && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-slate-700 text-slate-300"
                        )}>
                          {count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-800/10 animate-pulse border border-slate-700/20" />
                      ))}
                    </div>
                  ) : filteredLiveStreams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLiveStreams.slice(0, 6).map((stream) => (
                        <StreamCard key={stream.id} stream={stream} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center backdrop-blur-sm">
                        <div className="relative mb-4">
                          <div className={cn("absolute inset-0 bg-gradient-to-br rounded-2xl blur-xl opacity-40", streamTypeConfig[activeTab].color)} />
                          <div className={cn("relative p-4 rounded-2xl bg-gradient-to-br shadow-lg", streamTypeConfig[activeTab].color)}>
                            {(() => {
                              const Icon = streamTypeConfig[activeTab].icon;
                              return <Icon className="w-7 h-7 text-white" />;
                            })()}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">No {streamTypeConfig[activeTab].label.toLowerCase()} live right now</p>
                        <Button 
                          onClick={handleGoLive}
                          data-testid="be-first-button"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 shadow-lg shadow-amber-500/20 rounded-xl"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Be the First
                        </Button>
                      </div>
                      
                      {filteredScheduled.length > 0 && (
                        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm">
                          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            Coming Up
                          </h4>
                          <div className="space-y-2">
                            {filteredScheduled.slice(0, 3).map((stream) => (
                              <ScheduledCard key={stream.id} stream={stream} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-700/30">
                <div className="flex flex-wrap items-center gap-3">
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 cursor-default"
                  >
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium">Voice Chat</span>
                  </motion.span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 cursor-default"
                  >
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-300 font-medium">AI Insights</span>
                  </motion.span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 border border-violet-500/20 cursor-default"
                  >
                    <History className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs text-violet-300 font-medium">Replay</span>
                  </motion.span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 cursor-default"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium">STREAM Tips</span>
                  </motion.span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-rose-500/5 border border-rose-500/20 cursor-default"
                  >
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs text-rose-300 font-medium">Predictions</span>
                  </motion.span>
                </div>
                
                <Link href="/streams">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    data-testid="view-all-streams"
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl font-medium"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/5 via-cyan-500/5 to-amber-500/5 border border-amber-500/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Real-Time AI Voice Conversations</h4>
                      <p className="text-xs text-slate-400">Talk directly with Knowledge Avatars using your microphone</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium px-2 py-1 rounded-lg bg-amber-500/10">
                      <Wifi className="w-3 h-3" />
                      WebSocket
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium px-2 py-1 rounded-lg bg-cyan-500/10">
                      <Sparkles className="w-3 h-3" />
                      GPT-4o
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-violet-400 font-medium px-2 py-1 rounded-lg bg-violet-500/10">
                      <MessageSquare className="w-3 h-3" />
                      TTS
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LiveStreamingTerminal;
