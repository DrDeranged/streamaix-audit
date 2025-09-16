import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, ExternalLink, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProminentFigure {
  id: string;
  fid: number;
  handle: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  lastHighlight: string;
  influenceScore: number;
  topics: string[];
}

interface FiguresSidebarProps {
  className?: string;
  maxFigures?: number;
}

export function FiguresSidebar({ className, maxFigures = 8 }: FiguresSidebarProps) {
  // Fetch prominent figures
  const { data: figuresData, isLoading, error } = useQuery({
    queryKey: ['/api/figures/top', maxFigures],
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000, // Consider stale after 4 minutes
    refetchOnMount: 'always'
  });

  const figures: ProminentFigure[] = (figuresData as any)?.figures || [];

  const getInfluenceColor = (score: number) => {
    if (score >= 90) return 'text-yellow-400 bg-yellow-400/10';
    if (score >= 80) return 'text-orange-400 bg-orange-400/10';
    return 'text-cyan-400 bg-cyan-400/10';
  };

  const handleFigureClick = (figure: ProminentFigure) => {
    // Open Warpcast profile in new tab
    const warpcastUrl = `https://warpcast.com/${figure.handle}`;
    window.open(warpcastUrl, '_blank', 'noopener,noreferrer');
  };

  const FigureCard = ({ figure, index }: { figure: ProminentFigure; index: number }) => (
    <div
      className={cn(
        "group relative bg-black/40 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-400/40 transition-all cursor-pointer",
        "hover:bg-black/60 hover:shadow-lg hover:shadow-cyan-500/10",
        index === 0 && "ring-1 ring-yellow-400/30 border-yellow-400/40" // Highlight top figure
      )}
      onClick={() => handleFigureClick(figure)}
      data-testid={`figure-card-${figure.id}`}
    >
      {/* Crown for top figure */}
      {index === 0 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-yellow-500 text-black rounded-full p-1">
            <Crown className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Header with avatar and name */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img 
            src={figure.avatarUrl} 
            alt={figure.displayName}
            className="w-10 h-10 rounded-full bg-gray-700 border border-cyan-500/30"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face`;
            }}
          />
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-black rounded-full" />
        </div>

        {/* Name and role */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-cyan-100 transition-colors">
            {figure.displayName}
          </h3>
          <p className="text-cyan-400 text-xs truncate">@{figure.handle}</p>
          <p className="text-gray-400 text-xs truncate">{figure.role}</p>
        </div>

        {/* Influence score */}
        <div className={cn(
          "text-xs px-2 py-1 rounded-full font-bold",
          getInfluenceColor(figure.influenceScore)
        )}>
          {figure.influenceScore}
        </div>
      </div>

      {/* Latest highlight */}
      <div className="mb-3">
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
          {figure.lastHighlight}
        </p>
      </div>

      {/* Footer with topics and link */}
      <div className="flex items-center justify-between">
        {/* Topics */}
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {figure.topics.slice(0, 2).map((topic, topicIndex) => (
            <Badge 
              key={topicIndex}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 border-purple-500/20"
            >
              {topic}
            </Badge>
          ))}
        </div>

        {/* External link */}
        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-black/40 border border-gray-700 rounded-lg p-3 animate-pulse">
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="h-3 bg-gray-700 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-700 rounded w-16 mb-1" />
              <div className="h-2 bg-gray-700 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-700 rounded w-8" />
          </div>
          <div className="h-3 bg-gray-700 rounded w-full mb-2" />
          <div className="h-3 bg-gray-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Prominent Figures</h2>
        </div>
        
        {/* Count badge */}
        {figures.length > 0 && (
          <Badge className="bg-cyan-500/20 text-cyan-400">
            {figures.length}
          </Badge>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Failed to load figures</p>
          <p className="text-xs text-gray-500 mt-1">Using demo data</p>
        </div>
      ) : figures.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No figures available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {figures.map((figure, index) => (
            <FigureCard key={figure.id} figure={figure} index={index} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-cyan-400 hover:text-white hover:bg-cyan-500/20 justify-center"
          onClick={() => {
            // Navigate to full figures page or refresh data
            window.location.reload();
          }}
          data-testid="view-all-figures"
        >
          <Zap className="w-4 h-4 mr-2" />
          Refresh Figures
        </Button>
      </div>
    </div>
  );
}