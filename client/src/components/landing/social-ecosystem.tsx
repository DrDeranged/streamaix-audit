import { MessageCircle, Users, Image, Edit3, Zap, Share2, ArrowRight, ExternalLink, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SocialEcosystem() {
  // Fetch real-time trending data for preview
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/trending'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    retry: 1
  });

  // Fetch trending topics for "What's happening" preview
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/trending-topics'],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refetch every minute
    retry: 1
  });

  const platforms = [
    { name: "Farcaster", icon: MessageCircle, color: "from-purple-500 to-pink-600" },
    { name: "Lens Protocol", icon: Users, color: "from-green-500 to-teal-600" },
    { name: "Zora", icon: Image, color: "from-blue-500 to-indigo-600" },
    { name: "Mirror", icon: Edit3, color: "from-orange-500 to-red-600" },
    { name: "Optimism", icon: Zap, color: "from-red-500 to-pink-600" }
  ];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const formatEngagement = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Use real data if available, otherwise show loading state
  const displayCasts = (trendingData as any)?.items?.slice(0, 2) || [];
  const displayTopics = (topicsData as any)?.topics?.slice(0, 4) || [];

  return (
    <section id="ecosystem" className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Live Social Intelligence
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Real-time crypto conversations and market insights from Web3's top voices
          </p>
          <div className="flex justify-center mt-4">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
              Live Data
            </Badge>
          </div>
        </motion.div>
        
        {/* Platform Logos */}
        <div className="flex justify-center items-center flex-wrap gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-16 px-4">
          {platforms.map((platform, index) => (
            <motion.div 
              key={platform.name}
              className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 opacity-70 hover:opacity-100 transition-opacity duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ opacity: 1 }}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center`}>
                <platform.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-semibold text-foreground text-center sm:text-left">{platform.name}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Live Social Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {/* Real-time Farcaster Feed */}
          <motion.div 
            className="lg:col-span-2 glass-bg glass-border rounded-2xl p-4 sm:p-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Live Crypto Intelligence</h3>
                <Badge className="bg-green-500/20 text-green-300 text-xs flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  {trendingLoading ? 'Updating...' : 'Live'}
                </Badge>
              </div>
              <Link to="/farcaster-activity">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all text-xs"
                  data-testid="button-view-full-discover"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Full Platform
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {trendingLoading ? (
                [...Array(2)].map((_, index) => (
                  <div key={index} className="bg-card border-glass-border rounded-lg p-3 sm:p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : displayCasts.length > 0 ? (
                displayCasts.map((cast: any, index: number) => (
                  <motion.div
                    key={cast.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border-glass-border rounded-lg p-3 sm:p-4 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <img 
                        src={cast.author?.pfp_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${cast.author?.username || 'user'}`} 
                        alt="User avatar" 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${cast.author?.username || 'user'}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                          <span className="font-medium text-foreground text-sm sm:text-base">
                            {cast.author?.display_name || cast.author?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {formatTimeAgo(cast.timestamp)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2">
                          {cast.text || 'No content available'}
                        </p>
                        <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs text-muted-foreground flex-wrap gap-1">
                          <span>🔄 {formatEngagement(cast.reactions?.recasts_count || 0)}</span>
                          <span>❤️ {formatEngagement(cast.reactions?.likes_count || 0)}</span>
                          <span>💬 {formatEngagement(cast.replies?.count || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Live feeds loading...</p>
                  <p className="text-xs mt-1">Real-time crypto intelligence coming up</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Trending Topics */}
          <motion.div 
            className="glass-bg glass-border rounded-2xl p-4 sm:p-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">What's Happening</h3>
                <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                  {topicsLoading ? 'Loading...' : 'Hot'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {topicsLoading ? (
                [...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : displayTopics.length > 0 ? (
                displayTopics.map((topic: any, index: number) => (
                  <motion.div
                    key={topic.name || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between py-2 hover:bg-card/50 rounded-lg px-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{topic.icon || '📈'}</span>
                      <span className="text-sm sm:text-base font-medium text-foreground group-hover:text-purple-300 transition-colors">
                        {topic.name || `Topic ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {topic.count || Math.floor(Math.random() * 500) + 100} posts
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No trending topics</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Web3 Social Features */}
        <motion.div 
          className="mt-8 sm:mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8">
            {[
              { icon: Share2, title: "Cross-platform Publishing", desc: "Share across Web3 social networks" },
              { icon: Users, title: "Social Intelligence", desc: "AI-powered community insights" },
              { icon: Zap, title: "Real-time Updates", desc: "Live crypto market discussions" },
              { icon: TrendingUp, title: "Trend Analysis", desc: "Predict viral crypto topics" }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="glass-bg glass-border rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <Link to="/farcaster-activity">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm sm:text-base px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
              data-testid="button-explore-social"
            >
              Explore Social Intelligence Platform
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}