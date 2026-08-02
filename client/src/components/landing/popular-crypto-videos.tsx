import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionTitle from "@/components/ds/SectionTitle";
import Surface from "@/components/ds/Surface";
import { motion } from "framer-motion";
import { Play, Clock, ChevronLeft, ChevronRight, Loader2, Eye, Brain } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Long-form crypto podcasts (60+ minutes) showcasing AI processing utility
const latestCryptoPodcasts = [
  {
    id: "1",
    title: "Bitcoin Monetary Theory: Complete Guide with Saifedean Ammous",
    channel: "What Bitcoin Did",
    thumbnail: "https://i.ytimg.com/vi/Zbm772vF-5M/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/Zbm772vF-5M/sddefault.jpg",
    duration: "2h 15m",
    views: "124K",
    uploadTime: "2 days ago",
    url: "https://www.youtube.com/watch?v=Zbm772vF-5M",
    tags: ["Bitcoin", "Economics", "Theory"],
    isLive: false,
    host: "Peter McCormack",
    guest: "Saifedean Ammous"
  },
  {
    id: "2", 
    title: "Ethereum Roadmap 2024: Sharding & Rollups Deep Dive",
    channel: "Bankless",
    thumbnail: "https://i.ytimg.com/vi/kGjFTzRTH3Q/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/kGjFTzRTH3Q/sddefault.jpg",
    duration: "1h 45m",
    views: "89K",
    uploadTime: "4 days ago", 
    url: "https://www.youtube.com/watch?v=kGjFTzRTH3Q",
    tags: ["Ethereum", "Scaling", "Technical"],
    isLive: false,
    host: "Ryan Sean Adams",
    guest: "Vitalik Buterin"
  },
  {
    id: "3",
    title: "DeFi Lessons: $100B TVL Journey with Uniswap Founder",
    channel: "Unchained", 
    thumbnail: "https://i.ytimg.com/vi/k9HYC0EJU6E/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/k9HYC0EJU6E/sddefault.jpg",
    duration: "1h 20m",
    views: "67K",
    uploadTime: "1 week ago",
    url: "https://www.youtube.com/watch?v=k9HYC0EJU6E",
    tags: ["DeFi", "Uniswap", "AMM"],
    isLive: false,
    host: "Laura Shin",
    guest: "Hayden Adams"
  },
  {
    id: "4",
    title: "Corporate Bitcoin Strategy: MicroStrategy Deep Dive",
    channel: "The Investors Podcast",
    thumbnail: "https://i.ytimg.com/vi/mC43pZkpTec/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/mC43pZkpTec/sddefault.jpg", 
    duration: "2h 30m",
    views: "156K",
    uploadTime: "3 days ago",
    url: "https://www.youtube.com/watch?v=mC43pZkpTec",
    tags: ["Corporate", "Strategy", "Treasury"],
    isLive: false,
    host: "Preston Pysh",
    guest: "Michael Saylor"
  },
  {
    id: "5",
    title: "MEV & Trading Infrastructure: The Future of DEXs", 
    channel: "Epicenter",
    thumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/sddefault.jpg",
    duration: "1h 55m",
    views: "34K",
    uploadTime: "5 days ago",
    url: "https://www.youtube.com/watch?v=SSo_EIwHSd4", 
    tags: ["MEV", "Trading", "Infrastructure"],
    isLive: false,
    host: "Sebastien Couture",
    guest: "Dan Robinson"
  },
  {
    id: "6",
    title: "Crypto Market Psychology & Portfolio Construction",
    channel: "InvestAnswers",
    thumbnail: "https://i.ytimg.com/vi/l1si5ZWLgy0/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/l1si5ZWLgy0/sddefault.jpg",
    duration: "1h 10m", 
    views: "78K",
    uploadTime: "1 day ago",
    url: "https://www.youtube.com/watch?v=l1si5ZWLgy0",
    tags: ["Psychology", "Portfolio", "Strategy"],
    isLive: false,
    host: "James"
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
    console.log('Processing video clicked:', video.title, video.url);
    console.log('User authenticated:', isAuthenticated);
    
    setProcessingVideoId(video.id);
    console.log('Set processing video ID:', video.id);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, navigating to sign in with return URL');
      toast({
        title: "Sign in to continue",
        description: "Redirecting to sign in page...",
      });
      
      // Navigate to auth with return URL that includes the video processing
      setTimeout(() => {
        setProcessingVideoId(null);
        setLocation(`/auth?return=${encodeURIComponent('/#ai-processor?url=' + encodeURIComponent(video.url) + '&autostart=true')}`);
      }, 1500);
      return;
    }
    
    toast({
      title: "Starting AI Analysis...",
      description: `Processing "${video.title}"`,
    });

    // Navigate to AI processor with hash navigation and auto-start
    setTimeout(() => {
      console.log('Navigating to AI processor with URL:', video.url);
      setProcessingVideoId(null);
      
      // Use window.location.hash for proper hash navigation
      window.location.hash = `ai-processor?url=${encodeURIComponent(video.url)}&autostart=true`;
      
      // Scroll to processor section after navigation
      setTimeout(() => {
        const element = document.getElementById('ai-processor');
        console.log('Found AI processor element:', !!element);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 1000);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    // Fixed card width for consistency
    const cardWidth = 320; // Fixed width for all screens
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
    <section className="bg-ink-page py-12">

      <div className="container mx-auto px-4">
        {/* Professional Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <SectionTitle eyebrow="StreamAiX intelligence" className="text-xl sm:text-2xl">
            Live AI Processing
          </SectionTitle>
          <p className="mt-2 text-sm text-secondary">
            See real AI analysis in action with trending crypto content
          </p>
        </motion.div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('left')}
              className="h-10 w-10 rounded-xl border border-ink-edge bg-ink-surface p-0 text-secondary transition-colors duration-300 hover:bg-ink-raised hover:text-primary disabled:opacity-40"
              disabled={currentIndex === 0}
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('right')}
              className="h-10 w-10 rounded-xl border border-ink-edge bg-ink-surface p-0 text-secondary transition-colors duration-300 hover:bg-ink-raised hover:text-primary disabled:opacity-40"
              disabled={currentIndex >= latestCryptoPodcasts.length - 1}
              data-testid="button-scroll-right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
                className="flex-none w-80 snap-start"
              >
                <Surface className="group relative flex h-[400px] flex-col overflow-hidden border border-ink-edge bg-ink-surface transition-transform duration-500 hover:scale-[1.02] hover:border-accent-core/50">
                  <div className="flex flex-1 flex-col p-0">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        data-video-id={video.id}
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => handleImageError(video.id, video.thumbnail, video.fallbackThumbnail)}
                        onLoad={() => console.log(`Thumbnail loaded for video ${video.id}`)}
                        style={{ minHeight: '200px' }}
                      />
                      
                      {/* Fallback gradient */}
                      <div 
                        data-fallback-id={video.id}
                         className="absolute inset-0 hidden items-center justify-center bg-ink-raised"
                      >
                         <Play className="h-12 w-12 text-accent-bright" />
                      </div>
                      
                      {/* Overlay */}
                       <div className="pointer-events-none absolute inset-0 bg-ink-page/20"></div>

                      {/* Live badge */}
                      {video.isLive && (
                         <div className="absolute left-2 top-2 flex items-center gap-1 rounded-xl bg-loss px-2 py-1 text-xs text-primary animate-pulse">
                           <div className="h-2 w-2 rounded-full bg-ink-page"></div>
                          LIVE
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
                           <div className="rounded-xl border border-ink-edge bg-ink-page/90 px-4 py-2">
                             <span className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Brain className="w-4 h-4" />
                              AI Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                     <div className="flex flex-1 flex-col p-4">
                      {/* Channel and Time */}
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium text-body">
                          {video.channel}
                        </span>
                         <span className="text-xs text-muted">
                          {video.uploadTime}
                        </span>
                      </div>

                      {/* Title */}
                       <h3 className="mb-3 flex-1 text-sm font-medium leading-tight text-primary line-clamp-2">
                        {video.title}
                      </h3>

                      {/* Stats and Tags */}
                       <div className="mb-4 flex items-center justify-between">
                         <span className="flex items-center gap-1 text-xs text-secondary">
                          <Eye className="w-3 h-3" />
                          {video.views}
                        </span>
                        <div className="flex gap-1">
                          {video.tags.slice(0, 2).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                               className="rounded-xl border border-ink-edge bg-ink-raised px-1.5 py-0.5 text-xs text-secondary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Professional Action Button */}
                      <Button
                        onClick={() => handleProcessVideo(video)}
                        disabled={processingVideoId === video.id}
                         className="grad-accent glow-accent h-12 w-full rounded-xl font-medium text-primary transition-transform duration-300 hover:scale-[1.02] active:translate-y-[-2px]"
                        data-testid={`button-process-main-${video.id}`}
                      >
                        {processingVideoId === video.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Process Episode
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            ))}
          </div>

          {/* Navigation dots for mobile */}
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {latestCryptoPodcasts.map((_, index) => (
              <button
                key={index}
                 className={`h-2 w-2 rounded-full transition-colors ${
                   index === currentIndex ? 'bg-accent-core glow-accent' : 'bg-ink-edge'
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  if (scrollContainerRef.current) {
                    const cardWidth = 320; // Fixed width to match scroll calculation
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

      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}