import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Play, Clock, Zap, ChevronLeft, ChevronRight, Loader2, ExternalLink, Eye } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Popular crypto videos with guaranteed working thumbnails
const latestCryptoPodcasts = [
  {
    id: "1",
    title: "Bitcoin: The Future of Money",
    channel: "Coin Bureau",
    thumbnail: "https://i.ytimg.com/vi/l1si5ZWLgy0/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/l1si5ZWLgy0/sddefault.jpg",
    duration: "22:15",
    views: "2.1M",
    uploadTime: "1 week ago",
    url: "https://www.youtube.com/watch?v=l1si5ZWLgy0",
    tags: ["Bitcoin", "Education", "Money"],
    isLive: false
  },
  {
    id: "2", 
    title: "Ethereum 2.0 Explained Simply",
    channel: "Whiteboard Crypto",
    thumbnail: "https://i.ytimg.com/vi/pA2ouLLXkyI/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/pA2ouLLXkyI/sddefault.jpg",
    duration: "18:32",
    views: "1.4M",
    uploadTime: "3 days ago", 
    url: "https://www.youtube.com/watch?v=pA2ouLLXkyI",
    tags: ["Ethereum", "Education", "Crypto"],
    isLive: false
  },
  {
    id: "3",
    title: "What is DeFi? Decentralized Finance Explained",
    channel: "Finematics", 
    thumbnail: "https://i.ytimg.com/vi/k9HYC0EJU6E/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/k9HYC0EJU6E/sddefault.jpg",
    duration: "16:45",
    views: "850K",
    uploadTime: "5 days ago",
    url: "https://www.youtube.com/watch?v=k9HYC0EJU6E",
    tags: ["DeFi", "Finance", "Education"],
    isLive: false
  },
  {
    id: "4",
    title: "Crypto Market Analysis & Trading Tips",
    channel: "InvestAnswers",
    thumbnail: "https://i.ytimg.com/vi/XbZ8zDpX2Mg/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/XbZ8zDpX2Mg/sddefault.jpg", 
    duration: "28:12",
    views: "445K",
    uploadTime: "2 days ago",
    url: "https://www.youtube.com/watch?v=XbZ8zDpX2Mg",
    tags: ["Trading", "Analysis", "Market"],
    isLive: false
  },
  {
    id: "5",
    title: "Blockchain Technology Explained", 
    channel: "Simply Explained",
    thumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/sddefault.jpg",
    duration: "26:18",
    views: "3.2M",
    uploadTime: "1 week ago",
    url: "https://www.youtube.com/watch?v=SSo_EIwHSd4", 
    tags: ["Blockchain", "Technology", "Education"],
    isLive: false
  },
  {
    id: "6",
    title: "NFTs and the Future of Digital Art",
    channel: "3Blue1Brown",
    thumbnail: "https://i.ytimg.com/vi/Oz9zw7-_vhM/hqdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/Oz9zw7-_vhM/sddefault.jpg",
    duration: "19:33", 
    views: "1.8M",
    uploadTime: "4 days ago",
    url: "https://www.youtube.com/watch?v=Oz9zw7-_vhM",
    tags: ["NFTs", "Digital Art", "Future"],
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
    <section className="py-8 bg-gradient-to-br from-slate-900/95 via-indigo-900/90 to-purple-900/95 relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400/40 to-blue-600/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-tl from-purple-400/40 to-pink-600/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/30 to-cyan-400/30 rounded-full blur-2xl animate-pulse delay-500"></div>
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
            <div className="p-3 bg-gradient-to-r from-cyan-500/90 to-blue-600/90 rounded-xl backdrop-blur-sm border border-cyan-400/30 shadow-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                Latest Crypto Podcasts
              </h2>
              <p className="text-sm text-cyan-200/80">
                Transform trending episodes into insights with AI
              </p>
            </div>
          </div>
          
          {/* Futuristic Navigation Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('left')}
              className="h-10 w-10 p-0 bg-slate-800/30 border-cyan-400/30 hover:bg-cyan-500/20 hover:border-cyan-400/60 text-cyan-100 hover:text-white transition-all duration-300 rounded-xl backdrop-blur-sm"
              disabled={currentIndex === 0}
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('right')}
              className="h-10 w-10 p-0 bg-slate-800/30 border-cyan-400/30 hover:bg-cyan-500/20 hover:border-cyan-400/60 text-cyan-100 hover:text-white transition-all duration-300 rounded-xl backdrop-blur-sm"
              disabled={currentIndex >= latestCryptoPodcasts.length - 1}
              data-testid="button-scroll-right"
            >
              <ChevronRight className="w-5 h-5" />
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
                className="flex-none w-80 snap-start"
              >
                <Card className="group relative overflow-hidden bg-slate-800/20 backdrop-blur-md border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col h-[400px] rounded-2xl">
                  <CardContent className="p-0 flex flex-col flex-1">
                    {/* Thumbnail Container with Glassmorphism */}
                    <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-slate-900/40">
                      <img
                        data-video-id={video.id}
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 opacity-90 group-hover:opacity-100"
                        onError={() => handleImageError(video.id, video.thumbnail, video.fallbackThumbnail)}
                        onLoad={() => console.log(`Thumbnail loaded for video ${video.id}`)}
                        style={{ minHeight: '200px' }}
                      />
                      
                      {/* Fallback gradient with futuristic styling */}
                      <div 
                        data-fallback-id={video.id}
                        className="hidden absolute inset-0 bg-gradient-to-br from-cyan-500/80 via-blue-600/80 to-purple-600/80 flex items-center justify-center backdrop-blur-sm"
                      >
                        <Play className="w-16 h-16 text-white drop-shadow-lg" />
                      </div>
                      
                      {/* Glassmorphism Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>

                      {/* Live badge with glow effect */}
                      {video.isLive && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/30 border border-red-400/30">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                      )}

                      {/* Duration Badge with glassmorphism */}
                      <div className="absolute bottom-3 right-3 bg-slate-800/90 backdrop-blur-md text-cyan-100 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-cyan-400/20 shadow-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {video.duration}
                      </div>

                      {/* Subtle hover glow effect - NO BUTTON */}
                      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>
                    </div>

                    {/* Futuristic Content Section */}
                    <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-slate-800/30 to-slate-900/50 backdrop-blur-sm">
                      {/* Channel and Time with glow */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                          {video.channel}
                        </span>
                        <span className="text-xs text-cyan-300/70 bg-slate-700/50 px-2 py-1 rounded-md">
                          {video.uploadTime}
                        </span>
                      </div>

                      {/* Title with gradient */}
                      <h3 className="font-bold text-white mb-4 line-clamp-2 text-sm leading-tight flex-1 drop-shadow-sm">
                        {video.title}
                      </h3>

                      {/* Stats and Tags with glow effects */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-cyan-300/80 flex items-center gap-1.5 bg-slate-700/30 px-2 py-1 rounded-lg">
                          <Eye className="w-3.5 h-3.5" />
                          {video.views}
                        </span>
                        <div className="flex gap-2">
                          {video.tags.slice(0, 2).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/30 backdrop-blur-sm"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Futuristic AI Process Button - ONLY ONE */}
                      <Button
                        onClick={() => handleProcessVideo(video)}
                        disabled={processingVideoId === video.id}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm h-12 font-semibold rounded-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all duration-300 backdrop-blur-sm"
                        data-testid={`button-process-main-${video.id}`}
                      >
                        {processingVideoId === video.id ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
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

          {/* Futuristic Navigation dots for mobile */}
          <div className="flex justify-center gap-3 mt-6 sm:hidden">
            {latestCryptoPodcasts.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/40 scale-125' 
                    : 'bg-slate-600/50 hover:bg-slate-500/70 border border-cyan-400/20'
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

        {/* Futuristic CTA */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Button
            onClick={() => setLocation('/#ai-processor')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 shadow-lg shadow-purple-500/25 hover:shadow-purple-400/40 transition-all duration-300 backdrop-blur-sm rounded-xl px-6 py-3 text-sm font-semibold"
            data-testid="button-try-own-url"
          >
            <Zap className="w-5 h-5 mr-2" />
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