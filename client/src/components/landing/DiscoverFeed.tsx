import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  BarChart3,
  Trophy,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles
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
  metadata?: any;
}

export function DiscoverFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'forYou' | 'following'>('trending');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Neural network background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const nodeCount = 30;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw connections
        nodes.forEach((otherNode, j) => {
          if (i === j) return;
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  // Fetch platform content
  const { data: bounties, isLoading: bountiesLoading } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties'],
  });

  const { data: markets, isLoading: marketsLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/prediction-markets'],
  });

  const { data: summaries, isLoading: summariesLoading } = useQuery<any[]>({
    queryKey: ['/api/summaries'],
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
      category: s.category || 'Content',
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

  const topics = topicData?.topics || [];
  const totalPages = Math.ceil(filteredFeed.length / ITEMS_PER_PAGE);
  const paginatedFeed = filteredFeed.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isLoading = bountiesLoading || marketsLoading || summariesLoading;

  const getFeedItemIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'bounty':
        return <Trophy className="w-4 h-4" />;
      case 'market':
        return <BarChart3 className="w-4 h-4" />;
      case 'summary':
        return <FileText className="w-4 h-4" />;
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
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-40"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Discover
          </h2>
          <p className="text-gray-400">
            Stay updated with the latest in crypto conversations
          </p>
        </motion.div>

        <div className="flex gap-6">
          {/* Main Feed Area */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-purple-950/30 rounded-lg backdrop-blur-sm border border-purple-500/20">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'trending'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="tab-trending"
              >
                Trending
              </button>
              <button
                onClick={() => setActiveTab('forYou')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'forYou'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="tab-for-you"
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'following'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="tab-following"
              >
                Following
              </button>
            </div>

            {/* Topic Filters */}
            {topics.length > 0 && (
              <div className="mb-6 flex gap-2 flex-wrap">
                <Button
                  variant={selectedTopic === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setSelectedTopic(null); setCurrentPage(1); }}
                  className={`rounded-full h-8 text-xs ${
                    selectedTopic === null
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0'
                      : 'border-purple-500/30 hover:border-fuchsia-500/50'
                  }`}
                  data-testid="filter-all"
                >
                  All
                </Button>
                {topics.slice(0, 8).map(topic => (
                  <Button
                    key={topic.name}
                    variant={selectedTopic === topic.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setSelectedTopic(topic.name); setCurrentPage(1); }}
                    className={`rounded-full h-8 text-xs ${
                      selectedTopic === topic.name
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0'
                        : 'border-purple-500/30 hover:border-fuchsia-500/50'
                    }`}
                    data-testid={`filter-${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {topic.name}
                    {topic.count > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-purple-900/50 rounded-full text-[10px]">
                        {topic.count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* 3-Column Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-purple-950/20 border-purple-500/20 animate-pulse">
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-purple-800/30 rounded w-3/4"></div>
                      <div className="h-3 bg-purple-800/20 rounded w-full"></div>
                      <div className="h-3 bg-purple-800/20 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paginatedFeed.map((item, index) => (
                    <Link key={item.id} href={getFeedItemLink(item)}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="bg-purple-950/20 backdrop-blur-sm border-purple-500/20 hover:border-fuchsia-500/40 transition-all duration-300 cursor-pointer group h-full">
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start gap-2 mb-3">
                              <div className="p-1.5 rounded bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 group-hover:border-fuchsia-500/40 transition-colors">
                                {getFeedItemIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Badge className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0 h-5">
                                  {item.type}
                                </Badge>
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-fuchsia-400 transition-colors" data-testid={`feed-title-${item.type}-${item.id}`}>
                              {item.title}
                            </h3>

                            {/* Description */}
                            {item.description && (
                              <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {item.type === 'bounty' && (
                                  <span className="text-fuchsia-400 font-semibold">
                                    {item.metadata.reward} STREAM
                                  </span>
                                )}
                                {item.type === 'market' && (
                                  <span className="text-green-400">
                                    YES: {Math.round(item.metadata.yesPrice * 100)}%
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px]">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            {/* Tags */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {item.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-cyan-400 text-[10px]">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-purple-500/30 hover:border-fuchsia-500/50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i}
                          variant={currentPage === i + 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === i + 1
                              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0'
                              : 'border-purple-500/30 hover:border-fuchsia-500/50'
                          }`}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-purple-500/30 hover:border-fuchsia-500/50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {filteredFeed.length === 0 && !isLoading && (
              <Card className="bg-purple-950/20 border-purple-500/20 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-400">No content available yet. Check back soon!</p>
              </Card>
            )}
          </div>

          {/* Sidebar - What's happening */}
          <div className="hidden xl:block w-80">
            <Card className="bg-purple-950/20 backdrop-blur-sm border-purple-500/20 sticky top-4">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  <h3 className="font-semibold text-white">What's happening</h3>
                </div>
                
                {topics.slice(0, 5).map((topic, index) => (
                  <button
                    key={topic.name}
                    onClick={() => { setSelectedTopic(topic.name); setCurrentPage(1); }}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-900/30 transition-colors mb-2 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white group-hover:text-fuchsia-400 transition-colors">
                        {topic.name}
                      </span>
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{topic.count} posts</span>
                      <span>•</span>
                      <span>Trending</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
