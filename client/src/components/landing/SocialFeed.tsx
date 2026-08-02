import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { SocialFeedCard } from '@/components/social/SocialFeedCard';
import { InlineMarketCard } from '@/components/prediction/InlineMarketCard';
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
            ctx.strokeStyle = `rgba(139, 124, 246, ${0.1 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 124, 246, 0.4)';
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

  // Fetch news-generated prediction markets
  const { data: markets, isLoading: marketsLoading, error: marketsError } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/news/predictions'],
    enabled: activeTab === 'predictions',
  });

  // Fetch macro news for MACRO tab
  const { data: macroNews, isLoading: macroLoading, error: macroError } = useQuery<any>({
    queryKey: ['/api/news/macro'],
    enabled: activeTab === 'macro',
  });

  // Fetch crypto news for CRYPTO tab
  const { data: cryptoNews, isLoading: cryptoLoading, error: cryptoError } = useQuery<any>({
    queryKey: ['/api/news/crypto'],
    enabled: activeTab === 'crypto',
  });

  // Fetch social-generated markets (for inline display)
  const { data: socialMarkets, isLoading: socialMarketsLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/news/markets'],
    enabled: activeTab !== 'predictions', // Show in MACRO and CRYPTO tabs
  });

  // Build feed based on active tab
  const buildFeed = (): FeedItem[] => {
    const feed: FeedItem[] = [];

    if (activeTab === 'macro' && macroNews?.articles) {
      macroNews.articles.forEach((article: any, index: number) => {
        feed.push({
          id: article.id,
          type: 'macro',
          content: {
            title: article.title,
            description: article.summary,
            author: { id: article.source.toLowerCase(), username: article.source },
            createdAt: article.published,
            metadata: {
              source: article.source,
              sourceLogo: article.sourceLogo,
              category: article.category,
              url: article.url,
              imageUrl: article.imageUrl,
            },
          },
          engagement: {
            likesCount: Math.floor(Math.random() * 50 + 10),
            commentsCount: Math.floor(Math.random() * 20 + 5),
          },
          score: 100 - index,
          timestamp: new Date(article.published).getTime(),
        });
      });

      // Inject markets every 2-3 posts (only for macro/crypto tabs)
      if (socialMarkets?.markets && socialMarkets.markets.length > 0) {
        const marketsToInject = socialMarkets.markets.filter(m => 
          m.category === 'macro' || m.category === 'real_world'
        ).slice(0, 2);
        
        marketsToInject.forEach((market, idx) => {
          feed.splice(2 + (idx * 3), 0, {
            id: `market-${market.id}`,
            type: 'market',
            content: market,
            engagement: {
              likesCount: market.likesCount || 0,
              commentsCount: market.commentsCount || 0,
            },
            score: 95 - (idx * 5),
            timestamp: new Date(market.createdAt).getTime(),
          });
        });
      }
    }

    if (activeTab === 'crypto' && cryptoNews?.articles) {
      cryptoNews.articles.forEach((article: any, index: number) => {
        feed.push({
          id: article.id,
          type: 'crypto',
          content: {
            title: article.title,
            description: article.summary,
            author: { id: article.source.toLowerCase(), username: article.source },
            createdAt: article.published,
            metadata: {
              source: article.source,
              sourceLogo: article.sourceLogo,
              category: article.category,
              url: article.url,
              imageUrl: article.imageUrl,
            },
          },
          engagement: {
            likesCount: Math.floor(Math.random() * 100 + 20),
            commentsCount: Math.floor(Math.random() * 40 + 10),
          },
          score: 100 - index,
          timestamp: new Date(article.published).getTime(),
        });
      });

      // Inject crypto-related markets every 2-3 posts
      if (socialMarkets?.markets && socialMarkets.markets.length > 0) {
        const marketsToInject = socialMarkets.markets.filter(m => 
          m.category === 'crypto' || m.category === 'defi'
        ).slice(0, 2);
        
        marketsToInject.forEach((market, idx) => {
          feed.splice(2 + (idx * 3), 0, {
            id: `market-${market.id}`,
            type: 'market',
            content: market,
            engagement: {
              likesCount: market.likesCount || 0,
              commentsCount: market.commentsCount || 0,
            },
            score: 95 - (idx * 5),
            timestamp: new Date(market.createdAt).getTime(),
          });
        });
      }
    }

    if (activeTab === 'predictions' && markets?.markets) {
      markets.markets.forEach((m: any) => {
        const yesPercentage = (m.yesPrice || 5000) > 10000 ? 50 : Math.round((m.yesPrice || 5000) / 100);
        feed.push({
          id: m.id,
          type: 'market',
          content: m, // Pass the full market object, not restructured
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
    (activeTab === 'macro' && macroLoading) ||
    (activeTab === 'crypto' && cryptoLoading) ||
    (activeTab === 'predictions' && marketsLoading);
  
  const currentError = 
    (activeTab === 'macro' && macroError) ||
    (activeTab === 'crypto' && cryptoError) ||
    (activeTab === 'predictions' && marketsError);

  return (
    <section id="social-feed" className="relative overflow-hidden pt-20 pb-8">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4 sm:mb-6"
        >
           <SectionTitle as="h1" eyebrow="Live intelligence">
             Social Feed
           </SectionTitle>
           <p className="mt-1 text-sm text-secondary">Engage with markets and real-time data</p>
        </motion.div>

        {/* Incentive Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
           className="mb-3 rounded-xl border border-ink-edge bg-ink-surface p-2.5"
          data-testid="incentive-banner"
        >
          <div className="flex items-center gap-2">
             <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-accent-core/15">
               <Gift className="w-4 h-4 text-accent-bright" />
            </div>
            <div className="flex-1">
               <h3 className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                Earn STREAM Points! 
                 <Sparkles className="w-3 h-3 text-warn" />
              </h3>
               <p className="text-[10px] text-secondary">
                Like, comment, and save content to earn rewards.
                 {!isAuthenticated && <span className="font-semibold text-accent-bright"> Sign in to start.</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
         <div className="mb-3 flex gap-1.5 rounded-xl border border-ink-edge bg-ink-surface p-1">
          <button
            onClick={() => setActiveTab('macro')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'macro'
                 ? 'bg-accent-core text-primary glow-accent'
                 : 'text-secondary hover:bg-ink-raised hover:text-primary'
            }`}
            data-testid="tab-macro"
          >
            <LineChart className="w-3 h-3 inline mr-1" />
            MACRO
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'crypto'
                 ? 'bg-accent-core text-primary glow-accent'
                 : 'text-secondary hover:bg-ink-raised hover:text-primary'
            }`}
            data-testid="tab-crypto"
          >
            <Coins className="w-3 h-3 inline mr-1" />
            CRYPTO
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === 'predictions'
                 ? 'bg-accent-core text-primary glow-accent'
                 : 'text-secondary hover:bg-ink-raised hover:text-primary'
            }`}
            data-testid="tab-predictions"
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            PREDICTIONS
          </button>
        </div>

        {/* Feed */}
        <AnimatePresence mode="wait">
          {currentError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
               <Surface className="p-6">
                 <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-warn/10">
                   <TrendingUp className="w-6 h-6 text-warn" />
                </div>
                 <h3 className="mb-2 text-lg font-semibold text-primary">High Demand</h3>
                 <p className="mb-3 text-sm text-secondary">
                  Our data services are experiencing high traffic. Please try again in a few moments.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                   className="rounded-xl border border-warn/50 text-warn hover:bg-warn/10"
                  data-testid="button-reload"
                >
                  Refresh
                </Button>
               </Surface>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[...Array(5)].map((_, i) => (
                 <Surface key={i} className="animate-pulse p-2.5">
                  <div className="flex gap-2 mb-2">
                     <div className="h-7 w-7 rounded-xl bg-accent-core/15"></div>
                    <div className="flex-1 space-y-1">
                       <div className="h-3 w-1/3 rounded-xl bg-accent-core/15"></div>
                       <div className="h-2 w-1/4 rounded-xl bg-accent-core/10"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                     <div className="h-3 w-3/4 rounded-xl bg-accent-core/15"></div>
                     <div className="h-2 w-full rounded-xl bg-accent-core/10"></div>
                  </div>
                 </Surface>
              ))}
            </motion.div>
          ) : feedItems.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {feedItems.slice(0, 8).map((item) => (
                item.type === 'market' ? (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InlineMarketCard
                      market={item.content}
                      variant="compact"
                      context="social"
                    />
                  </motion.div>
                ) : (
                  <SocialFeedCard
                    key={`${item.type}-${item.id}`}
                    id={item.id}
                    type={item.type as any}
                    content={item.content}
                    engagement={item.engagement}
                  />
                )
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
               <Surface className="p-8">
                 <Sparkles className="mx-auto mb-4 h-16 w-16 text-accent-bright" />
                 <h3 className="mb-2 text-xl font-semibold text-primary">No stories available</h3>
                 <p className="mb-4 text-secondary">
                  Check back soon for the latest news and updates!
                </p>
               </Surface>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
