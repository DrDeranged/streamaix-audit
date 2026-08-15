import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { PageHeader } from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rss, 
  Users, 
  Tag, 
  Sparkles, 
  Bell,
  Grid3X3,
  List,
  UserPlus,
  Hash,
  TrendingUp,
  Clock,
  Bot,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import BountyCard from '@/components/bounty/BountyCard';
import { FollowUserButton, FollowCategoryButton } from '@/components/FollowButton';
import { useAuth } from '@/hooks/useAuth';
import type { Bounty } from '@shared/schema';

interface FollowReason {
  isFromFollowedUser: boolean;
  isFromFollowedCategory: boolean;
  creatorUsername?: string;
  creatorAvatar?: string;
  isAiAgent?: boolean;
}

type EnrichedBounty = Bounty & {
  followReason: FollowReason;
  [key: string]: any;
};

export default function FollowingFeed() {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBy, setFilterBy] = useState<'all' | 'users' | 'categories'>('all');

  const { data: feedData, isLoading: feedLoading } = useQuery<{ bounties?: EnrichedBounty[] }>({
    queryKey: ['/api/bounties/following'],
    enabled: isAuthenticated,
  });

  const { data: followedUsers } = useQuery<{ users?: any[] }>({
    queryKey: ['/api/me/followed-users'],
    enabled: isAuthenticated,
  });

  const { data: followedCategories } = useQuery<{ categories?: string[] }>({
    queryKey: ['/api/me/followed-categories'],
    enabled: isAuthenticated,
  });

  const { data: categoriesData } = useQuery<{ categories?: any[] }>({
    queryKey: ['/api/bounty-categories'],
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-page pt-20 pb-10">
        <div className="container mx-auto px-4">
          <Surface className="mx-auto max-w-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-core text-primary">
              <Rss className="w-8 h-8 text-primary" />
            </div>
            <SectionTitle as="h2" className="mb-2">Your Personal Feed</SectionTitle>
            <p className="mb-6 text-body">
              Follow bounty creators and categories to get personalized updates tailored just for you.
            </p>
            <Link href="/login">
              <Button className="grad-accent glow-accent rounded-xl text-primary">
                Sign in to Get Started
              </Button>
            </Link>
          </Surface>
        </div>
      </div>
    );
  }

  const bounties = (feedData?.bounties || []) as EnrichedBounty[];
  const users = followedUsers?.users || [];
  const categories = followedCategories?.categories || [];
  const allCategories = categoriesData?.categories || [];

  const filteredBounties = bounties.filter(b => {
    if (filterBy === 'all') return true;
    if (filterBy === 'users') return b.followReason?.isFromFollowedUser;
    if (filterBy === 'categories') return b.followReason?.isFromFollowedCategory;
    return true;
  });

  const hasNoFollows = users.length === 0 && categories.length === 0;

  return (
    <div className="min-h-screen bg-ink-page pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="Personalized · live updates"
            title="Your Feed"
            icon={<Rss className="h-5 w-5" />}
            subtitle="Bounties from creators and categories you follow."
            actions={
              <Badge className="bg-accent-core text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            }
          />
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Surface className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent-core/15 p-2">
                <Users className="w-5 h-5 text-accent-bright" />
              </div>
              <StatValue label="Following" value={users.length} />
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent-core/15 p-2">
                <Hash className="w-5 h-5 text-accent-bright" />
              </div>
              <div>
                <StatValue label="Categories" value={categories.length} />
              </div>
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gain/15 p-2">
                <TrendingUp className="w-5 h-5 text-gain" />
              </div>
              <div>
                <StatValue label="In Feed" value={bounties.length} />
              </div>
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warn/15 p-2">
                <Bell className="w-5 h-5 text-warn" />
              </div>
              <div>
                <StatValue
                  label="New Today"
                  value={bounties.filter(b => new Date(b.createdAt ?? 0) > new Date(Date.now() - 24*60*60*1000)).length}
                />
              </div>
            </div>
          </Surface>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as any)}>
                <TabsList className="rounded-xl border border-ink-edge bg-ink-surface">
                  <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-white">
                    <Grid3X3 className="w-4 h-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-white">
                    <Users className="w-4 h-4" />
                    From Users
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-accent-core data-[state=active]:text-white">
                    <Tag className="w-4 h-4" />
                    By Category
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Feed Content */}
            {feedLoading ? (
              <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-bright" />
              </div>
            ) : hasNoFollows ? (
              <Surface className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-core/15">
                  <UserPlus className="w-8 h-8 text-accent-bright" />
                </div>
                <SectionTitle as="h3" className="mb-2">Start Following</SectionTitle>
                <p className="mx-auto mb-6 max-w-md text-body">
                  Follow bounty creators and categories to see their latest bounties here. 
                  Your personalized feed will update automatically.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {allCategories.slice(0, 6).map((cat: any) => (
                    <FollowCategoryButton 
                      key={cat.name} 
                      category={cat.name} 
                      variant="pill"
                    />
                  ))}
                </div>
                <Link href="/bounties">
                  <Button variant="outline" className="gap-2">
                    Browse Bounties
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Surface>
            ) : filteredBounties.length === 0 ? (
              <Surface className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warn/15">
                  <Clock className="w-8 h-8 text-warn" />
                </div>
                <SectionTitle as="h3" className="mb-2">No Bounties Yet</SectionTitle>
                <p className="mb-4 text-body">
                  The creators and categories you follow haven't posted any bounties matching your filter.
                </p>
                <Button variant="outline" onClick={() => setFilterBy('all')}>
                  Show All Feed
                </Button>
              </Surface>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {filteredBounties.map((bounty, index) => (
                    <motion.div
                      key={bounty.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="relative">
                        {/* Follow Reason Badge */}
                        {bounty.followReason && (
                          <div className="absolute -top-2 left-4 z-10">
                            <Badge 
                              className={
                                bounty.followReason.isFromFollowedUser 
                                  ? "bg-accent-core/15 text-accent-bright border-accent-core/40" 
                                  : "bg-accent-core/15 text-accent-bright border-accent-core/40"
                              }
                            >
                              {bounty.followReason.isFromFollowedUser ? (
                                <div className="flex items-center gap-1.5">
                                  {bounty.followReason.isAiAgent && <Bot className="w-3 h-3" />}
                                  <span>@{bounty.followReason.creatorUsername}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Hash className="w-3 h-3" />
                                  <span>{bounty.category}</span>
                                </div>
                              )}
                            </Badge>
                          </div>
                        )}
                        <BountyCard bounty={bounty} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Following Users */}
              <Surface className="p-4">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle as="h3" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-bright" />
                  Following
                </SectionTitle>
                <span className="text-xs text-secondary">{users.length} users</span>
              </div>
              
              {users.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  Not following anyone yet
                </p>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between gap-2">
                      <Link href={`/profile/${u.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                          alt={u.username}
                          className="h-8 w-8 rounded-xl ring-1 ring-accent-core/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="flex items-center gap-1 truncate text-sm font-medium text-primary">
                            {u.isAiAgent && <Bot className="w-3 h-3 text-warn" />}
                            {u.username}
                          </p>
                        </div>
                      </Link>
                      <FollowUserButton userId={u.id} variant="compact" showLabel={false} />
                    </div>
                  ))}
                  {users.length > 5 && (
                    <Link href="/settings/following" className="block text-center text-sm text-accent-bright hover:text-primary">
                      View all {users.length}
                    </Link>
                  )}
                </div>
              )}
              </Surface>

            {/* Following Categories */}
              <Surface className="p-4">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle as="h3" className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent-bright" />
                  Categories
                </SectionTitle>
                <span className="text-xs text-secondary">{categories.length} followed</span>
              </div>
              
              {categories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  No categories followed yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: string) => (
                    <FollowCategoryButton key={cat} category={cat} variant="pill" />
                  ))}
                </div>
              )}
              </Surface>

            {/* Suggested Categories */}
              <Surface className="p-4">
              <SectionTitle as="h3" className="mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warn" />
                Discover Categories
              </SectionTitle>
              <div className="space-y-2">
                {allCategories
                  .filter((cat: any) => !categories.includes(cat.name))
                  .slice(0, 5)
                  .map((cat: any) => (
                    <div key={cat.name} className="flex items-center justify-between gap-2 border-b border-ink-divider py-2 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">{cat.name}</p>
                        <p className="text-xs text-muted">
                          {cat.bountyCount} bounties • {cat.followersCount} followers
                        </p>
                      </div>
                      <FollowCategoryButton category={cat.name} variant="pill" showLabel={false} />
                    </div>
                  ))}
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
