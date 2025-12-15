import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Radio, Calendar, History, Play, Users, Bot, User, 
  Sparkles, Plus, Search, Filter, 
  TrendingUp, Mic, Zap, Brain, Clock, CheckCircle2, Shield,
  ChevronLeft, ChevronRight, Flame, Clock3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateStreamModal, StreamFormData } from '@/components/streaming/CreateStreamModal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';

interface StreamData {
  id: string;
  title: string;
  description?: string;
  streamType: string;
  hostId: string;
  hostAvatarId?: string;
  hostUsername: string;
  hostHandle?: string;
  hostAvatar?: string;
  hostExpertise?: string[];
  isKnowledgeAvatar: boolean;
  isVerified: boolean;
  status: string;
  category?: string;
  tags?: string[];
  currentViewers?: number;
  peakViewers?: number;
  scheduledStart?: string;
  actualStart?: string;
  actualEnd?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  createdAt?: string;
}

interface AvatarData {
  id: string;
  name: string;
  handle: string;
  imageUrl?: string;
  expertise: string[];
  verificationStatus: string;
}

const streamTypeIcons: Record<string, any> = {
  broadcast: Radio,
  trading_room: TrendingUp,
  audio_space: Mic,
  live_bounty: Zap,
  avatar_alpha: Brain,
};

const streamTypeLabels: Record<string, string> = {
  broadcast: 'Broadcast',
  trading_room: 'Trading Room',
  audio_space: 'Audio Space',
  live_bounty: 'Live Bounty',
  avatar_alpha: 'Avatar Alpha',
};

const streamTypeGradients: Record<string, string> = {
  broadcast: 'from-purple-500 to-pink-500',
  trading_room: 'from-emerald-500 to-cyan-500',
  audio_space: 'from-cyan-500 to-blue-500',
  live_bounty: 'from-amber-500 to-orange-500',
  avatar_alpha: 'from-purple-600 to-pink-500',
};

