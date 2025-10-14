import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Zap, 
  Clock, 
  Users, 
  BookOpen, 
  Filter,
  TrendingUp,
  Play,
  Loader2,
  Calendar,
  Hash
} from 'lucide-react';

interface LongFormEpisode {
  id: string;
  title: string;
  show: string;
  host: string;
  guest?: string;
  url: string;
  duration: string; // "2h 15m"
  durationSeconds: number;
  publishedAt: string;
  tags: string[];
  category: 'Bitcoin' | 'Ethereum' | 'DeFi' | 'Trading' | 'General';
  description: string;
  aiPreview: {
    chaptersCount: number;
    entitiesCount: number;
    keyTopics: string[];
    complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  };
  processingStatus: 'not_processed' | 'processing' | 'completed';
}

// Curated long-form crypto podcasts (60+ minutes)
const longFormEpisodes: LongFormEpisode[] = [
  {
    id: '1',
    title: 'The Complete Guide to Bitcoin Monetary Theory with Saifedean Ammous',
    show: 'What Bitcoin Did',
    host: 'Peter McCormack',
    guest: 'Saifedean Ammous',
    url: 'https://www.youtube.com/watch?v=Zbm772vF-5M',
    duration: '2h 15m',
    durationSeconds: 8100,
    publishedAt: '2 days ago',
    tags: ['Monetary Theory', 'Austrian Economics', 'Sound Money'],
    category: 'Bitcoin',
    description: 'Deep dive into Bitcoin as sound money and its role in the global economy.',
    aiPreview: {
      chaptersCount: 12,
      entitiesCount: 24,
      keyTopics: ['Austrian Economics', 'Inflation', 'Central Banking', 'Gold Standard'],
      complexity: 'Advanced'
    },
    processingStatus: 'not_processed'
  },
  {
    id: '2',
    title: 'Ethereum Roadmap 2024: Sharding, Rollups, and the Path to 100k TPS',
    show: 'Bankless',
    host: 'Ryan Sean Adams',
    guest: 'Vitalik Buterin',
    url: 'https://www.youtube.com/watch?v=kGjFTzRTH3Q',
    duration: '1h 45m',
    durationSeconds: 6300,
    publishedAt: '4 days ago',
    tags: ['Ethereum 2.0', 'Scaling', 'Technical'],
    category: 'Ethereum',
    description: 'Vitalik discusses the future of Ethereum scaling and the roadmap ahead.',
    aiPreview: {
      chaptersCount: 8,
      entitiesCount: 31,
      keyTopics: ['Sharding', 'Layer 2', 'Rollups', 'Consensus'],
      complexity: 'Advanced'
    },
    processingStatus: 'not_processed'
  },
  {
    id: '3',
    title: 'DeFi Summer Lessons: What We Learned from $100B in TVL',
    show: 'Unchained',
    host: 'Laura Shin',
    guest: 'Hayden Adams',
    url: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
    duration: '1h 20m',
    durationSeconds: 4800,
    publishedAt: '1 week ago',
    tags: ['DeFi', 'Uniswap', 'AMM'],
    category: 'DeFi',
    description: 'Hayden Adams reflects on the DeFi boom and lessons learned from building Uniswap.',
    aiPreview: {
      chaptersCount: 7,
      entitiesCount: 19,
      keyTopics: ['AMM', 'Liquidity Mining', 'Governance', 'MEV'],
      complexity: 'Intermediate'
    },
    processingStatus: 'completed'
  },
  {
    id: '4',
    title: 'Institutional Bitcoin Adoption: MicroStrategy, Tesla, and Corporate Treasury',
    show: 'The Investor\'s Podcast',
    host: 'Preston Pysh',
    guest: 'Michael Saylor',
    url: 'https://www.youtube.com/watch?v=mC43pZkpTec',
    duration: '2h 30m',
    durationSeconds: 9000,
    publishedAt: '3 days ago',
    tags: ['Corporate Treasury', 'Institutional', 'Strategy'],
    category: 'Bitcoin',
    description: 'Michael Saylor explains MicroStrategy\'s Bitcoin strategy and corporate adoption.',
    aiPreview: {
      chaptersCount: 15,
      entitiesCount: 28,
      keyTopics: ['Corporate Strategy', 'Treasury Management', 'Inflation Hedge'],
      complexity: 'Intermediate'
    },
    processingStatus: 'not_processed'
  },
  {
    id: '5',
    title: 'The Future of Trading: MEV, Dark Pools, and Decentralized Exchanges',
    show: 'Epicenter',
    host: 'Sebastien Couture',
    guest: 'Dan Robinson',
    url: 'https://www.youtube.com/watch?v=SSo_EIwHSd4',
    duration: '1h 55m',
    durationSeconds: 6900,
    publishedAt: '5 days ago',
    tags: ['MEV', 'Trading', 'Infrastructure'],
    category: 'Trading',
    description: 'Deep dive into MEV, trading infrastructure, and the future of decentralized exchanges.',
    aiPreview: {
      chaptersCount: 9,
      entitiesCount: 22,
      keyTopics: ['MEV', 'Flashloans', 'Arbitrage', 'DEX Design'],
      complexity: 'Advanced'
    },
    processingStatus: 'not_processed'
  },
  {
    id: '6',
    title: 'Crypto Market Analysis: Bull Market Psychology and Portfolio Construction',
    show: 'InvestAnswers',
    host: 'James',
    url: 'https://www.youtube.com/watch?v=l1si5ZWLgy0',
    duration: '1h 10m',
    durationSeconds: 4200,
    publishedAt: '1 day ago',
    tags: ['Market Analysis', 'Portfolio', 'Psychology'],
    category: 'Trading',
    description: 'Comprehensive market analysis and portfolio construction strategies.',
    aiPreview: {
      chaptersCount: 6,
      entitiesCount: 16,
      keyTopics: ['Market Psychology', 'Risk Management', 'Asset Allocation'],
      complexity: 'Intermediate'
    },
    processingStatus: 'not_processed'
  }
];

