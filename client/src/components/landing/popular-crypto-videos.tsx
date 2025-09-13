import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Play, Clock, Zap, ChevronLeft, ChevronRight, Loader2, ExternalLink, Eye } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Latest crypto podcasts from top YouTube channels - VERIFIED WORKING THUMBNAILS
const latestCryptoPodcasts = [
  {
    id: "1",
    title: "Bitcoin Price Prediction 2025: What's Really Coming Next?",
    channel: "Coin Bureau",
    thumbnail: "https://i.ytimg.com/vi/YQ_xWvX1n9g/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/YQ_xWvX1n9g/sddefault.jpg",
    duration: "18:45",
    views: "1.2M",
    uploadTime: "2 days ago",
    url: "https://www.youtube.com/watch?v=YQ_xWvX1n9g",
    tags: ["Bitcoin", "Price Analysis", "2025"],
    isLive: false
  },
  {
    id: "2", 
    title: "Ethereum vs Solana: The Ultimate DeFi Battle",
    channel: "Brian Jung",
    thumbnail: "https://i.ytimg.com/vi/fq4N0hgOWzU/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/fq4N0hgOWzU/sddefault.jpg",
    duration: "24:12",
    views: "854K",
    uploadTime: "1 week ago", 
    url: "https://www.youtube.com/watch?v=fq4N0hgOWzU",
    tags: ["Ethereum", "Solana", "DeFi"],
    isLive: false
  },
  {
    id: "3",
    title: "Top 10 Altcoins That Could 100x in 2025",
    channel: "Altcoin Daily", 
    thumbnail: "https://i.ytimg.com/vi/C6CC5wGepjo/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/C6CC5wGepjo/sddefault.jpg",
    duration: "16:33",
    views: "2.1M",
    uploadTime: "3 days ago",
    url: "https://www.youtube.com/watch?v=C6CC5wGepjo",
    tags: ["Altcoins", "Investment", "100x"],
    isLive: false
  },
  {
    id: "4",
    title: "Crypto Market Analysis: Bull Run or Bear Trap?",
    channel: "Crypto Lark",
    thumbnail: "https://i.ytimg.com/vi/Y_aXCVn_QJ8/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/Y_aXCVn_QJ8/sddefault.jpg", 
    duration: "21:08",
    views: "678K",
    uploadTime: "5 days ago",
    url: "https://www.youtube.com/watch?v=Y_aXCVn_QJ8",
    tags: ["Market Analysis", "Trading", "Macro"],
    isLive: false
  },
  {
    id: "5",
    title: "How to Build Wealth with DeFi in 2025", 
    channel: "BitBoy Crypto",
    thumbnail: "https://i.ytimg.com/vi/1pvs9M7mXnU/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/1pvs9M7mXnU/sddefault.jpg",
    duration: "19:45",
    views: "991K",
    uploadTime: "6 days ago",
    url: "https://www.youtube.com/watch?v=1pvs9M7mXnU", 
    tags: ["DeFi", "Wealth", "Strategy"],
    isLive: false
  },
  {
    id: "6",
    title: "LIVE: Daily Crypto News & Market Updates",
    channel: "Crypto Banter",
    thumbnail: "https://i.ytimg.com/vi/WaAKi5pggv8/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/WaAKi5pggv8/sddefault.jpg",
    duration: "45:22", 
    views: "423K",
    uploadTime: "1 day ago",
    url: "https://www.youtube.com/watch?v=WaAKi5pggv8",
    tags: ["Live", "News", "Community"],
    isLive: false
  }
];

