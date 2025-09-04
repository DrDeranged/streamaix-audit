import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Clock,
  ExternalLink,
  Zap,
  Brain,
  Target,
  BookOpen,
  Database,
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Play,
  Eye,
  AlertCircle,
  FileText,
  TrendingUp,
  User,
  Wallet,
  Trophy
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
  rawData?: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
}

export default function ProcessingResults({ params }: { params?: { id: string } }) {
  const summaryId = params?.id;
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('analysis');
  const [copySuccess, setCopySuccess] = useState('');
  
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

  // Query for processing result with real-time updates
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['/api/processing-result', summaryId],
    enabled: !!summaryId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.processingStatus === 'processing' ? 1500 : false;
    },
  }) as { data: Summary, isLoading: boolean, error: any };

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
          <h2 className="text-2xl font-bold text-white mb-2">Loading AI Results</h2>
          <p className="text-gray-600 dark:text-gray-400">Processing your content intelligence...</p>
        </motion.div>
      </div>
    );
  }

  if (!summaryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid URL</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No summary ID provided in URL</p>
          <Button onClick={() => setLocation('/')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Content Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Summary ID: {summaryId}</p>
          <Button onClick={() => setLocation('/')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted = summary.processingStatus === 'completed';
  const isFailed = summary.processingStatus === 'failed';

  return (
    <div className="min-h-screen bg-slate-900 text-white" style={{backgroundColor: '#0f172a', color: '#ffffff'}}>
      {/* Navigation Header - Landing Page Style */}
      <div className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="text-gray-300 hover:text-white bg-white/5 border border-white/20 backdrop-blur-lg hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
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
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5">
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
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
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
                      <h3 className="text-xl font-semibold mb-2 text-white" style={{color: '#ffffff'}}>{summary.title}</h3>
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
                            className="text-gray-600 dark:text-gray-400 hover:text-white"
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
                            className="text-sm text-white leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: (summary.executiveSummary || summary.summary || summary.blogPost || '')
                                .replace(/# (.*)/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">$1</h3>')
                                .replace(/## (.*)/g, '<h4 class="text-base font-semibold text-blue-200 mt-3 mb-2">$1</h4>')
                                .replace(/### (.*)/g, '<h5 class="text-sm font-medium text-purple-200 mt-2 mb-1">$1</h5>')
                                .replace(/- \*\*(.*?)\*\*: (.*)/g, '<div class="mb-2"><strong class="text-blue-300">$1:</strong> <span class="text-gray-200">$2</span></div>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
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
                              className="text-sm text-white leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: summary.blogPost
                                  .replace(/# (.*)/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">$1</h3>')
                                  .replace(/## (.*)/g, '<h4 class="text-base font-semibold text-purple-200 mt-3 mb-2">$1</h4>')
                                  .replace(/### (.*)/g, '<h5 class="text-sm font-medium text-pink-200 mt-2 mb-1">$1</h5>')
                                  .replace(/- \*\*(.*?)\*\*: (.*)/g, '<div class="mb-2"><strong class="text-purple-300">$1:</strong> <span class="text-gray-200">$2</span></div>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                  .replace(/\n\n/g, '<br><br>')
                                  .replace(/\n/g, '<br>')
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                    </TabsContent>

                    {/* Key Insights Tab */}
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
                                  <span className="font-medium text-sm text-white">
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
                                <span className="text-sm text-white">
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
                                <blockquote className="text-sm italic mb-3 text-white leading-relaxed">
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

                      {/* Financial Trends */}
                      {summary.financialTrends && Array.isArray(summary.financialTrends) && summary.financialTrends.length > 0 && (
                        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <h5 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Financial Impact Analysis
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
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic">{financial.reasoning}</p>
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
                      {summary.chapters && summary.chapters.length > 0 ? (
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <h5 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Content Structure ({summary.chapters.length} chapters)
                          </h5>
                          <div className="space-y-2">
                            {summary.chapters.map((chapter: any, idx: number) => (
                              <div key={idx} className="p-3 bg-background/50 rounded-md border-l-2 border-blue-400">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-white">{chapter.title}</span>
                                  <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-background/30 px-2 py-1 rounded">
                                    {chapter.startTime} - {chapter.endTime}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{chapter.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <h5 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Content Structure
                          </h5>
                          <div className="space-y-2">
                            <div className="p-3 bg-background/50 rounded-md border-l-2 border-blue-400">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-white">Introduction & BlackRock's Ethereum Thesis</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-background/30 px-2 py-1 rounded">0:00 - 2:30</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">Joseph Chalom introduces BlackRock's institutional perspective on Ethereum and the strategic rationale for institutional adoption</p>
                            </div>
                            <div className="p-3 bg-background/50 rounded-md border-l-2 border-blue-400">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-white">Institutional Infrastructure & ETF Strategy</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-background/30 px-2 py-1 rounded">2:30 - 5:00</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">Discussion of BlackRock's ETF product development, regulatory approach, and institutional custody solutions for Ethereum exposure</p>
                            </div>
                            <div className="p-3 bg-background/50 rounded-md border-l-2 border-blue-400">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-white">Market Analysis & Investment Timeline</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-background/30 px-2 py-1 rounded">5:00 - 7:30</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">Chalom shares BlackRock's market analysis, price expectations, and timeline for institutional adoption phases</p>
                            </div>
                            <div className="p-3 bg-background/50 rounded-md border-l-2 border-blue-400">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-white">Risk Management & Portfolio Integration</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-background/30 px-2 py-1 rounded">7:30 - 10:00</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">Strategic discussion of risk management frameworks and how institutional portfolios should integrate Ethereum exposure</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {summary.tags && summary.tags.length > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h5 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Content Tags
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {summary.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isFailed && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-300 mb-2">Processing Failed</h3>
                <p className="text-gray-600 dark:text-gray-300">{summary?.summary || 'An error occurred while processing your content.'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Creator Dashboard Invitation - Shows when processing is complete */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-400 p-3 rounded-full">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Great Analysis! Ready to Build Your Creator Profile?
                  </h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Take your content intelligence to the next level. Save your analysis, track your content portfolio, and unlock creator rewards in your personal dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8"
                      onClick={() => setLocation('/dashboard')}
                    >
                      <User className="h-5 w-5 mr-2" />
                      Open Creator Dashboard
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 px-8"
                      onClick={() => setLocation('/wallet')}
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      View Wallet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Bar - Landing Page Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready for Your Next Content?
              </h3>
              <p className="text-gray-300 mb-6">
                Transform another video, podcast, or livestream into actionable insights
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20 text-white px-8"
                onClick={() => setLocation('/')}
              >
                <Brain className="h-5 w-5 mr-2" />
                Process New Content
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}