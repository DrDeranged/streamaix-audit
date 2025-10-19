import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Play, Clock, Wifi, ChevronLeft, ChevronRight, Loader2, Eye, Brain, BarChart3, FileText, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function LiveCryptoVideos() {
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
        title: "Processing Failed",
        description: "Failed to start AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsProcessing(null), 2000);
    }
  };

  if (isLoading && !videos.length) {
    return (
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 dark:from-purple-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">
              Live AI Processing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See real AI analysis in action with trending crypto content
            </p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading latest crypto content...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 dark:from-purple-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">
              Live AI Processing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See real AI analysis in action with trending crypto content
            </p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Failed to load live content</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with Live Status */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 dark:from-purple-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">
              Live AI Processing
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">
                {isFetching ? 'Updating...' : 'Live'}
              </span>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            See real AI analysis in action with trending crypto content
          </p>
          
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Videos Grid */}
        <div className="relative">
          {showScrollButtons && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border shadow-lg ${
                  !canScrollLeft ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background'
                }`}
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border shadow-lg ${
                  !canScrollRight ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background'
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
                <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl border-slate-200/50 dark:border-purple-500/40 hover:border-purple-400 dark:hover:border-fuchsia-400 hover:scale-[1.02]">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                      <img
                        src={video.thumbnails?.high?.url || video.thumbnails?.medium?.url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={() => console.log(`Thumbnail loaded for video ${video.id}`)}
                        style={{ minHeight: '200px' }}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>

                      {/* Live badge for real-time indicator */}
                      {isFetching && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          UPDATING
                        </div>
                      )}

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>

                      {/* Professional Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 via-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                            <span className="text-white font-medium text-sm flex items-center gap-2">
                              <Brain className="w-4 h-4" />
                              AI Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{video.channelTitle}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.viewCount}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-muted-foreground">{video.uploadTime}</span>
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
                          className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 hover:from-purple-600 hover:via-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300"
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
                          className="px-3 border-purple-300 dark:border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform hours of crypto content into actionable insights. Our AI processes any podcast or video to extract key points, market analysis, and investment strategies.
            </p>
          </div>
          
          <div className="flex justify-center items-center">
            {isAuthenticated ? (
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setLocation('/dashboard')}
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-3"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            ) : (
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setLocation('/auth')}
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-3"
              >
                <FileText className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}