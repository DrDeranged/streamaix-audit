import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/landing/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/comments/CommentSection';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  BarChart3,
  Clock,
  Trophy,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Sparkles,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  type: 'bounty' | 'market' | 'summary';
  title: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  author?: { id: string; username: string; avatar?: string };
  metadata?: any;
}

export default function SocialFeed() {
  const [activeTab, setActiveTab] = useState<'all' | 'bounties' | 'markets' | 'summaries'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch bounties
  const { data: bounties } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties'],
    enabled: activeTab === 'all' || activeTab === 'bounties',
  });

  // Fetch markets
  const { data: markets } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/prediction-markets'],
    enabled: activeTab === 'all' || activeTab === 'markets',
  });

  // Fetch summaries
  const { data: summaries } = useQuery<any[]>({
    queryKey: ['/api/summaries'],
    enabled: activeTab === 'all' || activeTab === 'summaries',
  });

  // Combine and sort feed items
  const feedItems: FeedItem[] = [];

  if (bounties?.bounties && (activeTab === 'all' || activeTab === 'bounties')) {
    feedItems.push(...bounties.bounties.map(b => ({
      id: b.id,
      type: 'bounty' as const,
      title: b.title,
      description: b.description,
      category: b.category,
      tags: b.tags,
      createdAt: b.createdAt,
      metadata: { reward: b.reward, status: b.status, difficulty: b.difficulty }
    })));
  }

  if (markets?.markets && (activeTab === 'all' || activeTab === 'markets')) {
    feedItems.push(...markets.markets.map(m => ({
      id: m.id,
      type: 'market' as const,
      title: m.question,
      description: m.description,
      category: m.category,
      tags: m.tags,
      createdAt: m.createdAt,
      metadata: { yesPrice: m.yesPrice, noPrice: m.noPrice, status: m.status }
    })));
  }

  if (summaries && (activeTab === 'all' || activeTab === 'summaries')) {
    feedItems.push(...summaries.map(s => ({
      id: s.id,
      type: 'summary' as const,
      title: s.title,
      description: s.description || s.tldrSummary,
      category: 'Content',
      tags: s.tags,
      createdAt: s.createdAt,
      metadata: { contentType: s.contentType, platform: s.platform }
    })));
  }

  // Sort by most recent
  const sortedFeed = feedItems.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredFeed = selectedCategory
    ? sortedFeed.filter(item => item.category === selectedCategory)
    : sortedFeed;

  const categories = ['DeFi', 'NFTs', 'AI', 'Trading', 'Layer2', 'Content', 'Crypto'];

  const getFeedItemIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'bounty':
        return <Trophy className="w-5 h-5 text-fuchsia-400" />;
      case 'market':
        return <BarChart3 className="w-5 h-5 text-cyan-400" />;
      case 'summary':
        return <FileText className="w-5 h-5 text-purple-400" />;
    }
  };

  const getFeedItemLink = (item: FeedItem) => {
    switch (item.type) {
      case 'bounty':
        return `/bounties/${item.id}`;
      case 'market':
        return `/markets/${item.id}`;
      case 'summary':
        return `/summaries/${item.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      {/* Neural Network Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-fuchsia-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Social Feed
            </h1>
          </div>
          <p className="text-gray-400 ml-14">
            Discover the latest bounties, prediction markets, and AI summaries in one unified feed
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-purple-500/20 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-fuchsia-500/20">
                  All
                </TabsTrigger>
                <TabsTrigger value="bounties" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/20 data-[state=active]:to-pink-500/20">
                  Bounties
                </TabsTrigger>
                <TabsTrigger value="markets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20">
                  Markets
                </TabsTrigger>
                <TabsTrigger value="summaries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20">
                  Summaries
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category pills */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="neural-glass border-purple-500/30"
                data-testid="button-all-categories"
              >
                All Categories
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="neural-glass border-fuchsia-500/30"
                  data-testid={`button-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Feed Items */}
          <AnimatePresence mode="popLayout">
            {filteredFeed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="mb-4"
              >
                <Card className="neural-glass border-purple-500/30 hover:border-fuchsia-500/50 transition-all duration-300 overflow-hidden group">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 flex-shrink-0">
                        {getFeedItemIcon(item.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300">
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                              {item.category}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <Link href={getFeedItemLink(item)}>
                          <h3 className="text-xl font-semibold text-white mb-2 hover:text-fuchsia-400 transition-colors cursor-pointer group-hover:underline" data-testid={`text-title-${item.type}-${item.id}`}>
                            {item.title}
                          </h3>
                        </Link>
                        
                        {item.description && (
                          <p className="text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-3">
                            {item.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="border-gray-700 text-gray-400 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {item.type === 'bounty' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" />
                                {item.metadata.reward} STREAM
                              </span>
                              <Badge variant="outline" className="border-fuchsia-500/30 text-fuchsia-300 text-xs">
                                {item.metadata.status}
                              </Badge>
                            </>
                          )}
                          {item.type === 'market' && (
                            <>
                              <span className="flex items-center gap-1 text-green-400">
                                YES: {Math.round(item.metadata.yesPrice * 100)}%
                              </span>
                              <span className="flex items-center gap-1 text-red-400">
                                NO: {Math.round(item.metadata.noPrice * 100)}%
                              </span>
                            </>
                          )}
                          {item.type === 'summary' && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {item.metadata.contentType} • {item.metadata.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comment Section */}
                    <div className="mt-6 pt-6 border-t border-purple-500/20">
                      <CommentSection
                        entityType={item.type}
                        entityId={item.id}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFeed.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
                <Filter className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-400">No items in this category yet</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
