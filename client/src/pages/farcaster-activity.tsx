import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageCircle, Repeat2, Heart, Search, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="min-h-[100dvh] bg-ink-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <PageHeader
            align="center"
            eyebrow="Farcaster · social graph"
            title="Farcaster Activity Dashboard"
            subtitle="Explore real Farcaster user activity and engagement metrics."
            className="mb-8"
          />

          {/* Search */}
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            <Input
              data-testid="input-fid"
              type="number"
              placeholder="Enter Farcaster ID (fid)"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              className="rounded-xl border border-ink-edge bg-ink-surface text-primary placeholder:text-muted"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              data-testid="button-search"
              onClick={handleSearch} 
               className="rounded-xl grad-accent text-primary hover:opacity-90 glow-accent"
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
            className="mb-6 rounded-xl border border-loss/50 bg-loss/10 p-4 text-center"
          >
            <p className="text-loss">
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
            <Surface className="p-6">
              <div className="mb-5">
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent-bright" />
                  User Profile
                </SectionTitle>
              </div>
              <div>
                {activityLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2 bg-ink-raised" />
                    <Skeleton className="h-4 w-1/3 bg-ink-raised" />
                    <Skeleton className="h-20 w-full bg-ink-raised" />
                  </div>
                ) : profile ? (
                  <div className="flex items-start gap-4">
                    {profile.pfp_url && (
                      <img
                        src={profile.pfp_url}
                        alt={`${profile.username} avatar`}
                        className="h-16 w-16 rounded-full border-2 border-accent-core"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-primary">
                          {profile.display_name || profile.username}
                        </h3>
                        <Badge variant="secondary" className="border border-accent-core/30 bg-accent-core/10 text-accent-bright">
                          @{profile.username}
                        </Badge>
                        {profile.power_badge && (
                          <Badge className="border border-accent-core/30 bg-accent-core/10 text-accent-bright">
                            Power User
                          </Badge>
                        )}
                      </div>
                      {profile.profile?.bio?.text && (
                        <p className="mb-2 text-body">{profile.profile.bio.text}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-secondary">
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
                    <p className="text-body">No profile data available</p>
                )}
              </div>
            </Surface>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Surface className="p-6 text-center">
                  {activityLoading ? (
                    <Skeleton className="mx-auto mb-2 h-12 w-12 rounded-full bg-ink-raised" />
                  ) : (
                    <MessageCircle className="mx-auto mb-2 h-12 w-12 text-accent-bright" />
                  )}
                  <StatValue label="Total Casts" value={activityLoading ? '...' : stats?.totalCasts || '0'} />
              </Surface>

              <Surface className="p-6 text-center">
                <Users className="mx-auto mb-2 h-12 w-12 text-accent-bright" />
                <StatValue label="Followers" value={activityLoading ? '...' : stats?.followerCount || '0'} />
              </Surface>

              <Surface className="p-6 text-center">
                <TrendingUp className="mx-auto mb-2 h-12 w-12 text-accent-bright" />
                <StatValue label="Avg Engagement" value={activityLoading ? '...' : Math.round(stats?.avgEngagementRate || 0)} />
              </Surface>

              <Surface className="p-6 text-center">
                <Users className="mx-auto mb-2 h-12 w-12 text-accent-bright" />
                <StatValue label="Following" value={activityLoading ? '...' : stats?.followingCount || '0'} />
              </Surface>
            </div>

            {/* Recent Casts */}
            <Surface className="p-6">
              <div className="mb-5">
                <SectionTitle as="h2" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-accent-bright" />
                  Recent Activity
                </SectionTitle>
              </div>
              <div>
                {castsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full bg-ink-raised" />
                        <Skeleton className="h-4 w-3/4 bg-ink-raised" />
                        <Skeleton className="h-6 w-1/4 bg-ink-raised" />
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
                        className="border-b border-ink-divider pb-4 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="mb-2 text-body">{cast.text}</p>
                            <div className="flex items-center gap-4 text-sm text-secondary">
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
                                   className="flex items-center gap-1 text-accent-bright hover:text-primary"
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
                    <p className="py-8 text-center text-body">
                    No recent activity found for this user
                  </p>
                )}
              </div>
            </Surface>
          </motion.div>
        )}

        {!searchFid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center text-body"
          >
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted" />
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