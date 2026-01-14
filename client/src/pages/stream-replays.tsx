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
  creator_broadcast: 'from-purple-500 to-fuchsia-500',
  trading_room: 'from-emerald-500 to-cyan-500',
  crypto_spaces: 'from-amber-500 to-orange-500',
  live_bounty: 'from-blue-500 to-indigo-500',
  debate: 'from-cyan-500 to-blue-500',
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
  const colorGradient = STREAM_TYPE_COLORS[recording.streamType as keyof typeof STREAM_TYPE_COLORS] || 'from-purple-500 to-fuchsia-500';
  
  const getReplayLink = () => {
    if (recording.streamType === 'debate') {
      return `/debate/${recording.id}`;
    }
    // Use streamId for stream page which handles both live and replay views
    return `/stream/${recording.streamId || recording.id}`;
  };
  
  return (
    <Link href={getReplayLink()}>
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group hover:-translate-y-1">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
            {recording.thumbnailUrl ? (
              <img 
                src={recording.thumbnailUrl} 
                alt={recording.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
                colorGradient,
                "opacity-20"
              )}>
                <Icon className="w-16 h-16 text-white/30" />
              </div>
            )}
            
            {/* Duration Badge */}
            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
              {formatDuration(recording.duration)}
            </Badge>
            
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-8 h-8 text-white fill-white" />
              </motion.div>
            </div>
            
            {/* Stream Type Badge */}
            <Badge 
              className={cn(
                "absolute top-2 left-2 bg-gradient-to-r text-white text-xs",
                colorGradient
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {(recording.streamType || 'broadcast').replace('_', ' ')}
            </Badge>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
              {recording.title}
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                {recording.hostAvatar ? (
                  <img src={recording.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (recording.hostUsername || 'A')[0]?.toUpperCase()
                )}
              </div>
              <span className="text-xs text-slate-400">@{recording.hostUsername || 'Anonymous'}</span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViewCount(recording.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(recording.recordedAt).toLocaleDateString()}
                </span>
              </div>
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
