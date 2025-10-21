import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SocialPost } from '@/components/social/SocialPost';
import { PostCreationModal } from '@/components/social/PostCreationModal';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Sparkles, TrendingUp } from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary';
  title: string;
  content?: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  metadata?: any;
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

  // Combine all feed items
  const feedItems: FeedItem[] = [];

  // Add conversations
  if (conversations?.conversations) {
    feedItems.push(...conversations.conversations.map((c: any) => ({
      id: c.id,
      type: 'conversation' as const,
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
    })));
  }

  // Add bounties
  if (bounties?.bounties) {
    feedItems.push(...bounties.bounties.map((b: any) => ({
      id: b.id,
      type: 'bounty' as const,
      title: b.title,
      content: b.description,
      author: {
        id: b.creatorId,
        username: b.creator?.username || 'Anonymous',
        avatar: b.creator?.avatar,
      },
      createdAt: b.createdAt,
      likesCount: 0,
      commentsCount: 0,
      metadata: { reward: b.reward, status: b.status },
    })));
  }

  // Add markets
  if (markets?.markets) {
    feedItems.push(...markets.markets.map((m: any) => ({
      id: m.id,
      type: 'market' as const,
      title: m.question,
      content: m.description,
      author: {
        id: m.creatorId,
        username: m.creator?.username || 'Anonymous',
        avatar: m.creator?.avatar,
      },
      createdAt: m.createdAt,
      likesCount: 0,
      commentsCount: 0,
      metadata: { yesPrice: m.yesPrice, volume: m.totalVolume },
    })));
  }

  // Add summaries
  if (summaries) {
    feedItems.push(...summaries.map((s: any) => ({
      id: s.id,
      type: 'summary' as const,
      title: s.title,
      content: s.tldrSummary || s.executiveSummary,
      author: {
        id: s.creatorId,
        username: s.creator?.username || 'AI Hunter',
        avatar: s.creator?.avatar,
      },
      createdAt: s.createdAt,
      likesCount: 0,
      commentsCount: 0,
    })));
  }

  // Sort by date
  const sortedFeed = feedItems.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isLoading = conversationsLoading || bountiesLoading || marketsLoading || summariesLoading;

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
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
            Join the conversation on crypto, bounties, and predictions
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 backdrop-blur-md rounded-lg border border-purple-500/20">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-trending"
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5" />
            Trending
          </button>
          <button
            onClick={() => setActiveTab('forYou')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'forYou'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-for-you"
          >
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            For You
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-6 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-purple-500/20 rounded w-1/3"></div>
                    <div className="h-3 bg-purple-500/10 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                  <div className="h-3 bg-purple-500/10 rounded w-full"></div>
                  <div className="h-3 bg-purple-500/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedFeed.length > 0 ? (
          <div className="space-y-4">
            {sortedFeed.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SocialPost {...item} />
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
