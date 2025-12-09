import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Radio, Calendar, History, Play, Users, Bot, User, 
  Sparkles, Bell, BellOff, Plus, Search, Filter, 
  TrendingUp, Mic, Zap, Brain, Crown, Clock, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden cursor-pointer group hover:border-purple-500/50 transition-all duration-200"
      data-testid={`card-stream-${stream.id}`}
    >
      {/* Thumbnail Area - Fixed height with clean badge layout */}
      <div className={cn("h-36 bg-gradient-to-br relative overflow-hidden", gradient)}>
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            <Icon className="w-10 h-10 text-white/30" />
          </div>
        )}
        
        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Top row: Status left, Viewers right */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Status badge */}
          <div>
            {isLive && (
              <div className="flex items-center gap-1.5 bg-red-600 rounded px-2 py-1 shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wide">Live</span>
              </div>
            )}
            {isScheduled && (
              <div className="flex items-center gap-1.5 bg-amber-600 rounded px-2 py-1 shadow-lg">
                <Calendar className="w-3 h-3 text-white" />
                <span className="text-[11px] font-bold text-white">Scheduled</span>
              </div>
            )}
          </div>
          
          {/* Viewer count */}
          {isLive && stream.currentViewers !== undefined && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
              <Users className="w-3 h-3 text-slate-300" />
              <span className="text-[11px] font-medium text-white">{stream.currentViewers}</span>
            </div>
          )}
        </div>
        
        {/* Bottom row: Stream type left, KA badge right */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          {/* Stream type badge */}
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
            <Icon className="w-3 h-3 text-white" />
            <span className="text-[10px] font-medium text-white">
              {streamTypeLabels[stream.streamType] || stream.streamType}
            </span>
          </div>
          
          {/* Knowledge Avatar indicator */}
          {stream.isKnowledgeAvatar && (
            <div className="flex items-center gap-1 bg-purple-600/90 backdrop-blur-sm rounded px-2 py-1">
              <Brain className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">KA</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors mb-3">
          {stream.title}
        </h3>
        
        {/* Host info row */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            {stream.hostAvatar ? (
              <img src={stream.hostAvatar} alt={stream.hostUsername} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700" />
            ) : stream.isKnowledgeAvatar ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center ring-2 ring-purple-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ring-2 ring-slate-600">
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
          <div className="flex items-center gap-1.5 mt-3 text-amber-400 bg-amber-500/10 rounded px-2 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{new Date(stream.scheduledStart).toLocaleString()}</span>
          </div>
        )}
        
        {/* Tags - max 2 with consistent styling */}
        {stream.tags && stream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {stream.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-medium">
                {tag}
              </span>
            ))}
            {stream.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-800/50 rounded text-[10px] text-slate-500">
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
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
                <Radio className="w-6 h-6 text-white" />
              </div>
              Live Streams
            </h1>
            <p className="text-slate-400 mt-2">Watch AI Avatars and creators stream live</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            data-testid="button-start-stream"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Streaming
          </Button>
        </div>

        {/* Host Type Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={hostFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHostFilter('all')}
            className={cn(
              "rounded-full transition-all",
              hostFilter === 'all' 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
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
              "rounded-full transition-all",
              hostFilter === 'ai' 
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white" 
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
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
              "rounded-full transition-all",
              hostFilter === 'creators' 
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
            )}
            data-testid="filter-host-creators"
          >
            <User className="w-3.5 h-3.5 mr-1.5" />
            Creators
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams..."
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
              data-testid="input-search-streams"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-700 text-white" data-testid="select-stream-type">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
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
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50 mb-6">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              data-testid="tab-live"
            >
              <Radio className="w-4 h-4 mr-2" />
              Live
              {filteredLive.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{filteredLive.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              data-testid="tab-scheduled"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
              {filteredScheduled.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">{filteredScheduled.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="ended"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
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