export function LongFormPodcasts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [processingEpisodeId, setProcessingEpisodeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'length' | 'trending'>('recent');
  const [filteredEpisodes, setFilteredEpisodes] = useState<LongFormEpisode[]>(longFormEpisodes);

  // Filter and sort episodes
  useEffect(() => {
    let filtered = longFormEpisodes.filter(episode => {
      if (selectedCategory === 'All') return true;
      return episode.category === selectedCategory;
    });

    // Sort episodes
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'length':
          return b.durationSeconds - a.durationSeconds;
        case 'trending':
          return b.aiPreview.entitiesCount - a.aiPreview.entitiesCount;
        case 'recent':
        default:
          return 0; // Keep original order for "recent"
      }
    });

    setFilteredEpisodes(filtered);
  }, [selectedCategory, sortBy]);

  const handleProcessEpisode = async (episode: LongFormEpisode) => {
    console.log('Processing episode clicked:', episode.title, episode.url);
    console.log('User authenticated:', isAuthenticated);
    
    setProcessingEpisodeId(episode.id);
    console.log('Set processing episode ID:', episode.id);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, navigating to sign in with return URL');
      toast({
        title: "Sign in to continue",
        description: "Redirecting to sign in page...",
      });
      
      // Navigate to auth with return URL that includes the episode processing
      setTimeout(() => {
        setProcessingEpisodeId(null);
        setLocation(`/auth?return=${encodeURIComponent('/#ai-processor?url=' + encodeURIComponent(episode.url) + '&autostart=true')}`);
      }, 1500);
      return;
    }
    
    toast({
      title: "Starting AI Analysis...",
      description: `Processing "${episode.title}"`,
    });

    // Navigate to AI processor with hash navigation and auto-start
    setTimeout(() => {
      console.log('Navigating to AI processor with URL:', episode.url);
      setProcessingEpisodeId(null);
      
      // Use window.location.hash for proper hash navigation
      window.location.hash = `ai-processor?url=${encodeURIComponent(episode.url)}&autostart=true`;
      
      // Scroll to processor section after navigation
      setTimeout(() => {
        const element = document.getElementById('ai-processor');
        console.log('Found AI processor element:', !!element);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 1000);
  };

  const getStatusBadge = (status: LongFormEpisode['processingStatus']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Ready to Process</Badge>;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'text-green-600 dark:text-green-400';
      case 'Intermediate': return 'text-yellow-600 dark:text-yellow-400';
      case 'Advanced': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Long-Form Crypto Podcasts
              </h2>
              <p className="text-muted-foreground">
                Transform 60+ minute episodes into actionable insights
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Bitcoin">Bitcoin</TabsTrigger>
            <TabsTrigger value="Ethereum">Ethereum</TabsTrigger>
            <TabsTrigger value="DeFi">DeFi</TabsTrigger>
            <TabsTrigger value="Trading">Trading</TabsTrigger>
            <TabsTrigger value="General">General</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Episodes List */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {filteredEpisodes.map((episode, index) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {episode.show}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {episode.publishedAt}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg text-foreground leading-tight">
                            {episode.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {episode.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(episode.processingStatus)}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {episode.duration}
                          </div>
                        </div>
                      </div>

                      {/* Host/Guest */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Host:</span>
                          <span className="font-medium">{episode.host}</span>
                        </div>
                        {episode.guest && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Guest:</span>
                            <span className="font-medium">{episode.guest}</span>
                          </div>
                        )}
                      </div>

                      {/* AI Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{episode.aiPreview.chaptersCount}</div>
                          <div className="text-xs text-muted-foreground">Chapters</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{episode.aiPreview.entitiesCount}</div>
                          <div className="text-xs text-muted-foreground">Key Entities</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getComplexityColor(episode.aiPreview.complexity)}`}>
                            {episode.aiPreview.complexity}
                          </div>
                          <div className="text-xs text-muted-foreground">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{episode.tags.length}</div>
                          <div className="text-xs text-muted-foreground">Topics</div>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2">
                        {episode.aiPreview.keyTopics.slice(0, 4).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {episode.aiPreview.keyTopics.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{episode.aiPreview.keyTopics.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="lg:w-48 flex flex-col items-center gap-3">
                      <Button
                        onClick={() => handleProcessEpisode(episode)}
                        disabled={processingEpisodeId === episode.id || episode.processingStatus === 'processing'}
                        className="w-full h-12 font-semibold"
                        data-testid={`button-process-episode-${episode.id}`}
                      >
                        {processingEpisodeId === episode.id || episode.processingStatus === 'processing' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : episode.processingStatus === 'completed' ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            View Results
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Process with AI
                          </>
                        )}
                      </Button>
                      
                      <div className="text-center text-xs text-muted-foreground">
                        <div>~{Math.round(episode.durationSeconds / 60)} min read</div>
                        <div>vs {episode.duration} listen</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Button
            onClick={() => window.location.hash = 'ai-processor'}
            variant="outline"
            className="text-sm"
            data-testid="button-try-own-url"
          >
            <Zap className="w-4 h-4 mr-2" />
            Process Your Own Podcast URL
          </Button>
        </motion.div>
      </div>
    </section>
  );
}