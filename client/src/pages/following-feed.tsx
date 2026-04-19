import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { PageHeader } from '@/components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rss, 
  Users, 
  Tag, 
  ChevronRight, 
  Sparkles, 
  Bell,
  Filter,
  Grid3X3,
  List,
  UserPlus,
  Hash,
  TrendingUp,
  Clock,
  Trophy,
  Bot,
  ArrowRight,
  Heart,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BountyCard from '@/components/bounty/BountyCard';
import { FollowUserButton, FollowCategoryButton } from '@/components/FollowButton';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface FollowReason {
  isFromFollowedUser: boolean;
  isFromFollowedCategory: boolean;
  creatorUsername?: string;
  creatorAvatar?: string;
  isAiAgent?: boolean;
}

interface EnrichedBounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  category?: string;
  status: string;
  createdAt: string;
  followReason: FollowReason;
  [key: string]: any;
}

export default function FollowingFeed() {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBy, setFilterBy] = useState<'all' | 'users' | 'categories'>('all');

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['/api/bounties/following'],
    enabled: isAuthenticated,
  });

  const { data: followedUsers } = useQuery({
    queryKey: ['/api/me/followed-users'],
    enabled: isAuthenticated,
  });

  const { data: followedCategories } = useQuery({
    queryKey: ['/api/me/followed-categories'],
    enabled: isAuthenticated,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/bounty-categories'],
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center bg-gradient-to-br from-purple-900/30 to-slate-900/50 border-purple-500/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Rss className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Personal Feed</h2>
            <p className="text-gray-400 mb-6">
              Follow bounty creators and categories to get personalized updates tailored just for you.
            </p>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">
                Sign in to Get Started
              </Button>
            </Link>
          </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-20 pb-10">
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
              <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            }
          />
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-cyan-900/30 to-slate-900/50 border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-gray-400">Following</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-slate-900/50 border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Hash className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
                <p className="text-xs text-gray-400">Categories</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{bounties.length}</p>
                <p className="text-xs text-gray-400">In Feed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-amber-900/30 to-slate-900/50 border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {bounties.filter(b => new Date(b.createdAt) > new Date(Date.now() - 24*60*60*1000)).length}
                </p>
                <p className="text-xs text-gray-400">New Today</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as any)}>
                <TabsList className="bg-slate-800/50">
                  <TabsTrigger value="all" className="gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="w-4 h-4" />
                    From Users
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="gap-2">
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
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : hasNoFollows ? (
              <Card className="p-8 text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Following</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
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
              </Card>
            ) : filteredBounties.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Bounties Yet</h3>
                <p className="text-gray-400 mb-4">
                  The creators and categories you follow haven't posted any bounties matching your filter.
                </p>
                <Button variant="outline" onClick={() => setFilterBy('all')}>
                  Show All Feed
                </Button>
              </Card>
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
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                                  : "bg-purple-500/20 text-purple-300 border-purple-500/40"
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
            <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Following
                </h3>
                <span className="text-xs text-gray-400">{users.length} users</span>
              </div>
              
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
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
                          className="w-8 h-8 rounded-full ring-1 ring-cyan-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate flex items-center gap-1">
                            {u.isAiAgent && <Bot className="w-3 h-3 text-amber-400" />}
                            {u.username}
                          </p>
                        </div>
                      </Link>
                      <FollowUserButton userId={u.id} variant="compact" showLabel={false} />
                    </div>
                  ))}
                  {users.length > 5 && (
                    <Link href="/settings/following" className="block text-center text-sm text-cyan-400 hover:text-cyan-300">
                      View all {users.length}
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {/* Following Categories */}
            <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  Categories
                </h3>
                <span className="text-xs text-gray-400">{categories.length} followed</span>
              </div>
              
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No categories followed yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: string) => (
                    <FollowCategoryButton key={cat} category={cat} variant="pill" />
                  ))}
                </div>
              )}
            </Card>

            {/* Suggested Categories */}
            <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Discover Categories
              </h3>
              <div className="space-y-2">
                {allCategories
                  .filter((cat: any) => !categories.includes(cat.name))
                  .slice(0, 5)
                  .map((cat: any) => (
                    <div key={cat.name} className="flex items-center justify-between gap-2 py-2 border-b border-slate-700/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{cat.name}</p>
                        <p className="text-xs text-gray-500">
                          {cat.bountyCount} bounties • {cat.followersCount} followers
                        </p>
                      </div>
                      <FollowCategoryButton category={cat.name} variant="pill" showLabel={false} />
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
