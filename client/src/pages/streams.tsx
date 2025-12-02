import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Video,
  TrendingUp,
  Headphones,
  Target,
  Users,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  Zap,
  Bot,
  Calendar,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  totalViews?: number;
  category?: string;
  tags?: string[];
  scheduledStart?: string;
  actualStart?: string;
  isAiHost?: boolean;
}

const streamTypeConfig: Record<string, { icon: any; label: string; color: string; bgColor: string; gradient: string }> = {
  broadcast: { 
    icon: Video, 
    label: 'Broadcast', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    gradient: 'from-purple-500 to-fuchsia-500'
  },
  trading_room: { 
    icon: TrendingUp, 
    label: 'Trading Room', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20',
    gradient: 'from-emerald-500 to-cyan-500'
  },
  audio_space: { 
    icon: Headphones, 
    label: 'Audio Space', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500'
  },
  live_bounty: { 
    icon: Target, 
    label: 'Live Bounty', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20',
    gradient: 'from-amber-500 to-orange-500'
  },
};

const categories = ['all', 'crypto', 'trading', 'defi', 'nft', 'education', 'ama', 'news', 'analysis'];

function StreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;
  const isLive = stream.status === 'live';
  
  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return `${Math.floor(diffHrs / 24)}d`;
  };

  return (
    <Link href={`/stream/${stream.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group cursor-pointer"
      >
        <Card className="overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className={cn(
            "relative aspect-video bg-gradient-to-br",
            config.gradient
          )}>
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <Icon className="w-12 h-12 text-white/50" />
            </div>
            
            {isLive && (
              <motion.div
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 rounded-full px-2.5 py-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </motion.div>
            )}

            {stream.isAiHost && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-cyan-500/90 text-white text-[10px] px-2 py-0.5">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Host
                </Badge>
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Users className="w-3 h-3 text-slate-300" />
              <span className="text-xs font-medium text-white">{formatViewers(stream.currentViewers)}</span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 ring-2 ring-purple-500/30">
                {stream.hostAvatar ? (
                  <img src={stream.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {stream.hostUsername?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {stream.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {stream.hostUsername || 'Anonymous'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px] capitalize",
                    config.color,
                    config.bgColor,
                    "border-0"
                  )}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  {stream.category && (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 capitalize">
                      {stream.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

function ScheduledStreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 transition-all">
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-xl bg-gradient-to-br",
          config.gradient
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white line-clamp-1">
            {stream.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {stream.hostUsername || 'Anonymous'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-amber-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">{formatDate(stream.scheduledStart)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function StreamsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: liveStreamsData, isLoading } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams', { status: 'live' }],
    refetchInterval: 30000,
  });

  const { data: scheduledStreamsData } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams', { status: 'scheduled' }],
  });

  const liveStreams = liveStreamsData?.streams || [];
  const scheduledStreams = scheduledStreamsData?.streams || [];

  const filteredStreams = liveStreams.filter(stream => {
    if (selectedCategory !== 'all' && stream.category !== selectedCategory) return false;
    if (selectedType && stream.streamType !== selectedType) return false;
    if (searchQuery && !stream.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const aiHostedStreams = filteredStreams.filter(s => s.isAiHost);
  const userHostedStreams = filteredStreams.filter(s => !s.isAiHost);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white font-orbitron">Live Streams</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Watch live crypto content</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"
                />
                {liveStreams.length} Live
              </Badge>
              <Link href="/go-live">
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white h-9 gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Go Live</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams..."
              className="pl-10 bg-slate-900/50 border-purple-500/30 text-white h-11"
              data-testid="input-search-streams"
            />
          </div>
        </div>

        <ScrollArea className="w-full mb-6">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all capitalize whitespace-nowrap py-2 px-4",
                  selectedCategory === cat
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "border-purple-500/20 text-slate-400 hover:border-purple-500/40"
                )}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-filter-${cat}`}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <ScrollArea className="w-full mb-8">
          <div className="flex gap-2 pb-2">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-all whitespace-nowrap py-2 px-4",
                !selectedType
                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                  : "border-purple-500/20 text-slate-400 hover:border-purple-500/40"
              )}
              onClick={() => setSelectedType(null)}
            >
              All Types
            </Badge>
            {Object.entries(streamTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all whitespace-nowrap py-2 px-4 flex items-center gap-1.5",
                    selectedType === type
                      ? `${config.bgColor} border-transparent ${config.color}`
                      : "border-purple-500/20 text-slate-400 hover:border-purple-500/40"
                  )}
                  onClick={() => setSelectedType(type)}
                  data-testid={`type-filter-${type}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {aiHostedStreams.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white font-orbitron">AI-Hosted Streams</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs ml-2">
                {aiHostedStreams.length} live
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {aiHostedStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white font-orbitron">
              {userHostedStreams.length > 0 ? 'Creator Streams' : 'Live Now'}
            </h2>
            {userHostedStreams.length > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs ml-2">
                {userHostedStreams.length} live
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-slate-900/50 border border-purple-500/20 animate-pulse">
                  <div className="aspect-video bg-slate-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredStreams.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20">
              <Radio className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Live Streams</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                There are no live streams matching your filters right now. Be the first to go live!
              </p>
              <Link href="/go-live">
                <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500">
                  <Radio className="w-4 h-4 mr-2" />
                  Start Streaming
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(userHostedStreams.length > 0 ? userHostedStreams : filteredStreams).map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          )}
        </section>

        {scheduledStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white font-orbitron">Upcoming Streams</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledStreams.slice(0, 6).map((stream) => (
                <ScheduledStreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
