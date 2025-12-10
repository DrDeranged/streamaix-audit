import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Radio, Calendar, History, Play, Users, Bot, User, 
  Sparkles, Bell, BellOff, Plus, Search, Filter, 
  TrendingUp, Mic, Zap, Brain, Crown, Clock, CheckCircle2, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateStreamModal, StreamFormData } from '@/components/streaming/CreateStreamModal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

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

function StreamCard({ stream, onClick }: { stream: StreamData; onClick: () => void }) {
  const Icon = streamTypeIcons[stream.streamType] || Radio;
  const gradient = streamTypeGradients[stream.streamType] || 'from-purple-500 to-pink-500';
  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer group",
        "bg-slate-900/40 backdrop-blur-xl",
        "border border-slate-700/50",
        "hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
        "transition-all duration-500"
      )}
      data-testid={`card-stream-${stream.id}`}
    >
      {/* Corner brackets for HUD effect */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-lg z-20" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-lg z-20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-purple-500/40 rounded-bl-lg z-20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-purple-500/40 rounded-br-lg z-20" />

      {/* Animated gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:via-transparent group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none z-10" />
      
      {/* Thumbnail Area */}
      <div className={cn("h-36 bg-gradient-to-br relative overflow-hidden", gradient)}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
        
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
            <div className="p-4 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
              <Play className="w-8 h-8 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <Icon className="absolute bottom-4 right-4 w-10 h-10 text-white/20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />
        
        {/* Top row: Status left, Viewers right */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
          {/* Status badge */}
          <div>
            {isLive && (
              <div className="relative flex items-center gap-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                </span>
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">Live</span>
              </div>
            )}
            {isScheduled && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400">Scheduled</span>
              </div>
            )}
          </div>
          
          {/* Viewer count */}
          {isLive && stream.currentViewers !== undefined && (
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-cyan-500/30">
              <Users className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
              <span className="text-sm font-mono font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">{stream.currentViewers}</span>
            </div>
          )}
        </div>
        
        {/* Bottom row: Stream type left, KA badge right */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-20">
          <Badge variant="outline" className="text-[10px] capitalize font-medium px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm border-slate-600/50 text-slate-300">
            <Icon className="w-3 h-3 mr-1" />
            {streamTypeLabels[stream.streamType] || stream.streamType}
          </Badge>
          
          {stream.isKnowledgeAvatar && (
            <Badge className="bg-slate-950/80 backdrop-blur-md text-cyan-300 text-[10px] px-2.5 py-1 font-bold border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-3 h-3 mr-1.5 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
              KA
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4 relative">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors mb-3">
          {stream.title}
        </h3>
        
        {/* Host info row */}
        <div className="flex items-center gap-2.5">
          <div className="relative group/avatar flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-60 blur-sm transition-opacity duration-500" />
            {stream.hostAvatar ? (
              <img src={stream.hostAvatar} alt={stream.hostUsername} className="relative w-9 h-9 rounded-full object-cover ring-2 ring-cyan-500/30" />
            ) : stream.isKnowledgeAvatar ? (
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center ring-2 ring-cyan-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ring-2 ring-slate-600">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            {stream.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-cyan-500 rounded-full p-0.5 ring-2 ring-slate-900">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-300 truncate block">{stream.hostUsername}</span>
            {stream.hostHandle && (
              <span className="text-xs text-slate-500 truncate block">@{stream.hostHandle}</span>
            )}
          </div>
        </div>
        
        {/* Scheduled time */}
        {isScheduled && stream.scheduledStart && (
          <div className="flex items-center gap-1.5 mt-3 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{new Date(stream.scheduledStart).toLocaleString()}</span>
          </div>
        )}
        
        {/* Tags */}
        {stream.tags && stream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {stream.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded text-[10px] text-slate-400 font-medium">
                {tag}
              </span>
            ))}
            {stream.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-800/40 rounded text-[10px] text-slate-500">
                +{stream.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
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
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [hostFilter, setHostFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: liveStreams = [], isLoading: loadingLive } = useQuery<StreamData[]>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 30000,
  });

  const { data: scheduledStreams = [], isLoading: loadingScheduled } = useQuery<StreamData[]>({
    queryKey: ['/api/streams/scheduled'],
  });

  const { data: endedStreams = [], isLoading: loadingEnded } = useQuery<StreamData[]>({
    queryKey: ['/api/streams/ended'],
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

  const filterStreams = (streams: StreamData[]) => {
    return streams.filter((stream) => {
      const matchesSearch = !searchQuery || 
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.hostUsername.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || stream.streamType === typeFilter;
      const matchesHost = hostFilter === 'all' || 
        (hostFilter === 'ai' && stream.isKnowledgeAvatar) ||
        (hostFilter === 'creators' && !stream.isKnowledgeAvatar);
      return matchesSearch && matchesType && matchesHost;
    });
  };

  const filteredLive = filterStreams((liveStreams as any)?.streams || liveStreams);
  const filteredScheduled = filterStreams((scheduledStreams as any)?.streams || scheduledStreams);
  const filteredEnded = filterStreams((endedStreams as any)?.streams || endedStreams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-500/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 100 + Math.random() * 200,
              height: 100 + Math.random() * 200,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
            }}
          />
        ))}
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

        {/* Host Type Filter Tabs - Glassmorphism style */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={hostFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHostFilter('all')}
            className={cn(
              "rounded-lg transition-all duration-300",
              hostFilter === 'all' 
                ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                : "bg-slate-800/40 backdrop-blur-sm border-slate-700/50 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300"
            )}
            data-testid="filter-host-all"
          >
            All
          </Button>
          <Button
            variant={hostFilter === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHostFilter('ai')}
            className={cn(
              "rounded-lg transition-all duration-300",
              hostFilter === 'ai' 
                ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                : "bg-slate-800/40 backdrop-blur-sm border-slate-700/50 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300"
            )}
            data-testid="filter-host-ai"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            AI Avatars
          </Button>
          <Button
            variant={hostFilter === 'creators' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHostFilter('creators')}
            className={cn(
              "rounded-lg transition-all duration-300",
              hostFilter === 'creators' 
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "bg-slate-800/40 backdrop-blur-sm border-slate-700/50 text-slate-400 hover:border-amber-500/30 hover:text-amber-300"
            )}
            data-testid="filter-host-creators"
          >
            <User className="w-3.5 h-3.5 mr-1.5" />
            Creators
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 mb-6 p-1">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-lg transition-all"
              data-testid="tab-live"
            >
              <Radio className="w-4 h-4 mr-2" />
              Live
              {filteredLive.length > 0 && (
                <Badge className="ml-2 bg-red-500/80 text-white border border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.4)]">{filteredLive.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-lg transition-all"
              data-testid="tab-scheduled"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
              {filteredScheduled.length > 0 && (
                <Badge className="ml-2 bg-amber-500/80 text-white border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.4)]">{filteredScheduled.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="ended"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-lg transition-all"
              data-testid="tab-ended"
            >
              <History className="w-4 h-4 mr-2" />
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {loadingLive ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredLive.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLive.map((stream) => (
                  <StreamCard 
                    key={stream.id} 
                    stream={stream} 
                    onClick={() => navigate(`/stream/${stream.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="live" onCreateStream={() => setShowCreateModal(true)} />
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            {loadingScheduled ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredScheduled.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredScheduled.map((stream) => (
                  <StreamCard 
                    key={stream.id} 
                    stream={stream} 
                    onClick={() => navigate(`/stream/${stream.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="scheduled" />
            )}
          </TabsContent>

          <TabsContent value="ended">
            {loadingEnded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredEnded.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEnded.map((stream) => (
                  <StreamCard 
                    key={stream.id} 
                    stream={stream} 
                    onClick={() => navigate(`/stream/${stream.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="ended" />
            )}
          </TabsContent>
        </Tabs>

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