function FeaturedHeroStream({ stream, onClick }: { stream: StreamData; onClick: () => void }) {
  const Icon = streamTypeIcons[stream.streamType] || Radio;
  const gradient = streamTypeGradients[stream.streamType] || 'from-purple-500 to-pink-500';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative w-full h-[400px] rounded-3xl overflow-hidden cursor-pointer group mb-10"
      data-testid="featured-stream"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`,
      }} />
      
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="relative flex items-center gap-2 bg-red-500/90 backdrop-blur-md rounded-full px-4 py-2 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-sm font-bold text-white uppercase tracking-wider">Live Now</span>
        </div>
        
        <Badge className="bg-white/20 backdrop-blur-md text-white border-0 px-3 py-1.5">
          <Icon className="w-4 h-4 mr-1.5" />
          {streamTypeLabels[stream.streamType] || stream.streamType}
        </Badge>
        
        {stream.isKnowledgeAvatar && (
          <Badge className="bg-cyan-500/30 backdrop-blur-md text-cyan-100 border border-cyan-400/50 px-3 py-1.5">
            <Shield className="w-4 h-4 mr-1.5" />
            AI Avatar
          </Badge>
        )}
      </div>
      
      {stream.currentViewers !== undefined && (
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md rounded-full px-4 py-2 z-10">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-lg font-mono font-bold text-white">{stream.currentViewers}</span>
          <span className="text-sm text-slate-300">watching</span>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <div className="flex items-end justify-between">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <AvatarWithFallback 
                  src={stream.hostAvatar} 
                  name={stream.hostUsername || 'Unknown'} 
                  size="lg"
                  ringClassName="ring-4 ring-white/20"
                />
                {stream.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 ring-2 ring-slate-900">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{stream.hostUsername}</p>
                {stream.hostHandle && <p className="text-white/60 text-sm">@{stream.hostHandle}</p>}
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3 line-clamp-2">
              {stream.title.replace(/\s*[-–—]\s*(LIVE|Live|live)\s*$/i, '').trim()}
            </h2>
            
            {stream.tags && stream.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stream.tags.slice(0, 4).map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            size="lg" 
            className="bg-white text-slate-900 hover:bg-white/90 rounded-full px-8 shadow-[0_0_40px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Watch Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CompactStreamCard({ stream, onClick }: { stream: StreamData; onClick: () => void }) {
  const Icon = streamTypeIcons[stream.streamType] || Radio;
  const gradient = streamTypeGradients[stream.streamType] || 'from-purple-500 to-pink-500';
  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-72 rounded-xl overflow-hidden cursor-pointer group",
        "bg-slate-800/80 backdrop-blur-xl",
        "border border-slate-700/60",
        "hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
        "transition-all duration-300"
      )}
      data-testid={`card-stream-${stream.id}`}
    >
      <div className="h-40 relative overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", gradient)} />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <AvatarWithFallback 
              src={stream.hostAvatar} 
              name={stream.hostUsername || 'Unknown'} 
              size="xl"
              ringClassName="ring-4 ring-white/20"
              className="backdrop-blur-sm"
            />
            <div className={cn("absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-r shadow-lg", gradient)}>
              <Icon className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
          {isLive && (
            <div className="flex items-center gap-1.5 bg-red-500/90 rounded-full px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[10px] font-bold text-white uppercase">Live</span>
            </div>
          )}
          {isScheduled && (
            <div className="flex items-center gap-1 bg-amber-500/90 rounded-full px-2.5 py-1">
              <Calendar className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">Scheduled</span>
            </div>
          )}
          
          {isLive && stream.currentViewers !== undefined && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 rounded-full px-2.5 py-1">
              <Users className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-bold text-white">{stream.currentViewers}</span>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end z-10">
          <Badge variant="outline" className="text-[9px] capitalize font-medium px-2 py-0.5 bg-slate-900/80 border-slate-600/50 text-slate-300">
            {streamTypeLabels[stream.streamType] || stream.streamType}
          </Badge>
          
          {stream.isKnowledgeAvatar && (
            <Badge className="bg-cyan-500/30 text-cyan-200 text-[9px] px-2 py-0.5 border border-cyan-500/50">
              <Shield className="w-2.5 h-2.5 mr-1" />
              AI
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors mb-2">
          {stream.title.replace(/\s*[-–—]\s*(LIVE|Live|live)\s*$/i, '').trim()}
        </h3>
        
        <div className="flex items-center gap-2">
          <AvatarWithFallback 
            src={stream.hostAvatar} 
            name={stream.hostUsername || 'Unknown'} 
            size="xs"
          />
          <span className="text-xs text-slate-400 truncate">{stream.hostUsername}</span>
          {stream.isVerified && <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
        </div>
        
        {isScheduled && stream.scheduledStart && (
          <div className="flex items-center gap-1 mt-2 text-amber-400 text-[10px]">
            <Clock className="w-3 h-3" />
            <span>{new Date(stream.scheduledStart).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StreamCarousel({ 
  title, 
  icon: IconComponent, 
  streams, 
  onStreamClick,
  emptyMessage 
}: { 
  title: string; 
  icon: any; 
  streams: StreamData[];
  onStreamClick: (id: string) => void;
  emptyMessage?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  if (streams.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <IconComponent className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <Badge variant="secondary" className="bg-slate-800/80 text-slate-300 text-xs">
            {streams.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white"
            data-testid={`carousel-left-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white"
            data-testid={`carousel-right-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
      >
        {streams.map((stream) => (
          <CompactStreamCard 
            key={stream.id} 
            stream={stream} 
            onClick={() => onStreamClick(stream.id)} 
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ type, onCreateStream }: { type: 'live' | 'scheduled' | 'ended'; onCreateStream?: () => void }) {
  const messages = {
    live: { title: 'No live streams', description: 'Be the first to go live!', icon: Radio },
    scheduled: { title: 'No upcoming streams', description: 'Schedule a stream for later', icon: Calendar },
    ended: { title: 'No past streams', description: 'Past streams will appear here', icon: History },
  };
  
  const { title, description, icon: Icon } = messages[type];
  
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6">{description}</p>
      {type === 'live' && onCreateStream && (
        <Button onClick={onCreateStream} className="bg-purple-600 hover:bg-purple-700" data-testid="button-go-live-empty">
          <Plus className="w-4 h-4 mr-2" />
          Start Streaming
        </Button>
      )}
    </div>
  );
}

export default function StreamDiscoveryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: liveStreams = [], isLoading: loadingLive } = useQuery<StreamData[]>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 30000,
  });

  const { data: scheduledStreams = [], isLoading: loadingScheduled } = useQuery<StreamData[]>({
    queryKey: ['/api/streams/scheduled'],
  });

  const { data: avatars = [] } = useQuery<AvatarData[]>({
    queryKey: ['/api/avatars'],
  });

  const createStreamMutation = useMutation({
    mutationFn: async (data: StreamFormData) => {
      const response = await apiRequest('/api/streams', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          streamType: data.streamType,
          category: data.category,
          tags: data.tags,
          scheduledStart: data.scheduledStart,
          isPrivate: data.isPrivate,
        }),
      });
      return response;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/streams/live'] });
      queryClient.invalidateQueries({ queryKey: ['/api/streams/scheduled'] });
      if (result.stream) {
        navigate(`/stream/${result.stream.id}`);
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create stream', variant: 'destructive' });
    },
  });

  const handleCreateStream = async (data: StreamFormData) => {
    await createStreamMutation.mutateAsync(data);
  };

  const allLiveStreams: StreamData[] = (liveStreams as any)?.streams || liveStreams;
  const allScheduledStreams: StreamData[] = (scheduledStreams as any)?.streams || scheduledStreams;
  
  const filterStreams = (streams: StreamData[]) => {
    return streams.filter((stream) => {
      const matchesSearch = !searchQuery || 
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.hostUsername.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || stream.streamType === typeFilter;
      return matchesSearch && matchesType;
    });
  };

  const filteredLive = filterStreams(allLiveStreams);
  const filteredScheduled = filterStreams(allScheduledStreams);
  
  const featuredStream = filteredLive.length > 0 
    ? [...filteredLive].sort((a, b) => (b.currentViewers || 0) - (a.currentViewers || 0))[0]
    : null;
  
  const remainingLive = filteredLive.filter(s => s.id !== featuredStream?.id);
  
  const trendingStreams = [...remainingLive].sort((a, b) => (b.currentViewers || 0) - (a.currentViewers || 0));
  
  const recentStreams = [...remainingLive].sort((a, b) => {
    const dateA = a.actualStart ? new Date(a.actualStart).getTime() : 0;
    const dateB = b.actualStart ? new Date(b.actualStart).getTime() : 0;
    return dateB - dateA;
  });
  
  const aiAvatarStreams = remainingLive.filter(s => s.isKnowledgeAvatar);
  const creatorStreams = remainingLive.filter(s => !s.isKnowledgeAvatar);

  const handleStreamClick = (id: string) => navigate(`/stream/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <SectionHeader
            title="Live Streams"
            subtitle="Watch AI Avatars and creators stream live"
            badge="Streaming"
            badgeIcon={<Radio className="h-3 w-3" />}
            align="left"
          />
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-0 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
            data-testid="button-start-stream"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Streaming
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams..."
              className="pl-10 bg-slate-900/40 backdrop-blur-xl border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              data-testid="input-search-streams"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-900/40 backdrop-blur-xl border-slate-700/50 text-white focus:border-cyan-500/50" data-testid="select-stream-type">
              <Filter className="w-4 h-4 mr-2 text-cyan-400" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(streamTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingLive ? (
          <div className="space-y-8">
            <div className="h-[400px] bg-slate-800/50 rounded-3xl animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-72 h-56 bg-slate-800/50 rounded-xl animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        ) : filteredLive.length > 0 ? (
          <>
            {featuredStream && (
              <FeaturedHeroStream 
                stream={featuredStream} 
                onClick={() => handleStreamClick(featuredStream.id)} 
              />
            )}
            
            <StreamCarousel
              title="Trending Now"
              icon={Flame}
              streams={trendingStreams}
              onStreamClick={handleStreamClick}
            />
            
            <StreamCarousel
              title="Just Started"
              icon={Clock3}
              streams={recentStreams}
              onStreamClick={handleStreamClick}
            />
            
            <StreamCarousel
              title="AI Avatar Streams"
              icon={Brain}
              streams={aiAvatarStreams}
              onStreamClick={handleStreamClick}
            />
            
            <StreamCarousel
              title="Creator Streams"
              icon={User}
              streams={creatorStreams}
              onStreamClick={handleStreamClick}
            />
          </>
        ) : (
          <EmptyState type="live" onCreateStream={() => setShowCreateModal(true)} />
        )}
        
        {filteredScheduled.length > 0 && (
          <StreamCarousel
            title="Upcoming Streams"
            icon={Calendar}
            streams={filteredScheduled}
            onStreamClick={handleStreamClick}
          />
        )}

        {avatars.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Avatar Hosts
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {((avatars as any)?.avatars || avatars).slice(0, 10).map((avatar: AvatarData) => (
                <motion.div
                  key={avatar.id}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 bg-slate-900/80 rounded-xl border border-purple-500/20 p-4 w-48 cursor-pointer hover:border-purple-500/40"
                  onClick={() => navigate(`/avatars/${avatar.id}`)}
                  data-testid={`avatar-host-${avatar.id}`}
                >
                  <div className="relative mx-auto w-16 h-16 mb-3">
                    {avatar.imageUrl ? (
                      <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {avatar.verificationStatus === 'verified' && (
                      <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white text-center truncate">{avatar.name}</h3>
                  <p className="text-xs text-slate-400 text-center truncate">@{avatar.handle}</p>
                  {avatar.expertise && avatar.expertise.length > 0 && (
                    <div className="flex justify-center mt-2">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-[10px]">
                        {avatar.expertise[0]}
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateStream={handleCreateStream}
        availableAvatars={((avatars as any)?.avatars || avatars).map((a: AvatarData) => ({
          id: a.id,
          name: a.name,
          avatar: a.imageUrl,
        }))}
      />
    </div>
  );
}
