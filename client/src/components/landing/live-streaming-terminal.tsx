import { useState } from 'react';
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
  Target,
  Headphones,
  Radio,
  Zap,
  Mic,
  Brain,
  Shield,
  Wallet,
  BarChart3,
  Rocket,
  Globe,
  Hexagon,
  Sparkles,
  Waves
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
    color: 'from-fuchsia-500 to-purple-500',
    textColor: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-500/30',
    shadowColor: 'shadow-fuchsia-500/20',
    glowColor: 'rgba(217, 70, 239, 0.4)',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading',
    color: 'from-cyan-500 to-blue-500',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    shadowColor: 'shadow-cyan-500/20',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  audio_space: {
    icon: Headphones,
    label: 'Spaces',
    color: 'from-violet-500 to-purple-500',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    shadowColor: 'shadow-violet-500/20',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  live_bounty: {
    icon: Target,
    label: 'Bounties',
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    shadowColor: 'shadow-amber-500/20',
    glowColor: 'rgba(245, 158, 11, 0.4)',
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
    <div
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      onClick={handleJoin}
      data-testid={`stream-card-${stream.id}`}
    >
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300">
        <div 
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${config.glowColor}, transparent 50%, ${config.glowColor})`,
            filter: 'blur(1px)',
          }}
        />
        
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950/90 backdrop-blur-xl" />
        
        <div className="absolute inset-[1px] rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
          
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${config.glowColor.replace('0.4', '0.15')}, transparent 70%)`,
            }}
          />
        </div>
        
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r transition-all duration-300",
          config.color,
          "group-hover:h-[3px] group-hover:shadow-lg",
        )} 
        style={{ boxShadow: `0 0 20px ${config.glowColor}` }}
        />
        
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "relative p-2 rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110", 
                config.color
              )}
              style={{ boxShadow: `0 4px 20px ${config.glowColor}` }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              {stream.status === 'live' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-60 animate-pulse" />
                  <Badge className="relative bg-red-500/90 text-white border-0 text-[10px] px-2.5 py-1 font-bold shadow-lg shadow-red-500/40">
                    <span className="relative flex h-1.5 w-1.5 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    LIVE
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm group-hover:border-fuchsia-500/30 transition-colors">
              <Eye className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="font-semibold text-fuchsia-300">{stream.currentViewers}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-white text-sm mb-4 line-clamp-2 group-hover:text-fuchsia-100 transition-colors leading-snug min-h-[2.5rem]">
            {stream.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {(() => {
                const brandFallback = getAvatarFallback(stream.hostUsername);
                const BrandIcon = brandFallback?.icon;
                const showBrandIcon = brandFallback != null;
                
                if (showBrandIcon && BrandIcon) {
                  return (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-700/50 group-hover:ring-fuchsia-500/30 transition-all", 
                      brandFallback.bgColor
                    )}>
                      <BrandIcon className={cn("w-4 h-4", brandFallback.color)} />
                    </div>
                  );
                }
                return (
                  <img 
                    src={getDiceBearAvatar(stream.hostUsername)} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-slate-700/50 group-hover:ring-fuchsia-500/30 transition-all"
                  />
                );
              })()}
              <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">@{stream.hostUsername || 'anon'}</span>
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
                "h-9 px-4 text-xs font-bold rounded-xl border-0 transition-all duration-300",
                "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-[length:200%_100%]",
                "hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-fuchsia-500/40 hover:scale-105",
                "active:scale-95"
              )}
            >
              {isNavigating ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Join
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduledCard({ stream }: { stream: LiveStream }) {
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  const [, setLocation] = useLocation();
  const config = streamTypeConfig[stream.streamType];
  
  return (
    <div 
      onClick={() => setLocation(`/stream/${stream.id}`)}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-800/40 border border-slate-700/40 hover:border-fuchsia-500/40 cursor-pointer transition-all duration-300 group hover:bg-slate-800/80 backdrop-blur-sm"
      data-testid={`scheduled-stream-${stream.id}`}
    >
      <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg", config.color)}>
        <Calendar className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-fuchsia-200 transition-colors">{stream.title}</h4>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          {scheduledDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) || 'TBD'}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
    </div>
  );
}

export function LiveStreamingTerminal() {
  const [activeTab, setActiveTab] = useState<StreamType>('broadcast');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: streamsData, isLoading } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 30000,
    staleTime: 15000,
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
    <section className="pt-20 pb-10 sm:pb-16 px-4" data-testid="streaming-section">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          <div className="absolute top-20 -left-20 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stream-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="rgba(217, 70, 239, 0.3)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stream-grid)" />
            </svg>
          </div>
          
          <div 
            className="absolute -inset-[1px] rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.5) 0%, rgba(6, 182, 212, 0.3) 50%, rgba(139, 92, 246, 0.5) 100%)',
              padding: '1px',
            }}
          />
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          <div className="relative m-[1px] rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 overflow-hidden">
            <div className="absolute top-0 left-1/4 right-1/4 h-60 bg-gradient-to-b from-fuchsia-500/20 via-purple-500/10 to-transparent blur-3xl" />
            
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(217, 70, 239, 0.1) 2px, rgba(217, 70, 239, 0.1) 4px)`
            }} />
            
            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-fuchsia-600 shadow-2xl shadow-fuchsia-500/40">
                      <Radio className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
                      StreamAiX Live
                      <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-fuchsia-400" />
                      AI-powered voice conversations & trading rooms
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-red-500/30 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-950/80 to-red-900/60 border border-red-500/40 backdrop-blur-sm">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-4 h-4 rounded-full bg-red-500 animate-ping opacity-40" />
                        <span className="relative w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                      </div>
                      <span className="text-sm font-bold text-red-400">{totalLive} Live</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-cyan-900/40 border border-cyan-500/30 backdrop-blur-sm">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-cyan-400">{totalViewers.toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    onClick={handleGoLive}
                    data-testid="go-live-button"
                    className="relative h-11 px-6 overflow-hidden bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold border-0 shadow-xl shadow-fuchsia-500/40 hover:shadow-2xl hover:shadow-fuchsia-500/50 transition-all duration-500 rounded-xl group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Video className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">Go Live</span>
                  </Button>
                </div>
              </div>
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 rounded-2xl blur-xl" />
                <div className="relative flex gap-1.5 p-2 rounded-2xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-inner">
                  {streamTypes.map((type) => {
                    const config = streamTypeConfig[type];
                    const Icon = config.icon;
                    const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                    const isActive = activeTab === type;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        data-testid={`tab-${type}`}
                        className={cn(
                          "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300",
                          isActive 
                            ? "text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                      >
                        {isActive && (
                          <>
                            <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-r shadow-lg", config.color)} />
                            <div 
                              className="absolute inset-0 rounded-xl opacity-60"
                              style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
                            />
                          </>
                        )}
                        <Icon className={cn("w-4 h-4 relative z-10", isActive && "drop-shadow-lg")} />
                        <span className="hidden sm:inline relative z-10">{config.label}</span>
                        {count > 0 && (
                          <span className={cn(
                            "relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center transition-colors",
                            isActive 
                              ? "bg-white/25 text-white shadow-inner" 
                              : "bg-slate-700/80 text-slate-300"
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="transition-all duration-300">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="relative h-40 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 animate-pulse" />
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fuchsia-500/50 to-purple-500/50" />
                        <div className="absolute inset-0 border border-slate-700/30 rounded-2xl" />
                      </div>
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
                    <div className="relative flex flex-col items-center justify-center p-10 rounded-2xl overflow-hidden backdrop-blur-xl text-center group">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60" />
                      <div className="absolute inset-[1px] rounded-2xl border border-slate-700/40" />
                      <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative mb-5">
                        <div className={cn("absolute -inset-4 bg-gradient-to-br rounded-3xl blur-2xl opacity-50 animate-pulse", streamTypeConfig[activeTab].color)} />
                        <div className={cn("relative p-5 rounded-2xl bg-gradient-to-br shadow-2xl", streamTypeConfig[activeTab].color)}
                          style={{ boxShadow: `0 8px 40px ${streamTypeConfig[activeTab].glowColor}` }}
                        >
                          {(() => {
                            const Icon = streamTypeConfig[activeTab].icon;
                            return <Icon className="w-8 h-8 text-white" />;
                          })()}
                        </div>
                      </div>
                      <p className="relative text-sm text-slate-400 mb-5">No {streamTypeConfig[activeTab].label.toLowerCase()} live right now</p>
                      <Button 
                        onClick={handleGoLive}
                        data-testid="be-first-button"
                        className="relative overflow-hidden bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-[length:200%_100%] hover:bg-[position:100%_0] border-0 shadow-xl shadow-fuchsia-500/30 rounded-xl font-bold transition-all duration-500 group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                        <Zap className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Be the First</span>
                      </Button>
                    </div>
                    
                    {filteredScheduled.length > 0 && (
                      <div className="relative p-6 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60" />
                        <div className="absolute inset-[1px] rounded-2xl border border-slate-700/40" />
                        
                        <h4 className="relative text-sm font-bold text-white mb-5 flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          Coming Up
                        </h4>
                        <div className="relative space-y-2.5">
                          {filteredScheduled.slice(0, 3).map((stream) => (
                            <ScheduledCard key={stream.id} stream={stream} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-700/40">
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { icon: Mic, label: 'Voice Chat', color: 'fuchsia' },
                    { icon: Brain, label: 'AI Avatars', color: 'cyan' },
                    { icon: Waves, label: 'Real-time', color: 'purple' },
                  ].map(({ icon: FeatureIcon, label, color }) => (
                    <span 
                      key={label}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl cursor-default transition-all duration-300 hover:scale-105",
                        `bg-gradient-to-r from-${color}-500/15 to-${color}-500/5`,
                        `border border-${color}-500/25 hover:border-${color}-500/40`
                      )}
                      style={{
                        background: `linear-gradient(135deg, rgba(var(--${color}-rgb, 217, 70, 239), 0.15), rgba(var(--${color}-rgb, 217, 70, 239), 0.05))`,
                      }}
                    >
                      <FeatureIcon className={cn("w-4 h-4", `text-${color}-400`)} />
                      <span className={cn("text-xs font-medium", `text-${color}-300`)}>{label}</span>
                    </span>
                  ))}
                </div>
                
                <Link href="/streams">
                  <Button 
                    variant="ghost"
                    className="text-sm text-slate-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 gap-2 rounded-xl font-medium transition-all group"
                    data-testid="view-all-streams"
                  >
                    View All Streams
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
