import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Zap, 
  Clock, 
  Users, 
  Play,
  Loader2
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
  const { isAuthenticated } = useAuth();
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
        return <Badge className="bg-gain/10 text-gain border-gain/30">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-accent-core/10 text-accent-bright border-accent-core/30">Processing</Badge>;
      default:
        return <Badge variant="outline" className="text-secondary border-ink-edge">Ready to Process</Badge>;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'text-gain';
      case 'Intermediate': return 'text-warn';
      case 'Advanced': return 'text-loss';
      default: return 'text-secondary';
    }
  };

  return (
    <section className="bg-ink-page py-12 text-body">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-4 flex items-center gap-4 lg:mb-0">
            <div>
              <SectionTitle as="h2">Long-Form Crypto Podcasts</SectionTitle>
              <p className="mt-1 text-sm text-secondary">Transform 60+ minute episodes into actionable insights</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[140px] rounded-xl border-ink-edge bg-ink-surface text-secondary">
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
          <TabsList className="grid w-full grid-cols-6 rounded-xl border border-ink-edge bg-ink-surface p-1 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="All" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">All</TabsTrigger>
            <TabsTrigger value="Bitcoin" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">Bitcoin</TabsTrigger>
            <TabsTrigger value="Ethereum" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">Ethereum</TabsTrigger>
            <TabsTrigger value="DeFi" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">DeFi</TabsTrigger>
            <TabsTrigger value="Trading" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">Trading</TabsTrigger>
            <TabsTrigger value="General" className="rounded-xl text-secondary hover:bg-ink-raised data-[state=active]:bg-accent-core data-[state=active]:text-primary">General</TabsTrigger>
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
              <Surface className="p-6 transition-colors duration-300 hover:bg-ink-raised">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-ink-edge text-xs text-secondary">
                              {episode.show}
                            </Badge>
                            <span className="text-xs text-muted">
                              {episode.publishedAt}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold leading-tight text-primary">
                            {episode.title}
                          </h3>
                          <p className="mt-2 text-sm text-secondary">
                            {episode.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(episode.processingStatus)}
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="w-3 h-3" />
                            {episode.duration}
                          </div>
                        </div>
                      </div>

                      {/* Host/Guest */}
                      <div className="flex items-center gap-4 text-sm text-body">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-secondary" />
                          <span className="text-secondary">Host:</span>
                          <span className="font-medium text-primary">{episode.host}</span>
                        </div>
                        {episode.guest && (
                          <div className="flex items-center gap-1">
                            <span className="text-secondary">Guest:</span>
                            <span className="font-medium text-primary">{episode.guest}</span>
                          </div>
                        )}
                      </div>

                      {/* AI Preview */}
                      <Surface variant="raised" className="grid grid-cols-1 gap-3 rounded-xl p-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                          <StatValue label="Chapters" value={episode.aiPreview.chaptersCount} />
                        </div>
                        <div className="text-center">
                          <StatValue label="Key Entities" value={episode.aiPreview.entitiesCount} />
                        </div>
                        <div className="text-center">
                          <StatValue
                            label="Complexity"
                            value={episode.aiPreview.complexity}
                            valueClassName={`text-lg ${getComplexityColor(episode.aiPreview.complexity)}`}
                          />
                        </div>
                        <div className="text-center">
                          <StatValue label="Topics" value={episode.tags.length} />
                        </div>
                      </Surface>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2">
                        {episode.aiPreview.keyTopics.slice(0, 4).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="border border-ink-edge bg-ink-raised text-xs text-secondary">
                            {topic}
                          </Badge>
                        ))}
                        {episode.aiPreview.keyTopics.length > 4 && (
                          <Badge variant="secondary" className="border border-ink-edge bg-ink-raised text-xs text-secondary">
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
                        className="grad-accent glow-accent h-12 w-full rounded-xl border-0 font-semibold text-primary hover:bg-accent-deep"
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
                      
                      <div className="text-center text-xs text-muted">
                        <div>~{Math.round(episode.durationSeconds / 60)} min read</div>
                        <div>vs {episode.duration} listen</div>
                      </div>
                    </div>
                  </div>
              </Surface>
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
            className="grad-accent glow-accent rounded-xl border-0 text-sm text-primary hover:bg-accent-deep"
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