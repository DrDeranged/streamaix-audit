import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SocialFeedCard } from '@/components/social/SocialFeedCard';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  Coins, 
  LineChart,
  Sparkles,
  Gift
} from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'conversation' | 'bounty' | 'market' | 'summary' | 'macro' | 'crypto';
  content: any;
  engagement: {
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean;
    isSaved?: boolean;
  };
  score: number;
  timestamp: number;
}

export function SocialFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'macro' | 'crypto' | 'predictions'>('macro');

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

  // Fetch prediction markets
  const { data: markets, isLoading: marketsLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/prediction-markets'],
    enabled: activeTab === 'predictions',
  });

  // Fetch stock data for MACRO tab
  const { data: stockData, isLoading: stockLoading } = useQuery<any>({
    queryKey: ['/api/analytics/live/stocks'],
    enabled: activeTab === 'macro',
  });

  // Fetch crypto data for CRYPTO tab
  const { data: cryptoData, isLoading: cryptoLoading } = useQuery<any>({
    queryKey: ['/api/analytics/live/crypto'],
    enabled: activeTab === 'crypto',
  });

  // Build feed based on active tab
  const buildFeed = (): FeedItem[] => {
    const feed: FeedItem[] = [];

    if (activeTab === 'macro' && stockData?.stocks) {
      stockData.stocks.forEach((stock: any, index: number) => {
        feed.push({
          id: `stock-${stock.symbol}`,
          type: 'macro',
          content: {
            title: `${stock.name} (${stock.symbol})`,
            description: `Current Price: $${stock.currentPrice?.toFixed(2) || 'N/A'} | ${stock.changePercent >= 0 ? '📈' : '📉'} ${stock.changePercent?.toFixed(2)}%`,
            author: { id: 'market-data', username: 'Market Data' },
            createdAt: new Date().toISOString(),
            metadata: {
              symbol: stock.symbol,
              price: stock.currentPrice,
              change: stock.changePercent,
              volume: stock.volume,
            },
          },
          engagement: {
            likesCount: Math.floor(Math.random() * 50),
            commentsCount: Math.floor(Math.random() * 20),
          },
          score: Math.abs(stock.changePercent || 0) * 10,
          timestamp: Date.now() - index * 1000,
        });
      });
    }

    if (activeTab === 'crypto' && cryptoData?.prices) {
      cryptoData.prices.forEach((crypto: any, index: number) => {
        feed.push({
          id: `crypto-${crypto.symbol}`,
          type: 'crypto',
          content: {
            title: `${crypto.name} (${crypto.symbol.toUpperCase()})`,
            description: `Current Price: $${crypto.current_price?.toFixed(crypto.current_price < 1 ? 6 : 2) || 'N/A'} | ${crypto.price_change_percentage_24h >= 0 ? '📈' : '📉'} ${crypto.price_change_percentage_24h?.toFixed(2)}%`,
            author: { id: 'crypto-feed', username: 'Crypto Feed' },
            createdAt: new Date().toISOString(),
            metadata: {
              symbol: crypto.symbol,
              price: crypto.current_price,
              change: crypto.price_change_percentage_24h,
              marketCap: crypto.market_cap,
            },
          },
          engagement: {
            likesCount: Math.floor(Math.random() * 100),
            commentsCount: Math.floor(Math.random() * 40),
          },
          score: Math.abs(crypto.price_change_percentage_24h || 0) * 10,
          timestamp: Date.now() - index * 1000,
        });
      });
    }

    if (activeTab === 'predictions' && markets?.markets) {
      markets.markets.forEach((m: any) => {
        const yesPercentage = Math.round(((m.yesPrice || 500000) / 1000000) * 100);
        feed.push({
          id: m.id,
          type: 'market',
          content: {
            title: m.question,
            description: m.description,
            author: {
              id: m.creatorId,
              username: m.creator?.username || 'AI Hunter',
            },
            createdAt: m.createdAt,
            metadata: {
              yesPrice: m.yesPrice,
              yesPercentage,
            },
          },
          engagement: {
            likesCount: m.likesCount || 0,
            commentsCount: m.commentsCount || 0,
            isLiked: m.isLiked || false,
            isSaved: m.isSaved || false,
          },
          score: (m.totalVolume || 0) / 100 + Math.abs(yesPercentage - 50),
          timestamp: new Date(m.createdAt).getTime(),
        });
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

  const feedItems = buildFeed();
  const isLoading = 
    (activeTab === 'macro' && stockLoading) ||
    (activeTab === 'crypto' && cryptoLoading) ||
    (activeTab === 'predictions' && marketsLoading);

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
            Social Feed
          </h2>
          <p className="text-gray-400 text-sm">
            Engage with markets, predictions, and real-time data
          </p>
        </motion.div>

        {/* Incentive Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-6 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-cyan-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-lg"
          data-testid="incentive-banner"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                Earn STREAM Tokens! 
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </h3>
              <p className="text-gray-300 text-xs">
                Like, comment, and save content to earn STREAM tokens. The more you engage, the more you earn! 
                {!isAuthenticated && <span className="text-fuchsia-400 font-semibold"> Sign in to start earning.</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1.5 bg-white/5 backdrop-blur-md rounded-xl border border-purple-500/20">
          <button
            onClick={() => setActiveTab('macro')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'macro'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-macro"
          >
            <LineChart className="w-4 h-4 inline mr-2" />
            MACRO
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'crypto'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-crypto"
          >
            <Coins className="w-4 h-4 inline mr-2" />
            CRYPTO
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'predictions'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid="tab-predictions"
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            PREDICTIONS
          </button>
        </div>

        {/* Feed */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-purple-500/20 rounded w-1/3"></div>
                      <div className="h-3 bg-purple-500/10 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                    <div className="h-3 bg-purple-500/10 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : feedItems.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {feedItems.map((item) => (
                <SocialFeedCard
                  key={`${item.type}-${item.id}`}
                  id={item.id}
                  type={item.type as any}
                  content={item.content}
                  engagement={item.engagement}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-lg p-8">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No data available</h3>
                <p className="text-gray-400 mb-4">
                  Check back soon for updates!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
