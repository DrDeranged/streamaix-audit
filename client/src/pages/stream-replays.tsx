import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Users, 
  Eye,
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  Video,
  Headphones,
  Target,
  TrendingUp,
  Sparkles,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  streamId: string;
  title: string;
  description?: string;
  streamType: string;
  hostUsername: string;
  hostAvatar?: string;
  duration: number;
  viewCount: number;
  thumbnailUrl?: string;
  recordedAt: string;
  category?: string;
  tags?: string[];
}

const STREAM_TYPE_ICONS = {
  creator_broadcast: Video,
  trading_room: TrendingUp,
  crypto_spaces: Headphones,
  live_bounty: Target,
  debate: Sparkles,
};

const STREAM_TYPE_COLORS = {
  creator_broadcast: 'from-slate-800 via-purple-900/50 to-slate-900',
  trading_room: 'from-slate-800 via-emerald-900/50 to-slate-900',
  crypto_spaces: 'from-slate-800 via-amber-900/50 to-slate-900',
  live_bounty: 'from-slate-800 via-blue-900/50 to-slate-900',
  debate: 'from-slate-800 via-cyan-900/50 to-slate-900',
  broadcast: 'from-slate-800 via-purple-900/50 to-slate-900',
  market_update: 'from-slate-800 via-cyan-900/50 to-slate-900',
};

const BADGE_COLORS = {
  creator_broadcast: 'from-purple-500 to-fuchsia-500',
  trading_room: 'from-emerald-500 to-cyan-500',
  crypto_spaces: 'from-amber-500 to-orange-500',
  live_bounty: 'from-blue-500 to-indigo-500',
  debate: 'from-cyan-500 to-blue-500',
  broadcast: 'from-purple-500 to-fuchsia-500',
  market_update: 'from-cyan-500 to-blue-500',
};

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function RecordingCard({ recording }: { recording: Recording }) {
  const Icon = STREAM_TYPE_ICONS[recording.streamType as keyof typeof STREAM_TYPE_ICONS] || Video;
  const colorGradient = STREAM_TYPE_COLORS[recording.streamType as keyof typeof STREAM_TYPE_COLORS] || 'from-slate-800 via-purple-900/50 to-slate-900';
  const badgeGradient = BADGE_COLORS[recording.streamType as keyof typeof BADGE_COLORS] || 'from-purple-500 to-fuchsia-500';
  
  const getReplayLink = () => {
    if (recording.streamType === 'debate') {
      return `/debate/${recording.id}`;
    }
    return `/stream/${recording.streamId || recording.id}`;
  };

  const streamLabel = recording.title?.includes('Morning') ? 'Morning Update' 
    : recording.title?.includes('Market Close') ? 'Market Close' 
    : (recording.streamType || 'broadcast').replace('_', ' ');
  
  return (
    <Link href={getReplayLink()}>
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/50 to-slate-900/95 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
          {/* Thumbnail with centered avatar */}
          <div className={cn(
            "relative aspect-video overflow-hidden bg-gradient-to-br",
            colorGradient
          )}>
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
            
            {/* Centered Avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-cyan-500/40 rounded-full blur-xl scale-150" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 border-3 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {recording.hostAvatar ? (
                    <img 
                      src={recording.hostAvatar} 
                      alt={recording.hostUsername}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white drop-shadow-lg">
                      {(recording.hostUsername || 'A')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Duration Badge */}
            <Badge className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-mono border border-white/10">
              {formatDuration(recording.duration)}
            </Badge>
            
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <Play className="w-6 h-6 text-white fill-white" />
              </motion.div>
            </div>
            
            {/* Stream Type Badge */}
            <Badge 
              className={cn(
                "absolute top-2 left-2 bg-gradient-to-r text-white text-xs border-0 shadow-lg",
                badgeGradient
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {streamLabel}
            </Badge>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-4 bg-gradient-to-b from-transparent to-slate-900/50">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors leading-tight">
              {recording.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                  {recording.hostAvatar ? (
                    <img src={recording.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (recording.hostUsername || 'A')[0]?.toUpperCase()
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">@{recording.hostUsername || 'Anonymous'}</span>
              </div>
              
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {new Date(recording.recordedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      </Link>
  );
}

export default function StreamReplays() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  const { data: recordingsData, isLoading } = useQuery<{ success: boolean; replays: any[] }>({
    queryKey: ['/api/stream-replays'],
  });

  const recordings: Recording[] = (recordingsData?.replays || []).map((r: any) => ({
    id: r.id,
    streamId: r.streamId,
    title: r.streamTitle || 'Untitled Stream',
    description: r.streamDescription,
    streamType: r.streamCategory === 'market_update' ? 'broadcast' : (r.streamCategory || 'broadcast'),
    hostUsername: r.hostAvatar?.name || 'Anonymous',
    hostAvatar: r.hostAvatar?.imageUrl || r.thumbnailUrl,
    duration: r.durationSeconds || 0,
    viewCount: 0,
    thumbnailUrl: r.thumbnailUrl || r.hostAvatar?.imageUrl,
    recordedAt: r.createdAt,
    category: r.streamCategory,
    tags: [],
  }));
  
  const filteredByType = typeFilter === 'all' ? recordings : recordings.filter(rec => rec.streamType === typeFilter);
  const sortedRecordings = [...filteredByType].sort((a, b) => {
    if (sortBy === 'popular') return b.viewCount - a.viewCount;
    if (sortBy === 'longest') return b.duration - a.duration;
    return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
  });
  
  const filteredRecordings = sortedRecordings.filter(rec => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (rec.title || '').toLowerCase().includes(query) || 
             (rec.hostUsername || '').toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-6 safe-area-inset">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="text-slate-400 hover:text-white hover:bg-purple-500/20" 
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-orbitron flex items-center gap-2">
                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                Replays
              </h1>
              <p className="text-sm text-slate-400">Watch past streams and VOD content</p>
            </div>
          </div>
          
          <Badge className="bg-purple-500/20 text-purple-400 text-xs self-start sm:self-auto">
            {recordings.length} recordings
          </Badge>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                className="pl-10 bg-slate-800/50 border-purple-500/30 text-white"
                data-testid="input-search-recordings"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-purple-500/30 text-white">
                <Filter className="w-4 h-4 mr-2 text-purple-400" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debate">AI Debates</SelectItem>
                <SelectItem value="creator_broadcast">Creator Broadcast</SelectItem>
                <SelectItem value="trading_room">Trading Room</SelectItem>
                <SelectItem value="crypto_spaces">Crypto Spaces</SelectItem>
                <SelectItem value="live_bounty">Live Bounty</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-purple-500/30 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Viewed</SelectItem>
                <SelectItem value="longest">Longest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Recordings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 animate-pulse">
                <div className="aspect-video bg-slate-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredRecordings.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Recordings Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {searchQuery 
                ? "No recordings match your search. Try different keywords."
                : "Recorded streams will appear here. Start recording your live streams!"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredRecordings.map((recording, index) => (
                <motion.div
                  key={recording.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecordingCard recording={recording} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Featured Section */}
        {!searchQuery && filteredRecordings.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">AI Curated Highlights</h2>
            </div>
            <Card className="p-6 bg-gradient-to-br from-amber-900/20 via-slate-900/90 to-slate-900/90 border border-amber-500/20">
              <p className="text-slate-400 text-sm text-center">
                AI-powered highlights and key moments from popular streams coming soon...
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
