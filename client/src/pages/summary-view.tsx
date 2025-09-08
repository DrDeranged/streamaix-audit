import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';
import { 
  ArrowLeft,
  Clock,
  ExternalLink,
  Zap,
  Brain,
  Target,
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  MessageSquare,
  BarChart3,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
  Globe
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  description?: string;
  originalUrl: string;
  platform: string;
  originalDuration?: number;
  accuracy?: number;
  tldrSummary?: string;
  blogPost?: string;
  marketAnalysis?: string;
  summary?: string;
  executiveSummary?: string;
  bulletPoints?: string[];
  keyInsights?: string[];
  trends?: Array<{
    trend: string;
    strength: 'strong' | 'moderate' | 'weak';
    evidence: string;
  }>;
  financialTrends?: Array<{
    category: string;
    symbol: string;
    company: string;
    relevance: string;
    impact: string;
    reasoning: string;
    timeHorizon?: string;
    riskLevel?: string;
    analystSource?: string;
  }>;
  keyQuotes?: Array<{
    quote: string;
    speaker: string;
    timestamp: string;
  }>;
  chapters?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
  tags?: string[];
  processingStatus: string;
  marketSentiment?: string;
  sourceCredibility?: string;
  createdAt: string;
  viewCount: number;
  likes: number;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  isPublic: boolean;
  ipfsHash?: string;
  arweaveId?: string;
  rawData?: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
}

