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
              animate={{ y: [-5, 5, -5] }}
              style={{
                animationDuration: "4s",
                animationIterationCount: "infinite",
                animationDelay: `${index * 0.5}s`
              }}
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
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Live Farcaster Feed</h3>
                <Badge className="bg-green-500/20 text-green-300 text-xs">
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
                  Full Discover
                </Button>
              </Link>
            </div>
            
              <TabsContent value="trending" className="mt-0">
                <div className="space-y-3 sm:space-y-4">
                  {trendingLoading ? (
                    // Loading skeleton
                    [...Array(3)].map((_, index) => (
                      <div key={index} className="bg-card border-glass-border rounded-lg p-3 sm:p-4 animate-pulse">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-3 bg-muted rounded w-full"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="flex space-x-4 mt-2">
                              <div className="h-3 bg-muted rounded w-8"></div>
                              <div className="h-3 bg-muted rounded w-8"></div>
                              <div className="h-3 bg-muted rounded w-8"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : displayCasts.length > 0 ? (
                    <AnimatePresence>
                      {displayCasts.map((cast: any, index: number) => (
                        <motion.div 
                          key={cast.hash || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-card border-glass-border rounded-lg p-3 sm:p-4 hover:bg-card/80 transition-colors" 
                          data-testid={`live-cast-${index}`}
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
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trending data available</p>
                      <p className="text-xs mt-1">Check back soon for updates</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="foryou" className="mt-0">
                <div className="space-y-3 sm:space-y-4">
                  {newsLoading ? (
                    [...Array(3)].map((_, index) => (
                      <div key={index} className="bg-card border-glass-border rounded-lg p-3 sm:p-4 animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : cryptoNews.length > 0 ? (
                    <AnimatePresence>
                      {cryptoNews.map((story: any, index: number) => (
                        <motion.div
                          key={story.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-card border-glass-border rounded-lg p-3 sm:p-4 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                  Crypto News
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(story.timestamp || new Date().toISOString())}
                                </span>
                              </div>
                              <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                                {story.title || 'Breaking: Major Crypto Development'}
                              </h4>
                              <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                                {story.summary || 'Latest developments in the cryptocurrency space with market implications.'}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>📈 Impact: High</span>
                                <span>👀 {Math.floor(Math.random() * 1000) + 500}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No personalized content available</p>
                      <p className="text-xs mt-1">Follow more topics for curated content</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="following" className="mt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Follow users to see their content</p>
                    <p className="text-xs mt-1">Connect your wallet to follow crypto influencers</p>
                    <Link to="/farcaster-activity">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explore Users
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
          
          {/* What's Happening Sidebar */}
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
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">Live</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {topicsLoading ? (
                // Loading skeleton for topics
                [...Array(4)].map((_, index) => (
                  <div key={index} className="p-3 rounded-lg border border-glass-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : (
                liveTrendingTopics.map((topic, index) => {
                  const getTrendIcon = () => {
                    switch(topic.trend) {
                      case 'up': return <ArrowUp className="h-3 w-3 text-green-400" />;
                      case 'hot': return <Flame className="h-3 w-3 text-orange-400" />;
                      case 'active': return <Clock className="h-3 w-3 text-yellow-400" />;
                      default: return <ArrowUp className="h-3 w-3 text-green-400" />;
                    }
                  };
                  
                  const getTrendColor = () => {
                    switch(topic.trend) {
                      case 'up': return 'text-green-400';
                      case 'hot': return 'text-orange-400';
                      case 'active': return 'text-yellow-400';
                      default: return 'text-green-400';
                    }
                  };
                  
                  return (
                    <motion.div
                      key={topic.name}
                      className="p-3 rounded-lg border border-glass-border hover:bg-card/50 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      data-testid={`trending-topic-${index}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{topic.icon}</span>
                        <div className="font-medium text-foreground text-sm">{topic.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {topic.count} posts
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon()}
                        <span className={`${getTrendColor()} text-xs font-medium`}>
                          {topic.trend === 'up' ? 'Trending' : topic.trend === 'hot' ? 'Hot' : 'Active'}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">Live</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-glass-border">
              <Link to="/farcaster-activity">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all"
                  data-testid="button-explore-more"
                >
                  Explore More <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Social Sharing Animation */}
        <motion.div 
          className="mt-8 sm:mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-2 sm:space-x-4 glass-bg glass-border rounded-xl p-4 sm:p-6 mx-4">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden sm:block"
            >
              <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
            </motion.div>
            <div className="flex space-x-1 sm:space-x-2">
              {platforms.slice(0, 3).map((platform, index) => (
                <motion.div 
                  key={platform.name}
                  className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br ${platform.color} rounded-lg`}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: index * 0.2 
                  }}
                />
              ))}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              One-click sharing across all platforms
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
