import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Pause, Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlphaTickerItem {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  url: string;
  timestamp: string;
}

interface AlphaTickerProps {
  className?: string;
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
}

export function AlphaTicker({ className, speed = 50, pauseOnHover = true }: AlphaTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionRef = useRef<number>(0);

  // Fetch alpha ticker items from API
  const { data: tickerData, isLoading } = useQuery({
    queryKey: ['/api/alpha-ticker'],
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
    refetchOnMount: 'always'
  });

  const items: AlphaTickerItem[] = (tickerData as any)?.items || [];

  // Smooth scrolling animation
  useEffect(() => {
    const startAnimation = () => {
      if (!scrollRef.current || !tickerRef.current) return;
      
      const scroll = () => {
        if (isPaused || (pauseOnHover && isHovered)) {
          animationRef.current = requestAnimationFrame(scroll);
          return;
        }

        const ticker = tickerRef.current;
        const container = scrollRef.current;
        
        if (ticker && container) {
          positionRef.current += speed / 60; // 60fps
          
          // Reset position when ticker has scrolled completely
          if (positionRef.current >= ticker.scrollWidth - container.clientWidth) {
            positionRef.current = -container.clientWidth;
          }
          
          ticker.style.transform = `translateX(-${positionRef.current}px)`;
        }
        
        animationRef.current = requestAnimationFrame(scroll);
      };
      
      animationRef.current = requestAnimationFrame(scroll);
    };

    if (items.length > 0) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items.length, isPaused, isHovered, speed, pauseOnHover]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const handleItemClick = (item: AlphaTickerItem) => {
    // Open link in new tab
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className={cn(
        "bg-black/90 border-b border-cyan-500/20 backdrop-blur-sm",
        "h-16 flex items-center justify-center",
        className
      )}>
        <div className="flex items-center space-x-2 text-cyan-400">
          <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
          <span className="text-sm font-mono">Loading alpha feed...</span>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={cn(
        "bg-black/90 border-b border-cyan-500/20 backdrop-blur-sm",
        "h-16 flex items-center justify-center",
        className
      )}>
        <div className="text-cyan-400 text-sm font-mono">No alpha data available</div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-black/95 border-b border-cyan-500/30 backdrop-blur-sm overflow-hidden",
        "h-16 group",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="alpha-ticker"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
      
      {/* Ticker header */}
      <div className="absolute left-0 top-0 h-full bg-black/95 border-r border-cyan-500/30 z-10">
        <div className="h-full px-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-sm font-bold text-cyan-400 tracking-wider">ALPHA</span>
        </div>
      </div>

      {/* Scrolling content */}
      <div 
        ref={scrollRef}
        className="h-full ml-20 overflow-hidden"
      >
        <div 
          ref={tickerRef}
          className="h-full flex items-center whitespace-nowrap"
        >
          {/* Duplicate items for seamless loop */}
          {[...items, ...items].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="inline-flex items-center mr-8 cursor-pointer hover:bg-white/5 px-3 py-2 rounded-lg transition-colors group/item"
              onClick={() => handleItemClick(item)}
              data-testid={`ticker-item-${item.id}`}
            >
              {/* Impact badge */}
              <Badge 
                className={cn(
                  "text-xs font-bold px-2 py-1 mr-3 min-w-fit",
                  getImpactColor(item.impact)
                )}
                data-testid={`impact-${item.impact}`}
              >
                {item.impact.toUpperCase()}
              </Badge>

              {/* Title with sentiment color */}
              <span 
                className={cn(
                  "text-sm font-medium transition-colors max-w-md truncate",
                  getSentimentColor(item.sentiment),
                  "group-hover/item:text-white"
                )}
              >
                {item.title}
              </span>

              {/* Hover indicator */}
              <ChevronRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Controls overlay (appears on hover) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsPaused(!isPaused)}
          className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 p-2"
          data-testid="ticker-pause-button"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
      </div>

      {/* Fade edges */}
      <div className="absolute left-20 top-0 h-full w-8 bg-gradient-to-r from-black/95 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-black/95 to-transparent pointer-events-none" />
    </div>
  );
}