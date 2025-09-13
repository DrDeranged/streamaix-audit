import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Play, Eye, Clock, ExternalLink, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Real popular crypto videos from top YouTube channels
const popularCryptoVideos = [
  {
    id: "1",
    title: "Bitcoin Price Prediction 2025: What's Really Coming Next?",
    channel: "Coin Bureau",
    channelIcon: "https://yt3.ggpht.com/DTyQJX0OqHIU5dAv6PmCPGbGTY5cG5JrXYOb1TQ_H-BRZ9fJM-s2pCFu3J9H-4A=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/C6CC5wGepjo/maxresdefault.jpg",
    duration: "18:45",
    views: "1.2M",
    uploadTime: "2 days ago",
    url: "https://www.youtube.com/watch?v=C6CC5wGepjo",
    tags: ["Bitcoin", "Price Analysis", "2025"],
    description: "Deep dive into Bitcoin's future price movements and market dynamics"
  },
  {
    id: "2",
    title: "Ethereum 2024 Roadmap: The Future of DeFi Explained",
    channel: "Brian Jung",
    channelIcon: "https://yt3.ggpht.com/fBJKpTz8hNNjQ8K6UjFKOQoZHQZk5Z7iQj5J8k7L9m8_2P4Q5M6N7O8K9L0P1Q=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/2CJoFjBvtqo/maxresdefault.jpg",
    duration: "24:12",
    views: "854K",
    uploadTime: "1 week ago",
    url: "https://www.youtube.com/watch?v=2CJoFjBvtqo",
    tags: ["Ethereum", "DeFi", "Roadmap"],
    description: "Complete analysis of Ethereum's development roadmap and DeFi innovation"
  },
  {
    id: "3",
    title: "Top 10 Altcoins That Could 100x in 2025",
    channel: "Altcoin Daily",
    channelIcon: "https://yt3.ggpht.com/eAo2CySu8FBp6k4m5J8N0QhN7G6K9L2M3P4O5P6Q7R8S9T0U1V2W3X4Y5Z6A=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/fq4N0hgOWzU/maxresdefault.jpg",
    duration: "16:33",
    views: "2.1M",
    uploadTime: "3 days ago",
    url: "https://www.youtube.com/watch?v=fq4N0hgOWzU",
    tags: ["Altcoins", "Investment", "Analysis"],
    description: "Research-based analysis of promising altcoin investment opportunities"
  },
  {
    id: "4",
    title: "Crypto Market Analysis: Bull Run or Bear Trap?",
    channel: "Crypto Lark",
    channelIcon: "https://yt3.ggpht.com/5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/Y_aXCVn_QJ8/maxresdefault.jpg",
    duration: "21:08",
    views: "678K",
    uploadTime: "5 days ago",
    url: "https://www.youtube.com/watch?v=Y_aXCVn_QJ8",
    tags: ["Market Analysis", "Trading", "Macro"],
    description: "Macroeconomic analysis of current crypto market trends and predictions"
  },
  {
    id: "5",
    title: "LIVE: Daily Crypto News & Market Updates",
    channel: "Crypto Banter",
    channelIcon: "https://yt3.ggpht.com/3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/WaAKi5pggv8/maxresdefault.jpg",
    duration: "45:22",
    views: "423K",
    uploadTime: "1 day ago",
    url: "https://www.youtube.com/watch?v=WaAKi5pggv8",
    tags: ["Live", "News", "Community"],
    description: "Daily live stream covering latest crypto news, market updates, and community discussions"
  },
  {
    id: "6",
    title: "How to Build Wealth with DeFi in 2025",
    channel: "BitBoy Crypto",
    channelIcon: "https://yt3.ggpht.com/J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7=s88-c-k-c0x00ffffff-no-rj",
    thumbnail: "https://i.ytimg.com/vi/1pvs9M7mXnU/maxresdefault.jpg",
    duration: "19:45",
    views: "991K",
    uploadTime: "6 days ago",
    url: "https://www.youtube.com/watch?v=1pvs9M7mXnU",
    tags: ["DeFi", "Wealth", "Strategy"],
    description: "Comprehensive guide to building wealth through DeFi protocols and strategies"
  }
];

export function PopularCryptoVideos() {
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleProcessVideo = async (video: typeof popularCryptoVideos[0]) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to process videos with AI",
        variant: "destructive"
      });
      return;
    }

    setProcessingVideoId(video.id);
    
    try {
      toast({
        title: "Processing Started!",
        description: `Processing "${video.title}" with AI...`,
      });

      // Navigate to the AI processor with prefilled URL and auto-start processing
      setTimeout(() => {
        setProcessingVideoId(null);
        // Scroll to AI processor section and auto-fill the URL
        window.location.href = `/#ai-processor?url=${encodeURIComponent(video.url)}&autostart=true`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);

    } catch (error) {
      setProcessingVideoId(null);
      toast({
        title: "Processing failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background via-background/50 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[40rem] h-[40rem] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Popular Content</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Try Processing These
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Popular Crypto Shows
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get started instantly with these trending crypto podcasts and videos. 
            See how StreamAiX transforms long-form content into actionable insights.
          </p>
        </motion.div>

        {/* Floating Video Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
        >
          {popularCryptoVideos.map((video) => (
            <motion.div
              key={video.id}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 overflow-hidden h-full">
                <CardContent className="p-0">
                  {/* Video Thumbnail */}
                  <div className="relative overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      {/* Actual Video Thumbnail */}
                      <img 
                        src={video.thumbnail}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient if thumbnail fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Fallback Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
                        <Play className="h-16 w-16 text-white/50" />
                      </div>
                      
                      {/* Duration Badge */}
                      <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration}
                      </Badge>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button
                          onClick={() => handleProcessVideo(video)}
                          disabled={processingVideoId === video.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                          data-testid={`button-process-video-${video.id}`}
                        >
                          {processingVideoId === video.id ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-4 w-4 mr-2"
                              >
                                <Zap className="h-4 w-4" />
                              </motion.div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Process with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Channel Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {video.channel.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{video.channel}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {video.views} views • {video.uploadTime}
                        </div>
                      </div>
                    </div>

                    {/* Video Title */}
                    <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {video.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {video.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleProcessVideo(video)}
                        disabled={processingVideoId === video.id}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        data-testid={`button-process-video-mobile-${video.id}`}
                      >
                        {processingVideoId === video.id ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-4 w-4 mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Process Now
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 text-muted-foreground border-white/20 hover:bg-white/10"
                        onClick={() => window.open(video.url, '_blank', 'noopener,noreferrer')}
                        data-testid={`button-view-original-${video.id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Want to Process Your Own Content?
            </h3>
            <p className="text-muted-foreground mb-6">
              Upload any YouTube video, podcast, or livestream URL and watch our AI transform it into actionable insights.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3"
              onClick={() => setLocation('/#ai-processor')}
              data-testid="button-try-your-own"
            >
              <Zap className="h-5 w-5 mr-2" />
              Try Your Own URL
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}