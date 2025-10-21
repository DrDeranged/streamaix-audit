import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  BarChart3,
  Trophy,
  Eye,
  MessageSquare,
  Heart,
  TrendingDown,
  Users,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  type: 'bounty' | 'market' | 'summary';
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  author?: { id: string; username: string; avatar?: string };
  metadata?: any;
}

export function DiscoverFeed() {
  const [activeTab, setActiveTab] = useState<'trending' | 'forYou' | 'following'>('trending');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Fetch platform content
  const { data: bounties } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties'],
  });

  const { data: markets } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/prediction-markets'],
  });

  const { data: summaries } = useQuery<any[]>({
    queryKey: ['/api/summaries'],
  });

  // Combine feed items
  const feedItems: FeedItem[] = [];

  if (bounties?.bounties) {
    feedItems.push(...bounties.bounties.slice(0, 5).map(b => ({
      id: b.id,
      type: 'bounty' as const,
      title: b.title,
      description: b.description,
      category: b.category,
      tags: b.tags,
      createdAt: b.createdAt,
      metadata: { reward: b.reward, status: b.status }
    })));
  }

  if (markets?.markets) {
    feedItems.push(...markets.markets.slice(0, 5).map(m => ({
      id: m.id,
      type: 'market' as const,
      title: m.question,
      description: m.description,
      category: m.category,
      tags: m.tags,
      createdAt: m.createdAt,
      metadata: { yesPrice: m.yesPrice, volume: m.volume }
    })));
  }

  if (summaries) {
    feedItems.push(...summaries.slice(0, 5).map(s => ({
      id: s.id,
      type: 'summary' as const,
      title: s.title,
      description: s.description || s.tldrSummary,
      category: 'Content',
      tags: s.tags,
      createdAt: s.createdAt,
      metadata: { contentType: s.contentType }
    })));
  }

  const sortedFeed = feedItems.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredFeed = selectedTopic
    ? sortedFeed.filter(item => 
        item.category?.toLowerCase().includes(selectedTopic.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(selectedTopic.toLowerCase()))
      )
    : sortedFeed;

  const topics = [
    { name: 'Bitcoin ETF', count: 247 },
    { name: 'DePIN', count: 180 },
    { name: 'L2 scaling', count: 156 },
    { name: 'Base chain', count: 134 },
    { name: 'AI x Crypto', count: 89 },
    { name: 'NFTs', count: 67 }
  ];

  const getFeedItemIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'bounty':
        return <Trophy className="w-4 h-4 text-fuchsia-400" />;
      case 'market':
        return <BarChart3 className="w-4 h-4 text-cyan-400" />;
      case 'summary':
        return <FileText className="w-4 h-4 text-purple-400" />;
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
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Discover
          </h2>
          <p className="text-gray-400 text-lg">
            Stay updated with the latest in crypto conversations
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <Card className="neural-glass border-purple-500/30 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-purple-500/20">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'trending'
                      ? 'text-white border-b-2 border-fuchsia-500 bg-fuchsia-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-purple-500/5'
                  }`}
                  data-testid="tab-trending"
                >
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab('forYou')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'forYou'
                      ? 'text-white border-b-2 border-fuchsia-500 bg-fuchsia-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-purple-500/5'
                  }`}
                  data-testid="tab-for-you"
                >
                  For You
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'text-white border-b-2 border-fuchsia-500 bg-fuchsia-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-purple-500/5'
                  }`}
                  data-testid="tab-following"
                >
                  Following
                </button>
              </div>

              {/* Topic Filters */}
              <div className="p-4 border-b border-purple-500/20">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedTopic === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTopic(null)}
                    className="rounded-full"
                    data-testid="filter-all"
                  >
                    All
                  </Button>
                  {topics.map(topic => (
                    <Button
                      key={topic.name}
                      variant={selectedTopic === topic.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTopic(topic.name)}
                      className="rounded-full"
                      data-testid={`filter-${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {topic.name}
                      <span className="ml-2 text-xs opacity-60">{topic.count}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Feed Items */}
              <div className="divide-y divide-purple-500/20">
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-purple-500/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
                            {getFeedItemIcon(item.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300 text-xs">
                              {item.type}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                                {item.category}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          <Link href={getFeedItemLink(item)}>
                            <h3 className="text-white font-semibold mb-1 group-hover:text-fuchsia-400 transition-colors line-clamp-2" data-testid={`feed-title-${item.type}-${item.id}`}>
                              {item.title}
                            </h3>
                          </Link>

                          {item.description && (
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
                          )}

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mb-3">
                              {item.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-cyan-400 text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Engagement */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-fuchsia-400 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span>{Math.floor(Math.random() * 50)}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                              <Heart className="w-4 h-4" />
                              <span>{Math.floor(Math.random() * 100)}</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{Math.floor(Math.random() * 500)}</span>
                            </div>
                            {item.type === 'bounty' && (
                              <div className="ml-auto flex items-center gap-1 text-fuchsia-400">
                                <Trophy className="w-4 h-4" />
                                {item.metadata.reward} STREAM
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What's Happening */}
            <Card className="neural-glass border-purple-500/30 overflow-hidden">
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fuchsia-400" />
                  What's happening
                </h3>
              </div>
              <div className="divide-y divide-purple-500/20">
                {topics.map((topic, index) => (
                  <button
                    key={topic.name}
                    onClick={() => setSelectedTopic(topic.name)}
                    className="w-full p-4 hover:bg-purple-500/5 transition-colors text-left"
                    data-testid={`trending-${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Trending in Crypto</p>
                        <p className="text-white font-semibold mb-1">{topic.name}</p>
                        <p className="text-xs text-gray-500">{topic.count} posts • Trending</p>
                      </div>
                      <Activity className="w-4 h-4 text-cyan-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Who to Follow */}
            <Card className="neural-glass border-purple-500/30 overflow-hidden">
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Who to follow
                </h3>
              </div>
              <div className="divide-y divide-purple-500/20">
                {['CryptoWhale', 'DeFiBuilder', 'Web3Dev'].map((username, index) => (
                  <div key={username} className="p-4 hover:bg-purple-500/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-purple-500/30">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 text-white">
                            {username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-semibold text-sm">{username}</p>
                          <p className="text-gray-500 text-xs">@{username.toLowerCase()}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-fuchsia-500/30 hover:bg-fuchsia-500/20"
                        data-testid={`follow-${username.toLowerCase()}`}
                      >
                        Follow
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
