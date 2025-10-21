import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/comments/CommentSection';
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
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  type: 'bounty' | 'market' | 'summary' | 'news';
  title: string;
  description?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  author?: { id: string; username: string; avatar?: string };
  imageUrl?: string;
  url?: string;
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

  // Fetch crypto news
  const { data: newsData } = useQuery<{ articles: any[] }>({
    queryKey: ['/api/crypto-news'],
  });

  // Fetch topic filters with real counts
  const { data: topicData } = useQuery<{ topics: Array<{ name: string; count: number }> }>({
    queryKey: ['/api/content-topics'],
  });

  // Combine feed items
  const feedItems: FeedItem[] = [];

  if (bounties?.bounties) {
    feedItems.push(...bounties.bounties.map(b => ({
      id: b.id,
      type: 'bounty' as const,
      title: b.title,
      description: b.description,
      excerpt: b.description?.slice(0, 200) + '...',
      category: b.category,
      tags: b.tags,
      createdAt: b.createdAt,
      metadata: { reward: b.reward, status: b.status }
    })));
  }

  if (markets?.markets) {
    feedItems.push(...markets.markets.map(m => ({
      id: m.id,
      type: 'market' as const,
      title: m.question,
      description: m.description,
      excerpt: m.description?.slice(0, 200) + '...',
      category: m.category,
      tags: m.tags,
      createdAt: m.createdAt,
      metadata: { yesPrice: m.yesPrice, volume: m.volume }
    })));
  }

  if (summaries) {
    feedItems.push(...summaries.map(s => ({
      id: s.id,
      type: 'summary' as const,
      title: s.title,
      description: s.tldrSummary || s.description,
      excerpt: (s.tldrSummary || s.description)?.slice(0, 200) + '...',
      category: s.category || 'Content',
      tags: s.tags,
      createdAt: s.createdAt,
      imageUrl: s.thumbnailUrl,
      metadata: { contentType: s.contentType }
    })));
  }

  if (newsData?.articles) {
    feedItems.push(...newsData.articles.map((article, index) => ({
      id: `news-${index}`,
      type: 'news' as const,
      title: article.title,
      description: article.description || article.summary,
      excerpt: (article.description || article.summary)?.slice(0, 200) + '...',
      category: 'Crypto News',
      tags: article.tags || [],
      createdAt: article.publishedAt || article.pubDate,
      imageUrl: article.imageUrl || article.image,
      url: article.url || article.link,
      author: article.source ? { id: 'news', username: article.source, avatar: undefined } : undefined,
      metadata: { source: article.source }
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

  const topics = topicData?.topics || [];

  const getFeedItemIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'bounty':
        return <Trophy className="w-5 h-5 text-fuchsia-400" />;
      case 'market':
        return <BarChart3 className="w-5 h-5 text-cyan-400" />;
      case 'summary':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'news':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
    }
  };

  const getFeedItemLink = (item: FeedItem) => {
    if (item.type === 'news') return null;
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
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
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
            Social
          </h2>
          <p className="text-gray-400 text-lg">
            Stay updated with the latest in crypto conversations, bounties, and predictions
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <Card className="neural-glass border-purple-500/30 overflow-hidden mb-8">
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
            {topics.length > 0 && (
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
                      {topic.count > 0 && (
                        <span className="ml-2 text-xs opacity-60">{topic.count}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Feed Items - Blog Style */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredFeed.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="neural-glass border-purple-500/30 hover:border-fuchsia-500/50 transition-all duration-300 overflow-hidden group">
                    <div className="md:flex">
                      {/* Image */}
                      {item.imageUrl && (
                        <div className="md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
                            {getFeedItemIcon(item.type)}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300 text-xs">
                              {item.type}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                                {item.category}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        {item.type === 'news' && item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-fuchsia-400 transition-colors flex items-center gap-2">
                              {item.title}
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                          </a>
                        ) : (
                          <Link href={getFeedItemLink(item) || '#'}>
                            <h3 className="text-xl font-semibold text-white mb-2 hover:text-fuchsia-400 transition-colors cursor-pointer" data-testid={`feed-title-${item.type}-${item.id}`}>
                              {item.title}
                            </h3>
                          </Link>
                        )}

                        {/* Excerpt */}
                        {item.excerpt && (
                          <p className="text-gray-400 mb-4 line-clamp-3">{item.excerpt}</p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-4">
                            {item.tags.slice(0, 5).map(tag => (
                              <span key={tag} className="text-cyan-400 text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {item.type === 'bounty' && (
                              <div className="flex items-center gap-1 text-fuchsia-400 font-semibold">
                                <Trophy className="w-4 h-4" />
                                {item.metadata.reward} STREAM
                              </div>
                            )}
                            {item.type === 'market' && (
                              <>
                                <span className="text-green-400">
                                  YES: {Math.round(item.metadata.yesPrice * 100)}%
                                </span>
                                <span className="text-red-400">
                                  NO: {Math.round((1 - item.metadata.yesPrice) * 100)}%
                                </span>
                              </>
                            )}
                            {item.author && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={item.author.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs">
                                    {item.author.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-gray-400 text-xs">{item.author.username}</span>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Comments Section - Only for platform content */}
                        {item.type !== 'news' && (
                          <div className="mt-6 pt-6 border-t border-purple-500/20">
                            <CommentSection
                              entityType={item.type}
                              entityId={item.id}
                            />
                          </div>
                        )}
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
                <Card className="neural-glass border-purple-500/30 p-8">
                  <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-400">No content available yet. Check back soon!</p>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