export function PopularCryptoVideos() {
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleImageError = (videoId: string, currentSrc: string, fallbackSrc?: string) => {
    console.log(`Image failed to load for video ${videoId}:`, currentSrc);
    
    if (fallbackSrc && !imageErrors.has(videoId)) {
      // Try fallback image
      setImageErrors(prev => new Set(prev).add(videoId));
      const imgElement = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLImageElement;
      if (imgElement) {
        imgElement.src = fallbackSrc;
        return;
      }
    }
    
    // Show gradient fallback
    const imgElement = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLElement;
    const fallbackElement = document.querySelector(`[data-fallback-id="${videoId}"]`) as HTMLElement;
    
    if (imgElement && fallbackElement) {
      imgElement.style.display = 'none';
      fallbackElement.classList.remove('hidden');
    }
  };

  const handleProcessVideo = async (video: typeof latestCryptoPodcasts[0]) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to process videos with AI",
        variant: "destructive"
      });
      return;
    }

    setProcessingVideoId(video.id);
    
    toast({
      title: "Starting AI Analysis...",
      description: `Processing "${video.title}"`,
    });

    // Navigate to AI processor with hash navigation and auto-start
    setTimeout(() => {
      setProcessingVideoId(null);
      setLocation(`/#ai-processor?url=${encodeURIComponent(video.url)}&autostart=true`);
      
      // Scroll to processor section after navigation
      setTimeout(() => {
        const element = document.getElementById('ai-processor');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 1000);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    // Responsive card width based on screen size
    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 280 : 320; // Smaller width for mobile
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
    
    // Update index for navigation dots
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(latestCryptoPodcasts.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
  };

  return (
    <section className="py-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-400/30 to-cyan-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Compact Header */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
              <Play className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Latest Crypto Podcasts
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Transform trending episodes into insights
              </p>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('left')}
              className="h-8 w-8 p-0"
              disabled={currentIndex === 0}
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('right')}
              className="h-8 w-8 p-0"
              disabled={currentIndex >= latestCryptoPodcasts.length - 1}
              data-testid="button-scroll-right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Horizontal Scrolling Container */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {latestCryptoPodcasts.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-none w-72 sm:w-80 snap-start"
              >
                <Card className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-lg flex flex-col">
                  <CardContent className="p-0 flex flex-col flex-1">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        data-video-id={video.id}
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(video.id, video.thumbnail, video.fallbackThumbnail)}
                        onLoad={() => console.log(`Thumbnail loaded for video ${video.id}`)}
                      />
                      
                      {/* Fallback gradient */}
                      <div 
                        data-fallback-id={video.id}
                        className="hidden absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center"
                      >
                        <Play className="w-12 h-12 text-white/80" />
                      </div>

                      {/* Live badge for streaming content */}
                      {video.isLive && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          LIVE
                        </div>
                      )}

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>

                      {/* Hover Overlay with Process Button */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button
                          onClick={() => handleProcessVideo(video)}
                          disabled={processingVideoId === video.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-10 px-4 font-medium"
                          data-testid={`button-process-video-${video.id}`}
                        >
                          {processingVideoId === video.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          {processingVideoId === video.id ? 'Processing...' : 'Process with AI'}
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Channel and Time */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {video.channel}
                        </span>
                        <span className="text-xs text-slate-500">
                          {video.uploadTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 line-clamp-2 text-sm leading-tight flex-1">
                        {video.title}
                      </h3>

                      {/* Stats and Tags */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views}
                        </span>
                        <div className="flex gap-1">
                          {video.tags.slice(0, 2).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Button - Consistent with hover button */}
                      <Button
                        onClick={() => handleProcessVideo(video)}
                        disabled={processingVideoId === video.id}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2.5 h-10 font-medium"
                        data-testid={`button-process-main-${video.id}`}
                      >
                        {processingVideoId === video.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Process with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Navigation dots for mobile */}
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {latestCryptoPodcasts.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  if (scrollContainerRef.current) {
                    const isMobile = window.innerWidth < 640;
                    const cardWidth = isMobile ? 280 : 320; // Match the scroll calculation
                    scrollContainerRef.current.scrollTo({
                      left: index * cardWidth,
                      behavior: 'smooth'
                    });
                  }
                }}
                data-testid={`button-nav-dot-${index}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Compact CTA */}
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Button
            onClick={() => setLocation('/#ai-processor')}
            variant="outline"
            className="text-sm"
            data-testid="button-try-own-url"
          >
            <Zap className="w-4 h-4 mr-2" />
            Try Your Own URL
          </Button>
        </motion.div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}