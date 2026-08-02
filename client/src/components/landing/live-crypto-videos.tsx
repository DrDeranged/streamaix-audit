import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionTitle from "@/components/ds/SectionTitle";
import Surface from "@/components/ds/Surface";
import { motion } from "framer-motion";
import { Play, Clock, ChevronLeft, ChevronRight, Loader2, Eye, Brain, BarChart3, FileText, RefreshCw, Circle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface LiveCryptoVideosProps {
  embedded?: boolean;
}

export default function LiveCryptoVideos({ embedded = false }: LiveCryptoVideosProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fetch real YouTube crypto content with optimized caching
  const { data: youtubeData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['/api/youtube/crypto-content'],
    refetchInterval: false, // Disable auto-refresh to save API calls
    staleTime: 15 * 60 * 1000, // 15 minutes - YouTube content doesn't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 3
  });

  const videos = (youtubeData as any)?.videos || [];
  const lastUpdated = (youtubeData as any)?.lastUpdated;

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // Fixed width to match scroll calculation
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollLeft - cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 320;
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollLeft + cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      updateScrollButtons();
      scrollContainer.addEventListener('scroll', updateScrollButtons);
      
      const resizeObserver = new ResizeObserver(() => {
        updateScrollButtons();
        setShowScrollButtons(scrollContainer.scrollWidth > scrollContainer.clientWidth);
      });
      
      resizeObserver.observe(scrollContainer);
      
      return () => {
        scrollContainer.removeEventListener('scroll', updateScrollButtons);
        resizeObserver.disconnect();
      };
    }
  }, [videos]);


  const handleProcessVideo = async (video: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to process videos with AI.",
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    setIsProcessing(video.id);
    
    try {
      // Navigate to processor with the video URL pre-filled
      const encodedUrl = encodeURIComponent(video.url);
      window.location.href = `/#ai-processor?url=${encodedUrl}&autostart=true`;
      
      toast({
        title: "Processing Started",
        description: `AI analysis started for "${video.title.slice(0, 50)}..."`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Unable to process video",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsProcessing(null), 2000);
    }
  };

  if (isLoading && !videos.length) {
    if (embedded) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-secondary">
              <Loader2 className="w-6 h-6 animate-spin text-accent-bright" />
              <span className="text-secondary">Loading latest crypto content...</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <section className="pt-20 pb-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionTitle eyebrow={<span className="inline-flex items-center gap-2"><Circle className="h-2 w-2 fill-gain text-gain" /> Live</span>}>
              Live AI Processing
            </SectionTitle>
            <p className="mt-2 text-body">Real-time analysis of trending crypto content</p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-secondary">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading latest crypto content...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    if (embedded) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <p className="text-loss mb-4">Failed to load live content</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    return (
      <section className="pt-20 pb-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionTitle eyebrow={<span className="inline-flex items-center gap-2"><Circle className="h-2 w-2 fill-gain text-gain" /> Live</span>}>
              Live AI Processing
            </SectionTitle>
            <p className="mt-2 text-body">Real-time analysis of trending crypto content</p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-loss mb-4">Failed to load live content</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const content = (
    <div className={`max-w-7xl mx-auto px-6 ${embedded ? 'pb-12' : ''}`}>
      {/* Header with Live Status - only show if not embedded */}
      {!embedded && (
        <div className="text-center mb-12">
          <SectionTitle eyebrow={<span className="inline-flex items-center gap-2"><Circle className="h-2 w-2 fill-gain text-gain" /> Live</span>}>
            Live AI Processing
          </SectionTitle>
          <p className="mt-2 text-body">Real-time analysis of trending crypto content</p>
          
          {lastUpdated && (
            <p className="text-sm text-secondary mt-2">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
      
      {/* Last updated for embedded mode */}
      {embedded && lastUpdated && (
        <div className="text-center mb-8">
          <p className="text-sm text-secondary">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}

        {/* Videos Grid */}
        <div className="relative">
          {showScrollButtons && (
            <>
              <Button
                variant="ghost"
                size="icon"
                 className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-xl border border-ink-edge bg-ink-surface/90 text-primary shadow-lg backdrop-blur-sm ${
                   !canScrollLeft ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink-raised'
                }`}
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                 className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-xl border border-ink-edge bg-ink-surface/90 text-primary shadow-lg backdrop-blur-sm ${
                   !canScrollRight ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink-raised'
                }`}
                onClick={scrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((video: any, index: number) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-80"
              >
                <Surface className="group overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-accent-core bg-ink-surface">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-ink-raised">
                      <img
                        src={video.thumbnails?.high?.url || video.thumbnails?.medium?.url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={() => console.log(`Thumbnail loaded for video ${video.id}`)}
                        style={{ minHeight: '200px' }}
                      />
                      
                      {/* Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-ink-page/20"></div>

                      {/* Live badge for real-time indicator */}
                      {isFetching && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-xl bg-loss px-2 py-1 text-xs text-ink-page animate-pulse">
                          <div className="h-2 w-2 rounded-full bg-ink-page"></div>
                          UPDATING
                        </div>
                      )}

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-xl bg-ink-page/90 px-2 py-1 text-xs text-primary">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>

                      {/* Professional Hover Effect */}
                      <div className="pointer-events-none absolute inset-0 bg-accent-core/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-xl border border-ink-edge bg-ink-page/80 px-4 py-2 backdrop-blur-sm">
                            <span className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Brain className="w-4 h-4" />
                              AI Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-primary transition-colors group-hover:text-accent-bright">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-secondary">{video.channelTitle}</span>
                        <span className="flex items-center gap-1 text-xs text-secondary">
                          <Eye className="w-3 h-3" />
                          {video.viewCount}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-secondary">{video.uploadTime}</span>
                        <div className="flex items-center gap-1">
                          {video.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                          <Button
                          size="sm"
                          onClick={() => handleProcessVideo(video)}
                          disabled={isProcessing === video.id}
                           className="grad-accent glow-accent flex-1 text-primary transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent-core focus-visible:ring-offset-2"
                        >
                          {isProcessing === video.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Process with AI
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(video.url, '_blank')}
                           className="rounded-xl border border-ink-edge px-3 text-secondary hover:border-accent-core hover:bg-ink-raised hover:text-primary"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                </Surface>
              </motion.div>
            ))}
          </div>
        </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <div className="flex items-center justify-center gap-2 mb-6">
          <p className="text-body max-w-2xl mx-auto">
            Transform hours of crypto content into actionable insights. Our AI processes any podcast or video to extract key points, market analysis, and investment strategies.
          </p>
        </div>
        
        <div className="flex justify-center items-center">
          {isAuthenticated ? (
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation('/dashboard')}
               className="rounded-xl border-accent-core text-accent-bright hover:bg-ink-raised px-8 py-3 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent-core focus-visible:ring-offset-2"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Dashboard
            </Button>
          ) : (
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation('/auth')}
               className="rounded-xl border-accent-core text-accent-bright hover:bg-ink-raised px-8 py-3 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent-core focus-visible:ring-offset-2"
            >
              <FileText className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="pt-20 pb-20 bg-transparent">
      {content}
    </section>
  );
}