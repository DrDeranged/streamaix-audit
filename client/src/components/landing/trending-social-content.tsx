import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  TrendingUp,
  MessageSquare,
  Users,
  Heart,
  Repeat2,
  Link2,
  Sparkles,
  BarChart3,
  Shield,
  Star,
  ExternalLink,
  Crown,
  Zap,
  Globe
} from 'lucide-react';

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch prominent crypto users from Farcaster
  const { data: prominentData, isLoading, error } = useQuery({
    queryKey: ['/api/farcaster/prominent-users'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getCryptoIcon = (context: string) => {
    if (context?.toLowerCase().includes('ethereum') || context?.toLowerCase().includes('vitalik')) return '🔷';
    if (context?.toLowerCase().includes('farcaster') || context?.toLowerCase().includes('founder')) return '🚀';
    if (context?.toLowerCase().includes('base') || context?.toLowerCase().includes('coinbase')) return '🔵';
    return '⚡';
  };

  const isVerified = (user: any) => {
    // Check if user has verified status or is a known prominent figure
    return user.verified || user.cryptoContext || user.follower_count > 10000;
  };

  const prominentUsers = (prominentData as any)?.users || [];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-3xl" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl opacity-20" />
      
      <div className="relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              Crypto Thought Leaders
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
              Leading Voices in Crypto
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect with the most influential builders, founders, and visionaries shaping the future of decentralized technology
            </p>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse" />
                        <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded animate-pulse" />
                      <div className="h-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-gradient-to-r from-muted/30 to-muted/15 rounded w-3/4 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="h-6 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full w-20 animate-pulse" />
                      <div className="h-8 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-16 text-center bg-gradient-to-br from-red-500/5 via-card/60 to-card/40 backdrop-blur-xl border border-red-500/20 shadow-2xl max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-red-400" />
              </div>
              <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Crypto Leaders Unavailable
              </h4>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Unable to connect with the crypto thought leaders at the moment. Please try again later.
              </p>
              {!isAuthenticated && (
                <Button 
                  onClick={() => setLocation('/auth')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white border-0 px-8 py-3 text-lg font-semibold shadow-xl"
                  data-testid="button-get-access"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Access to Premium Features
                </Button>
              )}
            </Card>
          </motion.div>
        ) : prominentUsers.length > 0 ? (
          <>
            {/* Featured Hero Cards - Top 3 most prominent users */}
            {prominentUsers.slice(0, 3).length > 0 && (
              <div className="mb-16">
                <motion.h3 
                  className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Featured Crypto Pioneers
                </motion.h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {prominentUsers.slice(0, 3).map((user: any, index: number) => (
                    <motion.div
                      key={user.fid || index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.15 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group"
                    >
                      <Card className="p-8 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full relative overflow-hidden">
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10">
                          <div className="flex flex-col items-center text-center space-y-6">
                            {/* Profile Image with enhanced styling */}
                            <div className="relative">
                              {user.pfp_url ? (
                                <div className="relative">
                                  <img 
                                    src={user.pfp_url} 
                                    alt={user.displayName || user.username}
                                    className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl group-hover:shadow-2xl transition-shadow duration-300"
                                  />
                                  {isVerified(user) && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                      <Shield className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  <div className="absolute -bottom-2 -right-2 text-2xl">
                                    {getCryptoIcon(user.cryptoContext)}
                                  </div>
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center border-4 border-white/20">
                                  <Users className="w-12 h-12 text-blue-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* User Info */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {user.displayName || user.display_name || user.username}
                                </h4>
                                {isVerified(user) && (
                                  <Star className="w-5 h-5 text-yellow-500" />
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground font-medium">
                                @{user.username}
                              </p>
                              
                              {user.cryptoContext && (
                                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {user.cryptoContext.split(',')[0]}
                                </Badge>
                              )}
                              
                              {user.bioPreview && (
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                  {user.bioPreview}
                                </p>
                              )}
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center justify-center gap-6 pt-4">
                              {user.follower_count && (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400">
                                    {formatFollowerCount(user.follower_count)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Followers
                                  </div>
                                </div>
                              )}
                              {user.following_count && (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">
                                    {formatFollowerCount(user.following_count)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Following
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Button */}
                            <div className="pt-4">
                              <Button
                                onClick={() => window.open(user.profileUrl || `https://warpcast.com/${user.username}`, '_blank')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-2 font-medium shadow-lg group-hover:shadow-xl transition-all duration-300"
                                data-testid={`button-view-profile-${user.username}`}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                View Profile
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Users Grid */}
            {prominentUsers.length > 3 && (
              <div>
                <motion.h3 
                  className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  More Crypto Innovators
                </motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prominentUsers.slice(3, 9).map((user: any, index: number) => (
                    <motion.div
                      key={user.fid || `additional-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group"
                    >
                      <Card className="p-6 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl border border-white/20 hover:border-blue-500/30 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative">
                            {user.pfp_url ? (
                              <img 
                                src={user.pfp_url} 
                                alt={user.displayName || user.username}
                                className="w-12 h-12 rounded-full border-2 border-white/20 shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/20 to-green-400/20 flex items-center justify-center border-2 border-white/20">
                                <Users className="w-6 h-6 text-blue-400" />
                              </div>
                            )}
                            {isVerified(user) && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Shield className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm truncate">
                                {user.displayName || user.display_name || user.username}
                              </h4>
                              {isVerified(user) && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              @{user.username}
                            </p>
                            {user.cryptoContext && (
                              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                                {getCryptoIcon(user.cryptoContext)} {user.cryptoContext.split(',')[0]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {user.bioPreview && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                            {user.bioPreview}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-4 text-xs">
                            {user.follower_count && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <Users className="w-3 h-3" />
                                {formatFollowerCount(user.follower_count)}
                              </span>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(user.profileUrl || `https://warpcast.com/${user.username}`, '_blank')}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50"
                            data-testid={`button-visit-${user.username}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-16 text-center bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Crypto Leaders Coming Soon
              </h4>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                We're connecting with the most influential voices in crypto. Check back soon to discover the thought leaders shaping our industry.
              </p>
            </Card>
          </motion.div>
        )}
        
        {/* Enhanced CTA Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.7, duration: 0.4 }}
            >
              <Crown className="w-12 h-12 mx-auto mb-6 text-yellow-500" />
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Join the Crypto Elite
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Connect with the most influential builders, investors, and visionaries in crypto. Get exclusive access to their insights and join the conversation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => setLocation(isAuthenticated ? '/farcaster-activity' : '/auth')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  data-testid={isAuthenticated ? "button-explore-more" : "button-join-elite"}
                >
                  {isAuthenticated ? (
                    <>
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Explore Advanced Social Intelligence
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Join the Crypto Elite
                    </>
                  )}
                </Button>
                
                {!isAuthenticated && (
                  <Button 
                    variant="outline"
                    size="lg"
                    className="border-2 border-white/30 text-foreground hover:bg-white/10 px-8 py-4 text-lg font-medium backdrop-blur-sm"
                    onClick={() => setLocation('/farcaster-activity')}
                    data-testid="button-browse-public"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Browse Public Content
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}