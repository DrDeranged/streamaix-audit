import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompactStory {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceLogoUrl?: string;
  url: string;
  tags: string[];
  alphaScore: number;
  publishedAt: string;
  isBreaking: boolean;
}

interface StoriesLayoutProps {
  className?: string;
  maxStories?: number;
}

export function StoriesLayout({ className, maxStories = 12 }: StoriesLayoutProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'trending'>('new');

  // Fetch new stories
  const { data: newData, isLoading: isLoadingNew } = useQuery({
    queryKey: ['/api/news/new'],
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000,
    refetchOnMount: 'always'
  });

  // Fetch trending stories
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['/api/news/trending'],
    refetchInterval: 150000, // Refresh every 2.5 minutes
    staleTime: 75000,
    refetchOnMount: 'always'
  });

  const newStories: CompactStory[] = (newData as any)?.stories?.slice(0, maxStories) || [];
  const trendingStories: CompactStory[] = (trendingData as any)?.stories?.slice(0, maxStories) || [];

  const getAlphaScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-400/10';
    if (score >= 60) return 'text-orange-400 bg-orange-400/10';
    return 'text-green-400 bg-green-400/10';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleStoryClick = (story: CompactStory) => {
    window.open(story.url, '_blank', 'noopener,noreferrer');
  };

  const StoryCard = ({ story, index }: { story: CompactStory; index: number }) => (
    <div
      className={cn(
        "group relative bg-black/40 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-400/40 transition-all cursor-pointer",
        "hover:bg-black/60 hover:shadow-lg hover:shadow-cyan-500/10",
        story.isBreaking && "ring-1 ring-red-400/40 border-red-400/30"
      )}
      onClick={() => handleStoryClick(story)}
      data-testid={`story-card-${story.id}`}
    >
      {/* Breaking badge */}
      {story.isBreaking && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-red-500 text-white text-xs px-2 py-1 animate-pulse">
            BREAKING
          </Badge>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Source avatar */}
          {story.sourceLogoUrl && (
            <img 
              src={story.sourceLogoUrl} 
              alt={story.sourceName}
              className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
          
          {/* Source name and time */}
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-sm text-cyan-400 font-medium truncate">
              {story.sourceName}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(story.publishedAt)}
            </span>
          </div>
        </div>

        {/* Alpha score */}
        <div className={cn(
          "text-xs px-2 py-1 rounded-full font-bold flex-shrink-0",
          getAlphaScoreColor(story.alphaScore)
        )}>
          {story.alphaScore}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1 group-hover:text-cyan-100 transition-colors">
        {story.title}
      </h3>

      {/* Summary */}
      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 mb-3">
        {story.summary}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        {/* Tags */}
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {story.tags.slice(0, 2).map((tag, tagIndex) => (
            <Badge 
              key={tagIndex}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            >
              {tag}
            </Badge>
          ))}
          {story.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{story.tags.length - 2}</span>
          )}
        </div>

        {/* External link indicator */}
        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-black/40 border border-gray-700 rounded-lg p-3 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-700 rounded-full" />
              <div className="h-3 bg-gray-700 rounded w-20" />
              <div className="h-3 bg-gray-700 rounded w-12" />
            </div>
            <div className="h-4 bg-gray-700 rounded w-8" />
          </div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2" />
          <div className="h-3 bg-gray-700 rounded w-4/5 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-3/5" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'new' | 'trending')}
        className="w-full"
      >
        {/* Tab headers */}
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-fit grid-cols-2 bg-black/60 border border-cyan-500/20">
            <TabsTrigger 
              value="new" 
              className="flex items-center space-x-2 text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              data-testid="tab-new"
            >
              <Clock className="w-4 h-4" />
              <span>New</span>
              {newStories.length > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 text-xs ml-1">
                  {newStories.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="flex items-center space-x-2 text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              data-testid="tab-trending"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
              {trendingStories.length > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 text-xs ml-1">
                  {trendingStories.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Refresh button */}
          <Button
            size="sm"
            variant="ghost"
            className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
            onClick={() => {
              // Force refresh current tab
              if (activeTab === 'new') {
                // Invalidate new stories query
              } else {
                // Invalidate trending stories query  
              }
            }}
            data-testid="refresh-stories"
          >
            <Zap className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab content */}
        <TabsContent value="new" className="mt-0" data-testid="content-new">
          {isLoadingNew ? (
            <LoadingSkeleton />
          ) : newStories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new stories available</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {newStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-0" data-testid="content-trending">
          {isLoadingTrending ? (
            <LoadingSkeleton />
          ) : trendingStories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trending stories available</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {trendingStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}