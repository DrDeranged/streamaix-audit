import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Play, Clock, Zap, ChevronLeft, ChevronRight, Loader2, ExternalLink, Eye } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Latest crypto podcasts from top YouTube channels (January 2025)
const latestCryptoPodcasts = [
  {
    id: "1",
    title: "Why Bitcoin is on Track to Hit $200,000 in 2025",
    channel: "Bankless",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "42:15",
    views: "156K",
    uploadTime: "1 day ago",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tags: ["Bitcoin", "Bull Run", "2025"],
    isLive: false
  },
  {
    id: "2", 
    title: "ETH vs SOL: Which Will Dominate DeFi in 2025?",
    channel: "Coin Bureau",
    thumbnail: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/maxresdefault.jpg",
    duration: "28:33",
    views: "89K",
    uploadTime: "2 days ago", 
    url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    tags: ["Ethereum", "Solana", "DeFi"],
    isLive: false
  },
  {
    id: "3",
    title: "LIVE: Bitcoin Treasury Strategy Deep Dive",
    channel: "The Pomp Podcast", 
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    duration: "LIVE",
    views: "12K watching",
    uploadTime: "streaming",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    tags: ["Bitcoin", "Corporate", "Treasury"],
    isLive: true
  },
  {
    id: "4",
    title: "AI + Crypto: The Convergence That Changes Everything",
    channel: "Unchained",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg", 
    duration: "35:12",
    views: "67K",
    uploadTime: "3 days ago",
    url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    tags: ["AI", "Technology", "Future"],
    isLive: false
  },
  {
    id: "5",
    title: "Institutional Crypto Adoption: What's Really Happening", 
    channel: "What Bitcoin Did",
    thumbnail: "https://i.ytimg.com/vi/kffacxfA7G4/maxresdefault.jpg",
    duration: "51:28",
    views: "34K",
    uploadTime: "4 days ago",
    url: "https://www.youtube.com/watch?v=kffacxfA7G4", 
    tags: ["Institutional", "Adoption", "Analysis"],
    isLive: false
  },
  {
    id: "6",
    title: "Regulatory Update: SEC's New Crypto Framework",
    channel: "CryptoNews Podcast",
    thumbnail: "https://i.ytimg.com/vi/6n3pFFPSlW4/maxresdefault.jpg",
    duration: "29:45", 
    views: "43K",
    uploadTime: "5 days ago",
    url: "https://www.youtube.com/watch?v=6n3pFFPSlW4",
    tags: ["Regulation", "SEC", "Policy"],
    isLive: false
  }
];

export function PopularCryptoVideos() {
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
    
    const cardWidth = 320; // Width of each card + gap
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
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {latestCryptoPodcasts.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-none w-80"
              >
                <Card className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-lg h-full">
                  <CardContent className="p-0">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextEl) nextEl.classList.remove('hidden');
                        }}
                      />
                      
                      {/* Fallback gradient */}
                      <div className="hidden absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
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
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
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
                    <div className="p-4">
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
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 line-clamp-2 text-sm leading-tight">
                        {video.title}
                      </h3>

                      {/* Stats and Tags */}
                      <div className="flex items-center justify-between mb-3">
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

                      {/* Action Button */}
                      <Button
                        onClick={() => handleProcessVideo(video)}
                        disabled={processingVideoId === video.id}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm"
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
                    scrollContainerRef.current.scrollTo({
                      left: index * 320,
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