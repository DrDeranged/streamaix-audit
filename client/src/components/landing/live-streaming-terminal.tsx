import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
    color: 'purple',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading',
    color: 'fuchsia',
  },
  audio_space: {
    icon: Headphones,
    label: 'Spaces',
    color: 'cyan',
  },
  live_bounty: {
    icon: Target,
    label: 'Bounties',
    color: 'amber',
  },
};

function StreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/streams/${stream.id}/join`, { method: 'POST' });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Joined stream!",
        description: `You're now watching "${stream.title}"`,
      });
      setLocation(`/stream/${stream.id}`);
    },
    onError: () => {
      if (!isAuthenticated) {
        setLocation('/auth');
      } else {
        toast({
          title: "Couldn't join stream",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  });

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join live streams",
      });
      setLocation('/auth');
      return;
    }
    joinMutation.mutate();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-950/30 to-slate-900/90 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30">
                <Icon className="w-4 h-4 text-purple-400" />
              </div>
              {stream.status === 'live' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Eye className="w-3 h-3" />
              {stream.currentViewers}
            </div>
          </div>
          
          <h3 className="font-semibold text-white text-sm mb-2 line-clamp-1 group-hover:text-purple-200 transition-colors">
            {stream.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                {stream.hostUsername?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-xs text-slate-400">@{stream.hostUsername || 'anon'}</span>
            </div>
            
            <Button
              size="sm"
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="h-7 px-3 text-xs bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border-0"
            >
              {joinMutation.isPending ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  Join
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ScheduledCard({ stream }: { stream: LiveStream }) {
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  const [, setLocation] = useLocation();
  
  return (
    <div 
      onClick={() => setLocation(`/stream/${stream.id}`)}
      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-purple-500/10 hover:border-purple-400/30 cursor-pointer transition-colors"
    >
      <div className="p-2 rounded-lg bg-purple-500/10">
        <Calendar className="w-4 h-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{stream.title}</h4>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {scheduledDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) || 'TBD'}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500" />
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
    <section className="py-12 px-4 bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950">
      <div className="max-w-5xl mx-auto">
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 border border-purple-500/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-cyan-500/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          <div className="relative p-5 md:p-6">
            {/* Header - Compact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 border border-purple-400/40">
                  <Radio className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    StreamAiX Live
                  </h2>
                  <p className="text-xs text-slate-500">Real-time broadcasts & trading rooms</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
                  {totalLive} Live
                </Badge>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {totalViewers}
                </Badge>
                <Button 
                  onClick={handleGoLive}
                  size="sm"
                  className="h-8 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-semibold border-0 shadow-lg shadow-purple-500/20"
                >
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Go Live
                </Button>
              </div>
            </div>
            
            {/* Tabs - Compact Horizontal */}
            <div className="flex gap-1 p-1 mb-4 rounded-lg bg-slate-900/50 border border-purple-500/10">
              {streamTypes.map((type) => {
                const config = streamTypeConfig[type];
                const Icon = config.icon;
                const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                const isActive = activeTab === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                      isActive 
                        ? "bg-gradient-to-r from-purple-600/50 to-fuchsia-600/50 text-white border border-purple-400/30" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        isActive ? "bg-white/20" : "bg-purple-500/20 text-purple-400"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 rounded-lg bg-slate-800/30 animate-pulse" />
                    ))}
                  </div>
                ) : filteredLiveStreams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredLiveStreams.slice(0, 6).map((stream) => (
                      <StreamCard key={stream.id} stream={stream} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Empty State */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-900/50 border border-purple-500/10 text-center">
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 mb-3">
                        {(() => {
                          const Icon = streamTypeConfig[activeTab].icon;
                          return <Icon className="w-6 h-6 text-purple-400" />;
                        })()}
                      </div>
                      <p className="text-sm text-slate-400 mb-3">No {streamTypeConfig[activeTab].label.toLowerCase()} live</p>
                      <Button 
                        onClick={handleGoLive}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border-0"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1.5" />
                        Start Streaming
                      </Button>
                    </div>
                    
                    {/* Upcoming */}
                    {filteredScheduled.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-purple-500/10">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
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
            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-purple-500/10">
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  AI summaries
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-cyan-400" />
                  Prediction markets
                </span>
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  STREAM tipping
                </span>
              </div>
              
              <Link href="/streams">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default LiveStreamingTerminal;
