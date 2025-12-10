import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { SocialPost } from '@/components/social/SocialPost';
import { PostCreationModal } from '@/components/social/PostCreationModal';
import { CompactBountyCard, CompactMarketCard, CompactStoryCard, MacroDataCard } from '@/components/social/CompactCards';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Sparkles, TrendingUp } from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary' | 'macro';
  data: any;
  score: number;
  timestamp: number;
}

export function DiscoverFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending' | 'forYou' | 'following'>('trending');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Neural network background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const nodeCount = 40;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all content types
  const { data: conversations, isLoading: conversationsLoading } = useQuery<any>({
    queryKey: ['/api/conversations'],
  });

  const { data: bounties, isLoading: bountiesLoading } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties'],
  });

  const { data: markets, isLoading: marketsLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/prediction-markets'],
  });

  const { data: summaries, isLoading: summariesLoading } = useQuery<any[]>({
    queryKey: ['/api/summaries'],
  });

  // Fetch live market data for macro cards
  const { data: stockData } = useQuery({
    queryKey: ['/api/stock-prices'],
  });

  // Build unified feed with all content types
  const buildFeed = (): FeedItem[] => {
    const feed: FeedItem[] = [];

    // Add conversations
    if (conversations?.conversations) {
      conversations.conversations.forEach((c: any) => {
        feed.push({
          id: `conv-${c.id}`,
          type: 'conversation',
          data: {
            id: c.id,
            title: c.title,
            content: c.content,
            author: {
              id: c.authorId || c.userId,
              username: c.author?.username || 'Anonymous',
              avatar: c.author?.avatar,
            },
            createdAt: c.createdAt,
            likesCount: c.likesCount || 0,
            commentsCount: c.commentsCount || 0,
            isLiked: c.isLiked || false,
          },
          score: (c.likesCount || 0) * 2 + (c.commentsCount || 0) * 3,
          timestamp: new Date(c.createdAt).getTime(),
        });
      });
    }

    // Add bounties (compact cards)
    if (bounties?.bounties) {
      bounties.bounties.slice(0, 8).forEach((b: any) => {
        feed.push({
          id: `bounty-${b.id}`,
          type: 'bounty',
          data: b,
          score: (b.reward || 0) / 10 + (b.status === 'open' ? 50 : 0),
          timestamp: new Date(b.createdAt).getTime(),
        });
      });
    }

    // Add markets (compact cards)
    if (markets?.markets) {
      markets.markets.slice(0, 8).forEach((m: any) => {
        feed.push({
          id: `market-${m.id}`,
          type: 'market',
          data: m,
          score: (m.totalVolume || 0) / 100 + Math.abs(m.yesPrice - 0.5) * 100,
          timestamp: new Date(m.createdAt).getTime(),
        });
      });
    }

    // Add summaries (compact story cards)
    if (summaries) {
      summaries.slice(0, 6).forEach((s: any) => {
        feed.push({
          id: `summary-${s.id}`,
          type: 'summary',
          data: s,
          score: 30,
          timestamp: new Date(s.createdAt).getTime(),
        });
      });
    }

    // Add macro/crypto data cards
    const prices = (stockData as any)?.prices;
    if (prices) {
      const topAssets = ['BTC', 'ETH', 'SPY', 'QQQ'];
      topAssets.forEach((symbol, idx) => {
        const assetData = prices[symbol];
        if (assetData) {
          feed.push({
            id: `macro-${symbol}`,
            type: 'macro',
            data: {
              symbol,
              name: assetData.name || symbol,
              price: assetData.price || 0,
              change: assetData.change || 0,
              changePercent: assetData.changePercent || 0,
            },
            score: 40 - idx * 5, // Prioritize BTC/ETH
            timestamp: Date.now(),
          });
        }
      });
    }

    // Sort by score and recency
    return feed.sort((a, b) => {
      const scoreWeight = 0.7;
      const timeWeight = 0.3;
      const scoreA = a.score * scoreWeight + (a.timestamp / 1000000) * timeWeight;
      const scoreB = b.score * scoreWeight + (b.timestamp / 1000000) * timeWeight;
      return scoreB - scoreA;
    });
  };

  // Interleave macro cards every 4-5 items
  const interleaveContent = (items: FeedItem[]): FeedItem[] => {
    const macroCards = items.filter(item => item.type === 'macro');
    const otherCards = items.filter(item => item.type !== 'macro');
    const result: FeedItem[] = [];

    let macroIndex = 0;
    otherCards.forEach((item, idx) => {
      result.push(item);
      // Insert macro card every 4 items
      if ((idx + 1) % 4 === 0 && macroIndex < macroCards.length) {
        result.push(macroCards[macroIndex]);
        macroIndex++;
      }
    });

    // Add remaining macro cards at the end
    while (macroIndex < macroCards.length) {
      result.push(macroCards[macroIndex]);
      macroIndex++;
    }

    return result;
  };

  const feedItems = interleaveContent(buildFeed());
  const isLoading = conversationsLoading || bountiesLoading || marketsLoading || summariesLoading;

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <SectionHeader
            title="Discover"
            subtitle="Live feed of bounties, predictions, stories, and market data"
          />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 backdrop-blur-md rounded-lg border border-purple-500/20">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-trending"
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
            Trending
          </button>
          <button
            onClick={() => setActiveTab('forYou')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'forYou'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-for-you"
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            For You
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'following'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-following"
          >
            Following
          </button>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-3 animate-pulse">
                <div className="flex gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-purple-500/20 rounded w-1/3"></div>
                    <div className="h-2.5 bg-purple-500/10 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-purple-500/20 rounded w-3/4"></div>
                  <div className="h-2.5 bg-purple-500/10 rounded w-full"></div>
                  <div className="h-2.5 bg-purple-500/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : feedItems.length > 0 ? (
          <div className="space-y-3">
            {feedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {item.type === 'conversation' && (
                  <SocialPost {...item.data} type="conversation" />
                )}
                {item.type === 'bounty' && (
                  <CompactBountyCard
                    id={item.data.id}
                    title={item.data.title}
                    reward={item.data.reward}
                    status={item.data.status}
                    createdAt={item.data.createdAt}
                    creator={item.data.creator}
                  />
                )}
                {item.type === 'market' && (
                  <CompactMarketCard
                    id={item.data.id}
                    question={item.data.question}
                    yesPrice={item.data.yesPrice}
                    totalVolume={item.data.totalVolume}
                    createdAt={item.data.createdAt}
                  />
                )}
                {item.type === 'summary' && (
                  <CompactStoryCard
                    id={item.data.id}
                    title={item.data.title}
                    summary={item.data.tldrSummary || item.data.executiveSummary || 'No summary available'}
                    thumbnailUrl={item.data.thumbnailUrl}
                    createdAt={item.data.createdAt}
                    creator={item.data.creator}
                  />
                )}
                {item.type === 'macro' && (
                  <MacroDataCard {...item.data} />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-8">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 mb-4">
                Be the first to start a conversation!
              </p>
              {isAuthenticated && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-fuchsia-500/50 transition-all"
            data-testid="button-create-post"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Post Creation Modal */}
      <PostCreationModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </section>
  );
}
