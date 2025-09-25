import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageCircle, Repeat2, Heart, Search, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/auth';

export default function FarcasterActivity() {
  const [fid, setFid] = useState<string>('');
  const [searchFid, setSearchFid] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch user activity analytics
  const { data: activityData, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['/api/farcaster/activity', searchFid],
    enabled: !!searchFid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch user casts
  const { data: castsData, isLoading: castsLoading } = useQuery({
    queryKey: ['/api/farcaster/casts', searchFid],
    enabled: !!searchFid,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleSearch = () => {
    const fidNumber = parseInt(fid);
    if (!fidNumber || isNaN(fidNumber) || fidNumber <= 0) {
      toast({
        title: "Invalid FID",
        description: "Please enter a valid Farcaster ID (positive number)",
        variant: "destructive"
      });
      return;
    }
    setSearchFid(fidNumber);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const profile = (activityData as any)?.activity?.profile;
  const stats = (activityData as any)?.activity?.stats;
  const casts = (castsData as any)?.casts || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Farcaster Activity Dashboard
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            Explore real Farcaster user activity and engagement metrics
          </p>

          {/* Search */}
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            <Input
              data-testid="input-fid"
              type="number"
              placeholder="Enter Farcaster ID (fid)"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              data-testid="button-search"
              onClick={handleSearch} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </motion.div>

        {activityError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-red-200">
              Failed to load Farcaster activity. Please try again with a valid FID.
            </p>
          </motion.div>
        )}

        {searchFid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2 bg-white/20" />
                    <Skeleton className="h-4 w-1/3 bg-white/20" />
                    <Skeleton className="h-20 w-full bg-white/20" />
                  </div>
                ) : profile ? (
                  <div className="flex items-start gap-4">
                    {profile.pfp_url && (
                      <img
                        src={profile.pfp_url}
                        alt={`${profile.username} avatar`}
                        className="w-16 h-16 rounded-full border-2 border-purple-400"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {profile.display_name || profile.username}
                        </h3>
                        <Badge variant="secondary" className="bg-purple-600/20 text-purple-200">
                          @{profile.username}
                        </Badge>
                        {profile.power_badge && (
                          <Badge className="bg-yellow-500/20 text-yellow-200">
                            Power User
                          </Badge>
                        )}
                      </div>
                      {profile.profile?.bio?.text && (
                        <p className="text-gray-300 mb-2">{profile.profile.bio.text}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>FID: {profile.fid}</span>
                        {profile.follower_count && (
                          <span>{profile.follower_count.toLocaleString()} followers</span>
                        )}
                        {profile.following_count && (
                          <span>{profile.following_count.toLocaleString()} following</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300">No profile data available</p>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  {activityLoading ? (
                    <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2 bg-white/20" />
                  ) : (
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                  )}
                  <p className="text-2xl font-bold text-white">
                    {activityLoading ? '...' : stats?.totalCasts || '0'}
                  </p>
                  <p className="text-gray-300">Total Casts</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold text-white">
                    {activityLoading ? '...' : stats?.followerCount || '0'}
                  </p>
                  <p className="text-gray-300">Followers</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-purple-400" />
                  <p className="text-2xl font-bold text-white">
                    {activityLoading ? '...' : Math.round(stats?.avgEngagementRate || 0)}
                  </p>
                  <p className="text-gray-300">Avg Engagement</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
                  <p className="text-2xl font-bold text-white">
                    {activityLoading ? '...' : stats?.followingCount || '0'}
                  </p>
                  <p className="text-gray-300">Following</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Casts */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {castsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full bg-white/20" />
                        <Skeleton className="h-4 w-3/4 bg-white/20" />
                        <Skeleton className="h-6 w-1/4 bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : casts && casts.length > 0 ? (
                  <div className="space-y-4">
                    {casts.slice(0, 10).map((cast: any, index: number) => (
                      <motion.div
                        key={cast.hash || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-white/10 pb-4 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-white mb-2">{cast.text}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(cast.timestamp)}
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
                                <MessageCircle className="w-3 h-3" />
                                {cast.replies?.count || 0}
                              </span>
                              {cast.hash && (
                                <a
                                  href={`https://warpcast.com/~/conversations/${cast.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-purple-300 hover:text-purple-200"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-300 text-center py-8">
                    No recent activity found for this user
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!searchFid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-gray-300 mt-12"
          >
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-xl">Enter a Farcaster ID to view real activity data</p>
            <p className="text-sm mt-2">
              Try popular FIDs like 3 (dwr.eth), 5650 (vitalik.eth), or 1 (farcaster)
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}