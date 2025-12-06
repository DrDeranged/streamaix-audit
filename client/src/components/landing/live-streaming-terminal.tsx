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
  Wifi
} from 'lucide-react';
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
    color: 'from-purple-500 to-fuchsia-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading',
    color: 'from-emerald-500 to-cyan-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  audio_space: {
    icon: Headphones,
    label: 'Spaces',
    color: 'from-cyan-500 to-blue-500',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  live_bounty: {
    icon: Target,
    label: 'Bounties',
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
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
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={handleJoin}
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/40 transition-all duration-300 shadow-xl hover:shadow-purple-500/10">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top accent line */}
        <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", config.color)} />
        
        <div className="relative p-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br", config.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {stream.status === 'live' && (
                <Badge className="bg-red-500/90 text-white border-0 text-[10px] px-2 py-0.5 font-semibold shadow-lg shadow-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/50 px-2 py-1 rounded-lg">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-medium">{stream.currentViewers}</span>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-white text-sm mb-3 line-clamp-2 group-hover:text-purple-200 transition-colors leading-tight">
            {stream.title}
          </h3>
          
          {/* Footer Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow-lg", config.color)}>
                {stream.hostUsername?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-xs text-slate-400 font-medium">@{stream.hostUsername || 'anon'}</span>
            </div>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
              disabled={isNavigating}
              className={cn(
                "h-8 px-4 text-xs font-semibold rounded-xl bg-gradient-to-r border-0 shadow-lg transition-all",
                config.color,
                "hover:shadow-xl hover:brightness-110"
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
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-purple-500/30 cursor-pointer transition-all duration-200 group"
    >
      <div className={cn("p-2 rounded-lg bg-gradient-to-br", config.color, "opacity-80")}>
        <Calendar className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-purple-200 transition-colors">{stream.title}</h4>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          {scheduledDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) || 'TBD'}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
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
    <section className="py-10 sm:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Main Container with enhanced glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-950/40 to-slate-900/95" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-purple-500/50 via-fuchsia-500/30 to-cyan-500/50" />
          
          {/* Inner content container */}
          <div className="relative m-[1px] rounded-3xl bg-slate-900/80 overflow-hidden">
            {/* Top glow accent */}
            <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-gradient-to-b from-purple-500/20 via-fuchsia-500/10 to-transparent blur-2xl" />
            
            <div className="relative p-5 sm:p-8">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl blur-lg opacity-60 animate-pulse" />
                    <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                      StreamAiX Live
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">Real-time broadcasts & trading rooms</p>
                  </div>
                </div>
                
                {/* Stats and Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Live indicator */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping opacity-50" />
                      <span className="relative w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-red-400">{totalLive} Live</span>
                  </div>
                  
                  {/* Viewers */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">{totalViewers}</span>
                  </div>
                  
                  {/* Go Live Button */}
                  <Button 
                    onClick={handleGoLive}
                    className="h-10 px-5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 text-white font-semibold border-0 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all rounded-xl"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                </div>
              </div>
              
              {/* Tab Navigation */}
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
              
              {/* Content Area */}
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
                        <div key={i} className="h-36 rounded-2xl bg-slate-800/30 animate-pulse" />
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
                      {/* Empty State */}
                      <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center">
                        <div className="relative mb-4">
                          <div className={cn("absolute inset-0 bg-gradient-to-br rounded-2xl blur-lg opacity-40", streamTypeConfig[activeTab].color)} />
                          <div className={cn("relative p-4 rounded-2xl bg-gradient-to-br", streamTypeConfig[activeTab].color)}>
                            {(() => {
                              const Icon = streamTypeConfig[activeTab].icon;
                              return <Icon className="w-7 h-7 text-white" />;
                            })()}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">No {streamTypeConfig[activeTab].label.toLowerCase()} live right now</p>
                        <Button 
                          onClick={handleGoLive}
                          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-purple-500/20 rounded-xl"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Be the First
                        </Button>
                      </div>
                      
                      {/* Upcoming */}
                      {filteredScheduled.length > 0 && (
                        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-fuchsia-400" />
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
              
              {/* Footer Features */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-700/30">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300">AI Summaries</span>
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300">Predictions</span>
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300">STREAM Tips</span>
                  </span>
                </div>
                
                <Link href="/streams">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1.5" />
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

export default LiveStreamingTerminal;
