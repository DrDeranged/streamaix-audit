import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Video, 
  Mic, 
  Radio, 
  Target, 
  Users, 
  Eye, 
  TrendingUp, 
  MessageCircle,
  Coins,
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Signal,
  Bot,
  Crown,
  BarChart3,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
}

const streamTypeConfig = {
  broadcast: {
    icon: Video,
    label: 'Creator Broadcasts',
    description: 'Live insights & AMAs',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-900/40 to-blue-900/40',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading Rooms',
    description: 'Watch & learn live trades',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-900/40 to-green-900/40',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
  },
  audio_space: {
    icon: Headphones,
    label: 'Crypto Spaces',
    description: 'Audio discussions',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-900/40 to-pink-900/40',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/20',
  },
  live_bounty: {
    icon: Target,
    label: 'Live Bounties',
    description: 'Collaborative sessions',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-900/40 to-orange-900/40',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/20',
  },
};

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Live</span>
    </div>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "bg-gradient-to-br",
        config.bgGradient,
        "border-2",
        config.borderColor,
        "hover:shadow-lg",
        config.glowColor,
        "transition-all duration-300 cursor-pointer"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              `bg-${config.color}-500/20`,
              `border border-${config.color}-500/30`
            )}>
              <Icon className={`w-4 h-4 text-${config.color}-400`} />
            </div>
            {stream.status === 'live' && <LiveBadge />}
          </div>
          
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{stream.currentViewers.toLocaleString()}</span>
          </div>
        </div>
        
        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-cyan-200 transition-colors">
          {stream.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
            {stream.hostUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs text-slate-400">@{stream.hostUsername || 'anonymous'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stream.totalTipsReceived > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Coins className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-semibold text-amber-300">{stream.totalTipsReceived.toLocaleString()}</span>
              </div>
            )}
            {stream.category && (
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                {stream.category}
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            className={cn(
              "h-7 px-3 text-xs font-semibold",
              `bg-gradient-to-r ${config.gradient}`,
              "hover:opacity-90 transition-opacity"
            )}
          >
            {stream.status === 'live' ? 'Join' : 'View'}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyStateCard({ type }: { type: StreamType }) {
  const config = streamTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-6 text-center",
      "bg-gradient-to-br from-slate-900/60 to-slate-800/40",
      "border border-slate-700/50"
    )}>
      <div className={cn(
        "w-12 h-12 mx-auto mb-3 rounded-xl",
        `bg-${config.color}-500/10`,
        `border border-${config.color}-500/20`,
        "flex items-center justify-center"
      )}>
        <Icon className={`w-6 h-6 text-${config.color}-400/60`} />
      </div>
      <p className="text-sm text-slate-400 mb-3">No {config.label.toLowerCase()} live right now</p>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "border-slate-600 hover:border-slate-500",
          "text-slate-300 hover:text-white"
        )}
      >
        <Play className="w-3 h-3 mr-2" />
        Go Live
      </Button>
    </div>
  );
}

function ScheduledStreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg",
      "bg-slate-900/40 border border-slate-700/30",
      "hover:bg-slate-800/40 transition-colors"
    )}>
      <div className={cn(
        "p-2 rounded-lg",
        `bg-${config.color}-500/10`,
        `border border-${config.color}-500/20`
      )}>
        <Icon className={`w-4 h-4 text-${config.color}-400`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{stream.title}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {scheduledDate ? scheduledDate.toLocaleString() : 'TBD'}
        </div>
      </div>
      
      <Button size="sm" variant="ghost" className="h-7 px-2">
        <Calendar className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function LiveStreamingTerminal() {
  const [activeTab, setActiveTab] = useState<StreamType>('broadcast');
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  return (
    <section 
      id="live-terminal"
      className="py-16 px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-gradient-to-br from-slate-900/90 via-purple-950/30 to-slate-900/90",
            "border-2 border-purple-500/30",
            "backdrop-blur-xl",
            isHovered && "border-purple-400/50 shadow-lg shadow-purple-500/10",
            "transition-all duration-500"
          )}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/30">
                    <Signal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                      StreamAiX Live
                    </h2>
                    <p className="text-sm text-slate-400">Real-time broadcasts, trading rooms & audio spaces</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-semibold text-red-300">{totalLive} Live</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-300">{totalViewers.toLocaleString()} watching</span>
                  </div>
                  
                  <Link href="/go-live">
                    <Button 
                      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-red-500/30"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Go Live
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StreamType)} className="w-full">
                <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent h-auto p-0 mb-6">
                  {(Object.keys(streamTypeConfig) as StreamType[]).map((type) => {
                    const config = streamTypeConfig[type];
                    const Icon = config.icon;
                    const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                    
                    return (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl",
                          "bg-slate-900/50 border border-slate-700/50",
                          "data-[state=active]:bg-gradient-to-br",
                          `data-[state=active]:${config.bgGradient}`,
                          `data-[state=active]:${config.borderColor}`,
                          "transition-all duration-300"
                        )}
                      >
                        <Icon className={cn(
                          "w-4 h-4",
                          activeTab === type ? `text-${config.color}-400` : "text-slate-500"
                        )} />
                        <div className="text-left hidden sm:block">
                          <div className={cn(
                            "text-xs font-semibold",
                            activeTab === type ? "text-white" : "text-slate-400"
                          )}>
                            {config.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{config.description}</div>
                        </div>
                        {count > 0 && (
                          <div className={cn(
                            "ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                            `bg-${config.color}-500/20 text-${config.color}-400`
                          )}>
                            {count}
                          </div>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {(Object.keys(streamTypeConfig) as StreamType[]).map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isLoading ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                              <div 
                                key={i}
                                className="h-40 rounded-xl bg-slate-800/50 animate-pulse"
                              />
                            ))}
                          </div>
                        ) : filteredLiveStreams.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLiveStreams.map((stream) => (
                              <StreamCard key={stream.id} stream={stream} />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <EmptyStateCard type={type} />
                            
                            {filteredScheduled.length > 0 && (
                              <div className="md:col-span-2 rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-purple-400" />
                                  Upcoming
                                </h4>
                                <div className="space-y-2">
                                  {filteredScheduled.slice(0, 3).map((stream) => (
                                    <ScheduledStreamCard key={stream.id} stream={stream} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                ))}
              </Tabs>
              
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400">AI auto-summary when stream ends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-slate-400">Create markets from predictions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-400">Tip with STREAM tokens</span>
                    </div>
                  </div>
                  
                  <Link href="/streams">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      View All Streams
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LiveStreamingTerminal;
