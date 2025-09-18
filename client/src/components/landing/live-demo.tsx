import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, MessageCircle, Users, Heart, Repeat2, Calendar, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';

// Farcaster Activity Demo Component
function FarcasterActivityDemo() {
  const [selectedFid, setSelectedFid] = useState<number>(3); // Default to dwr.eth
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const popularFids = [
    { fid: 3, username: "dwr.eth", displayName: "Dan Romero", description: "Farcaster Co-founder" },
    { fid: 5650, username: "vitalik.eth", displayName: "Vitalik Buterin", description: "Ethereum Founder" },
    { fid: 1, username: "farcaster", displayName: "Farcaster", description: "Official Account" },
    { fid: 6546, username: "jessepollak", displayName: "Jesse Pollak", description: "Base Protocol Lead" },
  ];

  // Fetch real activity data with live updates
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['/api/farcaster/activity', selectedFid],
    enabled: !!selectedFid,
    staleTime: 30 * 1000, // 30 seconds for live updates
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 3
  });

  const { data: castsData } = useQuery({
    queryKey: ['/api/farcaster/casts', selectedFid],
    enabled: !!selectedFid,
    staleTime: 20 * 1000, // 20 seconds for live casts
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    retry: 3
  });

  const profile = (activityData as any)?.activity?.profile;
  const stats = (activityData as any)?.activity?.stats;
  const casts = (castsData as any)?.casts || [];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto mb-12">
      {/* Popular Farcaster Users Selector */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-4 text-center">Select a Crypto Leader to Follow</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {popularFids.map((user) => (
            <button
              key={user.fid}
              onClick={() => setSelectedFid(user.fid)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedFid === user.fid
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-muted hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
            >
              <div className="text-sm font-medium">{user.displayName}</div>
              <div className="text-xs text-muted-foreground">@{user.username}</div>
              <div className="text-xs text-muted-foreground mt-1">{user.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Real Activity Dashboard */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Profile Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {profile.pfp_url && (
                    <img
                      src={profile.pfp_url}
                      alt={profile.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-400"
                    />
                  )}
                  <div>
                    <div className="font-bold">{profile.display_name || profile.username}</div>
                    <div className="text-sm text-muted-foreground">@{profile.username}</div>
                  </div>
                </div>
                
                {profile.profile?.bio?.text && (
                  <p className="text-sm text-muted-foreground">{profile.profile.bio.text}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold text-lg">{stats?.followerCount?.toLocaleString() || profile.follower_count?.toLocaleString() || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold text-lg">{stats?.totalCasts || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Casts</div>
                  </div>
                </div>

                {isAuthenticated && (
                  <Button 
                    onClick={() => setLocation('/farcaster-activity')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Full Activity
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Failed to load profile data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Live Activity Feed
              <Badge variant="outline" className="ml-auto">
                🔴 Real-time
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : casts && casts.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {casts.slice(0, 5).map((cast: any, index: number) => (
                  <motion.div
                    key={cast.hash || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-muted pb-4 last:border-b-0"
                  >
                    <p className="text-sm mb-2 line-clamp-3">{cast.text}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(cast.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {cast.reactions?.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="w-3 h-3" />
                        {cast.reactions?.recasts_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {cast.replies?.count || 0}
                      </span>
                      {cast.hash && (
                        <a
                          href={`https://warpcast.com/~/conversations/${cast.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                          <Link2 className="w-3 h-3" />
                          View
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted" />
                <p>No recent activity found</p>
                <p className="text-xs mt-2">Try selecting a different user above</p>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  🔐 Sign up to access full Farcaster analytics and AI-powered insights!
                </p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Get Started Free
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LiveDemo() {
  return (
    <section id="real-demo" className="py-12 sm:py-20 bg-gray-100 dark:bg-gray-900 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            See real AI analysis in action with trending crypto content
          </p>
        </motion.div>
        
        <FarcasterActivityDemo />
      </div>
    </section>
  );
}