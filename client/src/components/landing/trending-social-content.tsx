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
  BarChart3
} from 'lucide-react';

export function TrendingSocialContent() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch trending content from Farcaster
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['/api/farcaster/trending'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const trending = (trendingData as any)?.trending || [];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-4">
          Trending on Farcaster
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Real-time trending stories and conversations from the decentralized social network
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border-muted-foreground/20 max-w-2xl mx-auto">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 text-muted/50" />
          <h4 className="text-xl font-semibold mb-3">Trending Content Unavailable</h4>
          <p className="text-muted-foreground mb-6">
            Unable to load trending content from Farcaster at the moment.
          </p>
          {!isAuthenticated && (
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              data-testid="button-get-access"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Access to Premium Content
            </Button>
          )}
        </Card>
      ) : trending.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending.slice(0, 6).map((story: any, index: number) => (
            <motion.div
              key={story.hash || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border-muted-foreground/20 hover:border-green-500/30 transition-all duration-300 h-full group">
                <div className="flex items-start gap-3 mb-4">
                  {story.author?.pfp_url ? (
                    <img 
                      src={story.author.pfp_url} 
                      alt={story.author.display_name}
                      className="w-10 h-10 rounded-full border-2 border-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {story.author?.display_name || story.author?.username || 'Anonymous'}
                      </span>
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      @{story.author?.username} • {formatTimeAgo(story.timestamp)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-4 line-clamp-4 leading-relaxed group-hover:line-clamp-none transition-all duration-300">
                  {story.text}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-red-500">
                      <Heart className="w-4 h-4" />
                      {story.reactions?.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-green-500">
                      <Repeat2 className="w-4 h-4" />
                      {story.reactions?.recasts_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-purple-500">
                      <MessageSquare className="w-4 h-4" />
                      {story.replies?.count || 0}
                    </span>
                  </div>
                  
                  {story.hash && (
                    <a
                      href={`https://warpcast.com/~/conversations/${story.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                      data-testid="link-view-trending-cast"
                    >
                      <Link2 className="w-4 h-4" />
                      View
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border-muted-foreground/20 max-w-2xl mx-auto">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 text-muted/50" />
          <h4 className="text-xl font-semibold mb-3">No Trending Content Available</h4>
          <p className="text-muted-foreground mb-6">
            Check back soon for the latest trending stories and conversations.
          </p>
        </Card>
      )}
      
      {/* CTA Section */}
      <div className="mt-12 text-center">
        <Button 
          onClick={() => setLocation(isAuthenticated ? '/farcaster-activity' : '/auth')}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-8"
          data-testid={isAuthenticated ? "button-explore-more" : "button-join-trending"}
        >
          {isAuthenticated ? (
            <>
              <BarChart3 className="w-5 h-5 mr-2" />
              Explore More Social Intelligence
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              Join the Trending Conversations
            </>
          )}
        </Button>
      </div>
    </section>
  );
}