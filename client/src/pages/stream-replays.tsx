import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  Video,
  Headphones,
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
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
  creator_broadcast: 'bg-ink-raised',
  trading_room: 'bg-ink-raised',
  crypto_spaces: 'bg-ink-raised',
  live_bounty: 'bg-ink-raised',
  debate: 'bg-ink-raised',
  broadcast: 'bg-ink-raised',
  market_update: 'bg-ink-raised',
};

const BADGE_COLORS = {
  creator_broadcast: 'bg-accent-deep',
  trading_room: 'bg-accent-deep',
  crypto_spaces: 'bg-accent-deep',
  live_bounty: 'bg-accent-deep',
  debate: 'bg-accent-deep',
  broadcast: 'bg-accent-deep',
  market_update: 'bg-accent-deep',
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
  const colorGradient = STREAM_TYPE_COLORS[recording.streamType as keyof typeof STREAM_TYPE_COLORS] || 'bg-ink-raised';
  const badgeGradient = BADGE_COLORS[recording.streamType as keyof typeof BADGE_COLORS] || 'bg-accent-deep';
  
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
      <Surface className="group cursor-pointer overflow-hidden border border-ink-edge transition-all duration-300 hover:-translate-y-1 hover:border-accent-core/60 hover:shadow-xl hover:shadow-accent-core/10">
          {/* Thumbnail with centered avatar */}
          <div className={cn(
             "relative aspect-video overflow-hidden",
            colorGradient
          )}>
            {/* Subtle grid pattern overlay */}
             <div className="absolute inset-0 opacity-10 bg-ink-surface" />
            
            {/* Centered Avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                 <div className="absolute inset-0 bg-accent-core/20 rounded-xl blur-xl scale-150" />
                 <div className="relative w-24 h-24 rounded-xl bg-accent-deep border-2 border-ink-edge shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {recording.hostAvatar && (
                    <img 
                      src={recording.hostAvatar} 
                      alt={recording.hostUsername}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                   <span className="text-3xl font-bold text-primary drop-shadow-lg select-none">
                    {(recording.hostUsername || 'A')[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Duration Badge */}
             <Badge className="absolute bottom-2 right-2 bg-ink-page/90 backdrop-blur-sm text-primary text-xs font-mono border border-ink-edge">
              {formatDuration(recording.duration)}
            </Badge>
            
            {/* Play Overlay */}
             <div className="absolute inset-0 flex items-center justify-center bg-ink-page/0 group-hover:bg-ink-page/30 transition-colors duration-300">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                 className="p-3 rounded-xl bg-ink-raised/90 backdrop-blur-md border border-ink-edge opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                 <Play className="w-6 h-6 text-primary fill-primary" />
              </motion.div>
            </div>
            
            {/* Stream Type Badge */}
            <Badge 
              className={cn(
                 "absolute top-2 left-2 text-primary text-xs border-0 shadow-lg",
                badgeGradient
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {streamLabel}
            </Badge>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-4 bg-ink-surface">
             <h3 className="text-sm sm:text-base font-semibold text-primary mb-3 line-clamp-2 group-hover:text-accent-bright transition-colors leading-tight">
              {recording.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-xl bg-accent-deep border border-ink-edge flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                  {recording.hostAvatar ? (
                   <img src={recording.hostAvatar} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    (recording.hostUsername || 'A')[0]?.toUpperCase()
                  )}
                </div>
                 <span className="text-xs text-secondary font-medium">@{recording.hostUsername || 'Anonymous'}</span>
              </div>
              
               <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted">
                <Calendar className="w-3 h-3" />
                {new Date(recording.recordedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
         </Surface>
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
    <div className="min-h-screen bg-ink-page">
      <div className="max-w-7xl mx-auto px-4 py-6 safe-area-inset">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
               className="text-secondary hover:text-primary hover:bg-accent-core/20 rounded-xl" 
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
               <SectionTitle as="h1" className="flex items-center gap-2">
                 <Video className="w-6 h-6 sm:w-8 sm:h-8 text-accent-bright" />
                 Replays
               </SectionTitle>
               <p className="text-sm text-secondary">Watch past streams and VOD content</p>
            </div>
          </div>
          
           <Badge className="bg-accent-core/20 text-accent-bright text-xs self-start sm:self-auto rounded-xl">
            {recordings.length} recordings
          </Badge>
        </div>

        {/* Filters */}
         <Surface className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                 className="pl-10 bg-ink-raised border-ink-edge text-primary rounded-xl"
                data-testid="input-search-recordings"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
               <SelectTrigger className="w-full sm:w-40 bg-ink-raised border-ink-edge text-primary rounded-xl">
                 <Filter className="w-4 h-4 mr-2 text-accent-bright" />
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
               <SelectTrigger className="w-full sm:w-40 bg-ink-raised border-ink-edge text-primary rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Viewed</SelectItem>
                <SelectItem value="longest">Longest</SelectItem>
              </SelectContent>
            </Select>
          </div>
         </Surface>

        {/* Recordings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
               <Surface key={i} className="overflow-hidden animate-pulse">
                 <div className="aspect-video bg-ink-raised" />
                <div className="p-4 space-y-3">
                   <div className="h-4 bg-ink-raised rounded-xl w-3/4" />
                   <div className="h-3 bg-ink-raised rounded-xl w-1/2" />
                </div>
               </Surface>
            ))}
          </div>
        ) : filteredRecordings.length === 0 ? (
           <Surface className="p-12 text-center">
             <Video className="w-16 h-16 text-muted mx-auto mb-4" />
             <SectionTitle as="h3" className="mb-2">No Recordings Found</SectionTitle>
             <p className="text-secondary text-sm max-w-md mx-auto">
              {searchQuery 
                ? "No recordings match your search. Try different keywords."
                : "Recorded streams will appear here. Start recording your live streams!"}
            </p>
           </Surface>
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
              <Sparkles className="w-5 h-5 text-warn" />
               <SectionTitle as="h2">AI Curated Highlights</SectionTitle>
            </div>
             <Surface className="p-6">
               <p className="text-secondary text-sm text-center">
                AI-powered highlights and key moments from popular streams coming soon...
              </p>
             </Surface>
          </div>
        )}
      </div>
    </div>
  );
}
