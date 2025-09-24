import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar, 
  Eye, 
  Star, 
  BookOpen, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
  FileText,
  Video,
  Headphones,
  Radio,
  Users,
  Brain,
  Zap,
  BarChart3,
  Tag,
  Clock,
  ArrowLeft,
  Home,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  originalUrl: string;
  contentType: string;
  platform: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  accuracy?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  keyInsights?: string[];
  marketInsights?: string[];
  structure?: any;
  creator?: string;
  views?: number;
  likes?: number;
  bookmarks?: number;
  duration?: string;
  themes?: string[];
  credibilityScore?: number;
}

interface FilterOptions {
  platform: string;
  contentType: string;
  status: string;
  dateRange: string;
  sortBy: string;
  minAccuracy: number;
}

export default function ContentLibrary() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  
  const [filters, setFilters] = useState<FilterOptions>({
    platform: 'all',
    contentType: 'all',
    status: 'all',
    dateRange: 'all',
    sortBy: 'newest',
    minAccuracy: 0
  });

  // Fetch all summaries with enhanced metadata
  const { data: allSummaries = [], isLoading: summariesLoading } = useQuery<Summary[]>({
    queryKey: ['/api/summaries/public'],
    retry: 1,
    staleTime: 30000,
  });

  // Mock featured and trending data to showcase the library
  const [featuredContent] = useState<Summary[]>([
    {
      id: 'featured_1',
      title: 'The Future of Decentralized AI',
      originalUrl: 'https://youtube.com/watch?v=featured1',
      platform: 'YouTube',
      contentType: 'video',
      creator: 'Naval Ravikant',
      duration: '24:15',
      views: 15420,
      likes: 892,
      accuracy: 94,
      tags: ['AI', 'Decentralization', 'Future Tech'],
      themes: ['Technology Innovation', 'Decentralized Systems'],
      credibilityScore: 96,
      processingStatus: 'completed',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      summary: 'Comprehensive analysis of how artificial intelligence will evolve in decentralized ecosystems, examining the intersection of blockchain technology and AI development.',
      keyInsights: ['Decentralized AI models could democratize access to advanced AI capabilities', 'Blockchain technology enables new incentive structures for AI development'],
    },
    {
      id: 'featured_2', 
      title: 'Ethereum 2.0 Technical Deep Dive',
      originalUrl: 'https://podcast.com/ethereum-deep-dive',
      platform: 'Podcast',
      contentType: 'podcast',
      creator: 'Vitalik Buterin',
      duration: '45:30',
      views: 8935,
      likes: 654,
      accuracy: 97,
      tags: ['Ethereum', 'Proof of Stake', 'Scaling'],
      themes: ['Blockchain Technology', 'Technical Architecture'],
      credibilityScore: 98,
      processingStatus: 'completed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      summary: 'In-depth technical discussion about Ethereum 2.0 improvements, including proof-of-stake consensus, sharding, and scalability enhancements.',
      keyInsights: ['Proof-of-stake reduces energy consumption by 99.9%', 'Sharding enables parallel transaction processing'],
    },
    {
      id: 'featured_3',
      title: 'Building Wealth in the Digital Age',
      originalUrl: 'https://youtube.com/watch?v=wealth-digital',
      platform: 'YouTube', 
      contentType: 'video',
      creator: 'Tim Ferriss',
      duration: '32:18',
      views: 12650,
      likes: 743,
      accuracy: 89,
      tags: ['Wealth Building', 'Digital Economy', 'Investment'],
      themes: ['Financial Strategy', 'Digital Assets'],
      credibilityScore: 87,
      processingStatus: 'completed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      summary: 'Strategic insights on wealth creation in the digital economy, covering cryptocurrency, digital assets, and modern investment approaches.',
      keyInsights: ['Digital assets represent a new asset class with unique properties', 'Technology enables new forms of value creation'],
    }
  ]);

  // Combine real summaries with featured content
  const combinedSummaries = useMemo(() => {
    return [...featuredContent, ...allSummaries];
  }, [allSummaries]);

  // Filter and search logic
  const filteredSummaries = useMemo(() => {
    let results = combinedSummaries;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(summary => 
        summary.title?.toLowerCase().includes(query) ||
        summary.summary?.toLowerCase().includes(query) ||
        summary.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
        summary.themes?.some((theme: string) => theme.toLowerCase().includes(query)) ||
        summary.creator?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.platform !== 'all') {
      results = results.filter(summary => summary.platform === filters.platform);
    }
    
    if (filters.contentType !== 'all') {
      results = results.filter(summary => summary.contentType === filters.contentType);
    }
    
    if (filters.status !== 'all') {
      results = results.filter(summary => summary.processingStatus === filters.status);
    }

    if (filters.minAccuracy > 0) {
      results = results.filter(summary => (summary.accuracy || 0) >= filters.minAccuracy);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'accuracy':
        results.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
        break;
      case 'views':
        results.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return results;
  }, [combinedSummaries, searchQuery, filters]);

  // Tab filtering
  const tabFilteredSummaries = useMemo(() => {
    switch (selectedTab) {
      case 'videos':
        return filteredSummaries.filter(s => s.contentType === 'video');
      case 'podcasts':
        return filteredSummaries.filter(s => s.contentType === 'podcast');
      case 'livestreams':
        return filteredSummaries.filter(s => s.contentType === 'livestream');
      case 'featured':
        return featuredContent.filter(s => 
          !searchQuery.trim() || 
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return filteredSummaries;
    }
  }, [filteredSummaries, selectedTab, searchQuery]);

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      case 'livestream': return <Radio className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'processing': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'pending': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'failed': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-gray-300 mb-6">Please log in to browse the content library</p>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-2"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Content Library
                </h1>
                <p className="text-gray-300 text-sm lg:text-base">
                  Explore {combinedSummaries.length} AI-processed summaries and insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white/5 border border-white/20 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by title, content, creator, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
              data-testid="input-search"
            />
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Platform</label>
                        <Select value={filters.platform} onValueChange={(value) => setFilters({...filters, platform: value})}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Platforms</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                            <SelectItem value="Podcast">Podcast</SelectItem>
                            <SelectItem value="Twitter">Twitter</SelectItem>
                            <SelectItem value="Twitch">Twitch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Content Type</label>
                        <Select value={filters.contentType} onValueChange={(value) => setFilters({...filters, contentType: value})}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                            <SelectItem value="podcast">Podcasts</SelectItem>
                            <SelectItem value="livestream">Livestreams</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Status</label>
                        <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Sort By</label>
                        <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="accuracy">Accuracy</SelectItem>
                            <SelectItem value="views">Views</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Min Accuracy (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={filters.minAccuracy}
                          onChange={(e) => setFilters({...filters, minAccuracy: parseInt(e.target.value) || 0})}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => setFilters({
                            platform: 'all',
                            contentType: 'all', 
                            status: 'all',
                            dateRange: 'all',
                            sortBy: 'newest',
                            minAccuracy: 0
                          })}
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/20 mb-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/30">
                <FileText className="h-4 w-4 mr-2" />
                All ({filteredSummaries.length})
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-purple-500/30">
                <Sparkles className="h-4 w-4 mr-2" />
                Featured
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-purple-500/30">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="podcasts" className="data-[state=active]:bg-purple-500/30">
                <Headphones className="h-4 w-4 mr-2" />
                Podcasts
              </TabsTrigger>
              <TabsTrigger value="livestreams" className="data-[state=active]:bg-purple-500/30">
                <Radio className="h-4 w-4 mr-2" />
                Live
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <ContentGrid 
                summaries={tabFilteredSummaries} 
                viewMode={viewMode} 
                isLoading={summariesLoading}
                getContentIcon={getContentIcon}
                getStatusColor={getStatusColor}
                setLocation={setLocation}
              />
            </TabsContent>

            <TabsContent value="featured" className="space-y-6">
              <ContentGrid 
                summaries={tabFilteredSummaries} 
                viewMode={viewMode} 
                isLoading={false}
                getContentIcon={getContentIcon}
                getStatusColor={getStatusColor}
                setLocation={setLocation}
                featured={true}
              />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <ContentGrid 
                summaries={tabFilteredSummaries} 
                viewMode={viewMode} 
                isLoading={summariesLoading}
                getContentIcon={getContentIcon}
                getStatusColor={getStatusColor}
                setLocation={setLocation}
              />
            </TabsContent>

            <TabsContent value="podcasts" className="space-y-6">
              <ContentGrid 
                summaries={tabFilteredSummaries} 
                viewMode={viewMode} 
                isLoading={summariesLoading}
                getContentIcon={getContentIcon}
                getStatusColor={getStatusColor}
                setLocation={setLocation}
              />
            </TabsContent>

            <TabsContent value="livestreams" className="space-y-6">
              <ContentGrid 
                summaries={tabFilteredSummaries} 
                viewMode={viewMode} 
                isLoading={summariesLoading}
                getContentIcon={getContentIcon}
                getStatusColor={getStatusColor}
                setLocation={setLocation}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

// Content Grid Component
interface ContentGridProps {
  summaries: Summary[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  getContentIcon: (contentType: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  setLocation: (path: string) => void;
  featured?: boolean;
}

function ContentGrid({ summaries, viewMode, isLoading, getContentIcon, getStatusColor, setLocation, featured = false }: ContentGridProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="text-gray-300">Loading content library...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
          <p className="text-gray-300 mb-6">Try adjusting your search or filters to find more content</p>
          <Button 
            onClick={() => setLocation('/create-summary')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            Process New Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {summaries.map((summary, index) => (
          <motion.div
            key={summary.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg hover:bg-white/15 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      {getContentIcon(summary.contentType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {summary.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {summary.creator && `${summary.creator} • `}{summary.platform} • {summary.duration || 'Duration unknown'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {summary.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {summary.views.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(summary.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {summary.accuracy && (
                      <div className="text-center">
                        <div className="text-sm font-semibold text-green-400">{summary.accuracy}%</div>
                        <div className="text-xs text-gray-400">Accuracy</div>
                      </div>
                    )}
                    
                    <Badge variant="outline" className={getStatusColor(summary.processingStatus)}>
                      {summary.processingStatus}
                    </Badge>
                    
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => setLocation(`/results/${summary.id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {summaries.map((summary, index) => (
        <motion.div
          key={summary.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="group"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg hover:bg-white/15 transition-all duration-200 cursor-pointer h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                  {getContentIcon(summary.contentType)}
                </div>
                
                {featured && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors mb-3 line-clamp-2">
                {summary.title}
              </h3>
              
              {summary.summary && (
                <p className="text-sm text-gray-300 mb-4 line-clamp-3 flex-1">
                  {summary.summary}
                </p>
              )}
              
              <div className="space-y-3 mt-auto">
                {summary.accuracy && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">AI Accuracy</span>
                      <span className="text-white font-semibold">{summary.accuracy}%</span>
                    </div>
                    <Progress value={summary.accuracy} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{summary.platform}</span>
                  <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {summary.tags?.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-gray-500/20 text-gray-300">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Badge variant="outline" className={getStatusColor(summary.processingStatus)}>
                    {summary.processingStatus}
                  </Badge>
                </div>
                
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={() => setLocation(`/results/${summary.id}`)}
                  data-testid={`button-view-${summary.id}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}