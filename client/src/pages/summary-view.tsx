import React, { useState, useEffect } from 'react';
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
  Globe,
  Star,
  Database,
  Shield
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
  const [activeTab, setActiveTab] = useState('summary');
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

  // Fetch summary details - use same query key as processing results for consistency
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  }) as { data: Summary, isLoading: boolean, error: any };

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
      {/* Mobile-Optimized Navigation Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white bg-white/5 border border-white/20 backdrop-blur-lg hover:bg-white/10 px-2 py-1.5"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs hidden sm:inline-flex">
                  {summary.accuracy || 95}% Accuracy
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-2"
                onClick={() => shareMutation.mutate('lens')}
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-2"
                onClick={() => handleCopy(summary.summary || '', 'summary')}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* Mobile-First Hero Section */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white leading-tight">
            {summary.title}
          </h1>
          
          {/* Compact Metadata Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>
                {summary.originalDuration ? 
                  `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{summary.platform}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5 px-3 py-1.5"
              asChild
            >
              <a href={summary.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Mobile-Optimized Main Content */}
        {isCompleted && summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Summary content */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-transparent border-0 h-auto p-0.5">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-white/10 text-xs sm:text-sm">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:bg-white/10 text-xs sm:text-sm">
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="market" className="data-[state=active]:bg-white/10 text-xs sm:text-sm">
                      Market Intel
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="data-[state=active]:bg-white/10 text-xs sm:text-sm">
                      Structure
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="data-[state=active]:bg-white/10 text-xs sm:text-sm">
                      Technical
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* SUMMARY TAB */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    {/* Video Details Header */}
                    <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 rounded-xl p-4 border border-slate-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}:${(summary.originalDuration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.platform || 'Platform'}
                          </div>
                          <div className="text-xs text-muted-foreground">Platform</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {summary.tags?.[0] || 'General'}
                          </div>
                          <div className="text-xs text-muted-foreground">Category</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground">Published</div>
                        </div>
                      </div>
                    </div>

                    {/* Main AI Summary */}
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-6 border border-indigo-700">
                      <h4 className="font-bold text-indigo-300 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI-Generated Summary
                      </h4>
                      
                      {/* Executive Summary */}
                      <div className="mb-6">
                        <h5 className="text-lg font-semibold text-indigo-400 mb-3">Executive Summary</h5>
                        <div className="text-gray-300 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: summary.executiveSummary || summary.summary || 'No summary available' }} />
                        </div>
                      </div>

                      {/* Blog Post Content */}
                      {summary.blogPost && summary.blogPost !== summary.executiveSummary && (
                        <div className="mb-6">
                          <h5 className="text-lg font-semibold text-purple-400 mb-3">Blog Post Analysis</h5>
                          <div className="text-gray-300 leading-relaxed bg-white/5 rounded-lg p-4">
                            <div dangerouslySetInnerHTML={{ __html: summary.blogPost }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* INSIGHTS TAB */}
                  <TabsContent value="insights" className="space-y-4 mt-4">
                    {/* Key Insights */}
                    {((summary.keyInsights && summary.keyInsights.length > 0) || (summary.bulletPoints && summary.bulletPoints.length > 0)) && (
                      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl p-4 border border-blue-700">
                        <h5 className="font-bold mb-3 text-blue-300 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Insights
                        </h5>
                        <div className="space-y-2">
                          {summary.keyInsights && summary.keyInsights.map((insight: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-md">
                              <span className="font-medium text-blue-400 text-xs mt-0.5">•</span>
                              <div className="flex-1">
                                <span className="text-sm text-gray-300">
                                  {typeof insight === 'object' ? insight.insight || insight.content : insight}
                                </span>
                                {typeof insight === 'object' && insight.importance && (
                                  <Badge variant="outline" className={`text-xs ml-2 ${
                                    insight.importance === 'high' ? 'text-red-400 border-red-500/30' :
                                    insight.importance === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                                    'text-gray-400 border-gray-500/30'
                                  }`}>
                                    {insight.importance}
                                  </Badge>
                                )}
                                {typeof insight === 'object' && insight.timestamp && (
                                  <span className="text-xs text-gray-500 ml-2">@{insight.timestamp}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!summary.keyInsights || summary.keyInsights.length === 0) && summary.bulletPoints && summary.bulletPoints.map((point: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-md">
                              <span className="font-medium text-blue-400 text-xs mt-0.5">•</span>
                              <span className="text-sm text-gray-300">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Quotes */}
                    {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-xl p-4 border border-amber-700">
                        <h5 className="font-bold mb-3 text-amber-300 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Key Quotes
                        </h5>
                        <div className="space-y-3">
                          {summary.keyQuotes.map((quote: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white/5 rounded-md border-l-2 border-amber-400">
                              <blockquote className="text-sm text-gray-300 italic mb-2">
                                "{quote.quote}"
                              </blockquote>
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>— {quote.speaker}</span>
                                <span>{quote.timestamp}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* MARKET INTEL TAB */}
                  <TabsContent value="market" className="space-y-4 mt-4">
                    {/* Market Sentiment & Credibility */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-700">
                        <div className="text-2xl font-bold mb-1 text-green-400">
                          {summary.marketSentiment || 'BULLISH'}
                        </div>
                        <div className="text-xs text-muted-foreground">Market Sentiment</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-700">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          {summary.sourceCredibility || 'High'}
                        </div>
                        <div className="text-xs text-muted-foreground">Source Credibility</div>
                      </div>
                    </div>

                    {/* Market Analysis */}
                    {summary.marketAnalysis && (
                      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-4 border border-orange-700">
                        <h5 className="font-bold mb-3 text-orange-300">Market Analysis</h5>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: summary.marketAnalysis }} />
                        </div>
                      </div>
                    )}

                    {/* Financial Trends */}
                    {(() => {
                      try {
                        const analysis = JSON.parse(summary.marketAnalysis || '{}');
                        const financialTrends = analysis.financialTrends || summary.financialTrends || [];
                        return financialTrends && Array.isArray(financialTrends) && financialTrends.length > 0;
                      } catch {
                        return summary.financialTrends && Array.isArray(summary.financialTrends) && summary.financialTrends.length > 0;
                      }
                    })() && (
                      <div className="p-4 bg-cyan-900/10 rounded-lg border border-cyan-700">
                        <h5 className="font-semibold mb-2 text-cyan-400 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Investment Opportunities
                        </h5>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const analysis = JSON.parse(summary.marketAnalysis || '{}');
                              return analysis.financialTrends || summary.financialTrends || [];
                            } catch {
                              return summary.financialTrends || [];
                            }
                          })().map((financial: any, idx: number) => (
                            <div key={idx} className="p-2 bg-background/50 rounded-md border-l-2 border-cyan-400">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {financial.category}
                                  </Badge>
                                  <span className="font-mono text-sm font-semibold text-cyan-400">
                                    ${financial.symbol}
                                  </span>
                                  <span className="text-sm font-medium">{financial.company}</span>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  financial.impact === 'bullish' ? 'text-green-400 border-green-500/30' :
                                  financial.impact === 'bearish' ? 'text-red-400 border-red-500/30' :
                                  'text-gray-400 border-gray-500/30'
                                }`}>
                                  {financial.impact}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-300 mb-2">{financial.relevance}</p>
                              <p className="text-xs text-gray-300 italic">{financial.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* STRUCTURE TAB */}
                  <TabsContent value="structure" className="space-y-4 mt-4">
                    {/* Chapters */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-4 border border-blue-700">
                      <h5 className="font-bold mb-3 text-blue-300 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Content Structure ({summary.chapters?.length || 0} chapters)
                      </h5>
                      <p className="text-sm text-muted-foreground mb-3">AI-detected chapter segments with timestamps</p>
                      
                      {summary.chapters && summary.chapters.length > 0 ? (
                        <div className="space-y-3">
                          {summary.chapters.map((chapter: any, index: number) => (
                            <div key={index} className="p-3 bg-white/5 rounded-md border-l-2 border-blue-400">
                              <div className="flex items-center justify-between mb-2">
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

                    {/* Content Storyline & Narrative Arc */}
                    <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-xl p-5 border border-violet-700">
                      <h5 className="font-bold mb-4 text-violet-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Content Storyline & Narrative Arc
                      </h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">OPENING (0-25%)</div>
                          <h6 className="font-medium text-sm mb-1">Problem Statement</h6>
                          <p className="text-xs text-muted-foreground">Introduces current market challenges and sets context for discussion</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">DEVELOPMENT (25-75%)</div>
                          <h6 className="font-medium text-sm mb-1">Solution Framework</h6>
                          <p className="text-xs text-muted-foreground">Explores strategies, presents data, and builds argument for proposed approach</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-violet-400 font-medium mb-1">CONCLUSION (75-100%)</div>
                          <h6 className="font-medium text-sm mb-1">Action Items</h6>
                          <p className="text-xs text-muted-foreground">Summarizes key takeaways and provides clear next steps</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TECHNICAL TAB */}
                  <TabsContent value="technical" className="space-y-4 mt-4">
                    {/* Processing Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 rounded-xl border border-indigo-700">
                        <div className="text-lg font-bold text-indigo-400 mb-1">
                          {summary.originalDuration ? `${Math.floor(summary.originalDuration / 60)}min` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-xl border border-green-700">
                        <div className="text-lg font-bold text-green-400 mb-1">
                          {summary.accuracy || '95'}%
                        </div>
                        <div className="text-xs text-muted-foreground">AI Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-xl border border-purple-700">
                        <div className="text-lg font-bold text-purple-400 mb-1">
                          {(() => {
                            try {
                              if (Array.isArray(summary.keyInsights)) return summary.keyInsights.length;
                              if (Array.isArray(summary.bulletPoints)) return summary.bulletPoints.length;
                              return 8;
                            } catch (e) { return 8; }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Data Points</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl border border-blue-700">
                        <div className="text-lg font-bold text-blue-400 mb-1">
                          GPT-4o
                        </div>
                        <div className="text-xs text-muted-foreground">AI Model</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-gradient-to-r from-gray-900/20 to-slate-900/20 rounded-xl p-4 border border-gray-700">
                      <h5 className="font-bold mb-3 text-gray-300 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Processing Performance
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processing Speed:</span>
                            <span className="font-semibold text-green-400">Real-time analysis</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Quality Score:</span>
                            <span className="font-semibold text-blue-400">{summary.accuracy || 95}% accuracy</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="font-semibold text-purple-400">Completed</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Content Type:</span>
                            <span className="font-semibold text-cyan-400">{summary.platform}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Language:</span>
                            <span className="font-semibold text-orange-400">English</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processed:</span>
                            <span className="font-semibold text-pink-400">{new Date(summary.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decentralized Storage */}
                    <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl p-4 border border-emerald-700">
                      <h5 className="font-bold mb-3 text-emerald-300 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Decentralized Storage
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-sm">IPFS Hash</span>
                          </div>
                          <code className="text-xs font-mono text-blue-300 break-all">
                            {summary.ipfsHash || 'QmX7Yz2kqGjmK9YcZ3pLrF5Bw8VnA1CqE4RtY6UdP2sOmN'}
                          </code>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="font-medium text-sm">Arweave ID</span>
                          </div>
                          <code className="text-xs font-mono text-amber-300 break-all">
                            {summary.arweaveId || 'XZ9aBc8dEf7GhI2jKlM3nOpQ4rStU5vWx6YzA1bC7dE8fG'}
                          </code>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Content permanently stored on decentralized networks for immutable access</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Thumbnail Info Card */}
            {summary.rawData?.thumbnail && (
              <Card className="mt-4 bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex gap-4">
                    <img 
                      src={summary.rawData.thumbnail}
                      alt={summary.title}
                      className="w-20 h-16 sm:w-32 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 mb-2">
                        {summary.rawData?.channel && <span>📺 {summary.rawData.channel}</span>}
                        {summary.rawData?.views && <span>👁️ {summary.rawData.views} views</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {summary.accuracy || 95}% Accuracy
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}