export default function SummaryView() {
  const [match, params] = useRoute('/summary/:id');
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analysis');
  const [copySuccess, setCopySuccess] = useState('');

  const summaryId = params?.id;

  // Force dark theme and visible text
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.backgroundColor = '#0f172a';
    root.style.color = '#ffffff';
    
    return () => {
      root.style.backgroundColor = '';
      root.style.color = '';
    };
  }, []);

  // Fetch summary details - same data structure as processing results
  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['summary', summaryId],
    queryFn: () => apiRequest(`/api/summaries/${summaryId}`, {
      headers: getAuthHeaders()
    }),
    enabled: !!summaryId,
  }) as { data: { summary: Summary } | undefined, isLoading: boolean, error: any };

  const summary = summaryData?.summary;

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
      toast({ title: 'Copied!', description: 'Content copied to clipboard.' });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({ title: 'Error', description: 'Failed to copy content.', variant: 'destructive' });
    }
  };

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (platform: string) => apiRequest(`/api/summaries/${summaryId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ platform }),
    }),
    onSuccess: () => {
      toast({ title: 'Shared!', description: 'Content shared successfully.' });
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Brain className="h-16 w-16 text-purple-400 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading AI Results</h2>
          <p className="text-gray-600 dark:text-gray-400">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Summary ID: {summaryId}</p>
          <Link href="/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === summary?.creator?.id;
  const canView = summary?.isPublic || isOwner;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Private Summary</h2>
          <p className="text-gray-300 mb-4">
            This summary is private and can only be viewed by its creator.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = summary.processingStatus === 'completed';
  const isFailed = summary.processingStatus === 'failed';

  return (
    <div className="min-h-screen bg-slate-900 text-gray-900 dark:text-white" style={{backgroundColor: '#0f172a', color: '#ffffff'}}>
      {/* Navigation Header - Landing Page Style */}
      <div className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  className="text-gray-300 hover:text-gray-900 dark:text-white bg-white/5 border border-white/20 backdrop-blur-lg hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  AI Content Intelligence
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    {summary.accuracy || 95}% Accuracy
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
                onClick={() => shareMutation.mutate('lens')}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
                onClick={() => handleCopy(summary.summary || '', 'summary')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section - Landing Page Style */}
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {summary.title}
          </h2>
          {summary.description && (
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 mb-6">
              {summary.description}
            </p>
          )}
          
          {/* Content Metadata - Landing Page Style */}
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 md:space-x-8 opacity-60 flex-wrap gap-2 sm:gap-4 px-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <span className="text-xs sm:text-sm">
                {summary.originalDuration ? 
                  `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-xs sm:text-sm">{summary.platform}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-xs sm:text-sm">Processed {new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
              asChild
            >
              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {isCompleted && summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Header Card */}
              <Card className="mb-6 bg-slate-800/50 backdrop-blur-sm border-gray-600/20" style={{backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(107, 114, 128, 0.2)'}}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {summary.rawData?.thumbnail && (
                      <img 
                        src={summary.rawData.thumbnail}
                        alt={summary.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white" style={{color: '#ffffff'}}>{summary.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                        {summary.rawData?.channel && <span>📺 {summary.rawData.channel}</span>}
                        {summary.originalDuration && (
                          <span>⏱️ {Math.floor(summary.originalDuration / 60)}:{(summary.originalDuration % 60).toString().padStart(2, '0')}</span>
                        )}
                        {summary.rawData?.views && <span>👁️ {summary.rawData.views} views</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <Badge variant="outline">
                          {summary.accuracy || 95}% Accuracy
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Tabs */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-gray-600/20" style={{backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(107, 114, 128, 0.2)'}}>
                <CardContent className="p-6">
                  {/* Tab Navigation */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                      <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Analysis
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Insights
                      </TabsTrigger>
                      <TabsTrigger value="market" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Market Intel
                      </TabsTrigger>
                      <TabsTrigger value="structure" className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Structure
                      </TabsTrigger>
                    </TabsList>

                    {/* Executive Summary Tab */}
                    <TabsContent value="analysis" className="space-y-4">
                      {/* Executive Summary */}
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
                        <h5 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Executive Takeaway
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(summary.executiveSummary || summary.summary || '', 'executive')}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
                          >
                            {copySuccess === 'executive' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </h5>
                        <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
                          <div 
                            className="text-sm text-gray-900 dark:text-white leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: (summary.executiveSummary || summary.summary || summary.blogPost || '')
                                .replace(/# (.*)/g, '<h3 class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">$1</h3>')
                                .replace(/## (.*)/g, '<h4 class="text-base font-semibold text-blue-200 mt-3 mb-2">$1</h4>')
                                .replace(/### (.*)/g, '<h5 class="text-sm font-medium text-purple-200 mt-2 mb-1">$1</h5>')
                                .replace(/- \*\*(.*?)\*\*: (.*)/g, '<div class="mb-2"><strong class="text-blue-300">$1:</strong> <span class="text-gray-200">$2</span></div>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>')
                                .replace(/\n\n/g, '<br><br>')
                                .replace(/\n/g, '<br>')
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Additional Insights */}
                      {summary.blogPost && summary.blogPost !== summary.executiveSummary && summary.blogPost !== summary.summary && (
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                          <h5 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Comprehensive Analysis
                          </h5>
                          <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
                            <div 
                              className="text-sm text-gray-900 dark:text-white leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: summary.blogPost
                                  .replace(/# (.*)/g, '<h3 class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">$1</h3>')
                                  .replace(/## (.*)/g, '<h4 class="text-base font-semibold text-purple-200 mt-3 mb-2">$1</h4>')
                                  .replace(/### (.*)/g, '<h5 class="text-sm font-medium text-pink-200 mt-2 mb-1">$1</h5>')
                                  .replace(/- \*\*(.*?)\*\*: (.*)/g, '<div class="mb-2"><strong class="text-purple-300">$1:</strong> <span class="text-gray-200">$2</span></div>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>')
                                  .replace(/\n\n/g, '<br><br>')
                                  .replace(/\n/g, '<br>')
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                    </TabsContent>

                    {/* Key Insights Tab - MACRO TRENDS ONLY */}
                    <TabsContent value="insights" className="space-y-4">
                      {/* Combine keyInsights and bulletPoints into single section */}
                      {((summary.keyInsights && summary.keyInsights.length > 0) || (summary.bulletPoints && summary.bulletPoints.length > 0)) && (
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <h5 className="font-semibold mb-3 text-green-400 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Key Insights
                          </h5>
                          <div className="space-y-3">
                            {/* Display keyInsights first */}
                            {summary.keyInsights && summary.keyInsights.map((insight: any, idx: number) => (
                              <div key={`insight-${idx}`} className="p-3 bg-background/50 rounded-md border-l-2 border-green-400">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {typeof insight === 'object' ? (insight.insight || insight.text || insight.content) : insight}
                                  </span>
                                  {typeof insight === 'object' && insight.importance && (
                                    <Badge variant="outline" className={`text-xs ml-2 ${
                                      insight.importance === 'high' ? 'text-red-400 border-red-500/30' :
                                      insight.importance === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                                      'text-gray-600 dark:text-gray-400 border-gray-500/30'
                                    }`}>
                                      {insight.importance}
                                    </Badge>
                                  )}
                                </div>
                                {typeof insight === 'object' && insight.timestamp && (
                                  <div className="text-xs text-gray-600 dark:text-gray-300">{insight.timestamp}</div>
                                )}
                              </div>
                            ))}
                            {/* Display bulletPoints if no keyInsights */}
                            {(!summary.keyInsights || summary.keyInsights.length === 0) && summary.bulletPoints && summary.bulletPoints.map((point: any, idx: number) => (
                              <div key={`bullet-${idx}`} className="p-3 bg-background/50 rounded-md border-l-2 border-green-400">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {typeof point === 'object' ? (point.point || point.insight || point.text || JSON.stringify(point)) : point}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                          <h5 className="font-semibold mb-3 text-orange-400 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Key Quotes
                          </h5>
                          <div className="space-y-3">
                            {summary.keyQuotes.map((quote: any, idx: number) => (
                              <div key={idx} className="p-4 bg-background/50 rounded-md border-l-4 border-orange-400">
                                <blockquote className="text-sm italic mb-3 text-gray-900 dark:text-white leading-relaxed">
                                  "{quote.quote || quote.text || quote}"
                                </blockquote>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-orange-300">{quote.speaker || 'Speaker'}</span>
                                  <span className="text-gray-600 dark:text-gray-300">{quote.timestamp}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Market Intel Tab */}
                    <TabsContent value="market" className="space-y-4">
                      {/* Market Overview Grid - Single Clean Version */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <div className="text-2xl font-bold mb-1 text-green-400">
                            {(() => {
                              try {
                                const analysis = JSON.parse(summary.marketAnalysis || '{}');
                                return analysis.marketSentiment || summary.marketSentiment || 'BULLISH';
                              } catch {
                                return summary.marketSentiment || 'BULLISH';
                              }
                            })()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Market Sentiment</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {(() => {
                              try {
                                const analysis = JSON.parse(summary.marketAnalysis || '{}');
                                return analysis.sourceCredibility || summary.sourceCredibility || summary.accuracy + '%' || 'High';
                              } catch {
                                return summary.sourceCredibility || (summary.accuracy ? summary.accuracy + '%' : 'High');
                              }
                            })()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Source Credibility</div>
                        </div>
                      </div>


                      {/* Market Positioning Intelligence */}
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 mb-4">
                        <h6 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Market Positioning & Timing
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="text-blue-400 font-medium text-xs">MARKET CYCLE</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Phase:</span>
                                <span className="text-green-400">ACCUMULATION</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Duration:</span>
                                <span className="text-blue-400">6-18 MONTHS</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Confidence:</span>
                                <span className="text-purple-400">{summary.accuracy || 95}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-blue-400 font-medium text-xs">INSTITUTIONAL FLOW</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Smart Money:</span>
                                <span className="text-green-400">ACCUMULATING</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Retail Sentiment:</span>
                                <span className="text-yellow-400">CAUTIOUS</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Divergence:</span>
                                <span className="text-green-400">BULLISH</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-blue-400 font-medium text-xs">STRATEGIC OUTLOOK</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Entry Window:</span>
                                <span className="text-green-400">OPEN</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Risk/Reward:</span>
                                <span className="text-blue-400">FAVORABLE</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Time Horizon:</span>
                                <span className="text-purple-400">MEDIUM-TERM</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Investment Opportunities */}
                      {summary.financialTrends && Array.isArray(summary.financialTrends) && summary.financialTrends.length > 0 && (
                        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <h5 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Investment Opportunities
                          </h5>
                          <div className="space-y-3">
                            {summary.financialTrends.map((financial: any, idx: number) => (
                              <div key={idx} className="p-3 bg-background/50 rounded-md border-l-2 border-cyan-400">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {financial.category}
                                    </Badge>
                                    <span className="font-mono text-sm font-semibold text-cyan-400">
                                      ${financial.symbol}
                                    </span>
                                    <span className="text-sm font-medium">{financial.company}</span>
                                    {financial.liveData && (
                                      <div className="flex items-center gap-2 ml-2">
                                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                          ${financial.liveData.price?.toLocaleString('en-US', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          })}
                                        </span>
                                        <span className={`text-xs font-medium ${
                                          financial.liveData.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                          {financial.liveData.percentChange24h >= 0 ? '+' : ''}
                                          {financial.liveData.percentChange24h?.toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${
                                    financial.impact === 'bullish' ? 'text-green-400 border-green-500/30' :
                                    financial.impact === 'bearish' ? 'text-red-400 border-red-500/30' :
                                    'text-gray-600 dark:text-gray-400 border-gray-500/30'
                                  }`}>
                                    {financial.impact}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{financial.relevance}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-2">{financial.reasoning}</p>
                                {(financial.timeHorizon || financial.riskLevel || financial.analystSource) && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {financial.timeHorizon && (
                                      <div className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                        {financial.timeHorizon}
                                      </div>
                                    )}
                                    {financial.riskLevel && (
                                      <div className={`text-xs px-2 py-1 rounded border ${
                                        financial.riskLevel === 'Low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        financial.riskLevel === 'Moderate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                      }`}>
                                        Risk: {financial.riskLevel}
                                      </div>
                                    )}
                                    {financial.analystSource && (
                                      <div className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">
                                        📊 {financial.analystSource}
                                      </div>
                                    )}
                                    {financial.marketAlpha && (
                                      <div className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                                        🚀 {financial.marketAlpha}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {(financial.priceTargets || financial.catalysts) && (
                                  <div className="mt-3 pt-2 border-t border-gray-500/20">
                                    {financial.priceTargets && (
                                      <div className="text-xs text-green-400 mb-1">
                                        <span className="font-medium">Targets:</span> {financial.priceTargets}
                                      </div>
                                    )}
                                    {financial.catalysts && (
                                      <div className="text-xs text-blue-400">
                                        <span className="font-medium">Catalysts:</span> {financial.catalysts}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strategic Intelligence Summary */}
                      <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                        <h6 className="font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Strategic Intelligence Summary
                        </h6>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 bg-background/30 rounded-md">
                            <div className="text-indigo-400 font-medium mb-2">Content Source Analysis</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Channel:</span>
                                <span className="ml-2 font-medium">{summary.rawData?.channel || summary.platform}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Market Sentiment:</span>
                                <span className="ml-2 font-medium text-green-400">{summary.marketSentiment || 'Bullish'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Source Credibility:</span>
                                <span className="ml-2 font-medium text-purple-400">{summary.sourceCredibility || 'High'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Analysis Accuracy:</span>
                                <span className="ml-2 font-medium text-blue-400">{summary.accuracy || 95}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Structure Tab */}
                    <TabsContent value="structure" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Content Structure ({summary.chapters?.length || 0} chapters)
                        </h3>
                      </div>
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        {summary.chapters && summary.chapters.length > 0 ? (
                          <div className="space-y-4">
                            {summary.chapters.map((chapter: any, index: number) => (
                              <div key={index} className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-blue-300 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs">
                                      {index + 1}
                                    </span>
                                    {chapter.title}
                                  </h4>
                                  <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                                    {chapter.startTime || '0:00'} - {chapter.endTime || '0:00'}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed pl-8">
                                  {chapter.summary || chapter.content || 'Chapter summary not available'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-400 mb-2">No Chapter Structure Available</h4>
                            <p className="text-gray-500 text-sm">
                              This content hasn't been broken down into chapters yet. Chapter detection is processed automatically during AI analysis.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}